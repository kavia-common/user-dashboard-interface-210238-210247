//
// Minimal, dependency-free DOM utilities.
// Provides query helpers, element creation, render/clear utilities, and event delegation.
// These helpers avoid framework dependencies and keep code terse and readable.
//
// Public API:
// - qs(selector, root?)
// - qsa(selector, root?)
// - create(tag, props?, ...children)
// - render(container, content)
// - clear(node)
// - delegate(root, eventType, selector, handler, options?)
//
// Notes:
// - create(...) supports string, Node, and arrays as children. Strings create text nodes.
// - render(container, content) replaces existing children with provided content.
// - clear(node) removes all child nodes.
// - delegate(...) uses event.target.closest(selector) for robust delegation with bubbling events.
//
// Accessibility:
// - Prefer semantic elements and ensure roles/labels are passed via props when needed.
//

// INTERNAL HELPERS

function isElement(value) {
  // Guard against non-browser environments where DOM constructors may be undefined
  const g = typeof globalThis !== 'undefined' ? globalThis : {};
  const El = g.Element;
  const DF = g.DocumentFragment;
  const Tx = g.Text;

  // Use duck-typing fallback if constructors are unavailable
  if (!El && !DF && !Tx) {
    return !!value && (typeof value.nodeType === 'number' || typeof value.nodeName === 'string');
  }

  return (El && value instanceof El) ||
         (DF && value instanceof DF) ||
         (Tx && value instanceof Tx);
}

function appendChild(parent, child) {
  if (child == null) return;
  if (Array.isArray(child)) {
    for (const c of child) appendChild(parent, c);
    return;
  }
  if (isElement(child)) {
    parent.appendChild(child);
    return;
  }
  // Treat everything else as text
  parent.appendChild(document.createTextNode(String(child)));
}

/**
 * Apply props to an element. Supports:
 * - class / className (string or array of strings)
 * - style (object of CSS properties in camelCase or valid CSS string)
 * - dataset (object, mirrors el.dataset)
 * - events (props starting with "on" and value is function) e.g., onClick
 * - attributes (fallback) set via setAttribute
 */
function applyProps(el, props = {}) {
  for (const [key, value] of Object.entries(props)) {
    if (value == null) continue;

    if (key === 'class' || key === 'className') {
      if (Array.isArray(value)) {
        el.className = value.filter(Boolean).join(' ');
      } else {
        el.className = String(value);
      }
      continue;
    }

    if (key === 'style') {
      if (typeof value === 'string') {
        el.setAttribute('style', value);
      } else if (value && typeof value === 'object') {
        for (const [prop, val] of Object.entries(value)) {
          el.style[prop] = val;
        }
      }
      continue;
    }

    if (key === 'dataset' && value && typeof value === 'object') {
      for (const [dkey, dval] of Object.entries(value)) {
        el.dataset[dkey] = String(dval);
      }
      continue;
    }

    if (key.startsWith('on') && typeof value === 'function') {
      const evt = key.slice(2).toLowerCase();
      el.addEventListener(evt, value);
      continue;
    }

    // Boolean attributes (e.g., disabled, hidden)
    if (typeof value === 'boolean') {
      if (value) el.setAttribute(key, '');
      else el.removeAttribute(key);
      continue;
    }

    // Default: attribute
    el.setAttribute(key, String(value));
  }
}

// PUBLIC_INTERFACE
export function qs(selector, root = document) {
  /** Query a single element using CSS selector within optional root (default: document). */
  return root.querySelector(selector);
}

// PUBLIC_INTERFACE
export function qsa(selector, root = document) {
  /** Query all elements matching CSS selector within optional root (default: document); returns Array<Element>. */
  return Array.from(root.querySelectorAll(selector));
}

// PUBLIC_INTERFACE
export function create(tag, props, ...children) {
  /** Create an element with optional props and children. Strings become text nodes; arrays are flattened. */
  if (!tag || typeof tag !== 'string') {
    throw new Error('create(tag, ...) requires a valid tag string.');
  }
  const el = document.createElement(tag);
  if (props && typeof props === 'object') {
    applyProps(el, props);
  }
  for (const child of children) appendChild(el, child);
  return el;
}

// PUBLIC_INTERFACE
export function render(container, content) {
  /** Replace container's children with content. Content may be string, Node, or array of Nodes/strings. */
  if (!container) return;
  clear(container);
  appendChild(container, content);
}

// PUBLIC_INTERFACE
export function clear(node) {
  /** Remove all child nodes from the given node. */
  if (!node) return;
  while (node.firstChild) node.removeChild(node.firstChild);
}

// PUBLIC_INTERFACE
export function delegate(root, eventType, selector, handler, options) {
  /** Event delegation: listen on root, invoke handler when event.target.closest(selector) matches. Returns unsubscribe function. */
  if (!root || typeof root.addEventListener !== 'function') {
    throw new Error('delegate(...) invalid root provided.');
  }
  if (typeof handler !== 'function') {
    throw new Error('delegate(...) requires a handler function.');
  }
  const listener = (event) => {
    const target = event.target && event.target.closest ? event.target.closest(selector) : null;
    if (target && root.contains(target)) {
      handler(event, target);
    }
  };
  root.addEventListener(eventType, listener, options);
  return () => root.removeEventListener(eventType, listener, options);
}
