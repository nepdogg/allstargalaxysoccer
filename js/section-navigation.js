(() => {
  const nav = document.querySelector('[data-section-nav]');
  if (!nav) return;

  const header = document.querySelector('.site-top');
  const hero = document.querySelector('.hero-image');
  const links = [...nav.querySelectorAll('a[href^="#"]')];
  const targets = links.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  const topButton = nav.querySelector('[data-scroll-top]');

  const syncHeaderHeight = () => {
    const height = header ? Math.ceil(header.getBoundingClientRect().height) : 0;
    document.documentElement.style.setProperty('--v206-sticky-header-height', `${height}px`);
  };

  const syncVisibility = () => {
    if (!hero) {
      nav.classList.add('is-section-nav-visible');
      return;
    }
    const headerHeight = header ? header.getBoundingClientRect().height : 0;
    const heroBottom = hero.getBoundingClientRect().bottom;
    nav.classList.toggle('is-section-nav-visible', heroBottom <= headerHeight + 8);
  };

  const sync = () => {
    syncHeaderHeight();
    syncVisibility();
  };

  sync();
  window.addEventListener('scroll', syncVisibility, { passive: true });
  window.addEventListener('resize', sync, { passive: true });
  window.addEventListener('orientationchange', () => window.setTimeout(sync, 140), { passive: true });
  if ('ResizeObserver' in window && header) new ResizeObserver(sync).observe(header);

  const scrollToTarget = target => {
    syncHeaderHeight();
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

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  topButton?.addEventListener('click', scrollTop);

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
      const visible = entries.filter(entry => entry.isIntersecting).sort((a,b) => b.intersectionRatio-a.intersectionRatio)[0];
      if (visible) setActive(visible.target.id);
    }, { rootMargin: '-25% 0px -56% 0px', threshold: [0.05,0.2,0.45] });
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
  document.querySelectorAll('[data-back-to-top]').forEach(button => button.addEventListener('click', scrollTop));
})();
