
const CONFIG={owner:'nepdogg',repo:'allstargalaxysoccer',branch:'main',dataPath:'data/master-content.json'};
const POSITION_OPTIONS=['','GK','CB','LB','RB','CDM','CM','CAM','LW','RW','ST','CF','COACH','STAFF'];
const SECTION_SCHEMAS={
 players:{title:'Players',array:'players',imageField:'photo',imageFolder:'images/team/players',fields:[['firstName','First name','text',true,'basic'],['lastName','Last name','text',true,'basic'],['name','Combined player name','locked',false,'developer'],['number','Jersey number','text',false,'basic'],['position','Position','text',false,'basic'],['imageMode','Player image style','select',['cutout','photo'],'basic'],['photoScale','Player size %','number',false,'advanced'],['photoX','Move player left/right','number',false,'advanced'],['photoY','Move player up/down','number',false,'advanced'],['profileMode','Player profile mode','select',['standard','advanced'],'basic'],['status','Show on website','select',['published','hidden'],'basic'],['dateOfBirth','Date of birth','text',false,'advanced'],['nationality','Nationality','text',false,'advanced'],['preferredFoot','Preferred foot','select',['','Right','Left','Both'],'advanced'],['height','Height','text',false,'advanced'],['weight','Weight','text',false,'advanced'],['quote','Player quote','textarea',false,'advanced'],['order','Carousel position','number',false,'advanced'],['photo','Player photo storage path','locked',false,'developer']]},
 games:{title:'Games',array:'games',imageField:'cardImage',imageFolder:'images/media/latest-games',fields:[['season','Season','seasonselect',true,'basic'],['gameNumber','Game number','number',true,'basic'],['opponent','Opponent team','text',true,'basic'],['result','Final result, e.g. W (3-1)','text',false,'basic'],['fullMatch','Full Match YouTube URL','url',false,'basic'],['highlights','Highlights YouTube URL','url',false,'basic'],['slideshow','Slideshow YouTube URL','url',false,'basic'],['status','Show on website','select',['published','hidden'],'basic'],['date','Match date','date',false,'advanced'],['time','Match time','time',false,'advanced'],['location','Location','text',false,'advanced'],['group','Game carousel','select',['latest','archive'],'advanced'],['order','Carousel position','number',false,'advanced'],['cardImage','Custom card image path','locked',false,'developer']]},
 seasons:{title:'Seasons',array:'seasons',imageField:'cardImage',imageFolder:'images/seasons',fields:[['title','Season name','text',true,'basic'],['fullMatches','Full Matches playlist URL','url',false,'basic'],['highlights','Highlights playlist URL','url',false,'basic'],['slideshows','Slideshows playlist URL','url',false,'basic'],['status','Show on website','select',['published','hidden'],'basic'],['subtitle','Optional subtitle','text',false,'advanced'],['dateRange','Date range','text',false,'advanced'],['league','League','text',false,'advanced'],['order','Carousel position','number',false,'advanced'],['cardImage','Custom card image path','locked',false,'developer']]},
 playlists:{title:'Playlists',array:'playlists',imageField:'cardImage',imageFolder:'images/media/playlists',fields:[['title','Playlist name','text',true,'basic'],['url','YouTube playlist URL','url',false,'basic'],['category','Playlist type','playlisttypeselect',['core','archive','shorts','best','goals','saves','assists','plays'],'basic'],['locations','Show in these carousels','locationselect',false,'basic'],['status','Show on website','select',['published','hidden'],'basic'],['description','Optional description','textarea',false,'advanced'],['order','Carousel position','number',false,'advanced'],['cardImage','Custom card image path','locked',false,'developer']]},
 news:{title:'News',array:'news',imageField:'image',imageFolder:'images/news',fields:[['title','Headline','text',true,'basic'],['imageNote','Image note / what this flyer is','textarea',false,'basic'],['summary','Public description','textarea',false,'basic'],['category','News type','select',['NEWS','MATCH','ANNOUNCEMENT','RESULT','TEAM UPDATE'],'basic'],['link','Optional related URL','url',false,'basic'],['status','Show on website','select',['published','hidden','placeholder'],'basic'],['date','Date','date',false,'advanced'],['order','Display position','number',false,'advanced'],['image','News image storage path','locked',false,'developer']]}
};
let state={data:null,sha:null,dirty:false,section:null,editIndex:-1,pendingFiles:[]};
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function token(){return sessionStorage.getItem('asgGithubToken')||''} function authHeaders(){return {'Accept':'application/vnd.github+json','Authorization':`Bearer ${token()}`,'X-GitHub-Api-Version':'2022-11-28'}}
function setStatus(msg,type=''){const el=$('#statusbar');if(el){el.textContent=msg;el.className='statusbar '+type}}
async function ghGet(path){const r=await fetch(`https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${path}?ref=${CONFIG.branch}`,{headers:authHeaders()});if(!r.ok)throw new Error(`${r.status}: ${await r.text()}`);return r.json()}
async function ghPut(path,content,message,sha){const body={message,content,branch:CONFIG.branch};if(sha)body.sha=sha;const r=await fetch(`https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${path}`,{method:'PUT',headers:{...authHeaders(),'Content-Type':'application/json'},body:JSON.stringify(body)});if(!r.ok)throw new Error(`${r.status}: ${await r.text()}`);return r.json()}
function decode64(s){return decodeURIComponent(escape(atob(s.replace(/\n/g,''))))} function encode64(s){return btoa(unescape(encodeURIComponent(s)))}
async function connect(){if(!token()){location.href='index.html';return}setStatus('Connecting to GitHub…');try{const f=await ghGet(CONFIG.dataPath);state.sha=f.sha;state.data=JSON.parse(decode64(f.content));setStatus(`Connected to ${CONFIG.owner}/${CONFIG.repo} • master-content.json loaded • Admin Dashboard V2`,'ok');renderPage()}catch(e){setStatus('Admin page error: '+e.message+' — GitHub connection may still be active.','bad')}}
function slug(s){return String(s||'item').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'item'}
function nextId(arr,prefix){let n=1;const ids=new Set(arr.map(x=>x.id));while(ids.has(`${prefix}-${String(n).padStart(2,'0')}`))n++;return `${prefix}-${String(n).padStart(2,'0')}`}
function markDirty(){state.dirty=true;const p=$('#pendingLabel');if(p)p.textContent='Unpublished changes';}
function titleFor(x,s){return x.name||x.title||(s==='games'?`${x.season||''} Game ${x.gameNumber||''}`:x.id)}
function subFor(x,s){if(s==='players')return `#${x.number||'—'} • ${x.position||'Position not set'}`;if(s==='games')return `${x.opponent||'Opponent'} • ${x.result||'No result'} • ${x.status}`;if(s==='playlists')return `${x.category||''} • ${(x.locations||[]).join?.(', ')||x.locations||''}`;return `${x.status||''} • Order ${x.order??''}`}
function renderManager(section){state.section=section;const schema=SECTION_SCHEMAS[section],arr=state.data[schema.array]||[];$('#pageTitle').textContent=schema.title;$('#content').innerHTML=`<div class="v2-banner"><strong>Simple Mode</strong><span>Safe everyday fields are shown first. Advanced and technical settings are protected.</span></div><div class="admin-actions manager-actions"><button class="btn primary" id="addBtn">Add ${schema.title.replace(/s$/,'')}</button><button class="btn" id="publishBtn">Publish All Changes</button><button class="btn" id="previewBtn">Preview Draft</button><span class="pending" id="pendingLabel">${state.dirty?'Unpublished changes':''}</span></div><div class="item-list">${arr.map((x,i)=>`<div class="item-row ${x.status==='hidden'?'is-hidden':''}"><div><div class="item-title">${esc(titleFor(x,section))}</div><div class="item-sub">${esc(subFor(x,section))}</div></div><div class="row-actions"><button class="btn small" data-edit="${i}">Edit</button><button class="btn small" data-toggle="${i}">${x.status==='hidden'?'Restore':'Hide'}</button><button class="btn small danger" data-delete="${i}">Delete</button></div></div>`).join('')}</div>`;$('#addBtn').onclick=()=>openForm(-1);$('#publishBtn').onclick=publish;$('#previewBtn').onclick=()=>{sessionStorage.setItem('asgPreviewMasterContent',JSON.stringify(state.data));window.open('../index.html?adminPreview=1','_blank')};$$('[data-edit]').forEach(b=>b.onclick=()=>openForm(+b.dataset.edit));$$('[data-toggle]').forEach(b=>b.onclick=()=>{const x=arr[+b.dataset.toggle];x.status=x.status==='hidden'?'published':'hidden';markDirty();renderManager(section)});$$('[data-delete]').forEach(b=>b.onclick=()=>{const i=+b.dataset.delete;if(confirm('Permanently delete this item? Hide is safer.')){arr.splice(i,1);markDirty();renderManager(section)}})}
function playlistLocationValue(val){const a=Array.isArray(val)?val:String(val||'').split(',').map(x=>x.trim()).filter(Boolean);const has=x=>a.includes(x);if(has('home-best')&&has('media-archive'))return 'best-and-archive';if(has('home-best'))return 'home-best';if(has('season-archive')&&has('latest-season-playlists'))return 'season-and-latest';if(has('latest-season-playlists'))return 'latest-season-playlists';if(has('season-archive'))return 'season-archive';return 'media-archive'}
function playlistLocationsFromValue(val){const map={'media-archive':['media-archive'],'home-best':['home-best'],'best-and-archive':['home-best','media-archive'],'season-archive':['season-archive'],'latest-season-playlists':['latest-season-playlists'],'season-and-latest':['season-archive','latest-season-playlists']};return map[val]||['media-archive']}
function friendlyOption(v){const m={published:'Visible',hidden:'Hidden',placeholder:'Placeholder',latest:'Latest Games',archive:'Archive / older games',core:'Full Matches / Highlights / Slideshows',best:'Best Of',goals:'Goals',saves:'Saves',assists:'Assists',plays:'Plays',shorts:'Shorts'};return m[v]||v||'Not assigned / N/A'}
function latestSeasonTitle(){
 const visible=(state.data.seasons||[])
   .filter(item=>item&&item.status!=='hidden'&&item.title)
   .sort((a,b)=>(Number(a.order)||9999)-(Number(b.order)||9999));
 return visible[0]?.title||'';
}
function inputHtml(field,val){
 const [key,label,type,rule]=field;
 const required=rule===true?'required':'';
 if(type==='locked')return `<div class="field locked-field"><label>${label} 🔒</label><input value="${esc(val||'Automatically generated')}" readonly><div class="help">Protected technical field. The dashboard manages this automatically.</div></div>`;

 if(type==='seasonselect'){
   const seasons=(state.data.seasons||[])
     .filter(item=>item&&item.title)
     .sort((a,b)=>(Number(a.order)||9999)-(Number(b.order)||9999))
     .map(item=>item.title)
     .filter((title,index,list)=>list.indexOf(title)===index);
   const selected=String(val||latestSeasonTitle()||'');
   const isCustom=selected&& !seasons.includes(selected);
   return `<div class="field full season-assignment-field">
     <label>${label}</label>
     <select name="${key}" id="seasonSelect" ${required}>
       <option value="" ${selected===''?'selected':''}>No season / N/A</option>
       ${seasons.map(title=>`<option value="${esc(title)}" ${selected===title?'selected':''}>${esc(title)}</option>`).join('')}
       <option value="__custom__" ${isCustom?'selected':''}>Enter another season…</option>
     </select>
     <div class="help">The newest visible season is selected automatically. You may choose any existing season or enter another one.</div>
     <div class="custom-choice-panel ${isCustom?'':'is-hidden'}" id="customSeasonPanel">
       <label>Custom season name</label>
       <input id="customSeasonName" type="text" value="${isCustom?esc(selected):''}" placeholder="Example: Winter 2025">
       <label class="inline-check"><input id="createSeasonCard" type="checkbox" checked> Create a matching season card if it does not exist</label>
     </div>
   </div>`;
 }

 if(type==='playlisttypeselect'){
   const presets=rule||[];
   const current=String(val||presets[0]||'core');
   const isCustom=current && !presets.includes(current);
   return `<div class="field full playlist-type-field">
     <label>${label}</label>
     <select name="${key}" id="playlistTypeSelect">
       ${presets.map(value=>`<option value="${esc(value)}" ${current===value?'selected':''}>${esc(friendlyOption(value))}</option>`).join('')}
       <option value="__custom__" ${isCustom?'selected':''}>Custom type…</option>
     </select>
     <div class="help">Preset types provide automatic icons and colors. Custom types use a neutral default until customized later.</div>
     <div class="custom-choice-panel ${isCustom?'':'is-hidden'}" id="customPlaylistTypePanel">
       <label>Custom playlist type</label>
       <input id="customPlaylistType" type="text" value="${isCustom?esc(current):''}" placeholder="Example: Interviews">
     </div>
   </div>`;
 }

 if(type==='select'){
   const opts=rule.map(option=>`<option value="${esc(option)}" ${String(val)===option?'selected':''}>${esc(friendlyOption(option))}</option>`).join('');
   return `<div class="field"><label>${label}</label><select name="${key}">${opts}</select></div>`;
 }
 if(type==='locationselect'){
   const current=playlistLocationValue(val);
   const options=[['media-archive','Media Archive only'],['home-best','Homepage Best Of only'],['best-and-archive','Homepage Best Of + Media Archive'],['season-archive','Season Archive only'],['latest-season-playlists','Latest Season Playlists only'],['season-and-latest','Season Archive + Latest Season Playlists']];
   return `<div class="field"><label>${label}</label><select name="${key}">${options.map(([value,text])=>`<option value="${value}" ${current===value?'selected':''}>${text}</option>`).join('')}</select><div class="help">Choose exactly where this playlist card should appear.</div></div>`;
 }
 if(type==='textarea')return `<div class="field full"><label>${label}</label><textarea name="${key}" placeholder="N/A">${esc(val||'')}</textarea></div>`;
 return `<div class="field"><label>${label}</label><input name="${key}" type="${type}" value="${esc(val??'')}" ${required} placeholder="${type==='url'?'Not available yet':'N/A'}"></div>`;
}
function safeImagePath(schema,form,item,uploadFile){const pathInput=form.querySelector(`[name="${schema.imageField}"]`);let requested=String(pathInput?.value||'').trim().replace(/^\/+/, '');let fileName='';if(requested){fileName=requested.split('/').pop().replace(/\.[^.]+$/,'')+'.png'}else if(uploadFile?.name){const originalBase=uploadFile.name.replace(/\.[^.]+$/,'');fileName=`${slug(originalBase)}.png`}else if(item?.[schema.imageField]){fileName=String(item[schema.imageField]).split('/').pop().replace(/\.[^.]+$/,'')+'.png'}else{const name=form.querySelector('[name="name"]')?.value||form.querySelector('[name="title"]')?.value||form.querySelector('[name="id"]')?.value||item.id;fileName=`${slug(name)}.png`}return `${schema.imageFolder}/${fileName}`}
function openForm(index){const schema=SECTION_SCHEMAS[state.section],arr=state.data[schema.array],item=index>=0?JSON.parse(JSON.stringify(arr[index])):{status:'published',order:arr.length+1};let uploadedPath='';state.editIndex=index;if(index<0){item.id=nextId(arr,state.section.replace(/s$/,''));if(state.section==='games')item.season=latestSeasonTitle();}if(state.section==='players'){const parts=String(item.name||'').trim().split(/\s+/).filter(Boolean);item.firstName=item.firstName||parts.shift()||'';item.lastName=item.lastName||parts.join(' ')||item.firstName||'';}$('#modalTitle').textContent=(index>=0?'Edit ':'Add ')+schema.title.replace(/s$/,'');const basic=schema.fields.filter(f=>(f[4]||'basic')==='basic').map(f=>inputHtml(f,item[f[0]])).join('');const advanced=schema.fields.filter(f=>f[4]==='advanced').map(f=>inputHtml(f,item[f[0]])).join('');const developer=schema.fields.filter(f=>f[4]==='developer').map(f=>inputHtml(f,item[f[0]])).join('');$('#editForm').innerHTML=`<div class="form-section"><h4>Basic Settings</h4><div class="form-grid">${basic}</div></div><div class="field full upload-field"><label>${state.section==='players'?'Upload player photo':state.section==='news'?'Upload news flyer':'Upload optional PNG image'}</label><input id="imageUpload" type="file" accept="image/png,image/jpeg,image/webp"><div class="help">The dashboard converts the file to PNG and creates the correct storage path automatically.</div><img id="imagePreview" class="upload-preview" ${item[schema.imageField]?`src="../${esc(item[schema.imageField])}"`:'hidden'}></div><details class="advanced-box"><summary>Advanced Settings</summary><div class="form-grid">${advanced||'<p class="help">No advanced settings.</p>'}</div></details><details class="developer-box"><summary>Technical Information (read only)</summary><div class="form-grid"><div class="field locked-field"><label>Internal ID 🔒</label><input value="${esc(item.id)}" readonly></div>${developer}</div></details><div class="admin-actions form-actions"><button class="btn primary" type="submit">Save Form</button><button class="btn" type="button" id="cancelForm">Cancel</button></div>`;const form=$('#editForm');form.onsubmit=e=>{
 e.preventDefault();
 const fd=new FormData(e.target),obj={...item,id:item.id};
 for(const [k,v] of fd.entries())obj[k]=['order','gameNumber'].includes(k)&&v!==''?Number(v):v;

 if(state.section==='games'&&obj.season==='__custom__'){
   const custom=String($('#customSeasonName')?.value||'').trim();
   if(!custom){setStatus('Enter a custom season name or select an existing season.','bad');return}
   obj.season=custom;
   if($('#createSeasonCard')?.checked){
     const seasons=state.data.seasons=state.data.seasons||[];
     const exists=seasons.some(season=>String(season.title||'').trim().toLowerCase()===custom.toLowerCase());
     if(!exists){
       seasons.push({
         id:nextId(seasons,'season'),
         title:custom,
         status:'published',
         order:seasons.length+1,
         subtitle:'Season Archive',
         fullMatches:'',
         highlights:'',
         slideshows:''
       });
     }
   }
 }

 if(state.section==='playlists'&&obj.category==='__custom__'){
   const custom=String($('#customPlaylistType')?.value||'').trim();
   if(!custom){setStatus('Enter a custom playlist type or select a preset type.','bad');return}
   obj.category=custom;
 }

 if(uploadedPath)obj[schema.imageField]=uploadedPath;
 if(state.section==='playlists')obj.locations=playlistLocationsFromValue(obj.locations);
 if(index>=0)arr[index]=obj;else arr.push(obj);
 markDirty();closeModal();renderManager(state.section)
};$('#cancelForm').onclick=closeModal;
 const seasonSelect=$('#seasonSelect');
 if(seasonSelect)seasonSelect.onchange=()=>$('#customSeasonPanel')?.classList.toggle('is-hidden',seasonSelect.value!=='__custom__');
 const playlistTypeSelect=$('#playlistTypeSelect');
 if(playlistTypeSelect)playlistTypeSelect.onchange=()=>$('#customPlaylistTypePanel')?.classList.toggle('is-hidden',playlistTypeSelect.value!=='__custom__');
 const up=$('#imageUpload');up.onchange=async()=>{if(!up.files[0])return;const result=await fileToPng(up.files[0]);uploadedPath=safeImagePath(schema,form,item,up.files[0]);state.pendingFiles=state.pendingFiles.filter(f=>f.path!==uploadedPath);state.pendingFiles.push({path:uploadedPath,base64:result.base64});state.pendingPreviewUrls=state.pendingPreviewUrls||{};state.pendingPreviewUrls[uploadedPath]=result.url;$('#imagePreview').src=result.url;$('#imagePreview').hidden=false;setStatus(`${uploadedPath} ready to publish.`,'ok')};$('#editModal').classList.add('open')}
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
  state.pendingPreviewUrls={};
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
function renderDashboard(){
 const data=state.data||{};
 const visible=(key)=>((data[key]||[]).filter(item=>item.status!=='hidden').length);
 const fullControl=localStorage.getItem('asgAdminCustomizeMode')==='customize';

 if(!fullControl){
   $('#pageTitle').textContent='Quick Management';
   $('#content').innerHTML=`
    <div class="v2-hero">
     <span class="v2-pill">ALLSTAR GALAXY ADMIN</span>
     <h3>Choose what you need to update</h3>
     <p>The most-used tools are shown first. Open Full Control for every website setting.</p>
    </div>
    <div class="quick-management-grid">
     <a class="quick-management-card" href="games.html"><span class="quick-management-icon">⚽</span><strong>Games</strong><small>Add scores, opponents and YouTube links</small><b>${visible('games')} visible games</b></a>
     <a class="quick-management-card" href="players.html"><span class="quick-management-icon">👤</span><strong>Players</strong><small>Add players, photos, numbers and positions</small><b>${visible('players')} visible players</b></a>
     <a class="quick-management-card" href="schedule.html"><span class="quick-management-icon">▦</span><strong>Schedule</strong><small>Update schedule and standings graphics</small><b>Schedule & Standings</b></a>
     <button class="quick-management-card full-control-card" id="dashboardFullControl" type="button"><span class="quick-management-icon">⚙</span><strong>Full Control</strong><small>Open all content, design, hero, backup and site tools</small><b>Show every Admin page</b></button>
    </div>`;
   $('#dashboardFullControl').onclick=()=>{
     localStorage.setItem('asgAdminCustomizeMode','customize');
     location.reload();
   };
   return;
 }

 $('#pageTitle').textContent='Full Control';
 const groups=[
  ['CONTENT',[
   ['players.html','👤','Players','Add players, photos, numbers and positions',`${visible('players')} visible players`],
   ['games.html','⚽','Games','Add scores, opponents and media links',`${visible('games')} visible games`],
   ['seasons.html','◫','Seasons','Manage season archive cards and links',`${visible('seasons')} visible seasons`],
   ['playlists.html','▶','Playlists','Manage every website playlist card',`${visible('playlists')} visible playlists`],
   ['news.html','▤','News','Update Latest News and Match Results','NEWS CARDS']
  ]],
  ['GAME DAY',[
   ['schedule.html','▦','Schedule & Standings','Update schedule and standings graphics','SCHEDULE & STANDINGS'],
   ['livestream.html','●','Livestream','Control game-day livestream information','LIVE PAGE']
  ]],
  ['DESIGN',[
   ['graphics.html','▧','Website Graphics','Replace reusable website artwork','GLOBAL GRAPHICS'],
   ['heroes.html','✦','Hero Images','Control hero photos, motion and glow','HERO MANAGER'],
   ['settings.html','⚙','Site Settings','Branding, navigation, footer and visibility','COMPLETE SITE MANAGER']
  ]],
  ['SAFETY',[
   ['backups.html','↶','Backup & Restore','Create, review and restore protected backups','SAFETY CENTER']
  ]]
 ];
 $('#content').innerHTML=`
   <div class="v2-hero full-control-hero">
    <span class="v2-pill">FULL CONTROL</span>
    <h3>Manage every part of the website</h3>
    <p>All content, game-day, design and safety tools are available below.</p>
   </div>
   ${groups.map(([title,cards])=>`
    <section class="full-control-section">
     <h3>${title}</h3>
     <div class="full-control-grid">
      ${cards.map(([href,icon,title,description,status])=>`
       <a class="quick-management-card" href="${href}">
        <span class="quick-management-icon">${icon}</span>
        <strong>${title}</strong>
        <small>${description}</small>
        <b>${status}</b>
       </a>`).join('')}
     </div>
    </section>`).join('')}
   <button class="btn full-control-return" id="dashboardQuickManagement" type="button">← Return to Quick Management</button>`;
 $('#dashboardQuickManagement').onclick=()=>{
   localStorage.setItem('asgAdminCustomizeMode','basic');
   location.reload();
 };
}
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
    if (state.pendingPreviewUrls && state.pendingPreviewUrls[path]) return state.pendingPreviewUrls[path];
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
    const parts=String(obj.name||'PLAYER NAME').trim().split(/\s+/); const first=String(obj.firstName||parts.shift()||'PLAYER'); const last=String(obj.lastName||parts.join(' ')||first);
    const isDefaultSilhouette=!String(obj.photo||'').trim() && (!image || /player-silhouette/i.test(String(image)));
    return `<div class="visual-card player-preview-card public-style-player-preview ${obj.status==='hidden'?'preview-hidden':''}">
      <div class="preview-ultimate-card prototype-player-frame image-mode-${String(obj.imageMode||'cutout').toLowerCase()==='photo'?'photo':'cutout'}">
        <img class="prototype-card-template" src="${previewEsc((state.data.assets&&state.data.assets.playerCardTemplate)?'../'+state.data.assets.playerCardTemplate:'../generated/player-card-template.png')}" alt="" aria-hidden="true">
        <div class="preview-ultimate-cutout-stage prototype-player-stage${isDefaultSilhouette?' is-default-silhouette':''}" style="--player-scale:${Math.max(60,Math.min(180,Number(obj.photoScale)||100))/100};--player-x:${Math.max(-50,Math.min(50,Number(obj.photoX)||0))}%;--player-y:${Math.max(-50,Math.min(50,Number(obj.photoY)||0))}%"><img class="preview-ultimate-photo" src="${previewEsc(image || '../images/team/players/player-silhouette.png')}" alt=""></div>
        <span class="prototype-player-number">${previewEsc(obj.number||'00')}</span>
        <div class="preview-ultimate-name prototype-player-name name-length-${Math.min(20,String(last).length)}"><small>${previewEsc(first)}</small><strong>${previewEsc(last)}</strong><em>${previewEsc(obj.position||'PLAYER')}</em></div>
      </div>
      ${String(obj.profileMode||'standard').toLowerCase()==='advanced'?`<div class="preview-profile-badge">ADVANCED • DOUBLE CARD</div>`:''}
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

  // V142: expose one shared renderer so permanent list previews and
  // Add/Edit previews use the same card generator without scope errors.
  window.ASGVisualPreview = renderVisualPreview;

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


/* ============================================================
   V139 — ADMIN TESTING FIXES
   - Permanent News preview
   - News image-note display
   - Schedule and standings note fields
   - Full, uncropped Website Graphics previews
   ============================================================ */
(() => {
  "use strict";

  const previousRenderManager = renderManager;

  const previewPath = (path, fallback = "../images/logos/logo.png") => {
    const value = String(path || "").trim();
    if (!value) return fallback;
    if (/^(blob:|data:|https?:)/i.test(value)) return value;
    return "../" + value.replace(/^\/+/, "");
  };

  function newsListPreview(item) {
    if (!item) {
      return `<div class="empty-admin-preview">
        <strong>No news item selected</strong>
        <p>Select Preview, Edit, or Add New to view a News card.</p>
      </div>`;
    }

    const image = previewPath(item.image);
    const note = item.imageNote || "No image note has been entered yet.";
    const description = item.summary || "No public description has been entered yet.";

    return `<article class="visual-card news-preview-card ${item.status === "hidden" ? "preview-hidden" : ""}">
      <div class="preview-news-image">
        <img src="${esc(image)}" alt="" onerror="this.onerror=null;this.src='../images/logos/logo.png'">
      </div>
      <div class="preview-news-copy">
        <small>${esc(item.category || item.date || "NEWS")}</small>
        <strong>${esc(item.title || "NEWS HEADLINE")}</strong>
        <div class="admin-image-note"><b>IMAGE NOTE:</b> ${esc(note)}</div>
        <p>${esc(description)}</p>
        ${item.link
          ? '<span class="preview-link">RELATED LINK ACTIVE</span>'
          : '<span class="preview-link is-disabled">NO RELATED LINK</span>'}
      </div>
      <span class="preview-visibility">${item.status === "hidden" ? "HIDDEN" : "VISIBLE"}</span>
    </article>`;
  }

  renderManager = function(section) {
    if (section !== "news") {
      previousRenderManager(section);
      return;
    }

    state.section = section;
    const schema = SECTION_SCHEMAS.news;
    const arr = state.data.news || [];
    const firstVisible = arr.findIndex(item => item.status !== "hidden");
    let selectedIndex = firstVisible >= 0 ? firstVisible : (arr.length ? 0 : -1);

    $("#pageTitle").textContent = "News";
    $("#content").innerHTML = `
      <div class="v2-banner">
        <strong>Visual News Manager</strong>
        <span>Select any item to see the public News card. Add an image note so you can quickly identify every uploaded flyer.</span>
      </div>

      <div class="admin-actions manager-actions">
        <button class="btn primary" id="addBtn">Add News</button>
        <button class="btn" id="publishBtn">Publish All Changes</button>
        <button class="btn" id="previewBtn">Preview Draft</button>
        <span class="pending" id="pendingLabel">${state.dirty ? "Unpublished changes" : ""}</span>
      </div>

      <div class="permanent-preview-layout">
        <div class="item-list news-admin-list">
          ${arr.map((item, index) => `
            <div class="item-row ${item.status === "hidden" ? "is-hidden" : ""}" data-news-row="${index}">
              <div>
                <div class="item-title">${esc(titleFor(item, section))}</div>
                <div class="item-sub">${esc(item.imageNote || subFor(item, section) || "No image note")}</div>
              </div>
              <div class="row-actions">
                <button class="btn small" data-select="${index}">Preview</button>
                <button class="btn small" data-edit="${index}">Edit</button>
                <button class="btn small" data-toggle="${index}">${item.status === "hidden" ? "Restore" : "Hide"}</button>
                <button class="btn small danger" data-delete="${index}">Delete</button>
              </div>
            </div>
          `).join("")}
        </div>

        <aside class="visual-editor-preview permanent-news-preview">
          <div class="preview-toolbar">
            <div><span class="v2-pill">LIVE PREVIEW</span><h4>Selected News Card</h4></div>
            <div class="preview-device-switch">
              <button type="button" class="is-active" data-news-device="desktop">Desktop</button>
              <button type="button" data-news-device="mobile">Mobile</button>
            </div>
          </div>
          <div id="permanentNewsPreview" class="live-card-preview"></div>
          <p class="help preview-help">The image note helps identify the flyer in Admin and can also appear on the public card.</p>
        </aside>
      </div>
    `;

    const drawSelected = () => {
      const target = $("#permanentNewsPreview");
      if (target) target.innerHTML = newsListPreview(arr[selectedIndex]);
      $$("[data-news-row]").forEach(row =>
        row.classList.toggle("is-selected", Number(row.dataset.newsRow) === selectedIndex)
      );
    };

    $("#addBtn").onclick = () => openForm(-1);
    $("#publishBtn").onclick = publish;
    $("#previewBtn").onclick = () => {
      sessionStorage.setItem("asgPreviewMasterContent", JSON.stringify(state.data));
      window.open("../news.html?adminPreview=1", "_blank");
    };

    $$("[data-select]").forEach(button => button.onclick = () => {
      selectedIndex = Number(button.dataset.select);
      drawSelected();
    });

    $$("[data-edit]").forEach(button => button.onclick = () => {
      selectedIndex = Number(button.dataset.edit);
      drawSelected();
      openForm(selectedIndex);
    });

    $$("[data-toggle]").forEach(button => button.onclick = () => {
      const item = arr[Number(button.dataset.toggle)];
      item.status = item.status === "hidden" ? "published" : "hidden";
      markDirty();
      renderManager("news");
    });

    $$("[data-delete]").forEach(button => button.onclick = () => {
      const index = Number(button.dataset.delete);
      if (confirm("Permanently delete this news item? Hide is safer.")) {
        arr.splice(index, 1);
        markDirty();
        renderManager("news");
      }
    });

    $$("[data-news-device]").forEach(button => button.onclick = () => {
      $$("[data-news-device]").forEach(item => item.classList.toggle("is-active", item === button));
      $("#permanentNewsPreview").classList.toggle("mobile-preview", button.dataset.newsDevice === "mobile");
    });

    drawSelected();
  };

  renderScheduleAssets = function() {
    const assets = state.data.assets || {};
    const display = state.data.display || {};
    const schedulePage = state.data.schedulePage = state.data.schedulePage || {};

    $("#pageTitle").textContent = "Schedule & Standings";
    $("#content").innerHTML = `
      <div class="v2-banner">
        <strong>Visual Schedule Editor</strong>
        <span>Upload a graphic, enter a quick note describing it, and see exactly how the public card will look.</span>
      </div>

      <div class="visual-page-editor">
        <div class="panel">
          <div class="form-grid">
            ${assetField("scheduleImage", "Upload Match Schedule PNG", "images/schedule/schedule.png", assets.scheduleImage)}
            ${assetField("standingsImage", "Upload League Standings PNG", "images/schedule/standings.png", assets.standingsImage)}

            <div class="field full">
              <label>Schedule note / what this image is</label>
              <textarea id="scheduleNote" placeholder="Example: Summer 2026 playoff schedule">${esc(schedulePage.scheduleDescription || "")}</textarea>
              <div class="help">When blank, the website uses its standard “Click the image…” message.</div>
            </div>

            <div class="field full">
              <label>Standings note / what this image is</label>
              <textarea id="standingsNote" placeholder="Example: Final standings after Game 16">${esc(schedulePage.standingsDescription || "")}</textarea>
              <div class="help">When blank, the website uses its standard “Click the image…” message.</div>
            </div>

            <div class="field">
              <label>Optional Schedule URL</label>
              <input id="scheduleUrl" type="url" value="${esc(schedulePage.scheduleUrl || "")}" placeholder="N/A — image opens full size">
              <div class="help">When blank, clicking the schedule opens the uploaded image. Add a URL to open a league page, PDF, or external schedule.</div>
            </div>

            <div class="field">
              <label>Optional Standings URL</label>
              <input id="standingsUrl" type="url" value="${esc(schedulePage.standingsUrl || "")}" placeholder="N/A — image opens full size">
              <div class="help">When blank, clicking the standings opens the uploaded image.</div>
            </div>

            <div class="field">
              <label>Schedule visibility</label>
              <select id="scheduleVisible">
                <option value="true" ${display.scheduleVisible !== false ? "selected" : ""}>Visible</option>
                <option value="false" ${display.scheduleVisible === false ? "selected" : ""}>Hidden</option>
              </select>
            </div>

            <div class="field">
              <label>Standings visibility</label>
              <select id="standingsVisible">
                <option value="true" ${display.standingsVisible !== false ? "selected" : ""}>Visible</option>
                <option value="false" ${display.standingsVisible === false ? "selected" : ""}>Hidden</option>
              </select>
            </div>
          </div>

          <div class="admin-actions form-actions">
            <button class="btn primary" id="publishSchedule">Publish Schedule & Standings</button>
          </div>
        </div>

        <aside class="visual-editor-preview page-preview-column">
          <div class="preview-toolbar">
            <div><span class="v2-pill">LIVE PREVIEW</span><h4>Schedule Page Cards</h4></div>
          </div>
          <div id="schedulePreview" class="stacked-card-preview"></div>
        </aside>
      </div>
    `;

    let scheduleSrc = previewPath(assets.scheduleImage, "../images/schedule/schedule.png");
    let standingsSrc = previewPath(assets.standingsImage, "../images/schedule/standings.png");

    const draw = () => {
      const scheduleText = $("#scheduleNote").value.trim() || "Click the image to view the complete schedule.";
      const standingsText = $("#standingsNote").value.trim() || "Click the image to view the complete standings.";
      const scheduleLinkState = $("#scheduleUrl").value.trim() ? "EXTERNAL URL ACTIVE" : "OPENS FULL IMAGE";
      const standingsLinkState = $("#standingsUrl").value.trim() ? "EXTERNAL URL ACTIVE" : "OPENS FULL IMAGE";

      $("#schedulePreview").innerHTML = `
        <div class="mini-news-card ${$("#scheduleVisible").value === "false" ? "preview-hidden" : ""}">
          <img src="${esc(scheduleSrc)}" alt="" onerror="this.onerror=null;this.src='../images/logos/logo.png'">
          <div><small>CURRENT SCHEDULE</small><strong>Match Schedule</strong><p>${esc(scheduleText)}</p><span class="preview-link">${scheduleLinkState}</span></div>
        </div>
        <div class="mini-news-card ${$("#standingsVisible").value === "false" ? "preview-hidden" : ""}">
          <img src="${esc(standingsSrc)}" alt="" onerror="this.onerror=null;this.src='../images/logos/logo.png'">
          <div><small>CURRENT STANDINGS</small><strong>League Standings</strong><p>${esc(standingsText)}</p><span class="preview-link">${standingsLinkState}</span></div>
        </div>
      `;
    };

    $$("[data-asset-key]").forEach(input => input.onchange = async () => {
      await queueAssetUpload(input);
      if (input.files[0]) {
        const url = URL.createObjectURL(input.files[0]);
        if (input.dataset.assetKey === "scheduleImage") scheduleSrc = url;
        if (input.dataset.assetKey === "standingsImage") standingsSrc = url;
      }
      draw();
    });

    $("#scheduleNote").oninput = event => {
      schedulePage.scheduleDescription = event.target.value;
      markDirty();
      draw();
    };
    $("#standingsNote").oninput = event => {
      schedulePage.standingsDescription = event.target.value;
      markDirty();
      draw();
    };
    $("#scheduleUrl").oninput = event => {
      schedulePage.scheduleUrl = event.target.value;
      markDirty();
      draw();
    };
    $("#standingsUrl").oninput = event => {
      schedulePage.standingsUrl = event.target.value;
      markDirty();
      draw();
    };
    $("#scheduleVisible").onchange = event => {
      state.data.display = state.data.display || {};
      state.data.display.scheduleVisible = event.target.value === "true";
      markDirty();
      draw();
    };
    $("#standingsVisible").onchange = event => {
      state.data.display = state.data.display || {};
      state.data.display.standingsVisible = event.target.value === "true";
      markDirty();
      draw();
    };

    $("#publishSchedule").onclick = publish;
    draw();
  };

  renderAssets = function() {
    const assets = state.data.assets || {};
    $("#pageTitle").textContent = "Website Graphics";

    const groups = [
      {title:"Player Cards", note:"Templates and defaults used by the Team carousel, player preview, and player popup.", items:[
        ["playerCardTemplate","Front player-card template","generated/player-card-template.png"],
        ["playerProfileTemplate","Advanced profile-card template","generated/player-profile-card-template.png"],
        ["playerSilhouette","Default player silhouette","images/team/players/player-silhouette.png"],
        ["playerPopupBackground","Player popup background","images/team/player-popup-background.png"]
      ]},
      {title:"Carousel Backgrounds", note:"Independent artwork behind each major carousel. Uploading one no longer changes the others.", items:[
        ["homeCarouselBackground","Homepage carousel background","images/carousels/home-carousel-background.png"],
        ["teamCarouselBackground","Team player carousel background","images/carousels/team-carousel-background.png"],
        ["mediaCarouselBackground","Media carousel background","images/carousels/media-carousel-background.png"],
        ["seasonCarouselBackground","Season archive carousel background","images/carousels/season-carousel-background.png"]
      ]},
      {title:"Media Cards", note:"Separate card artwork for games, seasons, playlists, and Best Of content.", items:[
        ["gameCardBackground","Game-card background","generated/game-card-background.png"],
        ["seasonCardBackground","Season-card background","generated/season-card-background.png"],
        ["playlistCardBackground","Playlist-card background","generated/playlist-card-background.png"],
        ["bestOfCardBackground","Best Of card background","generated/best-of-card-background.png"],
        ["mediaBackground","Legacy shared media-card fallback","generated/media-card-background.png"]
      ]},
      {title:"Livestream Graphics", note:"Default and status-specific artwork used by the Live page.", items:[
        ["liveDefaultImage","Default livestream image","images/live/live-default.png"],
        ["liveOfflineImage","Livestream offline image","images/live/live-offline.png"],
        ["liveComingSoonImage","Livestream coming-soon image","images/live/live-coming-soon.png"],
        ["liveOverlay","Live Now overlay","images/live/live-now-overlay.png"]
      ]},
      {title:"Website Branding", note:"Reusable logos and titles shown across the public website.", items:[
        ["logo","Website logo","images/logos/logo.png"],
        ["navigationTitle","Desktop navigation title","images/logos/navigation-title.png"],
        ["mobileNavigationTitle","Mobile navigation title","images/logos/navigation-title-mobile.png"],
        ["footerLogo","Footer logo","images/logos/footer-logo.png"],
        ["favicon","Favicon","images/logos/favicon.png"]
      ]},
      {title:"Homepage Graphics", note:"Large reusable homepage artwork outside the hero-image system.", items:[
        ["homeBanner","Homepage banner","images/home/home-banner.png"],
        ["bestOfBanner","Best Of banner","images/home/best-of-banner.png"],
        ["featuredBanner","Featured section banner","images/home/featured-banner.png"]
      ]},
      {title:"Team Graphics", note:"Team-page artwork that is separate from individual player cards.", items:[
        ["teamRosterBanner","Team roster banner","images/team/team-roster-banner.png"],
        ["teamSectionBackground","Team section background","images/team/team-section-background.png"]
      ]},
      {title:"Schedule, News & Generic", note:"Shared placeholders and utility graphics.", items:[
        ["scheduleBackground","Schedule section background","images/schedule/schedule-background.png"],
        ["standingsBackground","Standings section background","images/schedule/standings-background.png"],
        ["newsCardBackground","News-card background","images/news/news-card-background.png"],
        ["newsPlaceholder","Default news placeholder","images/news/news-placeholder.png"],
        ["loadingGraphic","Loading graphic","images/system/loading.png"],
        ["notFoundGraphic","404 graphic","images/system/404.png"],
        ["comingSoonGraphic","Coming Soon graphic","images/system/coming-soon.png"],
        ["maintenanceGraphic","Maintenance graphic","images/system/maintenance.png"]
      ]}
    ];

    const itemMarkup = ([key,label,path]) => {
      const current = assets[key] || path;
      return `<article class="graphic-preview-item">
        <div class="field">
          <label>${label}</label>
          <input data-asset-path="${path}" data-asset-key="${key}" type="file" accept="image/png,image/jpeg,image/webp">
          <div class="help">Protected destination: ${esc(current)} 🔒</div>
        </div>
        <div class="graphic-preview-box">
          <img data-graphic-preview="${key}" src="../${esc(current)}" alt="${esc(label)}">
          <div class="graphic-missing-placeholder" hidden><strong>IMAGE NOT AVAILABLE</strong><span>Upload a replacement, save, and publish Website Graphics.</span></div>
        </div>
      </article>`;
    };

    $("#content").innerHTML = `
      <div class="v2-banner"><strong>Complete Graphics Asset Manager</strong><span>Every reusable website graphic now has its own protected upload slot.</span></div>
      <div class="graphics-manager-summary"><strong>${groups.reduce((n,g)=>n+g.items.length,0)} managed graphics</strong><span>Changing one asset does not overwrite unrelated cards or carousels.</span></div>
      ${groups.map((group,index)=>`<section class="panel graphics-category" data-graphics-category="${index}">
        <button class="graphics-category-head" type="button" aria-expanded="${index<3?'true':'false'}">
          <span><strong>${group.title}</strong><small>${group.note}</small></span><em>${group.items.length} graphics</em>
        </button>
        <div class="graphics-preview-grid" ${index<3?'':'hidden'}>${group.items.map(itemMarkup).join('')}</div>
      </section>`).join('')}
      <div class="panel sticky-graphics-publish"><div class="admin-actions form-actions"><button class="btn" id="saveAssets">Save Changes</button><button class="btn primary" id="publishAssets">Publish Website Graphics</button></div></div>`;

    $$(".graphics-category-head").forEach(button => button.onclick = () => {
      const grid = button.parentElement.querySelector(".graphics-preview-grid");
      const opening = grid.hasAttribute("hidden");
      grid.toggleAttribute("hidden", !opening);
      button.setAttribute("aria-expanded", opening ? "true" : "false");
    });

    $$("[data-graphic-preview]").forEach(image => {
      image.onerror = () => { image.hidden = true; image.nextElementSibling && (image.nextElementSibling.hidden = false); };
      image.onload = () => { image.hidden = false; image.nextElementSibling && (image.nextElementSibling.hidden = true); };
    });

    $$("[data-asset-key]").forEach(input => input.onchange = async () => {
      await queueAssetUpload(input);
      if (!input.files[0]) return;
      const image = $(`[data-graphic-preview="${input.dataset.assetKey}"]`);
      if (image) { image.src = URL.createObjectURL(input.files[0]); image.hidden = false; }
      if (image?.nextElementSibling) image.nextElementSibling.hidden = true;
    });

    $("#saveAssets").onclick = () => setStatus("Website Graphics draft saved locally. Publish when ready.","ok");
    $("#publishAssets").onclick = publish;
  };

  renderManager = function(section) {
    if (["players", "games", "seasons", "playlists"].includes(section)) {
      v141RenderPermanentManager(section);
      return;
    }
    priorRenderManagerV141(section);
  };
})();

/* V143 fixes */
(() => {
  "use strict";
  const previousRenderManagerV143 = renderManager;
  function mediaBackgroundPath(section) {
    const a=state?.data?.assets||{};
    const path = section==="games" ? (a.gameCardBackground||a.mediaBackground) : section==="seasons" ? (a.seasonCardBackground||a.mediaBackground) : section==="playlists" ? (a.playlistCardBackground||a.mediaBackground) : (a.mediaBackground||a.mediaCardBackground) || "generated/media-card-background.png";
    if (/^(blob:|data:|https?:)/i.test(String(path))) return path;
    return "../" + String(path).replace(/^\/+/, "");
  }
  function previewImageFor(section, item) {
    if (section === "players") {
      const path = item?.photo || state?.data?.assets?.playerSilhouette || "images/team/players/player-silhouette.png";
      if (/^(blob:|data:|https?:)/i.test(String(path))) return path;
      return "../" + String(path).replace(/^\/+/, "");
    }
    if (["games", "seasons", "playlists"].includes(section)) return mediaBackgroundPath(section);
    const path = item?.image || "images/logos/logo.png";
    if (/^(blob:|data:|https?:)/i.test(String(path))) return path;
    return "../" + String(path).replace(/^\/+/, "");
  }
  function drawSharedPreview(section, item, targetSelector) {
    const target = document.querySelector(targetSelector); if (!target) return;
    if (!item) { target.innerHTML = `<div class="empty-admin-preview"><strong>No item selected</strong><p>Select an item or click Preview to display its card.</p></div>`; return; }
    if (typeof window.ASGVisualPreview !== "function") { target.innerHTML = `<div class="empty-admin-preview"><strong>Preview renderer unavailable</strong><p>Refresh this Admin page to reload the shared card renderer.</p></div>`; return; }
    target.innerHTML = window.ASGVisualPreview(section, item, previewImageFor(section, item));
  }
  function renderSelectableManager(section) {
    state.section = section;
    const schema = SECTION_SCHEMAS[section], arr = state.data[schema.array] || [];
    const firstVisible = arr.findIndex(item => item.status !== "hidden");
    let selectedIndex = firstVisible >= 0 ? firstVisible : (arr.length ? 0 : -1);
    const labels = {players:"Player",games:"Game",seasons:"Season",playlists:"Playlist"}; const label=labels[section];
    $("#pageTitle").textContent = schema.title;
    $("#content").innerHTML = `<div class="v2-banner"><strong>Visual ${schema.title} Manager</strong><span>Click any row or Preview button to inspect the exact public website card.</span></div>
    <div class="admin-actions manager-actions"><button class="btn primary" id="addBtn">Add ${label}</button><button class="btn" id="publishBtn">Publish All Changes</button><button class="btn" id="previewBtn">Preview Draft</button><span class="pending" id="pendingLabel">${state.dirty?'Unpublished changes':''}</span></div>
    <div class="permanent-preview-layout"><div class="item-list permanent-manager-list" id="selectableManagerList">${arr.map((item,index)=>`<div class="item-row ${item.status==='hidden'?'is-hidden':''}" data-manager-row="${index}" tabindex="0" role="button"><div><div class="item-title">${esc(titleFor(item,section))}</div><div class="item-sub">${esc(subFor(item,section)||item.status||'')}</div></div><div class="row-actions"><button class="btn small" data-action="preview" data-index="${index}">Preview</button><button class="btn small" data-action="edit" data-index="${index}">Edit</button><button class="btn small" data-action="toggle" data-index="${index}">${item.status==='hidden'?'Restore':'Hide'}</button><button class="btn small danger" data-action="delete" data-index="${index}">Delete</button></div></div>`).join('')}</div>
    <aside class="visual-editor-preview permanent-card-preview"><div class="preview-toolbar"><div><span class="v2-pill">LIVE PREVIEW</span><h4>Selected ${label} Card</h4></div><div class="preview-device-switch"><button type="button" class="is-active" data-manager-device="desktop">Desktop</button><button type="button" data-manager-device="mobile">Mobile</button></div></div><div id="permanentCardPreview" class="live-card-preview"></div><p class="help preview-help">Games, seasons and playlists use the shared media-card background from Website Graphics.</p></aside></div>`;
    const draw=()=>{drawSharedPreview(section,arr[selectedIndex],"#permanentCardPreview"); $$('[data-manager-row]').forEach(row=>row.classList.toggle('is-selected',Number(row.dataset.managerRow)===selectedIndex));};
    const select=index=>{const next=Number(index); if(!Number.isInteger(next)||!arr[next])return; selectedIndex=next; draw();};
    $('#addBtn').onclick=()=>openForm(-1); $('#publishBtn').onclick=publish;
    $('#previewBtn').onclick=()=>{sessionStorage.setItem('asgPreviewMasterContent',JSON.stringify(state.data)); const pages={players:'team.html',games:'media.html',seasons:'media.html',playlists:'media.html'}; window.open('../'+pages[section]+'?adminPreview=1','_blank');};
    const list=$('#selectableManagerList');
    list.addEventListener('click',event=>{const actionButton=event.target.closest('[data-action]'); const row=event.target.closest('[data-manager-row]'); if(!row)return; const index=Number(actionButton?.dataset.index??row.dataset.managerRow); if(!actionButton||actionButton.dataset.action==='preview'){select(index);return;} event.stopPropagation(); if(actionButton.dataset.action==='edit'){select(index);openForm(index);return;} if(actionButton.dataset.action==='toggle'){arr[index].status=arr[index].status==='hidden'?'published':'hidden';markDirty();renderSelectableManager(section);return;} if(actionButton.dataset.action==='delete'&&confirm(`Permanently delete this ${label.toLowerCase()}? Hide is safer.`)){arr.splice(index,1);markDirty();renderSelectableManager(section);}});
    list.addEventListener('keydown',event=>{if(!['Enter',' '].includes(event.key)||event.target.closest('button'))return; const row=event.target.closest('[data-manager-row]'); if(!row)return; event.preventDefault();select(row.dataset.managerRow);});
    $$('[data-manager-device]').forEach(button=>button.onclick=()=>{$$('[data-manager-device]').forEach(item=>item.classList.toggle('is-active',item===button)); $('#permanentCardPreview').classList.toggle('mobile-preview',button.dataset.managerDevice==='mobile');});
    draw();
  }
  renderManager = function(section) {
    if (["players","games","seasons","playlists"].includes(section)) {renderSelectableManager(section);return;}
    previousRenderManagerV143(section);
    if(section==='news'){
      const arr=state.data.news||[], list=document.querySelector('.news-admin-list'), preview=document.querySelector('#permanentNewsPreview'); if(!list||!preview)return;
      let selectedIndex=[...list.querySelectorAll('[data-news-row]')].findIndex(row=>row.classList.contains('is-selected')); if(selectedIndex<0&&arr.length)selectedIndex=0;
      const drawNews=index=>{const next=Number(index);if(!Number.isInteger(next)||!arr[next])return;selectedIndex=next;preview.innerHTML=newsListPreview(arr[selectedIndex]);list.querySelectorAll('[data-news-row]').forEach(row=>row.classList.toggle('is-selected',Number(row.dataset.newsRow)===selectedIndex));};
      list.addEventListener('click',event=>{const row=event.target.closest('[data-news-row]');if(!row)return;const index=Number(row.dataset.newsRow);const edit=event.target.closest('[data-edit]'),toggle=event.target.closest('[data-toggle]'),remove=event.target.closest('[data-delete]');if(!edit&&!toggle&&!remove)drawNews(index);});
      list.querySelectorAll('[data-select]').forEach(button=>button.onclick=event=>{event.stopPropagation();drawNews(button.dataset.select);});
    }
  };
})();


/* ============================================================
   V144 — FIXED TWO-CARD NEWS EDITOR
   ============================================================ */
(() => {
  "use strict";

  const previousRenderManagerV144 = renderManager;

  function newsPreviewCard(item, imageSrc) {
    const status = item?.status || "published";
    const note = item?.imageNote || "No image note has been entered yet.";
    const summary = item?.summary || "No public description has been entered yet.";
    return `
      <article class="visual-card news-preview-card ${status === "hidden" ? "preview-hidden" : ""}">
        <div class="preview-news-image">
          <img src="${esc(imageSrc)}" alt="" onerror="this.onerror=null;this.src='../images/logos/logo.png'">
        </div>
        <div class="preview-news-copy">
          <small>${esc(item?.category || "NEWS")}</small>
          <strong>${esc(item?.title || "News Headline")}</strong>
          <div class="admin-image-note"><b>IMAGE NOTE:</b> ${esc(note)}</div>
          <p>${esc(summary)}</p>
          ${item?.link
            ? '<span class="preview-link">RELATED LINK ACTIVE</span>'
            : '<span class="preview-link is-disabled">NO RELATED LINK</span>'}
        </div>
        <span class="preview-visibility">${status === "hidden" ? "HIDDEN" : "VISIBLE"}</span>
      </article>`;
  }

  function fixedNewsItem(arr, index, defaults) {
    if (!arr[index]) {
      arr[index] = {
        id: defaults.id,
        title: defaults.title,
        category: defaults.category,
        imageNote: "",
        summary: "",
        link: "",
        status: "published",
        order: index + 1,
        image: defaults.image
      };
    }
    return arr[index];
  }

  function renderFixedNewsEditor() {
    state.section = "news";
    const arr = state.data.news = state.data.news || [];
    const latest = fixedNewsItem(arr, 0, {
      id: "news-1",
      title: "Latest news",
      category: "NEWS",
      image: "images/news/news-1.png"
    });
    const results = fixedNewsItem(arr, 1, {
      id: "news-2",
      title: "Match Results",
      category: "MATCH",
      image: "images/news/news-2.png"
    });

    $("#pageTitle").textContent = "News";
    $("#content").innerHTML = `
      <div class="v2-banner">
        <strong>Visual News Editor</strong>
        <span>Edit both public News cards together, just like Schedule & Standings.</span>
      </div>

      <div class="visual-page-editor news-two-card-editor">
        <div class="panel">
          ${[latest, results].map((item, index) => `
            <section class="fixed-news-editor-section" data-news-editor="${index}">
              <h3>${index === 0 ? "Latest News Card" : "Match Results Card"}</h3>
              <div class="form-grid">
                <div class="field full">
                  <label>Upload image</label>
                  <input type="file" accept="image/png,image/jpeg,image/webp" data-news-upload="${index}">
                  <div class="help">Current file: ${esc(item.image || "No image")}</div>
                </div>
                <div class="field">
                  <label>Headline</label>
                  <input data-news-field="${index}" data-key="title" value="${esc(item.title || "")}">
                </div>
                <div class="field">
                  <label>News type</label>
                  <select data-news-field="${index}" data-key="category">
                    ${["NEWS","MATCH","ANNOUNCEMENT","RESULT","TEAM UPDATE"].map(value =>
                      `<option value="${value}" ${item.category === value ? "selected" : ""}>${value}</option>`
                    ).join("")}
                  </select>
                </div>
                <div class="field full">
                  <label>Image note / what this flyer is</label>
                  <textarea data-news-field="${index}" data-key="imageNote">${esc(item.imageNote || "")}</textarea>
                </div>
                <div class="field full">
                  <label>Public description</label>
                  <textarea data-news-field="${index}" data-key="summary">${esc(item.summary || "")}</textarea>
                </div>
                <div class="field">
                  <label>Optional related URL</label>
                  <input type="url" data-news-field="${index}" data-key="link" value="${esc(item.link || "")}">
                </div>
                <div class="field">
                  <label>Visibility</label>
                  <select data-news-field="${index}" data-key="status">
                    <option value="published" ${item.status !== "hidden" ? "selected" : ""}>Visible</option>
                    <option value="hidden" ${item.status === "hidden" ? "selected" : ""}>Hidden</option>
                  </select>
                </div>
              </div>
            </section>
          `).join('<hr class="news-editor-divider">')}

          <div class="admin-actions form-actions">
            <button class="btn primary" id="publishNewsCards">Publish News</button>
            <button class="btn" id="previewNewsDraft">Preview Draft</button>
            <span class="pending" id="pendingLabel">${state.dirty ? "Unpublished changes" : ""}</span>
          </div>
        </div>

        <aside class="visual-editor-preview page-preview-column">
          <div class="preview-toolbar">
            <div><span class="v2-pill">LIVE PREVIEW</span><h4>News Page Cards</h4></div>
            <div class="preview-device-switch">
              <button type="button" class="is-active" data-news-stack-device="desktop">Desktop</button>
              <button type="button" data-news-stack-device="mobile">Mobile</button>
            </div>
          </div>
          <div id="newsStackPreview" class="stacked-card-preview news-stacked-preview"></div>
        </aside>
      </div>
    `;

    const previewUrls = [
      itemPreviewPath(latest.image),
      itemPreviewPath(results.image)
    ];

    function itemPreviewPath(path) {
      const value = String(path || "").trim();
      if (!value) return "../images/logos/logo.png";
      if (/^(blob:|data:|https?:)/i.test(value)) return value;
      return "../" + value.replace(/^\/+/, "");
    }

    const draw = () => {
      $("#newsStackPreview").innerHTML =
        newsPreviewCard(latest, previewUrls[0]) +
        newsPreviewCard(results, previewUrls[1]);
    };

    $$("[data-news-field]").forEach(input => {
      input.oninput = input.onchange = event => {
        const item = arr[Number(input.dataset.newsField)];
        item[input.dataset.key] = event.target.value;
        markDirty();
        draw();
      };
    });

    $$("[data-news-upload]").forEach(input => {
      input.onchange = async () => {
        const file = input.files[0];
        if (!file) return;
        const index = Number(input.dataset.newsUpload);
        const converted = await fileToPng(file);
        const path = `images/news/news-${index + 1}.png`;
        arr[index].image = path;
        state.pendingFiles = state.pendingFiles.filter(item => item.path !== path);
        state.pendingFiles.push({ path, base64: converted.base64 });
        previewUrls[index] = converted.url;
        markDirty();
        setStatus(`${index === 0 ? "Latest News" : "Match Results"} image ready to publish.`, "ok");
        draw();
      };
    });

    $("#publishNewsCards").onclick = publish;
    $("#previewNewsDraft").onclick = () => {
      sessionStorage.setItem("asgPreviewMasterContent", JSON.stringify(state.data));
      window.open("../news.html?adminPreview=1", "_blank");
    };

    $$("[data-news-stack-device]").forEach(button => {
      button.onclick = () => {
        $$("[data-news-stack-device]").forEach(item =>
          item.classList.toggle("is-active", item === button)
        );
        $("#newsStackPreview").classList.toggle(
          "mobile-preview",
          button.dataset.newsStackDevice === "mobile"
        );
      };
    });

    draw();
  }

  renderManager = function(section) {
    if (section === "news") {
      renderFixedNewsEditor();
      return;
    }
    previousRenderManagerV144(section);
  };
})();


/* ============================================================
   V146 — UNIFIED ADMIN WORKFLOW
   Save Changes | Preview Website | Publish | Cancel
   ============================================================ */
(() => {
  "use strict";

  const PAGE_PREVIEWS = {
    players: "team.html",
    games: "media.html",
    seasons: "media.html",
    playlists: "media.html",
    news: "news.html",
    schedule: "schedule.html",
    livestream: "livestream.html",
    graphics: "livestream.html"
  };

  let workflowBusy = false;

  function currentPage() {
    return document.body.dataset.page || "dashboard";
  }

  const PREVIEW_DB_NAME = "asg-admin-preview";
  const PREVIEW_DB_STORE = "pending-assets";

  function openPreviewDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(PREVIEW_DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(PREVIEW_DB_STORE)) {
          db.createObjectStore(PREVIEW_DB_STORE, { keyPath: "path" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Could not open preview storage."));
    });
  }

  async function savePendingAssetsToPreviewDb() {
    // V153: do not place large image data into sessionStorage or IndexedDB.
    // The preview tab reads these temporary assets directly from its opener.
    window.__ASG_PENDING_PREVIEW_ASSETS = Object.fromEntries(
      (state.pendingFiles || []).map(file => [
        String(file.path),
        `data:image/png;base64,${String(file.base64 || "")}`
      ])
    );
    return true;
  }

  async function clearPreviewDb() {
    try {
      const db = await openPreviewDb();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(PREVIEW_DB_STORE, "readwrite");
        tx.objectStore(PREVIEW_DB_STORE).clear();
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
      db.close();
    } catch (error) {
      console.warn("Could not clear preview database.", error);
    }
  }

  function cloneDraftMetadata(data) {
    return JSON.parse(JSON.stringify(data || {}));
  }

  function commitOpenForm() {
    const modal = document.querySelector("#editModal.open");
    const form = document.querySelector("#editForm");
    if (modal && form) {
      if (!form.reportValidity()) return false;
      form.requestSubmit();
    }

    const liveForm = document.querySelector("#liveForm");
    if (liveForm) {
      if (!liveForm.reportValidity()) return false;
      liveForm.requestSubmit();
    }
    return true;
  }

  async function saveDraft() {
    try {
      if (!commitOpenForm()) return false;
      const page = currentPage();
      const draft = cloneDraftMetadata(state.data);
      await savePendingAssetsToPreviewDb();
      sessionStorage.setItem("asgDraftMasterContent", JSON.stringify(state.data || {}));
      sessionStorage.setItem("asgPreviewMasterContent", JSON.stringify(draft));
      sessionStorage.setItem("asgDraftAdminPage", page);
      sessionStorage.removeItem("asgPreviewAssetsInIndexedDb");
      setStatus("Draft saved — not published.", "ok");
      const pending = document.querySelector("#pendingLabel") || document.querySelector("#workflowStatus");
      if (pending) pending.textContent = "Draft saved — not published";
      return true;
    } catch (error) {
      setStatus("Could not save draft: " + error.message, "bad");
      return false;
    }
  }

  async function previewWebsite() {
    if (!(await saveDraft())) return;
    const page = currentPage();
    const destination = PAGE_PREVIEWS[page] || "index.html";
    const opened = window.open(`../${destination}?adminPreview=1`, "_blank");
    if (!opened) {
      setStatus("Preview was blocked by the browser. Allow pop-ups and try again.", "bad");
      return;
    }
    setStatus(`Preview opened: ${destination}`, "ok");
  }

  async function publishDraft() {
    if (workflowBusy || !(await saveDraft())) return;
    workflowBusy = true;
    try {
      await publish();
      if (!state.dirty) {
        sessionStorage.removeItem("asgDraftMasterContent");
        sessionStorage.removeItem("asgPreviewMasterContent");
        sessionStorage.removeItem("asgDraftAdminPage");
        sessionStorage.removeItem("asgPreviewAssetsInIndexedDb");
        window.__ASG_PENDING_PREVIEW_ASSETS = {};
        await clearPreviewDb();
      }
    } catch (error) {
      setStatus("Publish failed: " + error.message, "bad");
    } finally {
      workflowBusy = false;
    }
  }

  async function cancelChanges() {
    const hasChanges =
      state.dirty ||
      (state.pendingFiles && state.pendingFiles.length) ||
      sessionStorage.getItem("asgDraftMasterContent");

    if (
      hasChanges &&
      !confirm("Discard all unpublished changes and return to the Dashboard?")
    ) return;

    sessionStorage.removeItem("asgDraftMasterContent");
    sessionStorage.removeItem("asgPreviewMasterContent");
    sessionStorage.removeItem("asgDraftAdminPage");
    sessionStorage.removeItem("asgPreviewAssetsInIndexedDb");
    window.__ASG_PENDING_PREVIEW_ASSETS = {};
    await clearPreviewDb();
    location.href = "dashboard.html";
  }

  function removeLegacyActions() {
    [
      "#publishBtn", "#previewBtn", "#publishSchedule", "#publishAssets",
      "#publishLive", "#publishNewsCards", "#previewNewsDraft"
    ].forEach(selector => document.querySelector(selector)?.remove());

    const liveSubmit = document.querySelector("#liveForm button[type='submit']");
    if (liveSubmit) liveSubmit.remove();

    document.querySelectorAll(".manager-actions, .form-actions").forEach(bar => {
      if (!bar.children.length || !bar.querySelector("button, label, .pending")) {
        bar.remove();
      }
    });
  }

  function injectWorkflowBar() {
    const page = currentPage();
    if (["dashboard", "backups"].includes(page)) return;

    const content = document.querySelector("#content");
    if (!content || content.querySelector("#unifiedWorkflowBar")) return;

    removeLegacyActions();

    const bar = document.createElement("div");
    bar.id = "unifiedWorkflowBar";
    bar.className = "admin-actions unified-workflow-bar";
    bar.innerHTML = `
      <button class="btn" id="workflowSave" type="button">Save Changes</button>
      <button class="btn" id="workflowPreview" type="button">Preview Website</button>
      <button class="btn primary" id="workflowPublish" type="button">Publish</button>
      <button class="btn danger-outline" id="workflowCancel" type="button">Cancel</button>
      <span class="pending" id="workflowStatus">${state.dirty ? "Unpublished changes" : "No unpublished changes"}</span>
    `;

    const banner = content.querySelector(".v2-banner");
    if (banner) banner.insertAdjacentElement("afterend", bar);
    else content.prepend(bar);

    bar.querySelector("#workflowSave").onclick = async event => { event.preventDefault(); await saveDraft(); };
    bar.querySelector("#workflowPreview").onclick = async event => { event.preventDefault(); await previewWebsite(); };
    bar.querySelector("#workflowPublish").onclick = async event => { event.preventDefault(); await publishDraft(); };
    bar.querySelector("#workflowCancel").onclick = async event => { event.preventDefault(); await cancelChanges(); };

    normalizeAdminPageLayout();
  }

  function buildGraphicsTopPreview(content, workflowBar) {
    if (currentPage() !== "graphics" || content.querySelector("#standardGraphicsPreview")) return;
    const sourceItems = [...content.querySelectorAll(".graphic-preview-item")];
    if (!sourceItems.length) return;

    const panel = document.createElement("aside");
    panel.id = "standardGraphicsPreview";
    panel.className = "visual-editor-preview standardized-top-preview graphics-top-preview";
    panel.innerHTML = `
      <div class="preview-toolbar">
        <div><span class="v2-pill">LIVE PREVIEW</span><h4>Website Graphics</h4></div>
      </div>
      <div class="graphics-top-preview-grid">
        ${sourceItems.map(item => {
          const label = item.querySelector("label")?.textContent || "Website graphic";
          const image = item.querySelector("[data-graphic-preview]");
          const key = image?.dataset.graphicPreview || "";
          const src = image?.getAttribute("src") || "";
          return `<article><strong>${label}</strong><div class="graphic-preview-box"><img data-top-graphic-preview="${key}" src="${src}" alt="${label}"></div></article>`;
        }).join("")}
      </div>
      <p class="help">These previews update immediately. The upload controls are below.</p>`;

    workflowBar.insertAdjacentElement("afterend", panel);

    content.querySelectorAll("[data-asset-key]").forEach(input => {
      input.addEventListener("change", () => {
        const file = input.files?.[0];
        const target = panel.querySelector(`[data-top-graphic-preview="${input.dataset.assetKey}"]`);
        if (file && target) target.src = URL.createObjectURL(file);
      });
    });
  }

  function normalizeAdminPageLayout() {
    const content = document.querySelector("#content");
    const bar = content?.querySelector("#unifiedWorkflowBar");
    if (!content || !bar) return;

    const page = currentPage();
    if (["dashboard", "backups"].includes(page)) return;

    const preview = content.querySelector(
      ".hero-live-preview-panel, .site-live-preview, .site-preview-shell, .visual-editor-preview"
    );

    if (preview && !preview.classList.contains("standardized-top-preview")) {
      preview.classList.add("standardized-top-preview");
      bar.insertAdjacentElement("afterend", preview);
    }

    buildGraphicsTopPreview(content, bar);

    const addButton = content.querySelector(
      "#addBtn, #addNewsBtn, .manager-actions #addBtn, [id^='add'][class*='btn']"
    );
    if (addButton) {
      const actionBar = addButton.closest(".admin-actions");
      const topPreview = content.querySelector(".standardized-top-preview");
      if (actionBar && topPreview && actionBar.previousElementSibling !== topPreview) {
        topPreview.insertAdjacentElement("afterend", actionBar);
      }
    }

    content.classList.add("standardized-admin-flow");
  }

  const observer = new MutationObserver(() => {
    clearTimeout(window.__asgWorkflowTimer);
    window.__asgWorkflowTimer = setTimeout(() => {
      injectWorkflowBar();
      normalizeAdminPageLayout();
    }, 0);
  });

  document.addEventListener("DOMContentLoaded", () => {
    const content = document.querySelector("#content");
    if (content) observer.observe(content, { childList: true, subtree: true });
    injectWorkflowBar();
  });

  window.ASGUnifiedWorkflow = {
    saveDraft,
    previewWebsite,
    publishDraft,
    cancelChanges,
    injectWorkflowBar
  };
})();

/* ============================================================
   V162 — PLAYER PHOTO D-PAD + FIT CONTROLS
   ============================================================ */
(() => {
  const priorOpenFormV162 = openForm;
  const clamp = (value,min,max) => Math.max(min,Math.min(max,Number(value)||0));

  function addPlayerPositionController(){
    if(state.section !== 'players') return;
    const form = document.querySelector('#editForm');
    if(!form || form.querySelector('.player-position-controller')) return;
    const details = form.querySelector('.advanced-box .form-grid');
    if(!details) return;
    const x = form.querySelector('[name="photoX"]');
    const y = form.querySelector('[name="photoY"]');
    const scale = form.querySelector('[name="photoScale"]');
    if(!x || !y || !scale) return;
    if(!String(scale.value).trim()) scale.value='90';
    if(!String(x.value).trim()) x.value='0';
    if(!String(y.value).trim()) y.value='0';

    const controller=document.createElement('section');
    controller.className='player-position-controller';
    controller.innerHTML=`<h5>Position player photo</h5>
      <div class="player-position-grid" aria-label="Move player photo">
        <button type="button" class="up" data-move-y="-2" aria-label="Move photo up">↑</button>
        <button type="button" class="left" data-move-x="-2" aria-label="Move photo left">←</button>
        <button type="button" class="reset" data-photo-reset aria-label="Reset photo position">●</button>
        <button type="button" class="right" data-move-x="2" aria-label="Move photo right">→</button>
        <button type="button" class="down" data-move-y="2" aria-label="Move photo down">↓</button>
      </div>
      <div class="player-zoom-controls">
        <button type="button" data-zoom="-5">Zoom −</button>
        <button type="button" data-photo-fit>Fit Player</button>
        <button type="button" data-zoom="5">Zoom +</button>
      </div>
      <div class="player-position-readout" aria-live="polite"></div>`;
    details.appendChild(controller);

    const emit = input => { input.dispatchEvent(new Event('input',{bubbles:true})); input.dispatchEvent(new Event('change',{bubbles:true})); };
    const updateReadout=()=>{controller.querySelector('.player-position-readout').textContent=`X ${x.value}% • Y ${y.value}% • Size ${scale.value}%`;};
    controller.querySelectorAll('[data-move-x]').forEach(btn=>btn.addEventListener('click',()=>{x.value=clamp(Number(x.value)+Number(btn.dataset.moveX),-50,50);emit(x);updateReadout();}));
    controller.querySelectorAll('[data-move-y]').forEach(btn=>btn.addEventListener('click',()=>{y.value=clamp(Number(y.value)+Number(btn.dataset.moveY),-50,50);emit(y);updateReadout();}));
    controller.querySelectorAll('[data-zoom]').forEach(btn=>btn.addEventListener('click',()=>{scale.value=clamp(Number(scale.value)+Number(btn.dataset.zoom),60,180);emit(scale);updateReadout();}));
    controller.querySelector('[data-photo-reset]').addEventListener('click',()=>{x.value=0;y.value=0;scale.value=90;[x,y,scale].forEach(emit);updateReadout();});
    controller.querySelector('[data-photo-fit]').addEventListener('click',()=>{x.value=0;y.value=0;scale.value=82;[x,y,scale].forEach(emit);updateReadout();});
    updateReadout();
  }

  openForm = function(index){
    priorOpenFormV162(index);
    requestAnimationFrame(addPlayerPositionController);
  };
})();
