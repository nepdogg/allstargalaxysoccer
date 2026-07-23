(() => {
  const DATA_URL = 'data/master-content.json';
  const esc = (v='') => String(v).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const pngOnlyPath = (value='') => {
    const path = String(value || '').trim();
    if (!path) return '';
    // Admin Preview Website embeds unpublished images as data/blob URLs.
    // They must pass through unchanged instead of being rewritten as .png paths.
    if (/^(data:image\/|blob:|https?:)/i.test(path)) return path;
    const match = path.match(/^([^?#]*)([?#].*)?$/);
    const base = match ? match[1] : path;
    const suffix = match && match[2] ? match[2] : '';
    if (/\.(png)$/i.test(base)) return base.replace(/\.png$/i, '.png') + suffix;
    if (/\.(jpe?g|webp|gif|avif)$/i.test(base)) return base.replace(/\.(jpe?g|webp|gif|avif)$/i, '.png') + suffix;
    return /\.[a-z0-9]+$/i.test(base) ? base + suffix : `${base}.png${suffix}`;
  };
  const versionedAsset = (value='',version='') => {
    const path=pngOnlyPath(value);
    if(!path || /^(data:image\/|blob:)/i.test(path))return path;
    if(/[?&]v=/.test(path) || !version)return path;
    return `${path}${path.includes('?')?'&':'?'}v=${encodeURIComponent(version)}`;
  };
  const firstValue = (...values) => values.find(value => String(value || '').trim()) || '';
  const itemImage = (item={}) => pngOnlyPath(firstValue(
    item.image, item.imagePath, item.photo, item.thumbnail, item.flyer,
    item.poster, item.graphic, item.cardImage
  ));
  const firstItemImage = (items=[]) => {
    const source = Array.isArray(items) ? items : [];
    const preferred = source.find(item => isVisible(item) && itemImage(item));
    const fallback = source.find(item => itemImage(item));
    return itemImage(preferred || fallback || {});
  };
  const isVisible = item => item && item.status !== 'hidden';
  const sortItems = items => [...items].filter(isVisible).sort((a,b)=>(a.order||0)-(b.order||0));
  const linkAttrs = url => url && url !== '#' ? `href="${esc(url)}" target="_blank" rel="noopener"` : 'href="#" class="generated-disabled" aria-disabled="true"';
  function colorFor(data, category) { return data.colors?.[category] || data.colors?.archive || '#f5c542'; }
  function applyGraphicAssets(data){const a=data.assets||{},root=document.documentElement;const set=(n,v)=>{if(v)root.style.setProperty(n,`url("${pngOnlyPath(v)}")`);};set('--home-carousel-background',a.homeCarouselBackground);set('--team-carousel-background',a.teamCarouselBackground);set('--media-carousel-background',a.mediaCarouselBackground);set('--season-carousel-background',a.seasonCarouselBackground);}
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
  function mediaArt(data, title, category, customImage='') {
    const color=colorFor(data,category);
    const length=String(title||'').trim().length;
    const sizeClass=length>28?' is-very-long-title':(length>18?' is-long-title':'');
    return `<div class="generated-playlist-art${sizeClass}" style="--card-accent:${color}">
      <div class="generated-playlist-image" style="background-image:url('${esc(versionedAsset(customImage || data.assets.playlistCardBackground || data.assets.mediaBackground || 'generated/media-card-background.png',data.version))}')"></div>
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
        <section class="generated-wide-visual" style="background-image:url('${esc(versionedAsset(g.cardImage || data.assets.gameCardBackground || data.assets.mediaBackground || 'generated/media-card-background.png',data.version))}')">${g.cardLabel?`<span class="generated-game-label-badge label-${esc(g.cardLabel)}">${esc(({new:'NEW GAME',latest:'LATEST GAME','current-season':'CURRENT SEASON','last-season':'LAST SEASON'}[g.cardLabel]||g.cardLabel).toUpperCase())}</span>`:''}</section>
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
        <section class="generated-wide-visual generated-season-visual" style="background-image:url('${esc(versionedAsset(s.cardImage || data.assets.seasonCardBackground || data.assets.mediaBackground || 'generated/media-card-background.png',data.version))}')"></section>
        <section class="generated-wide-actions">${actionRows(rows)}</section>
        <footer class="generated-card-footer generated-season-footer">${esc(s.title)}</footer>
      </div></a>`;
  }
  function playlistCard(data,p,theme='gold'){
    const accent=theme==='blue'?'#20bfff':'#f5c542';
    const original=data.colors?.[p.category];
    const themed={...data,colors:{...(data.colors||{}),[p.category]:accent,archive:accent}};
    return `<a class="media-slide generated-playlist-card theme-${theme}" ${linkAttrs(p.url)} aria-label="Open ${esc(p.title)} playlist">${mediaArt(themed,p.title,p.category,p.cardImage)}</a>`;
  }
  function playerCard(data,p){
    const accent=colorFor(data,'players');
    const uploadedPhoto=pngOnlyPath(p.photo||'');
    const defaultSilhouette=pngOnlyPath(data.assets?.playerSilhouette||'images/team/players/player-silhouette.png');
    const fallbackLogo=pngOnlyPath(data.assets?.logo||'images/logos/logo.png');
    const photoPath=uploadedPhoto||defaultSilhouette;
    const defaultPhotoClass=uploadedPhoto?'':' is-default-silhouette';
    const parts=String(p.name||'PLAYER').trim().split(/\s+/); const first=String(p.firstName||parts.shift()||'PLAYER'); const last=String(p.lastName||parts.join(' ')||first);
    const advancedData=[p.dateOfBirth,p.nationality,p.preferredFoot,p.height,p.weight,p.quote].some(v=>String(v||'').trim());
    const attrs={dob:p.dateOfBirth||'',nationality:p.nationality||'',foot:p.preferredFoot||'',height:p.height||'',weight:p.weight||'',quote:p.quote||'',mode:String(p.profileMode||'').toLowerCase()==='advanced'||advancedData?'advanced':'standard'};
    const imageMode=String(p.imageMode||'cutout').toLowerCase()==='photo'?'photo':'cutout';
    const photoScale=Math.max(60,Math.min(180,Number(p.photoScale)||100));
    const photoX=Math.max(-50,Math.min(50,Number(p.photoX)||0));
    const photoY=Math.max(-50,Math.min(50,Number(p.photoY)||0));
    return `<a href="#" class="team-card-slide generated-player-card ultimate-player-card" aria-label="${esc(p.name)} player card" data-player-image="${esc(photoPath)}" data-player-name="${esc(p.name)}" data-player-first="${esc(first)}" data-player-last="${esc(last)}" data-player-number="${esc(p.number||'')}" data-player-position="${esc(p.position||'')}" data-player-mode="${esc(attrs.mode)}" data-player-dob="${esc(attrs.dob)}" data-player-nationality="${esc(attrs.nationality)}" data-player-foot="${esc(attrs.foot)}" data-player-height="${esc(attrs.height)}" data-player-weight="${esc(attrs.weight)}" data-player-quote="${esc(attrs.quote)}" data-player-profile-template="${esc(pngOnlyPath(data.assets?.playerProfileTemplate || 'generated/player-profile-card-template.png'))}" data-player-image-mode="${esc(imageMode)}" data-player-photo-scale="${photoScale}" data-player-photo-x="${photoX}" data-player-photo-y="${photoY}" style="--card-accent:${accent};--player-scale:${photoScale/100};--player-x:${photoX}%;--player-y:${photoY}%">
      <div class="ultimate-player-frame prototype-player-frame image-mode-${imageMode}" style="--player-scale:${photoScale/100};--player-x:${photoX}%;--player-y:${photoY}%">
        <img class="prototype-card-template" src="${esc(pngOnlyPath(data.assets?.playerCardTemplate || 'generated/player-card-template.png'))}" alt="" aria-hidden="true">
        <div class="ultimate-player-cutout-stage prototype-player-stage${defaultPhotoClass}"><img class="ultimate-player-photo generated-player-photo" src="${esc(photoPath)}" alt="${esc(p.name||'Player')}" loading="lazy" onerror="this.onerror=null;this.src='${esc(defaultSilhouette||fallbackLogo)}'"></div>
        <span class="prototype-player-number">${esc(p.number||'00')}</span>
        <div class="ultimate-player-name prototype-player-name name-length-${Math.min(20,String(last).length)}"><small>${esc(first)}</small><strong>${esc(last)}</strong><em>${esc(p.position||'PLAYER')}</em></div>
      </div></a>`;
  }

  function newsCard(data,n){
    const accent=colorFor(data,'news');
    const image=itemImage(n)||pngOnlyPath(data.assets.logo);
    const imageAlt=n.imageAlt||n.alt||n.title||'Allstar Galaxy news';
    const externalLink=String(n.link||'').trim();
    return `<article class="generated-news-card" style="--card-accent:${accent}">
      <button class="news-lightbox-link" type="button"
        data-news-image="${esc(image)}"
        data-news-title="${esc(n.title||'Allstar Galaxy News')}"
        aria-label="Open ${esc(imageAlt)} full size">
        <img src="${esc(image)}" alt="${esc(imageAlt)}" loading="lazy"
          onerror="this.onerror=null;this.src='${esc(pngOnlyPath(data.assets.logo))}'">
        <span class="news-image-action">Open Full Image</span>
      </button>
      <div class="generated-news-content">
        <small>${esc(n.date||n.category||'ALLSTAR GALAXY NEWS')}</small>
        <h3>${esc(n.title)}</h3>
        ${n.imageNote ? `<div class="generated-news-image-note">${esc(n.imageNote)}</div>` : ""}
        <p>${esc(n.summary)}</p>
        ${externalLink?`<a class="generated-news-external-link" href="${esc(externalLink)}" target="_blank" rel="noopener">Open Related Link</a>`:''}
      </div>
    </article>`;
  }
  function scheduleMarkup(data){
    const scheduleConfig=data.schedulePage||data.scheduleContent||data.scheduleSettings||{};
    const scheduleImage=pngOnlyPath(firstValue(
      scheduleConfig.scheduleImage, scheduleConfig.image, scheduleConfig.flyer,
      data.scheduleImage, data.assets?.scheduleImage, firstItemImage(data.schedule)
    ));
    const standingsImage=pngOnlyPath(firstValue(
      scheduleConfig.standingsImage, scheduleConfig.tableImage,
      data.standingsImage, data.assets?.standingsImage, firstItemImage(data.standings)
    ));
    const scheduleUrl=String(scheduleConfig.scheduleUrl||'').trim();
    const standingsUrl=String(scheduleConfig.standingsUrl||'').trim();

    if(scheduleImage || standingsImage){
      const cards=[];
      if(scheduleImage){
        cards.push(`<article class="schedule-image-card generated-schedule-image-card" style="--card-accent:${colorFor(data,'schedule')}">
          <a class="schedule-lightbox-link" href="${esc(scheduleUrl||scheduleImage)}" ${scheduleUrl?'target="_blank" rel="noopener"':`data-lightbox-title="${esc(scheduleConfig.scheduleTitle||'Match Schedule')}"`}>
            <img src="${esc(scheduleImage)}" alt="${esc(scheduleConfig.scheduleAlt||'Allstar Galaxy match schedule')}" loading="lazy">
            <span class="schedule-image-action">Open Full Image</span>
          </a>
          <div class="schedule-card-content">
            <small>${esc(scheduleConfig.scheduleLabel||'CURRENT SCHEDULE')}</small>
            <h3>${esc(scheduleConfig.scheduleTitle||'Match Schedule')}</h3>
            <p>${esc(scheduleConfig.scheduleDescription||'Click the image to view the complete schedule.')}</p>
          </div>
        </article>`);
      }
      if(standingsImage){
        cards.push(`<article class="schedule-image-card generated-schedule-image-card" style="--card-accent:${colorFor(data,'schedule')}">
          <a class="schedule-lightbox-link" href="${esc(standingsUrl||standingsImage)}" ${standingsUrl?'target="_blank" rel="noopener"':`data-lightbox-title="${esc(scheduleConfig.standingsTitle||'League Standings')}"`}>
            <img src="${esc(standingsImage)}" alt="${esc(scheduleConfig.standingsAlt||'Allstar Galaxy league standings')}" loading="lazy">
            <span class="schedule-image-action">Open Full Image</span>
          </a>
          <div class="schedule-card-content">
            <small>${esc(scheduleConfig.standingsLabel||'CURRENT STANDINGS')}</small>
            <h3>${esc(scheduleConfig.standingsTitle||'League Standings')}</h3>
            <p>${esc(scheduleConfig.standingsDescription||'Click the image to view the complete standings.')}</p>
          </div>
        </article>`);
      }
      return `<div class="schedule-image-grid generated-schedule-image-grid">${cards.join('')}</div>`;
    }

    const matches=sortItems(data.schedule);
    const rows=matches.length?matches.map(m=>`<article class="generated-match-card"><div class="generated-match-number">GAME ${String(m.gameNumber||'').padStart(2,'0')}</div><h3>ALLSTAR GALAXY <span>VS</span> ${esc(m.opponent)}</h3><div class="generated-match-meta"><span>${esc(m.date||'DATE TBA')}</span><span>${esc(m.time||'TIME TBA')}</span><span>${esc(m.location||'LOCATION TBA')}</span></div>${m.result?`<strong class="generated-match-result">${esc(m.result)}</strong>`:''}</article>`).join(''):`<article class="generated-match-card"><div class="generated-match-number">NEXT SEASON</div><h3>SCHEDULE <span>COMING SOON</span></h3><div class="generated-match-meta"><span>Update the schedule section in data/master-content.json</span></div></article>`;
    const standings=(data.standings||[]).filter(isVisible).map(r=>`<tr><td>${esc(r.position)}</td><td>${esc(r.team)}</td><td>${esc(r.played)}</td><td>${esc(r.wins)}</td><td>${esc(r.draws)}</td><td>${esc(r.losses)}</td><td>${esc(r.points)}</td></tr>`).join('');
    return `<div class="generated-schedule-grid"><section><h2>Match Schedule</h2>${rows}</section><section><h2>League Standings</h2><div class="generated-table-wrap"><table><thead><tr><th>#</th><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>Pts</th></tr></thead><tbody>${standings}</tbody></table></div></section></div>`;
  }
  function liveMarkup(data){const l=data.live||{};return `<div class="generated-live-card"><img src="${esc(pngOnlyPath(data.assets.logo))}" alt="Allstar Galaxy"><span>${esc((l.status||'offline').toUpperCase())}</span><h2>${esc(l.title||'Livestream Coming Soon')}</h2><p>${esc(l.description||'')}</p>${l.url?`<a href="${esc(l.url)}" target="_blank" rel="noopener">WATCH LIVE</a>`:''}</div>`}
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
  async function loadIndexedPreviewAssets(){
    if(sessionStorage.getItem('asgPreviewAssetsInIndexedDb')!=='1')return new Map();
    return new Promise(resolve=>{
      const request=indexedDB.open('asg-admin-preview',1);
      request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains('pending-assets'))db.createObjectStore('pending-assets',{keyPath:'path'})};
      request.onerror=()=>resolve(new Map());
      request.onsuccess=()=>{
        const db=request.result,tx=db.transaction('pending-assets','readonly'),store=tx.objectStore('pending-assets'),all=store.getAll();
        all.onerror=()=>{db.close();resolve(new Map())};
        all.onsuccess=()=>{const map=new Map((all.result||[]).map(item=>[String(item.path),`data:image/png;base64,${item.base64}`]));db.close();resolve(map)};
      };
    });
  }
  function hydratePreviewAssets(value,assetMap){
    if(Array.isArray(value))return value.map(item=>hydratePreviewAssets(item,assetMap));
    if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,hydratePreviewAssets(item,assetMap)]));
    if(typeof value==='string'){
      if(assetMap.has(value))return assetMap.get(value);
      const clean=value.split('?')[0];
      if(assetMap.has(clean))return assetMap.get(clean);
    }
    return value;
  }
  async function loadPreviewContent(){
    if(new URLSearchParams(location.search).get('adminPreview')!=='1')return null;
    try{
      const draft=JSON.parse(sessionStorage.getItem('asgPreviewMasterContent')||'null');
      if(!draft)return null;
      let assets=new Map();
      try{
        const openerAssets=window.opener && window.opener.__ASG_PENDING_PREVIEW_ASSETS;
        if(openerAssets && typeof openerAssets==='object'){
          assets=new Map(Object.entries(openerAssets));
        }
      }catch(error){
        console.warn('Could not read temporary preview assets from the Admin tab.',error);
      }
      if(!assets.size)assets=await loadIndexedPreviewAssets();
      return hydratePreviewAssets(draft,assets);
    }catch(error){console.warn('Could not load Admin preview content.',error);return null}
  }
  const ready=loadPreviewContent().then(preview=>preview||fetch(DATA_URL,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(`Unable to load ${DATA_URL}`);return r.json()})).then(data=>{applyGraphicAssets(data);render(data);window.ASG_MASTER_DATA=data;return data}).catch(err=>{console.error(err);document.querySelectorAll('[data-generated-source]').forEach(el=>el.innerHTML='<p class="generated-data-error">Content could not load. Check data/master-content.json.</p>');});
  window.ASGContent={ready,render};
})();
