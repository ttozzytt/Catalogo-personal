(() => {
  const services=[
    {name:'Corte clásico',category:'cabello',price:25,time:'35 min',desc:'Corte tradicional con laterales limpios y acabado a tu gusto.',image:'https://raw.githubusercontent.com/ttozzytt/baber/main/proyecto-personal/fase-ui-pwa/imagenes/barber-hero.webp'},
    {name:'Corte con degradado',category:'cabello',price:30,time:'45 min',desc:'Transición progresiva en laterales y nuca, con definición arriba.',image:'https://raw.githubusercontent.com/ttozzytt/baber/main/proyecto-personal/fase-ui-pwa/imagenes/corte-degradado.webp'},
    {name:'Corte infantil',category:'cabello',price:20,time:'30 min',desc:'Un acabado cómodo y limpio para los más pequeños.',image:'https://raw.githubusercontent.com/ttozzytt/baber/main/proyecto-personal/fase-ui-pwa/imagenes/corte-infantil.webp'},
    {name:'Barba más diseño',category:'barba',price:25,time:'30 min',desc:'Perfilado de barba y definición de líneas.',image:'https://raw.githubusercontent.com/ttozzytt/baber/main/proyecto-personal/fase-ui-pwa/imagenes/barba-diseno.webp'},
    {name:'Corte más barba',category:'combos',price:50,time:'65 min',desc:'Servicio combinado de cabello y barba.',image:'https://raw.githubusercontent.com/ttozzytt/baber/main/proyecto-personal/fase-ui-pwa/imagenes/corte-barba.webp'},
    {name:'Depilación con hilo',category:'cejas',price:25,time:'20 min',desc:'Limpieza y definición del contorno de las cejas.',image:'https://raw.githubusercontent.com/ttozzytt/baber/main/proyecto-personal/fase-ui-pwa/imagenes/cejas-hilo.webp'},
    {name:'Perfilación y diseño',category:'cejas',price:20,time:'25 min',desc:'Diseño de cejas adaptado a la forma del rostro.',image:'https://raw.githubusercontent.com/ttozzytt/baber/main/proyecto-personal/fase-ui-pwa/imagenes/cejas-diseno.webp'},
    {name:'Experiencia VIP',category:'combos',price:null,time:'75 min',desc:'Cuidado premium y detalles especiales. Consultar precio.',image:'https://raw.githubusercontent.com/ttozzytt/baber/main/proyecto-personal/fase-ui-pwa/imagenes/experiencia-vip.webp'}
  ];
  const grid=document.getElementById('serviceGrid'), search=document.getElementById('searchInput'), note=document.getElementById('selectionNote');
  let filter='todos', selected='';
  const money=v=>v===null?'Consultar':'Bs '+v;
  function render(){const q=(search.value||'').toLowerCase();const items=services.filter(s=>(filter==='todos'||s.category===filter)&&(s.name+' '+s.desc).toLowerCase().includes(q));grid.innerHTML=items.map(s=>'<article class=\"service-card '+(selected===s.name?'selected':'')+'\"><img src=\"'+s.image+'\" alt=\"'+s.name+'\" loading=\"lazy\"><div class=\"service-body\"><small>'+s.category.toUpperCase()+' · '+s.time+'</small><h3>'+s.name+'</h3><p>'+s.desc+'</p><div class=\"service-bottom\"><strong>'+money(s.price)+'</strong><button type=\"button\" data-select=\"'+s.name+'\">'+(selected===s.name?'Seleccionado':'Elegir servicio')+'</button></div></div></article>').join('')||'<p>No hay servicios con ese nombre.</p>';}
  document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-filter]').forEach(x=>x.classList.remove('active'));b.classList.add('active');filter=b.dataset.filter;render()}));
  grid.addEventListener('click',e=>{const b=e.target.closest('[data-select]');if(!b)return;selected=b.dataset.select;note.textContent='Servicio seleccionado: '+selected+'. Coordina el turno directamente con Navaja 27.';render()});
  search.addEventListener('input',render);render();
  const status=document.getElementById('appStatus');const update=()=>status.textContent=navigator.onLine?'En línea':'Modo sin conexión';update();window.addEventListener('online',update);window.addEventListener('offline',update);
  if('serviceWorker' in navigator && (location.protocol==='https:'||location.hostname==='localhost'))navigator.serviceWorker.register('./sw.js').catch(console.warn);
})();