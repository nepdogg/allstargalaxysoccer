(() => {
  const DATA_URL = 'data/master-content.json';
  const esc = (v='') => String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const isVisible = item => item && item.status !== 'hidden';
  const sortItems = items => [...items].filter(isVisible).sort((a,b)=>(a.order||0)-(b.order||0));
  const linkAttrs = url => url && url !== '#' ? `href="${esc(url)}" target="_blank" rel="noopener"` : 'href="#" class="generated-disabled" aria-disabled="true"';
  function colorFor(data, category) { return data.colors?.[category] || data.colors?.archive || '#f5c542'; }
  function iconFor(category='archive') {
    const icons={
      goals:'⚽', saves:'✋', assists:'➤', plays:'★', shorts:'S', best:'★',
      archive:'✦', core:'▶', fullMatches:'▶', highlights:'▣', slideshows:'▧'
    };
    return icons[category] || '▶';
  }
  function actionRows(items=[]) {
    return `<div class="generated-action-list">${items.map(item=>{
      const active=item.url && item.url !== '#';
      return `<div class="generated-action-row ${active?'':'is-pending'}" style="--row-accent:${item.color}">
        <span class="generated-action-icon">${item.icon}</span>
        <span class="generated-action-copy"><strong>${esc(item.label)}</strong></span>
      </div>`;
    }).join('')}</div>`;
  }
  function mediaArt(data, title, category) {
    const color=colorFor(data,category);
    const length=String(title||'').trim().length;
    const sizeClass=length>28?' is-very-long-title':(length>18?' is-long-title':'');
    return `<div class="generated-playlist-art${sizeClass}" style="--card-accent:${color}">
      <div class="generated-playlist-image" style="background-image:url('${esc(data.assets.mediaBackground)}')"></div>
      <div class="generated-playlist-footer">
        <span class="generated-playlist-footer-icon">${iconFor(category)}</span>
        <span class="generated-playlist-footer-title">${esc(title)}</span>
      </div>
    </div>`;
  }
  function gameCard(data,g){
    const title=`${g.season || ''} — Game ${String(g.gameNumber||'').padStart(2,'0')}`;
    const result=g.result||'GAME MEDIA';
    const mediaBlue='#20bfff';
    const rows=[
      {label:'FULL MATCH',icon:'▶',url:g.fullMatch,color:mediaBlue},
      {label:'HIGHLIGHTS',icon:'▣',url:g.highlights,color:mediaBlue},
      {label:'SLIDESHOW',icon:'▧',url:g.slideshow,color:mediaBlue}
    ];
    return `<a href="#" class="media-slide media-game-slide generated-game-card" aria-label="Open ${esc(title)}" data-game-title="${esc(title)}" data-game-opponent="Allstar Galaxy vs ${esc(g.opponent||'Coming Soon')}" data-game-result="${esc(result)}" data-full="${esc(g.fullMatch||'')}" data-highlights="${esc(g.highlights||'')}" data-slideshow="${esc(g.slideshow||'')}">
      <div class="generated-wide-card generated-game-layout" style="--card-accent:${mediaBlue}">
        <section class="generated-wide-visual" style="background-image:url('${esc(data.assets.mediaBackground)}')"></section>
        <section class="generated-wide-actions">${actionRows(rows)}</section>
        <footer class="generated-card-footer generated-game-footer">
          <div class="generated-game-meta-block">
            <span>${esc(g.season||'UPCOMING SEASON')}</span>
            <strong>GAME ${String(g.gameNumber||'').padStart(2,'0')}</strong>
          </div>
          <div class="generated-game-matchup-block">
            <strong>ALLSTAR GALAXY</strong>
            <span>VS ${esc(g.opponent||'COMING SOON')}</span>
            ${result?`<em>${esc(result)}</em>`:''}
          </div>
        </footer>
      </div></a>`;
  }
  function seasonCard(data,s){
    const mediaBlue='#20bfff';
    const rows=[
      {label:'FULL MATCHES',icon:'▶',url:s.fullMatches,color:mediaBlue},
      {label:'HIGHLIGHTS',icon:'▣',url:s.highlights,color:mediaBlue},
      {label:'SLIDESHOWS',icon:'▧',url:s.slideshows,color:mediaBlue}
    ];
    return `<a href="#" class="media-slide season-archive-slide media-game-slide generated-season-card" aria-label="Open ${esc(s.title)} archive" data-game-title="${esc(s.title)} Season Archive" data-game-opponent="Full Matches • Highlights • Slideshows" data-game-result="${esc(s.subtitle||'Season Archive')}" data-full="${esc(s.fullMatches||'')}" data-highlights="${esc(s.highlights||'')}" data-slideshow="${esc(s.slideshows||'')}" data-full-label="▶ Full Matches" data-highlights-label="▣ Highlights" data-slideshow-label="▧ Slideshows">
      <div class="generated-wide-card generated-season-layout" style="--card-accent:${mediaBlue}">
        <section class="generated-wide-visual generated-season-visual" style="background-image:url('${esc(data.assets.mediaBackground)}')"></section>
        <section class="generated-wide-actions">${actionRows(rows)}</section>
        <footer class="generated-card-footer generated-season-footer">${esc(s.title)}</footer>
      </div></a>`;
  }
  function playlistCard(data,p,theme='gold'){
    const accent=theme==='blue'?'#20bfff':'#f5c542';
    const original=data.colors?.[p.category];
    const themed={...data,colors:{...(data.colors||{}),[p.category]:accent,archive:accent}};
    return `<a class="media-slide generated-playlist-card theme-${theme}" ${linkAttrs(p.url)} aria-label="Open ${esc(p.title)} playlist">${mediaArt(themed,p.title,p.category)}</a>`;
  }
  function playerCard(data,p){
    const accent=colorFor(data,'players');
    const photo=p.photo?`<img class="generated-player-photo" src="${esc(p.photo)}" alt="${esc(p.name)}"/>`:`<div class="generated-player-placeholder"><img src="${esc(data.assets.logo)}" alt="Allstar Galaxy logo"><span>PLAYER PHOTO<br>COMING SOON</span></div>`;
    return `<a href="#" class="team-card-slide generated-player-card" aria-label="${esc(p.name)} player card" style="--card-accent:${accent}">
      <div class="generated-player-frame">
        <div class="generated-player-cosmos" style="background-image:linear-gradient(180deg,rgba(0,0,0,.02),rgba(0,0,0,.12)),url('${esc(data.assets.mediaBackground)}')"></div>
        ${photo}
        <img class="generated-player-logo" src="${esc(data.assets.logo)}" alt="">
        <div class="generated-player-number">${esc(p.number||'')}</div>
        <div class="generated-player-info"><span>${esc(p.name||'COMING SOON')}</span>${p.position && !/roster spot/i.test(p.position)?`<strong>${esc(p.position)}</strong>`:''}</div>
      </div></a>`;
  }
  function newsCard(data,n){
    const accent=colorFor(data,'news'); const tag=n.link?'a':'article'; const attrs=n.link?`href="${esc(n.link)}" target="_blank" rel="noopener"`:'';
    return `<${tag} class="generated-news-card" ${attrs} style="--card-accent:${accent}"><img src="${esc(data.assets.logo)}" alt=""><div><small>${esc(n.date||n.category||'ALLSTAR GALAXY NEWS')}</small><h3>${esc(n.title)}</h3><p>${esc(n.summary)}</p></div></${tag}>`;
  }
  function scheduleMarkup(data){
    const matches=sortItems(data.schedule);
    const rows=matches.length?matches.map(m=>`<article class="generated-match-card"><div class="generated-match-number">GAME ${String(m.gameNumber||'').padStart(2,'0')}</div><h3>ALLSTAR GALAXY <span>VS</span> ${esc(m.opponent)}</h3><div class="generated-match-meta"><span>${esc(m.date||'DATE TBA')}</span><span>${esc(m.time||'TIME TBA')}</span><span>${esc(m.location||'LOCATION TBA')}</span></div>${m.result?`<strong class="generated-match-result">${esc(m.result)}</strong>`:''}</article>`).join(''):`<article class="generated-match-card"><div class="generated-match-number">NEXT SEASON</div><h3>SCHEDULE <span>COMING SOON</span></h3><div class="generated-match-meta"><span>Update the schedule section in data/master-content.json</span></div></article>`;
    const standings=(data.standings||[]).filter(isVisible).map(r=>`<tr><td>${esc(r.position)}</td><td>${esc(r.team)}</td><td>${esc(r.played)}</td><td>${esc(r.wins)}</td><td>${esc(r.draws)}</td><td>${esc(r.losses)}</td><td>${esc(r.points)}</td></tr>`).join('');
    return `<div class="generated-schedule-grid"><section><h2>Match Schedule</h2>${rows}</section><section><h2>League Standings</h2><div class="generated-table-wrap"><table><thead><tr><th>#</th><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>Pts</th></tr></thead><tbody>${standings}</tbody></table></div></section></div>`;
  }
  function liveMarkup(data){const l=data.live||{};return `<div class="generated-live-card"><img src="${esc(data.assets.logo)}" alt="Allstar Galaxy"><span>${esc((l.status||'offline').toUpperCase())}</span><h2>${esc(l.title||'Livestream Coming Soon')}</h2><p>${esc(l.description||'')}</p>${l.url?`<a href="${esc(l.url)}" target="_blank" rel="noopener">WATCH LIVE</a>`:''}</div>`}
  function render(data){
    document.querySelectorAll('[data-generated-source]').forEach(el=>{
      const source=el.dataset.generatedSource;
      if(source==='games') el.innerHTML=sortItems(data.games).filter(g=>g.group==='latest').map(g=>gameCard(data,g)).join('');
      else if(source==='seasons') el.innerHTML=sortItems(data.seasons).map(s=>seasonCard(data,s)).join('');
      else if(source==='media-archive') el.innerHTML=sortItems(data.playlists).filter(p=>p.locations?.includes('media-archive')).map(p=>playlistCard(data,p,'blue')).join('');
      else if(source==='home-best') el.innerHTML=sortItems(data.playlists).filter(p=>p.locations?.includes('home-best')).map(p=>playlistCard(data,p,'gold')).join('');
      else if(source==='players') el.innerHTML=sortItems(data.players).map(p=>playerCard(data,p)).join('');
      else if(source==='news') el.innerHTML=sortItems(data.news).map(n=>newsCard(data,n)).join('');
      else if(source==='schedule') el.innerHTML=scheduleMarkup(data);
      else if(source==='live') el.innerHTML=liveMarkup(data);
    });
  }
  const ready=fetch(DATA_URL,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(`Unable to load ${DATA_URL}`);return r.json()}).then(data=>{render(data);window.ASG_MASTER_DATA=data;return data}).catch(err=>{console.error(err);document.querySelectorAll('[data-generated-source]').forEach(el=>el.innerHTML='<p class="generated-data-error">Content could not load. Check data/master-content.json.</p>');});
  window.ASGContent={ready,render};
})();
