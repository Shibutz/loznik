import { Event, Layer, Category } from '../types';
import { formatTime } from '../utils/dateUtils';

interface EventCardProps {
  event: Event;
  layers: Layer[];
  categories: Category[];
  onClick: (event: Event) => void;
  compact?: boolean;
}

export default function EventCard({ event, layers, categories, onClick, compact = false }: EventCardProps) {
  const category = categories.find((c) => c.id === event.categoryId);

  let bgClass = 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200';
  let borderClass = 'border-gray-300 dark:border-gray-600';

  if (event.layerIds.length === 1) {
    const layer = layers.find((l) => l.id === event.layerIds[0]);
    if (layer) { bgClass = `${layer.color} ${layer.textColor}`; borderClass = ''; }
  } else if (event.layerIds.length > 1) {
    bgClass = 'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200';
    borderClass = '';
  }

  const categoryDot: Record<string, string> = {
    'cat-exam': 'bg-red-500',
    'cat-submit': 'bg-orange-500',
    'cat-trip': 'bg-green-500',
    'cat-social': 'bg-purple-500',
    'cat-parents': 'bg-sky-500',
    'cat-council': 'bg-primary-500',
  };
  const dotColor = categoryDot[event.categoryId] ?? 'bg-gray-500';

  if (compact) {
    return (
      <div
        onClick={(e) => { e.stopPropagation(); onClick(event); }}
        className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs cursor-pointer truncate ${bgClass} ${borderClass} hover:opacity-80 transition-opacity`}
        title={event.title}
      >
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor}`} />
        <span className="truncate font-medium">{event.title}</span>
      </div>
    );
  }

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClick(event); }}
      className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-sm cursor-pointer ${bgClass} ${borderClass} hover:opacity-80 transition-opacity mb-0.5`}
      title={event.title}
    >
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
      <span className="truncate font-medium flex-1">{event.title}</span>
      {!event.allDay && (
        <span className="text-xs opacity-70 flex-shrink-0">{formatTime(event.startDateTime)}</span>
      )}
    </div>
  );
}
