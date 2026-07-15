(() => {
  "use strict";
  const CONFIG={owner:'nepdogg',repo:'allstargalaxysoccer',branch:'main',path:'data/hero-rotation.json'};
  const PAGES=[
    ['home','Home'],['team','Team'],['schedule','Schedule'],['media','Media'],['news','News'],
    ['livestream','Live'],['follow','Follow'],['about','About'],['404','404 Page'],['season-archive','Summer 2026 Archive']
  ];
  const EFFECTS=[
    ['fade','Crossfade only'],['pulse','Subtle pulse'],['zoom-in','Slow zoom in'],['zoom-out','Slow zoom out'],
    ['pan-left','Slow pan left'],['pan-right','Slow pan right'],['none','No motion']
  ];
  let state={config:null,sha:null,page:'home',pendingFiles:[],dirty:false};
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const token=()=>sessionStorage.getItem('asgGithubToken')||'';
  const headers=()=>({'Accept':'application/vnd.github+json','Authorization':`Bearer ${token()}`,'X-GitHub-Api-Version':'2022-11-28'});
  const decode64=s=>decodeURIComponent(escape(atob(s.replace(/\n/g,''))));
  const encode64=s=>btoa(unescape(encodeURIComponent(s)));
  const slug=s=>String(s||'hero').toLowerCase().trim().replace(/\.[^.]+$/,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'hero';
  function status(msg,type=''){const el=$('#statusbar');el.textContent=msg;el.className='statusbar '+type}
  async function ghGet(path){const r=await fetch(`https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${path}?ref=${CONFIG.branch}`,{headers:headers()});if(!r.ok)throw new Error(`${r.status}: ${await r.text()}`);return r.json()}
  async function ghPut(path,content,message,sha){const body={message,content,branch:CONFIG.branch};if(sha)body.sha=sha;const r=await fetch(`https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${path}`,{method:'PUT',headers:{...headers(),'Content-Type':'application/json'},body:JSON.stringify(body)});if(!r.ok)throw new Error(`${r.status}: ${await r.text()}`);return r.json()}
  async function fileToPng(file){const bmp=await createImageBitmap(file),canvas=document.createElement('canvas');canvas.width=bmp.width;canvas.height=bmp.height;canvas.getContext('2d').drawImage(bmp,0,0);const blob=await new Promise(r=>canvas.toBlob(r,'image/png',.92));const url=URL.createObjectURL(blob),buf=await blob.arrayBuffer(),bytes=new Uint8Array(buf);let binary='';for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return {url,base64:btoa(binary)}}
  function current(){return state.config.pages[state.page]}
  function markDirty(){state.dirty=true;$('#pendingLabel').textContent='Unpublished changes'}
  function pageLabel(key){return PAGES.find(x=>x[0]===key)?.[1]||key}
  function render(){
    const p=current();
    $('#pageTitle').textContent='Hero Images';
    $('#content').innerHTML=`<div class="v2-banner"><strong>Hero Manager</strong><span>Add, replace, reorder, hide or remove hero photos for every page. Choose the motion effect and timing separately for each page.</span></div>
    <div class="hero-manager-toolbar panel"><div class="form-grid">
      <div class="field"><label>Website page</label><select id="heroPage">${PAGES.map(([v,t])=>`<option value="${v}" ${state.page===v?'selected':''}>${t}</option>`).join('')}</select></div>
      <div class="field"><label>Hero rotation</label><select id="heroEnabled"><option value="true" ${p.enabled!==false?'selected':''}>Enabled</option><option value="false" ${p.enabled===false?'selected':''}>Disabled — show first image only</option></select></div>
      <div class="field"><label>Motion effect</label><select id="heroEffect">${EFFECTS.map(([v,t])=>`<option value="${v}" ${p.effect===v?'selected':''}>${t}</option>`).join('')}</select></div>
      <div class="field"><label>Time each photo stays visible</label><select id="heroInterval">${[[4000,'4 seconds'],[5000,'5 seconds'],[6000,'6 seconds'],[7000,'7 seconds'],[8000,'8 seconds'],[10000,'10 seconds'],[12000,'12 seconds'],[15000,'15 seconds']].map(([v,t])=>`<option value="${v}" ${Number(p.interval||7000)===v?'selected':''}>${t}</option>`).join('')}</select></div>
      <div class="field"><label>Transition speed</label><select id="heroTransition">${[[500,'Fast — 0.5 seconds'],[900,'Quick — 0.9 seconds'],[1400,'Smooth — 1.4 seconds'],[2000,'Slow — 2 seconds'],[3000,'Cinematic — 3 seconds']].map(([v,t])=>`<option value="${v}" ${Number(p.transition||1400)===v?'selected':''}>${t}</option>`).join('')}</select></div>
      <div class="field locked-field"><label>Page selector 🔒</label><input value="${esc(p.selector)}" readonly></div>
    </div></div>
    <div class="admin-actions manager-actions"><label class="btn primary upload-hero-btn">+ Add Hero Photos<input id="heroUpload" type="file" accept="image/png,image/jpeg,image/webp" multiple hidden></label><button class="btn" id="duplicateFirst">Duplicate First Image</button><button class="btn" id="publishHeroes">Publish Hero Changes</button><span class="pending" id="pendingLabel">${state.dirty?'Unpublished changes':''}</span></div>
    <div class="hero-help">Recommended: 5–15 photos per page. Images are automatically converted to PNG. Use the arrows to control the rotation order.</div>
    <div class="hero-admin-grid">${p.images.map((src,i)=>heroCard(src,i)).join('')||'<div class="empty-state">No hero images assigned. Add at least one image.</div>'}</div>`;
    bind();
  }
  function heroCard(src,i){return `<article class="hero-admin-card ${i===0?'is-first':''}"><div class="hero-admin-preview"><img src="../${esc(src)}?v=${Date.now()}" alt="Hero ${i+1}"></div><div class="hero-admin-info"><strong>${i===0?'Primary / fallback image':`Image ${i+1}`}</strong><span>${esc(src.split('/').pop())}</span></div><div class="hero-admin-actions"><button class="btn small" data-left="${i}" ${i===0?'disabled':''}>← Earlier</button><button class="btn small" data-right="${i}" ${i===current().images.length-1?'disabled':''}>Later →</button><label class="btn small">Replace<input type="file" accept="image/png,image/jpeg,image/webp" data-replace="${i}" hidden></label><button class="btn small danger" data-remove="${i}" ${current().images.length<=1?'disabled':''}>Remove</button></div></article>`}
  function bind(){
    $('#heroPage').onchange=e=>{state.page=e.target.value;render()};
    $('#heroEnabled').onchange=e=>{current().enabled=e.target.value==='true';markDirty()};
    $('#heroEffect').onchange=e=>{current().effect=e.target.value;markDirty()};
    $('#heroInterval').onchange=e=>{current().interval=Number(e.target.value);markDirty()};
    $('#heroTransition').onchange=e=>{current().transition=Number(e.target.value);markDirty()};
    $('#heroUpload').onchange=async e=>{for(const file of e.target.files)await addFile(file);render()};
    $('#duplicateFirst').onclick=()=>{if(current().images[0]){current().images.push(current().images[0]);markDirty();render()}};
    $('#publishHeroes').onclick=publish;
    $$('[data-left]').forEach(b=>b.onclick=()=>move(+b.dataset.left,-1));
    $$('[data-right]').forEach(b=>b.onclick=()=>move(+b.dataset.right,1));
    $$('[data-remove]').forEach(b=>b.onclick=()=>{const i=+b.dataset.remove;if(confirm('Remove this hero image from the rotation? The uploaded PNG will remain in GitHub.')){current().images.splice(i,1);markDirty();render()}});
    $$('[data-replace]').forEach(inp=>inp.onchange=async()=>{if(inp.files[0]){await replaceFile(+inp.dataset.replace,inp.files[0]);render()}});
  }
  function move(i,d){const a=current().images,j=i+d;if(j<0||j>=a.length)return;[a[i],a[j]]=[a[j],a[i]];markDirty();render()}
  function uniquePath(file){const folder=`images/heroes/rotation/${state.page}`;const base=slug(file.name);let path=`${folder}/${base}.png`,n=2;const used=new Set(Object.values(state.config.pages).flatMap(p=>p.images));while(used.has(path)||state.pendingFiles.some(f=>f.path===path))path=`${folder}/${base}-${n++}.png`;return path}
  async function addFile(file){const r=await fileToPng(file),path=uniquePath(file);state.pendingFiles.push({path,base64:r.base64});current().images.push(path);markDirty();status(`${file.name} added to ${pageLabel(state.page)}.`,'ok')}
  async function replaceFile(index,file){const r=await fileToPng(file),path=uniquePath(file);state.pendingFiles.push({path,base64:r.base64});current().images[index]=path;markDirty();status(`Image ${index+1} replaced.`,'ok')}
  async function publish(){
    if(!current().images.length){status('Add at least one hero image before publishing.','bad');return}
    status('Publishing hero images and rotation settings…');
    try{
      for(const f of state.pendingFiles){let sha;try{sha=(await ghGet(f.path)).sha}catch(e){}await ghPut(f.path,f.base64,`Hero Manager: upload ${f.path}`,sha)}
      state.config.version=Number(state.config.version||132)+1;
      const latest=await ghGet(CONFIG.path);
      const r=await ghPut(CONFIG.path,encode64(JSON.stringify(state.config,null,2)),'Hero Manager: update hero rotations, effects and timing',latest.sha);
      state.sha=r.content.sha;state.pendingFiles=[];state.dirty=false;status('Hero settings published. GitHub Pages will update shortly.','ok');render()
    }catch(e){status('Publish failed: '+e.message,'bad')}
  }
  async function init(){
    if(!token()){location.href='index.html';return}
    try{const f=await ghGet(CONFIG.path);state.sha=f.sha;state.config=JSON.parse(decode64(f.content));PAGES.forEach(([k])=>{state.config.pages[k] ||= {selector:'',images:[],enabled:true,interval:7000,transition:1400,effect:'fade'};const p=state.config.pages[k];p.enabled=p.enabled!==false;p.interval=Number(p.interval||state.config.interval||7000);p.transition=Number(p.transition||state.config.transition||1400);p.effect=p.effect||'fade'});status('Hero Manager connected.','ok');render()}catch(e){status('Could not load hero settings: '+e.message,'bad')}
  }
  document.addEventListener('DOMContentLoaded',()=>{$('#menuBtn')?.addEventListener('click',()=>$('.admin-sidebar').classList.toggle('open'));$('#logoutBtn')?.addEventListener('click',()=>{sessionStorage.removeItem('asgGithubToken');location.href='index.html'});init()});
})();