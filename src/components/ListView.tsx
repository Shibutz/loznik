import { parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay } from 'date-fns';
import { Calendar } from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatHebrewDate, formatTime } from '../utils/dateUtils';
import { filterEvents, getAudienceLabel } from '../utils/eventUtils';
import { Event } from '../types';
import { useSwipe } from '../hooks/useSwipe';

export default function ListView() {
  const {
    currentView, currentDate, events, layers, classes, categories,
    selectedLayerIds, selectedClassIds, selectedCategoryIds,
    activeSchoolYearId, searchQuery, openEditEvent, userRole,
    navigatePrev, navigateNext,
  } = useStore();

  let rangeStart: Date;
  let rangeEnd: Date;
  if (currentView === 'day') {
    rangeStart = startOfDay(currentDate); rangeEnd = endOfDay(currentDate);
  } else if (currentView === 'week') {
    rangeStart = startOfWeek(currentDate, { weekStartsOn: 0 }); rangeEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  } else if (currentView === 'month') {
    rangeStart = startOfMonth(currentDate); rangeEnd = endOfMonth(currentDate);
  } else {
    rangeStart = new Date(currentDate.getFullYear(), 8, 1);
    if (currentDate.getMonth() < 8) rangeStart = new Date(currentDate.getFullYear() - 1, 8, 1);
    rangeEnd = new Date(rangeStart.getFullYear() + 1, 7, 31);
  }

  const bypass = searchQuery.trim().length > 0 || selectedCategoryIds.length > 0;
  const filteredEvents = filterEvents(events, selectedLayerIds, selectedClassIds, selectedCategoryIds, searchQuery, userRole, categories)
    .filter((e) => bypass ? true : e.schoolYearId === activeSchoolYearId)
    .filter((e) => {
      if (bypass) return true;
      const start = parseISO(e.startDateTime);
      const end = parseISO(e.endDateTime);
      return start <= rangeEnd && end >= rangeStart;
    })
    .sort((a, b) => a.startDateTime.localeCompare(b.startDateTime));

  const groups = new Map<string, Event[]>();
  filteredEvents.forEach((event) => {
    const date = parseISO(event.startDateTime);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(event);
  });
  const sortedKeys = Array.from(groups.keys()).sort();

  if (filteredEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 py-16 text-gray-400 dark:text-gray-600">
        <Calendar className="w-12 h-12 mb-3 opacity-30" />
        <p className="text-base font-medium">אין אירועים לפי הסינון הנוכחי</p>
        <p className="text-sm mt-1">נסה לשנות את הסינון או לעבור לתקופה אחרת</p>
      </div>
    );
  }

  return (
    <div className="overflow-auto p-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {sortedKeys.map((key) => {
          const dayEvents = groups.get(key)!;
          const date = parseISO(dayEvents[0].startDateTime);
          return (
            <div key={key}>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 whitespace-nowrap">{formatHebrewDate(date)}</h3>
                <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
              </div>
              <div className="space-y-2">
                {dayEvents.map((event) => {
                  const cat = categories.find((c) => c.id === event.categoryId);
                  const audience = getAudienceLabel(event, layers, classes);
                  const layer = event.layerIds.length === 1 ? layers.find((l) => l.id === event.layerIds[0]) : null;
                  return (
                    <div key={event.id} onClick={() => openEditEvent(event)}
                      className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3 cursor-pointer hover:shadow-sm hover:border-primary-200 dark:hover:border-primary-800 transition-all">
                      {cat && (
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full flex-shrink-0 ${cat.bgColor} ${cat.textColor}`}>{cat.label}</span>
                      )}
                      {layer && (
                        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${layer.color.replace('-100', '-400')}`} />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{event.title}</div>
                        {event.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{event.description}</div>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 flex-shrink-0 text-left">
                        {event.allDay ? 'כל היום' : formatTime(event.startDateTime)}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0 hidden sm:block">{audience}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
