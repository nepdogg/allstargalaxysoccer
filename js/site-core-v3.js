/**
 * Allstar Galaxy Website Core v3.0
 * Centralizes the public navigation and Galaxy Search so future updates are
 * made once instead of page-by-page.
 */
(() => {
  'use strict';

  const NAV_ITEMS = [
    ['Home', 'index.html'],
    ['Team', 'team.html'],
    ['Schedule', 'schedule.html'],
    ['Media', 'media.html'],
    ['News', 'news.html'],
    ['Live', 'livestream.html'],
    ['Follow', 'follow.html']
  ];
  const DATA_URLS = ['data/master-content.json', 'master-content.json'];
  const FILTERS = [
    ['all', 'All'], ['games', 'Games'], ['awards', 'Awards'],
    ['players', 'Players'], ['seasons', 'Seasons'],
    ['playlists', 'Playlists'], ['news', 'News']
  ];

  const state = { records: [], loaded: false, loading: null, filter: 'all', lastFocus: null };
  const normalize = value => String(value ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[char]));
  const isVisible = item => item && !['hidden', 'draft', 'unpublished'].includes(normalize(item.status));
  const validLink = value => {
    const link = String(value || '').trim();
    return /^(https?:\/\/|mailto:|tel:|[^:]+\.html(?:[#?].*)?|#)/i.test(link) ? link : '';
  };
  const pageName = () => (location.pathname.split('/').pop() || 'index.html').toLowerCase();

  function installNavigation() {
    const header = document.querySelector('header.site-top, header');
    if (!header) return;
    let nav = header.querySelector('nav');
    if (!nav) {
      nav = document.createElement('nav');
      header.appendChild(nav);
    }

    const current = pageName();
    nav.classList.add('site-nav-v3');
    nav.innerHTML = NAV_ITEMS.map(([label, href]) => {
      const active = current === href || (href === 'team.html' && current === 'players.html');
      return `<a href="${href}"${active ? ' class="active" aria-current="page"' : ''}>${label}</a>`;
    }).join('') + '<button type="button" class="site-search-button site-search-button-desktop" data-galaxy-search-open aria-label="Open Galaxy Search"><span aria-hidden="true">⌕</span><b>Search</b></button>';

    const rightLogo = header.querySelector('.hero-logo-right');
    if (rightLogo) {
      rightLogo.classList.add('desktop-right-logo');
      if (!header.querySelector('.mobile-search-button')) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'mobile-search-button';
        button.setAttribute('data-galaxy-search-open', '');
        button.setAttribute('aria-label', 'Open Galaxy Search');
        button.innerHTML = '<span aria-hidden="true">⌕</span>';
        rightLogo.insertAdjacentElement('afterend', button);
      }
    }
  }

  function buildRecords(data) {
    const output = [];
    const games = Array.isArray(data.games) ? data.games : [];
    const players = Array.isArray(data.players) ? data.players : [];

    games.filter(isVisible).forEach(game => {
      const title = [game.season, game.gameNumber ? `Game ${game.gameNumber}` : '', game.opponent ? `vs ${game.opponent}` : ''].filter(Boolean).join(' ');
      const actions = [
        ['Full Match', validLink(game.fullMatch)],
        ['Highlights', validLink(game.highlights)],
        ['Slideshow', validLink(game.slideshow)]
      ].filter(([, url]) => url);
      output.push({
        type:'games', label:'Game', icon:'⚽', title:title || 'Allstar Galaxy Game',
        subtitle:[game.date, game.result, game.location].filter(Boolean).join(' · '),
        keywords:[title, game.season, game.gameNumber, game.opponent, game.date, game.result, game.location, 'game full match highlights slideshow'].join(' '),
        image:game.cardImage || '', href:'media.html#latest-games', actions
      });
    });

    (data.gameAwards || []).filter(isVisible).forEach(award => {
      const player = players.find(item => String(item.id) === String(award.playerId)) || award.playerSnapshot || {};
      const game = games.find(item => String(item.id) === String(award.gameId)) || award.gameSnapshot || {};
      const playerName = award.playerName || player.name || [player.firstName, player.lastName].filter(Boolean).join(' ') || 'Player';
      const awardType = award.awardType || award.type || 'Game Award';
      const video = validLink(award.videoUrl || award.youtubeUrl || award.url);
      output.push({
        type:'awards', label:'Award', icon:'🏆', title:`${awardType} — ${playerName}`,
        subtitle:[game.season || award.season, game.gameNumber ? `Game ${game.gameNumber}` : '', game.opponent || award.opponent].filter(Boolean).join(' · '),
        keywords:[awardType, playerName, player.number, player.position, game.season, game.gameNumber, game.opponent, 'award goal save assist play player'].join(' '),
        image:award.cardImage || player.photo || award.playerPhoto || '', href:'media.html#game-awards',
        actions:video ? [['Watch Award', video]] : []
      });
    });

    players.filter(isVisible).forEach(player => {
      const name = player.name || [player.firstName, player.lastName].filter(Boolean).join(' ') || 'Player';
      output.push({
        type:'players', label:'Player', icon:'👤', title:name,
        subtitle:[player.number ? `#${player.number}` : '', player.position, player.status].filter(Boolean).join(' · '),
        keywords:[name, player.firstName, player.lastName, player.number, player.position, player.status, 'player roster team'].join(' '),
        image:player.photo || '', href:'team.html', actions:[]
      });
    });

    (data.seasons || []).filter(isVisible).forEach(season => {
      const actions = [
        ['Full Matches', validLink(season.fullMatches)],
        ['Highlights', validLink(season.highlights)],
        ['Slideshows', validLink(season.slideshows)]
      ].filter(([, url]) => url);
      output.push({
        type:'seasons', label:'Season', icon:'🗂', title:season.title || season.id || 'Season',
        subtitle:[season.subtitle, season.dateRange, season.league].filter(Boolean).join(' · '),
        keywords:[season.title, season.subtitle, season.dateRange, season.league, 'season archive'].join(' '),
        image:season.cardImage || '', href:'media.html#game-archive', actions
      });
    });

    (data.playlists || []).filter(isVisible).forEach(playlist => {
      const url = validLink(playlist.url);
      output.push({
        type:'playlists', label:'Playlist', icon:'▶', title:playlist.title || 'Playlist',
        subtitle:playlist.description || playlist.category || '',
        keywords:[playlist.title, playlist.description, playlist.category, Array.isArray(playlist.locations) ? playlist.locations.join(' ') : '', 'playlist video media archive'].join(' '),
        image:playlist.cardImage || '', href:url || 'media.html#media-center', actions:url ? [['Open Playlist', url]] : []
      });
    });

    (data.news || []).filter(isVisible).forEach(item => {
      const link = validLink(item.link);
      output.push({
        type:'news', label:'News', icon:'📰', title:item.title || 'Allstar Galaxy News',
        subtitle:[item.date, item.category, item.summary].filter(Boolean).join(' · '),
        keywords:[item.title, item.date, item.category, item.summary, 'news announcement'].join(' '),
        image:item.image || '', href:link || 'news.html', actions:[]
      });
    });

    return output;
  }

  async function loadSearchData() {
    if (state.loaded) return;
    if (state.loading) return state.loading;
    state.loading = (async () => {
      for (const url of DATA_URLS) {
        try {
          const response = await fetch(url, { cache:'no-store' });
          if (!response.ok) continue;
          state.records = buildRecords(await response.json());
          state.loaded = true;
          return;
        } catch (_) { /* try fallback */ }
      }
      state.loaded = true;
    })();
    return state.loading;
  }

  function resultMarkup(item) {
    const image = item.image
      ? `<img src="${escapeHtml(item.image)}" alt="" loading="lazy" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="search-result-fallback" hidden aria-hidden="true">${item.icon}</span>`
      : `<span class="search-result-fallback" aria-hidden="true">${item.icon}</span>`;
    const actions = item.actions.map(([label, url]) => `<a href="${escapeHtml(url)}"${/^https?:/i.test(url) ? ' target="_blank" rel="noopener noreferrer"' : ''}>${escapeHtml(label)}</a>`).join('');
    return `<article class="search-result-card">
      <a class="search-result-main" href="${escapeHtml(item.href || '#')}">
        <span class="search-result-image">${image}</span>
        <span class="search-result-copy"><small>${escapeHtml(item.label)}</small><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.subtitle)}</span></span>
      </a>
      ${actions ? `<div class="search-result-actions">${actions}</div>` : ''}
    </article>`;
  }

  function updateResults() {
    const overlay = document.getElementById('galaxySearchV3');
    if (!overlay) return;
    const input = overlay.querySelector('input[type="search"]');
    const results = overlay.querySelector('[data-search-results]');
    const count = overlay.querySelector('[data-search-count]');
    const terms = normalize(input.value).trim().split(/\s+/).filter(Boolean);
    let matches = state.records.filter(item => state.filter === 'all' || item.type === state.filter);
    if (terms.length) matches = matches.filter(item => terms.every(term => normalize(item.keywords).includes(term)));
    matches = matches.slice(0, 80);
    count.textContent = `${matches.length} result${matches.length === 1 ? '' : 's'}`;
    results.innerHTML = matches.length
      ? matches.map(resultMarkup).join('')
      : '<div class="search-empty"><strong>No matches found</strong><span>Try an opponent, player, season, game number, or award type.</span></div>';
  }

  function openSearch() {
    const overlay = document.getElementById('galaxySearchV3');
    if (!overlay) return;
    state.lastFocus = document.activeElement;
    overlay.hidden = false;
    document.body.classList.add('galaxy-search-open');
    loadSearchData().then(updateResults);
    requestAnimationFrame(() => overlay.querySelector('input[type="search"]')?.focus());
  }

  function closeSearch() {
    const overlay = document.getElementById('galaxySearchV3');
    if (!overlay) return;
    overlay.hidden = true;
    document.body.classList.remove('galaxy-search-open');
    state.lastFocus?.focus?.();
  }

  function installSearch() {
    if (document.getElementById('galaxySearchV3')) return;
    const overlay = document.createElement('div');
    overlay.id = 'galaxySearchV3';
    overlay.className = 'galaxy-search-v3';
    overlay.hidden = true;
    overlay.innerHTML = `<section class="galaxy-search-panel" role="dialog" aria-modal="true" aria-labelledby="galaxySearchTitleV3">
      <header class="galaxy-search-heading">
        <div><small>ALLSTAR GALAXY</small><h2 id="galaxySearchTitleV3">Galaxy Search</h2></div>
        <button type="button" class="galaxy-search-close" data-galaxy-search-close aria-label="Close search">×</button>
      </header>
      <label class="galaxy-search-input"><span aria-hidden="true">⌕</span><input type="search" autocomplete="off" spellcheck="false" placeholder="Search games, players, awards, seasons, playlists…"></label>
      <div class="galaxy-search-filter-row" aria-label="Search filters">${FILTERS.map(([id,label]) => `<button type="button" data-search-filter="${id}"${id === 'all' ? ' class="active"' : ''}>${label}</button>`).join('')}</div>
      <div class="galaxy-search-summary"><span data-search-count>Loading archive…</span><span>Ctrl/⌘ + K</span></div>
      <div class="galaxy-search-results-v3" data-search-results aria-live="polite"></div>
    </section>`;
    document.body.appendChild(overlay);

    document.addEventListener('click', event => {
      const openButton = event.target.closest('[data-galaxy-search-open]');
      if (openButton) { event.preventDefault(); openSearch(); return; }
      if (event.target.closest('[data-galaxy-search-close]') || event.target === overlay) closeSearch();
      const filter = event.target.closest('[data-search-filter]');
      if (filter) {
        state.filter = filter.dataset.searchFilter;
        overlay.querySelectorAll('[data-search-filter]').forEach(button => button.classList.toggle('active', button === filter));
        updateResults();
      }
    });
    overlay.querySelector('input[type="search"]').addEventListener('input', updateResults);
    document.addEventListener('keydown', event => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); openSearch(); }
      if (event.key === 'Escape' && !overlay.hidden) closeSearch();
    });
  }

  function init() {
    document.documentElement.classList.add('allstar-v3');
    installNavigation();
    installSearch();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once:true });
  else init();
})();
