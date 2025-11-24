import './style.css';
import './styles/theme.css';
import './styles/layout.css';
import './styles/components.css';

/**
 * Initialize the app shell structure:
 * - Left sidebar
 * - Top header
 * - Main content area
 */
function initAppShell() {
  const root = document.querySelector('#app');
  if (!root) return;

  root.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar" aria-label="Primary"></aside>
      <div class="content">
        <header class="header" role="banner" aria-label="Top Bar"></header>
        <main class="main" role="main" tabindex="-1" aria-live="polite"></main>
      </div>
    </div>
  `;
}

initAppShell();

// Router + i18n + components
import { initRouter, navigate, onRouteChange, getRoute } from './router.js';
import { initI18n, t, setLanguage, getLanguage, onLanguageChange, offLanguageChange } from './i18n/translations.js';
import { initSidebar } from './components/sidebar.js';
import { initHeader } from './components/header.js';
import { createStorage } from './utils/storage.js';

// Pages
import * as HomePage from './pages/home.js';
import * as StatusPage from './pages/status.js';
import * as BasicSettingsPage from './pages/basic-settings.js';
import * as AdvancedSettingsPage from './pages/advanced-settings.js';
import * as ManagementPage from './pages/management.js';
import * as ApplicationPage from './pages/application.js';
import * as NotFoundPage from './pages/not-found.js';

// Initialize storage
const storage = createStorage('app');

// Initialize i18n with persistent storage adapter
initI18n({
  getItem: (k) => storage.get(k.replace('app:', ''), null),
  setItem: (k, v) => storage.set(k.replace('app:', ''), v),
});

// Initialize router
initRouter({ defaultRoute: '/home' });

// Sidebar wiring
const sidebarRoot = document.querySelector('.sidebar');
if (sidebarRoot) {
  // Adapter provides the minimal API used by sidebar for active highlighting
  const routerAdapter = {
    getRoute: () => {
      try {
        const hash = globalThis?.location?.hash ?? '';
        const path = hash ? hash.replace(/^#/, '') : '/home';
        return { path };
      } catch {
        return { path: '/home' };
      }
    },
    onRouteChange: (cb) => {
      if (typeof cb !== 'function') return;
      // Listen to real router events so active state updates consistently
      onRouteChange(() => cb(routerAdapter.getRoute()));
    },
    offRouteChange: () => {
      // Sidebar doesn't use unsubscribe; safe no-op
    },
  };
  initSidebar(sidebarRoot, routerAdapter, { t, onLanguageChange });
}

// Header wiring
const headerRoot = document.querySelector('.header');
if (headerRoot) {
  initHeader(headerRoot, {
    i18n: { t, setLanguage, getLanguage, onLanguageChange, offLanguageChange },
    router: { navigate },
    storage,
  });
}

// Main route rendering
const mainRoot = document.querySelector('.main');

// PUBLIC_INTERFACE
function renderRoute() {
  /** Render the page module based on current hash route and re-wire language updates per page render. */
  if (!mainRoot) return;
  const route = getRoute();
  const path = route.path || '/home';

  // Render the matching page module
  try {
    if (path === '/home') {
      HomePage.render(mainRoot, { t, onLanguageChange });
      return;
    }
    if (path === '/status' || path.startsWith('/status/')) {
      StatusPage.render(mainRoot, { t, onLanguageChange });
      return;
    }
    if (path === '/basic' || path.startsWith('/basic/')) {
      BasicSettingsPage.render(mainRoot, { t, onLanguageChange });
      return;
    }
    if (path === '/advanced' || path.startsWith('/advanced/')) {
      AdvancedSettingsPage.render(mainRoot, { t, onLanguageChange });
      return;
    }
    if (path === '/management' || path.startsWith('/management/')) {
      ManagementPage.render(mainRoot, { t, onLanguageChange });
      return;
    }
    if (path === '/application' || path.startsWith('/application/')) {
      const sub = path.split('/')[2] || 'preferences';
      ApplicationPage.render(mainRoot, { ...route.params, sub }, { t, onLanguageChange });
      return;
    }
    // Fallback
    NotFoundPage.render(mainRoot, { t, onLanguageChange });
  } catch (err) {
    mainRoot.innerHTML = `
      <section class="card" role="alert">
        <div class="card-header">An error occurred</div>
        <p class="u-muted">Please navigate to another page.</p>
      </section>
    `;
    const c = globalThis?.console;
    if (c?.error) c.error('Render error:', err);
  }
}

// When route changes, render
onRouteChange(() => renderRoute());

// Re-render current page on language change to update text
onLanguageChange(() => renderRoute());

// First render
renderRoute();
