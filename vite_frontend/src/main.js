import './style.css';
import './styles/theme.css';
import './styles/layout.css';
import './styles/components.css';

/**
 * Initialize the app shell.
 * We only create the structural containers here:
 * - .app-shell: root layout wrapper
 * - .sidebar: fixed left navigation container (empty for now)
 * - .content: right area that holds header and main
 * - .header: top bar with controls (to be mounted by future code)
 * - .main: central page content area (blank placeholder)
 */
function initAppShell() {
  const root = document.querySelector('#app');
  if (!root) return;

  root.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar" aria-label="Primary">
        <!-- Sidebar navigation will mount here -->
      </aside>
      <div class="content">
        <header class="header" role="banner" aria-label="Top Bar">
          <!-- Language / Account / Logout controls will mount here -->
        </header>
        <main class="main" role="main" tabindex="-1">
          <!-- Page content will render here -->
        </main>
      </div>
    </div>
  `;
}

initAppShell();

// Mount sidebar and header with router + i18n
import { initRouter, navigate } from './router.js';
import { initI18n, t, setLanguage, getLanguage, onLanguageChange, offLanguageChange } from './i18n/translations.js';
import { initSidebar } from './components/sidebar.js';
import { initHeader } from './components/header.js';
import { createStorage } from './utils/storage.js';

// Initialize storage
const storage = createStorage('app');

// Initialize i18n with storage-like adapter
initI18n({
  getItem: (k) => storage.get(k.replace('app:', ''), null),
  setItem: (k, v) => storage.set(k.replace('app:', ''), v),
});

// Initialize router and mount components
initRouter({ defaultRoute: '/home' });

// Sidebar
const sidebarRoot = document.querySelector('.sidebar');
if (sidebarRoot) {
  const routerAdapter = {
    getRoute: () => {
      const hash = (typeof globalThis !== 'undefined' && globalThis.location && globalThis.location.hash) ? globalThis.location.hash : '';
      const path = hash ? hash.replace(/^#/, '') : '/home';
      return { path };
    },
    onRouteChange: (cb) => {
      // Hook to the router's onRouteChange via event listener on hashchange
      if (typeof cb !== 'function') return;
      if (typeof globalThis !== 'undefined' && globalThis.addEventListener) {
        globalThis.addEventListener('hashchange', () => cb(routerAdapter.getRoute()));
      }
    },
  };
  initSidebar(sidebarRoot, routerAdapter, { t, onLanguageChange });
}

// Header
const headerRoot = document.querySelector('.header');
if (headerRoot) {
  initHeader(headerRoot, {
    i18n: { t, setLanguage, getLanguage, onLanguageChange, offLanguageChange },
    router: { navigate },
    storage,
  });
}
