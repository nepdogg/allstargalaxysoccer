/* Allstar Galaxy V263 — scroll-lock and universal header runtime repair. */
(() => {
  const pageBody = document.body;
  if (!pageBody || !/\bpage-/.test(pageBody.className)) return;

  const modalIsOpen = () => {
    const selectors = [
      '.modal.is-open', '.modal.open', '.modal[aria-hidden="false"]',
      '.lightbox.is-open', '.lightbox.open',
      '.galaxy-search-overlay.is-open', '.galaxy-search-overlay.open',
      '[role="dialog"][aria-modal="true"]:not([hidden])'
    ];
    return selectors.some(sel => {
      const el = document.querySelector(sel);
      if (!el) return false;
      const s = getComputedStyle(el);
      return s.display !== 'none' && s.visibility !== 'hidden' && s.opacity !== '0';
    });
  };

  const clearStaleScrollLocks = () => {
    if (modalIsOpen()) return;
    const targets = [document.documentElement, pageBody, document.querySelector('.site-shell')].filter(Boolean);
    targets.forEach(el => {
      el.classList.remove('no-scroll', 'scroll-lock', 'is-locked', 'modal-open', 'search-open');
      if (el.style) {
        ['overflow','overflowY','height','maxHeight','position','top','left','right','width','touchAction'].forEach(k => {
          const v = el.style[k];
          if (v && (/hidden|fixed|100vh|100dvh|none/.test(v) || ['top','left','right','width'].includes(k))) el.style[k] = '';
        });
      }
    });
  };

  const normalizeHeader = () => {
    const header = document.querySelector('header.site-top');
    if (!header) return;
    header.querySelectorAll('nav a').forEach(a => {
      a.style.pointerEvents = 'auto';
      a.style.cursor = 'pointer';
      a.removeAttribute('draggable');
    });
    const current = location.pathname.split('/').pop() || 'index.html';
    header.querySelectorAll('nav a').forEach(a => {
      const href = (a.getAttribute('href') || '').split('#')[0];
      const active = href === current || (current === '' && href === 'index.html');
      if (active) { a.classList.add('active'); a.setAttribute('aria-current','page'); }
      else if (a.getAttribute('aria-current') === 'page') a.removeAttribute('aria-current');
    });
  };

  const run = () => { clearStaleScrollLocks(); normalizeHeader(); };
  document.addEventListener('DOMContentLoaded', run, { once:true });
  window.addEventListener('pageshow', run);
  window.addEventListener('load', run, { once:true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) run(); });

  // Catch late scripts that leave body locked after a popup is removed.
  const observer = new MutationObserver(() => requestAnimationFrame(clearStaleScrollLocks));
  observer.observe(document.documentElement, {attributes:true, subtree:true, attributeFilter:['class','style','hidden','aria-hidden']});
  setInterval(clearStaleScrollLocks, 1500);
})();
