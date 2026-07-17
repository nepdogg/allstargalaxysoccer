
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
  <div class="admin-actions unified-workflow-bar">
    <button class="btn" id="saveSiteSettings" type="button">Save Changes</button>
    <button class="btn" id="preview" type="button">Preview Website</button>
    <button class="btn primary" id="publish" type="button">Publish</button>
    <button class="btn danger-outline" id="cancelSiteSettings" type="button">Cancel</button>
    <span class="pending" id="pendingLabel">${state.dirty?'Unpublished changes':'No unpublished changes'}</span>
  </div>
  <section class="visual-settings-preview"><div class="preview-toolbar"><div><span class="v2-pill">LIVE PREVIEW</span><h4>Navigation & Footer</h4></div></div><div id="siteChromePreview"></div></section>
  <section class="panel"><h3>Global Branding</h3><div class="form-grid">
   <div class="field"><label>Team name</label><input id="teamName" value="${esc(s.branding.teamName)}"></div>
   <div class="field"><label>Accent color</label><input id="accent" type="color" value="${esc(s.branding.accentColor)}"></div>
   ${['leftLogo','rightLogo','navigationTitle','favicon'].map(k=>`<div class="field"><label>Replace ${k}</label><input type="file" data-upload="${k}" accept="image/*"><div class="help">Current: ${esc(s.branding[k])}</div></div>`).join('')}
  </div></section>
  <section class="panel settings-panel"><h3>Navigation Manager</h3><div class="settings-head"><span>Label</span><span>Protected URL</span><span>Visibility</span><span>Order</span></div>${navRows()}</section>
  <section class="panel settings-panel"><h3>Page Text & Visibility</h3>${pageRows()}</section>
  <section class="panel"><h3>Social Links</h3><div class="form-grid">${Object.entries(s.social).map(([k,v])=>`<div class="field"><label>${k}</label><input data-social="${k}" value="${esc(v)}"></div>`).join('')}</div></section>
  <section class="panel"><h3>Footer Manager</h3><div class="form-grid">
  <div class="field full"><label>Copyright text</label><input id="copyright" value="${esc(s.footer.copyright)}"></div>
  <div class="field"><label>About link</label><select id="showAbout"><option value="true" ${s.footer.showAboutLink!==false?'selected':''}>Visible</option><option value="false" ${s.footer.showAboutLink===false?'selected':''}>Hidden</option></select></div>
  <div class="field"><label>About label</label><input id="aboutLabel" value="${esc(s.footer.aboutLabel)}"></div>
  <div class="field"><label>Admin link</label><select id="showAdmin"><option value="true" ${s.footer.showAdminLink!==false?'selected':''}>Visible — small footer link</option><option value="false" ${s.footer.showAdminLink===false?'selected':''}>Hidden</option></select></div>
  <div class="field"><label>Admin label</label><input id="adminLabel" value="${esc(s.footer.adminLabel||'Admin')}"></div>
  <div class="field locked-field"><label>Admin destination 🔒</label><input id="adminHref" value="${esc(s.footer.adminHref||'admin/')}" readonly><div class="help">Protected so visitors are always sent to the correct dashboard login.</div></div>

  <div class="field"><label>Platform version line</label><select id="showPlatformVersion"><option value="true" ${s.footer.showPlatformVersion!==false?'selected':''}>Visible</option><option value="false" ${s.footer.showPlatformVersion===false?'selected':''}>Hidden</option></select></div>
  <div class="field"><label>Platform name</label><input id="platformName" value="${esc(s.footer.platformName||'Allstar Galaxy Platform')}"></div>
  <div class="field"><label>Public version</label><input id="platformVersion" value="${esc(s.footer.platformVersion||'v1.0')}" placeholder="v1.0"></div>
  <div class="field"><label>Build number</label><input id="platformBuild" value="${esc(s.footer.platformBuild||'138')}" placeholder="138"></div>

  <div class="field"><label>Xitlali Media credit</label><select id="showXitlaliCredit"><option value="true" ${s.footer.showXitlaliCredit!==false?'selected':''}>Visible</option><option value="false" ${s.footer.showXitlaliCredit===false?'selected':''}>Hidden</option></select></div>
  <div class="field"><label>Credit text</label><input id="xitlaliCreditText" value="${esc(s.footer.xitlaliCreditText||'Designed and Developed by Xitlali Media')}"></div>
  <div class="field"><label>Xitlali Media website</label><input id="xitlaliUrl" type="url" value="${esc(s.footer.xitlaliUrl||'https://xitlalimedia.com')}"></div>
  <div class="field"><label>Upload Xitlali Media logo</label><input id="xitlaliLogoUpload" type="file" accept="image/png,image/jpeg,image/webp"><div class="help">Optional. Until a logo is uploaded, a small text wordmark is shown.</div></div>
  <div class="field locked-field"><label>Xitlali logo path 🔒</label><input id="xitlaliLogoPath" value="${esc(s.footer.xitlaliLogo||'Not uploaded yet')}" readonly></div>
</div></section>
  <section class="panel settings-panel"><h3>Homepage Sections</h3>${s.homeSections.map((x,i)=>`<div class="settings-row"><input value="${esc(x.label)}" readonly><input value="${esc(x.selector)}" readonly><select data-home="${i}" data-k="visible"><option value="true" ${x.visible!==false?'selected':''}>Visible</option><option value="false" ${x.visible===false?'selected':''}>Hidden</option></select><input data-home="${i}" data-k="order" type="number" value="${x.order}"></div>`).join('')}</section>`;
  bind();drawSitePreview()
 }

 function drawSitePreview(){
   const s=state.data, nav=[...s.navigation].filter(x=>x.visible!==false).sort((a,b)=>(a.order||0)-(b.order||0));
   const target=document.getElementById('siteChromePreview');if(!target)return;
   const leftSrc=state.previewAssets.leftLogo||`../${s.branding.leftLogo}`;
   const rightSrc=state.previewAssets.rightLogo||`../${s.branding.rightLogo}`;
   const titleSrc=state.previewAssets.navigationTitle||`../${s.branding.navigationTitle}`;
   target.innerHTML=`<div class="chrome-preview-header"><img src="${esc(leftSrc)}"><img class="chrome-preview-navigation-title" src="${esc(titleSrc)}" alt="${esc(s.branding.teamName||'Allstar Galaxy')}"><img src="${esc(rightSrc)}"></div><div class="chrome-preview-nav">${nav.map(n=>`<span>${esc(n.label)}</span>`).join('')}</div><div class="chrome-preview-page">PAGE CONTENT PREVIEW</div><div class="chrome-preview-footer chrome-preview-footer-v139">
     <div class="chrome-preview-footer-left"><span>${esc(s.footer.copyright||'')}</span><b>AG</b></div>
     <div class="chrome-preview-footer-center">
       <span>SOCIAL MEDIA ICONS</span>
       <small>${s.footer.showAboutLink!==false?esc(s.footer.aboutLabel||'About')+' • ':''}${s.footer.showPlatformVersion!==false?`${esc(s.footer.platformName||'Allstar Galaxy Platform')} ${esc(s.footer.platformVersion||'v1.0')} (Build ${esc(s.footer.platformBuild||'139')})`:''}${s.footer.showAdminLink!==false?' • '+esc(s.footer.adminLabel||'Admin'):''}</small>
     </div>
     <div class="chrome-preview-footer-right"><b>AG</b><span>${s.footer.showXitlaliCredit!==false?esc(s.footer.xitlaliCreditText||'Designed and Developed by Xitlali Media'):''}</span></div>
   </div>`;
   target.style.setProperty('--preview-accent',s.branding.accentColor||'#ffd700');
 }
 function bind(){
  $('#teamName').oninput=e=>{state.data.branding.teamName=e.target.value;mark();drawSitePreview()};$('#accent').oninput=e=>{state.data.branding.accentColor=e.target.value;mark();drawSitePreview()};
  document.querySelectorAll('[data-nav]').forEach(e=>e.onchange=()=>{let v=e.value;if(e.dataset.k==='visible')v=v==='true';if(e.dataset.k==='order')v=Number(v);state.data.navigation[+e.dataset.nav][e.dataset.k]=v;mark();drawSitePreview()});
  document.querySelectorAll('[data-page]').forEach(e=>e.onchange=()=>{let v=e.value;if(e.dataset.k==='visible')v=v==='true';state.data.pages[e.dataset.page][e.dataset.k]=v;mark();drawSitePreview()});
  document.querySelectorAll('[data-social]').forEach(e=>e.oninput=()=>{state.data.social[e.dataset.social]=e.value;mark();drawSitePreview()});
  $('#copyright').oninput=e=>{state.data.footer.copyright=e.target.value;mark();drawSitePreview()};
  $('#showAbout').onchange=e=>{state.data.footer.showAboutLink=e.target.value==='true';mark();drawSitePreview()};
  $('#aboutLabel').oninput=e=>{state.data.footer.aboutLabel=e.target.value;mark();drawSitePreview()};
  $('#showAdmin').onchange=e=>{state.data.footer.showAdminLink=e.target.value==='true';mark();drawSitePreview()};
  $('#adminLabel').oninput=e=>{state.data.footer.adminLabel=e.target.value;mark();drawSitePreview()};
  $('#showPlatformVersion').onchange=e=>{state.data.footer.showPlatformVersion=e.target.value==='true';mark();drawSitePreview()};
  $('#platformName').oninput=e=>{state.data.footer.platformName=e.target.value;mark();drawSitePreview()};
  $('#platformVersion').oninput=e=>{state.data.footer.platformVersion=e.target.value;mark();drawSitePreview()};
  $('#platformBuild').oninput=e=>{state.data.footer.platformBuild=e.target.value;mark();drawSitePreview()};
  $('#showXitlaliCredit').onchange=e=>{state.data.footer.showXitlaliCredit=e.target.value==='true';mark();drawSitePreview()};
  $('#xitlaliCreditText').oninput=e=>{state.data.footer.xitlaliCreditText=e.target.value;mark();drawSitePreview()};
  $('#xitlaliUrl').oninput=e=>{state.data.footer.xitlaliUrl=e.target.value;mark();drawSitePreview()};
  $('#xitlaliLogoUpload').onchange=async e=>{
    if(!e.target.files[0])return;
    const path='images/managed/xitlali-media-logo.png';
    const file=e.target.files[0];
    state.pending=state.pending.filter(item=>item.path!==path);
    state.pending.push({path,base64:await png(file)});
    state.data.footer.xitlaliLogo=path;
    state.previewAssets.xitlaliLogo=await new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onload=()=>resolve(reader.result);
      reader.onerror=reject;
      reader.readAsDataURL(file);
    });
    $('#xitlaliLogoPath').value=path;
    mark();drawSitePreview();status('Xitlali Media logo ready to publish and preview.','ok')
  };
  document.querySelectorAll('[data-home]').forEach(e=>e.onchange=()=>{let v=e.value;if(e.dataset.k==='visible')v=v==='true';if(e.dataset.k==='order')v=Number(v);state.data.homeSections[+e.dataset.home][e.dataset.k]=v;mark();drawSitePreview()});
  document.querySelectorAll('[data-upload]').forEach(e=>e.onchange=async()=>{
    if(!e.files[0])return;
    const key=e.dataset.upload,path=`images/managed/${key}.png`;
    const file=e.files[0];
    const base64=await png(file);
    state.pending=state.pending.filter(item=>item.path!==path);
    state.pending.push({path,base64});
    state.data.branding[key]=path;
    state.previewAssets[key]=await new Promise((resolve,reject)=>{
      const reader=new FileReader();
      reader.onload=()=>resolve(reader.result);
      reader.onerror=reject;
      reader.readAsDataURL(file);
    });
    mark();drawSitePreview();status(`${key} ready to publish and visible in Preview Draft.`,'ok')
  });
  const buildSiteDraft=()=>{
    const draft=structuredClone(state.data);
    draft.branding={...draft.branding};
    for(const [key,value] of Object.entries(state.previewAssets)){
      if(value)draft.branding[key]=value;
    }
    if(state.previewAssets.xitlaliLogo){
      draft.footer={...draft.footer,xitlaliLogo:state.previewAssets.xitlaliLogo};
    }
    return draft;
  };
  const saveSiteDraft=()=>{
    sessionStorage.setItem('asgDraftSiteSettings',JSON.stringify(state.data));
    sessionStorage.setItem('asgPreviewSiteSettings',JSON.stringify(buildSiteDraft()));
    status('Draft saved — not published.','ok');
    $('#pendingLabel').textContent='Draft saved — not published';
  };
  $('#saveSiteSettings').onclick=saveSiteDraft;
  $('#preview').onclick=()=>{
    saveSiteDraft();
    window.open('../index.html?adminPreview=1','_blank')
  };
  $('#publish').onclick=async()=>{saveSiteDraft();await publish();sessionStorage.removeItem('asgDraftSiteSettings')};
  $('#cancelSiteSettings').onclick=()=>{
    if((state.dirty||state.pending.length)&&!confirm('Discard all unpublished Site Settings changes and return to the Dashboard?'))return;
    sessionStorage.removeItem('asgDraftSiteSettings');
    sessionStorage.removeItem('asgPreviewSiteSettings');
    location.href='dashboard.html'
  }
 }
 async function publish(){
  status('Creating backup and publishing site settings…');
  try{await window.ASGBackup?.create('Before Site Settings publish');for(const f of state.pending){let sha;try{sha=(await get(f.path)).sha}catch(e){}await put(f.path,f.base64,`Site Manager: ${f.path}`,sha)}const latest=await get(CFG.path),r=await put(CFG.path,enc(JSON.stringify(state.data,null,2)),'Site Manager: update site settings',latest.sha);state.sha=r.content.sha;state.pending=[];state.previewAssets={};state.dirty=false;status('Site settings published.','ok');render()}catch(e){status('Publish failed: '+e.message,'bad')}
 }
 async function init(){if(!token()){location.href='index.html';return}try{const f=await get(CFG.path);state.sha=f.sha;state.data=JSON.parse(dec(f.content));status('Site Manager connected.','ok');render()}catch(e){status('Could not load settings: '+e.message,'bad')}}
 document.addEventListener('DOMContentLoaded',()=>{$('#menuBtn').onclick=()=>document.querySelector('.admin-sidebar').classList.toggle('open');$('#logoutBtn').onclick=()=>{sessionStorage.removeItem('asgGithubToken');location.href='index.html'};init()})
})();
