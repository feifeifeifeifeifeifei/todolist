const { ipcRenderer } = require('electron');

// Watch the .app card's height and report it to the main process so that
// the BrowserWindow can resize itself to match the content (clamped on the
// main side to a sane min/max range).

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

window.addEventListener('DOMContentLoaded', () => {
  startWatching();
});

window.addEventListener('load', () => {
  setTimeout(measureAndReport, 50);
  setTimeout(measureAndReport, 250);
});
