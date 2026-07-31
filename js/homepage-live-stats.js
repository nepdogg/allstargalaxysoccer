(() => {
  const statNodes = [...document.querySelectorAll('[data-home-stat]')];
  if (!statNodes.length) return;

  const isVisible = item => item && String(item.status || '').toLowerCase() !== 'hidden';
  const isUsableUrl = value => {
    const url = String(value || '').trim();
    return Boolean(url && url !== '#' && !/^javascript:/i.test(url));
  };
  const plural = (count, singular, pluralForm = `${singular}S`) =>
    `${count.toLocaleString()} ${count === 1 ? singular : pluralForm}`;
  const setStat = (name, text) => {
    const node = statNodes.find(item => item.dataset.homeStat === name);
    if (node) node.textContent = text;
  };

  fetch('data/master-content.json', { cache: 'no-store' })
    .then(response => {
      if (!response.ok) throw new Error('Homepage totals unavailable');
      return response.json();
    })
    .then(data => {
      const games = (data.games || []).filter(isVisible);
      const latestGames = games.filter(game => !game.group || game.group === 'latest');
      const seasons = (data.seasons || []).filter(isVisible);
      const playlists = (data.playlists || []).filter(isVisible);
      const awards = (data.gameAwards || []).filter(isVisible);
      const players = (data.players || []).filter(isVisible);
      const news = (data.news || []).filter(isVisible);

      const gameVideoCount = games.reduce((total, game) => total +
        ['fullMatch', 'highlights', 'slideshow'].filter(key => isUsableUrl(game[key])).length, 0);
      const latestVideoCount = latestGames.reduce((total, game) => total +
        ['fullMatch', 'highlights', 'slideshow'].filter(key => isUsableUrl(game[key])).length, 0);
      const awardVideoCount = awards.filter(award => isUsableUrl(award.videoUrl)).length;
      const shuffleVideoCount = gameVideoCount + awardVideoCount;
      const bestCollections = playlists.filter(playlist =>
        playlist.category === 'best' || (playlist.locations || []).includes('home-best')).length;
      const searchableItems = games.length + seasons.length + playlists.length +
        awards.length + players.length + news.length;

      setStat('shuffle', `${plural(shuffleVideoCount, 'VIDEO')} READY TO SHUFFLE`);
      setStat('search', `${plural(searchableItems, 'SEARCHABLE ITEM')}`);
      setStat('latest', `${plural(latestGames.length, 'GAME')} • ${plural(latestVideoCount, 'VIDEO')}`);
      setStat('awards', `${plural(awardVideoCount, 'AWARD VIDEO')}`);
      setStat('best', `${plural(bestCollections, 'FEATURED COLLECTION')}`);
      setStat('archive', `${plural(seasons.length, 'SEASON')} • ${plural(playlists.length, 'COLLECTION')}`);
    })
    .catch(() => {
      statNodes.forEach(node => { node.textContent = 'COLLECTION GROWING'; });
    });
})();
