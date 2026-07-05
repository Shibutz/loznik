import { parseISO } from 'date-fns';
import { Calendar } from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatHebrewDate, isToday } from '../utils/dateUtils';
import { getEventsForDate, filterEvents } from '../utils/eventUtils';
import EventCard from './EventCard';
import { useSwipe } from '../hooks/useSwipe';

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7);

export default function DayView() {
  const {
    currentDate, events, layers, classes, categories,
    selectedLayerIds, selectedClassIds, selectedCategoryIds,
    activeSchoolYearId, searchQuery, isAdminMode,
    openCreateEvent, openEditEvent, userRole,
    navigatePrev, navigateNext,
  } = useStore();

  const filteredEvents = filterEvents(
    events, selectedLayerIds, selectedClassIds, selectedCategoryIds, searchQuery, userRole, categories
  ).filter((e) => (searchQuery.trim() || selectedCategoryIds.length > 0) ? true : e.schoolYearId === activeSchoolYearId);

  const dayEvents = getEventsForDate(filteredEvents, currentDate);
  const allDayEvents = dayEvents.filter((e) => e.allDay);
  const timedEvents = dayEvents.filter((e) => !e.allDay);
  const isCurrentDay = isToday(currentDate);

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className={`px-4 py-3 border-b border-gray-200 dark:border-gray-700 ${isCurrentDay ? 'bg-primary-50 dark:bg-primary-900/20' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
        <h2 className={`text-lg font-semibold ${isCurrentDay ? 'text-primary-700 dark:text-primary-300' : 'text-gray-800 dark:text-gray-200'}`}>
          {formatHebrewDate(currentDate)}
          {isCurrentDay && <span className="mr-2 text-sm font-normal text-primary-500">(היום)</span>}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">{dayEvents.length} אירועים</p>
      </div>

      {allDayEvents.length > 0 && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/30 border-b border-gray-200 dark:border-gray-700">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">כל היום</div>
          <div className="space-y-1">
            {allDayEvents.map((event) => (
              <EventCard key={event.id} event={event} layers={layers} categories={categories} onClick={openEditEvent} />
            ))}
          </div>
        </div>
      )}

      {dayEvents.length === 0 && (
        <div className="flex flex-col items-center justify-center flex-1 py-16 text-gray-400 dark:text-gray-600">
          <Calendar className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-base font-medium">אין אירועים ביום זה</p>
          {isAdminMode && (
            <button onClick={() => openCreateEvent(currentDate)}
              className="mt-3 px-4 py-2 text-sm font-medium rounded-md bg-primary-500 text-white hover:bg-primary-600 transition-colors">
              הוסף אירוע
            </button>
          )}
        </div>
      )}

      {(timedEvents.length > 0 || dayEvents.length > allDayEvents.length) && (
        <div className="flex-1 overflow-auto">
          {HOURS.map((hour) => {
            const hourEvents = timedEvents.filter((e) => parseISO(e.startDateTime).getHours() === hour);
            return (
              <div key={hour} className="flex border-b border-gray-100 dark:border-gray-800 min-h-[52px]">
                <div className="w-16 flex-shrink-0 px-2 py-2 text-xs text-gray-400 dark:text-gray-500 text-center border-r border-gray-200 dark:border-gray-700">
                  {String(hour).padStart(2, '0')}:00
                </div>
                <div className="flex-1 p-1 space-y-1">
                  {hourEvents.map((event) => (
                    <EventCard key={event.id} event={event} layers={layers} categories={categories} onClick={openEditEvent} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
