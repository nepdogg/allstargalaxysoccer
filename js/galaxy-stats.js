(() => {
  const root = document.querySelector('[data-galaxy-stats]');
  if (!root) return;
  const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const visible = item => item && item.status !== 'hidden';
  const resultType = value => {
    const token = String(value || '').trim().toUpperCase();
    if (/^(W|WIN)\b/.test(token)) return 'win';
    if (/^(D|DRAW)\b/.test(token)) return 'draw';
    if (/^(L|LOSS)\b/.test(token)) return 'loss';
    return '';
  };
  const score = value => {
    const match = String(value || '').match(/(\d+)\s*[-–—]\s*(\d+)/);
    return match ? [Number(match[1]), Number(match[2])] : null;
  };
  const splitName = value => {
    const parts = String(value || '').trim().split(/\s+/).filter(Boolean);
    return { first: parts[0] || 'Allstar', last: parts.slice(1).join(' ') || 'Galaxy' };
  };

  fetch('data/master-content.json', { cache: 'no-store' })
    .then(response => response.ok ? response.json() : Promise.reject(new Error('Stats data unavailable')))
    .then(data => {
      const games = (data.games || []).filter(visible).filter(game => game.result);
      const wins = games.filter(game => resultType(game.result) === 'win').length;
      const draws = games.filter(game => resultType(game.result) === 'draw').length;
      const losses = games.filter(game => resultType(game.result) === 'loss').length;
      let goalsFor = 0, goalsAgainst = 0;
      games.forEach(game => {
        const parsed = score(game.result);
        if (!parsed) return;
        goalsFor += parsed[0]; goalsAgainst += parsed[1];
      });
      const seasons = new Set(games.map(game => game.season).filter(Boolean));
      const players = (data.players || []).filter(visible);
      const awards = (data.gameAwards || []).filter(visible);
      const awardCounts = new Map();
      awards.forEach(award => {
        const id = award.playerId || award.player || award.playerName;
        if (id) awardCounts.set(String(id), (awardCounts.get(String(id)) || 0) + 1);
      });
      const featured = [...players].sort((a,b) => (awardCounts.get(String(b.id)) || 0) - (awardCounts.get(String(a.id)) || 0))[0] || players[0] || {};
      const name = splitName(featured.name || `${featured.firstName || ''} ${featured.lastName || ''}`);
      const photo = featured.photo || data.assets?.playerSilhouette || data.assets?.logo || 'images/logos/logo.png';
      const topAwardCount = awardCounts.get(String(featured.id)) || 0;
      const latestSeason = [...seasons].sort().at(-1) || 'Current Season';

      root.innerHTML = `
        <article class="galaxy-stat-card galaxy-stat-featured">
          <div class="galaxy-stat-copy">
            <span class="galaxy-stat-kicker">Featured Player</span>
            <h3><small>#${esc(featured.number || '--')}</small> ${esc(name.first)}</h3>
            <strong>${esc(name.last)}</strong>
            <p>${esc(featured.position || 'Allstar Galaxy')}</p>
            <div class="galaxy-stat-mini-grid">
              <span><b>${topAwardCount}</b> Game Awards</span>
              <span><b>${players.length}</b> Active Players</span>
            </div>
          </div>
          <img src="${esc(photo)}" alt="${esc(featured.name || 'Featured Allstar Galaxy player')}" loading="lazy">
        </article>
        <article class="galaxy-stat-card">
          <span class="galaxy-stat-kicker">Club Record</span>
          <div class="galaxy-stat-list">
            <span><b>${games.length}</b> Games</span>
            <span><b>${wins}</b> Wins</span>
            <span><b>${draws}</b> Draws</span>
            <span><b>${losses}</b> Losses</span>
          </div>
        </article>
        <article class="galaxy-stat-card">
          <span class="galaxy-stat-kicker">Goals & Seasons</span>
          <div class="galaxy-stat-list">
            <span><b>${goalsFor}</b> Goals For</span>
            <span><b>${goalsAgainst}</b> Goals Against</span>
            <span><b>${goalsFor - goalsAgainst}</b> Goal Difference</span>
            <span><b>${seasons.size}</b> Seasons</span>
          </div>
        </article>
        <article class="galaxy-stat-card">
          <span class="galaxy-stat-kicker">Team Snapshot</span>
          <div class="galaxy-stat-list">
            <span><b>${esc(latestSeason)}</b> Season</span>
            <span><b>${awards.length}</b> Game Awards</span>
            <span><b>${players.length}</b> Roster Players</span>
            <span><b>${data.playlists?.filter(visible).length || 0}</b> Media Collections</span>
          </div>
        </article>
        <article class="galaxy-stat-card">
          <span class="galaxy-stat-kicker">Team Honors</span>
          <div class="galaxy-stat-list">
            <span><b>${wins}</b> Match Wins</span>
            <span><b>${awards.length}</b> Game Awards</span>
            <span><b>${seasons.size}</b> Seasons Logged</span>
            <span><b>${data.playlists?.filter(visible).length || 0}</b> Media Collections</span>
          </div>
        </article>`;
    })
    .catch(() => { root.closest('.galaxy-stats-section')?.setAttribute('hidden', ''); });
})();
