//
// Not Found page module.
//
 // PUBLIC_INTERFACE
export function render(container, i18n = { t: (s) => s }) {
  /** Render a simple 404-like message. */
  const title = typeof i18n?.t === 'function' ? i18n.t('pages.notFound.title') : 'Page Not Found';
  const subtitle = typeof i18n?.t === 'function' ? i18n.t('pages.notFound.subtitle') : 'The page you are looking for does not exist.';

  container.innerHTML = `
    <section class="card" aria-labelledby="nf-title">
      <div class="card-header" id="nf-title">${title}</div>
      <p class="u-muted">${subtitle}</p>
      <div style="margin-top: var(--space-6);">
        <a class="btn btn-primary" href="#/home">Go Home</a>
      </div>
    </section>
  `;
}
