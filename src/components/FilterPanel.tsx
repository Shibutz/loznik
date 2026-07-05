import { useState } from 'react';
import { Filter, X, Check, ChevronDown } from 'lucide-react';
import { useStore } from '../store/useStore';

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// Map layer Tailwind color classes to CSS hex for pill borders/fills
const LAYER_HEX: Record<string, { bg: string; text: string; border: string }> = {
  'bg-violet-100': { bg: '#7c3aed', text: '#ffffff', border: '#7c3aed' },
  'bg-blue-100':   { bg: '#2563eb', text: '#ffffff', border: '#2563eb' },
  'bg-green-100':  { bg: '#16a34a', text: '#ffffff', border: '#16a34a' },
  'bg-yellow-100': { bg: '#ca8a04', text: '#ffffff', border: '#ca8a04' },
  'bg-orange-100': { bg: '#ea580c', text: '#ffffff', border: '#ea580c' },
  'bg-red-100':    { bg: '#dc2626', text: '#ffffff', border: '#dc2626' },
  'bg-pink-100':   { bg: '#db2777', text: '#ffffff', border: '#db2777' },
  'bg-primary-100':   { bg: '#0d9488', text: '#ffffff', border: '#0d9488' },
  'bg-indigo-100': { bg: '#4f46e5', text: '#ffffff', border: '#4f46e5' },
  'bg-cyan-100':   { bg: '#0891b2', text: '#ffffff', border: '#0891b2' },
};

function getLayerStyle(colorClass: string, selected: boolean) {
  const entry = Object.entries(LAYER_HEX).find(([k]) => colorClass.startsWith(k));
  if (!entry) {
    return selected
      ? { backgroundColor: '#0d9488', color: '#fff', border: '2px solid #0d9488' }
      : { backgroundColor: 'transparent', color: '#6b7280', border: '2px solid #d1d5db' };
  }
  const { bg, text, border } = entry[1];
  return selected
    ? { backgroundColor: bg, color: text, border: `2px solid ${border}` }
    : { backgroundColor: 'transparent', color: border, border: `2px solid ${border}` };
}

export default function FilterPanel({ isOpen, onClose }: FilterPanelProps) {
  const {
    layers,
    classes,
    categories,
    selectedLayerIds,
    selectedClassIds,
    selectedCategoryIds,
    setSelectedLayers,
    setSelectedClasses,
    setSelectedCategories,
    resetFilters,
  } = useStore();

  const [localLayerIds, setLocalLayerIds] = useState<string[]>(selectedLayerIds);
  const [localClassIds, setLocalClassIds] = useState<string[]>(selectedClassIds);
  const [localCategoryIds, setLocalCategoryIds] = useState<string[]>(selectedCategoryIds);

  const toggleLayer = (id: string) => {
    setLocalLayerIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      const layerClassIds = classes
        .filter((c) => next.includes(c.layerId))
        .map((c) => c.id);
      setLocalClassIds((cls) => cls.filter((cid) => layerClassIds.includes(cid)));
      return next;
    });
  };

  const toggleClass = (id: string) => {
    setLocalClassIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleCategory = (id: string) => {
    setLocalCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAllLayers = () => {
    const allIds = layers.map((l) => l.id);
    setLocalLayerIds(allIds);
  };

  const clearAllLayers = () => {
    setLocalLayerIds([]);
    setLocalClassIds([]);
  };

  const selectAllClasses = () => {
    const visibleClassIds = filteredClasses.map((c) => c.id);
    setLocalClassIds(visibleClassIds);
  };

  const clearAllClasses = () => setLocalClassIds([]);

  const selectAllCategories = () => setLocalCategoryIds(categories.map((c) => c.id));
  const clearAllCategories = () => setLocalCategoryIds([]);

  const applyFilters = () => {
    setSelectedLayers(localLayerIds);
    setSelectedClasses(localClassIds);
    setSelectedCategories(localCategoryIds);
    onClose();
  };

  const handleReset = () => {
    setLocalLayerIds([]);
    setLocalClassIds([]);
    setLocalCategoryIds([]);
    resetFilters();
    onClose();
  };

  const activeFilterCount =
    selectedLayerIds.length + selectedClassIds.length + selectedCategoryIds.length;

  const localActiveCount =
    localLayerIds.length + localClassIds.length + localCategoryIds.length;

  const filteredClasses = localLayerIds.length > 0
    ? classes.filter((c) => localLayerIds.includes(c.layerId))
    : [];

  const panelContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
            <Filter className="w-4 h-4 text-primary-600 dark:text-primary-400" />
          </div>
          <span className="font-bold text-gray-900 dark:text-gray-100 text-base">סינון</span>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold bg-primary-500 text-white rounded-full shadow-sm">
              {activeFilterCount}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label="סגור"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">

        {/* ── Layers section ── */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">שכבות</h3>
            <div className="flex gap-2">
              <button
                onClick={selectAllLayers}
                className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-medium"
              >
                בחר הכל
              </button>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <button
                onClick={clearAllLayers}
                className="text-xs text-gray-500 dark:text-gray-400 hover:underline font-medium"
              >
                נקה הכל
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {layers.map((layer) => {
              const selected = localLayerIds.includes(layer.id);
              const style = getLayerStyle(layer.color, selected);
              return (
                <button
                  key={layer.id}
                  onClick={() => toggleLayer(layer.id)}
                  style={style}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-semibold rounded-full transition-all duration-150 hover:scale-105 hover:shadow-md min-h-[36px]"
                >
                  {selected && <Check className="w-3.5 h-3.5" />}
                  שכבת {layer.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Classes section - expands when layers selected ── */}
        {localLayerIds.length > 0 && filteredClasses.length > 0 && (
          <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 p-3">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-1.5">
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">כיתות</h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={selectAllClasses}
                  className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-medium"
                >
                  בחר הכל
                </button>
                <span className="text-gray-300 dark:text-gray-600">|</span>
                <button
                  onClick={clearAllClasses}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:underline font-medium"
                >
                  נקה הכל
                </button>
              </div>
            </div>

            {localLayerIds.map((layerId) => {
              const layer = layers.find((l) => l.id === layerId);
              const layerClasses = filteredClasses.filter((c) => c.layerId === layerId);
              if (!layer || layerClasses.length === 0) return null;
              return (
                <div key={layerId} className="mb-3 last:mb-0">
                  <div
                    style={getLayerStyle(layer.color, true)}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold mb-2"
                  >
                    שכבת {layer.name}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {layerClasses.map((cls) => {
                      const selected = localClassIds.includes(cls.id);
                      const style = getLayerStyle(layer.color, selected);
                      return (
                        <button
                          key={cls.id}
                          onClick={() => toggleClass(cls.id)}
                          style={style}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full transition-all duration-150 hover:scale-105 hover:shadow-sm min-h-[28px]"
                        >
                          {selected && <Check className="w-3 h-3" />}
                          {cls.displayName}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Categories section ── */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">קטגוריות</h3>
            <div className="flex gap-2">
              <button
                onClick={selectAllCategories}
                className="text-xs text-primary-600 dark:text-primary-400 hover:underline font-medium"
              >
                בחר הכל
              </button>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <button
                onClick={clearAllCategories}
                className="text-xs text-gray-500 dark:text-gray-400 hover:underline font-medium"
              >
                נקה הכל
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const selected = localCategoryIds.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-semibold rounded-full transition-all duration-150 hover:scale-105 hover:shadow-md min-h-[36px] ${
                    selected
                      ? `${cat.bgColor} ${cat.textColor} ring-2 ring-offset-1 ring-current shadow-sm`
                      : 'bg-transparent border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  {selected && <Check className="w-3.5 h-3.5" />}
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 space-y-2">
        <button
          onClick={applyFilters}
          className="w-full py-2.5 text-sm font-bold rounded-xl bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 shadow-sm hover:shadow-md transition-all duration-150"
        >
          החל סינון
          {localActiveCount > 0 && (
            <span className="mr-2 px-1.5 py-0.5 text-xs bg-white/20 rounded-full">{localActiveCount}</span>
          )}
        </button>
        {(localLayerIds.length > 0 || localClassIds.length > 0 || localCategoryIds.length > 0) && (
          <button
            onClick={handleReset}
            className="w-full py-2 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            איפוס סינון
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar - fixed width */}
      <aside
        className={`hidden md:flex flex-col bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 transition-all duration-300 overflow-hidden ${
          isOpen ? 'w-64' : 'w-0'
        }`}
      >
        {isOpen && panelContent}
      </aside>

      {/* Mobile bottom sheet */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-2xl max-h-[85vh] flex flex-col shadow-2xl">
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
            </div>
            {panelContent}
          </div>
        </div>
      )}
    </>
  );
}

export function FilterToggleButton() {
  const { selectedLayerIds, selectedClassIds, selectedCategoryIds } = useStore();
  const activeCount = selectedLayerIds.length + selectedClassIds.length + selectedCategoryIds.length;

  return (
    <div className="relative inline-flex">
      <Filter className="w-4 h-4" />
      {activeCount > 0 && (
        <span className="absolute -top-1.5 -left-1.5 w-4 h-4 text-[10px] font-bold bg-primary-500 text-white rounded-full flex items-center justify-center">
          {activeCount}
        </span>
      )}
    </div>
  );
}
