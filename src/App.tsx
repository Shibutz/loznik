import { useEffect } from 'react';
import { useStore } from './store/useStore';
import { useTheme } from './hooks/useTheme';
import CalendarPage from './pages/CalendarPage';
import BulkEntryPage from './components/BulkEntryPage';
import AdminLoginModal from './components/AdminLoginModal';

function App() {
  const { isDarkMode, showBulkEntry, showAdminLogin, isLoading, initializeFromFirebase } = useStore();
  useTheme(); // applies role-based or user-chosen CSS theme

  // Apply dark mode on load
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Fetch data from Firestore on mount
  useEffect(() => {
    initializeFromFirebase();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary-500 border-t-transparent animate-spin" />
          <p className="text-primary-600 dark:text-primary-400 font-medium text-lg">טוען נתונים…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors">
      {showBulkEntry ? <BulkEntryPage /> : <CalendarPage />}
      {showAdminLogin && <AdminLoginModal />}
    </div>
  );
}

export default App;
