(() => {
 const services=[
  {name:'Corte con máquina y tijera',cat:'cabello',price:'Bs 120',time:'45–60 min',desc:'Corte con máquina y tijera.',img:'https://static.tildacdn.one/tild3162-3235-4863-a132-653231326332/_DSC0233.JPEG'},
  {name:'Corte con tijera',cat:'cabello',price:'Bs 140',time:'60–90 min',desc:'Servicio de corte trabajado con tijera.',img:'https://static.tildacdn.one/tild3739-3332-4730-a165-316231336230/_DSC0062.JPEG'},
  {name:'Corte y cuidado de barba',cat:'barba',price:'Bs 70',time:'15–30 min',desc:'Corte y cuidado de barba según el menú publicado.',img:'https://static.tildacdn.one/tild3739-3332-4730-a165-316231336230/_DSC0062.JPEG'},
  {name:'Peinado',cat:'cabello',price:'Bs 50',time:'15–30 min',desc:'Peinado y acabado.',img:'https://static.tildacdn.one/tild3162-3235-4863-a132-653231326332/_DSC0233.JPEG'},
  {name:'Marcado de cejas',cat:'cuidado',price:'Bs 40',time:'20 min',desc:'Marcado y perfilado de cejas.',img:'https://static.tildacdn.one/tild3739-3332-4730-a165-316231336230/_DSC0062.JPEG'},
  {name:'Color en pelo y barba',cat:'cuidado',price:'Desde Bs 50',time:'Consultar',desc:'Servicio de color para pelo y barba.',img:'https://static.tildacdn.one/tild3162-3235-4863-a132-653231326332/_DSC0233.JPEG'},
  {name:'Corte con diseño',cat:'cabello',price:'Desde Bs 150',time:'45–60 min',desc:'Corte con diseño personalizado.',img:'https://static.tildacdn.one/tild3739-3332-4730-a165-316231336230/_DSC0062.JPEG'},
  {name:'Exfoliaciones',cat:'cuidado',price:'Desde Bs 50',time:'15–45 min',desc:'Servicio de exfoliación.',img:'https://static.tildacdn.one/tild3162-3235-4863-a132-653231326332/_DSC0233.JPEG'}
 ];
 const grid=document.getElementById('serviceGrid'),search=document.getElementById('searchInput');let filter='todos';
 function render(){const q=search.value.toLowerCase();const a=services.filter(s=>(filter==='todos'||s.cat===filter)&&(s.name+' '+s.desc).toLowerCase().includes(q));grid.innerHTML=a.map(s=>'<article class="service-card"><img src="'+s.img+'" alt="'+s.name+'" loading="lazy"><div class="service-body"><h3>'+s.name+'</h3><p>'+s.desc+'</p><div class="service-foot"><strong>'+s.price+'</strong><small>'+s.time+'</small></div></div></article>').join('')||'<p>No hay servicios que coincidan.</p>'}
 document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-filter]').forEach(x=>x.classList.remove('active'));b.classList.add('active');filter=b.dataset.filter;render()}));search.addEventListener('input',render);render();
 const st=document.getElementById('appStatus'),up=()=>st.textContent=navigator.onLine?'En línea':'Modo sin conexión';up();addEventListener('online',up);addEventListener('offline',up);if('serviceWorker'in navigator&&(location.protocol==='https:'||location.hostname==='localhost'))navigator.serviceWorker.register('./sw.js').catch(console.warn);
})();