//
// Basic Settings page module: simple form placeholders.
//
 // PUBLIC_INTERFACE
export function render(container, i18n = { t: (s) => s }) {
  /** Render Basic Settings: demonstrates themed form controls. */
  const title = typeof i18n?.t === 'function' ? i18n.t('pages.basicSettings.title') : 'Basic Settings';
  const subtitle = typeof i18n?.t === 'function' ? i18n.t('pages.basicSettings.subtitle') : 'Configure common settings.';

  container.innerHTML = `
    <section class="u-spacing" aria-labelledby="basic-title">
      <div class="card">
        <div class="card-header" id="basic-title">${title}</div>
        <p class="u-muted">${subtitle}</p>
      </div>

      <form class="card" aria-labelledby="profile-title">
        <div class="card-header" id="profile-title">Profile</div>
        <label class="label" for="displayName">Display Name</label>
        <input id="displayName" class="input" placeholder="Enter display name" />
        <div style="height: var(--space-4)"></div>
        <label class="label" for="email">Email</label>
        <input id="email" class="input" type="email" placeholder="you@example.com" aria-invalid="false" />
        <div style="margin-top: var(--space-6);">
          <button type="button" class="btn btn-primary">Save</button>
          <button type="reset" class="btn btn-ghost" style="margin-left: var(--space-3);">Reset</button>
        </div>
      </form>
    </section>
  `;
}
