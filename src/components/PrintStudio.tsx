import { useState, useRef, useEffect } from 'react';
import { X, Printer, Check } from 'lucide-react';
import { useStore } from '../store/useStore';
import { getPrimaryHex, getPrimaryRGB } from '../lib/theme';
import { Event, Category } from '../types';
import {
  HEBREW_MONTH_NAMES, HEBREW_DAY_NAMES_SHORT, HEBREW_DAY_NAMES_FULL,
  getMonthGrid, getWeekDays,
} from '../utils/dateUtils';
import { format, addDays } from 'date-fns';
import { he } from 'date-fns/locale';

// ── Types ──────────────────────────────────────────────────────────────────────

type PrintView = 'month' | 'week' | 'day' | 'agenda' | 'year';
type StyleKey = 'clean' | 'colorful' | 'classic' | 'festive';

interface PrintStyle {
  headerBg: string;
  headerText: string;
  accentColor: string;
  borderColor: string;
  fontFamily: string;
  borderRadius: string;
  eventBg: string;
  eventText: string;
}

interface PrintOpts {
  showHeader: boolean;
  showPrintDate: boolean;
  activeLayerIds: string[];
  activeCategoryIds: string[];
}

// ── Styles ─────────────────────────────────────────────────────────────────────

/** Build styles at render time so they pick up the active CSS theme */
function makeStyles(): Record<StyleKey, PrintStyle> {
  const hex   = getPrimaryHex();
  const p50   = getPrimaryRGB(50);
  const p100  = getPrimaryRGB(100);
  const p200  = getPrimaryRGB(200);
  const p400  = getPrimaryRGB(400);
  const p700  = getPrimaryRGB(700);
  const p800  = getPrimaryRGB(800);
  return {
    clean: {
      headerBg: '#f9fafb', headerText: '#111827', accentColor: hex,
      borderColor: '#e5e7eb', fontFamily: 'Arial, sans-serif',
      borderRadius: '0px', eventBg: p50, eventText: p800,
    },
    colorful: {
      headerBg: hex, headerText: '#ffffff', accentColor: p400,
      borderColor: p100, fontFamily: 'Arial, sans-serif',
      borderRadius: '4px', eventBg: 'USE_CATEGORY_COLOR', eventText: 'USE_CATEGORY_TEXT',
    },
    classic: {
      headerBg: '#1e3a5f', headerText: '#ffffff', accentColor: '#2563eb',
      borderColor: '#bfdbfe', fontFamily: 'Georgia, serif',
      borderRadius: '0px', eventBg: '#eff6ff', eventText: '#1e40af',
    },
    festive: {
      headerBg: `linear-gradient(135deg, ${hex}, ${p700})`, headerText: '#ffffff',
      accentColor: p400, borderColor: p200,
      fontFamily: 'Arial, sans-serif', borderRadius: '8px',
      eventBg: p50, eventText: p800,
    },
  };
}

function makeSwatches(hex: string): Record<StyleKey, [string, string, string]> {
  return {
    clean:    ['#f9fafb', hex,              getPrimaryRGB(50)],
    colorful: [hex,       getPrimaryRGB(400), getPrimaryRGB(100)],
    classic:  ['#1e3a5f', '#2563eb',        '#eff6ff'],
    festive:  [getPrimaryRGB(700), getPrimaryRGB(400), getPrimaryRGB(50)],
  };
}

const STYLE_LABELS: Record<StyleKey, string> = {
  clean: 'נקי', colorful: 'צבעוני', classic: 'קלאסי', festive: 'חגיגי',
};

const VIEW_LABELS: Record<PrintView, string> = {
  month: 'חודש', week: 'שבוע', day: 'יום', agenda: "אג׳נדה", year: 'שנה',
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function ds(dt: string) { return dt.slice(0, 10); }
function todayISO() { return format(new Date(), 'yyyy-MM-dd'); }

function evtColor(e: Event, style: PrintStyle, cats: Category[]) {
  if (style.eventBg !== 'USE_CATEGORY_COLOR') return { bg: style.eventBg, text: style.eventText };
  const cat = cats.find(c => c.id === e.categoryId);
  return { bg: cat?.bgColor ?? '#f0fdf4', text: cat?.textColor ?? '#065f46' };
}

function applyFilters(events: Event[], opts: PrintOpts) {
  return events.filter(e => {
    const layerOk = e.layerIds.length === 0 || e.layerIds.some(id => opts.activeLayerIds.includes(id));
    const catOk = opts.activeCategoryIds.includes(e.categoryId);
    return layerOk && catOk;
  });
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Checkbox({ val, onChange, label }: { val: boolean; onChange: () => void; label: string }) {
  return (
    <div className="flex items-center gap-2 cursor-pointer" onClick={onChange}>
      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${val ? 'bg-primary-500 border-primary-500' : 'border-gray-300 dark:border-gray-600'}`}>
        {val && <Check className="w-2.5 h-2.5 text-white" />}
      </div>
      <span className="text-sm text-gray-700 dark:text-gray-300 select-none">{label}</span>
    </div>
  );
}

function PrintHeader({ style, showDate }: { style: PrintStyle; showDate: boolean }) {
  const today = format(new Date(), 'dd בMMMM yyyy', { locale: he });
  return (
    <div style={{ textAlign: 'center', marginBottom: '12px', paddingBottom: '8px', borderBottom: `2px solid ${style.accentColor}` }}>
      <h1 style={{ fontSize: '17px', color: style.accentColor, margin: 0, fontFamily: style.fontFamily }}>
        לוזניק — לוח שנה בית ספרי
      </h1>
      {showDate && (
        <p style={{ fontSize: '10px', color: '#6b7280', margin: '2px 0 0', fontFamily: style.fontFamily }}>
          הודפס: {today}
        </p>
      )}
    </div>
  );
}

// ── MonthView ──────────────────────────────────────────────────────────────────

function MonthView({ date, events, style, cats, opts }: { date: Date; events: Event[]; style: PrintStyle; cats: Category[]; opts: PrintOpts }) {
  const grid = getMonthGrid(date);
  const evts = applyFilters(events, opts);
  const todayDs = todayISO();
  return (
    <div style={{ fontFamily: style.fontFamily, direction: 'rtl', width: '100%' }}>
      {opts.showHeader && <PrintHeader style={style} showDate={opts.showPrintDate} />}
      <div style={{ textAlign: 'center', marginBottom: '6px' }}>
        <h2 style={{ fontSize: '14px', color: style.accentColor, margin: 0 }}>
          {HEBREW_MONTH_NAMES[date.getMonth()]} {date.getFullYear()}
        </h2>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '9px' }}>
        <thead>
          <tr>
            {HEBREW_DAY_NAMES_SHORT.map((d, i) => (
              <th key={i} style={{ background: style.headerBg, color: style.headerText, padding: '3px 1px', textAlign: 'center', border: `1px solid ${style.borderColor}` }}>{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.map((week, wi) => (
            <tr key={wi}>
              {week.map((day, di) => {
                const dStr = format(day, 'yyyy-MM-dd');
                const inMonth = day.getMonth() === date.getMonth();
                const isToday = dStr === todayDs;
                const dayEvts = evts.filter(e => ds(e.startDateTime) <= dStr && ds(e.endDateTime) >= dStr);
                const shown = dayEvts.slice(0, 3);
                const more = dayEvts.length - 3;
                return (
                  <td key={di} style={{ border: `1px solid ${style.borderColor}`, padding: '2px', verticalAlign: 'top', height: '55px', opacity: inMonth ? 1 : 0.3, background: isToday ? '#f0fdf4' : 'white' }}>
                    <div style={{ fontWeight: 700, color: isToday ? style.accentColor : '#374151', fontSize: '9px', marginBottom: '1px' }}>{day.getDate()}</div>
                    {shown.map((e, ei) => {
                      const { bg, text } = evtColor(e, style, cats);
                      return (
                        <div key={ei} style={{ background: bg, color: text, fontSize: '8px', borderRadius: style.borderRadius, padding: '1px 2px', marginBottom: '1px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{e.title}</div>
                      );
                    })}
                    {more > 0 && <div style={{ color: style.accentColor, fontSize: '7px' }}>+{more} עוד</div>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── WeekView ───────────────────────────────────────────────────────────────────

function WeekView({ date, events, style, cats, opts }: { date: Date; events: Event[]; style: PrintStyle; cats: Category[]; opts: PrintOpts }) {
  const weekDays = getWeekDays(date);
  const evts = applyFilters(events, opts);
  const todayDs = todayISO();
  return (
    <div style={{ fontFamily: style.fontFamily, direction: 'rtl' }}>
      {opts.showHeader && <PrintHeader style={style} showDate={opts.showPrintDate} />}
      <div style={{ textAlign: 'center', marginBottom: '6px' }}>
        <h2 style={{ fontSize: '13px', color: style.accentColor, margin: 0 }}>
          שבוע {format(weekDays[0], 'dd/MM')} — {format(weekDays[6], 'dd/MM/yyyy')}
        </h2>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '8px' }}>
        <thead>
          <tr>
            {weekDays.map((day, i) => {
              const isToday = format(day, 'yyyy-MM-dd') === todayDs;
              return (
                <th key={i} style={{ background: isToday ? style.accentColor : style.headerBg, color: isToday ? '#fff' : style.headerText, padding: '3px 2px', textAlign: 'center', border: `1px solid ${style.borderColor}` }}>
                  <div>{HEBREW_DAY_NAMES_SHORT[day.getDay()]}</div>
                  <div style={{ fontWeight: 700 }}>{day.getDate()}</div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          <tr>
            {weekDays.map((day, i) => {
              const dStr = format(day, 'yyyy-MM-dd');
              const dayEvts = evts.filter(e => ds(e.startDateTime) <= dStr && ds(e.endDateTime) >= dStr);
              return (
                <td key={i} style={{ border: `1px solid ${style.borderColor}`, padding: '3px 2px', verticalAlign: 'top', height: '200px' }}>
                  {dayEvts.map((e, ei) => {
                    const { bg, text } = evtColor(e, style, cats);
                    const time = e.allDay ? 'כל היום' : e.startDateTime.slice(11, 16);
                    return (
                      <div key={ei} style={{ background: bg, color: text, borderRadius: style.borderRadius, padding: '2px 3px', marginBottom: '2px' }}>
                        <div style={{ fontWeight: 700, fontSize: '8px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{e.title}</div>
                        <div style={{ fontSize: '7px', opacity: 0.8 }}>{time}</div>
                      </div>
                    );
                  })}
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ── DayView ────────────────────────────────────────────────────────────────────

function DayView({ date, events, style, cats, opts }: { date: Date; events: Event[]; style: PrintStyle; cats: Category[]; opts: PrintOpts }) {
  const evts = applyFilters(events, opts);
  const dStr = format(date, 'yyyy-MM-dd');
  const dayEvts = evts.filter(e => ds(e.startDateTime) <= dStr && ds(e.endDateTime) >= dStr);
  const allDay = dayEvts.filter(e => e.allDay);
  const timed = dayEvts.filter(e => !e.allDay);
  const hours = Array.from({ length: 14 }, (_, i) => i + 7);
  return (
    <div style={{ fontFamily: style.fontFamily, direction: 'rtl' }}>
      {opts.showHeader && <PrintHeader style={style} showDate={opts.showPrintDate} />}
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <h2 style={{ fontSize: '14px', color: style.accentColor, margin: 0 }}>
          {HEBREW_DAY_NAMES_FULL[date.getDay()]}, {format(date, 'dd MMMM yyyy', { locale: he })}
        </h2>
      </div>
      {allDay.length > 0 && (
        <div style={{ background: style.headerBg, padding: '4px 8px', marginBottom: '6px', borderRadius: style.borderRadius, border: `1px solid ${style.borderColor}` }}>
          <span style={{ fontSize: '8px', color: '#6b7280', marginLeft: '4px' }}>כל היום: </span>
          {allDay.map((e, i) => {
            const { bg, text } = evtColor(e, style, cats);
            return <span key={i} style={{ background: bg, color: text, borderRadius: '3px', padding: '1px 5px', marginLeft: '3px', fontSize: '8px' }}>{e.title}</span>;
          })}
        </div>
      )}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9px' }}>
        <tbody>
          {hours.map(h => {
            const hStr = String(h).padStart(2, '0');
            const hEvts = timed.filter(e => e.startDateTime.slice(11, 13) === hStr);
            return (
              <tr key={h} style={{ borderBottom: `1px solid ${style.borderColor}` }}>
                <td style={{ width: '34px', padding: '3px 4px', color: '#9ca3af', fontWeight: 600, fontSize: '8px', verticalAlign: 'top', textAlign: 'right' }}>{hStr}:00</td>
                <td style={{ padding: '2px 4px', minHeight: '24px' }}>
                  {hEvts.map((e, ei) => {
                    const { bg, text } = evtColor(e, style, cats);
                    return (
                      <span key={ei} style={{ background: bg, color: text, borderRadius: style.borderRadius, padding: '2px 6px', marginLeft: '3px', display: 'inline-block', fontSize: '8px' }}>
                        {e.title} ({e.endDateTime.slice(11, 16)})
                      </span>
                    );
                  })}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── AgendaView ─────────────────────────────────────────────────────────────────

function AgendaView({ date, events, style, cats, opts }: { date: Date; events: Event[]; style: PrintStyle; cats: Category[]; opts: PrintOpts }) {
  const evts = applyFilters(events, opts);
  const days = Array.from({ length: 30 }, (_, i) => addDays(date, i));
  const todayDs = todayISO();
  return (
    <div style={{ fontFamily: style.fontFamily, direction: 'rtl' }}>
      {opts.showHeader && <PrintHeader style={style} showDate={opts.showPrintDate} />}
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <h2 style={{ fontSize: '13px', color: style.accentColor, margin: 0 }}>
          אג׳נדה · {format(date, 'dd/MM/yyyy')} – {format(addDays(date, 29), 'dd/MM/yyyy')}
        </h2>
      </div>
      {days.map((day, di) => {
        const dStr = format(day, 'yyyy-MM-dd');
        const dayEvts = evts.filter(e => ds(e.startDateTime) <= dStr && ds(e.endDateTime) >= dStr);
        if (dayEvts.length === 0) return null;
        const isToday = dStr === todayDs;
        return (
          <div key={di} style={{ marginBottom: '6px' }}>
            <div style={{ background: isToday ? style.accentColor : style.headerBg, color: isToday ? '#fff' : style.headerText, padding: '2px 8px', fontSize: '9px', fontWeight: 700, borderRadius: style.borderRadius }}>
              {HEBREW_DAY_NAMES_FULL[day.getDay()]}, {format(day, 'dd MMMM yyyy', { locale: he })}
            </div>
            {dayEvts.map((e, ei) => {
              const { bg, text } = evtColor(e, style, cats);
              const cat = cats.find(c => c.id === e.categoryId);
              const time = e.allDay ? 'כל היום' : `${e.startDateTime.slice(11, 16)}–${e.endDateTime.slice(11, 16)}`;
              return (
                <div key={ei} style={{ borderRight: `3px solid ${bg}`, paddingRight: '7px', paddingLeft: '4px', paddingTop: '3px', paddingBottom: '3px', marginTop: '2px', background: '#fafafa', fontSize: '8px' }}>
                  <div style={{ fontWeight: 700, color: '#111', fontSize: '9px' }}>{e.title}</div>
                  <div style={{ color: '#6b7280', marginTop: '1px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <span>{time}</span>
                    {cat && <span style={{ background: bg, color: text, borderRadius: '3px', padding: '0 4px', fontSize: '7px' }}>{cat.label}</span>}
                  </div>
                  {e.description && <div style={{ color: '#9ca3af', fontSize: '7px', marginTop: '1px' }}>{e.description.slice(0, 100)}</div>}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ── YearView ───────────────────────────────────────────────────────────────────

function YearView({ date, events, style, cats, opts }: { date: Date; events: Event[]; style: PrintStyle; cats: Category[]; opts: PrintOpts }) {
  const evts = applyFilters(events, opts);
  const year = date.getFullYear();
  const months = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));
  const rows = [months.slice(0, 4), months.slice(4, 8), months.slice(8, 12)];
  const todayDs = todayISO();
  return (
    <div style={{ fontFamily: style.fontFamily, direction: 'rtl' }}>
      {opts.showHeader && <PrintHeader style={style} showDate={opts.showPrintDate} />}
      <div style={{ textAlign: 'center', marginBottom: '6px' }}>
        <h2 style={{ fontSize: '14px', color: style.accentColor, margin: 0 }}>{year}</h2>
      </div>
      {rows.map((rowMonths, ri) => (
        <div key={ri} style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
          {rowMonths.map((m, mi) => {
            const grid = getMonthGrid(m);
            return (
              <div key={mi} style={{ flex: 1, border: `1px solid ${style.borderColor}`, borderRadius: style.borderRadius, overflow: 'hidden' }}>
                <div style={{ background: style.headerBg, color: style.headerText, textAlign: 'center', padding: '2px', fontSize: '8px', fontWeight: 700 }}>
                  {HEBREW_MONTH_NAMES[m.getMonth()]}
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                  <thead>
                    <tr>
                      {HEBREW_DAY_NAMES_SHORT.map((d, i) => (
                        <th key={i} style={{ textAlign: 'center', padding: '1px 0', color: '#9ca3af', fontWeight: 400, fontSize: '6px' }}>{d}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {grid.map((week, wi) => (
                      <tr key={wi}>
                        {week.map((day, di) => {
                          const dStr = format(day, 'yyyy-MM-dd');
                          const inMonth = day.getMonth() === m.getMonth();
                          const isToday = dStr === todayDs;
                          const hasEvts = inMonth && evts.some(e => ds(e.startDateTime) <= dStr && ds(e.endDateTime) >= dStr);
                          return (
                            <td key={di} style={{ textAlign: 'center', padding: '0', opacity: inMonth ? 1 : 0.15 }}>
                              <div style={{ width: '13px', height: '13px', borderRadius: isToday ? '50%' : '0', background: isToday ? style.accentColor : 'transparent', color: isToday ? '#fff' : '#374151', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '6px', margin: '0 auto' }}>
                                {inMonth ? day.getDate() : ''}
                              </div>
                              {hasEvts && <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: style.accentColor, margin: '0 auto' }} />}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface Props { onClose: () => void }

export default function PrintStudio({ onClose }: Props) {
  const { events, layers, categories, activeSchoolYearId, currentDate } = useStore();

  const yearEvents = events.filter(e => e.schoolYearId === activeSchoolYearId);

  const [printView, setPrintView] = useState<PrintView>('month');
  const [selectedDate, setSelectedDate] = useState<Date>(currentDate);
  const [styleKey, setStyleKey] = useState<StyleKey>('clean');
  const [paperSize, setPaperSize] = useState<'A4' | 'A3'>('A4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [showHeader, setShowHeader] = useState(true);
  const [showPrintDate, setShowPrintDate] = useState(true);
  const [showWeekNumbers, setShowWeekNumbers] = useState(false);
  const [activeLayerIds, setActiveLayerIds] = useState<string[]>(layers.map(l => l.id));
  const [activeCategoryIds, setActiveCategoryIds] = useState<string[]>(categories.map(c => c.id));

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const paperContentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.7);

  // Paper points: A4=595×842, A3=842×1191
  const paperW = orientation === 'portrait' ? (paperSize === 'A4' ? 595 : 842) : (paperSize === 'A4' ? 842 : 1191);
  const paperH = orientation === 'portrait' ? (paperSize === 'A4' ? 842 : 1191) : (paperSize === 'A4' ? 595 : 842);

  useEffect(() => {
    const container = previewContainerRef.current;
    if (!container) return;
    const calc = () => {
      const { width, height } = container.getBoundingClientRect();
      const sx = (width - 48) / paperW;
      const sy = (height - 48) / paperH;
      setScale(Math.min(sx, sy, 1.1));
    };
    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(container);
    return () => ro.disconnect();
  }, [paperW, paperH]);

  const STYLES = makeStyles();
  const STYLE_SWATCHES = makeSwatches(getPrimaryHex());
  const style = STYLES[styleKey];
  const opts: PrintOpts = { showHeader, showPrintDate, activeLayerIds, activeCategoryIds };

  const handlePrint = () => {
    if (!paperContentRef.current) return;
    const existing = document.getElementById('loznik-print-container');
    if (existing) existing.remove();
    const container = document.createElement('div');
    container.id = 'loznik-print-container';
    container.innerHTML = paperContentRef.current.innerHTML;
    document.body.appendChild(container);
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        const el = document.getElementById('loznik-print-container');
        if (el) el.remove();
      }, 3000);
    }, 100);
  };

  const toggleLayer = (id: string) => setActiveLayerIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleCategory = (id: string) => setActiveCategoryIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const renderView = () => {
    const p = { events: yearEvents, style, cats: categories, opts };
    switch (printView) {
      case 'month':  return <MonthView  date={selectedDate} {...p} />;
      case 'week':   return <WeekView   date={selectedDate} {...p} />;
      case 'day':    return <DayView    date={selectedDate} {...p} />;
      case 'agenda': return <AgendaView date={selectedDate} {...p} />;
      case 'year':   return <YearView   date={selectedDate} {...p} />;
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-gray-100 dark:bg-gray-950" style={{ direction: 'rtl' }}>

      {/* ── Top bar ── */}
      <div className="flex items-center gap-3 px-5 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm flex-shrink-0">
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0">
          <X className="w-5 h-5 text-gray-500" />
        </button>
        <Printer className="w-5 h-5 text-primary-600 flex-shrink-0" />
        <h1 className="text-base font-bold text-gray-900 dark:text-gray-100">סטודיו הדפסה</h1>
        <div className="flex-1" />
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-xl shadow transition-colors text-sm"
        >
          <Printer className="w-4 h-4" />
          הדפס עכשיו
        </button>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden" style={{ direction: 'ltr' }}>

        {/* Preview panel */}
        <div
          ref={previewContainerRef}
          className="flex-1 flex items-center justify-center overflow-hidden bg-gray-300 dark:bg-gray-800"
          style={{ padding: '24px' }}
        >
          {/* Outer wrapper — sized to scaled paper */}
          <div style={{
            width: paperW * scale,
            height: paperH * scale,
            boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
            flexShrink: 0,
            overflow: 'hidden',
            position: 'relative',
          }}>
            {/* Paper at full size, scaled down from top-left */}
            <div
              ref={paperContentRef}
              style={{
                width: paperW,
                height: paperH,
                transformOrigin: 'top left',
                transform: `scale(${scale})`,
                background: 'white',
                padding: '24px',
                overflow: 'hidden',
                boxSizing: 'border-box',
                fontFamily: style.fontFamily,
              }}
            >
              {renderView()}
            </div>
          </div>
        </div>

        {/* Settings panel */}
        <div className="w-80 flex-shrink-0 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 overflow-y-auto" style={{ direction: 'rtl' }}>
          <div className="p-4 space-y-5">

            {/* View type */}
            <section>
              <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">תצוגה</h3>
              <div className="grid grid-cols-5 gap-1">
                {(Object.keys(VIEW_LABELS) as PrintView[]).map(v => (
                  <button key={v} onClick={() => setPrintView(v)}
                    className={`py-1.5 text-xs rounded-lg font-medium transition-colors ${printView === v ? 'bg-primary-500 text-white shadow-sm' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                    {VIEW_LABELS[v]}
                  </button>
                ))}
              </div>
            </section>

            {/* Date */}
            <section>
              <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">תאריך</h3>
              <input
                type="date"
                value={format(selectedDate, 'yyyy-MM-dd')}
                onChange={e => { if (e.target.value) setSelectedDate(new Date(e.target.value + 'T12:00:00')); }}
                className="w-full text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                style={{ direction: 'ltr' }}
              />
            </section>

            {/* Style */}
            <section>
              <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">סגנון</h3>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(STYLES) as StyleKey[]).map(sk => (
                  <button key={sk} onClick={() => setStyleKey(sk)}
                    className={`p-2.5 rounded-xl border-2 transition-all text-right ${styleKey === sk ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
                    <div className="flex gap-1 mb-1.5">
                      {STYLE_SWATCHES[sk].map((c, i) => (
                        <div key={i} style={{ background: c, width: 14, height: 14, borderRadius: 3, border: '1px solid rgba(0,0,0,0.1)', flexShrink: 0 }} />
                      ))}
                    </div>
                    <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">{STYLE_LABELS[sk]}</div>
                  </button>
                ))}
              </div>
            </section>

            {/* Paper size + orientation */}
            <section>
              <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">גודל נייר</h3>
              <div className="flex gap-2 mb-3">
                {(['A4', 'A3'] as const).map(s => (
                  <button key={s} onClick={() => setPaperSize(s)}
                    className={`flex-1 py-1.5 text-sm rounded-lg font-semibold transition-colors ${paperSize === s ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                    {s}
                  </button>
                ))}
              </div>
              <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">כיוון</h3>
              <div className="flex gap-2">
                {([['portrait', 'לאורך'], ['landscape', 'לרוחב']] as const).map(([o, label]) => (
                  <button key={o} onClick={() => setOrientation(o)}
                    className={`flex-1 py-1.5 text-sm rounded-lg font-semibold transition-colors ${orientation === o ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </section>

            {/* Content options */}
            <section>
              <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">תוכן</h3>
              <div className="space-y-2.5">
                <Checkbox val={showHeader}      onChange={() => setShowHeader(v => !v)}      label="כותרת בית הספר" />
                <Checkbox val={showPrintDate}   onChange={() => setShowPrintDate(v => !v)}   label="תאריך הדפסה" />
                <Checkbox val={showWeekNumbers} onChange={() => setShowWeekNumbers(v => !v)} label="מספרי שבוע" />
              </div>
            </section>

            {/* Layer chips */}
            {layers.length > 0 && (
              <section>
                <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">שכבות</h3>
                <div className="flex flex-wrap gap-1.5">
                  {layers.map(l => (
                    <button key={l.id} onClick={() => toggleLayer(l.id)}
                      style={{
                        background: activeLayerIds.includes(l.id) ? l.color : 'transparent',
                        color: activeLayerIds.includes(l.id) ? l.textColor : '#6b7280',
                        borderColor: l.color,
                      }}
                      className="px-2.5 py-1 text-xs rounded-full border font-medium transition-all">
                      {l.name}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Category chips */}
            {categories.length > 0 && (
              <section>
                <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">קטגוריות</h3>
                <div className="flex flex-wrap gap-1.5">
                  {categories.map(c => (
                    <button key={c.id} onClick={() => toggleCategory(c.id)}
                      style={{
                        background: activeCategoryIds.includes(c.id) ? c.bgColor : 'transparent',
                        color: activeCategoryIds.includes(c.id) ? c.textColor : '#6b7280',
                        borderColor: c.color,
                      }}
                      className="px-2.5 py-1 text-xs rounded-full border font-medium transition-all">
                      {c.label}
                    </button>
                  ))}
                </div>
              </section>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
