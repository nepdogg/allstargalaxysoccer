
window.ASGBackup=(()=>{
 const CONFIG={owner:'nepdogg',repo:'allstargalaxysoccer',branch:'main',index:'data/backup-index.json'};
 const files=['data/master-content.json','data/hero-rotation.json','data/site-settings.json'];
 const token=()=>sessionStorage.getItem('asgGithubToken')||'';
 const headers=()=>({'Accept':'application/vnd.github+json','Authorization':`Bearer ${token()}`,'X-GitHub-Api-Version':'2022-11-28'});
 const dec=s=>decodeURIComponent(escape(atob(String(s||'').replace(/\n/g,''))));
 const enc=s=>btoa(unescape(encodeURIComponent(s)));
 const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

 async function get(path){
   const r=await fetch(`https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${path}?ref=${CONFIG.branch}&_=${Date.now()}`,{headers:headers()});
   if(!r.ok){const error=new Error(`${r.status}: ${await r.text()}`);error.status=r.status;throw error}
   return r.json();
 }
 async function put(path,content,message,sha){
   const body={message,content,branch:CONFIG.branch};if(sha)body.sha=sha;
   const r=await fetch(`https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/contents/${path}`,{
     method:'PUT',headers:{...headers(),'Content-Type':'application/json'},body:JSON.stringify(body)
   });
   if(!r.ok){const error=new Error(`${r.status}: ${await r.text()}`);error.status=r.status;throw error}
   return r.json();
 }
 const stamp=()=>new Date().toISOString().replace(/[:.]/g,'-');

 async function readIndexWithSha(){
   try{
     const file=await get(CONFIG.index);
     const data=JSON.parse(dec(file.content));
     data.backups=Array.isArray(data.backups)?data.backups:[];
     data.history=Array.isArray(data.history)?data.history:[...data.backups];
     return {data,sha:file.sha}
   }catch(error){
     if(error.status===404||String(error.message).startsWith('404:')){
       return {data:{version:2,backups:[],history:[]},sha:undefined}
     }
     throw error
   }
 }

 async function index(){return (await readIndexWithSha()).data}

 async function appendHistory(entry){
   let lastError;
   for(let attempt=1;attempt<=5;attempt++){
     try{
       const latest=await readIndexWithSha();
       const data=latest.data||{version:2,backups:[],history:[]};
       data.version=2;
       data.backups=Array.isArray(data.backups)?data.backups:[];
       data.history=Array.isArray(data.history)?data.history:[...data.backups];

       data.history=data.history.filter(item=>item&&item.id!==entry.id);
       data.history.unshift(entry);
       data.history=data.history.slice(0,250);

       if(entry.type!=='restore'){
         data.backups=data.backups.filter(item=>item&&item.id!==entry.id);
         data.backups.unshift(entry);
         data.backups=data.backups.slice(0,200);
       }

       await put(CONFIG.index,enc(JSON.stringify(data,null,2)),'Backup Manager: update complete history',latest.sha);
       return entry;
     }catch(error){
       lastError=error;
       const conflict=error.status===409||String(error.message).startsWith('409:');
       if(!conflict||attempt===5)throw error;
       await sleep(350*attempt)
     }
   }
   throw lastError
 }

 async function create(label='Automatic backup'){
   const id=stamp(),folder=`backups/${id}`,saved=[];
   for(const source of files){
     try{
       const f=await get(source),dest=`${folder}/${source.split('/').pop()}`;
       await put(dest,f.content,`Backup: ${source}`);
       saved.push({source,backup:dest})
     }catch(error){console.warn('Backup skipped for',source,error)}
   }
   const entry={id,type:'backup',label,created:new Date().toISOString(),files:saved};
   await appendHistory(entry);
   return entry
 }

 async function restore(entry){
   const safety=await create(`Safety backup before restoring ${entry.id}`);
   for(const f of entry.files||[]){
     const backup=await get(f.backup);let sha;
     try{sha=(await get(f.source)).sha}catch(e){}
     await put(f.source,backup.content,`Restore backup ${entry.id}: ${f.source}`,sha)
   }
   await appendHistory({
     id:`restore-${stamp()}`,
     type:'restore',
     label:`Restored backup from ${new Date(entry.created).toLocaleString()}`,
     created:new Date().toISOString(),
     sourceBackupId:entry.id,
     safetyBackupId:safety.id,
     files:entry.files||[]
   });
 }

 return {create,index,restore,get,put,encode:enc,decode:dec};
})();
