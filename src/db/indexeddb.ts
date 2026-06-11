import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { SiteWalk } from '../types';

interface SilverPlatterDB extends DBSchema {
  walks: {
    key: string;
    value: SiteWalk;
  };
}

let dbPromise: Promise<IDBPDatabase<SilverPlatterDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<SilverPlatterDB>('silver-platter', 1, {
      upgrade(db) {
        db.createObjectStore('walks', { keyPath: 'id' });
      }
    });
  }
  return dbPromise;
}

export async function dbGetAllWalks(): Promise<SiteWalk[]> {
  return (await getDB()).getAll('walks');
}

export async function dbPutWalk(walk: SiteWalk): Promise<void> {
  await (await getDB()).put('walks', walk);
}

export async function dbDeleteWalk(id: string): Promise<void> {
  await (await getDB()).delete('walks', id);
}
