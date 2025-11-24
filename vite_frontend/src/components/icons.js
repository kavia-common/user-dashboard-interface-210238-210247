//
// Minimal inline SVG icons. All icons use currentColor for stroke/fill.
// PUBLIC_INTERFACE
export function icon(name, attrs = {}) {
  /**
   * Returns an inline SVG string for the given icon name using currentColor.
   * Available names: home, pulse, sliders, gear, shield, tools, apps, globe, lan, wan, wlan, dhcp, log, service, ddns, dmz, ntp, ssh, firmware, upnp
   */
  const base = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', role: 'img', 'aria-hidden': 'true' };
  const a = Object.assign({}, base, attrs || {});
  const attrsStr = Object.entries(a)
    .map(([k, v]) => `${k}="${String(v)}"`)
    .join(' ');

  const paths = {
    home: '<path d="M3 11l9-7 9 7"></path><path d="M9 22V12h6v10"></path>',
    pulse: '<path d="M3 12h4l2-6 4 12 2-6h6"></path>',
    sliders: '<path d="M4 21v-7"></path><path d="M4 10V3"></path><path d="M12 21v-3"></path><path d="M12 12V3"></path><path d="M20 21v-9"></path><path d="M20 8V3"></path><circle cx="4" cy="14" r="2"></circle><circle cx="12" cy="15" r="2"></circle><circle cx="20" cy="12" r="2"></circle>',
    gear: '<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06A2 2 0 1 1 7.04 3.1l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c0 .68.4 1.3 1.02 1.58.3.14.63.21.98.21A2 2 0 1 1 21 12h-.09a1.65 1.65 0 0 0-1.51 1z"></path>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>',
    tools: '<path d="M14.7 6.3a4 4 0 1 0-5.66 5.66L3 18l3 3 6.04-6.04a4 4 0 0 0 5.66-5.66"></path>',
    apps: '<rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect>',
    globe: '<circle cx="12" cy="12" r="10"></circle><path d="M2 12h20"></path><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>',
    lan: '<rect x="9" y="3" width="6" height="4" rx="1"></rect><path d="M12 7v4"></path><rect x="4" y="15" width="6" height="6" rx="1"></rect><rect x="14" y="15" width="6" height="6" rx="1"></rect><path d="M7 15v-2h10v2"></path>',
    wan: '<path d="M12 2v20"></path><path d="M5 9l7-7 7 7"></path><path d="M8 22h8"></path>',
    wlan: '<path d="M2 8.5C6.97 4.5 17.03 4.5 22 8.5"></path><path d="M5 12c4-3 10-3 14 0"></path><path d="M8.5 15.5c2.3-1.7 4.7-1.7 7 0"></path><circle cx="12" cy="19" r="1.5"></circle>',
    dhcp: '<rect x="3" y="3" width="18" height="10" rx="2"></rect><path d="M7 21h10"></path><path d="M12 13v8"></path>',
    log: '<rect x="3" y="4" width="14" height="16" rx="2"></rect><path d="M7 8h6"></path><path d="M7 12h6"></path><path d="M7 16h6"></path><path d="M19 7v10"></path>',
    service: '<path d="M12 6v12"></path><path d="M6 12h12"></path><circle cx="12" cy="12" r="9"></circle>',
    ddns: '<path d="M21 16a4 4 0 0 1-4 4H7a4 4 0 1 1 0-8h10a4 4 0 0 0 0-8H7"></path>',
    dmz: '<path d="M4 20h16"></path><path d="M12 4l7 7-7 7-7-7 7-7z"></path>',
    ntp: '<circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path>',
    ssh: '<rect x="3" y="11" width="18" height="10" rx="2"></rect><path d="M7 11V7a5 5 0 1 1 10 0v4"></path>',
    firmware: '<path d="M6 2h12v6H6z"></path><path d="M6 8h12v14H6z"></path><path d="M10 12h4"></path><path d="M10 16h4"></path>',
    upnp: '<circle cx="12" cy="12" r="3"></circle><path d="M2 12a10 10 0 0 1 20 0"></path><path d="M5 12a7 7 0 0 1 14 0"></path>'
  };

  const body = paths[name] || paths.home;
  return `<svg class="icon" ${attrsStr}>${body}</svg>`;
}
