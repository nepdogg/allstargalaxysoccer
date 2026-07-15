
(() => {
 const $=s=>document.querySelector(s);let entries=[];
 function status(m,t=''){const e=$('#statusbar');e.textContent=m;e.className='statusbar '+t}
 function render(){
  $('#pageTitle').textContent='Backup & Restore';
  $('#content').innerHTML=`<div class="v2-banner"><strong>Safety Center</strong><span>Every publish creates a dated backup of website content, hero settings and site settings.</span></div>
  <div class="admin-actions manager-actions"><button class="btn primary" id="create">Create Backup Now</button><button class="btn" id="refresh">Refresh History</button></div>
  <div class="panel"><h3>Backup History</h3><div class="backup-list">${entries.length?entries.map((b,i)=>`<article class="item-row"><div><div class="item-title">${new Date(b.created).toLocaleString()}</div><div class="item-sub">${b.label} • ${b.files.length} files</div></div><div class="row-actions"><button class="btn small" data-restore="${i}">Restore</button></div></article>`).join(''):'<p class="help">No backups yet. The first backup will be created before your next publish.</p>'}</div></div>`;
  $('#create').onclick=async()=>{status('Creating backup…');try{await window.ASGBackup.create('Manual backup');await load();status('Backup created.','ok')}catch(e){status('Backup failed: '+e.message,'bad')}};
  $('#refresh').onclick=load;
  document.querySelectorAll('[data-restore]').forEach(b=>b.onclick=async()=>{const e=entries[+b.dataset.restore];if(!confirm(`Restore backup from ${new Date(e.created).toLocaleString()}? A safety backup will be created first.`))return;status('Creating safety backup and restoring…');try{await window.ASGBackup.create('Before restore');await window.ASGBackup.restore(e);status('Backup restored. GitHub Pages will update shortly.','ok')}catch(err){status('Restore failed: '+err.message,'bad')}})
 }
 async function load(){try{entries=(await window.ASGBackup.index()).backups||[];render()}catch(e){status('Could not load backup history: '+e.message,'bad')}}
 document.addEventListener('DOMContentLoaded',()=>{$('#menuBtn').onclick=()=>document.querySelector('.admin-sidebar').classList.toggle('open');$('#logoutBtn').onclick=()=>{sessionStorage.removeItem('asgGithubToken');location.href='index.html'};load()})
})();
