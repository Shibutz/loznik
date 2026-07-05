import { create } from 'zustand';
import {
  addDays, addWeeks, addMonths, addYears,
  subDays, subWeeks, subMonths, subYears,
} from 'date-fns';
import { ViewMode, UserRole, SchoolYear, Layer, SchoolClass, Category, Event } from '../types';
import { defaultSchoolYears, defaultLayers, defaultClasses, defaultCategories, defaultEvents } from '../data/defaults';
import {
  fetchAllData, seedDefaults,
  dbInsertEvent, dbUpdateEvent, dbDeleteEvent, dbBulkInsertEvents,
  dbUpsertLayer, dbDeleteLayer,
  dbUpsertCategory, dbDeleteCategory,
} from '../lib/firestoreService';
import { setOneSignalRole } from '../lib/onesignal';

interface AppState {
  // Data
  schoolYears: SchoolYear[];
  layers: Layer[];
  classes: SchoolClass[];
  categories: Category[];
  events: Event[];

  // Loading
  isLoading: boolean;

  // UI State
  currentView: ViewMode;
  currentDate: Date;
  activeSchoolYearId: string;
  userRole: UserRole;
  isAdminMode: boolean;   // NOT persisted — security requirement
  isStaffMode: boolean;   // NOT persisted — security requirement
  isDarkMode: boolean;

  // Filters
  selectedLayerIds: string[];
  selectedClassIds: string[];
  selectedCategoryIds: string[];
  searchQuery: string;

  // Modals
  showEventModal: boolean;
  editingEvent: Event | null;
  showAdminLogin: boolean;
  showStaffLogin: boolean;
  showBulkEntry: boolean;
  showExportMenu: boolean;
  showSettings: boolean;

  // Actions
  initializeFromFirebase: () => Promise<void>;
  setView: (view: ViewMode) => void;
  setCurrentDate: (date: Date) => void;
  navigatePrev: () => void;
  navigateNext: () => void;
  navigateToday: () => void;
  setActiveSchoolYear: (id: string) => void;
  toggleAdminMode: () => void;
  setAdminMode: (value: boolean) => void;
  setStaffMode: (value: boolean) => void;
  toggleDarkMode: () => void;
  setSelectedLayers: (ids: string[]) => void;
  setSelectedClasses: (ids: string[]) => void;
  setSelectedCategories: (ids: string[]) => void;
  setSearchQuery: (q: string) => void;
  resetFilters: () => void;
  addEvent: (event: Event) => void;
  updateEvent: (event: Event) => void;
  deleteEvent: (id: string) => void;
  addEventsBulk: (events: Event[]) => void;
  openCreateEvent: (date?: Date) => void;
  openEditEvent: (event: Event) => void;
  closeEventModal: () => void;
  setShowAdminLogin: (show: boolean) => void;
  setShowStaffLogin: (show: boolean) => void;
  setShowBulkEntry: (show: boolean) => void;
  setShowExportMenu: (show: boolean) => void;
  setShowSettings: (show: boolean) => void;
  addCategory: (category: Category) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;
  addLayer: (layer: Layer) => void;
  updateLayer: (layer: Layer) => void;
  deleteLayer: (id: string) => void;
}

// isDarkMode persisted via localStorage (lightweight, not security-sensitive)
function loadDarkMode(): boolean {
  try { return localStorage.getItem('loznik-dark') === 'true'; } catch { return false; }
}
function saveDarkMode(v: boolean) {
  try { localStorage.setItem('loznik-dark', String(v)); } catch { /* ignore */ }
}

export const useStore = create<AppState>()((set, get) => ({
  // Data
  schoolYears: defaultSchoolYears,
  layers: defaultLayers,
  classes: defaultClasses,
  categories: defaultCategories,
  events: defaultEvents,

  // Loading
  isLoading: true,

  // UI State
  currentView: 'month',
  currentDate: new Date(),
  activeSchoolYearId: 'sy-2025',
  userRole: 'public',
  isAdminMode: false,   // NEVER persisted
  isStaffMode: false,   // NEVER persisted
  isDarkMode: loadDarkMode(),

  // Filters
  selectedLayerIds: [],
  selectedClassIds: [],
  selectedCategoryIds: [],
  searchQuery: '',

  // Modals
  showEventModal: false,
  editingEvent: null,
  showAdminLogin: false,
  showStaffLogin: false,
  showBulkEntry: false,
  showExportMenu: false,
  showSettings: false,

  // ── Initialize ───────────────────────────────────────────────────────────────

  initializeFromFirebase: async () => {
    set({ isLoading: true });
    try {
      const data = await fetchAllData();

      const isEmpty =
        data.events.length === 0 &&
        data.categories.length === 0 &&
        data.layers.length === 0 &&
        data.classes.length === 0;

      if (isEmpty) {
        // First run — seed the DB with defaults, then use defaults in state
        await seedDefaults(defaultEvents, defaultCategories, defaultLayers, defaultClasses);
        set({
          events: defaultEvents,
          categories: defaultCategories,
          layers: defaultLayers,
          classes: defaultClasses,
          isLoading: false,
        });
      } else {
        set({
          events: data.events,
          categories: data.categories.length > 0 ? data.categories : defaultCategories,
          layers: data.layers.length > 0 ? data.layers : defaultLayers,
          classes: data.classes.length > 0 ? data.classes : defaultClasses,
          isLoading: false,
        });
      }
    } catch (err) {
      console.error('Firestore init failed, using defaults:', err);
      set({ isLoading: false });
    }
  },

  // ── Navigation ───────────────────────────────────────────────────────────────

  setView: (view) => set({ currentView: view }),
  setCurrentDate: (date) => set({ currentDate: date }),

  navigatePrev: () => {
    const { currentView, currentDate } = get();
    let newDate: Date;
    switch (currentView) {
      case 'day':   newDate = subDays(currentDate, 1);   break;
      case 'week':  newDate = subWeeks(currentDate, 1);  break;
      case 'month': newDate = subMonths(currentDate, 1); break;
      case 'year':  newDate = subYears(currentDate, 1);  break;
      default:      newDate = subMonths(currentDate, 1);
    }
    set({ currentDate: newDate });
  },

  navigateNext: () => {
    const { currentView, currentDate } = get();
    let newDate: Date;
    switch (currentView) {
      case 'day':   newDate = addDays(currentDate, 1);   break;
      case 'week':  newDate = addWeeks(currentDate, 1);  break;
      case 'month': newDate = addMonths(currentDate, 1); break;
      case 'year':  newDate = addYears(currentDate, 1);  break;
      default:      newDate = addMonths(currentDate, 1);
    }
    set({ currentDate: newDate });
  },

  navigateToday: () => set({ currentDate: new Date() }),
  setActiveSchoolYear: (id) => {
    const sy = get().schoolYears.find((y) => y.id === id);
    const newState: Partial<AppState> = { activeSchoolYearId: id };
    if (sy) newState.currentDate = new Date(sy.startDate);
    set(newState);
  },

  // ── Auth (never persisted) ───────────────────────────────────────────────────

  toggleAdminMode: () => {
    const next = !get().isAdminMode;
    set({ isAdminMode: next, userRole: next ? 'admin' : 'public', isStaffMode: next });
  },

  setAdminMode: (value) => set({
    isAdminMode: value,
    userRole: value ? 'admin' : 'public',
    isStaffMode: value,
  }),

  setStaffMode: (value) => {
    set({
      isAdminMode: false,
      userRole: value ? 'staff' : 'public',
      isStaffMode: value,
    });
    // On successful staff login, upgrade the push tag to "staff" (never reverted).
    if (value) setOneSignalRole('staff');
  },

  // ── Dark mode (persisted via localStorage) ───────────────────────────────────

  toggleDarkMode: () => {
    const newDark = !get().isDarkMode;
    if (newDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    saveDarkMode(newDark);
    set({ isDarkMode: newDark });
  },

  // ── Filters ──────────────────────────────────────────────────────────────────

  setSelectedLayers: (ids) => set({ selectedLayerIds: ids }),
  setSelectedClasses: (ids) => set({ selectedClassIds: ids }),
  setSelectedCategories: (ids) => set({ selectedCategoryIds: ids }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  resetFilters: () =>
    set({ selectedLayerIds: [], selectedClassIds: [], selectedCategoryIds: [], searchQuery: '' }),

  // ── Events CRUD ──────────────────────────────────────────────────────────────

  addEvent: (event) => {
    set((state) => ({ events: [...state.events, event] }));
    dbInsertEvent(event).catch((err) => console.error('addEvent DB error', err));
  },

  updateEvent: (event) => {
    set((state) => ({ events: state.events.map((e) => (e.id === event.id ? event : e)) }));
    dbUpdateEvent(event).catch((err) => console.error('updateEvent DB error', err));
  },

  deleteEvent: (id) => {
    set((state) => ({ events: state.events.filter((e) => e.id !== id) }));
    dbDeleteEvent(id).catch((err) => console.error('deleteEvent DB error', err));
  },

  addEventsBulk: (events) => {
    set((state) => ({ events: [...state.events, ...events] }));
    dbBulkInsertEvents(events).catch((err) => console.error('bulkInsert DB error', err));
  },

  // ── Event modal ──────────────────────────────────────────────────────────────

  openCreateEvent: (date) => {
    set({
      editingEvent: date
        ? {
            id: '',
            title: '',
            description: '',
            schoolYearId: get().activeSchoolYearId,
            categoryId: '',
            startDateTime: date.toISOString(),
            endDateTime: date.toISOString(),
            allDay: true,
            layerIds: [],
            classIds: [],
            audienceType: 'school',
            visibility: 'public',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
        : null,
      showEventModal: true,
    });
  },

  openEditEvent: (event) => set({ editingEvent: event, showEventModal: true }),
  closeEventModal: () => set({ showEventModal: false, editingEvent: null }),

  // ── Modal toggles ────────────────────────────────────────────────────────────

  setShowAdminLogin: (show) => set({ showAdminLogin: show }),
  setShowStaffLogin: (show) => set({ showStaffLogin: show }),
  setShowBulkEntry: (show) => set({ showBulkEntry: show }),
  setShowExportMenu: (show) => set({ showExportMenu: show }),
  setShowSettings: (show) => set({ showSettings: show }),

  // ── Categories CRUD ──────────────────────────────────────────────────────────

  addCategory: (category) => {
    set((state) => ({ categories: [...state.categories, category] }));
    dbUpsertCategory(category).catch((err) => console.error('addCategory DB error', err));
  },
  updateCategory: (category) => {
    set((state) => ({ categories: state.categories.map((c) => c.id === category.id ? category : c) }));
    dbUpsertCategory(category).catch((err) => console.error('updateCategory DB error', err));
  },
  deleteCategory: (id) => {
    set((state) => ({ categories: state.categories.filter((c) => c.id !== id) }));
    dbDeleteCategory(id).catch((err) => console.error('deleteCategory DB error', err));
  },

  // ── Layers CRUD ──────────────────────────────────────────────────────────────

  addLayer: (layer) => {
    set((state) => ({ layers: [...state.layers, layer] }));
    dbUpsertLayer(layer).catch((err) => console.error('addLayer DB error', err));
  },
  updateLayer: (layer) => {
    set((state) => ({ layers: state.layers.map((l) => l.id === layer.id ? layer : l) }));
    dbUpsertLayer(layer).catch((err) => console.error('updateLayer DB error', err));
  },
  deleteLayer: (id) => {
    set((state) => ({ layers: state.layers.filter((l) => l.id !== id) }));
    dbDeleteLayer(id).catch((err) => console.error('deleteLayer DB error', err));
  },
}));
