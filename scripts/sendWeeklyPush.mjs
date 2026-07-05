/**
 * Weekly push sender — runs every Thursday 14:00 Israel time (GitHub Actions cron).
 *
 * 1. Computes the upcoming school week (next Sun–Thu).
 * 2. Pulls events from Firestore via the public REST API.
 * 3. Builds two Hebrew summaries: public-only and staff (public + staff).
 * 4. Sends two OneSignal notifications, segmented by the role tag.
 *
 * Reads config from process.env (GitHub Secrets) and falls back to .env.local
 * for local runs.
 */
import { readFileSync, existsSync } from 'fs';

// ── Env loading ────────────────────────────────────────────────────────────────
function loadEnv() {
  if (existsSync('.env.local')) {
    for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#') || !t.includes('=')) continue;
      const idx = t.indexOf('=');
      const k = t.slice(0, idx).trim();
      const v = t.slice(idx + 1).trim();
      if (!(k in process.env)) process.env[k] = v;
    }
  }
}
loadEnv();

const PROJECT_ID   = process.env.VITE_FIREBASE_PROJECT_ID;
const API_KEY      = process.env.VITE_FIREBASE_API_KEY;
const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID || process.env.VITE_ONESIGNAL_APP_ID;
const ONESIGNAL_KEY    = process.env.ONESIGNAL_REST_API_KEY;

const SITE_URL = 'https://loznik-2beb8.web.app?view=digest';

function bail(msg) { console.log(`⏭  ${msg}`); process.exit(0); }

if (!PROJECT_ID || !API_KEY) bail('Missing Firebase config — skipping.');
if (!ONESIGNAL_APP_ID || ONESIGNAL_APP_ID === 'REPLACE_WITH_YOUR_APP_ID') bail('OneSignal App ID not configured — skipping.');
if (!ONESIGNAL_KEY || ONESIGNAL_KEY === 'REPLACE_WITH_YOUR_KEY') bail('OneSignal REST key not configured — skipping.');

// ── Date range: next Sunday → next Thursday (UTC) ───────────────────────────────
const HEB_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

function nextWeekRange() {
  const now = new Date();
  const day = now.getUTCDay(); // 0 = Sunday
  const thisSunday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - day));
  const nextSunday = new Date(thisSunday); nextSunday.setUTCDate(thisSunday.getUTCDate() + 7);
  const nextThursday = new Date(nextSunday); nextThursday.setUTCDate(nextSunday.getUTCDate() + 4);
  return { start: nextSunday, end: nextThursday };
}

const isoDate = (d) => d.toISOString().slice(0, 10);

// ── Fetch events from Firestore REST ────────────────────────────────────────────
async function fetchEvents() {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/events?key=${API_KEY}&pageSize=1000`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Firestore fetch failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const docs = data.documents || [];
  return docs.map((d) => {
    const f = d.fields || {};
    const val = (x) => x ? (x.stringValue ?? x.booleanValue ?? x.integerValue ?? '') : '';
    return {
      title: val(f.title),
      startDateTime: val(f.startDateTime),
      allDay: f.allDay?.booleanValue ?? false,
      visibility: val(f.visibility) || 'public',
    };
  });
}

// ── Build a Hebrew summary for a set of events within the range ─────────────────
function buildSummary(events, range) {
  const startStr = isoDate(range.start);
  const endStr = isoDate(range.end);

  const inRange = events
    .filter((e) => {
      const d = (e.startDateTime || '').slice(0, 10);
      return d >= startStr && d <= endStr;
    })
    .sort((a, b) => a.startDateTime.localeCompare(b.startDateTime));

  if (inRange.length === 0) return 'אין אירועים מיוחדים השבוע 🎉';

  // Group by day
  const byDay = new Map();
  for (const e of inRange) {
    const d = e.startDateTime.slice(0, 10);
    if (!byDay.has(d)) byDay.set(d, []);
    byDay.get(d).push(e.title);
  }

  const lines = [];
  for (const [d, titles] of byDay) {
    const dt = new Date(d + 'T00:00:00Z');
    const dayName = HEB_DAYS[dt.getUTCDay()];
    const dm = `${dt.getUTCDate()}/${dt.getUTCMonth() + 1}`;
    lines.push(`${dayName} ${dm}: ${titles.join(', ')}`);
  }
  return lines.join('\n');
}

// ── Send one OneSignal notification ─────────────────────────────────────────────
async function sendPush(segment, summary) {
  const body = {
    app_id: ONESIGNAL_APP_ID,
    included_segments: [segment],
    headings: { he: 'לוזניק — השבוע הקרוב', en: 'Loznik — This Week' },
    contents: { he: summary, en: summary },
    url: SITE_URL,
  };
  const res = await fetch('https://onesignal.com/api/v1/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Basic ${ONESIGNAL_KEY}`,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`OneSignal (${segment}) failed: ${res.status} ${text}`);
  console.log(`✅ Sent to "${segment}": ${text}`);
}

// ── Main ────────────────────────────────────────────────────────────────────────
(async () => {
  const range = nextWeekRange();
  console.log(`📅 Week: ${isoDate(range.start)} → ${isoDate(range.end)}`);

  const events = await fetchEvents();
  console.log(`Fetched ${events.length} events.`);

  const publicEvents = events.filter((e) => e.visibility === 'public');
  const staffEvents  = events.filter((e) => e.visibility === 'public' || e.visibility === 'staff');

  const publicSummary = buildSummary(publicEvents, range);
  const staffSummary  = buildSummary(staffEvents, range);

  await sendPush('public', publicSummary);
  await sendPush('staff',  staffSummary);

  console.log('Done.');
})().catch((err) => {
  console.error('❌', err);
  process.exit(1);
});
