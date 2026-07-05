import { useState } from 'react';
import { X, Plus, Save, Trash2, ArrowRight, Check } from 'lucide-react';
import { format } from 'date-fns';
import { useStore } from '../store/useStore';
import { Event } from '../types';
import { generateEventId, computeAudienceType } from '../utils/eventUtils';

interface BulkRow {
  id: string;
  title: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  allDay: boolean;
  layerIds: string[];
  categoryId: string;
  visibility: 'public' | 'staff' | 'admin';
  errors: Record<string, string>;
}

function createEmptyRow(): BulkRow {
  const today = format(new Date(), 'yyyy-MM-dd');
  return {
    id: crypto.randomUUID(),
    title: '',
    startDate: today,
    startTime: '08:00',
    endDate: today,
    endTime: '09:00',
    allDay: false,
    layerIds: [],
    categoryId: '',
    visibility: 'public' as const,
    errors: {},
  };
}

export default function BulkEntryPage() {
  const {
    schoolYears,
    activeSchoolYearId,
    layers,
    categories,
    addEventsBulk,
    setShowBulkEntry,
  } = useStore();

  const [rows, setRows] = useState<BulkRow[]>(() =>
    Array.from({ length: 5 }, createEmptyRow)
  );
  const [savedCount, setSavedCount] = useState<number | null>(null);

  const activeYear = schoolYears.find((y) => y.id === activeSchoolYearId);

  const updateRow = (id: string, field: keyof BulkRow, value: unknown) => {
    setRows((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, [field]: value, errors: { ...row.errors, [field]: '' } } : row
      )
    );
  };

  const toggleRowLayer = (rowId: string, layerId: string) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        const newLayerIds = row.layerIds.includes(layerId)
          ? row.layerIds.filter((id) => id !== layerId)
          : [...row.layerIds, layerId];
        return { ...row, layerIds: newLayerIds };
      })
    );
  };

  const addRow = () => setRows((prev) => [...prev, createEmptyRow()]);
  const removeRow = (id: string) => setRows((prev) => prev.filter((row) => row.id !== id));
  const clearTable = () => { setRows(Array.from({ length: 5 }, createEmptyRow)); setSavedCount(null); };

  const validateRow = (row: BulkRow): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!row.title.trim()) errs.title = 'חובה';
    if (!row.startDate) errs.startDate = 'חובה';
    if (!row.endDate) errs.endDate = 'חובה';
    if (row.startDate && row.endDate && row.startDate > row.endDate) errs.endDate = 'שגוי';
    if (!row.categoryId) errs.categoryId = 'חובה';
    return errs;
  };

  const handleSaveAll = () => {
    const updatedRows = rows.map((row) => ({ ...row, errors: validateRow(row) }));
    setRows(updatedRows);
    if (updatedRows.some((r) => Object.keys(r.errors).length > 0)) return;

    const newEvents: Event[] = updatedRows
      .filter((row) => row.title.trim())
      .map((row) => ({
        id: generateEventId(),
        title: row.title.trim(),
        description: '',
        schoolYearId: activeSchoolYearId,
        categoryId: row.categoryId,
        startDateTime: row.allDay ? `${row.startDate}T00:00:00` : `${row.startDate}T${row.startTime}:00`,
        endDateTime: row.allDay ? `${row.endDate}T23:59:00` : `${row.endDate}T${row.endTime}:00`,
        allDay: row.allDay,
        layerIds: row.layerIds,
        classIds: [],
        audienceType: computeAudienceType(row.layerIds, []),
        visibility: row.visibility,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

    addEventsBulk(newEvents);
    setSavedCount(newEvents.length);
    setRows(Array.from({ length: 5 }, createEmptyRow));
  };

  const errorClass = (hasError: boolean) =>
    `px-2 py-1 text-sm rounded border bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary-500 ${
      hasError ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
    }`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">הזנת אירועים שנתית - לוזניק</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">שנת לימודים {activeYear?.labelHebrew}</p>
          </div>
          <button
            onClick={() => setShowBulkEntry(false)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            חזרה ללוח
          </button>
        </div>

        {savedCount !== null && (
          <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700 rounded-lg">
            <Check className="w-5 h-5 text-primary-500" />
            <span className="text-sm font-medium text-primary-700 dark:text-primary-300">{savedCount} אירועים נשמרו בהצלחה!</span>
          </div>
        )}

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <th className="px-3 py-3 text-right font-semibold text-gray-700 dark:text-gray-300 w-48">כותרת *</th>
                  <th className="px-3 py-3 text-right font-semibold text-gray-700 dark:text-gray-300 w-32">התחלה *</th>
                  <th className="px-3 py-3 text-right font-semibold text-gray-700 dark:text-gray-300 w-24">שעת התחלה</th>
                  <th className="px-3 py-3 text-right font-semibold text-gray-700 dark:text-gray-300 w-32">סיום *</th>
                  <th className="px-3 py-3 text-right font-semibold text-gray-700 dark:text-gray-300 w-24">שעת סיום</th>
                  <th className="px-3 py-3 text-center font-semibold text-gray-700 dark:text-gray-300 w-20">כל היום</th>
                  <th className="px-3 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">שכבות</th>
                  <th className="px-3 py-3 text-right font-semibold text-gray-700 dark:text-gray-300 w-36">קטגוריה *</th>
                  <th className="px-3 py-3 text-right font-semibold text-gray-700 dark:text-gray-300 w-28">חשיפה</th>
                  <th className="px-3 py-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-3 py-2">
                      <input type="text" value={row.title} onChange={(e) => updateRow(row.id, 'title', e.target.value)}
                        className={`${errorClass(!!row.errors.title)} w-full`} placeholder="כותרת האירוע" />
                      {row.errors.title && <span className="text-xs text-red-500">{row.errors.title}</span>}
                    </td>
                    <td className="px-3 py-2">
                      <input type="date" value={row.startDate} onChange={(e) => updateRow(row.id, 'startDate', e.target.value)}
                        className={errorClass(!!row.errors.startDate)} />
                    </td>
                    <td className="px-3 py-2">
                      <input type="time" value={row.startTime} onChange={(e) => updateRow(row.id, 'startTime', e.target.value)}
                        disabled={row.allDay} className={`${errorClass(false)} ${row.allDay ? 'opacity-40 cursor-not-allowed' : ''}`} />
                    </td>
                    <td className="px-3 py-2">
                      <input type="date" value={row.endDate} onChange={(e) => updateRow(row.id, 'endDate', e.target.value)}
                        className={errorClass(!!row.errors.endDate)} />
                      {row.errors.endDate && <span className="text-xs text-red-500">{row.errors.endDate}</span>}
                    </td>
                    <td className="px-3 py-2">
                      <input type="time" value={row.endTime} onChange={(e) => updateRow(row.id, 'endTime', e.target.value)}
                        disabled={row.allDay} className={`${errorClass(false)} ${row.allDay ? 'opacity-40 cursor-not-allowed' : ''}`} />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input type="checkbox" checked={row.allDay} onChange={(e) => updateRow(row.id, 'allDay', e.target.checked)}
                        className="w-4 h-4 rounded text-primary-500 focus:ring-primary-500" />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {layers.map((layer) => (
                          <button key={layer.id} type="button" onClick={() => toggleRowLayer(row.id, layer.id)}
                            className={`px-1.5 py-0.5 text-xs font-medium rounded transition-colors ${
                              row.layerIds.includes(layer.id)
                                ? `${layer.color} ${layer.textColor}`
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}>
                            {layer.name}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <select value={row.categoryId} onChange={(e) => updateRow(row.id, 'categoryId', e.target.value)}
                        className={errorClass(!!row.errors.categoryId)}>
                        <option value="">-- קטגוריה --</option>
                        {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
                      </select>
                      {row.errors.categoryId && <span className="text-xs text-red-500">{row.errors.categoryId}</span>}
                    </td>
                    <td className="px-3 py-2">
                      <select value={row.visibility} onChange={(e) => updateRow(row.id, 'visibility', e.target.value)}
                        className={errorClass(false)}>
                        <option value="public">ציבורי</option>
                        <option value="staff">צוות</option>
                        <option value="admin">מנהל</option>
                      </select>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button onClick={() => removeRow(row.id)}
                        className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="הסר שורה">
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <button onClick={addRow}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border-2 border-dashed border-primary-300 dark:border-primary-700 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
            <Plus className="w-4 h-4" />
            הוספת שורה
          </button>
          <div className="flex gap-2">
            <button onClick={clearTable}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <Trash2 className="w-4 h-4" />
              נקה טבלה
            </button>
            <button onClick={handleSaveAll}
              className="flex items-center gap-1.5 px-5 py-2 text-sm font-bold rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors">
              <Save className="w-4 h-4" />
              שמור הכל
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-600 mt-3 text-center">
          שדות המסומנים ב-* הם חובה. שורות ריקות (ללא כותרת) לא יישמרו.
        </p>
      </div>
    </div>
  );
}
