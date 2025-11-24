//
// Management page module.
//
 // PUBLIC_INTERFACE
export function render(container, i18n = { t: (s) => s }) {
  /** Render Management overview with users/roles/system sections. */
  const title = typeof i18n?.t === 'function' ? i18n.t('pages.management.title') : 'Management';
  const subtitle = typeof i18n?.t === 'function' ? i18n.t('pages.management.subtitle') : 'Manage users, roles, and permissions.';

  container.innerHTML = `
    <section class="u-spacing" aria-labelledby="mgmt-title">
      <div class="card">
        <div class="card-header" id="mgmt-title">${title}</div>
        <p class="u-muted">${subtitle}</p>
      </div>

      <div class="card">
        <div class="card-header">Users</div>
        <ul style="margin:0; padding-left:18px;">
          <li>admin@example.com</li>
          <li>user@example.com</li>
        </ul>
      </div>

      <div class="card">
        <div class="card-header">Roles</div>
        <ul style="margin:0; padding-left:18px;">
          <li>Admin</li>
          <li>Editor</li>
          <li>Viewer</li>
        </ul>
      </div>

      <div class="card">
        <div class="card-header">System</div>
        <p>System settings and maintenance tasks.</p>
      </div>
    </section>
  `;
}
