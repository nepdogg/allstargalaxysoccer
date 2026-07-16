
(() => {
 "use strict";
 const URL='data/site-settings.json?v=139';
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
   document.querySelectorAll('footer').forEach(footerElement=>{
     const footer=s.footer||{};
     const socialRow=footerElement.querySelector('.footer-social-row');
     const social=socialRow?.querySelector('.footer-social');
     const leftLogo=socialRow?.querySelector('.footer-logo-left');
     const rightLogo=socialRow?.querySelector('.footer-logo-right');
     const legacySmall=footerElement.querySelector('.footer-small');
     if(!social || !leftLogo || !rightLogo || !legacySmall)return;

     const about=footer.showAboutLink!==false
       ? `<a class="footer-about-link" href="about.html">${footer.aboutLabel||'About'}</a>`
       : '';
     const admin=footer.showAdminLink!==false
       ? `<a class="footer-admin-link" href="${footer.adminHref||'admin/'}">${footer.adminLabel||'Admin'}</a>`
       : '';

     const platformName=footer.platformName||'Allstar Galaxy Platform';
     const platformVersion=footer.platformVersion||'v1.0';
     const platformBuild=footer.platformBuild||'139';
     const platform=footer.showPlatformVersion!==false
       ? `<span class="footer-platform-version">${platformName} ${platformVersion} <span>(Build ${platformBuild})</span></span>`
       : '';

     const creditText=footer.xitlaliCreditText||'Designed and Developed by Xitlali Media';
     const creditUrl=footer.xitlaliUrl||'https://xitlalimedia.com';
     const logoPath=footer.xitlaliLogo||'';
     const xitlaliLogo=logoPath
       ? `<img class="footer-xitlali-logo" src="${logoPath}" alt="Xitlali Media" loading="lazy" onerror="this.hidden=true;this.nextElementSibling.hidden=false">`
       : '';
     const xitlaliWordmark=`<span class="footer-xitlali-wordmark" ${logoPath?'hidden':''}>XM</span>`;
     const credit=footer.showXitlaliCredit!==false
       ? `<a class="footer-xitlali-credit" href="${creditUrl}" target="_blank" rel="noopener">${xitlaliLogo}${xitlaliWordmark}<span>${creditText}</span></a>`
       : '';

     footerElement.classList.add('footer-balanced-v139');
     footerElement.innerHTML=`
       <div class="footer-balanced-grid">
         <div class="footer-owner-side">
           <span class="footer-copyright">${footer.copyright||''}</span>
           ${leftLogo.outerHTML}
         </div>

         <div class="footer-center-side">
           ${social.outerHTML}
           <div class="footer-center-meta">
             ${about}
             ${about && platform ? '<span class="footer-meta-divider">•</span>' : ''}
             ${platform}
             ${(about || platform) && admin ? '<span class="footer-meta-divider">•</span>' : ''}
             ${admin}
           </div>
         </div>

         <div class="footer-credit-side">
           ${rightLogo.outerHTML}
           ${credit}
         </div>
       </div>`;
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
