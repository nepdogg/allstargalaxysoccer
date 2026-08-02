(() => {
  "use strict";
  const pages = document.querySelectorAll('body[class*="page-"]');
  if (!pages.length) return;
  const body=document.body;
  const header=document.querySelector('header.site-top');
  if(!header) return;
  const heroBar=header.querySelector('.hero-bar');
  const nav=header.querySelector('nav');

  // Remove stale duplicate controls, then build one deterministic Search control.
  header.querySelectorAll('.mobile-search-button,.site-search-button-desktop').forEach(el=>el.remove());
  if(nav){
    const desktop=document.createElement('button');
    desktop.type='button'; desktop.className='site-search-button-desktop';
    desktop.setAttribute('aria-label','Search Allstar Galaxy');
    desktop.innerHTML='<span class="search-symbol" aria-hidden="true">⌕</span><span>Search</span>';
    desktop.addEventListener('click',()=>document.querySelector('[data-galaxy-search-open]')?.click());
    nav.appendChild(desktop);
  }
  if(heroBar){
    const mobile=document.createElement('button');
    mobile.type='button'; mobile.className='mobile-search-button';
    mobile.setAttribute('aria-label','Search Allstar Galaxy');
    mobile.innerHTML='<span class="search-symbol" aria-hidden="true">⌕</span><span>SEARCH</span>';
    mobile.addEventListener('click',()=>document.querySelector('[data-galaxy-search-open]')?.click());
    heroBar.appendChild(mobile);
  }

  // Mark current navigation item semantically and remove accidental active states.
  if(nav){
    const path=(location.pathname.split('/').pop()||'index.html').toLowerCase();
    nav.querySelectorAll('a').forEach(a=>{
      const href=(a.getAttribute('href')||'').split('#')[0].toLowerCase();
      const active=(href===path)||(path===''&&href==='index.html');
      a.classList.toggle('active',active);
      if(active)a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current');
    });
  }

  // Release stale scroll locks left behind by modals or prior mobile frameworks.
  const unlock=()=>{
    if(!document.querySelector('.shuffle-modal.is-open,.game-video-modal.is-open,.player-profile-modal.is-open,[aria-modal="true"].is-open')){
      document.documentElement.style.removeProperty('overflow');
      body.style.removeProperty('overflow');
      body.style.removeProperty('height');
      body.classList.remove('modal-open','no-scroll','scroll-locked');
    }
  };
  unlock(); window.addEventListener('pageshow',unlock); window.addEventListener('hashchange',unlock);
})();
