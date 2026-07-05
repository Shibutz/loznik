import { parseISO } from 'date-fns';
import { Sparkles, CalendarClock } from 'lucide-react';
import { useStore } from '../store/useStore';
import {
  getNextWeekRange, getNextWeekDays,
  HEBREW_DAY_NAMES_FULL, HEBREW_MONTH_NAMES, formatTime,
} from '../utils/dateUtils';
import { getEventsForDate } from '../utils/eventUtils';
import { Event } from '../types';

/* Map category Tailwind bg class → hex for the colored border */
const CAT_HEX: Record<string, string> = {
  'bg-red-100': '#dc2626', 'bg-orange-100': '#ea580c', 'bg-amber-100': '#d97706',
  'bg-yellow-100': '#ca8a04', 'bg-green-100': '#16a34a', 'bg-emerald-100': '#059669',
  'bg-teal-100': '#0d9488', 'bg-primary-100': '#0d9488', 'bg-sky-100': '#0284c7',
  'bg-blue-100': '#2563eb', 'bg-indigo-100': '#4f46e5', 'bg-violet-100': '#7c3aed',
  'bg-purple-100': '#9333ea', 'bg-pink-100': '#db2777', 'bg-rose-100': '#e11d48',
  'bg-gray-100': '#6b7280',
};

export default function WeeklyDigest() {
  const { events, isStaffMode, layers, categories, activeSchoolYearId } = useStore();

  const range = getNextWeekRange();
  const days = getNextWeekDays();

  const catColor = (categoryId: string): string => {
    const cat = categories.find((c) => c.id === categoryId);
    return (cat && CAT_HEX[cat.bgColor]) || '#8855ff';
  };

  const layerNames = (event: Event): string[] =>
    event.layerIds
      .map((id) => layers.find((l) => l.id === id)?.name)
      .filter((n): n is string => !!n);

  // Base pool: active school year + role-based visibility.
  const pool = events
    .filter((e) => e.schoolYearId === activeSchoolYearId)
    .filter((e) => {
      const v = e.visibility ?? 'public';
      if (v === 'public') return true;
      if (v === 'staff') return isStaffMode; // staff-only hidden from public entirely
      return false;                          // admin-only never appears in the digest
    });

  const fmtRange = () => {
    const s = range.start, e = range.end;
    const sM = HEBREW_MONTH_NAMES[s.getMonth()], eM = HEBREW_MONTH_NAMES[e.getMonth()];
    if (s.getMonth() === e.getMonth()) return `${s.getDate()}–${e.getDate()} ב${sM}`;
    return `${s.getDate()} ב${sM} – ${e.getDate()} ב${eM}`;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-950" dir="rtl">
      <div className="max-w-3xl mx-auto px-4 py-5 sm:py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #8855ff, #aa66ff)' }}>
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-gray-100 leading-tight">
              השבוע הקרוב
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <CalendarClock className="w-3.5 h-3.5" />
              {fmtRange()}
            </p>
          </div>
        </div>

        {/* Staff badge */}
        {isStaffMode && (
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
            style={{ background: 'rgba(0,200,150,0.12)', color: '#059669', border: '1px solid rgba(0,200,150,0.3)' }}>
            👁 צוות — כולל אירועים פנימיים
          </div>
        )}

        {/* Days */}
        <div className="mt-5 space-y-4">
          {days.map((day) => {
            const dayEvents = getEventsForDate(pool, day)
              .sort((a, b) => a.startDateTime.localeCompare(b.startDateTime));
            const dayName = HEBREW_DAY_NAMES_FULL[day.getDay()];
            const dateLabel = `${day.getDate()} ב${HEBREW_MONTH_NAMES[day.getMonth()]}`;

            return (
              <section key={day.toISOString()}>
                <div className="flex items-baseline gap-2 mb-2">
                  <h2 className="text-base font-bold text-gray-800 dark:text-gray-200">יום {dayName}</h2>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{dateLabel}</span>
                </div>

                {dayEvents.length === 0 ? (
                  <p className="text-xs text-gray-400 dark:text-gray-600 pr-1">אין אירועים</p>
                ) : (
                  <div className="space-y-2">
                    {dayEvents.map((event) => {
                      const color = catColor(event.categoryId);
                      const lyrs = layerNames(event);
                      return (
                        <div key={event.id}
                          className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-3 flex gap-3"
                          style={{ borderRight: `4px solid ${color}` }}>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                              {event.title}
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-xs font-medium" style={{ color }}>
                                {event.allDay ? 'כל היום' : formatTime(event.startDateTime)}
                              </span>
                              {lyrs.map((n) => (
                                <span key={n}
                                  className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                                  {n}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
