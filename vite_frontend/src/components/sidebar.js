//
// Sidebar component: Ocean Professional themed, accessible, expandable sections,
// hash-based navigation awareness, and persistent expanded state.
//
// Public API:
// - initSidebar(rootEl, router, i18n)
//
// Behavior:
// - Renders left navigation with sections: Home, Status, Basic Settings, Advanced Settings,
//   Management, Application; with specified sub-items.
// - Uses router.getRoute() and router.onRouteChange(cb) to highlight active item.
// - Uses i18n.t and listens to language changes to re-render labels.
// - Persists expanded/collapsed states per group in localStorage via namespaced storage utils.
// - Accessible: uses button elements for toggles, aria-expanded, aria-controls, aria-current on active link.
// - Keyboard support: Space/Enter on buttons toggles, ArrowLeft/ArrowRight collapse/expand.
//
// Dependencies: src/utils/dom.js, src/utils/storage.js
//

import { create, render, delegate, qs } from '../utils/dom.js';
import { createStorage } from '../utils/storage.js';

// Storage namespace for sidebar preferences
const storage = createStorage('app:sidebar');

// Keys used in storage
const STORAGE_KEYS = Object.freeze({
  expanded: 'expanded', // JSON object map of { groupId: boolean }
});

// Route map describing the sidebar structure
const NAV_STRUCTURE = [
  {
    type: 'link',
    id: 'home',
    labelKey: 'navigation.home',
    path: '/home',
  },
  {
    type: 'link',
    id: 'status',
    labelKey: 'navigation.status',
    path: '/status',
  },
  {
    type: 'group',
    id: 'basic',
    labelKey: 'navigation.basicSettings',
    children: [
      { id: 'profile', label: 'Profile', path: '/basic/profile' },
      { id: 'network', label: 'Network', path: '/basic/network' },
      { id: 'display', label: 'Display', path: '/basic/display' },
    ],
  },
  {
    type: 'group',
    id: 'advanced',
    labelKey: 'navigation.advancedSettings',
    children: [
      { id: 'security', label: 'Security', path: '/advanced/security' },
      { id: 'integrations', label: 'Integrations', path: '/advanced/integrations' },
      { id: 'logs', label: 'Logs', path: '/advanced/logs' },
    ],
  },
  {
    type: 'group',
    id: 'management',
    labelKey: 'navigation.management',
    children: [
      { id: 'users', label: 'Users', path: '/management/users' },
      { id: 'roles', label: 'Roles', path: '/management/roles' },
      { id: 'system', label: 'System', path: '/management/system' },
    ],
  },
  {
    type: 'group',
    id: 'application',
    labelKey: 'navigation.application',
    children: [
      { id: 'preferences', label: 'Preferences', path: '/application/preferences' },
      { id: 'updates', label: 'Updates', path: '/application/updates' },
      { id: 'about', label: 'About', path: '/application/about' },
    ],
  },
];

/**
 * Read expanded map from storage.
 */
function getExpandedMap() {
  const obj = storage.getJSON(STORAGE_KEYS.expanded, {});
  return obj && typeof obj === 'object' ? obj : {};
}

/**
 * Persist expanded map to storage.
 */
function setExpandedMap(map) {
  storage.setJSON(STORAGE_KEYS.expanded, map || {});
}

/**
 * Compute if a path is active given the current route path.
 * We consider a nav item active if route.path matches exactly or starts with link path + '/'
 */
function isPathActive(itemPath, routePath) {
  if (!itemPath || !routePath) return false;
  return routePath === itemPath || routePath.startsWith(itemPath + '/');
}

/**
 * Build a group section DOM node.
 */
function buildGroup({ id, label, children }, expanded, routePath) {
  const groupId = `group-${id}`;
  const panelId = `panel-${id}`;
  const isOpen = !!expanded[id];

  const button = create('button', {
    class: ['nav-item', 'nav-toggle', isOpen ? 'is-open' : ''].join(' '),
    type: 'button',
    'aria-expanded': String(isOpen),
    'aria-controls': panelId,
    'data-group-id': id,
  }, label);

  const list = create('div', {
    id: panelId,
    role: 'region',
    'aria-labelledby': groupId,
    class: 'nav-group',
    hidden: isOpen ? null : '',
  });

  // Children links
  const ul = create('ul', { class: 'nav', style: { margin: '6px 0 0 0', padding: 0, listStyle: 'none' } });
  for (const item of children) {
    const active = isPathActive(item.path, routePath);
    const li = create('li', { style: { margin: '2px 0' } },
      create('a', {
        href: `#${item.path}`,
        class: ['nav-item', active ? 'active' : ''].join(' '),
        'aria-current': active ? 'page' : null,
        'data-path': item.path,
      }, item.label)
    );
    ul.appendChild(li);
  }
  list.appendChild(ul);

  const wrapper = create('div', { class: 'nav-section', id: groupId },
    button,
    list
  );
  return wrapper;
}

/**
 * Build a single link item DOM node.
 */
function buildLink({ label, path }, routePath) {
  const active = isPathActive(path, routePath);
  return create('a', {
    href: `#${path}`,
    class: ['nav-item', active ? 'active' : ''].join(' '),
    'aria-current': active ? 'page' : null,
    'data-path': path,
  }, label);
}

/**
 * Render the entire sidebar content.
 */
function renderSidebar(container, i18n, route) {
  const expanded = getExpandedMap();
  const routePath = route && route.path ? route.path : '';

  const nodes = [];

  for (const entry of NAV_STRUCTURE) {
    if (entry.type === 'link') {
      nodes.push(buildLink({
        label: i18n && typeof i18n.t === 'function' ? i18n.t(entry.labelKey) : entry.id,
        path: entry.path,
      }, routePath));
    } else if (entry.type === 'group') {
      const label = i18n && typeof i18n.t === 'function' ? i18n.t(entry.labelKey) : entry.id;

      const children = entry.children.map((c) => ({
        ...c,
        // Labels for child items are given as plain strings in requirements
        label: c.label,
      }));

      nodes.push(buildGroup({
        id: entry.id,
        label,
        children,
      }, expanded, routePath));
    }
  }

  const wrapper = create('nav', {
    role: 'navigation',
    'aria-label': 'Primary',
  },
    create('div', { class: 'nav', style: { gap: '2px' } }, nodes)
  );

  render(container, wrapper);
}

/**
 * Attach interactive behaviors: toggles and route-driven highlighting.
 */
function attachBehaviors(container, router) {
  // Toggle expand/collapse for groups using event delegation
  const unsubscribeClick = delegate(container, 'click', '.nav-toggle', (evt, target) => {
    evt.preventDefault();
    const groupId = target.getAttribute('data-group-id');
    if (!groupId) return;

    const expanded = getExpandedMap();
    const next = !expanded[groupId];

    expanded[groupId] = next;
    setExpandedMap(expanded);

    // Update DOM attributes
    const panelId = target.getAttribute('aria-controls');
    const panel = panelId ? qs(`#${panelId}`, container) : null;
    target.setAttribute('aria-expanded', String(next));
    target.classList.toggle('is-open', next);
    if (panel) {
      if (next) panel.removeAttribute('hidden');
      else panel.setAttribute('hidden', '');
    }
  });

  // Keyboard support for toggles
  const unsubscribeKey = delegate(container, 'keydown', '.nav-toggle', (evt, target) => {
    const key = evt.key;
    const groupId = target.getAttribute('data-group-id');
    if (!groupId) return;

    const expanded = getExpandedMap();
    const isOpen = !!expanded[groupId];

    if (key === 'Enter' || key === ' ') {
      evt.preventDefault();
      target.click();
      return;
    }
    if (key === 'ArrowRight' && !isOpen) {
      evt.preventDefault();
      target.click();
      return;
    }
    if (key === 'ArrowLeft' && isOpen) {
      evt.preventDefault();
      target.click();
      return;
    }
  });

  // Route awareness: update active states when route changes
  const routeUnsub = typeof router?.onRouteChange === 'function'
    ? (router.onRouteChange(() => {
      // We re-render from outside; the init wiring will handle re-render
      // This placeholder unsub is kept for symmetry; actual re-render in init flow.
    }), () => {
      // No stored callback reference; nothing to unsubscribe here.
      // Kept to satisfy interface symmetry.
      if (typeof router?.offRouteChange === 'function') {
        // No-op retained intentionally: we did not retain the original callback reference.
      }
    })
    : () => {};

  return () => {
    try { unsubscribeClick(); } catch { /* ignore cleanup error */ }
    try { unsubscribeKey(); } catch { /* ignore cleanup error */ }
    try { routeUnsub(); } catch { /* ignore cleanup error */ }
  };
}

// PUBLIC_INTERFACE
export function initSidebar(rootEl, router, i18n) {
  /** Initialize and mount the sidebar into the provided rootEl. Listens to route and language changes for re-rendering. */
  if (!rootEl) {
    throw new Error('initSidebar(rootEl, router, i18n) requires a valid root element.');
  }

  // Helpers to get current route safely
  const getCurrentRoute = () => {
    try {
      if (router && typeof router.getRoute === 'function') {
        return router.getRoute();
      }
    } catch {
      /* ignore route retrieval error */
    }
    return { path: '' };
  };

  // Render once
  renderSidebar(rootEl, i18n || { t: (s) => s }, getCurrentRoute());
  let teardown = attachBehaviors(rootEl, router);

  // Re-render on route change
  const routeListener = (route) => {
    // Re-render to update active item and possibly auto-expand group if needed (not required).
    try { teardown(); } catch { /* ignore teardown error */ }
    renderSidebar(rootEl, i18n || { t: (s) => s }, route || getCurrentRoute());
    teardown = attachBehaviors(rootEl, router);
  };

  if (router && typeof router.onRouteChange === 'function') {
    router.onRouteChange(routeListener);
  }

  // Re-render on language change
  const langListener = () => {
    try { teardown(); } catch { /* ignore teardown error */ }
    renderSidebar(rootEl, i18n || { t: (s) => s }, getCurrentRoute());
    teardown = attachBehaviors(rootEl, router);
  };

  if (i18n && typeof i18n.onLanguageChange === 'function') {
    i18n.onLanguageChange(langListener);
  }

  // Also expose a lightweight unmount if needed in future
  return {
    unmount() {
      try { teardown(); } catch { /* ignore unmount teardown error */ }
      // No explicit unrender; caller can clear the rootEl if desired
    },
  };
}
