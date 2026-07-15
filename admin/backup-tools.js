
window.ASGBackup=(()=>{
 const CONFIG={owner:'nepdogg',repo:'allstargalaxysoccer',branch:'main',index:'data/backup-index.json'};
 const files=['data/master-content.json','data/hero-rotation.json','data/site-settings.json'];
 const token=()=>sessionStorage.getItem('asgGithubToken')||'';
 const headers=()=>({'Accept':'application/vnd.github+json','Authorization':`Bearer ${token()}`,'X-GitHub-Api-Version':'2022-11-28'});
 const dec=s=>decodeURIComponent(escape(atob(s.replace(/\n/g,''))));
 const enc=s=>btoa(unescape(encodeURIComponent(s)));
 async function get(path){const r=await fetch(`https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${path}?ref=${CONFIG.branch}`,{headers:headers()});if(!r.ok)throw new Error(`${r.status}: ${await r.text()}`);return r.json()}
 async function put(path,content,message,sha){const body={message,content,branch:CONFIG.branch};if(sha)body.sha=sha;const r=await fetch(`https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${path}`,{method:'PUT',headers:{...headers(),'Content-Type':'application/json'},body:JSON.stringify(body)});if(!r.ok)throw new Error(`${r.status}: ${await r.text()}`);return r.json()}
 const stamp=()=>new Date().toISOString().replace(/[:.]/g,'-');
 async function index(){try{return JSON.parse(dec((await get(CONFIG.index)).content))}catch(e){return {version:1,backups:[]}}}
 async function saveIndex(data){let sha;try{sha=(await get(CONFIG.index)).sha}catch(e){}return put(CONFIG.index,enc(JSON.stringify(data,null,2)),'Backup Manager: update backup index',sha)}
 async function create(label='Automatic backup'){
   const id=stamp(),folder=`backups/${id}`,saved=[];
   for(const source of files){
     try{const f=await get(source),dest=`${folder}/${source.split('/').pop()}`;await put(dest,f.content,`Backup: ${source}`);saved.push({source,backup:dest})}catch(e){}
   }
   const idx=await index();idx.backups.unshift({id,label,created:new Date().toISOString(),files:saved});idx.backups=idx.backups.slice(0,50);await saveIndex(idx);return idx.backups[0]
 }
 async function restore(entry){
   for(const f of entry.files){
     const backup=await get(f.backup);let sha;try{sha=(await get(f.source)).sha}catch(e){}
     await put(f.source,backup.content,`Restore backup ${entry.id}: ${f.source}`,sha)
   }
 }
 return {create,index,restore,get,put,encode:enc,decode:dec};
})();
