export class IndexedDBWrapper {
  private dbName: string;
  private dbVersion: number;
  private db: IDBDatabase | null = null;

  constructor(dbName: string, dbVersion: number = 1) {
    this.dbName = dbName;
    this.dbVersion = dbVersion;
  }

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('store')) {
          db.createObjectStore('store');
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }

  async get(key: string): Promise<any> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('store', 'readonly');
      const store = transaction.objectStore('store');
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async set(key: string, value: any): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('store', 'readwrite');
      const store = transaction.objectStore('store');
      const request = store.put(value, key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async remove(key: string): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('store', 'readwrite');
      const store = transaction.objectStore('store');
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(): Promise<void> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('store', 'readwrite');
      const store = transaction.objectStore('store');
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const db = new IndexedDBWrapper('ai-chatbot-db'); 