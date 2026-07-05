import * as XLSX from 'xlsx';
import { Event, Layer, SchoolClass, Category } from '../types';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

// ── Helpers ───────────────────────────────────────────────────────────────────

function isoDate(dt: string): string {
  return dt.slice(0, 10);
}

function fmtDate(dt: string): string {
  try { return format(new Date(dt), 'dd/MM/yyyy', { locale: he }); } catch { return isoDate(dt); }
}

function fmtTime(dt: string, allDay: boolean): string {
  if (allDay) return '';
  try { return format(new Date(dt), 'HH:mm'); } catch { return ''; }
}

function visibilityLabel(v: string | undefined): string {
  if (v === 'staff') return 'צוות';
  if (v === 'admin') return 'מנהל';
  return 'ציבורי';
}

// ── DOM-inject + CSS print ────────────────────────────────────────────────────

function injectAndPrint(html: string): void {
  const existing = document.getElementById('loznik-print-container');
  if (existing) existing.remove();

  const container = document.createElement('div');
  container.id = 'loznik-print-container';
  container.innerHTML = html;
  document.body.appendChild(container);

  setTimeout(() => {
    window.print();
    setTimeout(() => {
      const el = document.getElementById('loznik-print-container');
      if (el) el.remove();
    }, 3000);
  }, 100);
}

// ── PDF: full events list ─────────────────────────────────────────────────────

export function exportToPDF(
  events: Event[],
  layers: Layer[],
  classes: SchoolClass[],
  categories: Category[],
  _filename = 'לוזניק-אירועים'
): void {
  const sorted = [...events].sort((a, b) => a.startDateTime.localeCompare(b.startDateTime));

  const rows = sorted.map((e) => {
    const cat = categories.find((c) => c.id === e.categoryId);
    const layerNames = e.layerIds
      .map((id) => layers.find((l) => l.id === id)?.name ?? '').filter(Boolean).join(', ');
    const classNames = e.classIds
      .map((id) => classes.find((c) => c.id === id)?.displayName ?? '').filter(Boolean).join(', ');
    const startFmt = fmtDate(e.startDateTime);
    const endFmt = isoDate(e.endDateTime) !== isoDate(e.startDateTime)
      ? ' — ' + fmtDate(e.endDateTime) : '';
    const startTime = fmtTime(e.startDateTime, e.allDay);
    const endTime = fmtTime(e.endDateTime, e.allDay);
    const timeFmt = e.allDay ? 'כל היום' : `${startTime}${endTime ? '–' + endTime : ''}`;

    return `<tr>
      <td>${e.title}</td>
      <td>${startFmt}${endFmt}</td>
      <td>${timeFmt}</td>
      <td>${layerNames || '—'}</td>
      <td>${classNames || '—'}</td>
      <td>${cat?.label ?? '—'}</td>
      <td>${visibilityLabel(e.visibility)}</td>
    </tr>`;
  }).join('');

  injectAndPrint(`
    <h1>לוזניק — רשימת אירועים</h1>
    <table>
      <thead><tr>
        <th>שם האירוע</th><th>תאריך</th><th>שעה</th>
        <th>שכבה</th><th>כיתות</th><th>קטגוריה</th><th>נראות</th>
      </tr></thead>
      <tbody>${rows || '<tr><td colspan="7" style="text-align:center;color:#9ca3af;">אין אירועים להצגה</td></tr>'}</tbody>
    </table>
  `);
}

// ── Wall chart: monthly calendar grid ────────────────────────────────────────

export function exportWallChart(
  events: Event[],
  monthDate: Date,
  _layers: Layer[],
  _classes: SchoolClass[],
  categories: Category[]
): void {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const monthName = format(monthDate, 'MMMM yyyy', { locale: he });

  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  const firstDayStr = isoDate(firstDay.toISOString());
  const lastDayStr  = isoDate(lastDay.toISOString());

  const monthEvents = events.filter((e) => {
    const s = isoDate(e.startDateTime);
    const en = isoDate(e.endDateTime);
    return s <= lastDayStr && en >= firstDayStr;
  });

  const cells = Array.from({ length: lastDay.getDate() }, (_, i) => {
    const d = i + 1;
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    const dateStr = `${year}-${mm}-${dd}`;
    const dow = new Date(year, month, d).toLocaleDateString('he-IL', { weekday: 'short' });
    const dayEvents = monthEvents.filter(
      (e) => isoDate(e.startDateTime) <= dateStr && isoDate(e.endDateTime) >= dateStr
    );
    return `<td>
      <div class="day-num">${d} <span class="dow">${dow}</span></div>
      ${dayEvents.map((e) => {
        const cat = categories.find((c) => c.id === e.categoryId);
        void cat;
        return `<div class="ev">${e.title}</div>`;
      }).join('')}
    </td>`;
  }).join('');

  injectAndPrint(`
    <h1>לוח קיר — ${monthName}</h1>
    <table class="wall"><tbody><tr>${cells}</tr></tbody></table>
  `);
}

// ── Excel ─────────────────────────────────────────────────────────────────────

export function exportToExcel(
  events: Event[],
  layers: Layer[],
  classes: SchoolClass[],
  categories: Category[],
  filename = 'לוזניק-אירועים'
): void {
  const sorted = [...events].sort((a, b) => a.startDateTime.localeCompare(b.startDateTime));

  const rows = sorted.map((e) => ({
    'שם האירוע':    e.title,
    'תאריך התחלה':  fmtDate(e.startDateTime),
    'שעת התחלה':    fmtTime(e.startDateTime, e.allDay),
    'תאריך סיום':   fmtDate(e.endDateTime),
    'שעת סיום':     fmtTime(e.endDateTime, e.allDay),
    'כל היום':      e.allDay ? 'כן' : 'לא',
    'שכבות':        e.layerIds.map((id) => layers.find((l) => l.id === id)?.name ?? '').filter(Boolean).join(', '),
    'כיתות':        e.classIds.map((id) => classes.find((c) => c.id === id)?.displayName ?? '').filter(Boolean).join(', '),
    'קטגוריה':      categories.find((c) => c.id === e.categoryId)?.label ?? '',
    'נראות':        visibilityLabel(e.visibility),
    'תיאור':        e.description ?? '',
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 30 }, { wch: 14 }, { wch: 12 }, { wch: 14 }, { wch: 12 },
    { wch: 8  }, { wch: 20 }, { wch: 20 }, { wch: 18 }, { wch: 10 }, { wch: 40 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'אירועים');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// ── Print current calendar view ───────────────────────────────────────────────

export function printCalendar(): void {
  window.print();
}
