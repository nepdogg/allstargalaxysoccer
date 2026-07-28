(() => {
  const nav = document.querySelector('[data-section-nav]');
  if (!nav) return;

  const header = document.querySelector('.site-top');
  const links = [...nav.querySelectorAll('a[href^="#"]')];
  const targets = links
    .map(link => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);
  const topButton = nav.querySelector('[data-scroll-top]');

  const syncStickyOffset = () => {
    const mobile = window.matchMedia('(max-width: 760px)').matches;
    const headerHeight = mobile && header ? Math.ceil(header.getBoundingClientRect().height) : 0;
    document.documentElement.style.setProperty('--v205-sticky-header-height', `${headerHeight}px`);
  };

  syncStickyOffset();
  window.addEventListener('resize', syncStickyOffset, { passive: true });
  window.addEventListener('orientationchange', () => window.setTimeout(syncStickyOffset, 120), { passive: true });
  if ('ResizeObserver' in window && header) {
    new ResizeObserver(syncStickyOffset).observe(header);
  }

  const scrollToTarget = target => {
    syncStickyOffset();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  links.forEach(link => {
    link.addEventListener('click', event => {
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      event.preventDefault();
      scrollToTarget(target);
      history.replaceState(null, '', link.getAttribute('href'));
    });
  });

  topButton?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  const setActive = id => {
    links.forEach(link => {
      const active = link.getAttribute('href') === `#${id}`;
      link.classList.toggle('is-active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      const visible = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActive(visible.target.id);
    }, { rootMargin: '-28% 0px -54% 0px', threshold: [0.05, 0.25, 0.5] });
    targets.forEach(target => observer.observe(target));
  }

  document.querySelectorAll('.media-archive-section').forEach(section => {
    if (section.querySelector('[data-back-to-top]')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'section-back-top';
    button.dataset.backToTop = '';
    button.textContent = '↑ Back to Top';
    section.appendChild(button);
  });

  document.querySelectorAll('[data-back-to-top]').forEach(button => {
    button.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  });
})();
