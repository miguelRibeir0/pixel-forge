import { openDB, type IDBPDatabase } from 'idb';
import type { Project } from '../types';

const DB_NAME = 'pixel-forge';
const DB_VERSION = 1;
const STORE_NAME = 'projects';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

let lastSavedJson = '';

export async function saveProject(project: Project): Promise<void> {
  const json = JSON.stringify(project);
  if (json === lastSavedJson) return;
  lastSavedJson = json;
  const db = await getDB();
  await db.put(STORE_NAME, project);
}

export function saveProjectSync(project: Project) {
  const json = JSON.stringify(project);
  if (json === lastSavedJson) return;
  lastSavedJson = json;
  getDB().then(db => db.put(STORE_NAME, project)).catch(() => {});
}

export async function loadProject(id: string): Promise<Project | undefined> {
  const db = await getDB();
  return db.get(STORE_NAME, id);
}

export async function loadLastProject(): Promise<Project | undefined> {
  const db = await getDB();
  const all = await db.getAll(STORE_NAME);
  if (all.length === 0) return undefined;
  all.sort((a, b) => b.updatedAt - a.updatedAt);
  return all[0];
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, id);
}

export async function listProjects(): Promise<Project[]> {
  const db = await getDB();
  const all = await db.getAll(STORE_NAME);
  all.sort((a, b) => b.updatedAt - a.updatedAt);
  return all;
}
