//
// Lightweight dependency-free hash-based router.
// Supports routes like: /home, /status, /basic, /advanced, /management, /application
// and nested subroutes (e.g., /basic/network).
//
// Public API:
// - initRouter({ onRouteChange, defaultRoute: '/home' })
// - navigate(path)
// - getRoute()
// - onRouteChange(cb)
// - offRouteChange(cb)
//
// The router parses location.hash, normalizes leading '/', and passes route objects as:
//   { path, segments, params }
// to listeners. Includes debounced hashchange handling and emits on initial load.
//
// Implementation notes:
// - We don't use any external dependencies.
// - params are query-like key/value pairs after a '?' in the hash path (e.g., #/basic/network?tab=wifi).
// - segments is an array of path segments without empty strings.
// - path is the normalized path starting with a leading '/' and excluding query string.
// - Default route is respected if hash is empty or malformed.
//
// Example usage:
//   import { initRouter, navigate, onRouteChange, offRouteChange, getRoute } from './router.js';
//   initRouter({ onRouteChange: (route) => { render(route); }, defaultRoute: '/home' });
//   navigate('/status');
//

const ROUTE_WHITELIST = new Set([
  '/home',
  '/status',
  '/basic',
  '/advanced',
  '/management',
  '/application',
]);

let _defaultRoute = '/home';
let _listeners = new Set();
let _currentRoute = null;
let _isInitialized = false;

// Debounce state
let _debounceTimer = null;
const DEBOUNCE_MS = 25;

// Timer helpers to avoid no-undef in lint environments and work in browsers/workers.
const _g = typeof globalThis !== 'undefined' ? globalThis : {};
const _setTimeout = (_g && _g.setTimeout) ? _g.setTimeout.bind(_g) : () => {};
const _clearTimeout = (_g && _g.clearTimeout) ? _g.clearTimeout.bind(_g) : () => {};

/**
 * Safely access global window-like objects.
 */
const hasWindow = typeof globalThis !== 'undefined' && !!globalThis.window;
const win = hasWindow ? globalThis.window : null;

/**
 * Normalize a path string:
 * - Ensure leading '/'
 * - Remove trailing '/' except root
 * - Remove hash symbol if present
 * - Drop query string from path but return it separately if needed by caller
 */
function normalizePath(raw) {
  if (typeof raw !== 'string') raw = '';
  let s = raw.trim();

  // If full hash like "#/path?x=1", strip leading '#'
  if (s.startsWith('#')) s = s.slice(1);

  // If it includes the leading '!' (hashbang) for compatibility, drop it
  if (s.startsWith('!')) s = s.slice(1);

  // Ensure leading slash
  if (!s.startsWith('/')) s = '/' + s;

  // Remove any repeated slashes (except after protocol-like patterns, which don't appear here)
  s = s.replace(/\/{2,}/g, '/');

  // Split query
  const [onlyPath] = s.split('?');

  // Remove trailing slash (but keep root '/')
  const cleaned = onlyPath.length > 1 && onlyPath.endsWith('/') ? onlyPath.slice(0, -1) : onlyPath;

  return cleaned || '/';
}

/**
 * Parse query parameters from a string that may include ?key=value&k2=2.
 */
function parseParams(raw) {
  const out = {};
  if (!raw || typeof raw !== 'string') return out;

  const idx = raw.indexOf('?');
  if (idx === -1) return out;

  const query = raw.slice(idx + 1);
  if (!query) return out;

  for (const part of query.split('&')) {
    if (!part) continue;
    const eq = part.indexOf('=');
    if (eq === -1) {
      const key = decodeURIComponent(part);
      if (key) out[key] = '';
      continue;
    }
    const key = decodeURIComponent(part.slice(0, eq));
    const value = decodeURIComponent(part.slice(eq + 1));
    if (key) out[key] = value;
  }
  return out;
}

/**
 * Extract segments from a normalized path (/a/b -> ['a','b'])
 */
function toSegments(path) {
  if (!path || path === '/') return [];
  return path.split('/').filter(Boolean);
}

/**
 * Build the route object from current location hash (or provided raw).
 */
function buildRouteFrom(rawHash) {
  // rawHash may be like "#/basic/network?tab=wifi" or "/basic"
  const normalizedPath = normalizePath(rawHash || (win ? win.location.hash : ''));
  const params = parseParams(rawHash || (win ? win.location.hash : ''));
  const segments = toSegments(normalizedPath);

  return {
    path: normalizedPath,
    segments,
    params,
  };
}

/**
 * Determine if a route path starts with any whitelisted base route.
 * Allows nested under those bases (e.g., '/basic/network' is valid).
 */
function isAllowedRoute(path) {
  if (path === '/' || !path) return false;
  for (const base of ROUTE_WHITELIST) {
    if (path === base || path.startsWith(base + '/')) {
      return true;
    }
  }
  return false;
}

/**
 * Emit route change to all listeners safely.
 */
function emit(route) {
  _currentRoute = route;
  for (const cb of _listeners) {
    try {
      cb(route);
    } catch {
      // ignore listener exceptions
    }
  }
}

/**
 * Handle current hash, normalize, validate, and emit.
 */
function handleRouteChange() {
  const raw = win ? win.location.hash : '';
  const route = buildRouteFrom(raw);

  // If hash missing or not allowed, navigate to defaultRoute
  if (!isAllowedRoute(route.path)) {
    navigate(_defaultRoute, { replace: true, silent: false });
    return;
  }

  emit(route);
}

/**
 * Debounced wrapper to avoid rapid double/triple hash events.
 */
function debouncedHandleRouteChange() {
  if (_debounceTimer) {
    _clearTimeout(_debounceTimer);
  }
  _debounceTimer = _setTimeout(() => {
    _debounceTimer = null;
    handleRouteChange();
  }, DEBOUNCE_MS);
}

// PUBLIC_INTERFACE
export function initRouter(options = {}) {
  /** Initialize the hash router with optional onRouteChange and defaultRoute. */
  if (_isInitialized) {
    // If already initialized, still allow updating defaultRoute and registering a listener.
    if (typeof options.defaultRoute === 'string' && options.defaultRoute) {
      _defaultRoute = normalizePath(options.defaultRoute);
    }
    if (typeof options.onRouteChange === 'function') {
      onRouteChange(options.onRouteChange);
      // Emit current immediately to the new listener
      if (_currentRoute) {
        try {
          options.onRouteChange(_currentRoute);
        } catch {
          // ignore
        }
      }
    }
    return;
  }

  _isInitialized = true;

  if (typeof options.defaultRoute === 'string' && options.defaultRoute) {
    _defaultRoute = normalizePath(options.defaultRoute);
  }

  if (typeof options.onRouteChange === 'function') {
    onRouteChange(options.onRouteChange);
  }

  if (win) {
    win.addEventListener('hashchange', debouncedHandleRouteChange, false);
  }

  // Initial emission on load
  debouncedHandleRouteChange();
}

// PUBLIC_INTERFACE
export function navigate(path, opts = {}) {
  /** Programmatically navigate to a hash path. Options: { replace?: boolean, silent?: boolean } */
  const normalized = normalizePath(path || '');
  const { replace = false, silent = false } = opts;

  if (!win) return;

  const targetHash = '#' + normalized;
  if (replace) {
    // Replace state to avoid stacking history entries
    win.location.replace(targetHash);
  } else {
    win.location.hash = normalized;
  }

  // Optionally emit immediately without waiting for hashchange
  if (!silent) {
    debouncedHandleRouteChange();
  }
}

// PUBLIC_INTERFACE
export function getRoute() {
  /** Returns the current route object: { path, segments, params } */
  if (_currentRoute) return _currentRoute;
  return buildRouteFrom(win ? win.location.hash : '');
}

// PUBLIC_INTERFACE
export function onRouteChange(cb) {
  /** Subscribes to route change notifications with a callback(route). */
  if (typeof cb !== 'function') return;
  _listeners.add(cb);
}

// PUBLIC_INTERFACE
export function offRouteChange(cb) {
  /** Unsubscribes a previously registered route change callback. */
  if (typeof cb !== 'function') return;
  _listeners.delete(cb);
}

// Optional: expose a small helper to build hash with params if needed in future.
// Not exported now to keep the minimal API surface.
// function buildHash(path, params) { ... }
