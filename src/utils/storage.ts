const inMemoryDb: { [key: string]: string } = {};

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      // Some iframe sandboxes throw security errors when accessing localStorage properties directly
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        return localStorage.getItem(key);
      }
    } catch (e) {
      console.warn('localStorage.getItem access denied or failed, using in-memory storage instead:', e);
    }
    return inMemoryDb[key] || null;
  },

  setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        localStorage.setItem(key, value);
        return;
      }
    } catch (e) {
      console.warn('localStorage.setItem access denied or failed, storing in-memory instead:', e);
    }
    inMemoryDb[key] = value;
  },

  removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        localStorage.removeItem(key);
        return;
      }
    } catch (e) {
      console.warn('localStorage.removeItem access denied or failed, removing in-memory instead:', e);
    }
    delete inMemoryDb[key];
  },

  clear(): void {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        localStorage.clear();
        return;
      }
    } catch (e) {
      console.warn('localStorage.clear access denied or failed, clearing in-memory instead:', e);
    }
    for (const k in inMemoryDb) {
      delete inMemoryDb[k];
    }
  }
};
