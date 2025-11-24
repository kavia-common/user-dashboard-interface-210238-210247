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
