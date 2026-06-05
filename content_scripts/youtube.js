(function () {
  'use strict';

  const WIDGET_ID = 'ytc-widget';
  const STYLES_ID = 'ytc-styles';
  let panelObserver = null;

  const NOTES_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>`;

  const SPIN_SVG = `<svg class="ytc-spin" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>`;

  const AIS = [
    { key: 'claude',  label: 'Summarize with Claude',  color: '#7c3aed' },
    { key: 'gemini',  label: 'Summarize with Gemini',  color: '#4285f4' },
    { key: 'chatgpt', label: 'Summarize with ChatGPT', color: '#10a37f' }
  ];

  const CSS = `
    #ytc-widget {
      background: #0f0e17;
      border: 1px solid #1f1b36;
      border-radius: 12px;
      padding: 12px 14px;
      margin-bottom: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      gap: 8px;
      box-sizing: border-box;
    }

    #ytc-widget.ytc-floating {
      position: fixed;
      bottom: 80px;
      right: 22px;
      z-index: 2147483647;
      width: 260px;
      margin-bottom: 0;
    }

    .ytc-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }

    .ytc-ai-label {
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 12.5px;
      font-weight: 600;
      color: #e2e8f0;
      white-space: nowrap;
    }

    .ytc-ai-label svg { color: #94a3b8; flex-shrink: 0; }

    .ytc-btn {
      display: flex;
      align-items: center;
      gap: 5px;
      padding: 5px 13px;
      border: none;
      border-radius: 7px;
      color: #fff;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: filter 0.15s;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .ytc-btn:hover:not(:disabled) { filter: brightness(1.18); }
    .ytc-btn:disabled { filter: brightness(0.45); cursor: not-allowed; }

    @keyframes ytc-spin { to { transform: rotate(360deg); } }
    .ytc-spin { animation: ytc-spin 0.75s linear infinite; }

    #ytc-toast {
      display: none;
      font-size: 11.5px;
      text-align: center;
      padding-top: 2px;
    }
    #ytc-toast.ytc-success { display: block; color: #34d399; }
    #ytc-toast.ytc-error   { display: block; color: #f87171; }
  `;

  function findInsertionPoint() {
    const sidebar = document.querySelector('#secondary-inner');
    if (sidebar) return { parent: sidebar, before: sidebar.firstElementChild };
    return null;
  }

  function inject() {
    if (!location.search.includes('v=')) {
      const w = document.getElementById(WIDGET_ID);
      if (w) w.style.display = 'none';
      return;
    }

    if (!document.getElementById(STYLES_ID)) {
      const s = document.createElement('style');
      s.id = STYLES_ID;
      s.textContent = CSS;
      document.head.appendChild(s);
    }

    const old = document.getElementById(WIDGET_ID);
    if (old) old.remove();

    const widget = document.createElement('div');
    widget.id = WIDGET_ID;

    const rows = AIS.map(ai => `
      <div class="ytc-row">
        <div class="ytc-ai-label">${NOTES_SVG}<span>${ai.label}</span></div>
        <button class="ytc-btn" data-target="${ai.key}" style="background:${ai.color}">
          Summarize
        </button>
      </div>
    `).join('');

    widget.innerHTML = rows + `<div id="ytc-toast"></div>`;

    const point = findInsertionPoint();
    if (point?.parent && point?.before) {
      point.parent.insertBefore(widget, point.before);
    } else {
      widget.classList.add('ytc-floating');
      document.body.appendChild(widget);
    }

    widget.querySelectorAll('.ytc-btn').forEach(btn => {
      btn.addEventListener('click', () => handleClick(btn));
    });
  }

  async function handleClick(clickedBtn) {
    const target = clickedBtn.dataset.target;
    const allBtns = document.querySelectorAll('#ytc-widget .ytc-btn');

    allBtns.forEach(b => { b.disabled = true; });
    const orig = clickedBtn.innerHTML;
    clickedBtn.innerHTML = SPIN_SVG;

    try {
      const res = await chrome.runtime.sendMessage({ action: 'PROCESS_VIDEO', target });
      showToast(res?.error || '✓ Opened!', res?.error ? 'ytc-error' : 'ytc-success');
    } catch (e) {
      showToast('Error — try reloading.', 'ytc-error');
    }

    allBtns.forEach(b => { b.disabled = false; });
    clickedBtn.innerHTML = orig;
  }

  function showToast(msg, cls) {
    const t = document.getElementById('ytc-toast');
    if (!t) return;
    t.textContent = msg;
    t.className = cls;
    clearTimeout(t._t);
    t._t = setTimeout(() => { t.className = ''; t.textContent = ''; }, 4000);
  }

  function tryInject() {
    if (panelObserver) { panelObserver.disconnect(); panelObserver = null; }
    if (!location.search.includes('v=')) return;
    inject();

    const w = document.getElementById(WIDGET_ID);
    if (w?.classList.contains('ytc-floating')) {
      panelObserver = new MutationObserver(() => {
        if (findInsertionPoint()) {
          panelObserver.disconnect(); panelObserver = null;
          inject();
        }
      });
      panelObserver.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => { panelObserver?.disconnect(); panelObserver = null; }, 20000);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryInject);
  } else {
    tryInject();
  }

  document.addEventListener('yt-navigate-finish', tryInject);
})();
