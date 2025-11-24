//
// Advanced Settings page module.
//
 // PUBLIC_INTERFACE
export function render(container, i18n = { t: (s) => s }) {
  /** Render Advanced Settings with example advanced options. */
  const title = typeof i18n?.t === 'function' ? i18n.t('pages.advancedSettings.title') : 'Advanced Settings';
  const subtitle = typeof i18n?.t === 'function' ? i18n.t('pages.advancedSettings.subtitle') : 'Tweak advanced parameters.';

  container.innerHTML = `
    <section class="u-spacing" aria-labelledby="advanced-title">
      <div class="card">
        <div class="card-header" id="advanced-title">${title}</div>
        <p class="u-muted">${subtitle}</p>
      </div>

      <div class="card">
        <div class="card-header">Performance</div>
        <label class="label" for="cacheSize">Cache Size (MB)</label>
        <input id="cacheSize" class="input" type="number" min="0" value="128" />
        <div style="height: var(--space-4)"></div>
        <label class="label" for="logLevel">Log Level</label>
        <select id="logLevel" class="select">
          <option>error</option>
          <option>warn</option>
          <option selected>info</option>
          <option>debug</option>
          <option>trace</option>
        </select>
        <div style="margin-top: var(--space-6);">
          <button type="button" class="btn btn-primary">Apply</button>
        </div>
      </div>

      <div class="card">
        <div class="card-header">Security</div>
        <label class="label" for="sessionTimeout">Session Timeout (minutes)</label>
        <input id="sessionTimeout" class="input" type="number" min="5" value="30" />
      </div>
    </section>
  `;
}
