//
// Home page module: Ocean Professional themed.
//
 // PUBLIC_INTERFACE
export function render(container, i18n = { t: (s) => s }) {
  /** Render the Home page content into the provided container. */
  const title = typeof i18n?.t === 'function' ? i18n.t('pages.home.title') : 'Welcome to the Dashboard';
  const subtitle = typeof i18n?.t === 'function' ? i18n.t('pages.home.subtitle') : 'Select an item from the menu to get started.';

  container.innerHTML = `
    <section class="card" aria-labelledby="home-title">
      <div class="card-header" id="home-title">${title}</div>
      <p class="u-muted">${subtitle}</p>
      <div class="u-spacing" style="margin-top: var(--space-6);">
        <div class="badge success" aria-label="Status good">OK</div>
        <div>
          <p>Use the left navigation to explore Status, Settings, Management, and Application tools.</p>
        </div>
      </div>
    </section>
  `;
}
