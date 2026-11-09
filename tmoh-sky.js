/* Tmoh: cloud portal animation. Runs only on genuine entry from the welcome screen.
   Never touches student state, timers, navigation, assistant requests or cloud credentials. */
(function(){
 'use strict';
 let token=0;
 function flyIn(){
   if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
   document.querySelector('.tmoh-sky-portal')?.remove();
   const el=document.createElement('div');
   el.className='tmoh-sky-portal';el.setAttribute('aria-hidden','true');
   const cloud=(cls)=>`<span class="tmoh-portal-cloud ${cls}"></span>`;
   el.innerHTML='<div class="tmoh-portal-halo"></div>'+['one','two','three','four','five','six'].map(cloud).join('')+'<div class="tmoh-portal-glint">✦</div>';
   document.body.appendChild(el);
   const own=++token;
   const done=()=>{if(token===own){el.remove();document.body.classList.remove('tmoh-entering')}};
   document.body.classList.add('tmoh-entering');
   el.addEventListener('animationend',e=>{if(e.target===el)done()},{once:true});
   setTimeout(done,1400); // fallback for browsers that pause animation
 }
 window.TMOH_SKY=Object.freeze({flyIn});
})();
