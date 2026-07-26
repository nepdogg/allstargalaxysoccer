(() => {
  const esc=(v='')=>String(v).replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const visible=x=>x&&x.status!=='hidden';
  const awardInfo=type=>{
    const key=String(type||'player').toLowerCase().replace(/[^a-z]+/g,'-');
    const map={
      'player-of-the-game':{title:'PLAYER OF THE GAME',icon:'🏆',accent:'#f5c542'},
      'goal-of-the-game':{title:'GOAL OF THE GAME',icon:'⚽',accent:'#ff3b3b'},
      'save-of-the-game':{title:'SAVE OF THE GAME',icon:'✋',accent:'#20bfff'},
      'assist-of-the-game':{title:'ASSIST OF THE GAME',icon:'➤',accent:'#39d675'},
      'play-of-the-game':{title:'PLAY OF THE GAME',icon:'★',accent:'#b45cff'}
    };
    return map[key]||{title:String(type||'GAME AWARD').toUpperCase(),icon:'🏆',accent:'#f5c542'};
  };
  const gameTitle=g=>`${g?.season||'SEASON'} · GAME ${String(g?.gameNumber||'').padStart(2,'0')}`;
  function resolve(data,award){
    const games=data?.games||[], players=data?.players||[];
    const game=games.find(g=>g.id===award.gameId)||games.find(g=>String(g.season)===String(award.season)&&String(g.gameNumber)===String(award.gameNumber))||{};
    const player=players.find(p=>p.id===award.playerId)||players.find(p=>String(p.name).toLowerCase()===String(award.playerName||'').toLowerCase())||{};
    return {game:{...game,...award.gameSnapshot},player:{...player,...award.playerSnapshot}};
  }
  function assetUrl(value,prefix=''){
    const src=String(value||'').trim();
    if(!src||/^(?:https?:|data:|blob:|\/\/|\/)/i.test(src))return src;
    if(src.startsWith('../'))return src;
    return prefix+src.replace(/^\.\//,'');
  }
  function card(data,award,{preview=false,assetPrefix=''}={}){
    const {game,player}=resolve(data,award), info=awardInfo(award.awardType||award.type);
    const first=player.firstName||String(player.name||'PLAYER').trim().split(/\s+/)[0]||'PLAYER';
    const last=player.lastName||String(player.name||'').trim().split(/\s+/).slice(1).join(' ')||first;
    const photo=assetUrl(player.photo||player.image||award.playerPhoto||data?.assets?.playerPlaceholder||data?.assets?.logo||'generated/allstar-galaxy-logo.png',assetPrefix);
    const opponent=game.opponent||award.opponent||'OPPONENT';
    const href=String(award.videoUrl||award.url||'').trim();
    const tag=preview?'div':'a';
    const attrs=preview?'':(href?` href="${esc(href)}" target="_blank" rel="noopener"`:' href="#" aria-disabled="true"');
    return `<${tag}${attrs} class="game-award-slide media-slide${href?'':' is-pending'}" style="--award-accent:${info.accent}" aria-label="${esc(info.title)} — ${esc(first+' '+last)}">
      <article class="game-award-card">
        <header class="game-award-header"><span class="game-award-icon">${info.icon}</span><strong>${esc(info.title)}</strong><small>${award.status==='hidden'?'HIDDEN':'VISIBLE'}</small></header>
        <div class="game-award-body">
          <div class="game-award-photo"><img src="${esc(photo)}" alt="${esc(first+' '+last)}" loading="lazy"></div>
          <div class="game-award-copy">
            <h3><span>${esc(first)}</span>${esc(last)}</h3>
            <p class="game-award-player-meta">#${esc(player.number||'—')} · ${esc(player.position||'PLAYER')}</p>
            <p class="game-award-game-meta">${esc(gameTitle(game))}</p>
            <p class="game-award-match">ALLSTAR GALAXY<br>VS ${esc(opponent)}</p>
            ${game.result?`<p class="game-award-result">${esc(game.result)}</p>`:''}
            ${href?'<span class="game-award-watch">WATCH AWARD VIDEO ▶</span>':'<span class="game-award-watch is-pending">VIDEO COMING SOON</span>'}
          </div>
        </div>
      </article>
    </${tag}>`;
  }
  function render(data,awards,options={}){
    return [...(awards||[])].filter(visible).sort((a,b)=>(Number(a.order)||9999)-(Number(b.order)||9999)).map(a=>card(data,a,options)).join('');
  }
  window.ASGGameAwards={card,render,resolve,awardInfo};
})();
