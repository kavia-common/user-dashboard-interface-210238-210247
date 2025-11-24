//
// Header component: Ocean Professional themed, accessible, with language switch and account/logout.
//
// Public API:
// - initHeader(rootEl, { i18n, router, storage })
//
// Behavior:
// - Renders left-aligned app title; right-aligned controls: language switch (EN/ES), username, Logout.
// - Language persisted via storage and updates labels on change.
// - Logout clears session via storage and navigates to /home.
// - Accessible: buttons with aria-pressed, aria-labels, keyboard support.
// - If import.meta.env.VITE_BACKEND_URL exists, a commented placeholder shows future logout fetch.
//
// Dependencies: src/utils/dom.js
//

import { create, render, delegate, qs } from '../utils/dom.js';

// Safe console shim for environments where console may be undefined (lint-safe)
const log = (() => {
  const g = typeof globalThis !== 'undefined' ? globalThis : {};
  const c = g.console || {};
  return {
    debug: typeof c.debug === 'function' ? c.debug.bind(c) : () => {},
    warn: typeof c.warn === 'function' ? c.warn.bind(c) : () => {},
  };
})();

// Storage keys within provided namespaced storage
const STORAGE_KEYS = Object.freeze({
  lang: 'lang',
  session: 'session', // Expected to hold session info if used by app
  username: 'username', // Optional username to display
});



/**
 * Build language toggle controls: EN | ES
 * - aria-pressed on active language
 * - persists via storage if provided; otherwise through i18n module itself
 */
function buildLanguageSwitcher(i18n, storage) {
  const current = typeof i18n?.getLanguage === 'function' ? i18n.getLanguage() : 'en';

  const langGroup = create(
    'div',
    {
      role: 'group',
      'aria-label': (typeof i18n?.t === 'function' ? i18n.t('header.language') : 'Language') + ' switcher',
      class: 'actions',
    },
    create(
      'button',
      {
        type: 'button',
        class: ['btn', 'btn-ghost'].join(' '),
        'data-lang': 'en',
        'aria-pressed': String(current === 'en'),
        'aria-label': 'Switch language to English',
      },
      'EN',
    ),
    create(
      'button',
      {
        type: 'button',
        class: ['btn', 'btn-ghost'].join(' '),
        'data-lang': 'es',
        'aria-pressed': String(current === 'es'),
        'aria-label': 'Cambiar idioma a Español',
      },
      'ES',
    ),
  );

  // Initialize persisted language from storage if available
  try {
    if (storage && typeof storage.get === 'function') {
      const saved = storage.get(STORAGE_KEYS.lang, null);
      if (saved && typeof i18n?.setLanguage === 'function' && saved !== current) {
        i18n.setLanguage(saved);
        // Update aria-pressed after setting
        const enBtn = qs('button[data-lang="en"]', langGroup);
        const esBtn = qs('button[data-lang="es"]', langGroup);
        if (enBtn && esBtn) {
          enBtn.setAttribute('aria-pressed', String(saved === 'en'));
          esBtn.setAttribute('aria-pressed', String(saved === 'es'));
        }
      }
    }
  } catch (err) {
    log.debug('Header: failed to read persisted language', err);
  }

  return langGroup;
}

/**
 * Build account display and logout button container.
 */
function buildAccountArea(i18n, storage) {
  const username =
    (storage && typeof storage.get === 'function' && storage.get(STORAGE_KEYS.username, 'User')) || 'User';

  const labelAccount = typeof i18n?.t === 'function' ? i18n.t('header.account') : 'Account';
  const labelLogout = typeof i18n?.t === 'function' ? i18n.t('header.logout') : 'Logout';

  const userLabel = create(
    'span',
    { class: 'u-inline-center u-muted', 'aria-label': `${labelAccount}: ${username}` },
    create('span', { class: 'badge secondary', 'aria-hidden': 'true' }, labelAccount),
    create('span', null, username),
  );

  const logoutBtn = create(
    'button',
    {
      type: 'button',
      class: ['btn', 'btn-primary'].join(' '),
      'data-action': 'logout',
      'aria-label': labelLogout,
    },
    labelLogout,
  );

  return create('div', { class: 'actions', role: 'group', 'aria-label': 'Account controls' }, userLabel, logoutBtn);
}

/**
 * Render the full header content.
 */
function renderHeader(container, { i18n, storage }) {
  const appTitle = typeof i18n?.t === 'function' ? i18n.t('app.title') : 'User Dashboard';
  const titleEl = create(
    'h1',
    {
      class: 'u-inline-center',
      style: {
        margin: '0',
        marginRight: 'auto',
        fontSize: '18px',
        fontWeight: '800',
        color: 'var(--color-primary)',
      },
      'aria-label': appTitle,
    },
    appTitle,
  );

  const langSwitcher = buildLanguageSwitcher(i18n, storage);
  const accountArea = buildAccountArea(i18n, storage);

  const wrapper = create(
    'div',
    {
      class: 'header-inner',
      style: {
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        gap: '12px',
      },
    },
    titleEl,
    langSwitcher,
    accountArea,
  );

  render(container, wrapper);
}

/**
 * Attach behaviors for language switch and logout.
 */
function attachBehaviors(container, { i18n, router, storage }) {
  // Language switching via delegation
  const unsubLangClick = delegate(container, 'click', 'button[data-lang]', (evt, target) => {
    const lang = target.getAttribute('data-lang');
    if (!lang) return;
    try {
      if (typeof i18n?.setLanguage === 'function') {
        i18n.setLanguage(lang);
      }
      if (storage && typeof storage.set === 'function') {
        storage.set(STORAGE_KEYS.lang, lang);
      }
      // Update aria-pressed on both
      const enBtn = qs('button[data-lang="en"]', container);
      const esBtn = qs('button[data-lang="es"]', container);
      if (enBtn && esBtn) {
        enBtn.setAttribute('aria-pressed', String(lang === 'en'));
        esBtn.setAttribute('aria-pressed', String(lang === 'es'));
      }
    } catch (err) {
      log.debug('Header: set language failed', err);
    }
  });

  // Keyboard support for language switch (Enter/Space)
  const unsubLangKey = delegate(container, 'keydown', 'button[data-lang]', (evt, target) => {
    const key = evt.key;
    if (key === 'Enter' || key === ' ') {
      evt.preventDefault();
      target.click();
    }
  });

  // Logout handling
  const unsubLogout = delegate(container, 'click', 'button[data-action="logout"]', async () => {
    try {
      // Clear session items
      if (storage) {
        try { storage.remove(STORAGE_KEYS.session); } catch (err) { log.debug('Header: session clear failed', err); }
        try { storage.remove(STORAGE_KEYS.username); } catch (err) { log.debug('Header: username clear failed', err); }
      }

      // Placeholder for a future real API call:
      // If backend URL is configured, a future logout fetch can be enabled here.
      // Example:
      // if (import.meta?.env?.VITE_BACKEND_URL) {
      //   await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/logout`, { method: 'POST', credentials: 'include' });
      // }

      // Navigate to /home
      if (router && typeof router.navigate === 'function') {
        router.navigate('/home');
      } else if (typeof globalThis !== 'undefined' && globalThis.location) {
        globalThis.location.hash = '#/home';
      }
    } catch (err) {
      // ignore logout errors to avoid trapping user; still navigate
      if (router && typeof router.navigate === 'function') {
        router.navigate('/home');
      }
      log.warn('Header: logout encountered an error', err);
    }
  });

  // No extra language change listener here; initHeader wires a full re-render on language change.
  return () => {
    try { unsubLangClick(); } catch (err) { log.debug('Header: detach lang click failed', err); }
    try { unsubLangKey(); } catch (err) { log.debug('Header: detach lang key failed', err); }
    try { unsubLogout(); } catch (err) { log.debug('Header: detach logout failed', err); }
  };
}

// PUBLIC_INTERFACE
export function initHeader(rootEl, { i18n, router, storage } = {}) {
  /** Initialize and mount the header into the provided rootEl. Includes language switch and logout. */
  if (!rootEl) {
    throw new Error('initHeader(rootEl, { i18n, router, storage }) requires a valid root element.');
  }

  // Render once
  renderHeader(rootEl, { i18n, storage });
  let teardown = attachBehaviors(rootEl, { i18n, router, storage });

  // Wire i18n updates to re-render
  const onLangChange = () => {
    try { teardown(); } catch (err) { log.debug('Header: teardown before rerender failed', err); }
    renderHeader(rootEl, { i18n, storage });
    teardown = attachBehaviors(rootEl, { i18n, router, storage });
  };

  if (i18n && typeof i18n.onLanguageChange === 'function') {
    i18n.onLanguageChange(onLangChange);
  }

  return {
    unmount() {
      // PUBLIC_INTERFACE
      /** Unmount the header: removes listeners; caller may clear rootEl content if needed. */
      try { teardown(); } catch (err) { log.debug('Header: teardown on unmount failed', err); }
      if (i18n && typeof i18n.offLanguageChange === 'function') {
        try { i18n.offLanguageChange(onLangChange); } catch (err) { log.debug('Header: offLanguageChange detach failed', err); }
      }
    },
  };
}
