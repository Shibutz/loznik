import { useState, useEffect } from 'react';
import { Calendar, Filter } from 'lucide-react';
import { useStore } from '../store/useStore';
import Toolbar from '../components/Toolbar';
import FilterPanel, { FilterToggleButton } from '../components/FilterPanel';
import MonthView from '../components/MonthView';
import WeekView from '../components/WeekView';
import DayView from '../components/DayView';
import YearView from '../components/YearView';
import ListView from '../components/ListView';
import WeeklyDigest from '../components/WeeklyDigest';
import EventModal from '../components/EventModal';
import AdminLoginModal from '../components/AdminLoginModal';
import StaffLoginModal from '../components/StaffLoginModal';
import BottomNav from '../components/BottomNav';
import AIEventModal from '../components/AIEventModal';

export default function CalendarPage() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showAI, setShowAI] = useState(false);

  const {
    currentView, showEventModal, showAdminLogin, showStaffLogin,
    events, selectedLayerIds, selectedClassIds, selectedCategoryIds,
    activeSchoolYearId, isAdminMode, openCreateEvent, setView,
  } = useStore();

  // Deep link: push notifications open …/?view=digest
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'digest') setView('digest');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasNoEvents = events.filter((e) => e.schoolYearId === activeSchoolYearId).length === 0;
  const hasActiveFilters = selectedLayerIds.length > 0 || selectedClassIds.length > 0 || selectedCategoryIds.length > 0;

  const renderCalendarView = () => {
    switch (currentView) {
      case 'month': return <MonthView />;
      case 'week':  return <WeekView />;
      case 'day':   return <DayView />;
      case 'year':  return <YearView />;
      case 'list':  return <ListView />;
      case 'digest': return <WeeklyDigest />;
      default:      return <MonthView />;
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Toolbar />

      <div className="flex flex-1 overflow-hidden">
        <div className="hidden md:flex flex-col items-center pt-3 px-1 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`p-2 rounded-lg transition-colors ${
              isFilterOpen ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500'
            }`}
            title="פתח/סגור סינון">
            <FilterToggleButton />
          </button>
        </div>

        <FilterPanel isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />

        <main className="flex-1 overflow-hidden flex flex-col bg-white dark:bg-gray-900">


          {hasNoEvents && currentView !== 'digest' ? (
            <div className="flex flex-col items-center justify-center flex-1 text-gray-400 dark:text-gray-600 py-16">
              <Calendar className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg font-medium">לוזניק עדיין ריק</p>
              <p className="text-sm mt-1">הוסף אירועים ראשונים לשנת הלימודים</p>
              {isAdminMode && (
                <button onClick={() => openCreateEvent()}
                  className="mt-4 px-5 py-2.5 text-sm font-semibold rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors">
                  + הוסף אירוע ראשון
                </button>
              )}
            </div>
          ) : (
            <div className="flex-1 overflow-hidden flex flex-col pb-16 md:pb-0">{renderCalendarView()}</div>
          )}
        </main>
      </div>

      {showEventModal && <EventModal />}
      {showAdminLogin && <AdminLoginModal />}
      {showStaffLogin && <StaffLoginModal />}
      {showAI && <AIEventModal onClose={() => setShowAI(false)} />}
      <BottomNav
        onFilterClick={() => setIsFilterOpen(!isFilterOpen)}
        hasActiveFilters={hasActiveFilters}
        filterCount={selectedLayerIds.length + selectedClassIds.length + selectedCategoryIds.length}
        onAIClick={isAdminMode ? () => setShowAI(true) : undefined}
      />
    </div>
  );
}
