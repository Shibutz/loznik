import {
  ChevronLeft, ChevronRight, Moon, Sun, LogIn, LogOut, Plus,
  Download, Search, X, Settings, Users, Sparkles, List, Check, ChevronDown,
} from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../store/useStore';
import { ViewMode } from '../types';
import { formatDateRange } from '../utils/dateUtils';
import { startOfWeek, endOfWeek } from 'date-fns';
import ExportMenu from './ExportMenu';
import SettingsModal from './SettingsModal';
import LogoLightbox from './LogoLightbox';
import PrintStudio from './PrintStudio';
import AIEventModal from './AIEventModal';

const VIEW_LABELS: Record<ViewMode, string> = {
  day: 'יום', week: 'שבוע', month: 'חודש', year: 'שנה', list: 'רשימה', digest: 'השבוע',
};
const VIEWS: ViewMode[] = ['day', 'week', 'month', 'year'];

/* ── Role colours ────────────────────────────────────────────────────────── */
const ROLE = {
  admin: {
    topbarBg:   'linear-gradient(135deg, #12003a 0%, #1a0050 100%)',
    bannerBg:   'linear-gradient(90deg, #12003a 0%, #1a0050 100%)',
    border:     '#8844ff',
    accent:     '#8844ff',
    accentDim:  'rgba(136,68,255,0.15)',
    badge:      { bg: '#8844ff', text: '#fff' },
    mobileBg:   'linear-gradient(160deg, #12003a 0%, #1a0050 100%)',
    navBg:      '#1a0050',
    navBorder:  '#8844ff',
    fabBg:      'linear-gradient(135deg, #8844ff, #6622cc)',
  },
  staff: {
    topbarBg:   'linear-gradient(135deg, #001433 0%, #002055 100%)',
    bannerBg:   'linear-gradient(90deg, #001433 0%, #002055 100%)',
    border:     '#0088ee',
    accent:     '#0088ee',
    accentDim:  'rgba(0,136,238,0.15)',
    badge:      { bg: '#0088ee', text: '#fff' },
    mobileBg:   'linear-gradient(160deg, #001433 0%, #002055 100%)',
    navBg:      '#002055',
    navBorder:  '#0088ee',
    fabBg:      'linear-gradient(135deg, #0088ee, #0055aa)',
  },
  public: {
    topbarBg:   'linear-gradient(135deg, #1a1a3e 0%, #0d2b5e 100%)',
    bannerBg:   '',
    border:     '#00c896',
    accent:     '#00c896',
    accentDim:  'rgba(0,200,150,0.12)',
    badge:      { bg: '#00c896', text: '#fff' },
    mobileBg:   'linear-gradient(160deg, #1a1a3e 0%, #0d2b5e 100%)',
    navBg:      '#fff',
    navBorder:  '#e8eaff',
    fabBg:      'linear-gradient(135deg, #00c896, #00a87a)',
  },
};

/* ── Search box — defined OUTSIDE Toolbar so it never remounts on re-render ── */
function ToolbarSearch({ full }: { full?: boolean }) {
  const { searchQuery, setSearchQuery } = useStore();
  return (
    <div className={`relative flex items-center ${full ? 'w-full' : 'w-44 focus-within:w-60 transition-all duration-200'}`}>
      <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/50 pointer-events-none" />
      <input
        type="text" value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="חיפוש אירועים..."
        className="w-full pr-8 pl-7 py-1.5 text-sm rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 min-h-[36px]"
        style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}
        dir="rtl"
      />
      {searchQuery && (
        <button onClick={() => setSearchQuery('')}
          className="absolute left-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-white/50 hover:text-white">
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

export default function Toolbar() {
  const {
    currentView, currentDate, isAdminMode, isStaffMode, isDarkMode,
    schoolYears, activeSchoolYearId, showExportMenu, showSettings,
    navigatePrev, navigateNext, navigateToday,
    setView, toggleDarkMode, setActiveSchoolYear,
    openCreateEvent, setShowAdminLogin, setShowStaffLogin,
    setAdminMode, setStaffMode, setShowBulkEntry, setShowExportMenu, setShowSettings,
    searchQuery, setSearchQuery,
    categories, selectedCategoryIds, setSelectedCategories,
  } = useStore();

  const [showPrintStudio, setShowPrintStudio] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);

  const role = isAdminMode ? ROLE.admin : isStaffMode ? ROLE.staff : ROLE.public;

  const getDateLabel = () => {
    if (currentView === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
      const weekEnd   = endOfWeek(currentDate,   { weekStartsOn: 0 });
      return formatDateRange(weekStart, weekEnd, 'week');
    }
    return formatDateRange(currentDate, currentDate, currentView);
  };

  const handleLogout = () => {
    if (isAdminMode) setAdminMode(false);
    else setStaffMode(false);
  };

  /* ── Icon button helper ──────────────────────────────────────────────── */
  const IconBtn = ({ onClick, title, children, className = '' }: {
    onClick: () => void; title?: string; children: React.ReactNode; className?: string;
  }) => (
    <button onClick={onClick} title={title}
      className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all hover:bg-white/10 text-white/80 hover:text-white flex-shrink-0 ${className}`}>
      {children}
    </button>
  );

  /* ── View toggle pill ────────────────────────────────────────────────── */
  const ViewToggle = () => (
    <div className="flex items-center rounded-lg overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}>
      {VIEWS.map((view) => (
        <button key={view} onClick={() => setView(view)}
          className="px-3 py-1.5 text-xs font-semibold transition-all min-h-[34px] whitespace-nowrap"
          style={currentView === view
            ? { background: role.accent, color: '#fff', boxShadow: `0 0 12px ${role.accent}60` }
            : { color: 'rgba(255,255,255,0.7)' }}>
          {VIEW_LABELS[view]}
        </button>
      ))}
      {/* List */}
      <button onClick={() => setView(currentView === 'list' ? 'month' : 'list')}
        className="px-2 py-1.5 transition-all min-h-[34px] flex items-center justify-center"
        style={currentView === 'list'
          ? { background: role.accent, color: '#fff' }
          : { color: 'rgba(255,255,255,0.7)' }}
        title="רשימה">
        <List className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <>
    <header className="no-print sticky top-0 z-40" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>

      {/* ══════════════════════ DESKTOP ══════════════════════ */}
      <div className="hidden md:block">

        {/* ── Topbar ─────────────────────────────────────────── */}
        <div className="flex items-center px-4 gap-3" style={{ background: role.topbarBg, height: 60 }}>

          {/* LEFT: Logo + name + subtitle + auth buttons */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <LogoLightbox src="/logo.png" alt="לוזניק" className="h-10 w-10 object-cover rounded-full" />
            <div className="leading-tight">
              <div className="text-white font-bold text-base leading-none">לוזניק</div>
              <div className="text-white/50 text-[10px] leading-none mt-0.5">לוח שנה בית ספרי</div>
            </div>

            {/* School year */}
            <select value={activeSchoolYearId} onChange={(e) => setActiveSchoolYear(e.target.value)}
              className="text-xs rounded-md px-2 py-1 focus:outline-none min-h-[32px]"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)' }}>
              {schoolYears.map((y) => (
                <option key={y.id} value={y.id} style={{ background: '#1a1a3e', color: '#fff' }}>{y.labelHebrew}</option>
              ))}
            </select>

            {/* Public: subtle login buttons */}
            {!isAdminMode && !isStaffMode && (
              <div className="flex items-center gap-1.5">
                <button onClick={() => setShowStaffLogin(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all"
                  style={{ border: '1px solid rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.07)' }}>
                  <Users className="w-3.5 h-3.5" />
                  כניסת צוות
                </button>
                <button onClick={() => setShowAdminLogin(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all"
                  style={{ border: '1px solid rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.07)' }}>
                  <LogIn className="w-3.5 h-3.5" />
                  כניסת מנהל
                </button>
              </div>
            )}

            {/* Staff logged in indicator */}
            {isStaffMode && !isAdminMode && (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 text-xs font-bold rounded-full" style={{ background: ROLE.staff.accent, color: '#fff' }}>
                  צוות — מחובר
                </span>
                <button onClick={handleLogout}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all"
                  style={{ background: 'rgba(255,80,80,0.15)', color: '#ff8888', border: '1px solid rgba(255,80,80,0.3)' }}>
                  <LogOut className="w-3 h-3" />
                  יציאה
                </button>
              </div>
            )}

            {/* Admin logged in indicator */}
            {isAdminMode && (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 text-xs font-bold rounded-full" style={{ background: ROLE.admin.accent, color: '#fff' }}>
                  מנהל — מחובר
                </span>
              </div>
            )}
          </div>

          {/* CENTER: Search */}
          <div className="flex-1 flex justify-center">
            <ToolbarSearch />
          </div>

          {/* RIGHT: View toggle + icons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <ViewToggle />

            {/* Export */}
            <div className="relative">
              <IconBtn onClick={() => setShowExportMenu(!showExportMenu)} title="ייצוא">
                <Download className="w-4 h-4" />
              </IconBtn>
              {showExportMenu && <ExportMenu onOpenPrintStudio={() => setShowPrintStudio(true)} />}
            </div>

            {/* Dark mode */}
            <IconBtn onClick={toggleDarkMode} title={isDarkMode ? 'מצב יום' : 'מצב לילה'}>
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </IconBtn>
          </div>
        </div>

        {/* ── Staff Action Banner ─────────────────────────────── */}
        {isStaffMode && !isAdminMode && (
          <div className="flex items-center justify-between px-5 py-2" style={{ background: ROLE.staff.bannerBg, borderBottom: `2px solid ${ROLE.staff.border}` }}>
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 text-xs font-bold rounded-md" style={{ background: 'rgba(0,136,238,0.2)', color: ROLE.staff.accent, border: `1px solid ${ROLE.staff.accent}` }}>
                👁 מצב צוות
              </span>
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>גישת צפייה בלבד</span>
            </div>
          </div>
        )}

        {/* ── Admin Action Banner ─────────────────────────────── */}
        {isAdminMode && (
          <div className="flex items-center justify-between px-5 py-2" style={{ background: ROLE.admin.bannerBg, borderBottom: `2px solid ${ROLE.admin.border}` }}>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowBulkEntry(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all"
                style={{ border: `1px solid ${ROLE.admin.accent}`, color: ROLE.admin.accent, background: 'transparent' }}>
                📋 הזנה שנתית
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => openCreateEvent()}
                className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-bold rounded-lg transition-all"
                style={{ background: `linear-gradient(135deg, #8844ff, #aa66ff)`, color: '#fff', boxShadow: `0 0 16px rgba(136,68,255,0.4)` }}>
                <Plus className="w-4 h-4" />
                הוספת אירוע
              </button>
              <button onClick={() => setShowAI(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all"
                style={{ border: `1px solid ${ROLE.admin.accent}`, color: ROLE.admin.accent, background: 'rgba(136,68,255,0.1)' }}>
                <Sparkles className="w-3.5 h-3.5" />
                AI
              </button>
              <button onClick={handleLogout}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all"
                style={{ background: 'rgba(255,80,80,0.15)', color: '#ff8888', border: '1px solid rgba(255,80,80,0.3)' }}>
                <LogOut className="w-3.5 h-3.5" />
                יציאה
              </button>
              <button onClick={() => setShowSettings(true)}
                className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
                style={{ color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.05)' }}>
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Subbar ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-900" style={{ borderBottom: '2px solid #e8eaff' }}>
          {/* LEFT: Month navigation */}
          <div className="flex items-center gap-1">
            <button onClick={navigatePrev} aria-label="הקודם"
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400">
              <ChevronRight className="w-5 h-5" />
            </button>
            <button onClick={navigateNext} aria-label="הבא"
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-base font-bold text-gray-800 dark:text-gray-200 min-w-[160px] px-2">
              {getDateLabel()}
            </span>
            <button onClick={navigateToday}
              className="px-3 py-1 text-xs font-semibold rounded-lg border transition-all"
              style={{ borderColor: role.accent, color: role.accent, background: 'transparent' }}>
              היום
            </button>
          </div>

          {/* RIGHT: Category filter + credit */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-300 dark:text-gray-600 ml-2 select-none">@Stone2026</span>

            {/* Category filter dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowCategoryFilter(!showCategoryFilter)}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg transition-all border"
                style={{
                  borderColor: selectedCategoryIds.length > 0 ? role.accent : '#e4e8ff',
                  color: selectedCategoryIds.length > 0 ? role.accent : '#94a3b8',
                  background: selectedCategoryIds.length > 0 ? `${role.accent}10` : 'transparent',
                }}>
                סינון קטגוריות
                {selectedCategoryIds.length > 0 && (
                  <span className="w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white"
                    style={{ background: role.accent }}>
                    {selectedCategoryIds.length}
                  </span>
                )}
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {showCategoryFilter && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowCategoryFilter(false)} />
                  <div className="absolute left-0 top-full mt-1 z-50 bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 p-2 min-w-[190px]">
                    {categories.map((cat) => {
                      const isActive = selectedCategoryIds.includes(cat.id);
                      return (
                        <button key={cat.id}
                          onClick={() => {
                            const newIds = isActive
                              ? selectedCategoryIds.filter((id) => id !== cat.id)
                              : [...selectedCategoryIds, cat.id];
                            setSelectedCategories(newIds);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-all text-right ${
                            isActive
                              ? `${cat.bgColor} ${cat.textColor}`
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
                          }`}>
                          {cat.label}
                          {isActive && <Check className="w-3 h-3 mr-auto flex-shrink-0" />}
                        </button>
                      );
                    })}
                    {selectedCategoryIds.length > 0 && (
                      <button
                        onClick={() => { setSelectedCategories([]); setShowCategoryFilter(false); }}
                        className="w-full mt-1 pt-1 border-t border-gray-100 dark:border-gray-700 text-[11px] text-gray-400 hover:text-red-500 text-center py-1.5 transition-colors">
                        נקה הכל
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════ MOBILE ══════════════════════ */}
      <div className="md:hidden" style={{ background: role.mobileBg }}>

        {/* Row 1: Logo + name | login buttons */}
        <div className="flex items-center justify-between px-3 pt-3 pb-1">
          <div className="flex items-center gap-2">
            <LogoLightbox src="/logo.png" alt="לוזניק" className="h-8 w-8 object-cover rounded-full" />
            <div>
              <div className="text-white font-bold text-sm leading-none">לוזניק</div>
              <div className="text-white/50 text-[10px] leading-none mt-0.5">לוח שנה בית ספרי · @Stone2026</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {!isAdminMode && !isStaffMode && (
              <>
                <button onClick={() => setShowStaffLogin(true)}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all"
                  style={{ border: '1px solid rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.08)' }}>
                  👩‍🏫 צוות
                </button>
                <button onClick={() => setShowAdminLogin(true)}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all"
                  style={{ border: '1px solid rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.08)' }}>
                  🏫 מנהל
                </button>
              </>
            )}
            {(isStaffMode || isAdminMode) && (
              <button onClick={handleLogout}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all"
                style={{ background: 'rgba(255,80,80,0.2)', color: '#ff9999', border: '1px solid rgba(255,80,80,0.3)' }}>
                <LogOut className="w-3.5 h-3.5 inline ml-0.5" />
                יציאה
              </button>
            )}
            <button onClick={toggleDarkMode} className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ color: 'rgba(255,255,255,0.7)' }}>
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Row 2: Navigation + date + school year + Today */}
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={navigatePrev} className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ color: 'rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.1)' }}>
              <ChevronRight className="w-5 h-5" />
            </button>
            <button onClick={navigateNext} className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ color: 'rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.1)' }}>
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
          <span className="text-white font-bold text-sm flex-1 text-center">{getDateLabel()}</span>
          {/* School year selector — mobile */}
          <select value={activeSchoolYearId} onChange={(e) => setActiveSchoolYear(e.target.value)}
            className="text-[11px] font-semibold rounded-lg px-2 py-1 focus:outline-none flex-shrink-0 min-h-[32px]"
            style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.9)' }}>
            {schoolYears.map((y) => (
              <option key={y.id} value={y.id} style={{ background: '#1a1a3e', color: '#fff' }}>{y.labelHebrew}</option>
            ))}
          </select>
          <button onClick={navigateToday}
            className="px-3 py-1 text-xs font-bold rounded-lg transition-all flex-shrink-0"
            style={{ background: role.accent, color: '#fff' }}>
            היום
          </button>
        </div>

        {/* Search */}
        <div className="px-3 pb-2">
          <ToolbarSearch full />
        </div>

        {/* View toggle pill */}
        <div className="flex justify-center pb-3">
          <div className="flex items-center rounded-xl overflow-hidden mx-3" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: 3 }}>
            {VIEWS.map((view) => (
              <button key={view} onClick={() => setView(view)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all min-h-[34px]"
                style={currentView === view
                  ? { background: role.accent, color: '#fff', borderRadius: 8, margin: '0 1px' }
                  : { color: 'rgba(255,255,255,0.65)' }}>
                {VIEW_LABELS[view]}
              </button>
            ))}
            <button onClick={() => setView(currentView === 'list' ? 'month' : 'list')}
              className="px-2 py-1.5 rounded-lg transition-all min-h-[34px] flex items-center"
              style={currentView === 'list'
                ? { background: role.accent, color: '#fff', borderRadius: 8, margin: '0 1px' }
                : { color: 'rgba(255,255,255,0.65)' }}>
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile role banner */}
        {isStaffMode && !isAdminMode && (
          <div className="flex items-center justify-center px-3 py-1.5" style={{ background: 'rgba(0,136,238,0.15)', borderTop: '1px solid rgba(0,136,238,0.3)' }}>
            <span className="text-xs font-bold" style={{ color: ROLE.staff.accent }}>👁 גישת צפייה בלבד</span>
          </div>
        )}
        {isAdminMode && (
          <div className="px-3 py-2 space-y-1.5" style={{ background: 'rgba(136,68,255,0.12)', borderTop: '1px solid rgba(136,68,255,0.3)' }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold" style={{ color: ROLE.admin.accent }}>🏫 מצב מנהל — עריכה מלאה</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => openCreateEvent()}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg flex-1 justify-center"
                style={{ background: `linear-gradient(135deg, #8844ff, #aa66ff)`, color: '#fff' }}>
                <Plus className="w-3.5 h-3.5" />
                הוספת אירוע
              </button>
              <button onClick={() => setShowAI(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg"
                style={{ border: `1px solid ${ROLE.admin.accent}`, color: ROLE.admin.accent, background: 'transparent' }}>
                <Sparkles className="w-3 h-3" />
                AI
              </button>
            </div>
          </div>
        )}
      </div>
    </header>

    {showSettings && <SettingsModal />}
    {showPrintStudio && <PrintStudio onClose={() => setShowPrintStudio(false)} />}
    {showAI && <AIEventModal onClose={() => setShowAI(false)} />}
    </>
  );
}
