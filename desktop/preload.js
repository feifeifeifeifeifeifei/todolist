const { ipcRenderer } = require('electron');

// =============================================================================
// 1) Auto-grow watcher: report .app's CSS height back to main on every change
// =============================================================================

let lastReported = 0;
let observer = null;
let attachInterval = null;

function measureAndReport() {
  const card = document.querySelector('.app');
  if (!card) return;
  const rect = card.getBoundingClientRect();
  const cardHeight = rect.height;
  if (!Number.isFinite(cardHeight) || cardHeight <= 0) return;
  const next = Math.ceil(cardHeight);
  if (Math.abs(next - lastReported) < 1) return;
  lastReported = next;
  ipcRenderer.send('content-height', next);
}

function attachObserver() {
  const card = document.querySelector('.app');
  if (!card) return false;

  if (observer) observer.disconnect();
  observer = new ResizeObserver(() => {
    measureAndReport();
  });
  observer.observe(card);

  measureAndReport();
  return true;
}

function startWatching() {
  if (attachObserver()) return;
  attachInterval = setInterval(() => {
    if (attachObserver()) {
      clearInterval(attachInterval);
      attachInterval = null;
    }
  }, 50);
}

// =============================================================================
// 2) Minimal-mode toggle: inject a button next to the gear that hides every
//    non-essential element. Persists in localStorage so it survives reloads.
// =============================================================================

const MINIMAL_KEY = 'electron-minimal-mode';

const ICON_MINIMIZE = `<svg class="icon-minimize" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`;
const ICON_EXPAND = `<svg class="icon-expand" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`;

function readMinimalState() {
  try {
    return window.localStorage.getItem(MINIMAL_KEY) === '1';
  } catch {
    return false;
  }
}

function writeMinimalState(active) {
  try {
    window.localStorage.setItem(MINIMAL_KEY, active ? '1' : '0');
  } catch {
    /* ignore quota / privacy errors */
  }
}

function requestFitWindow() {
  // ask main to refit the window to whatever the card's natural height is now,
  // overriding the usual "only grow" rule (used when the user toggles minimal
  // mode and the card just got shorter)
  const card = document.querySelector('.app');
  if (!card) return;
  const h = Math.ceil(card.getBoundingClientRect().height);
  if (!Number.isFinite(h) || h <= 0) return;
  ipcRenderer.send('content-height-fit', h);
}

function ensureMinimalToggle() {
  if (document.getElementById('electron-minimal-toggle')) return;
  if (!document.body) return;

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.id = 'electron-minimal-toggle';
  btn.setAttribute('aria-label', 'Toggle minimal view');
  btn.title = 'Toggle minimal view';
  btn.innerHTML = ICON_MINIMIZE + ICON_EXPAND;
  btn.addEventListener('click', () => {
    const next = !document.body.classList.contains('app--minimal');
    document.body.classList.toggle('app--minimal', next);
    writeMinimalState(next);
    // wait for layout to settle before refitting the window
    requestAnimationFrame(() => requestAnimationFrame(requestFitWindow));
  });

  document.body.appendChild(btn);

  if (readMinimalState()) {
    document.body.classList.add('app--minimal');
  }
}

// React replaces the contents of #root after mount, but #electron-minimal-toggle
// lives directly under <body> (outside #root) so React's reconciler ignores it.
// Still, set up a MutationObserver as a safety net in case the body is reset.
function watchForBodyResets() {
  const mo = new MutationObserver(() => {
    if (!document.getElementById('electron-minimal-toggle')) {
      ensureMinimalToggle();
    }
  });
  mo.observe(document.documentElement, { childList: true, subtree: false });
  if (document.body) {
    mo.observe(document.body, { childList: true });
  }
}

// =============================================================================
// Bootstrapping
// =============================================================================

window.addEventListener('DOMContentLoaded', () => {
  ensureMinimalToggle();
  watchForBodyResets();
  startWatching();
});

window.addEventListener('load', () => {
  setTimeout(measureAndReport, 50);
  setTimeout(measureAndReport, 250);
});
