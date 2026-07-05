import { CalendarDays, CalendarRange, Calendar, List, SlidersHorizontal, Plus, Sparkles, Users, LogIn } from 'lucide-react';
import { useStore } from '../store/useStore';
import { ViewMode } from '../types';

interface BottomNavProps {
  onFilterClick: () => void;
  hasActiveFilters: boolean;
  filterCount: number;
  onAIClick?: () => void;
}

const NAV_TABS: { view: ViewMode; label: string; icon: React.ReactNode }[] = [
  { view: 'month',  label: 'חודש',  icon: <CalendarDays className="w-5 h-5" /> },
  { view: 'week',   label: 'שבוע',  icon: <CalendarRange className="w-5 h-5" /> },
  { view: 'day',    label: 'יום',   icon: <Calendar className="w-5 h-5" /> },
  { view: 'list',   label: 'רשימה', icon: <List className="w-5 h-5" /> },
  { view: 'digest', label: 'השבוע', icon: <Sparkles className="w-5 h-5" /> },
];

export default function BottomNav({ onFilterClick, hasActiveFilters, filterCount, onAIClick }: BottomNavProps) {
  const {
    currentView, setView, isAdminMode, isStaffMode,
    openCreateEvent, setShowStaffLogin, setShowAdminLogin,
  } = useStore();

  const roleKey: 'admin' | 'staff' | 'public' = isAdminMode ? 'admin' : isStaffMode ? 'staff' : 'public';

  const NAV_THEME = {
    admin:  { bg: '#1a0050', border: '#8844ff', active: '#8844ff', inactive: 'rgba(255,255,255,0.45)', fab: 'linear-gradient(135deg, #8844ff, #aa66ff)', fabShadow: '0 4px 16px rgba(136,68,255,0.5)' },
    staff:  { bg: '#002055', border: '#0088ee', active: '#0088ee', inactive: 'rgba(255,255,255,0.45)', fab: 'linear-gradient(135deg, #0088ee, #0055aa)', fabShadow: '0 4px 16px rgba(0,136,238,0.5)' },
    public: { bg: '#fff',    border: '#e8eaff', active: '#00c896', inactive: '#94a3b8',               fab: '',                                              fabShadow: '' },
  };

  const theme = NAV_THEME[roleKey];
  const canEdit = isAdminMode || isStaffMode;

  /* ── PUBLIC BOTTOM NAV ──────────────────────────────────────────────── */
  if (!canEdit) {
    return (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 safe-area-pb"
        style={{ background: theme.bg, borderTop: `1px solid ${theme.border}`, paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-stretch h-16">
          {/* Calendar */}
          <button onClick={() => setView('month')}
            className="flex-1 flex flex-col items-center justify-center gap-1 transition-colors">
            <CalendarDays className="w-5 h-5" style={{ color: currentView !== 'digest' ? theme.active : theme.inactive }} />
            <span className="text-[10px] font-semibold" style={{ color: currentView !== 'digest' ? theme.active : theme.inactive }}>לוח שנה</span>
          </button>

          {/* Weekly digest */}
          <button onClick={() => setView('digest')}
            className="flex-1 flex flex-col items-center justify-center gap-1 transition-colors">
            <Sparkles className="w-5 h-5" style={{ color: currentView === 'digest' ? theme.active : theme.inactive }} />
            <span className="text-[10px] font-semibold" style={{ color: currentView === 'digest' ? theme.active : theme.inactive }}>השבוע</span>
          </button>

          <button onClick={() => setShowStaffLogin(true)}
            className="flex-1 flex flex-col items-center justify-center gap-1 transition-colors">
            <Users className="w-5 h-5" style={{ color: theme.inactive }} />
            <span className="text-[10px] font-medium" style={{ color: theme.inactive }}>כניסת צוות</span>
          </button>

          <button onClick={() => setShowAdminLogin(true)}
            className="flex-1 flex flex-col items-center justify-center gap-1 transition-colors">
            <LogIn className="w-5 h-5" style={{ color: theme.inactive }} />
            <span className="text-[10px] font-medium" style={{ color: theme.inactive }}>כניסת מנהל</span>
          </button>
        </div>
      </nav>
    );
  }

  /* ── STAFF / ADMIN BOTTOM NAV ───────────────────────────────────────── */
  return (
    <>
      {/* FABs */}
      <div className="md:hidden fixed bottom-20 left-4 z-40 flex flex-col gap-2 items-center">
        {isAdminMode && onAIClick && (
          <button onClick={onAIClick}
            className="w-11 h-11 rounded-full flex items-center justify-center active:scale-95 transition-all"
            style={{ background: theme.fab, boxShadow: theme.fabShadow.replace('16px', '12px') }}
            aria-label="AI">
            <Sparkles className="w-5 h-5 text-white" />
          </button>
        )}
        <button onClick={() => openCreateEvent()}
          className="w-14 h-14 rounded-full flex items-center justify-center active:scale-95 transition-all"
          style={{ background: theme.fab, boxShadow: theme.fabShadow }}
          aria-label="הוספת אירוע">
          <Plus className="w-7 h-7 text-white" />
        </button>
      </div>

      {/* Nav bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 safe-area-pb"
        style={{ background: theme.bg, borderTop: `2px solid ${theme.border}`, paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-stretch h-16">
          {NAV_TABS.map(({ view, label, icon }) => {
            const active = currentView === view;
            return (
              <button key={view} onClick={() => setView(view)}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors relative">
                {active && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full"
                    style={{ background: theme.active }} />
                )}
                <div className="p-1 rounded-lg transition-colors" style={active ? { background: `${theme.active}22` } : {}}>
                  <span style={{ color: active ? theme.active : theme.inactive }}>{icon}</span>
                </div>
                <span className="text-[10px] font-semibold leading-none"
                  style={{ color: active ? theme.active : theme.inactive }}>
                  {label}
                </span>
              </button>
            );
          })}

          {/* Filter tab */}
          <button onClick={onFilterClick}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-colors">
            {hasActiveFilters && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full"
                style={{ background: theme.active }} />
            )}
            <div className="p-1 rounded-lg relative" style={hasActiveFilters ? { background: `${theme.active}22` } : {}}>
              <SlidersHorizontal className="w-5 h-5" style={{ color: hasActiveFilters ? theme.active : theme.inactive }} />
              {filterCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 text-[9px] font-bold rounded-full flex items-center justify-center text-white"
                  style={{ background: theme.active }}>
                  {filterCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-semibold leading-none" style={{ color: hasActiveFilters ? theme.active : theme.inactive }}>
              סינון
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
