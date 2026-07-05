import { useState } from 'react';
import { X, Pencil, Trash2, Plus, Check } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Category, Layer } from '../types';

const COLOR_OPTIONS = [
  { name: 'אדום',     bg: 'bg-red-100',    text: 'text-red-800',    hex: '#fecaca' },
  { name: 'כתום',    bg: 'bg-orange-100',  text: 'text-orange-800', hex: '#fed7aa' },
  { name: 'צהוב',    bg: 'bg-amber-100',   text: 'text-amber-800',  hex: '#fde68a' },
  { name: 'ירוק',    bg: 'bg-green-100',   text: 'text-green-800',  hex: '#bbf7d0' },
  { name: 'טורקיז',  bg: 'bg-primary-100',    text: 'text-primary-800',   hex: '#99f6e4' },
  { name: 'כחול',    bg: 'bg-blue-100',    text: 'text-blue-800',   hex: '#bfdbfe' },
  { name: 'סגול',    bg: 'bg-violet-100',  text: 'text-violet-800', hex: '#ddd6fe' },
  { name: 'ורוד',    bg: 'bg-pink-100',    text: 'text-pink-800',   hex: '#fbcfe8' },
  { name: 'אינדיגו', bg: 'bg-indigo-100',  text: 'text-indigo-800', hex: '#c7d2fe' },
  { name: 'אפור',    bg: 'bg-gray-100',    text: 'text-gray-800',   hex: '#f3f4f6' },
];

type Tab = 'categories' | 'layers';

interface InlineFormState {
  label: string;
  colorIdx: number;
  editingId: string | null;
}

const EMPTY_FORM: InlineFormState = { label: '', colorIdx: 0, editingId: null };

export default function SettingsModal() {
  const {
    categories,
    layers,
    events,
    setShowSettings,
    addCategory,
    updateCategory,
    deleteCategory,
    addLayer,
    updateLayer,
    deleteLayer,
  } = useStore();

  const [tab, setTab] = useState<Tab>('categories');
  const [catForm, setCatForm] = useState<InlineFormState | null>(null);
  const [layerForm, setLayerForm] = useState<InlineFormState | null>(null);

  // ── helpers ──────────────────────────────────────────────
  const categoryInUse = (id: string) => events.some((e) => e.categoryId === id);
  const layerInUse = (id: string) => events.some((e) => e.layerIds.includes(id));

  // ── Category handlers ─────────────────────────────────────
  const openAddCategory = () =>
    setCatForm({ ...EMPTY_FORM });

  const openEditCategory = (cat: Category) => {
    const idx = COLOR_OPTIONS.findIndex(
      (c) => c.bg === cat.bgColor && c.text === cat.textColor
    );
    setCatForm({ label: cat.label, colorIdx: idx >= 0 ? idx : 0, editingId: cat.id });
  };

  const saveCategoryForm = () => {
    if (!catForm || !catForm.label.trim()) return;
    const col = COLOR_OPTIONS[catForm.colorIdx];
    if (catForm.editingId) {
      const existing = categories.find((c) => c.id === catForm.editingId)!;
      updateCategory({
        ...existing,
        label: catForm.label.trim(),
        color: `${col.bg} ${col.text}`,
        bgColor: col.bg,
        textColor: col.text,
      });
    } else {
      addCategory({
        id: crypto.randomUUID(),
        label: catForm.label.trim(),
        color: `${col.bg} ${col.text}`,
        bgColor: col.bg,
        textColor: col.text,
        sortOrder: categories.length + 1,
      });
    }
    setCatForm(null);
  };

  const handleDeleteCategory = (cat: Category) => {
    if (!window.confirm(`למחוק את "${cat.label}"?`)) return;
    deleteCategory(cat.id);
  };

  // ── Layer handlers ────────────────────────────────────────
  const openAddLayer = () =>
    setLayerForm({ ...EMPTY_FORM });

  const openEditLayer = (layer: Layer) => {
    const idx = COLOR_OPTIONS.findIndex((c) => layer.color.includes(c.bg.replace('bg-', '')));
    setLayerForm({ label: layer.name, colorIdx: idx >= 0 ? idx : 0, editingId: layer.id });
  };

  const saveLayerForm = () => {
    if (!layerForm || !layerForm.label.trim()) return;
    const col = COLOR_OPTIONS[layerForm.colorIdx];
    const darkColor = `dark:${col.bg.replace('100', '900')}`;
    if (layerForm.editingId) {
      const existing = layers.find((l) => l.id === layerForm.editingId)!;
      updateLayer({
        ...existing,
        name: layerForm.label.trim(),
        color: col.bg,
        textColor: col.text,
        darkColor,
      });
    } else {
      addLayer({
        id: crypto.randomUUID(),
        name: layerForm.label.trim(),
        order: layers.length + 1,
        color: col.bg,
        textColor: col.text,
        darkColor,
      });
    }
    setLayerForm(null);
  };

  const handleDeleteLayer = (layer: Layer) => {
    if (!window.confirm(`למחוק את "${layer.name}"?`)) return;
    deleteLayer(layer.id);
  };

  // ── Color picker ──────────────────────────────────────────
  const ColorPicker = ({
    selected,
    onChange,
  }: {
    selected: number;
    onChange: (idx: number) => void;
  }) => (
    <div className="flex flex-wrap gap-2 mt-2">
      {COLOR_OPTIONS.map((c, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          title={c.name}
          className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
            selected === i ? 'border-primary-500 scale-110' : 'border-transparent'
          }`}
          style={{ backgroundColor: c.hex }}
        >
          {selected === i && (
            <Check className="w-3.5 h-3.5 mx-auto text-gray-700" />
          )}
        </button>
      ))}
    </div>
  );

  // ── Inline form ───────────────────────────────────────────
  const InlineForm = ({
    form,
    setForm,
    onSave,
    placeholder,
  }: {
    form: InlineFormState;
    setForm: (f: InlineFormState | null) => void;
    onSave: () => void;
    placeholder: string;
  }) => (
    <div className="mt-3 p-3 rounded-xl border border-primary-200 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20 space-y-2">
      <input
        autoFocus
        type="text"
        value={form.label}
        onChange={(e) => setForm({ ...form, label: e.target.value })}
        onKeyDown={(e) => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') setForm(null); }}
        placeholder={placeholder}
        className="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
      />
      <ColorPicker selected={form.colorIdx} onChange={(idx) => setForm({ ...form, colorIdx: idx })} />
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onSave}
          disabled={!form.label.trim()}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 transition-colors"
        >
          שמירה
        </button>
        <button
          type="button"
          onClick={() => setForm(null)}
          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
        >
          ביטול
        </button>
        {/* preview badge */}
        {form.label.trim() && (
          <span className={`self-center px-2 py-0.5 text-xs font-semibold rounded-full ${COLOR_OPTIONS[form.colorIdx].bg} ${COLOR_OPTIONS[form.colorIdx].text}`}>
            {form.label}
          </span>
        )}
      </div>
    </div>
  );

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => setShowSettings(false)}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">הגדרות</h2>
          <button
            onClick={() => setShowSettings(false)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          {(['categories', 'layers'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                tab === t
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {t === 'categories' ? 'קטגוריות' : 'שכבות'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-2">

          {/* ── CATEGORIES TAB ── */}
          {tab === 'categories' && (
            <>
              {categories
                .slice()
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((cat) => {
                  const inUse = categoryInUse(cat.id);
                  const isEditing = catForm?.editingId === cat.id;
                  return (
                    <div key={cat.id}>
                      <div className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${cat.bgColor} ${cat.textColor}`}>
                          {cat.label}
                        </span>
                        <div className="flex-1" />
                        <button
                          onClick={() => isEditing ? setCatForm(null) : openEditCategory(cat)}
                          className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                          title="עריכה"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => !inUse && handleDeleteCategory(cat)}
                          disabled={inUse}
                          title={inUse ? 'בשימוש' : 'מחיקה'}
                          className={`p-1.5 rounded-lg transition-colors ${
                            inUse
                              ? 'opacity-30 cursor-not-allowed text-gray-400'
                              : 'hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 hover:text-red-600'
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {isEditing && catForm && (
                        <InlineForm
                          form={catForm}
                          setForm={setCatForm}
                          onSave={saveCategoryForm}
                          placeholder="שם קטגוריה"
                        />
                      )}
                    </div>
                  );
                })}

              {/* Add form or button */}
              {catForm && !catForm.editingId ? (
                <InlineForm
                  form={catForm}
                  setForm={setCatForm}
                  onSave={saveCategoryForm}
                  placeholder="שם קטגוריה"
                />
              ) : (
                <button
                  onClick={openAddCategory}
                  className="mt-2 w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl border border-dashed border-primary-300 dark:border-primary-700 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  הוספת קטגוריה
                </button>
              )}
            </>
          )}

          {/* ── LAYERS TAB ── */}
          {tab === 'layers' && (
            <>
              {layers
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((layer) => {
                  const inUse = layerInUse(layer.id);
                  const isEditing = layerForm?.editingId === layer.id;
                  return (
                    <div key={layer.id}>
                      <div className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${layer.color} ${layer.textColor}`}>
                          {layer.name}
                        </span>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          שכבת {layer.name}
                        </span>
                        <div className="flex-1" />
                        <button
                          onClick={() => isEditing ? setLayerForm(null) : openEditLayer(layer)}
                          className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                          title="עריכה"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => !inUse && handleDeleteLayer(layer)}
                          disabled={inUse}
                          title={inUse ? 'בשימוש' : 'מחיקה'}
                          className={`p-1.5 rounded-lg transition-colors ${
                            inUse
                              ? 'opacity-30 cursor-not-allowed text-gray-400'
                              : 'hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 hover:text-red-600'
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {isEditing && layerForm && (
                        <InlineForm
                          form={layerForm}
                          setForm={setLayerForm}
                          onSave={saveLayerForm}
                          placeholder="שם שכבה (למשל: יג)"
                        />
                      )}
                    </div>
                  );
                })}

              {/* Add form or button */}
              {layerForm && !layerForm.editingId ? (
                <InlineForm
                  form={layerForm}
                  setForm={setLayerForm}
                  onSave={saveLayerForm}
                  placeholder="שם שכבה (למשל: יג)"
                />
              ) : (
                <button
                  onClick={openAddLayer}
                  className="mt-2 w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl border border-dashed border-primary-300 dark:border-primary-700 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  הוספת שכבה
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
