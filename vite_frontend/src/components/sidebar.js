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

/**
 * Route map describing the sidebar structure per request:
 * - Home (/home)
 * - Status (/status)
 *    - LAN (/status/lan)
 *    - WAN (/status/wan)
 *    - WLAN (/status/wlan)
 *    - DHCP (/status/dhcp)
 *    - Log (/status/log)
 * - Basic Settings (/basic)
 *    - LAN (/basic/lan)
 *    - WAN (/basic/wan)
 *    - WLAN (/basic/wlan)
 *    - DHCP (/basic/dhcp)
 * - Advanced Settings (/advanced)
 *    - Service Control (/advanced/service-control)
 *    - DDNS (/advanced/ddns)
 *    - DMZ (/advanced/dmz)
 * - Management (/management)
 *    - NTP (/management/ntp)
 *    - SSH (/management/ssh)
 *    - Firmware Upgrade (/management/firmware)
 * - Application (/application)
 *    - UPnP (/application/upnp)
 */
const NAV_STRUCTURE = [
  { type: 'link', id: 'home', labelKey: 'navigation.home', path: '/home' },
  {
    type: 'group-link',
    id: 'status',
    labelKey: 'navigation.status',
    path: '/status',
    children: [
      { id: 'status-lan', labelKey: 'navigation.statusLan', path: '/status/lan' },
      { id: 'status-wan', labelKey: 'navigation.statusWan', path: '/status/wan' },
      { id: 'status-wlan', labelKey: 'navigation.statusWlan', path: '/status/wlan' },
      { id: 'status-dhcp', labelKey: 'navigation.statusDhcp', path: '/status/dhcp' },
      { id: 'status-log', labelKey: 'navigation.statusLog', path: '/status/log' },
    ],
  },
  {
    type: 'group-link',
    id: 'basic',
    labelKey: 'navigation.basicSettings',
    path: '/basic',
    children: [
      { id: 'basic-lan', labelKey: 'navigation.basicLan', path: '/basic/lan' },
      { id: 'basic-wan', labelKey: 'navigation.basicWan', path: '/basic/wan' },
      { id: 'basic-wlan', labelKey: 'navigation.basicWlan', path: '/basic/wlan' },
      { id: 'basic-dhcp', labelKey: 'navigation.basicDhcp', path: '/basic/dhcp' },
    ],
  },
  {
    type: 'group-link',
    id: 'advanced',
    labelKey: 'navigation.advancedSettings',
    path: '/advanced',
    children: [
      { id: 'advanced-service', labelKey: 'navigation.advancedServiceControl', path: '/advanced/service-control' },
      { id: 'advanced-ddns', labelKey: 'navigation.advancedDdns', path: '/advanced/ddns' },
      { id: 'advanced-dmz', labelKey: 'navigation.advancedDmz', path: '/advanced/dmz' },
    ],
  },
  {
    type: 'group-link',
    id: 'management',
    labelKey: 'navigation.management',
    path: '/management',
    children: [
      { id: 'mgmt-ntp', labelKey: 'navigation.managementNtp', path: '/management/ntp' },
      { id: 'mgmt-ssh', labelKey: 'navigation.managementSsh', path: '/management/ssh' },
      { id: 'mgmt-firmware', labelKey: 'navigation.managementFirmware', path: '/management/firmware' },
    ],
  },
  {
    type: 'group-link',
    id: 'application',
    labelKey: 'navigation.application',
    path: '/application',
    children: [
      { id: 'app-upnp', labelKey: 'navigation.applicationUpnp', path: '/application/upnp' },
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
function buildGroupLink({ id, label, path, children }, expanded, routePath) {
  const groupId = `group-${id}`;
  const panelId = `panel-${id}`;
  const isOpen = !!expanded[id];

  const activeParent = isPathActive(path, routePath);
  // Parent acts as a link and as a toggle; space/enter or click on chevron toggles, clicking text navigates.
  const header = create('div', { class: 'nav-item nav-toggle ' + (isOpen ? 'is-open' : ''), role: 'group' },
    create('a', {
      href: `#${path}`,
      class: ['nav-item', activeParent ? 'active' : ''].join(' '),
      'aria-current': activeParent ? 'page' : null,
      'data-path': path,
      style: { flex: '1', padding: 0, background: 'transparent' },
    }, label),
    create('button', {
      type: 'button',
      class: 'btn btn-ghost',
      'aria-expanded': String(isOpen),
      'aria-controls': panelId,
      'data-group-id': id,
      'aria-label': 'Toggle',
      style: { padding: '6px 8px', marginLeft: 'auto' },
    }, isOpen ? '▾' : '▸'),
  );

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
    header,
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
    } else if (entry.type === 'group-link') {
      const label = i18n && typeof i18n.t === 'function' ? i18n.t(entry.labelKey) : entry.id;
      const children = entry.children.map((c) => ({
        ...c,
        label: i18n && typeof i18n.t === 'function' ? i18n.t(c.labelKey) : c.id,
      }));
      nodes.push(
        buildGroupLink(
          { id: entry.id, label, path: entry.path, children },
          expanded,
          routePath,
        )
      );
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
  const unsubscribeClick = delegate(container, 'click', '.nav-toggle button[data-group-id]', (evt, target) => {
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
    // toggle chevron
    target.textContent = next ? '▾' : '▸';
    // add/remove is-open on parent header wrapper
    const header = target.closest('.nav-toggle');
    if (header) header.classList.toggle('is-open', next);
    if (panel) {
      if (next) panel.removeAttribute('hidden');
      else panel.setAttribute('hidden', '');
    }
  });

  // Keyboard support for toggles
  const unsubscribeKey = delegate(container, 'keydown', '.nav-toggle button[data-group-id]', (evt, target) => {
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
