(() => {
  const DATA_URL = 'data/master-content.json';
  const esc = (v='') => String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const pngOnlyPath = (value='') => {
    const path = String(value || '').trim();
    if (!path) return '';
    const match = path.match(/^([^?#]*)([?#].*)?$/);
    const base = match ? match[1] : path;
    const suffix = match && match[2] ? match[2] : '';
    if (/\.(png)$/i.test(base)) return base.replace(/\.png$/i, '.png') + suffix;
    if (/\.(jpe?g|webp|gif|avif)$/i.test(base)) return base.replace(/\.(jpe?g|webp|gif|avif)$/i, '.png') + suffix;
    return /\.[a-z0-9]+$/i.test(base) ? base + suffix : `${base}.png${suffix}`;
  };
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
  function mediaArt(data, title, category, image='') {
    const color=colorFor(data,category);
    const length=String(title||'').trim().length;
    const sizeClass=length>28?' is-very-long-title':(length>18?' is-long-title':'');
    return `<div class="generated-playlist-art${sizeClass}" style="--card-accent:${color}">
      <div class="generated-playlist-image" style="background-image:url('${esc(pngOnlyPath(image||data.assets.mediaBackground))}')"></div>
      <div class="generated-playlist-footer">
        <span class="generated-playlist-footer-icon">${iconFor(category)}</span>
        <span class="generated-playlist-footer-title">${esc(title)}</span>
      </div>
    </div>`;
  }
  function splitGameResult(value){
    const raw=String(value||'').trim();
    if(!raw) return {label:'',score:''};
    const match=raw.match(/^\s*(W|L|D|WIN|LOSS|DRAW)\s*(?:\(([^)]+)\)|[-–—:]?\s*(\d+\s*[-–—]\s*\d+))?\s*$/i);
    if(match){
      const token=match[1].toUpperCase();
      const labels={W:'WIN',L:'LOSS',D:'DRAW',WIN:'WIN',LOSS:'LOSS',DRAW:'DRAW'};
      return {label:labels[token]||token,score:String(match[2]||match[3]||'').trim()};
    }
    return {label:raw,score:''};
  }
  function gameCard(data,g){
    const title=`${g.season || ''} — Game ${String(g.gameNumber||'').padStart(2,'0')}`;
    const result=g.result||'';
    const resultParts=splitGameResult(result);
    const mediaBlue='#20bfff';
    const rows=[
      {label:'FULL MATCH',icon:'▶',url:g.fullMatch,color:mediaBlue},
      {label:'HIGHLIGHTS',icon:'▣',url:g.highlights,color:mediaBlue},
      {label:'SLIDESHOW',icon:'▧',url:g.slideshow,color:mediaBlue}
    ];
    return `<a href="#" class="media-slide media-game-slide generated-game-card" aria-label="Open ${esc(title)}" data-game-title="${esc(title)}" data-game-opponent="Allstar Galaxy vs ${esc(g.opponent||'Coming Soon')}" data-game-result="${esc(result)}" data-full="${esc(g.fullMatch||'')}" data-highlights="${esc(g.highlights||'')}" data-slideshow="${esc(g.slideshow||'')}">
      <div class="generated-wide-card generated-game-layout" style="--card-accent:${mediaBlue}">
        <section class="generated-wide-visual" style="background-image:url('${esc(pngOnlyPath(g.cardImage||data.assets.mediaBackground))}')"></section>
        <section class="generated-wide-actions">${actionRows(rows)}</section>
        <footer class="generated-card-footer generated-game-footer">
          <div class="generated-game-meta-block">
            <span>${esc(g.season||'UPCOMING SEASON')}</span>
            <strong>GAME ${String(g.gameNumber||'').padStart(2,'0')}</strong>
          </div>
          <div class="generated-game-matchup-block">
            <strong>ALLSTAR GALAXY</strong>
            <span>VS ${esc(g.opponent||'COMING SOON')}</span>
          </div>
          <div class="generated-game-result-block">
            ${resultParts.label?`<strong>${esc(resultParts.label)}</strong>`:''}
            ${resultParts.score?`<em>${esc(resultParts.score)}</em>`:''}
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
        <section class="generated-wide-visual generated-season-visual" style="background-image:url('${esc(pngOnlyPath(s.cardImage||data.assets.mediaBackground))}')"></section>
        <section class="generated-wide-actions">${actionRows(rows)}</section>
        <footer class="generated-card-footer generated-season-footer">${esc(s.title)}</footer>
      </div></a>`;
  }
  function playlistCard(data,p,theme='gold'){
    const accent=theme==='blue'?'#20bfff':'#f5c542';
    const original=data.colors?.[p.category];
    const themed={...data,colors:{...(data.colors||{}),[p.category]:accent,archive:accent}};
    return `<a class="media-slide generated-playlist-card theme-${theme}" ${linkAttrs(p.url)} aria-label="Open ${esc(p.title)} playlist">${mediaArt(themed,p.title,p.category,p.cardImage||'')}</a>`;
  }
  function playerCard(data,p){
    const accent=colorFor(data,'players');
    const photoPath=pngOnlyPath(p.photo||'');
    const fallbackLogo=pngOnlyPath(data.assets.logo||'');
    const silhouette=pngOnlyPath(data.assets.playerSilhouette||'');
    const lightboxPath=photoPath||silhouette||fallbackLogo;
    const photo=photoPath
      ? `<img class="generated-player-photo" src="${esc(photoPath)}" alt="${esc(p.name)}" loading="lazy"/>`
      : `<div class="generated-player-placeholder"><img src="${esc(silhouette||fallbackLogo)}" alt="Player silhouette" onerror="this.onerror=null;this.src='${esc(fallbackLogo)}'"><span>PLAYER PHOTO<br>COMING SOON</span></div>`;
    return `<a href="${esc(lightboxPath||'#')}" class="team-card-slide generated-player-card" aria-label="${esc(p.name)} player card" data-player-image="${esc(lightboxPath)}" data-player-name="${esc(p.name)}" style="--card-accent:${accent}">
      <div class="generated-player-frame">
        <div class="generated-player-cosmos" style="background-image:linear-gradient(180deg,rgba(0,0,0,.02),rgba(0,0,0,.12)),url('${esc(pngOnlyPath(data.assets.mediaBackground))}')"></div>
        ${photo}
        <div class="generated-player-number">${esc(p.number||'')}</div>
        <div class="generated-player-info"><span>${esc(p.name||'COMING SOON')}</span>${p.position && !/roster spot/i.test(p.position)?`<strong>${esc(p.position)}</strong>`:''}</div>
      </div></a>`;
  }
  function newsCard(data,n){
    const accent=colorFor(data,'news');
    const image=pngOnlyPath(n.image||data.assets.logo);
    const more=n.link?`<a class="generated-news-link" href="${esc(n.link)}" target="_blank" rel="noopener">OPEN LINK</a>`:'';
    return `<article class="generated-news-card" style="--card-accent:${accent}"><button class="generated-news-image-button" type="button" data-news-image="${esc(image)}" data-news-title="${esc(n.title||'News Image')}" aria-label="View full-size image for ${esc(n.title||'news')}"><img src="${esc(image)}" alt="${esc(n.title||'News image')}"></button><div><small>${esc(n.date||n.category||'ALLSTAR GALAXY NEWS')}</small><h3>${esc(n.title)}</h3><p>${esc(n.summary)}</p>${more}</div></article>`;
  }
  function scheduleMarkup(data){
    const display=data.scheduleDisplay||{};
    const scheduleImage=pngOnlyPath(data.assets?.scheduleImage||'');
    const standingsImage=pngOnlyPath(data.assets?.standingsImage||'');
    if((display.mode||'images')==='images'){
      const schedule=display.scheduleVisible!==false && scheduleImage ? `<article class="generated-news-card generated-schedule-news-card" style="--card-accent:#39ff14"><button class="generated-news-image-button" type="button" data-news-image="${esc(scheduleImage)}" data-news-title="Match Schedule" aria-label="View full-size match schedule"><img src="${esc(scheduleImage)}" alt="Current match schedule"></button><div><small>CURRENT SCHEDULE</small><h3>Match Schedule</h3><p>Click the image to view the complete schedule.</p></div></article>` : '';
      const standings=display.standingsVisible!==false && standingsImage ? `<article class="generated-news-card generated-schedule-news-card" style="--card-accent:#39ff14"><button class="generated-news-image-button" type="button" data-news-image="${esc(standingsImage)}" data-news-title="League Standings" aria-label="View full-size league standings"><img src="${esc(standingsImage)}" alt="Current league standings"></button><div><small>CURRENT STANDINGS</small><h3>League Standings</h3><p>Click the image to view the complete standings.</p></div></article>` : '';
      return `<div class="generated-news-grid generated-schedule-news-grid">${schedule}${standings}</div>`;
    }
    const matches=sortItems(data.schedule);
    const rows=matches.length?matches.map(m=>`<article class="generated-match-card"><div class="generated-match-number">GAME ${String(m.gameNumber||'').padStart(2,'0')}</div><h3>ALLSTAR GALAXY <span>VS</span> ${esc(m.opponent)}</h3><div class="generated-match-meta"><span>${esc(m.date||'DATE TBA')}</span><span>${esc(m.time||'TIME TBA')}</span><span>${esc(m.location||'LOCATION TBA')}</span></div>${m.result?`<strong class="generated-match-result">${esc(m.result)}</strong>`:''}</article>`).join(''):`<article class="generated-match-card"><div class="generated-match-number">NEXT SEASON</div><h3>SCHEDULE <span>COMING SOON</span></h3></article>`;
    const standingsRows=(data.standings||[]).filter(isVisible).map(r=>`<tr><td>${esc(r.position)}</td><td>${esc(r.team)}</td><td>${esc(r.played)}</td><td>${esc(r.wins)}</td><td>${esc(r.draws)}</td><td>${esc(r.losses)}</td><td>${esc(r.points)}</td></tr>`).join('');
    return `<div class="generated-schedule-grid"><section><h2>Match Schedule</h2>${rows}</section><section><h2>League Standings</h2><div class="generated-table-wrap"><table><thead><tr><th>#</th><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>Pts</th></tr></thead><tbody>${standingsRows}</tbody></table></div></section></div>`;
  }
  function liveState(l){
    const manual=(l.status||'offline').toLowerCase();
    if((l.mode||'automatic')!=='automatic') return manual;
    const now=Date.now(), start=l.scheduledStart?Date.parse(l.scheduledStart):NaN, end=l.scheduledEnd?Date.parse(l.scheduledEnd):NaN;
    if(!Number.isNaN(start) && now<start) return 'scheduled';
    if(!Number.isNaN(start) && now>=start && (Number.isNaN(end)||now<end)) return 'live';
    if(!Number.isNaN(end) && now>=end) return l.replayUrl?'replay':'ended';
    return manual;
  }
  function liveMarkup(data){
    const l=data.live||{}, state=liveState(l), thumb=pngOnlyPath(l.thumbnail||data.assets?.liveDefaultImage||data.assets?.logo||'');
    const labels={offline:'NO LIVESTREAM SCHEDULED',scheduled:'UPCOMING LIVESTREAM',live:'LIVE NOW',ended:'LIVESTREAM ENDED',replay:'FULL MATCH REPLAY'};
    const url=state==='replay'?(l.replayUrl||l.url):l.url;
    const button=state==='scheduled'?'WATCH / SET REMINDER':state==='live'?'WATCH LIVE':state==='replay'?'WATCH REPLAY':'';
    return `<div class="generated-live-card is-${esc(state)}"><img src="${esc(thumb)}" alt=""><span>${esc(labels[state]||state.toUpperCase())}</span><h2>${esc(l.title||'Allstar Galaxy Livestream')}</h2>${l.opponent?`<h3>ALLSTAR GALAXY VS ${esc(l.opponent)}</h3>`:''}${l.scheduledStart?`<time datetime="${esc(l.scheduledStart)}">${esc(new Date(l.scheduledStart).toLocaleString())}</time>`:''}${l.location?`<p>${esc(l.location)}</p>`:''}<p>${esc(l.description||'')}</p>${url&&button?`<a href="${esc(url)}" target="_blank" rel="noopener">${button}</a>`:''}</div>`;
  }
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
  document.addEventListener('click',e=>{
    const scheduleButton=e.target.closest('[data-schedule-image]');
    if(scheduleButton){
      const box=document.getElementById('scheduleImageLightbox');
      if(!box)return;
      const img=box.querySelector('.schedule-lightbox-image'),title=box.querySelector('.schedule-lightbox-title'),open=box.querySelector('.schedule-lightbox-open');
      img.src=scheduleButton.dataset.scheduleImage;title.textContent=scheduleButton.dataset.scheduleTitle||'Preview';open.href=scheduleButton.dataset.scheduleImage;box.classList.add('is-open');box.setAttribute('aria-hidden','false');
      return;
    }
    const newsButton=e.target.closest('[data-news-image]');
    if(newsButton){
      const box=document.getElementById('newsImageLightbox');
      if(!box)return;
      const img=box.querySelector('.news-lightbox-image'),title=box.querySelector('.news-lightbox-title'),open=box.querySelector('.news-lightbox-open');
      img.src=newsButton.dataset.newsImage;title.textContent=newsButton.dataset.newsTitle||'News Image';open.href=newsButton.dataset.newsImage;box.classList.add('is-open');box.setAttribute('aria-hidden','false');
    }
  });
  document.addEventListener('click',e=>{
    const newsBox=e.target.closest('#newsImageLightbox');
    if(newsBox && (e.target.classList.contains('news-lightbox-close')||e.target===newsBox)){
      newsBox.classList.remove('is-open');
      newsBox.setAttribute('aria-hidden','true');
      return;
    }
    const scheduleBox=e.target.closest('#scheduleImageLightbox');
    if(scheduleBox && (e.target.classList.contains('schedule-lightbox-close')||e.target===scheduleBox)){
      scheduleBox.classList.remove('is-open');
      scheduleBox.setAttribute('aria-hidden','true');
    }
  });
  document.addEventListener('keydown',e=>{
    if(e.key!=='Escape')return;
    ['newsImageLightbox','scheduleImageLightbox'].forEach(id=>{
      const box=document.getElementById(id);
      if(box){box.classList.remove('is-open');box.setAttribute('aria-hidden','true');}
    });
  });
  ready.then(data=>{const seconds=Math.max(30,Number(data.live?.autoRefreshSeconds||60));if(document.querySelector('[data-generated-source=\"live\"]'))setInterval(()=>render(data),seconds*1000);});
  window.ASGContent={ready,render};
})();
