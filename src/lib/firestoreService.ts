import {
  collection, getDocs, doc, setDoc, deleteDoc,
  writeBatch, query, orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import { Event, Layer, SchoolClass, Category } from '../types';

// ── Collection helpers ─────────────────────────────────────────────────────────

const col = {
  events:     () => collection(db, 'events'),
  layers:     () => collection(db, 'layers'),
  classes:    () => collection(db, 'classes'),
  categories: () => collection(db, 'categories'),
};

// ── Fetch all data ─────────────────────────────────────────────────────────────

export async function fetchAllData() {
  const [eventsSnap, catsSnap, layersSnap, classesSnap] = await Promise.all([
    getDocs(query(col.events(),     orderBy('startDateTime', 'asc'))),
    getDocs(query(col.categories(), orderBy('sortOrder',     'asc'))),
    getDocs(query(col.layers(),     orderBy('order',         'asc'))),
    getDocs(query(col.classes(),    orderBy('sortOrder',     'asc'))),
  ]);

  return {
    events:     eventsSnap.docs.map(d => d.data() as Event),
    categories: catsSnap.docs.map(d => d.data() as Category),
    layers:     layersSnap.docs.map(d => d.data() as Layer),
    classes:    classesSnap.docs.map(d => d.data() as SchoolClass),
  };
}

// ── Seed defaults (first run) ──────────────────────────────────────────────────

export async function seedDefaults(
  events:     Event[],
  categories: Category[],
  layers:     Layer[],
  classes:    SchoolClass[],
): Promise<void> {
  const batch = writeBatch(db);

  events.forEach(e =>
    batch.set(doc(db, 'events', e.id), e));
  categories.forEach(c =>
    batch.set(doc(db, 'categories', c.id), c));
  layers.forEach(l =>
    batch.set(doc(db, 'layers', l.id), l));
  classes.forEach(c =>
    batch.set(doc(db, 'classes', c.id), c));

  await batch.commit();
}

// ── Events CRUD ────────────────────────────────────────────────────────────────

export async function dbInsertEvent(event: Event): Promise<void> {
  await setDoc(doc(db, 'events', event.id), event);
}

export async function dbUpdateEvent(event: Event): Promise<void> {
  await setDoc(doc(db, 'events', event.id), event);
}

export async function dbDeleteEvent(id: string): Promise<void> {
  await deleteDoc(doc(db, 'events', id));
}

export async function dbBulkInsertEvents(events: Event[]): Promise<void> {
  if (events.length === 0) return;

  // Firestore batch limit = 500 ops; chunk if needed
  const CHUNK = 499;
  for (let i = 0; i < events.length; i += CHUNK) {
    const batch = writeBatch(db);
    events.slice(i, i + CHUNK).forEach(e =>
      batch.set(doc(db, 'events', e.id), e));
    await batch.commit();
  }
}

// ── Layers CRUD ────────────────────────────────────────────────────────────────

export async function dbUpsertLayer(layer: Layer): Promise<void> {
  await setDoc(doc(db, 'layers', layer.id), layer);
}

export async function dbDeleteLayer(id: string): Promise<void> {
  await deleteDoc(doc(db, 'layers', id));
}

// ── Categories CRUD ────────────────────────────────────────────────────────────

export async function dbUpsertCategory(category: Category): Promise<void> {
  await setDoc(doc(db, 'categories', category.id), category);
}

export async function dbDeleteCategory(id: string): Promise<void> {
  await deleteDoc(doc(db, 'categories', id));
}
