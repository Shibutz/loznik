import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { getMonthGrid, isSameMonth, isToday, HEBREW_DAY_NAMES_SHORT } from '../utils/dateUtils';
import { getEventsForDate, filterEvents } from '../utils/eventUtils';
import EventCard from './EventCard';
import { Event } from '../types';
import { useSwipe } from '../hooks/useSwipe';

/* Day-of-week column index mapping: RTL grid (שבת=0, שישי=1, ... ראשון=6) */
function getDowStyle(dark: boolean): Record<number, { header: string; cellBg: string; cellText: string }> {
  return {
    0: { header: '#3366cc', cellBg: dark ? '#0d1a33' : '#f5f8ff', cellText: '#3366cc' }, // Sat
    1: { header: '#cc5533', cellBg: dark ? '#2a1008' : '#fff8f5', cellText: '#cc5533' }, // Fri
  };
}

/* Role → today cell style */
const TODAY_ROLE = {
  admin: { bg: 'linear-gradient(135deg, #f0e8ff, #e8d8ff)', border: '2px solid #8844ff', color: '#8844ff' },
  staff: { bg: 'linear-gradient(135deg, #e8f4ff, #d0eaff)', border: '2px solid #0088ee', color: '#0088ee' },
  public: { bg: 'linear-gradient(135deg, #e0fff5, #c8ffe8)', border: '2px solid #00c896', color: '#00c896' },
};

/* Category → event pill color */
const CAT_COLORS: Record<string, string> = {
  holiday:  '#00c896',
  staff:    '#0088ee',
  trip:     '#ff7744',
  general:  '#8855ff',
};

function getEventColor(event: Event, layers: { id: string; color: string }[], categories: { id: string; bgColor?: string }[]): string {
  const layer = layers.find((l) => l.id === event.layerIds?.[0]);
  const cat   = categories.find((c) => c.id === event.categoryId);
  // Try to map layer/cat color to semantic color
  const raw = layer?.color || cat?.bgColor || '';
  if (raw.includes('emerald') || raw.includes('green') || raw.includes('teal')) return CAT_COLORS.holiday;
  if (raw.includes('blue') || raw.includes('sky') || raw.includes('indigo')) return CAT_COLORS.staff;
  if (raw.includes('orange') || raw.includes('amber') || raw.includes('red') || raw.includes('rose')) return CAT_COLORS.trip;
  if (raw.includes('violet') || raw.includes('purple')) return CAT_COLORS.general;
  return CAT_COLORS.general;
}

export default function MonthView() {
  const {
    currentDate, events, layers, classes, categories,
    selectedLayerIds, selectedClassIds, selectedCategoryIds,
    activeSchoolYearId, isAdminMode, isStaffMode, searchQuery,
    openCreateEvent, openEditEvent, setView, setCurrentDate, userRole, isDarkMode,
    navigatePrev, navigateNext,
  } = useStore();
  const swipeHandlers = useSwipe(navigateNext, navigatePrev);

  const [bottomSheetDay, setBottomSheetDay]     = useState<Date | null>(null);
  const [bottomSheetEvents, setBottomSheetEvents] = useState<Event[]>([]);
  const [hoverDay, setHoverDay]                 = useState<string | null>(null);

  const canEdit = isAdminMode; // staff = view only
  const DOW_STYLE = getDowStyle(isDarkMode);
  const roleKey: 'admin' | 'staff' | 'public' = isAdminMode ? 'admin' : isStaffMode ? 'staff' : 'public';
  const todayStyle = TODAY_ROLE[roleKey];
  const roleAccent = isAdminMode ? '#8844ff' : isStaffMode ? '#0088ee' : '#00c896';
  const topbarFrom = isAdminMode ? '#12003a' : isStaffMode ? '#001433' : '#1a1a3e';
  const topbarTo   = isAdminMode ? '#1a0050' : isStaffMode ? '#002055' : '#0d2b5e';

  const grid = getMonthGrid(currentDate);
  const filteredEvents = filterEvents(events, selectedLayerIds, selectedClassIds, selectedCategoryIds, searchQuery, userRole, categories)
    .filter((e) => (searchQuery.trim() || selectedCategoryIds.length > 0) ? true : e.schoolYearId === activeSchoolYearId);

  const handleDayClick       = (date: Date)                          => { setCurrentDate(date); setView('day'); };
  const handleDayDoubleClick = (date: Date)                          => { if (canEdit) openCreateEvent(date); };
  const handleMoreClick      = (e: React.MouseEvent, date: Date, dayEvents: Event[]) => {
    e.stopPropagation();
    setBottomSheetDay(date);
    setBottomSheetEvents(dayEvents);
  };
  const closeBottomSheet = () => { setBottomSheetDay(null); setBottomSheetEvents([]); };

  return (
    <>
      <div className="flex flex-col h-full" {...swipeHandlers}>

        {/* ── Header row ── */}
        <div className="grid grid-cols-7" style={{ background: `linear-gradient(135deg, ${topbarFrom}, ${topbarTo})` }}>
          {HEBREW_DAY_NAMES_SHORT.map((day, idx) => {
            const colStyle = DOW_STYLE[idx];
            return (
              <div key={idx}
                className="py-2.5 text-center text-xs sm:text-sm font-bold"
                style={{ color: colStyle ? colStyle.header : 'rgba(255,255,255,0.75)' }}>
                {day}
              </div>
            );
          })}
        </div>

        {/* ── Calendar grid ── */}
        <div className="flex-1 grid grid-rows-6 overflow-hidden bg-blue-50/50 dark:bg-gray-950">
          {grid.map((week, weekIdx) => (
            <div key={weekIdx} className="grid grid-cols-7">
              {week.map((day, dayIdx) => {
                const dayEvents      = getEventsForDate(filteredEvents, day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isCurrentDay   = isToday(day);
                const isSat          = day.getDay() === 6;
                const isFri          = day.getDay() === 5;
                const visibleEvents  = dayEvents.slice(0, 3);
                const extraCount     = dayEvents.length - 3;
                const dayKey         = day.toISOString();
                const isHovered      = hoverDay === dayKey;
                const colDow         = dayIdx; // 0=שבת, 1=שישי in RTL grid

                /* Base cell background */
                let cellBg = '#fff';
                if (!isCurrentMonth) cellBg = '#eceeff';
                else if (isSat) cellBg = DOW_STYLE[0].cellBg;
                else if (isFri) cellBg = DOW_STYLE[1].cellBg;

                return (
                  <div key={dayIdx}
                    onClick={() => handleDayClick(day)}
                    onDoubleClick={() => handleDayDoubleClick(day)}
                    onMouseEnter={() => setHoverDay(dayKey)}
                    onMouseLeave={() => setHoverDay(null)}
                    className="relative cursor-pointer transition-all group"
                    style={{
                      minHeight: 100,
                      background: isCurrentDay
                        ? todayStyle.bg
                        : isHovered ? (isDarkMode ? '#1e2235' : '#f5f7ff') : cellBg,
                      border: isCurrentDay ? todayStyle.border : `1px solid ${isDarkMode ? '#2d3148' : '#e4e8ff'}`,
                      boxShadow: isHovered ? '0 2px 8px rgba(100,120,255,0.08) inset' : undefined,
                    }}>

                    {/* Day number */}
                    <div className="flex items-start justify-end p-1">
                      <span className="w-7 h-7 flex items-center justify-center text-xs font-bold rounded-full"
                        style={{
                          background: isCurrentDay ? roleAccent : 'transparent',
                          color: isCurrentDay ? '#fff'
                            : !isCurrentMonth ? (isDarkMode ? '#4b5563' : '#c8cce8')
                            : isSat ? DOW_STYLE[0].cellText
                            : isFri ? DOW_STYLE[1].cellText
                            : '#374151',
                          boxShadow: isCurrentDay ? `0 0 12px ${roleAccent}60` : undefined,
                        }}>
                        {day.getDate()}
                      </span>
                    </div>

                    {/* Mobile: dot indicators */}
                    <div className="flex flex-wrap gap-0.5 px-1 pb-0.5 sm:hidden">
                      {dayEvents.slice(0, 5).map((event) => {
                        const color = getEventColor(event, layers, categories);
                        return <span key={event.id} className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} title={event.title} />;
                      })}
                      {dayEvents.length > 5 && (
                        <button className="text-[9px] font-bold leading-none"
                          style={{ color: roleAccent }}
                          onClick={(e) => handleMoreClick(e, day, dayEvents)}>
                          +{dayEvents.length - 5}
                        </button>
                      )}
                    </div>

                    {/* Desktop: event pills */}
                    <div className="hidden sm:block px-1 pb-1 space-y-0.5">
                      {visibleEvents.map((event) => {
                        const color = getEventColor(event, layers, categories);
                        return (
                          <div key={event.id}
                            onClick={(e) => { e.stopPropagation(); openEditEvent(event); }}
                            className="flex items-center gap-1 rounded text-[10px] font-medium truncate cursor-pointer transition-all hover:opacity-80"
                            style={{
                              borderRight: `3px solid ${color}`,
                              background: `${color}12`,
                              color: isDarkMode ? '#d1d5db' : '#374151',
                              padding: '1px 4px',
                            }}>
                            <span className="truncate">{event.title}</span>
                          </div>
                        );
                      })}
                      {extraCount > 0 && (
                        <div className="text-[10px] font-semibold pr-1 cursor-pointer hover:underline"
                          style={{ color: roleAccent }}
                          onClick={(e) => { e.stopPropagation(); handleDayClick(day); }}>
                          +{extraCount} נוספים
                        </div>
                      )}
                    </div>

                    {/* Add event hint on hover (edit mode only) */}
                    {canEdit && isHovered && dayEvents.length === 0 && (
                      <div className="hidden sm:flex absolute inset-0 items-end justify-center pb-2 pointer-events-none">
                        <span className="flex items-center gap-1 text-[10px] font-semibold opacity-0 group-hover:opacity-60 transition-opacity"
                          style={{ color: roleAccent }}>
                          <Plus className="w-3 h-3" />
                          הוסף אירוע
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom sheet (mobile) */}
      {bottomSheetDay && (
        <div className="sm:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeBottomSheet} />
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl max-h-[70vh] flex flex-col shadow-2xl">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <span className="font-bold text-gray-900 dark:text-gray-100">
                {bottomSheetDay.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
              <button onClick={closeBottomSheet} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {bottomSheetEvents.map((event) => (
                <EventCard key={event.id} event={event} layers={layers} categories={categories}
                  onClick={(ev) => { openEditEvent(ev); closeBottomSheet(); }} />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
