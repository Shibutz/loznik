import { parseISO } from 'date-fns';
import { useStore } from '../store/useStore';
import { getWeekDays, isToday, HEBREW_DAY_NAMES_SHORT } from '../utils/dateUtils';
import { getEventsForDate, filterEvents } from '../utils/eventUtils';
import EventCard from './EventCard';
import { useSwipe } from '../hooks/useSwipe';

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7);

export default function WeekView() {
  const {
    currentDate, events, layers, classes, categories,
    selectedLayerIds, selectedClassIds, selectedCategoryIds,
    activeSchoolYearId, searchQuery, openEditEvent,
    setCurrentDate, setView, userRole,
    navigatePrev, navigateNext,
  } = useStore();

  const weekDays = getWeekDays(currentDate);
  const filteredEvents = filterEvents(events, selectedLayerIds, selectedClassIds, selectedCategoryIds, searchQuery, userRole, categories)
    .filter((e) => (searchQuery.trim() || selectedCategoryIds.length > 0) ? true : e.schoolYearId === activeSchoolYearId);

  const handleDayHeaderClick = (date: Date) => { setCurrentDate(date); setView('day'); };

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:flex flex-col h-full overflow-auto">
        <div className="grid border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 z-10"
          style={{ gridTemplateColumns: '60px repeat(7, 1fr)' }}>
          <div className="border-r border-gray-200 dark:border-gray-700" />
          {weekDays.map((day, idx) => {
            const isCurrentDay = isToday(day);
            const isSat = day.getDay() === 6;
            const isFri = day.getDay() === 5;
            return (
              <div key={idx} onClick={() => handleDayHeaderClick(day)}
                className={`py-2 text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${isSat ? 'bg-blue-50/30 dark:bg-blue-950/10' : ''} ${idx < 6 ? 'border-r border-gray-200 dark:border-gray-700' : ''}`}>
                <div className={`text-xs font-medium ${isSat ? 'text-blue-500' : isFri ? 'text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                  {HEBREW_DAY_NAMES_SHORT[idx]}
                </div>
                <div className={`w-7 h-7 mx-auto flex items-center justify-center rounded-full text-sm font-bold mt-0.5 ${
                  isCurrentDay ? 'bg-primary-500 text-white' : isSat ? 'text-blue-500' : isFri ? 'text-red-400' : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {day.getDate()}
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
          style={{ gridTemplateColumns: '60px repeat(7, 1fr)' }}>
          <div className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700 flex items-center">כל היום</div>
          {weekDays.map((day, idx) => {
            const dayEvents = getEventsForDate(filteredEvents, day).filter((e) => e.allDay);
            return (
              <div key={idx} className={`p-1 min-h-[40px] ${idx < 6 ? 'border-r border-gray-200 dark:border-gray-700' : ''}`}>
                {dayEvents.map((event) => (
                  <EventCard key={event.id} event={event} layers={layers} categories={categories} onClick={openEditEvent} compact />
                ))}
              </div>
            );
          })}
        </div>

        <div className="flex-1 overflow-auto">
          {HOURS.map((hour) => (
            <div key={hour} className="grid border-b border-gray-100 dark:border-gray-800"
              style={{ gridTemplateColumns: '60px repeat(7, 1fr)', minHeight: '48px' }}>
              <div className="px-2 py-1 text-xs text-gray-400 dark:text-gray-500 border-r border-gray-200 dark:border-gray-700 text-center">
                {String(hour).padStart(2, '0')}:00
              </div>
              {weekDays.map((day, idx) => {
                const isCurrentDay = isToday(day);
                const isSat = day.getDay() === 6;
                const hourEvents = getEventsForDate(filteredEvents, day).filter((e) => {
                  if (e.allDay) return false;
                  return parseISO(e.startDateTime).getHours() === hour;
                });
                return (
                  <div key={idx} className={`p-0.5 ${isCurrentDay ? 'bg-primary-50/30 dark:bg-primary-900/10' : ''} ${isSat ? 'bg-blue-50/20 dark:bg-blue-950/10' : ''} ${idx < 6 ? 'border-r border-gray-200 dark:border-gray-700' : ''}`}>
                    {hourEvents.map((event) => (
                      <EventCard key={event.id} event={event} layers={layers} categories={categories} onClick={openEditEvent} compact />
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden overflow-auto p-4 space-y-4">
        {weekDays.map((day, idx) => {
          const dayEvents = getEventsForDate(filteredEvents, day);
          const isCurrentDay = isToday(day);
          const isSat = day.getDay() === 6;
          const isFri = day.getDay() === 5;
          return (
            <div key={idx} className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div
                className={`flex items-center gap-2 px-3 py-2 border-b border-gray-100 dark:border-gray-800 cursor-pointer ${isCurrentDay ? 'bg-primary-50 dark:bg-primary-900/20' : 'bg-gray-50 dark:bg-gray-800/50'}`}
                onClick={() => handleDayHeaderClick(day)}>
                <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold ${
                  isCurrentDay ? 'bg-primary-500 text-white' : isSat ? 'bg-blue-100 text-blue-600' : isFri ? 'bg-red-100 text-red-500' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}>
                  {day.getDate()}
                </div>
                <span className={`text-sm font-medium ${isSat ? 'text-blue-500' : isFri ? 'text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                  יום {['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'][day.getDay()]}
                </span>
                {dayEvents.length > 0 && <span className="mr-auto text-xs text-gray-500">{dayEvents.length} אירועים</span>}
              </div>
              <div className="p-2 space-y-1">
                {dayEvents.length === 0 ? (
                  <p className="text-sm text-gray-400 dark:text-gray-600 text-center py-2">אין אירועים</p>
                ) : (
                  dayEvents.map((event) => (
                    <EventCard key={event.id} event={event} layers={layers} categories={categories} onClick={openEditEvent} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
