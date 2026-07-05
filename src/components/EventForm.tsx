import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { useStore } from '../store/useStore';
import { Event, Layer, SchoolClass, Category, EventVisibility } from '../types';
import { generateEventId, computeAudienceType, checkExamOverload } from '../utils/eventUtils';

interface EventFormProps {
  event: Event | null;
  onSave: (event: Event) => void;
  onCancel: () => void;
}

function toDateInputValue(isoStr: string): string {
  try { return format(parseISO(isoStr), 'yyyy-MM-dd'); } catch { return format(new Date(), 'yyyy-MM-dd'); }
}
function toTimeInputValue(isoStr: string): string {
  try { return format(parseISO(isoStr), 'HH:mm'); } catch { return '08:00'; }
}

const VISIBILITY_OPTIONS: { value: EventVisibility; label: string; desc: string; color: string }[] = [
  { value: 'public', label: 'ציבורי',      desc: 'כולם רואים',              color: 'text-green-600 dark:text-green-400' },
  { value: 'staff',  label: 'צוות בלבד',   desc: 'מורים ומנהלים',           color: 'text-blue-600 dark:text-blue-400'  },
  { value: 'admin',  label: 'מנהלים בלבד', desc: 'גלוי רק למחוברים כמנהל', color: 'text-amber-600 dark:text-amber-400' },
];

export default function EventForm({ event, onSave, onCancel }: EventFormProps) {
  const { layers, classes, categories, events, activeSchoolYearId, isAdminMode } = useStore();
  const isEditing = !!event?.id;

  const [title, setTitle] = useState(event?.title ?? '');
  const [description, setDescription] = useState(event?.description ?? '');
  const [categoryId, setCategoryId] = useState(event?.categoryId ?? '');
  const [allDay, setAllDay] = useState(event?.allDay ?? true);
  const [startDate, setStartDate] = useState(event ? toDateInputValue(event.startDateTime) : format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState(event ? toTimeInputValue(event.startDateTime) : '08:00');
  const [endDate, setEndDate] = useState(event ? toDateInputValue(event.endDateTime) : format(new Date(), 'yyyy-MM-dd'));
  const [endTime, setEndTime] = useState(event ? toTimeInputValue(event.endDateTime) : '09:00');
  const [selectedLayerIds, setSelectedLayerIds] = useState<string[]>(event?.layerIds ?? []);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>(event?.classIds ?? []);
  const [visibility, setVisibility] = useState<EventVisibility>(event?.visibility ?? 'public');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<string[]>([]);

  const availableClasses = classes.filter((c) => selectedLayerIds.includes(c.layerId));

  useEffect(() => {
    const validClassIds = classes.filter((c) => selectedLayerIds.includes(c.layerId)).map((c) => c.id);
    setSelectedClassIds((prev) => prev.filter((id) => validClassIds.includes(id)));
  }, [selectedLayerIds, classes]);

  useEffect(() => {
    if (categoryId !== 'cat-exam' || !startDate) { setWarnings([]); return; }
    const tempEvent: Event = {
      id: event?.id ?? 'temp', title, description,
      schoolYearId: activeSchoolYearId, categoryId,
      startDateTime: allDay ? `${startDate}T08:00:00` : `${startDate}T${startTime}:00`,
      endDateTime: allDay ? `${endDate}T18:00:00` : `${endDate}T${endTime}:00`,
      allDay, layerIds: selectedLayerIds, classIds: selectedClassIds,
      audienceType: computeAudienceType(selectedLayerIds, selectedClassIds),
      visibility, createdAt: event?.createdAt ?? new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    setWarnings(checkExamOverload(events, tempEvent, classes));
  }, [categoryId, startDate, selectedLayerIds, selectedClassIds]);

  const toggleLayer = (id: string) =>
    setSelectedLayerIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  const toggleClass = (id: string) =>
    setSelectedClassIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'יש להזין כותרת';
    if (!categoryId) errs.category = 'יש לבחור קטגוריה';
    if (!startDate) errs.startDate = 'יש להזין תאריך התחלה';
    if (!endDate) errs.endDate = 'יש להזין תאריך סיום';
    if (startDate && endDate && startDate > endDate) errs.endDate = 'תאריך הסיום חייב להיות אחרי תאריך ההתחלה';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const savedEvent: Event = {
      id: event?.id || generateEventId(),
      title: title.trim(), description: description.trim(),
      schoolYearId: activeSchoolYearId, categoryId,
      startDateTime: allDay ? `${startDate}T00:00:00` : `${startDate}T${startTime}:00`,
      endDateTime: allDay ? `${endDate}T23:59:00` : `${endDate}T${endTime}:00`,
      allDay, layerIds: selectedLayerIds, classIds: selectedClassIds,
      audienceType: computeAudienceType(selectedLayerIds, selectedClassIds),
      visibility, createdAt: event?.createdAt ?? new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    onSave(savedEvent);
  };

  const inputClass = (field: string) =>
    `w-full px-3 py-2 rounded-lg border text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors ${
      errors[field] ? 'border-red-400 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">כותרת <span className="text-red-500">*</span></label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass('title')} placeholder="הזן כותרת לאירוע" />
        {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">קטגוריה <span className="text-red-500">*</span></label>
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass('category')}>
          <option value="">-- בחר קטגוריה --</option>
          {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
        </select>
        {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category}</p>}
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="allDay" checked={allDay} onChange={(e) => setAllDay(e.target.checked)}
          className="w-4 h-4 rounded text-primary-500 focus:ring-primary-500 border-gray-300 dark:border-gray-600" />
        <label htmlFor="allDay" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">כל היום</label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">תאריך התחלה <span className="text-red-500">*</span></label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass('startDate')} />
          {errors.startDate && <p className="mt-1 text-xs text-red-500">{errors.startDate}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">תאריך סיום <span className="text-red-500">*</span></label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass('endDate')} />
          {errors.endDate && <p className="mt-1 text-xs text-red-500">{errors.endDate}</p>}
        </div>
      </div>

      {!allDay && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">שעת התחלה</label>
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputClass('startTime')} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">שעת סיום</label>
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputClass('endTime')} />
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">שכבות</label>
        <div className="flex flex-wrap gap-2">
          {layers.map((layer) => (
            <button type="button" key={layer.id} onClick={() => toggleLayer(layer.id)}
              className={`px-3 py-1 text-sm font-medium rounded-full transition-colors ${
                selectedLayerIds.includes(layer.id)
                  ? `${layer.color} ${layer.textColor} ring-2 ring-offset-1 ring-current`
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}>
              שכבת {layer.name}
            </button>
          ))}
        </div>
      </div>

      {selectedLayerIds.length > 0 && availableClasses.length > 0 && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">כיתות ספציפיות</label>
          {selectedLayerIds.map((layerId) => {
            const layer = layers.find((l) => l.id === layerId);
            const layerClasses = availableClasses.filter((c) => c.layerId === layerId);
            if (!layer || layerClasses.length === 0) return null;
            return (
              <div key={layerId} className="mb-2">
                <div className={`inline-block px-2 py-0.5 rounded text-xs font-medium mb-1 ${layer.color} ${layer.textColor}`}>שכבת {layer.name}</div>
                <div className="flex flex-wrap gap-1.5">
                  {layerClasses.map((cls) => (
                    <button type="button" key={cls.id} onClick={() => toggleClass(cls.id)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                        selectedClassIds.includes(cls.id)
                          ? `${layer.color} ${layer.textColor} ring-1 ring-current`
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}>
                      {cls.displayName}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3 space-y-1">
          <p className="text-xs font-bold text-amber-700 dark:text-amber-400">⚠️ אזהרת עומס מבחנים:</p>
          {warnings.map((w, i) => <p key={i} className="text-xs text-amber-600 dark:text-amber-400">{w}</p>)}
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">תיאור</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
          className={`${inputClass('description')} resize-none`} placeholder="תיאור מפורט של האירוע (אופציונלי)" />
      </div>

      {isAdminMode && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">נראות האירוע</label>
          <div className="grid grid-cols-3 gap-2">
            {VISIBILITY_OPTIONS.map((opt) => (
              <button key={opt.value} type="button" onClick={() => setVisibility(opt.value)}
                className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-xl border-2 text-center transition-all ${
                  visibility === opt.value
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}>
                <span className={`text-xs font-bold ${visibility === opt.value ? 'text-primary-700 dark:text-primary-300' : 'text-gray-700 dark:text-gray-300'}`}>{opt.label}</span>
                <span className={`text-[10px] ${opt.color}`}>{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <button type="submit" className="flex-1 py-2.5 text-sm font-semibold rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors">
          {isEditing ? 'עדכן אירוע' : 'שמור אירוע'}
        </button>
        <button type="button" onClick={onCancel}
          className="px-5 py-2.5 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          ביטול
        </button>
      </div>
    </form>
  );
}
