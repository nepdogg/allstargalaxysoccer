
window.ASGBackup=(()=>{
 const CONFIG={owner:'nepdogg',repo:'allstargalaxysoccer',branch:'main',index:'data/backup-index.json'};
 const files=['data/master-content.json','data/hero-rotation.json','data/site-settings.json'];
 const token=()=>sessionStorage.getItem('asgGithubToken')||'';
 const headers=()=>({'Accept':'application/vnd.github+json','Authorization':`Bearer ${token()}`,'X-GitHub-Api-Version':'2022-11-28'});
 const dec=s=>decodeURIComponent(escape(atob(String(s||'').replace(/\n/g,''))));
 const enc=s=>btoa(unescape(encodeURIComponent(s)));
 const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

 async function get(path){
   const r=await fetch(`https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${path}?ref=${CONFIG.branch}&_=${Date.now()}`,{
     headers:{...headers(),'Cache-Control':'no-cache'}
   });
   if(!r.ok)throw new Error(`${r.status}: ${await r.text()}`);
   return r.json();
 }

 async function put(path,content,message,sha){
   const body={message,content,branch:CONFIG.branch};
   if(sha)body.sha=sha;
   const r=await fetch(`https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${path}`,{
     method:'PUT',
     headers:{...headers(),'Content-Type':'application/json'},
     body:JSON.stringify(body)
   });
   if(!r.ok){
     const text=await r.text();
     const error=new Error(`${r.status}: ${text}`);
     error.status=r.status;
     throw error;
   }
   return r.json();
 }

 const stamp=()=>new Date().toISOString().replace(/[:.]/g,'-');

 async function readIndexWithSha(){
   try{
     const file=await get(CONFIG.index);
     return {
       data:JSON.parse(dec(file.content)),
       sha:file.sha
     };
   }catch(error){
     if(String(error.message).startsWith('404:')){
       return {data:{version:1,backups:[]},sha:undefined};
     }
     throw error;
   }
 }

 async function index(){
   try{return (await readIndexWithSha()).data}
   catch(e){return {version:1,backups:[]}}
 }

 async function appendBackupEntry(entry){
   let lastError;
   for(let attempt=1;attempt<=4;attempt++){
     try{
       const latest=await readIndexWithSha();
       const idx=latest.data&&typeof latest.data==='object'?latest.data:{version:1,backups:[]};
       idx.version=idx.version||1;
       idx.backups=Array.isArray(idx.backups)?idx.backups:[];

       // Merge safely and prevent duplicate entries if a retry occurs.
       idx.backups=idx.backups.filter(item=>item&&item.id!==entry.id);
       idx.backups.unshift(entry);
       idx.backups=idx.backups.slice(0,50);

       await put(
         CONFIG.index,
         enc(JSON.stringify(idx,null,2)),
         'Backup Manager: update backup index',
         latest.sha
       );
       return entry;
     }catch(error){
       lastError=error;
       const conflict=error.status===409||String(error.message).startsWith('409:');
       if(!conflict||attempt===4)throw error;
       await sleep(300*attempt);
     }
   }
   throw lastError;
 }

 async function create(label='Automatic backup'){
   const id=stamp(),folder=`backups/${id}`,saved=[];
   for(const source of files){
     try{
       const f=await get(source);
       const dest=`${folder}/${source.split('/').pop()}`;
       await put(dest,f.content,`Backup: ${source}`);
       saved.push({source,backup:dest});
     }catch(e){
       console.warn('Backup skipped for',source,e);
     }
   }

   const entry={id,label,created:new Date().toISOString(),files:saved};
   await appendBackupEntry(entry);
   return entry;
 }

 async function restore(entry){
   for(const f of entry.files){
     const backup=await get(f.backup);
     let sha;
     try{sha=(await get(f.source)).sha}catch(e){}
     await put(f.source,backup.content,`Restore backup ${entry.id}: ${f.source}`,sha);
   }
 }

 return {create,index,restore,get,put,encode:enc,decode:dec};
})();
