
const CONFIG={owner:'nepdogg',repo:'allstargalaxysoccer',branch:'main',dataPath:'data/master-content.json'};
const POSITION_OPTIONS=['','GK','CB','LB','RB','CDM','CM','CAM','LW','RW','ST','CF','COACH','STAFF'];
const SECTION_SCHEMAS={
 players:{title:'Players',array:'players',imageField:'photo',imageFolder:'images/team/players',fields:[['name','Player name','text',true,'basic'],['number','Jersey number','text',false,'basic'],['position','Position','select',POSITION_OPTIONS,'basic'],['status','Show on website','select',['published','hidden'],'basic'],['order','Carousel position','number',false,'advanced'],['photo','Player photo storage path','locked',false,'developer']]},
 games:{title:'Games',array:'games',imageField:'cardImage',imageFolder:'images/media/latest-games',fields:[['season','Season','seasonselect',true,'basic'],['gameNumber','Game number','number',true,'basic'],['opponent','Opponent team','text',true,'basic'],['result','Final result, e.g. W (3-1)','text',false,'basic'],['fullMatch','Full Match YouTube URL','url',false,'basic'],['highlights','Highlights YouTube URL','url',false,'basic'],['slideshow','Slideshow YouTube URL','url',false,'basic'],['status','Show on website','select',['published','hidden'],'basic'],['date','Match date','date',false,'advanced'],['time','Match time','time',false,'advanced'],['location','Location','text',false,'advanced'],['group','Game carousel','select',['latest','archive'],'advanced'],['order','Carousel position','number',false,'advanced'],['cardImage','Custom card image path','locked',false,'developer']]},
 seasons:{title:'Seasons',array:'seasons',imageField:'cardImage',imageFolder:'images/seasons',fields:[['title','Season name','text',true,'basic'],['fullMatches','Full Matches playlist URL','url',false,'basic'],['highlights','Highlights playlist URL','url',false,'basic'],['slideshows','Slideshows playlist URL','url',false,'basic'],['status','Show on website','select',['published','hidden'],'basic'],['subtitle','Optional subtitle','text',false,'advanced'],['dateRange','Date range','text',false,'advanced'],['league','League','text',false,'advanced'],['order','Carousel position','number',false,'advanced'],['cardImage','Custom card image path','locked',false,'developer']]},
 playlists:{title:'Playlists',array:'playlists',imageField:'cardImage',imageFolder:'images/media/playlists',fields:[['title','Playlist name','text',true,'basic'],['url','YouTube playlist URL','url',false,'basic'],['category','Playlist type','select',['core','archive','shorts','best','goals','saves','assists','plays'],'basic'],['locations','Show in these carousels','locationselect',false,'basic'],['status','Show on website','select',['published','hidden'],'basic'],['description','Optional description','textarea',false,'advanced'],['order','Carousel position','number',false,'advanced'],['cardImage','Custom card image path','locked',false,'developer']]},
 news:{title:'News',array:'news',imageField:'image',imageFolder:'images/news',fields:[['title','Headline','text',true,'basic'],['summary','Description','textarea',false,'basic'],['category','News type','select',['NEWS','MATCH','ANNOUNCEMENT','RESULT','TEAM UPDATE'],'basic'],['link','Optional related URL','url',false,'basic'],['status','Show on website','select',['published','hidden','placeholder'],'basic'],['date','Date','date',false,'advanced'],['order','Display position','number',false,'advanced'],['image','News image storage path','locked',false,'developer']]}
};
let state={data:null,sha:null,dirty:false,section:null,editIndex:-1,pendingFiles:[]};
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function token(){return sessionStorage.getItem('asgGithubToken')||''} function authHeaders(){return {'Accept':'application/vnd.github+json','Authorization':`Bearer ${token()}`,'X-GitHub-Api-Version':'2022-11-28'}}
function setStatus(msg,type=''){const el=$('#statusbar');if(el){el.textContent=msg;el.className='statusbar '+type}}
async function ghGet(path){const r=await fetch(`https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${path}?ref=${CONFIG.branch}`,{headers:authHeaders()});if(!r.ok)throw new Error(`${r.status}: ${await r.text()}`);return r.json()}
async function ghPut(path,content,message,sha){const body={message,content,branch:CONFIG.branch};if(sha)body.sha=sha;const r=await fetch(`https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${path}`,{method:'PUT',headers:{...authHeaders(),'Content-Type':'application/json'},body:JSON.stringify(body)});if(!r.ok)throw new Error(`${r.status}: ${await r.text()}`);return r.json()}
function decode64(s){return decodeURIComponent(escape(atob(s.replace(/\n/g,''))))} function encode64(s){return btoa(unescape(encodeURIComponent(s)))}
async function connect(){if(!token()){location.href='index.html';return}setStatus('Connecting to GitHub…');try{const f=await ghGet(CONFIG.dataPath);state.sha=f.sha;state.data=JSON.parse(decode64(f.content));setStatus(`Connected to ${CONFIG.owner}/${CONFIG.repo} • master-content.json loaded • Admin Dashboard V2`,'ok');renderPage()}catch(e){setStatus('Connection failed: '+e.message,'bad')}}
function slug(s){return String(s||'item').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'item'}
function nextId(arr,prefix){let n=1;const ids=new Set(arr.map(x=>x.id));while(ids.has(`${prefix}-${String(n).padStart(2,'0')}`))n++;return `${prefix}-${String(n).padStart(2,'0')}`}
function markDirty(){state.dirty=true;const p=$('#pendingLabel');if(p)p.textContent='Unpublished changes';}
function titleFor(x,s){return x.name||x.title||(s==='games'?`${x.season||''} Game ${x.gameNumber||''}`:x.id)}
function subFor(x,s){if(s==='players')return `#${x.number||'—'} • ${x.position||'Position not set'}`;if(s==='games')return `${x.opponent||'Opponent'} • ${x.result||'No result'} • ${x.status}`;if(s==='playlists')return `${x.category||''} • ${(x.locations||[]).join?.(', ')||x.locations||''}`;return `${x.status||''} • Order ${x.order??''}`}
function renderManager(section){state.section=section;const schema=SECTION_SCHEMAS[section],arr=state.data[schema.array]||[];$('#pageTitle').textContent=schema.title;$('#content').innerHTML=`<div class="v2-banner"><strong>Simple Mode</strong><span>Safe everyday fields are shown first. Advanced and technical settings are protected.</span></div><div class="admin-actions manager-actions"><button class="btn primary" id="addBtn">Add ${schema.title.replace(/s$/,'')}</button><button class="btn" id="publishBtn">Publish All Changes</button><button class="btn" id="previewBtn">Preview Draft</button><span class="pending" id="pendingLabel">${state.dirty?'Unpublished changes':''}</span></div><div class="item-list">${arr.map((x,i)=>`<div class="item-row ${x.status==='hidden'?'is-hidden':''}"><div><div class="item-title">${esc(titleFor(x,section))}</div><div class="item-sub">${esc(subFor(x,section))}</div></div><div class="row-actions"><button class="btn small" data-edit="${i}">Edit</button><button class="btn small" data-toggle="${i}">${x.status==='hidden'?'Restore':'Hide'}</button><button class="btn small danger" data-delete="${i}">Delete</button></div></div>`).join('')}</div>`;$('#addBtn').onclick=()=>openForm(-1);$('#publishBtn').onclick=publish;$('#previewBtn').onclick=()=>{sessionStorage.setItem('asgPreviewMasterContent',JSON.stringify(state.data));window.open('../index.html?adminPreview=1','_blank')};$$('[data-edit]').forEach(b=>b.onclick=()=>openForm(+b.dataset.edit));$$('[data-toggle]').forEach(b=>b.onclick=()=>{const x=arr[+b.dataset.toggle];x.status=x.status==='hidden'?'published':'hidden';markDirty();renderManager(section)});$$('[data-delete]').forEach(b=>b.onclick=()=>{const i=+b.dataset.delete;if(confirm('Permanently delete this item? Hide is safer.')){arr.splice(i,1);markDirty();renderManager(section)}})}
function playlistLocationValue(val){const a=Array.isArray(val)?val:String(val||'').split(',').map(x=>x.trim()).filter(Boolean);const has=x=>a.includes(x);if(has('home-best')&&has('media-archive'))return 'best-and-archive';if(has('home-best'))return 'home-best';if(has('season-archive')&&has('latest-season-playlists'))return 'season-and-latest';if(has('latest-season-playlists'))return 'latest-season-playlists';if(has('season-archive'))return 'season-archive';return 'media-archive'}
function playlistLocationsFromValue(val){const map={'media-archive':['media-archive'],'home-best':['home-best'],'best-and-archive':['home-best','media-archive'],'season-archive':['season-archive'],'latest-season-playlists':['latest-season-playlists'],'season-and-latest':['season-archive','latest-season-playlists']};return map[val]||['media-archive']}
function friendlyOption(v){const m={published:'Visible',hidden:'Hidden',placeholder:'Placeholder',latest:'Latest Games',archive:'Archive / older games',core:'Full Matches / Highlights / Slideshows',best:'Best Of',goals:'Goals',saves:'Saves',assists:'Assists',plays:'Plays',shorts:'Shorts'};return m[v]||v||'Not assigned / N/A'}
function inputHtml(field,val){const [key,label,type,rule]=field;const required=rule===true?'required':'';if(type==='locked')return `<div class="field locked-field"><label>${label} 🔒</label><input value="${esc(val||'Automatically generated')}" readonly><div class="help">Protected technical field. The dashboard manages this automatically.</div></div>`;if(type==='seasonselect'){const seasons=(state.data.seasons||[]).filter(x=>x.status!=='hidden').map(x=>x.title).filter(Boolean);if(val&&!seasons.includes(val))seasons.unshift(val);return `<div class="field"><label>${label}</label><select name="${key}" ${required}><option value="">Select season / N/A</option>${seasons.map(o=>`<option ${String(val)===o?'selected':''}>${esc(o)}</option>`).join('')}</select></div>`}if(type==='select'){const opts=rule.map(o=>`<option value="${esc(o)}" ${String(val)===o?'selected':''}>${esc(friendlyOption(o))}</option>`).join('');return `<div class="field"><label>${label}</label><select name="${key}">${opts}</select></div>`}if(type==='locationselect'){const current=playlistLocationValue(val);const options=[['media-archive','Media Archive only'],['home-best','Homepage Best Of only'],['best-and-archive','Homepage Best Of + Media Archive'],['season-archive','Season Archive only'],['latest-season-playlists','Latest Season Playlists only'],['season-and-latest','Season Archive + Latest Season Playlists']];return `<div class="field"><label>${label}</label><select name="${key}">${options.map(([v,t])=>`<option value="${v}" ${current===v?'selected':''}>${t}</option>`).join('')}</select><div class="help">Choose exactly where this playlist card should appear.</div></div>`}if(type==='textarea')return `<div class="field full"><label>${label}</label><textarea name="${key}" placeholder="N/A">${esc(val||'')}</textarea></div>`;return `<div class="field"><label>${label}</label><input name="${key}" type="${type}" value="${esc(val??'')}" ${required} placeholder="${type==='url'?'Not available yet':'N/A'}"></div>`}
function safeImagePath(schema,form,item,uploadFile){const pathInput=form.querySelector(`[name="${schema.imageField}"]`);let requested=String(pathInput?.value||'').trim().replace(/^\/+/, '');let fileName='';if(requested){fileName=requested.split('/').pop().replace(/\.[^.]+$/,'')+'.png'}else if(uploadFile?.name){const originalBase=uploadFile.name.replace(/\.[^.]+$/,'');fileName=`${slug(originalBase)}.png`}else if(item?.[schema.imageField]){fileName=String(item[schema.imageField]).split('/').pop().replace(/\.[^.]+$/,'')+'.png'}else{const name=form.querySelector('[name="name"]')?.value||form.querySelector('[name="title"]')?.value||form.querySelector('[name="id"]')?.value||item.id;fileName=`${slug(name)}.png`}return `${schema.imageFolder}/${fileName}`}
function openForm(index){const schema=SECTION_SCHEMAS[state.section],arr=state.data[schema.array],item=index>=0?structuredClone(arr[index]):{status:'published',order:arr.length+1};let uploadedPath='';state.editIndex=index;if(index<0)item.id=nextId(arr,state.section.replace(/s$/,''));$('#modalTitle').textContent=(index>=0?'Edit ':'Add ')+schema.title.replace(/s$/,'');const basic=schema.fields.filter(f=>(f[4]||'basic')==='basic').map(f=>inputHtml(f,item[f[0]])).join('');const advanced=schema.fields.filter(f=>f[4]==='advanced').map(f=>inputHtml(f,item[f[0]])).join('');const developer=schema.fields.filter(f=>f[4]==='developer').map(f=>inputHtml(f,item[f[0]])).join('');$('#editForm').innerHTML=`<div class="form-section"><h4>Basic Settings</h4><div class="form-grid">${basic}</div></div><div class="field full upload-field"><label>${state.section==='players'?'Upload player photo':state.section==='news'?'Upload news flyer':'Upload optional PNG image'}</label><input id="imageUpload" type="file" accept="image/png,image/jpeg,image/webp"><div class="help">The dashboard converts the file to PNG and creates the correct storage path automatically.</div><img id="imagePreview" class="upload-preview" ${item[schema.imageField]?`src="../${esc(item[schema.imageField])}"`:'hidden'}></div><details class="advanced-box"><summary>Advanced Settings</summary><div class="form-grid">${advanced||'<p class="help">No advanced settings.</p>'}</div></details><details class="developer-box"><summary>Technical Information (read only)</summary><div class="form-grid"><div class="field locked-field"><label>Internal ID 🔒</label><input value="${esc(item.id)}" readonly></div>${developer}</div></details><div class="admin-actions form-actions"><button class="btn primary" type="submit">Save Form</button><button class="btn" type="button" id="cancelForm">Cancel</button></div>`;const form=$('#editForm');form.onsubmit=e=>{e.preventDefault();const fd=new FormData(e.target),obj={...item,id:item.id};for(const [k,v] of fd.entries())obj[k]=['order','gameNumber'].includes(k)&&v!==''?Number(v):v;if(uploadedPath)obj[schema.imageField]=uploadedPath;if(state.section==='playlists')obj.locations=playlistLocationsFromValue(obj.locations);if(index>=0)arr[index]=obj;else arr.push(obj);markDirty();closeModal();renderManager(state.section)};$('#cancelForm').onclick=closeModal;const up=$('#imageUpload');up.onchange=async()=>{if(!up.files[0])return;const result=await fileToPng(up.files[0]);uploadedPath=safeImagePath(schema,form,item,up.files[0]);state.pendingFiles=state.pendingFiles.filter(f=>f.path!==uploadedPath);state.pendingFiles.push({path:uploadedPath,base64:result.base64});$('#imagePreview').src=result.url;$('#imagePreview').hidden=false;setStatus(`${uploadedPath} ready to publish.`,'ok')};$('#editModal').classList.add('open')}
function closeModal(){$('#editModal').classList.remove('open')}
async function fileToPng(file){const bmp=await createImageBitmap(file),canvas=document.createElement('canvas');canvas.width=bmp.width;canvas.height=bmp.height;canvas.getContext('2d').drawImage(bmp,0,0);const blob=await new Promise(r=>canvas.toBlob(r,'image/png',.92));const url=URL.createObjectURL(blob),buf=await blob.arrayBuffer(),bytes=new Uint8Array(buf);let binary='';for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return {url,base64:btoa(binary)}}
async function publish(){
 if(!state.data)return;
 setStatus('Creating backup and publishing images and website data…');
 try{
  await window.ASGBackup?.create('Before content publish');
  for(const file of state.pendingFiles){
   let sha;
   try{sha=(await ghGet(file.path)).sha}catch(e){}
   await ghPut(file.path,file.base64,`Admin: update ${file.path}`,sha)
  }
  state.data.version=Number(state.data.version||0)+1;
  state.data.updated=new Date().toISOString().slice(0,10);
  const encoded=encode64(JSON.stringify(state.data,null,2));
  // Always request the newest file SHA immediately before publishing. This
  // prevents GitHub 409 conflicts when another admin tab or a recent update
  // changed master-content.json after this page was opened.
  let latest=await ghGet(CONFIG.dataPath);
  let r;
  try{
   r=await ghPut(CONFIG.dataPath,encoded,'Admin: publish website content update',latest.sha)
  }catch(firstError){
   if(!String(firstError.message).startsWith('409:'))throw firstError;
   // One automatic retry handles a change that happened between GET and PUT.
   latest=await ghGet(CONFIG.dataPath);
   r=await ghPut(CONFIG.dataPath,encoded,'Admin: publish website content update (automatic retry)',latest.sha)
  }
  state.sha=r.content.sha;
  state.pendingFiles=[];
  state.dirty=false;
  setStatus('Published successfully. GitHub Pages will update shortly.','ok');
  renderPage()
 }catch(e){
  setStatus('Publish failed: '+e.message,'bad')
 }
}
function queueAssetUpload(inp){if(!inp.files[0])return Promise.resolve();return fileToPng(inp.files[0]).then(r=>{const path=inp.dataset.assetPath,key=inp.dataset.assetKey;state.data.assets=state.data.assets||{};state.data.assets[key]=path;state.pendingFiles=state.pendingFiles.filter(f=>f.path!==path);state.pendingFiles.push({path,base64:r.base64});markDirty();setStatus(`${key} ready to publish.`,'ok')})}
function assetField(key,label,path,current){return `<div class="field"><label>${label}</label><input data-asset-path="${path}" data-asset-key="${key}" type="file" accept="image/png,image/jpeg,image/webp"><div class="help">Current file: ${esc(current||path)} 🔒</div></div>`}
function renderScheduleAssets(){const a=state.data.assets||{},d=state.data.display||{};$('#pageTitle').textContent='Schedule & Standings';$('#content').innerHTML=`<div class="panel"><h3>Schedule and standings images</h3><p class="help">Upload replacement PNG files for the public Schedule page. These controls are separate from the global website graphics.</p><div class="form-grid">${assetField('scheduleImage','Upload Match Schedule PNG','images/schedule/schedule.png',a.scheduleImage)}${assetField('standingsImage','Upload League Standings PNG','images/schedule/standings.png',a.standingsImage)}<div class="field"><label>Schedule visibility</label><select id="scheduleVisible"><option value="true" ${d.scheduleVisible!==false?'selected':''}>Visible</option><option value="false" ${d.scheduleVisible===false?'selected':''}>Hidden</option></select></div><div class="field"><label>Standings visibility</label><select id="standingsVisible"><option value="true" ${d.standingsVisible!==false?'selected':''}>Visible</option><option value="false" ${d.standingsVisible===false?'selected':''}>Hidden</option></select></div></div><div class="admin-actions" style="margin-top:18px"><button class="btn primary" id="publishSchedule">Publish Schedule & Standings</button></div></div>`;$$('[data-asset-key]').forEach(inp=>inp.onchange=()=>queueAssetUpload(inp));$('#scheduleVisible').onchange=e=>{state.data.display=state.data.display||{};state.data.display.scheduleVisible=e.target.value==='true';markDirty()};$('#standingsVisible').onchange=e=>{state.data.display=state.data.display||{};state.data.display.standingsVisible=e.target.value==='true';markDirty()};$('#publishSchedule').onclick=publish}
function renderAssets(){const a=state.data.assets||{};$('#pageTitle').textContent='Website Graphics';$('#content').innerHTML=`<div class="panel"><h3>Global website graphics</h3><p class="help">Manage reusable default artwork. Schedule and standings are managed on their own page.</p><div class="form-grid">${assetField('mediaBackground','Default media-card background','generated/media-card-background.png',a.mediaBackground)}${assetField('playerSilhouette','Default player silhouette','images/team/players/player-silhouette.png',a.playerSilhouette)}${assetField('liveDefaultImage','Default livestream image','images/live/live-default.png',a.liveDefaultImage)}</div><div class="admin-actions" style="margin-top:18px"><button class="btn primary" id="publishAssets">Publish Website Graphics</button></div></div>`;$$('[data-asset-key]').forEach(inp=>inp.onchange=()=>queueAssetUpload(inp));$('#publishAssets').onclick=publish}
function renderLive(){const l=state.data.live||{};$('#pageTitle').textContent='Livestream';$('#content').innerHTML=`<form class="panel" id="liveForm"><div class="form-grid">${[['title','Stream title','text'],['opponent','Opponent','text'],['scheduledStart','Scheduled start','datetime-local'],['scheduledEnd','Expected end','datetime-local'],['location','Location','text'],['url','YouTube livestream URL','url'],['replayUrl','Replay URL','url'],['thumbnail','Thumbnail path','text']].map(f=>inputHtml(f,l[f[0]])).join('')}<div class="field"><label>Control mode</label><select name="mode"><option ${l.mode==='automatic'?'selected':''}>automatic</option><option ${l.mode==='manual'?'selected':''}>manual</option></select></div><div class="field"><label>Manual status</label><select name="status">${['offline','scheduled','live','ended','replay'].map(x=>`<option ${l.status===x?'selected':''}>${x}</option>`).join('')}</select></div><div class="field full"><label>Description</label><textarea name="description">${esc(l.description||'')}</textarea></div><div class="field full"><label>Upload livestream thumbnail</label><input id="liveUpload" type="file" accept="image/png,image/jpeg,image/webp"></div></div><div class="admin-actions" style="margin-top:18px"><button class="btn primary" type="submit">Save Livestream</button><button class="btn" type="button" id="publishLive">Publish</button></div></form>`;$('#liveForm').onsubmit=e=>{e.preventDefault();const fd=new FormData(e.target);Object.assign(state.data.live,Object.fromEntries(fd.entries()));markDirty();setStatus('Livestream settings saved locally. Publish when ready.','ok')};$('#liveUpload').onchange=async e=>{if(!e.target.files[0])return;const r=await fileToPng(e.target.files[0]),path='images/live/current-livestream.png';state.data.live.thumbnail=path;state.pendingFiles=state.pendingFiles.filter(f=>f.path!==path);state.pendingFiles.push({path,base64:r.base64});markDirty()};$('#publishLive').onclick=publish}
function renderDashboard(){const counts=Object.entries(SECTION_SCHEMAS).map(([k,s])=>[k,s.title,(state.data[s.array]||[]).filter(x=>x.status!=='hidden').length]);$('#pageTitle').textContent='Dashboard V2';$('#content').innerHTML=`<div class="v2-hero"><span class="v2-pill">ADMIN V2</span><h3>Fast, guided website updates</h3><p>Technical fields are protected and common choices use dropdowns.</p></div><div class="dashboard-grid">${counts.map(([k,t,n])=>`<a class="dash-card" href="${k}.html"><strong>${t}</strong><span>${n} visible items</span></a>`).join('')}<a class="dash-card" href="schedule.html"><strong>Schedule & Standings</strong><span>Upload replacement PNG files</span></a><a class="dash-card" href="livestream.html"><strong>Livestream</strong><span>Schedule, status and replay</span></a><a class="dash-card" href="graphics.html"><strong>Website Graphics</strong><span>Default backgrounds and silhouettes</span></a><a class="dash-card" href="heroes.html"><strong>Hero Images</strong><span>Photos, effects and timing</span></a><a class="dash-card" href="settings.html"><strong>Site Settings</strong><span>Text, navigation, social, footer and branding</span></a><a class="dash-card" href="backups.html"><strong>Backup & Restore</strong><span>Automatic backups and update history</span></a></div>`}
function renderPage(){const page=document.body.dataset.page||'dashboard';$$('.admin-nav a').forEach(a=>a.classList.toggle('active',a.dataset.page===page));if(SECTION_SCHEMAS[page])renderManager(page);else if(page==='schedule')renderScheduleAssets();else if(page==='graphics')renderAssets();else if(page==='livestream')renderLive();else renderDashboard()}
function initCommon(){$('#menuBtn')?.addEventListener('click',()=>$('.admin-sidebar').classList.toggle('open'));$('#logoutBtn')?.addEventListener('click',()=>{sessionStorage.removeItem('asgGithubToken');location.href='index.html'});$('#modalClose')?.addEventListener('click',closeModal);connect()}
window.AdminCMS={initCommon,publish};


/* ============================================================
   V135 — VISUAL CARD EDITOR
   Adds a live, responsive preview to Players, Games, Seasons,
   Playlists and News, plus Schedule, Livestream and Graphics.
   ============================================================ */
(() => {
  const originalOpenForm = openForm;

  const previewEsc = v => esc(v || '');
  const previewImage = (path, fallback='') => {
    if (!path) return fallback;
    if (/^(blob:|data:|https?:)/i.test(path)) return path;
    return '../' + String(path).replace(/^\/+/, '');
  };
  const visibleLabel = status => status === 'hidden' ? 'HIDDEN' : 'VISIBLE';
  const linkState = value => String(value || '').trim() ? '' : ' is-disabled';

  function currentFormValues(form, item) {
    const obj = {...item};
    new FormData(form).forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  }

  function playerPreview(obj, image) {
    return `<div class="visual-card player-preview-card ${obj.status==='hidden'?'preview-hidden':''}">
      <div class="preview-player-frame">
        <img class="preview-player-logo" src="../images/logos/logo.png" alt="">
        <img class="preview-player-photo" src="${previewEsc(image || '../images/team/players/player-silhouette.png')}" alt="">
      </div>
      <div class="preview-player-copy">
        <span class="preview-number">#${previewEsc(obj.number || 'N/A')}</span>
        <strong>${previewEsc(obj.name || 'PLAYER NAME')}</strong>
        <small>${previewEsc(obj.position || 'POSITION N/A')}</small>
      </div>
      <span class="preview-visibility">${visibleLabel(obj.status)}</span>
    </div>`;
  }

  function gamePreview(obj, image) {
    return `<div class="visual-card wide-preview-card game-preview-card ${obj.status==='hidden'?'preview-hidden':''}">
      <div class="preview-media-main" style="background-image:url('${previewEsc(image || '../generated/media-card-background.png')}')"></div>
      <div class="preview-actions">
        <div class="preview-action${linkState(obj.fullMatch)}">▶<span>FULL MATCH</span></div>
        <div class="preview-action${linkState(obj.highlights)}">★<span>HIGHLIGHTS</span></div>
        <div class="preview-action${linkState(obj.slideshow)}">▣<span>SLIDESHOW</span></div>
      </div>
      <div class="preview-game-footer">
        <div><small>${previewEsc(obj.season || 'SEASON N/A')}</small><strong>GAME ${previewEsc(obj.gameNumber || 'N/A')}</strong></div>
        <div><strong>ALLSTAR GALAXY</strong><small>VS ${previewEsc(obj.opponent || 'OPPONENT')}</small></div>
        <div><strong>${previewEsc(obj.result || 'NOT PLAYED')}</strong></div>
      </div>
      <span class="preview-visibility">${visibleLabel(obj.status)}</span>
    </div>`;
  }

  function seasonPreview(obj, image) {
    return `<div class="visual-card wide-preview-card season-preview-card ${obj.status==='hidden'?'preview-hidden':''}">
      <div class="preview-media-main" style="background-image:url('${previewEsc(image || '../generated/media-card-background.png')}')"></div>
      <div class="preview-actions">
        <div class="preview-action${linkState(obj.fullMatches)}">▶<span>FULL MATCHES</span></div>
        <div class="preview-action${linkState(obj.highlights)}">★<span>HIGHLIGHTS</span></div>
        <div class="preview-action${linkState(obj.slideshows)}">▣<span>SLIDESHOWS</span></div>
      </div>
      <div class="preview-season-footer"><strong>${previewEsc(obj.title || 'SEASON NAME')}</strong><small>${previewEsc(obj.subtitle || obj.dateRange || 'SEASON ARCHIVE')}</small></div>
      <span class="preview-visibility">${visibleLabel(obj.status)}</span>
    </div>`;
  }

  function playlistIcon(category) {
    return ({goals:'⚽',saves:'🧤',assists:'✦',plays:'★',shorts:'▶',best:'★',archive:'▣',core:'▶'})[category] || '▶';
  }

  function playlistPreview(obj, image) {
    return `<div class="visual-card playlist-preview-card ${obj.status==='hidden'?'preview-hidden':''}">
      <div class="preview-playlist-image" style="background-image:url('${previewEsc(image || '../generated/media-card-background.png')}')"></div>
      <div class="preview-playlist-footer"><span>${playlistIcon(obj.category)}</span><strong>${previewEsc(obj.title || 'PLAYLIST NAME')}</strong></div>
      <div class="preview-location">${previewEsc(friendlyOption(obj.category))} • ${previewEsc(playlistLocationValue(obj.locations).replaceAll('-',' '))}</div>
      <span class="preview-visibility">${visibleLabel(obj.status)}</span>
    </div>`;
  }

  function newsPreview(obj, image) {
    return `<div class="visual-card news-preview-card ${obj.status==='hidden'?'preview-hidden':''}">
      <div class="preview-news-image"><img src="${previewEsc(image || '../images/logos/logo.png')}" alt=""></div>
      <div class="preview-news-copy">
        <small>${previewEsc(obj.category || obj.date || 'NEWS')}</small>
        <strong>${previewEsc(obj.title || 'NEWS HEADLINE')}</strong>
        <p>${previewEsc(obj.summary || 'News description will appear here.')}</p>
        ${obj.link ? '<span class="preview-link">RELATED LINK ACTIVE</span>' : '<span class="preview-link is-disabled">NO RELATED LINK</span>'}
      </div>
      <span class="preview-visibility">${visibleLabel(obj.status)}</span>
    </div>`;
  }

  function renderVisualPreview(section, obj, image) {
    if (section === 'players') return playerPreview(obj, image);
    if (section === 'games') return gamePreview(obj, image);
    if (section === 'seasons') return seasonPreview(obj, image);
    if (section === 'playlists') return playlistPreview(obj, image);
    if (section === 'news') return newsPreview(obj, image);
    return '<div class="visual-card"><p>Preview unavailable.</p></div>';
  }

  openForm = function(index) {
    originalOpenForm(index);

    const schema = SECTION_SCHEMAS[state.section];
    const arr = state.data[schema.array];
    const item = index >= 0 ? structuredClone(arr[index]) : {
      id: nextId(arr, state.section.replace(/s$/,'')),
      status: 'published',
      order: arr.length + 1
    };
    const form = $('#editForm');
    if (!form) return;

    const existingPreview = form.querySelector('.visual-editor-layout');
    if (existingPreview) return;

    const currentChildren = [...form.children];
    const wrapper = document.createElement('div');
    wrapper.className = 'visual-editor-layout';
    const fieldsColumn = document.createElement('div');
    fieldsColumn.className = 'visual-editor-fields';
    const previewColumn = document.createElement('aside');
    previewColumn.className = 'visual-editor-preview';
    previewColumn.innerHTML = `<div class="preview-toolbar">
      <div><span class="v2-pill">LIVE PREVIEW</span><h4>Website Card</h4></div>
      <div class="preview-device-switch"><button type="button" class="is-active" data-device="desktop">Desktop</button><button type="button" data-device="mobile">Mobile</button></div>
    </div>
    <div id="liveCardPreview" class="live-card-preview"></div>
    <p class="help preview-help">This preview updates immediately. It does not publish until you save and click Publish All Changes.</p>`;

    currentChildren.forEach(child => fieldsColumn.appendChild(child));
    wrapper.append(fieldsColumn, previewColumn);
    form.appendChild(wrapper);

    let selectedImage = item[schema.imageField] ? previewImage(item[schema.imageField]) : '';
    const preview = $('#liveCardPreview');

    const refresh = () => {
      const obj = currentFormValues(form, item);
      preview.innerHTML = renderVisualPreview(state.section, obj, selectedImage);
    };

    form.addEventListener('input', refresh);
    form.addEventListener('change', refresh);

    previewColumn.querySelectorAll('[data-device]').forEach(btn => {
      btn.onclick = () => {
        previewColumn.querySelectorAll('[data-device]').forEach(x => x.classList.toggle('is-active', x === btn));
        preview.classList.toggle('mobile-preview', btn.dataset.device === 'mobile');
      };
    });

    const upload = $('#imageUpload');
    if (upload) {
      const priorHandler = upload.onchange;
      upload.onchange = async event => {
        if (priorHandler) await priorHandler.call(upload, event);
        const img = $('#imagePreview');
        if (img && img.src) selectedImage = img.src;
        refresh();
      };
    }

    refresh();
  };

  renderScheduleAssets = function() {
    const a=state.data.assets||{},d=state.data.display||{};
    $('#pageTitle').textContent='Schedule & Standings';
    $('#content').innerHTML=`<div class="v2-banner"><strong>Visual Schedule Editor</strong><span>Upload a graphic and see exactly how the public card will look.</span></div>
    <div class="visual-page-editor">
      <div class="panel">
        <div class="form-grid">${assetField('scheduleImage','Upload Match Schedule PNG','images/schedule/schedule.png',a.scheduleImage)}${assetField('standingsImage','Upload League Standings PNG','images/schedule/standings.png',a.standingsImage)}
        <div class="field"><label>Schedule visibility</label><select id="scheduleVisible"><option value="true" ${d.scheduleVisible!==false?'selected':''}>Visible</option><option value="false" ${d.scheduleVisible===false?'selected':''}>Hidden</option></select></div>
        <div class="field"><label>Standings visibility</label><select id="standingsVisible"><option value="true" ${d.standingsVisible!==false?'selected':''}>Visible</option><option value="false" ${d.standingsVisible===false?'selected':''}>Hidden</option></select></div></div>
        <div class="admin-actions form-actions"><button class="btn primary" id="publishSchedule">Publish Schedule & Standings</button></div>
      </div>
      <aside class="visual-editor-preview page-preview-column">
        <div class="preview-toolbar"><div><span class="v2-pill">LIVE PREVIEW</span><h4>Schedule Page Cards</h4></div></div>
        <div id="schedulePreview" class="stacked-card-preview"></div>
      </aside>
    </div>`;
    let scheduleSrc=previewImage(a.scheduleImage,'../images/schedule/schedule.png'), standingsSrc=previewImage(a.standingsImage,'../images/schedule/standings.png');
    const draw=()=>{$('#schedulePreview').innerHTML=`
      <div class="mini-news-card ${$('#scheduleVisible').value==='false'?'preview-hidden':''}"><img src="${scheduleSrc}"><div><small>CURRENT SCHEDULE</small><strong>Match Schedule</strong><p>Click the image to view the complete schedule.</p></div></div>
      <div class="mini-news-card ${$('#standingsVisible').value==='false'?'preview-hidden':''}"><img src="${standingsSrc}"><div><small>CURRENT STANDINGS</small><strong>League Standings</strong><p>Click the image to view the complete standings.</p></div></div>`};
    $$('[data-asset-key]').forEach(inp=>inp.onchange=async()=>{await queueAssetUpload(inp);const file=inp.files[0];if(file){const url=URL.createObjectURL(file);if(inp.dataset.assetKey==='scheduleImage')scheduleSrc=url;else standingsSrc=url;}draw()});
    $('#scheduleVisible').onchange=e=>{state.data.display=state.data.display||{};state.data.display.scheduleVisible=e.target.value==='true';markDirty();draw()};
    $('#standingsVisible').onchange=e=>{state.data.display=state.data.display||{};state.data.display.standingsVisible=e.target.value==='true';markDirty();draw()};
    $('#publishSchedule').onclick=publish;draw();
  };

  renderLive = function() {
    const l=state.data.live||{};
    $('#pageTitle').textContent='Livestream';
    $('#content').innerHTML=`<div class="v2-banner"><strong>Visual Livestream Editor</strong><span>Change the status and text while viewing the public Live card.</span></div>
    <div class="visual-page-editor"><form class="panel" id="liveForm"><div class="form-grid">${[['title','Stream title','text'],['opponent','Opponent','text'],['scheduledStart','Scheduled start','datetime-local'],['scheduledEnd','Expected end','datetime-local'],['location','Location','text'],['url','YouTube livestream URL','url'],['replayUrl','Replay URL','url'],['thumbnail','Thumbnail path','locked']].map(f=>inputHtml(f,l[f[0]])).join('')}
    <div class="field"><label>Control mode</label><select name="mode"><option ${l.mode==='automatic'?'selected':''}>automatic</option><option ${l.mode==='manual'?'selected':''}>manual</option></select></div>
    <div class="field"><label>Manual status</label><select name="status">${['offline','scheduled','live','ended','replay'].map(x=>`<option ${l.status===x?'selected':''}>${x}</option>`).join('')}</select></div>
    <div class="field full"><label>Description</label><textarea name="description">${esc(l.description||'')}</textarea></div><div class="field full"><label>Upload livestream thumbnail</label><input id="liveUpload" type="file" accept="image/png,image/jpeg,image/webp"></div></div>
    <div class="admin-actions form-actions"><button class="btn primary" type="submit">Save Livestream</button><button class="btn" type="button" id="publishLive">Publish</button></div></form>
    <aside class="visual-editor-preview page-preview-column"><div class="preview-toolbar"><div><span class="v2-pill">LIVE PREVIEW</span><h4>Live Page Card</h4></div></div><div id="livePreview"></div></aside></div>`;
    let thumb=previewImage(l.thumbnail,'../images/live/live-default.png');
    const draw=()=>{const fd=new FormData($('#liveForm')),o=Object.fromEntries(fd.entries()),status=(o.status||'offline').toUpperCase();$('#livePreview').innerHTML=`<div class="livestream-preview-card status-${o.status||'offline'}"><div class="live-status-dot"></div><small>${status}</small><img src="${thumb}"><strong>${esc(o.title||'LIVESTREAM COMING SOON')}</strong><p>${esc(o.description||'Live broadcasts will appear here on game day.')}</p><span>${o.url?'WATCH LIVESTREAM':'NO STREAM LINK YET'}</span></div>`};
    $('#liveForm').addEventListener('input',draw);$('#liveForm').addEventListener('change',draw);
    $('#liveForm').onsubmit=e=>{e.preventDefault();Object.assign(state.data.live,Object.fromEntries(new FormData(e.target).entries()));markDirty();setStatus('Livestream settings saved locally. Publish when ready.','ok');draw()};
    $('#liveUpload').onchange=async e=>{if(!e.target.files[0])return;const r=await fileToPng(e.target.files[0]),path='images/live/current-livestream.png';state.data.live.thumbnail=path;state.pendingFiles=state.pendingFiles.filter(f=>f.path!==path);state.pendingFiles.push({path,base64:r.base64});thumb=URL.createObjectURL(e.target.files[0]);markDirty();draw()};
    $('#publishLive').onclick=publish;draw();
  };

  renderAssets = function() {
    const a=state.data.assets||{};
    $('#pageTitle').textContent='Website Graphics';
    $('#content').innerHTML=`<div class="v2-banner"><strong>Visual Graphics Manager</strong><span>Every upload shows an immediate before-publish preview.</span></div><div class="panel"><div class="graphics-preview-grid">
    ${[['mediaBackground','Default media-card background','generated/media-card-background.png'],['playerSilhouette','Default player silhouette','images/team/players/player-silhouette.png'],['liveDefaultImage','Default livestream image','images/live/live-default.png']].map(([k,label,path])=>`<article class="graphic-preview-item"><div class="field"><label>${label}</label><input data-asset-path="${path}" data-asset-key="${k}" type="file" accept="image/png,image/jpeg,image/webp"><div class="help">Protected destination: ${esc(a[k]||path)} 🔒</div></div><div class="graphic-preview-box"><img data-graphic-preview="${k}" src="../${esc(a[k]||path)}"></div></article>`).join('')}</div><div class="admin-actions form-actions"><button class="btn primary" id="publishAssets">Publish Website Graphics</button></div></div>`;
    $$('[data-asset-key]').forEach(inp=>inp.onchange=async()=>{await queueAssetUpload(inp);if(inp.files[0])$(`[data-graphic-preview="${inp.dataset.assetKey}"]`).src=URL.createObjectURL(inp.files[0])});
    $('#publishAssets').onclick=publish;
  };
})();
