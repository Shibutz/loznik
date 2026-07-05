import { useState } from 'react';
import { X, Sparkles, Loader2, Calendar, Clock, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { format, parseISO, addHours } from 'date-fns';
import { useStore } from '../store/useStore';
import { Event } from '../types';
import { generateEventId, computeAudienceType } from '../utils/eventUtils';

interface ParsedEvent {
  title: string;
  startDate: string;
  startTime: string | null;
  endDate: string;
  endTime: string | null;
  allDay: boolean;
  description: string;
  suggestedLayerIds: string[];
  suggestedCategoryId: string | null;
  confidence: 'high' | 'medium' | 'low';
  notes: string;
}

interface AIEventModalProps {
  onClose: () => void;
}

const EXAMPLES = [
  'יום עיון לצוות המורים ביום ג\' הקרוב 14:00–17:00',
  'מבחן מתמטיקה לכיתות ז\' ב-8.6 בשעה 08:30',
  'טקס סיום שנה לכל בית הספר ב-25/6 בצהריים',
  'ישיבת הורים לשכבת ח\' מחר בערב בשעה 19:00',
];

export default function AIEventModal({ onClose }: AIEventModalProps) {
  const { layers, categories, events, activeSchoolYearId, addEvent } = useStore();

  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState<ParsedEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Editable parsed fields
  const [editTitle, setEditTitle] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const [editAllDay, setEditAllDay] = useState(true);
  const [editDesc, setEditDesc] = useState('');
  const [editLayerIds, setEditLayerIds] = useState<string[]>([]);
  const [editCategoryId, setEditCategoryId] = useState('');

  const handleParse = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setError(null);
    setParsed(null);
    setCreated(false);

    try {
      const res = await fetch('/.netlify/functions/parse-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          currentDate: format(new Date(), 'yyyy-MM-dd'),
          layers: layers.map((l) => ({ id: l.id, name: l.name })),
          categories: categories.map((c) => ({ id: c.id, label: c.label })),
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error ?? 'שגיאה בניתוח הטקסט');
        return;
      }

      const p: ParsedEvent = data;
      setParsed(p);

      // Populate editable fields
      setEditTitle(p.title ?? '');
      setEditStartDate(p.startDate ?? format(new Date(), 'yyyy-MM-dd'));
      setEditStartTime(p.startTime ?? '08:00');
      setEditEndDate(p.endDate ?? p.startDate ?? format(new Date(), 'yyyy-MM-dd'));
      setEditEndTime(p.endTime ?? (p.startTime ? format(addHours(parseISO(`${p.startDate}T${p.startTime}`), 1), 'HH:mm') : '09:00'));
      setEditAllDay(p.allDay ?? true);
      setEditDesc(p.description ?? '');
      setEditLayerIds(p.suggestedLayerIds ?? []);
      setEditCategoryId(p.suggestedCategoryId ?? categories[0]?.id ?? '');
    } catch (e) {
      setError('שגיאת רשת — בדוק חיבור ונסה שוב');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!parsed || !editTitle.trim()) return;
    setCreating(true);

    try {
      const startISO = editAllDay
        ? `${editStartDate}T00:00:00.000Z`
        : `${editStartDate}T${editStartTime}:00.000Z`;
      const endISO = editAllDay
        ? `${editEndDate}T23:59:59.000Z`
        : `${editEndDate}T${editEndTime}:00.000Z`;

      const newEvent: Event = {
        id: generateEventId(),
        title: editTitle.trim(),
        description: editDesc,
        schoolYearId: activeSchoolYearId,
        categoryId: editCategoryId,
        startDateTime: startISO,
        endDateTime: endISO,
        allDay: editAllDay,
        layerIds: editLayerIds,
        classIds: [],
        audienceType: computeAudienceType(editLayerIds, []),
        visibility: 'public',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      addEvent(newEvent);
      setCreated(true);

      // Auto-close after 1.5s
      setTimeout(() => onClose(), 1500);
    } finally {
      setCreating(false);
    }
  };

  const toggleLayer = (id: string) => {
    setEditLayerIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const confidenceColor = {
    high: 'text-green-600 dark:text-green-400',
    medium: 'text-amber-600 dark:text-amber-400',
    low: 'text-red-500',
  };
  const confidenceLabel = {
    high: 'ביטחון גבוה',
    medium: 'ביטחון בינוני',
    low: 'ביטחון נמוך',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-gradient-to-l from-primary-50 dark:from-primary-900/20 to-transparent">
          <div className="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center shadow-sm flex-shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">יצירת אירוע עם AI</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">תאר את האירוע בעברית חופשית</p>
          </div>
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">

          {/* Success state */}
          {created ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="w-9 h-9 text-green-500" />
              </div>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">האירוע נוצר בהצלחה!</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">"{editTitle}"</p>
            </div>
          ) : (
            <>
              {/* Text input */}
              <div>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleParse();
                  }}
                  placeholder="לדוגמה: יום עיון לצוות המורים ביום ג׳ הקרוב 14:00–17:00"
                  rows={3}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  dir="rtl"
                  autoFocus
                />
                <p className="text-[11px] text-gray-400 mt-1">Ctrl+Enter לניתוח מהיר</p>
              </div>

              {/* Examples */}
              {!parsed && !loading && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">דוגמאות:</p>
                  <div className="flex flex-col gap-1.5">
                    {EXAMPLES.map((ex, i) => (
                      <button
                        key={i}
                        onClick={() => setInputText(ex)}
                        className="text-right text-xs px-3 py-2 rounded-lg border border-dashed border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-gray-600 dark:text-gray-400 hover:text-primary-700 dark:hover:text-primary-300 transition-all"
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              )}

              {/* Parsed preview */}
              {parsed && (
                <div className="rounded-xl border border-primary-200 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/10 p-4 space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">תוצאת ניתוח AI</p>
                    <span className={`text-xs font-semibold ${confidenceColor[parsed.confidence]}`}>
                      {confidenceLabel[parsed.confidence]}
                    </span>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block mb-1">כותרת</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm font-semibold rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  {/* Dates */}
                  <div className="flex items-center gap-1 flex-wrap">
                    <Calendar className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                    <input
                      type="date"
                      value={editStartDate}
                      onChange={(e) => setEditStartDate(e.target.value)}
                      className="text-xs px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                    <span className="text-xs text-gray-400">עד</span>
                    <input
                      type="date"
                      value={editEndDate}
                      onChange={(e) => setEditEndDate(e.target.value)}
                      className="text-xs px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                    <label className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 mr-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editAllDay}
                        onChange={(e) => setEditAllDay(e.target.checked)}
                        className="rounded text-primary-500 focus:ring-primary-500"
                      />
                      כל היום
                    </label>
                  </div>

                  {/* Times */}
                  {!editAllDay && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Clock className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                      <input
                        type="time"
                        value={editStartTime}
                        onChange={(e) => setEditStartTime(e.target.value)}
                        className="text-xs px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                      <span className="text-xs text-gray-400">—</span>
                      <input
                        type="time"
                        value={editEndTime}
                        onChange={(e) => setEditEndTime(e.target.value)}
                        className="text-xs px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                    </div>
                  )}

                  {/* Advanced: layers + category + description */}
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  >
                    {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    פרטים נוספים
                  </button>

                  {showAdvanced && (
                    <div className="space-y-3 pt-1 border-t border-primary-100 dark:border-primary-800">
                      {/* Category */}
                      <div>
                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block mb-1">קטגוריה</label>
                        <select
                          value={editCategoryId}
                          onChange={(e) => setEditCategoryId(e.target.value)}
                          className="w-full text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>{c.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Layers */}
                      <div>
                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block mb-1.5">שכבות</label>
                        <div className="flex flex-wrap gap-1.5">
                          {layers.map((l) => (
                            <button
                              key={l.id}
                              onClick={() => toggleLayer(l.id)}
                              className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-all ${
                                editLayerIds.includes(l.id)
                                  ? `${l.color} ${l.textColor} ring-2 ring-offset-1 ring-current`
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                              }`}
                            >
                              שכבת {l.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block mb-1">תיאור</label>
                        <input
                          type="text"
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          placeholder="תיאור נוסף (אופציונלי)"
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500"
                        />
                      </div>
                    </div>
                  )}

                  {/* AI notes */}
                  {parsed.notes && (
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 italic border-t border-primary-100 dark:border-primary-800 pt-2">
                      💬 {parsed.notes}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!created && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 space-y-2">
            {!parsed ? (
              <button
                onClick={handleParse}
                disabled={loading || !inputText.trim()}
                className="w-full py-2.5 text-sm font-bold rounded-xl bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    מנתח עם AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    ניתוח עם AI
                  </>
                )}
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => { setParsed(null); setError(null); }}
                  className="flex-1 py-2.5 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  ניסיון חדש
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating || !editTitle.trim()}
                  className="flex-[2] py-2.5 text-sm font-bold rounded-xl bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                >
                  {creating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      צור אירוע
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
