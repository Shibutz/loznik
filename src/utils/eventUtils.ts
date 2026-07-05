import { addDays, parseISO, startOfDay, endOfDay, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { Event, Layer, SchoolClass, Category, AudienceType, UserRole } from '../types';

export function getEventsForDate(events: Event[], date: Date): Event[] {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);
  return events.filter((event) => {
    const eventStart = parseISO(event.startDateTime);
    const eventEnd = parseISO(event.endDateTime);
    return eventStart <= dayEnd && eventEnd >= dayStart;
  });
}

export function getEventsForWeek(events: Event[], weekStart: Date): Event[] {
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });
  return events.filter((event) => {
    const eventStart = parseISO(event.startDateTime);
    const eventEnd = parseISO(event.endDateTime);
    return eventStart <= weekEnd && eventEnd >= weekStart;
  });
}

export function getEventsForMonth(events: Event[], month: Date): Event[] {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  return events.filter((event) => {
    const eventStart = parseISO(event.startDateTime);
    const eventEnd = parseISO(event.endDateTime);
    return eventStart <= monthEnd && eventEnd >= monthStart;
  });
}

function isVisibleForRole(event: Event, userRole: UserRole): boolean {
  const v = event.visibility ?? 'public';
  if (userRole === 'admin') return true;
  if (userRole === 'staff') return v === 'public' || v === 'staff';
  return v === 'public';
}

export function filterEvents(
  events: Event[],
  layerIds: string[],
  classIds: string[],
  categoryIds: string[],
  searchQuery = '',
  userRole: UserRole = 'public',
  categories: Category[] = []
): Event[] {
  const q = searchQuery.trim().toLowerCase();

  return events.filter((event) => {
    // Visibility filter
    if (!isVisibleForRole(event, userRole)) return false;

    // Search filter — title, description, and category label
    if (q) {
      const catLabel = categories.find((c) => c.id === event.categoryId)?.label?.toLowerCase() ?? '';
      const matchesSearch =
        event.title.toLowerCase().includes(q) ||
        event.description.toLowerCase().includes(q) ||
        catLabel.includes(q);
      if (!matchesSearch) return false;
    }

    // Category filter
    if (categoryIds.length > 0 && !categoryIds.includes(event.categoryId)) {
      return false;
    }

    // No layer/class filter = show all
    if (layerIds.length === 0 && classIds.length === 0) return true;

    // School-wide events always shown when filters active
    if (event.audienceType === 'school' && event.layerIds.length === 0 && event.classIds.length === 0) {
      return true;
    }

    // Class filter
    if (classIds.length > 0) {
      if (event.classIds.length > 0 && event.classIds.some((id) => classIds.includes(id))) {
        return true;
      }
      if (event.layerIds.length > 0 && event.classIds.length === 0) {
        return event.layerIds.some((lid) => layerIds.includes(lid));
      }
    }

    // Layer filter
    if (layerIds.length > 0) {
      if (event.layerIds.length === 0) return false;
      return event.layerIds.some((lid) => layerIds.includes(lid));
    }

    return false;
  });
}

export function getAudienceLabel(event: Event, layers: Layer[], classes: SchoolClass[]): string {
  if (event.audienceType === 'school' || (event.layerIds.length === 0 && event.classIds.length === 0)) {
    return 'כל בית הספר';
  }
  if (event.classIds.length === 1) {
    const cls = classes.find((c) => c.id === event.classIds[0]);
    return cls ? cls.displayName : 'כיתה';
  }
  if (event.classIds.length > 1) {
    if (event.classIds.length <= 3) {
      const names = event.classIds
        .map((id) => classes.find((c) => c.id === id)?.displayName ?? '')
        .filter(Boolean);
      return names.join(', ');
    }
    return `${event.classIds.length} כיתות`;
  }
  if (event.layerIds.length === 1) {
    const layer = layers.find((l) => l.id === event.layerIds[0]);
    return layer ? `שכבת ${layer.name}` : 'שכבה';
  }
  if (event.layerIds.length > 1) {
    const names = event.layerIds
      .map((id) => layers.find((l) => l.id === id)?.name ?? '')
      .filter(Boolean);
    return `שכבות ${names.join(', ')}`;
  }
  return 'רב-שכבתי';
}

export function computeAudienceType(layerIds: string[], classIds: string[]): AudienceType {
  if (layerIds.length === 0 && classIds.length === 0) return 'school';
  if (classIds.length > 0) {
    if (layerIds.length > 1) return 'mixed';
    return 'class';
  }
  if (layerIds.length === 1) return 'layer';
  if (layerIds.length > 1) return 'mixed';
  return 'school';
}

export function checkExamOverload(
  events: Event[],
  newEvent: Event,
  classes: SchoolClass[]
): string[] {
  if (newEvent.categoryId !== 'cat-exam') return [];
  const warnings: string[] = [];
  const newStart = parseISO(newEvent.startDateTime);
  let affectedClassIds: string[] = [...newEvent.classIds];
  if (affectedClassIds.length === 0 && newEvent.layerIds.length > 0) {
    affectedClassIds = classes
      .filter((c) => newEvent.layerIds.includes(c.layerId))
      .map((c) => c.id);
  }
  const checkedClasses = new Set<string>();
  for (const classId of affectedClassIds) {
    if (checkedClasses.has(classId)) continue;
    checkedClasses.add(classId);
    const windowStart = addDays(newStart, -3);
    const windowEnd = addDays(newStart, 3);
    const examsInWindow = events.filter((e) => {
      if (e.id === newEvent.id) return false;
      if (e.categoryId !== 'cat-exam') return false;
      const eStart = parseISO(e.startDateTime);
      if (!isWithinInterval(eStart, { start: windowStart, end: windowEnd })) return false;
      if (e.classIds.includes(classId)) return true;
      if (e.classIds.length === 0 && e.layerIds.length > 0) {
        const cls = classes.find((c) => c.id === classId);
        if (cls && e.layerIds.includes(cls.layerId)) return true;
      }
      if (e.layerIds.length === 0 && e.classIds.length === 0) return true;
      return false;
    });
    if (examsInWindow.length >= 2) {
      const cls = classes.find((c) => c.id === classId);
      const className = cls ? cls.displayName : classId;
      warnings.push(`לכיתה ${className} יש ${examsInWindow.length + 1} מבחנים בפרק זמן של 7 ימים`);
    }
  }
  return warnings;
}

export function generateEventId(): string {
  return crypto.randomUUID();
}
