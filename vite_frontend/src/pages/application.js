/* eslint-disable no-undef */
//
// Application page module: includes Preferences, Updates, and About.
// About displays available import.meta.env VITE_* values in a table.
//
/* eslint-enable no-undef */

function envTableRows() {
  // Filter and present only VITE_* variables for safety.
  // Safely read Vite environment injected at build time.
  let env = {};
  try {
    // Vite replaces import.meta.env at build; in non-vite contexts, this may throw.
    // eslint-disable-next-line no-undef
    env = (import.meta && import.meta.env) ? import.meta.env : {};
  } catch {
    env = {};
  }
  const entries = Object.keys(env)
    .filter((k) => k.startsWith('VITE_'))
    .sort()
    .map((k) => [k, String(env[k])]);

  if (entries.length === 0) {
    return '<tr><td colspan="2" class="u-muted">No VITE_* variables found.</td></tr>';
  }

  return entries
    .map(([k, v]) => `<tr><td style="font-weight:600;">${k}</td><td><code>${escapeHtml(v)}</code></td></tr>`)
    .join('');
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

// PUBLIC_INTERFACE
export function render(container, params = {}, i18n = { t: (s) => s }) {
  /** Render Application section; chooses sub-view by params.sub or route path. */
  const title = typeof i18n?.t === 'function' ? i18n.t('pages.application.title') : 'Application';
  const subtitle = typeof i18n?.t === 'function' ? i18n.t('pages.application.subtitle') : 'Application-level configuration and tools.';

  // Determine subview from params or location hash
  let sub = params && typeof params === 'object' ? params.sub : undefined;
  if (!sub && typeof globalThis !== 'undefined' && globalThis.location && globalThis.location.hash) {
    const path = globalThis.location.hash.replace(/^#/, '');
    if (path.startsWith('/application/')) {
      sub = path.slice('/application/'.length);
    }
  }
  if (!sub) sub = 'preferences';

  let body = '';
  if (sub === 'preferences') {
    body = `
      <div class="card">
        <div class="card-header">Preferences</div>
        <label class="label" for="theme">Theme</label>
        <select id="theme" class="select">
          <option selected>Ocean Professional</option>
          <option>System Default</option>
        </select>
        <div style="margin-top: var(--space-6);">
          <button type="button" class="btn btn-primary">Save</button>
        </div>
      </div>
    `;
  } else if (sub === 'updates') {
    body = `
      <div class="card">
        <div class="card-header">Updates</div>
        <p>You're up to date.</p>
        <div style="margin-top: var(--space-6);">
          <button type="button" class="btn btn-secondary">Check for updates</button>
        </div>
      </div>
    `;
  } else if (sub === 'about') {
    body = `
      <div class="card">
        <div class="card-header">About</div>
        <p class="u-muted">Environment variables exposed to the client (VITE_*):</p>
        <div style="overflow:auto;">
          <table style="width:100%; border-collapse: collapse; margin-top: var(--space-4);">
            <thead>
              <tr>
                <th style="text-align:left; border-bottom:1px solid var(--border-color); padding-bottom:6px;">Name</th>
                <th style="text-align:left; border-bottom:1px solid var(--border-color); padding-bottom:6px;">Value</th>
              </tr>
            </thead>
            <tbody>
              ${envTableRows()}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } else {
    body = `
      <div class="card">
        <div class="card-header">Section</div>
        <p class="u-muted">Unknown section: ${escapeHtml(sub)}</p>
      </div>
    `;
  }

  container.innerHTML = `
    <section class="u-spacing" aria-labelledby="app-title">
      <div class="card">
        <div class="card-header" id="app-title">${title}</div>
        <p class="u-muted">${subtitle}</p>
      </div>
      ${body}
    </section>
  `;
}
