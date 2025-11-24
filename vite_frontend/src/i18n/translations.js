//
// Simple dependency-free i18n module with EN/ES dictionaries,
// persistence via optional storage wrapper (with localStorage fallback).
//
// Public API:
// - initI18n(storage)
// - t(key, vars?)
// - setLanguage(lang)
// - getLanguage()
// - onLanguageChange(cb)
// - offLanguageChange(cb)
// - availableLanguages
//
// Usage:
//   import { initI18n, t, setLanguage, getLanguage, onLanguageChange, availableLanguages } from './i18n/translations.js';
//   initI18n(optionalStorageWrapper);
//   const label = t('header.language');
//

// Internal state
let _storage = null;
let _currentLang = 'en';
const _storageKey = 'app:lang';
const _listeners = new Set();

// English and Spanish dictionaries
const en = {
  app: {
    title: 'User Dashboard',
  },
  header: {
    language: 'Language',
    account: 'Account',
    logout: 'Logout',
  },
  navigation: {
    home: 'Home',
    status: 'Status',
    basicSettings: 'Basic Settings',
    advancedSettings: 'Advanced Settings',
    management: 'Management',
    application: 'Application',
    // New exact sub-items
    statusLan: 'LAN',
    statusWan: 'WAN',
    statusWlan: 'WLAN',
    statusDhcp: 'DHCP',
    statusLog: 'Log',
    basicLan: 'LAN',
    basicWan: 'WAN',
    basicWlan: 'WLAN',
    basicDhcp: 'DHCP',
    advancedServiceControl: 'Service Control',
    advancedDdns: 'DDNS',
    advancedDmz: 'DMZ',
    managementNtp: 'NTP',
    managementSsh: 'SSH',
    managementFirmware: 'Firmware Upgrade',
    applicationUpnp: 'UPnP',
  },
  sections: {
    home: 'Home',
    status: 'Status',
    basicSettings: 'Basic Settings',
    advancedSettings: 'Advanced Settings',
    management: 'Management',
    application: 'Application',
  },
  pages: {
    home: {
      title: 'Welcome to the Dashboard',
      subtitle: 'Select an item from the menu to get started.',
    },
    status: {
      title: 'System Status',
      subtitle: 'View system health and live metrics.',
    },
    basicSettings: {
      title: 'Basic Settings',
      subtitle: 'Configure common settings.',
    },
    advancedSettings: {
      title: 'Advanced Settings',
      subtitle: 'Tweak advanced parameters.',
    },
    management: {
      title: 'Management',
      subtitle: 'Manage users, roles, and permissions.',
    },
    application: {
      title: 'Application',
      subtitle: 'Application-level configuration and tools.',
    },
    notFound: {
      title: 'Page Not Found',
      subtitle: 'The page you are looking for does not exist.',
    },
  },
};

const es = {
  app: {
    title: 'Panel de Usuario',
  },
  header: {
    language: 'Idioma',
    account: 'Cuenta',
    logout: 'Cerrar sesión',
  },
  navigation: {
    home: 'Inicio',
    status: 'Estado',
    basicSettings: 'Configuración Básica',
    advancedSettings: 'Configuración Avanzada',
    management: 'Administración',
    application: 'Aplicación',
    // Nuevos subelementos
    statusLan: 'LAN',
    statusWan: 'WAN',
    statusWlan: 'WLAN',
    statusDhcp: 'DHCP',
    statusLog: 'Registro',
    basicLan: 'LAN',
    basicWan: 'WAN',
    basicWlan: 'WLAN',
    basicDhcp: 'DHCP',
    advancedServiceControl: 'Control de Servicio',
    advancedDdns: 'DDNS',
    advancedDmz: 'DMZ',
    managementNtp: 'NTP',
    managementSsh: 'SSH',
    managementFirmware: 'Actualización de Firmware',
    applicationUpnp: 'UPnP',
  },
  sections: {
    home: 'Inicio',
    status: 'Estado',
    basicSettings: 'Configuración Básica',
    advancedSettings: 'Configuración Avanzada',
    management: 'Administración',
    application: 'Aplicación',
  },
  pages: {
    home: {
      title: 'Bienvenido al Panel',
      subtitle: 'Selecciona un elemento del menú para comenzar.',
    },
    status: {
      title: 'Estado del Sistema',
      subtitle: 'Ver salud del sistema y métricas en vivo.',
    },
    basicSettings: {
      title: 'Configuración Básica',
      subtitle: 'Configura los ajustes comunes.',
    },
    advancedSettings: {
      title: 'Configuración Avanzada',
      subtitle: 'Ajusta parámetros avanzados.',
    },
    management: {
      title: 'Administración',
      subtitle: 'Gestiona usuarios, roles y permisos.',
    },
    application: {
      title: 'Aplicación',
      subtitle: 'Configuración y herramientas a nivel de aplicación.',
    },
    notFound: {
      title: 'Página No Encontrada',
      subtitle: 'La página que buscas no existe.',
    },
  },
};

// Language registry
const dictionaries = {
  en,
  es,
};

// PUBLIC_INTERFACE
export const availableLanguages = Object.freeze([
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
]);

/**
 * Resolve nested value from object using dot-path.
 * Example: pathGet({a:{b:1}}, 'a.b') -> 1
 */
function pathGet(obj, path) {
  if (!obj || typeof path !== 'string') return undefined;
  const parts = path.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur && Object.prototype.hasOwnProperty.call(cur, p)) {
      cur = cur[p];
    } else {
      return undefined;
    }
  }
  return cur;
}

/**
 * Poor-man templating for variable interpolation like:
 * "Hello, {name}!" with vars = { name: "John" }
 */
function interpolate(str, vars) {
  if (!vars || typeof vars !== 'object') return str;
  return String(str).replace(/\{(\w+)\}/g, (_, key) => {
    if (Object.prototype.hasOwnProperty.call(vars, key)) {
      return vars[key];
    }
    return `{${key}}`;
  });
}

/**
 * Fallback localStorage helper to avoid crashes in SSR or restricted envs.
 */
const hasWindow = typeof globalThis !== 'undefined' && typeof globalThis.window !== 'undefined';
const safeLocalStorage = {
  getItem(key) {
    try {
      if (hasWindow && globalThis.window.localStorage) {
        return globalThis.window.localStorage.getItem(key);
      }
    } catch {
      // ignore storage access errors
    }
    return null;
  },
  setItem(key, value) {
    try {
      if (hasWindow && globalThis.window.localStorage) {
        globalThis.window.localStorage.setItem(key, value);
      }
    } catch {
      // ignore storage access errors
    }
  },
};

/**
 * Notify all language change listeners.
 */
function emitLanguageChange(lang) {
  for (const cb of _listeners) {
    try {
      cb(lang);
    } catch {
      // ignore listener errors
    }
  }
}

/**
 * Initialize i18n with an optional storage wrapper.
 * If provided, storage should implement getItem(key) and setItem(key, value).
 */
// PUBLIC_INTERFACE
export function initI18n(storage) {
  /** This initializes the i18n module using an optional storage wrapper for persistence. */
  _storage = storage && typeof storage.getItem === 'function' && typeof storage.setItem === 'function'
    ? storage
    : safeLocalStorage;

  const saved = _storage.getItem(_storageKey);
  if (saved && dictionaries[saved]) {
    _currentLang = saved;
  } else {
    // Detect browser language: default to 'en' if unsupported
    try {
      const hasNavigator = typeof globalThis !== 'undefined' && typeof globalThis.navigator !== 'undefined';
      const nav = hasNavigator ? globalThis.navigator : null;
      const navLang = nav && (nav.language || (nav.languages && nav.languages[0]));
      if (typeof navLang === 'string') {
        const short = navLang.slice(0, 2).toLowerCase();
        if (dictionaries[short]) {
          _currentLang = short;
        }
      }
    } catch {
      // ignore
    }
    _storage.setItem(_storageKey, _currentLang);
  }
  emitLanguageChange(_currentLang);
}

/**
 * Translate function:
 * - key is a dot-notated path into the current language dictionary
 * - vars is an optional map for string interpolation
 * If key is missing in current language, fall back to English, then the key itself.
 */
// PUBLIC_INTERFACE
export function t(key, vars) {
  /** Returns a translated string based on the current language and provided key. Supports {var} interpolation. */
  const dict = dictionaries[_currentLang] || dictionaries.en;
  let val = pathGet(dict, key);
  if (val === undefined) {
    const fallback = pathGet(dictionaries.en, key);
    val = fallback !== undefined ? fallback : key;
  }
  if (typeof val === 'string') {
    return interpolate(val, vars);
  }
  // If value is object/array, return as-is; for UI labels we expect strings
  return val !== undefined ? val : key;
}

/**
 * Set the current language and persist.
 */
// PUBLIC_INTERFACE
export function setLanguage(lang) {
  /** Sets the active language if available and persists the setting. */
  if (!dictionaries[lang]) return;
  _currentLang = lang;
  if (_storage) {
    _storage.setItem(_storageKey, lang);
  } else {
    safeLocalStorage.setItem(_storageKey, lang);
  }
  emitLanguageChange(lang);
}

/**
 * Get the current language code.
 */
// PUBLIC_INTERFACE
export function getLanguage() {
  /** Returns the current active language code. */
  return _currentLang;
}

/**
 * Subscribe to language changes.
 * Returns a no-op if the callback is invalid.
 */
// PUBLIC_INTERFACE
export function onLanguageChange(cb) {
  /** Subscribes to language change notifications with a callback(lang). */
  if (typeof cb !== 'function') return;
  _listeners.add(cb);
}

/**
 * Unsubscribe from language changes.
 */
// PUBLIC_INTERFACE
export function offLanguageChange(cb) {
  /** Unsubscribes a previously registered language change callback. */
  if (typeof cb !== 'function') return;
  _listeners.delete(cb);
}
