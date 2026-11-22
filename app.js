'use strict';
(() => {
  const badge=document.getElementById('networkStatus');
  let timer=null,sequence=0;
  async function check(){
    if(!badge)return;
    const id=++sequence,controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),4000);
    try{
      const response=await fetch('./manifest.json?__health='+Date.now(),{cache:'no-store',credentials:'same-origin',signal:controller.signal});
      const data=response.ok?await response.json():null;
      if(id!==sequence)return;
      const online=Boolean(data&&data.short_name==='Navaja 27');
      badge.className='status '+(online?'online':'offline');
      badge.querySelector('span').textContent=online?'Online':'Offline · contenido guardado';
    }catch(_){if(id===sequence){badge.className='status offline';badge.querySelector('span').textContent='Offline · contenido guardado';}}
    finally{clearTimeout(timeout);controller.abort();}
  }
  if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(console.warn),{once:true});
  check();window.addEventListener('online',check);window.addEventListener('offline',check);
  timer=setInterval(check,25000);
  window.addEventListener('pagehide',()=>{if(timer)clearInterval(timer);timer=null;});
})();