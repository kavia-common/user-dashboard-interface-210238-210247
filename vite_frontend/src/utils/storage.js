//
// Simple, safe storage utilities with namespacing and JSON helpers.
// Falls back gracefully when localStorage is unavailable (e.g., SSR, privacy modes).
//
// Public API:
// - createStorage(namespace: string, backingStore?)
//   -> { get, set, remove, getJSON, setJSON, clearAll, keys }
//
// Default export is a pre-namespaced storage under "app".
//

const hasWindow = typeof globalThis !== 'undefined' && typeof globalThis.window !== 'undefined';

const memoryStore = (() => {
  const mem = new Map();
  return {
    getItem(key) {
      return mem.has(key) ? mem.get(key) : null;
    },
    setItem(key, value) {
      mem.set(key, String(value));
    },
    removeItem(key) {
      mem.delete(key);
    },
    key(index) {
      return Array.from(mem.keys())[index] ?? null;
    },
    get length() {
      return mem.size;
    },
    clear() {
      mem.clear();
    },
  };
})();

function getSafeLocalStorage() {
  try {
    if (hasWindow && globalThis.window.localStorage) {
      // Test access
      const testKey = '__st:test__';
      globalThis.window.localStorage.setItem(testKey, '1');
      globalThis.window.localStorage.removeItem(testKey);
      return globalThis.window.localStorage;
    }
  } catch {
    // ignore
  }
  return memoryStore;
}

function withNamespace(ns, key) {
  return `${ns}:${key}`;
}

/**
 * Build a typed storage wrapper with namespacing.
 * The backingStore must implement: getItem, setItem, removeItem, key(index?), length?, clear?
 */
// PUBLIC_INTERFACE
export function createStorage(namespace = 'app', backingStore) {
  /** Create a namespaced storage with JSON helpers and fallback memory store. */
  const store = backingStore && typeof backingStore.getItem === 'function'
    ? backingStore
    : getSafeLocalStorage();

  function get(key, defaultValue = null) {
    const k = withNamespace(namespace, key);
    try {
      const v = store.getItem(k);
      return v === null ? defaultValue : v;
    } catch {
      return defaultValue;
    }
  }

  function set(key, value) {
    const k = withNamespace(namespace, key);
    try {
      store.setItem(k, String(value));
      return true;
    } catch {
      return false;
    }
  }

  function remove(key) {
    const k = withNamespace(namespace, key);
    try {
      store.removeItem(k);
      return true;
    } catch {
      return false;
    }
  }

  function getJSON(key, defaultValue = null) {
    const raw = get(key, null);
    if (raw == null) return defaultValue;
    try {
      return JSON.parse(raw);
    } catch {
      return defaultValue;
    }
  }

  function setJSON(key, value) {
    try {
      const str = JSON.stringify(value);
      return set(key, str);
    } catch {
      return false;
    }
  }

  function keys() {
    // Attempt to enumerate only our namespace keys when possible
    const out = [];
    try {
      const len = typeof store.length === 'number' ? store.length : 0;
      for (let i = 0; i < len; i += 1) {
        const k = store.key(i);
        if (k && typeof k === 'string' && k.startsWith(namespace + ':')) {
          out.push(k.slice(namespace.length + 1));
        }
      }
    } catch {
      // store might not support key/length; return empty
    }
    return out;
  }

  function clearAll() {
    // Remove only our namespaced keys
    const k = keys();
    for (const key of k) {
      remove(key);
    }
  }

  return Object.freeze({
    get,
    set,
    remove,
    getJSON,
    setJSON,
    keys,
    clearAll,
  });
}

// Default pre-namespaced storage
const defaultStorage = createStorage('app');

// PUBLIC_INTERFACE
export default defaultStorage;
