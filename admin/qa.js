(() => {
  'use strict';
  const $=s=>document.querySelector(s), esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const publicPages=['index.html','team.html','schedule.html','media.html','game-awards.html','news.html','livestream.html','follow.html','about.html','404.html'];
  const results=[];
  const add=(group,name,status,detail='')=>results.push({group,name,status,detail});
  const validUrl=v=>!v||v==='#'||/^(https?:\/\/|mailto:|tel:)/i.test(v);
  async function fetchOk(path,type='text') { try { const r=await fetch(`../${path}?qa=${Date.now()}`,{cache:'no-store'}); if(!r.ok) return {ok:false,error:`HTTP ${r.status}`}; return {ok:true,data:type==='json'?await r.json():await r.text()}; } catch(e){ return {ok:false,error:e.message}; } }
  function checkArray(data,key,required=[]) {
    const arr=Array.isArray(data[key])?data[key]:[];
    add('Content',`${key}: data collection`,Array.isArray(data[key])?'pass':'error',`${arr.length} records`);
    const ids=new Set(), duplicates=[];
    arr.forEach((item,i)=>{ if(item?.id){if(ids.has(item.id))duplicates.push(item.id);ids.add(item.id)} required.forEach(field=>{if(item?.status!=='hidden'&&!String(item?.[field]??'').trim())add('Content',`${key} #${i+1}: missing ${field}`,'warning',item?.id||'No ID')}); });
    add('Content',`${key}: unique IDs`,duplicates.length?'error':'pass',duplicates.length?duplicates.join(', '):'No duplicate IDs');
  }
  function checkUrls(data){
    const fields=['fullMatch','highlights','slideshow','videoUrl','url','playlistUrl','fullMatches','slideshows'];
    Object.entries(data).forEach(([section,value])=>{if(!Array.isArray(value))return;value.forEach((item,i)=>fields.forEach(field=>{const url=item?.[field];if(url&&!validUrl(url))add('Links',`${section} #${i+1}: invalid ${field}`,'error',url)}))});
  }
  async function checkAsset(path,label){ if(!path)return add('Assets',label,'warning','No path configured'); const r=await fetchOk(path); add('Assets',label,r.ok?'pass':'error',r.ok?path:`${path} — ${r.error}`); }
  function render(){
    const counts={pass:0,warning:0,error:0};results.forEach(r=>counts[r.status]++);
    $('#qaSummary').innerHTML=`<article class="qa-score pass"><strong>${counts.pass}</strong><span>Passed</span></article><article class="qa-score warning"><strong>${counts.warning}</strong><span>Warnings</span></article><article class="qa-score error"><strong>${counts.error}</strong><span>Errors</span></article>`;
    const groups=[...new Set(results.map(r=>r.group))];
    $('#qaResults').innerHTML=groups.map(group=>`<article class="qa-panel"><h3>${esc(group)}</h3>${results.filter(r=>r.group===group).map(r=>`<div class="qa-row ${r.status}"><span class="qa-indicator">${r.status==='pass'?'✓':r.status==='warning'?'!':'×'}</span><div><strong>${esc(r.name)}</strong>${r.detail?`<small>${esc(r.detail)}</small>`:''}</div></div>`).join('')}</article>`).join('');
    $('#statusbar').className=`statusbar ${counts.error?'bad':'ok'}`; $('#statusbar').textContent=counts.error?`Diagnostics complete: ${counts.error} error(s) need attention.`:`Diagnostics complete: no blocking errors. ${counts.warning} warning(s) to review.`;
  }
  async function run(){
    results.length=0; $('#statusbar').className='statusbar'; $('#statusbar').textContent='Running website, content, asset, and link checks…'; $('#qaResults').innerHTML='<div class="qa-loading">Testing all Version 1 systems…</div>';
    const content=await fetchOk('data/master-content.json','json'); add('System','Master content JSON',content.ok?'pass':'error',content.ok?`Version ${content.data.version||'unknown'} · updated ${content.data.updated||'unknown'}`:content.error);
    const settings=await fetchOk('data/site-settings.json','json'); add('System','Site settings JSON',settings.ok?'pass':'error',settings.ok?'Loaded successfully':settings.error);
    const heroes=await fetchOk('data/hero-rotation.json','json'); add('System','Hero rotation JSON',heroes.ok?'pass':'error',heroes.ok?'Loaded successfully':heroes.error);
    for(const page of publicPages){const r=await fetchOk(page);add('Pages',page,r.ok?'pass':'error',r.ok?'Page loaded':r.error)}
    if(content.ok){const d=content.data;checkArray(d,'players',['name']);checkArray(d,'games',['season','gameNumber','opponent']);checkArray(d,'gameAwards',['awardType','videoUrl']);checkArray(d,'seasons',['title']);checkArray(d,'playlists',['title']);checkArray(d,'news',['title']);checkUrls(d);
      const assets=d.assets||{}; await checkAsset(assets.logo||'images/logos/logo.png','Primary logo'); await checkAsset(assets.playerPlaceholder||'images/team/players/player-silhouette.png','Player placeholder');
      const paths=new Set(); ['players','games','gameAwards','seasons','playlists','news'].forEach(k=>(d[k]||[]).forEach(x=>['photo','image','cardImage','playerPhoto'].forEach(f=>{const p=x?.[f];if(p&&!/^https?:/i.test(p))paths.add(p)})));
      for(const path of [...paths].slice(0,80)) await checkAsset(path,`Content image: ${path.split('/').pop()}`);
    }
    add('Responsive','Desktop visual review','warning','Automated checks cannot judge cropping or spacing; review at 1440px width.');add('Responsive','Phone visual review','warning','Review at 390px width after every design update.');
    render();
  }
  $('#runQa')?.addEventListener('click',run); $('#menuBtn')?.addEventListener('click',()=>document.querySelector('.admin-sidebar')?.classList.toggle('open')); run();
})();
