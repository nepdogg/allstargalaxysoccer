/* Allstar Galaxy V203 — progressive visual polish and optional dynamic features. */
(() => {
  'use strict';
  const q=(s,r=document)=>r.querySelector(s), qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  const parseDate=(date,time='')=>{
    if(!date) return null;
    const raw=`${date} ${time||''}`.trim();
    let d=new Date(raw);
    if(Number.isNaN(d.getTime())) d=new Date(date);
    return Number.isNaN(d.getTime())?null:d;
  };
  function reveals(){
    const nodes=qa('main > section, .page-section-description, footer, .homepage-bestof-title-wrap, .carousel-section-title-wrap');
    nodes.forEach(n=>n.classList.add('v203-reveal'));
    if(!('IntersectionObserver' in window)){nodes.forEach(n=>n.classList.add('is-visible'));return;}
    const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');io.unobserve(e.target)}}),{threshold:.09,rootMargin:'0px 0px -35px'});
    nodes.forEach(n=>io.observe(n));
  }
  async function loadData(){
    try{const r=await fetch('data/master-content.json',{cache:'no-store'});if(!r.ok)throw new Error();return await r.json()}catch(_){try{const r=await fetch('master-content.json',{cache:'no-store'});return r.ok?await r.json():null}catch(__){return null}}
  }
  function addOnThisDay(data){
    if(!document.body.classList.contains('page-home')||!data?.games?.length)return;
    const now=new Date();
    const candidates=data.games.filter(g=>String(g.status).toLowerCase()!=='hidden').map(g=>({g,d:parseDate(g.date,g.time)})).filter(x=>x.d&&x.d.getMonth()===now.getMonth()&&x.d.getDate()===now.getDate()&&x.d.getFullYear()<now.getFullYear()).sort((a,b)=>b.d-a.d);
    if(!candidates.length)return;
    const {g,d}=candidates[0], years=now.getFullYear()-d.getFullYear();
    const link=[g.highlights,g.fullMatch,g.slideshow].find(v=>v&&v!=='#');
    const section=document.createElement('section');section.className='v203-on-this-day v203-reveal';
    section.innerHTML=`<span class="v203-kicker">On This Day</span><h2 class="v203-feature-title">Allstar Galaxy vs ${esc(g.opponent||'Opponent')}</h2><p class="v203-feature-meta">${years===1?'One year':`${years} years`} ago · ${esc(g.result||`Game ${g.gameNumber||''}`)}</p>${link?`<a class="v203-feature-link" href="${esc(link)}" target="_blank" rel="noopener">Watch the Memory ▶</a>`:''}`;
    q('main')?.prepend(section);requestAnimationFrame(()=>section.classList.add('is-visible'));
  }
  function addCountdown(data){
    if(!document.body.classList.contains('page-schedule')||!data?.schedule?.length)return;
    const now=new Date();
    const future=data.schedule.filter(m=>String(m.status).toLowerCase()!=='hidden').map(m=>({m,d:parseDate(m.date,m.time)})).filter(x=>x.d&&x.d>now).sort((a,b)=>a.d-b.d)[0];
    if(!future)return;
    const {m,d}=future, section=document.createElement('section');section.className='v203-countdown v203-reveal';
    section.innerHTML=`<span class="v203-kicker">Next Match</span><h2 class="v203-feature-title">Allstar Galaxy vs ${esc(m.opponent||'TBA')}</h2><p class="v203-feature-meta">${esc(m.date||'')} ${esc(m.time||'')} · ${esc(m.location||'Location TBA')}</p><div class="v203-countdown-grid" aria-live="polite"><div class="v203-countdown-unit"><strong data-u="d">0</strong><span>Days</span></div><div class="v203-countdown-unit"><strong data-u="h">0</strong><span>Hours</span></div><div class="v203-countdown-unit"><strong data-u="m">0</strong><span>Minutes</span></div><div class="v203-countdown-unit"><strong data-u="s">0</strong><span>Seconds</span></div></div>`;
    q('main')?.prepend(section);
    const tick=()=>{const n=Math.max(0,d-new Date()), vals={d:Math.floor(n/864e5),h:Math.floor(n/36e5)%24,m:Math.floor(n/6e4)%60,s:Math.floor(n/1e3)%60};Object.entries(vals).forEach(([k,v])=>{const e=q(`[data-u="${k}"]`,section);if(e)e.textContent=String(v).padStart(2,'0')})};tick();setInterval(tick,1000);requestAnimationFrame(()=>section.classList.add('is-visible'));
  }
  function footerSignature(){qa('.footer-small').forEach(p=>{if(q('.footer-signature',p))return;const s=document.createElement('span');s.className='footer-signature';s.innerHTML='Designed &amp; developed by <strong>Xitlali Media</strong> · Website V203';p.appendChild(s)})}
  document.addEventListener('DOMContentLoaded',async()=>{reveals();footerSignature();const data=await loadData();addOnThisDay(data);addCountdown(data)});
})();
