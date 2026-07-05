import { parseISO } from 'date-fns';
import { useStore } from '../store/useStore';
import { getMonthsInSchoolYear, SCHOOL_YEAR_MONTH_NAMES, formatTime } from '../utils/dateUtils';
import { filterEvents, getAudienceLabel } from '../utils/eventUtils';

export default function YearView() {
  const {
    schoolYears, activeSchoolYearId, events, layers, classes, categories,
    selectedLayerIds, selectedClassIds, selectedCategoryIds,
    searchQuery, setCurrentDate, setView, openEditEvent, userRole,
  } = useStore();

  const activeYear = schoolYears.find((y) => y.id === activeSchoolYearId);
  const months = activeYear ? getMonthsInSchoolYear(activeYear) : [];

  const filteredEvents = filterEvents(events, selectedLayerIds, selectedClassIds, selectedCategoryIds, searchQuery, userRole, categories)
    .filter((e) => (searchQuery.trim() || selectedCategoryIds.length > 0) ? true : e.schoolYearId === activeSchoolYearId);

  const getMonthEvents = (monthDate: Date) =>
    filteredEvents.filter((e) => {
      const d = parseISO(e.startDateTime);
      return d.getMonth() === monthDate.getMonth() && d.getFullYear() === monthDate.getFullYear();
    });

  const handleMonthClick = (monthDate: Date) => { setCurrentDate(monthDate); setView('month'); };

  return (
    <div className="overflow-auto p-4">
      <div className="space-y-4">
        {months.map((monthDate, idx) => {
          const monthEvents = getMonthEvents(monthDate);
          const monthName = SCHOOL_YEAR_MONTH_NAMES[idx];
          return (
            <div key={idx} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div
                className="flex items-center justify-between px-4 py-3 bg-primary-50 dark:bg-primary-900/20 border-b border-primary-100 dark:border-primary-800/30 cursor-pointer hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                onClick={() => handleMonthClick(monthDate)}>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-primary-700 dark:text-primary-300">{monthName} {monthDate.getFullYear()}</span>
                  <span className="px-2 py-0.5 text-xs font-medium bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded-full">{monthEvents.length} אירועים</span>
                </div>
                <span className="text-xs text-primary-600 dark:text-primary-400">לחץ לצפייה חודשית ←</span>
              </div>

              {monthEvents.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-400 dark:text-gray-600 text-center">אין אירועים בחודש זה</div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {monthEvents.slice().sort((a, b) => a.startDateTime.localeCompare(b.startDateTime)).map((event) => {
                    const cat = categories.find((c) => c.id === event.categoryId);
                    const audience = getAudienceLabel(event, layers, classes);
                    const eventDate = parseISO(event.startDateTime);
                    const dayNames = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
                    return (
                      <div key={event.id} onClick={() => openEditEvent(event)}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
                        <div className="text-center w-10 flex-shrink-0">
                          <div className="text-xs text-gray-400 dark:text-gray-500">{dayNames[eventDate.getDay()]}</div>
                          <div className="text-base font-bold text-gray-700 dark:text-gray-300">{eventDate.getDate()}</div>
                        </div>
                        {cat && (
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${cat.bgColor} ${cat.textColor}`}>{cat.label}</span>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{event.title}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {audience}{!event.allDay && ` · ${formatTime(event.startDateTime)}`}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
