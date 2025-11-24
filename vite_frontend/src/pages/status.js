//
// Status page module: shows system status placeholders in theme.
//
 // PUBLIC_INTERFACE
export function render(container, i18n = { t: (s) => s }) {
  /** Render the Status page content with simple metric cards. */
  const title = typeof i18n?.t === 'function' ? i18n.t('pages.status.title') : 'System Status';
  const subtitle = typeof i18n?.t === 'function' ? i18n.t('pages.status.subtitle') : 'View system health and live metrics.';

  container.innerHTML = `
    <section class="u-spacing" aria-labelledby="status-title">
      <div class="card">
        <div class="card-header" id="status-title">${title}</div>
        <p class="u-muted">${subtitle}</p>
      </div>

      <div class="card">
        <div class="card-header">Health</div>
        <p><span class="badge success">Healthy</span> All systems nominal.</p>
      </div>

      <div class="card">
        <div class="card-header">Recent Activity</div>
        <ul style="margin:0; padding-left: 18px;">
          <li>Service A deployed successfully</li>
          <li>No incidents reported</li>
        </ul>
      </div>
    </section>
  `;
}
