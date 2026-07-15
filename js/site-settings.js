
(() => {
 "use strict";
 const URL='data/site-settings.json?v=134';
 const pageKey=()=>document.body.className.match(/page-([a-z-]+)/)?.[1]||'home';
 const getData=async()=>{
   if(new URLSearchParams(location.search).get('adminPreview')==='1'){
     try{const p=sessionStorage.getItem('asgPreviewSiteSettings');if(p)return JSON.parse(p)}catch(e){}
   }
   const r=await fetch(URL,{cache:'no-store'});if(!r.ok)throw new Error('site settings');return r.json()
 };
 const setImage=(sel,src)=>document.querySelectorAll(sel).forEach(img=>{if(src)img.src=src});
 function apply(s){
   window.ASG_SITE_SETTINGS=s;
   const key=pageKey()==='livestream'?'live':pageKey();
   const p=s.pages?.[key];
   if(p?.visible===false && !location.pathname.endsWith('404.html')){
     document.body.innerHTML='<main class="disabled-page"><h1>Page Temporarily Unavailable</h1><p>This page is currently hidden by the website manager.</p><a href="index.html">Return Home</a></main>';
     return;
   }
   if(p?.title)document.title=p.title;
   if(s.branding?.favicon){
     let icon=document.querySelector('link[rel="icon"]');if(icon)icon.href=s.branding.favicon;
   }
   setImage('.hero-logo img',s.branding?.leftLogo);
   setImage('.hero-logo-right img',s.branding?.rightLogo);
   setImage('.footer-logo img',s.branding?.leftLogo);
   document.documentElement.style.setProperty('--managed-accent',s.branding?.accentColor||'#ffd700');
   const nav=document.querySelector('.site-top nav');
   if(nav&&Array.isArray(s.navigation)){
     const current=location.pathname.split('/').pop()||'index.html';
     nav.innerHTML=[...s.navigation].filter(x=>x.visible!==false).sort((a,b)=>(a.order||0)-(b.order||0))
       .map(x=>`<a class="${current===x.href?'active':''}" href="${x.href}">${x.label}</a>`).join('');
   }
   const desc=document.querySelector('.carousel-section-description, .page-intro p, .special-page-copy p');
   if(desc&&p?.description)desc.textContent=p.description;
   const socialMap={youtube:'youtube',instagram:'instagram',facebook:'facebook',tiktok:'tiktok',x:'x'};
   Object.entries(socialMap).forEach(([k,name])=>{
     document.querySelectorAll(`.footer-social a[aria-label*="${name==='x'?' X':' '+name[0].toUpperCase()+name.slice(1)}"], .social-link-${name}`).forEach(a=>{
       if(s.social?.[k])a.href=s.social[k]; else a.style.display='none';
     });
   });
   document.querySelectorAll('.footer-email').forEach(a=>{a.href=`mailto:${s.social?.email||''}`;if(!s.social?.email)a.style.display='none'});
   document.querySelectorAll('.footer-small').forEach(el=>{
     const about=s.footer?.showAboutLink!==false?` <span aria-hidden="true" class="footer-divider">•</span> <a class="footer-about-link" href="about.html">${s.footer?.aboutLabel||'About'}</a>`:'';
     el.innerHTML=`${s.footer?.copyright||''}${about}`;
   });
   if(key==='home'&&Array.isArray(s.homeSections)){
     const main=document.querySelector('main');
     [...s.homeSections].sort((a,b)=>(a.order||0)-(b.order||0)).forEach(item=>{
       const el=document.querySelector(item.selector);
       if(!el)return;el.hidden=item.visible===false;if(main&&el.parentElement===main)main.appendChild(el);
     });
   }
 }
 document.addEventListener('DOMContentLoaded',()=>getData().then(apply).catch(console.error));
})();
