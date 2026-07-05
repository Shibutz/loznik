/**
 * Firebase Hosting deployer using service account (no firebase login needed)
 * Uses Firebase Hosting REST API v1beta1
 */
import fs from 'fs';
import path from 'path';
import https from 'https';
import crypto from 'crypto';
import { createReadStream } from 'fs';
import { readdir } from 'fs/promises';
import zlib from 'zlib';

const KEY = JSON.parse(fs.readFileSync('./service-account-key.json', 'utf8'));
const SITE_ID = 'loznik-2beb8';
const DIST_DIR = './dist';

// ── JWT / Auth ─────────────────────────────────────────────────────────────
function base64url(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: KEY.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform https://www.googleapis.com/auth/firebase',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };
  const toSign = `${base64url(Buffer.from(JSON.stringify(header)))}.${base64url(Buffer.from(JSON.stringify(payload)))}`;
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(toSign);
  const sig = base64url(sign.sign(KEY.private_key));
  const jwt = `${toSign}.${sig}`;

  const body = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`;
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'oauth2.googleapis.com',
      path: '/token',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) },
    }, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        const json = JSON.parse(data);
        if (json.access_token) resolve(json.access_token);
        else reject(new Error('Token error: ' + data));
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── HTTP helpers ──────────────────────────────────────────────────────────
function httpsRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      const chunks = [];
      res.on('data', d => chunks.push(d));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString();
        if (res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode}: ${text}`));
        } else {
          try { resolve(JSON.parse(text)); } catch { resolve(text); }
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

function uploadFile(uploadUrl, filePath, sha256) {
  return new Promise((resolve, reject) => {
    const url = new URL(uploadUrl);
    const req = https.request({
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream', 'X-Goog-Upload-Protocol': 'raw' },
    }, res => {
      const chunks = [];
      res.on('data', d => chunks.push(d));
      res.on('end', () => {
        if (res.statusCode >= 400) reject(new Error(`Upload HTTP ${res.statusCode}: ${Buffer.concat(chunks).toString()}`));
        else resolve();
      });
    });
    req.on('error', reject);
    createReadStream(filePath).pipe(req);
  });
}

// ── Collect dist files ────────────────────────────────────────────────────
function gzipBuffer(buf) {
  return new Promise((resolve, reject) => {
    zlib.gzip(buf, (err, result) => err ? reject(err) : resolve(result));
  });
}

async function collectFiles(dir, base = '') {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = {};
  for (const e of entries) {
    const rel = base + '/' + e.name;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      Object.assign(files, await collectFiles(full, rel));
    } else {
      const raw = fs.readFileSync(full);
      const gzipped = await gzipBuffer(raw);
      const hash = crypto.createHash('sha256').update(gzipped).digest('hex');
      files[rel] = { path: full, hash, content: gzipped };
    }
  }
  return files;
}

// ── Main deploy ───────────────────────────────────────────────────────────
async function deploy() {
  console.log('🔑 Getting access token...');
  const token = await getAccessToken();
  const auth = `Bearer ${token}`;
  const base = 'firebasehosting.googleapis.com';

  console.log('📁 Collecting dist files...');
  const files = await collectFiles(DIST_DIR);
  console.log(`   Found ${Object.keys(files).length} files`);

  // Build files hash map
  const fileHashes = {};
  for (const [webPath, info] of Object.entries(files)) {
    fileHashes[webPath] = info.hash;
  }

  console.log('🚀 Creating new version...');
  const version = await httpsRequest({
    hostname: base,
    path: `/v1beta1/sites/${SITE_ID}/versions`,
    method: 'POST',
    headers: { Authorization: auth, 'Content-Type': 'application/json' },
  }, {
    config: {
      rewrites: [{ glob: '**', path: '/index.html' }],
    },
  });
  const versionName = version.name;
  console.log(`   Version: ${versionName}`);

  console.log('📤 Determining files to upload...');
  const populate = await httpsRequest({
    hostname: base,
    path: `/v1beta1/${versionName}:populateFiles`,
    method: 'POST',
    headers: { Authorization: auth, 'Content-Type': 'application/json' },
  }, { files: fileHashes });

  const toUpload = populate.uploadRequiredHashes || [];
  const uploadUrl = populate.uploadUrl;
  console.log(`   Need to upload: ${toUpload.length} files`);

  // Upload required files
  for (const hash of toUpload) {
    const fileEntry = Object.values(files).find(f => f.hash === hash);
    if (!fileEntry) { console.warn(`   ⚠ Hash ${hash} not found`); continue; }
    console.log(`   ↑ Uploading ${hash.slice(0, 8)}...`);
    await new Promise((resolve, reject) => {
      const url = new URL(`${uploadUrl}/${hash}`);
      const req = https.request({
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          Authorization: auth,
          'Content-Type': 'application/octet-stream',
          'X-Goog-Upload-Protocol': 'raw',
          'Content-Length': fileEntry.content.length,
        },
      }, res => {
        const chunks = [];
        res.on('data', d => chunks.push(d));
        res.on('end', () => {
          if (res.statusCode >= 400) reject(new Error(`Upload ${res.statusCode}: ${Buffer.concat(chunks).toString()}`));
          else resolve();
        });
      });
      req.on('error', reject);
      req.write(fileEntry.content);
      req.end();
    });
  }

  console.log('✅ Finalizing version...');
  await httpsRequest({
    hostname: base,
    path: `/v1beta1/${versionName}?updateMask=status`,
    method: 'PATCH',
    headers: { Authorization: auth, 'Content-Type': 'application/json' },
  }, { status: 'FINALIZED' });

  console.log('🌐 Creating release...');
  await httpsRequest({
    hostname: base,
    path: `/v1beta1/sites/${SITE_ID}/releases?versionName=${encodeURIComponent(versionName)}`,
    method: 'POST',
    headers: { Authorization: auth, 'Content-Type': 'application/json' },
  }, {});

  console.log('');
  console.log('🎉 Deployed successfully!');
  console.log(`🔗 https://${SITE_ID}.web.app`);
}

deploy().catch(err => { console.error('❌ Deploy failed:', err.message); process.exit(1); });
