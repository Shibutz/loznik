import { onRequest } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

initializeApp();
const db = getFirestore();

const TZ = 'Asia/Jerusalem';

function escapeIcal(str: string): string {
  return (str ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/** Convert an ISO datetime string (UTC) to a local date/time in Jerusalem timezone */
function isoToJerusalem(isoStr: string): { date: string; time: string } {
  const d = new Date(isoStr);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).formatToParts(d);
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? '00';
  return {
    date: `${get('year')}${get('month')}${get('day')}`,
    time: `${get('hour')}${get('minute')}${get('second')}`,
  };
}

/** Add one day to a YYYYMMDD string (for all-day DTEND, exclusive) */
function nextDay(yyyymmdd: string): string {
  const d = new Date(
    `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}T12:00:00Z`
  );
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

/** Fold long iCal lines at 75 octets (RFC 5545) */
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const chunks: string[] = [line.slice(0, 75)];
  let i = 75;
  while (i < line.length) {
    chunks.push(' ' + line.slice(i, i + 74));
    i += 74;
  }
  return chunks.join('\r\n');
}

export const calendar = onRequest(
  { cors: true, region: 'europe-west1' },
  async (req, res) => {
    const layerId  = req.query['layer']      as string | undefined;
    const classId  = req.query['class']      as string | undefined;
    const visParm  = (req.query['visibility'] as string) ?? 'public';

    try {
      let q = db.collection('events').orderBy('startDateTime', 'asc');
      if (visParm === 'public') {
        q = q.where('visibility', '==', 'public') as typeof q;
      }

      const snap = await q.get();

      const filtered = snap.docs
        .map(d => d.data())
        .filter(ev => {
          if (layerId && !(ev['layerIds'] as string[] ?? []).includes(layerId)) return false;
          if (classId && !(ev['classIds'] as string[] ?? []).includes(classId)) return false;
          return true;
        });

      const vevents = filtered.map(ev => {
        const uid         = `${ev['id']}@loznik.web.app`;
        const summary     = escapeIcal(ev['title'] ?? '');
        const description = escapeIcal(ev['description'] ?? '');
        const allDay: boolean = ev['allDay'] ?? false;

        const startLocal = isoToJerusalem(ev['startDateTime']);
        const endLocal   = isoToJerusalem(ev['endDateTime'] ?? ev['startDateTime']);

        const dtstart = allDay
          ? `DTSTART;VALUE=DATE:${startLocal.date}`
          : `DTSTART;TZID=${TZ}:${startLocal.date}T${startLocal.time}`;

        const dtend = allDay
          ? `DTEND;VALUE=DATE:${nextDay(endLocal.date)}`
          : `DTEND;TZID=${TZ}:${endLocal.date}T${endLocal.time}`;

        const dtstamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

        return [
          'BEGIN:VEVENT',
          foldLine(`UID:${uid}`),
          foldLine(dtstart),
          foldLine(dtend),
          foldLine(`SUMMARY:${summary}`),
          description ? foldLine(`DESCRIPTION:${description}`) : null,
          `DTSTAMP:${dtstamp}`,
          'END:VEVENT',
        ].filter(Boolean).join('\r\n');
      }).join('\r\n');

      const calName = 'לוזניק — לוח שנה בית ספרי';

      const ical = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Loznik//School Calendar//HE',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        foldLine(`X-WR-CALNAME:${calName}`),
        `X-WR-TIMEZONE:${TZ}`,
        'X-WR-CALDESC:לוח השנה הבית-ספרי של לוזניק',
        'REFRESH-INTERVAL;VALUE=DURATION:PT1H',
        'X-PUBLISHED-TTL:PT1H',
        vevents,
        'END:VCALENDAR',
      ].join('\r\n');

      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', 'inline; filename="loznik.ics"');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.status(200).send(ical);
    } catch (err) {
      console.error('calendar function error', err);
      res.status(500).send('Internal error');
    }
  }
);
