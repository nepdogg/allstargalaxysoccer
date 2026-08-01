(function () {
  'use strict';

  const DATA_URLS = ['data/master-content.json', 'master-content.json'];
  const FILTERS = [
    ['all', 'All'], ['games', 'Games'], ['awards', 'Awards'], ['players', 'Players'],
    ['seasons', 'Seasons'], ['playlists', 'Playlists'], ['news', 'News']
  ];

  const norm = (value) => String(value == null ? '' : value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const visible = (item) => item && !['hidden', 'draft', 'unpublished', 'retired'].includes(norm(item.status));
  const safe = (value) => String(value == null ? '' : value).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const validUrl = (url) => /^https?:\/\//i.test(String(url || '')) ? String(url) : '';

  let records = [];
  let activeFilter = 'all';
  let dataLoaded = false;

  function buildRecords(data) {
    const out = [];
    (data.games || []).filter(visible).forEach(game => {
      const title = `${game.season || ''} Game ${game.gameNumber || ''} vs ${game.opponent || ''}`.trim();
      out.push({
        type: 'games', icon: '⚽', title,
        subtitle: [game.date, game.result, game.location].filter(Boolean).join(' · '),
        keywords: [title, game.season, game.gameNumber, game.opponent, game.result, game.date, game.location, 'full match highlights slideshow game'].join(' '),
        image: game.cardImage || '',
        actions: [
          ['Full Match', validUrl(game.fullMatch)], ['Highlights', validUrl(game.highlights)], ['Slideshow', validUrl(game.slideshow)]
        ].filter(a => a[1]),
        href: 'media.html#latest-games'
      });
    });

    (data.gameAwards || []).filter(visible).forEach(award => {
      const player = (data.players || []).find(p => String(p.id) === String(award.playerId || award.player)) || {};
      const game = (data.games || []).find(g => String(g.id) === String(award.gameId || award.game)) || {};
      const playerName = award.playerName || player.name || [player.firstName, player.lastName].filter(Boolean).join(' ') || 'Player';
      const awardType = award.awardType || award.type || 'Game Award';
      const title = `${awardType} — ${playerName}`;
      out.push({
        type: 'awards', icon: '🏆', title,
        subtitle: [game.season || award.season, game.gameNumber ? `Game ${game.gameNumber}` : '', game.opponent || award.opponent].filter(Boolean).join(' · '),
        keywords: [title, playerName, player.number, player.position, game.season, game.gameNumber, game.opponent, 'award player goal save assist play'].join(' '),
        image: player.photo || award.playerPhoto || '',
        actions: [['Watch Award Video', validUrl(award.youtubeUrl || award.videoUrl || award.url)]].filter(a => a[1]),
        href: 'media.html#game-awards'
      });
    });

    (data.players || []).filter(visible).forEach(player => {
      const name = player.name || [player.firstName, player.lastName].filter(Boolean).join(' ') || 'Player';
      out.push({
        type: 'players', icon: '👤', title: name,
        subtitle: [`#${player.number || '—'}`, player.position].filter(Boolean).join(' · '),
        keywords: [name, player.firstName, player.lastName, player.number, player.position, player.nationality, player.status, 'player roster team'].join(' '),
        image: player.photo || '', href: 'team.html'
      });
    });

    (data.seasons || []).filter(visible).forEach(season => {
      out.push({
        type: 'seasons', icon: '🗂', title: season.title || season.id || 'Season',
        subtitle: [season.subtitle, season.dateRange, season.league].filter(Boolean).join(' · '),
        keywords: [season.title, season.subtitle, season.dateRange, season.league, 'season archive full matches highlights slideshows'].join(' '),
        image: season.cardImage || '',
        actions: [['Full Matches', validUrl(season.fullMatches)], ['Highlights', validUrl(season.highlights)], ['Slideshows', validUrl(season.slideshows)]].filter(a => a[1]),
        href: 'media.html#game-archive'
      });
    });

    (data.playlists || []).filter(visible).forEach(list => {
      out.push({
        type: 'playlists', icon: '▶', title: list.title || 'Playlist',
        subtitle: list.description || list.category || '',
        keywords: [list.title, list.description, list.category, (list.locations || []).join?.(' '), 'playlist media archive video'].join(' '),
        image: list.cardImage || '', actions: [['Open Playlist', validUrl(list.url)]].filter(a => a[1]),
        href: 'media.html#media-center'
      });
    });

    (data.news || []).filter(visible).forEach(item => {
      out.push({
        type: 'news', icon: '📰', title: item.title || 'News',
        subtitle: [item.date, item.category, item.summary].filter(Boolean).join(' · '),
        keywords: [item.title, item.date, item.category, item.summary, 'news announcement results'].join(' '),
        image: item.image || '', actions: [['Open', validUrl(item.link)]].filter(a => a[1]), href: 'updates.html#latest-news'
      });
    });
    return out;
  }

  async function loadData() {
    if (dataLoaded) return;
    for (const url of DATA_URLS) {
      try {
        const response = await fetch(url, { cache: 'no-store' });
        if (!response.ok) continue;
        const data = await response.json();
        records = buildRecords(data);
        dataLoaded = true;
        return;
      } catch (_) {}
    }
    dataLoaded = true;
  }

  function resultMarkup(item, index) {
    const image = item.image ? `<img src="${safe(item.image)}" alt="" loading="lazy" onerror="this.hidden=true">` : `<span class="galaxy-search-result-icon" aria-hidden="true">${item.icon}</span>`;
    const actions = (item.actions || []).map(([label, url]) => `<a href="${safe(url)}" target="_blank" rel="noopener">${safe(label)}</a>`).join('');
    return `<article class="galaxy-search-result" data-result-index="${index}">
      <a class="galaxy-search-result-main" href="${safe(item.href || '#')}">
        <span class="galaxy-search-result-media">${image}</span>
        <span class="galaxy-search-result-copy"><small>${safe(item.type)}</small><strong>${safe(item.title)}</strong><span>${safe(item.subtitle)}</span></span>
      </a>
      ${actions ? `<div class="galaxy-search-result-actions">${actions}</div>` : ''}
    </article>`;
  }

  function performSearch() {
    const input = document.getElementById('galaxySearchInput');
    const results = document.getElementById('galaxySearchResults');
    const count = document.getElementById('galaxySearchCount');
    if (!input || !results || !count) return;
    const query = norm(input.value).trim();
    let matches = records.filter(r => activeFilter === 'all' || r.type === activeFilter);
    if (query) {
      const terms = query.split(/\s+/).filter(Boolean);
      matches = matches.filter(r => terms.every(term => norm(r.keywords).includes(term)));
    }
    matches = matches.slice(0, 60);
    count.textContent = `${matches.length} result${matches.length === 1 ? '' : 's'}`;
    if (!matches.length) {
      results.innerHTML = `<div class="galaxy-search-empty"><strong>No matches found</strong><span>Try an opponent, player, season, game number, or award type.</span></div>`;
      return;
    }
    results.innerHTML = matches.map(resultMarkup).join('');
  }

  function openSearch() {
    const overlay = document.getElementById('galaxySearchOverlay');
    if (!overlay) return;
    overlay.hidden = false;
    document.body.classList.add('galaxy-search-open');
    loadData().then(() => { performSearch(); document.getElementById('galaxySearchInput')?.focus(); });
  }

  function closeSearch() {
    const overlay = document.getElementById('galaxySearchOverlay');
    if (!overlay) return;
    overlay.hidden = true;
    document.body.classList.remove('galaxy-search-open');
  }

  function install() {
    const nav = document.querySelector('header nav');
    if (nav && !nav.querySelector('.galaxy-search-trigger')) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'galaxy-search-trigger';
      button.setAttribute('aria-label', 'Search the Allstar Galaxy archive');
      button.innerHTML = '<span aria-hidden="true">⌕</span><b>Search</b>';
      button.addEventListener('click', openSearch);
      nav.appendChild(button);
    }

    const overlay = document.createElement('div');
    overlay.id = 'galaxySearchOverlay';
    overlay.className = 'galaxy-search-overlay';
    overlay.hidden = true;
    overlay.innerHTML = `<div class="galaxy-search-shell" role="dialog" aria-modal="true" aria-labelledby="galaxySearchTitle">
      <div class="galaxy-search-header">
        <div><small>ALLSTAR GALAXY</small><h2 id="galaxySearchTitle">Galaxy Search</h2></div>
        <button type="button" class="galaxy-search-close" aria-label="Close search">×</button>
      </div>
      <label class="galaxy-search-box"><span aria-hidden="true">⌕</span><input id="galaxySearchInput" type="search" autocomplete="off" placeholder="Search games, players, awards, seasons, playlists…"></label>
      <div class="galaxy-search-filters" role="group" aria-label="Search filters">${FILTERS.map(([id,label]) => `<button type="button" data-search-filter="${id}" class="${id === 'all' ? 'active' : ''}">${label}</button>`).join('')}</div>
      <div class="galaxy-search-meta"><span id="galaxySearchCount">Loading archive…</span><span>Type to search instantly</span></div>
      <div id="galaxySearchResults" class="galaxy-search-results" aria-live="polite"></div>
    </div>`;
    document.body.appendChild(overlay);

    overlay.querySelector('.galaxy-search-close').addEventListener('click', closeSearch);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeSearch(); });
    overlay.querySelector('#galaxySearchInput').addEventListener('input', performSearch);
    overlay.querySelectorAll('[data-search-filter]').forEach(button => button.addEventListener('click', () => {
      activeFilter = button.dataset.searchFilter;
      overlay.querySelectorAll('[data-search-filter]').forEach(b => b.classList.toggle('active', b === button));
      performSearch();
    }));
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !overlay.hidden) closeSearch();
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openSearch(); }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();
