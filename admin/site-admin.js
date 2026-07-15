
(() => {
 const CFG={owner:'nepdogg',repo:'allstargalaxysoccer',branch:'main',path:'data/site-settings.json'};
 let state={data:null,sha:null,pending:[],dirty:false};
 const $=s=>document.querySelector(s),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const token=()=>sessionStorage.getItem('asgGithubToken')||'',headers=()=>({'Accept':'application/vnd.github+json','Authorization':`Bearer ${token()}`,'X-GitHub-Api-Version':'2022-11-28'});
 const dec=s=>decodeURIComponent(escape(atob(s.replace(/\n/g,'')))),enc=s=>btoa(unescape(encodeURIComponent(s)));
 async function get(path){const r=await fetch(`https://api.github.com/repos/${CFG.owner}/${CFG.repo}/contents/${path}?ref=${CFG.branch}`,{headers:headers()});if(!r.ok)throw new Error(await r.text());return r.json()}
 async function put(path,content,message,sha){const body={message,content,branch:CFG.branch};if(sha)body.sha=sha;const r=await fetch(`https://api.github.com/repos/${CFG.owner}/${CFG.repo}/contents/${path}`,{method:'PUT',headers:{...headers(),'Content-Type':'application/json'},body:JSON.stringify(body)});if(!r.ok)throw new Error(await r.text());return r.json()}
 function status(m,t=''){const e=$('#statusbar');e.textContent=m;e.className='statusbar '+t}
 async function png(file){const b=await createImageBitmap(file),c=document.createElement('canvas');c.width=b.width;c.height=b.height;c.getContext('2d').drawImage(b,0,0);const blob=await new Promise(r=>c.toBlob(r,'image/png',.92)),buf=new Uint8Array(await blob.arrayBuffer());let s='';for(let i=0;i<buf.length;i+=32768)s+=String.fromCharCode(...buf.subarray(i,i+32768));return btoa(s)}
 function mark(){state.dirty=true;$('#pendingLabel').textContent='Unpublished changes'}
 function navRows(){return state.data.navigation.sort((a,b)=>a.order-b.order).map((n,i)=>`<div class="settings-row"><input data-nav="${i}" data-k="label" value="${esc(n.label)}"><input data-nav="${i}" data-k="href" value="${esc(n.href)}" readonly><select data-nav="${i}" data-k="visible"><option value="true" ${n.visible!==false?'selected':''}>Visible</option><option value="false" ${n.visible===false?'selected':''}>Hidden</option></select><input data-nav="${i}" data-k="order" type="number" value="${n.order}"></div>`).join('')}
 function pageRows(){return Object.entries(state.data.pages).map(([k,p])=>`<details class="advanced-box"><summary>${k.toUpperCase()} Page</summary><div class="form-grid"><div class="field"><label>Page visible</label><select data-page="${k}" data-k="visible"><option value="true" ${p.visible!==false?'selected':''}>Visible</option><option value="false" ${p.visible===false?'selected':''}>Hidden</option></select></div><div class="field"><label>Browser title</label><input data-page="${k}" data-k="title" value="${esc(p.title)}"></div><div class="field full"><label>Page description</label><textarea data-page="${k}" data-k="description">${esc(p.description)}</textarea></div></div></details>`).join('')}
 function render(){
  const s=state.data;
  $('#pageTitle').textContent='Site Settings';
  $('#content').innerHTML=`<div class="v2-banner"><strong>Complete Site Manager</strong><span>Update branding, text, navigation, social links, footer and page visibility.</span></div>
  <div class="admin-actions manager-actions"><button class="btn primary" id="publish">Publish Site Settings</button><button class="btn" id="preview">Preview Draft</button><span class="pending" id="pendingLabel">${state.dirty?'Unpublished changes':''}</span></div>
  <section class="panel"><h3>Global Branding</h3><div class="form-grid">
   <div class="field"><label>Team name</label><input id="teamName" value="${esc(s.branding.teamName)}"></div>
   <div class="field"><label>Accent color</label><input id="accent" type="color" value="${esc(s.branding.accentColor)}"></div>
   ${['leftLogo','rightLogo','navigationTitle','favicon'].map(k=>`<div class="field"><label>Replace ${k}</label><input type="file" data-upload="${k}" accept="image/*"><div class="help">Current: ${esc(s.branding[k])}</div></div>`).join('')}
  </div></section>
  <section class="panel settings-panel"><h3>Navigation Manager</h3><div class="settings-head"><span>Label</span><span>Protected URL</span><span>Visibility</span><span>Order</span></div>${navRows()}</section>
  <section class="panel settings-panel"><h3>Page Text & Visibility</h3>${pageRows()}</section>
  <section class="panel"><h3>Social Links</h3><div class="form-grid">${Object.entries(s.social).map(([k,v])=>`<div class="field"><label>${k}</label><input data-social="${k}" value="${esc(v)}"></div>`).join('')}</div></section>
  <section class="panel"><h3>Footer Manager</h3><div class="form-grid"><div class="field full"><label>Copyright text</label><input id="copyright" value="${esc(s.footer.copyright)}"></div><div class="field"><label>About link</label><select id="showAbout"><option value="true" ${s.footer.showAboutLink!==false?'selected':''}>Visible</option><option value="false" ${s.footer.showAboutLink===false?'selected':''}>Hidden</option></select></div><div class="field"><label>About label</label><input id="aboutLabel" value="${esc(s.footer.aboutLabel)}"></div></div></section>
  <section class="panel settings-panel"><h3>Homepage Sections</h3>${s.homeSections.map((x,i)=>`<div class="settings-row"><input value="${esc(x.label)}" readonly><input value="${esc(x.selector)}" readonly><select data-home="${i}" data-k="visible"><option value="true" ${x.visible!==false?'selected':''}>Visible</option><option value="false" ${x.visible===false?'selected':''}>Hidden</option></select><input data-home="${i}" data-k="order" type="number" value="${x.order}"></div>`).join('')}</section>`;
  bind()
 }
 function bind(){
  $('#teamName').oninput=e=>{state.data.branding.teamName=e.target.value;mark()};$('#accent').oninput=e=>{state.data.branding.accentColor=e.target.value;mark()};
  document.querySelectorAll('[data-nav]').forEach(e=>e.onchange=()=>{let v=e.value;if(e.dataset.k==='visible')v=v==='true';if(e.dataset.k==='order')v=Number(v);state.data.navigation[+e.dataset.nav][e.dataset.k]=v;mark()});
  document.querySelectorAll('[data-page]').forEach(e=>e.onchange=()=>{let v=e.value;if(e.dataset.k==='visible')v=v==='true';state.data.pages[e.dataset.page][e.dataset.k]=v;mark()});
  document.querySelectorAll('[data-social]').forEach(e=>e.oninput=()=>{state.data.social[e.dataset.social]=e.value;mark()});
  $('#copyright').oninput=e=>{state.data.footer.copyright=e.target.value;mark()};$('#showAbout').onchange=e=>{state.data.footer.showAboutLink=e.target.value==='true';mark()};$('#aboutLabel').oninput=e=>{state.data.footer.aboutLabel=e.target.value;mark()};
  document.querySelectorAll('[data-home]').forEach(e=>e.onchange=()=>{let v=e.value;if(e.dataset.k==='visible')v=v==='true';if(e.dataset.k==='order')v=Number(v);state.data.homeSections[+e.dataset.home][e.dataset.k]=v;mark()});
  document.querySelectorAll('[data-upload]').forEach(e=>e.onchange=async()=>{if(!e.files[0])return;const key=e.dataset.upload,path=`images/managed/${key}.png`;state.pending.push({path,base64:await png(e.files[0])});state.data.branding[key]=path;mark();status(`${key} ready to publish.`,'ok')});
  $('#preview').onclick=()=>{sessionStorage.setItem('asgPreviewSiteSettings',JSON.stringify(state.data));window.open('../index.html?adminPreview=1','_blank')};
  $('#publish').onclick=publish
 }
 async function publish(){
  status('Creating backup and publishing site settings…');
  try{await window.ASGBackup?.create('Before Site Settings publish');for(const f of state.pending){let sha;try{sha=(await get(f.path)).sha}catch(e){}await put(f.path,f.base64,`Site Manager: ${f.path}`,sha)}const latest=await get(CFG.path),r=await put(CFG.path,enc(JSON.stringify(state.data,null,2)),'Site Manager: update site settings',latest.sha);state.sha=r.content.sha;state.pending=[];state.dirty=false;status('Site settings published.','ok');render()}catch(e){status('Publish failed: '+e.message,'bad')}
 }
 async function init(){if(!token()){location.href='index.html';return}try{const f=await get(CFG.path);state.sha=f.sha;state.data=JSON.parse(dec(f.content));status('Site Manager connected.','ok');render()}catch(e){status('Could not load settings: '+e.message,'bad')}}
 document.addEventListener('DOMContentLoaded',()=>{$('#menuBtn').onclick=()=>document.querySelector('.admin-sidebar').classList.toggle('open');$('#logoutBtn').onclick=()=>{sessionStorage.removeItem('asgGithubToken');location.href='index.html'};init()})
})();
