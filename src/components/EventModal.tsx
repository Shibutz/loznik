import { useState } from 'react';
import { X, Edit, Trash2, Calendar, Users, Eye } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Event } from '../types';
import { formatHebrewDate, formatTime } from '../utils/dateUtils';
import { getAudienceLabel } from '../utils/eventUtils';
import { parseISO } from 'date-fns';
import EventForm from './EventForm';

const VISIBILITY_LABELS: Record<string, { label: string; cls: string }> = {
  public: { label: 'ציבורי',      cls: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  staff:  { label: 'צוות בלבד',  cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'   },
  admin:  { label: 'מנהלים בלבד',cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'},
};

export default function EventModal() {
  const {
    showEventModal, editingEvent, isAdminMode, isStaffMode,
    layers, classes, categories,
    addEvent, updateEvent, deleteEvent, closeEventModal,
  } = useStore();

  const [isEditing, setIsEditing] = useState(!editingEvent?.id);

  if (!showEventModal) return null;

  const isCreateMode = !editingEvent?.id;
  const category = categories.find((c) => c.id === editingEvent?.categoryId);
  const audience = editingEvent ? getAudienceLabel(editingEvent, layers, classes) : '';
  const visInfo = VISIBILITY_LABELS[editingEvent?.visibility ?? 'public'];

  const handleSave = (event: Event) => {
    if (isCreateMode) { addEvent(event); } else { updateEvent(event); }
    closeEventModal();
  };

  const handleDelete = () => {
    if (editingEvent && window.confirm('האם למחוק את האירוע?')) {
      deleteEvent(editingEvent.id);
      closeEventModal();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeEventModal} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden"
           style={{ maxHeight: 'calc(100dvh - 1rem)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {isCreateMode ? 'יצירת אירוע חדש' : isEditing ? 'עריכת אירוע' : 'פרטי אירוע'}
          </h2>
          <div className="flex items-center gap-2">
            {!isCreateMode && isAdminMode && !isEditing && (
              <>
                <button onClick={() => setIsEditing(true)}
                  className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-primary-500 transition-colors" title="עריכה">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={handleDelete}
                  className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors" title="מחיקה">
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
            <button onClick={closeEventModal}
              className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {(isCreateMode || isEditing) ? (
            <div className="p-6">
              <EventForm
                event={editingEvent}
                onSave={handleSave}
                onCancel={() => { if (isCreateMode) { closeEventModal(); } else { setIsEditing(false); } }}
              />
            </div>
          ) : (
            editingEvent && (
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{editingEvent.title}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {category && (
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${category.bgColor} ${category.textColor}`}>{category.label}</span>
                  )}
                  {isStaffMode && (
                    <span className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full ${visInfo.cls}`}>
                      <Eye className="w-3 h-3" />{visInfo.label}
                    </span>
                  )}
                </div>
                <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4 flex-shrink-0 text-primary-500 mt-0.5" />
                  <div>
                    <div className="font-medium text-gray-700 dark:text-gray-300">
                      {formatHebrewDate(parseISO(editingEvent.startDateTime))}
                      {editingEvent.startDateTime.substring(0, 10) !== editingEvent.endDateTime.substring(0, 10) &&
                        ` – ${formatHebrewDate(parseISO(editingEvent.endDateTime))}`}
                    </div>
                    {!editingEvent.allDay && (
                      <div className="mt-0.5">{formatTime(editingEvent.startDateTime)} – {formatTime(editingEvent.endDateTime)}</div>
                    )}
                    {editingEvent.allDay && <div className="mt-0.5 text-gray-400">כל היום</div>}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Users className="w-4 h-4 flex-shrink-0 text-primary-500" />
                  <span>{audience}</span>
                </div>
                {editingEvent.layerIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {editingEvent.layerIds.map((lid) => {
                      const layer = layers.find((l) => l.id === lid);
                      if (!layer) return null;
                      return (
                        <span key={lid} className={`px-2 py-0.5 text-xs font-medium rounded-full ${layer.color} ${layer.textColor}`}>שכבת {layer.name}</span>
                      );
                    })}
                    {editingEvent.classIds.map((cid) => {
                      const cls = classes.find((c) => c.id === cid);
                      if (!cls) return null;
                      const layer = layers.find((l) => l.id === cls.layerId);
                      return (
                        <span key={cid} className={`px-2 py-0.5 text-xs font-medium rounded-full ${layer?.color ?? 'bg-gray-100'} ${layer?.textColor ?? 'text-gray-700'}`}>{cls.displayName}</span>
                      );
                    })}
                  </div>
                )}
                {editingEvent.description && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{editingEvent.description}</p>
                  </div>
                )}
                {isAdminMode && (
                  <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <button onClick={() => setIsEditing(true)}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors">
                      <Edit className="w-4 h-4" />עריכה
                    </button>
                    <button onClick={handleDelete}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
                      <Trash2 className="w-4 h-4" />מחיקה
                    </button>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
