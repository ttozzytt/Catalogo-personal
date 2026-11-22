(() => {
 const img = {
  burger:'https://images.pexels.com/photos/109400/pexels-photo-109400.jpeg?auto=compress&cs=tinysrgb&w=900',
  cheese:'https://images.pexels.com/photos/9278698/pexels-photo-9278698.jpeg?auto=compress&cs=tinysrgb&w=900',
  grill:'https://images.pexels.com/photos/12880799/pexels-photo-12880799.jpeg?auto=compress&cs=tinysrgb&w=900',
  double:'https://images.pexels.com/photos/6111948/pexels-photo-6111948.jpeg?auto=compress&cs=tinysrgb&w=900',
  fries:'https://images.pexels.com/photos/11710525/pexels-photo-11710525.jpeg?auto=compress&cs=tinysrgb&w=900'
 };
 const products=[
  {id:'simple',name:'Hamburguesa simple',cat:'parrilla',price:30,desc:'Pan brioche, lechuga, carne de res a la parrilla, tomate y salsa de la casa. Incluye papas fritas.',img:img.burger,backup:'./media/hero.webp'},
  {id:'pacena',name:'Hamburguesa Paceña',cat:'parrilla',price:31,desc:'Pan brioche, lechuga, carne de res a la parrilla y chorrelana tradicional con un toque de cerveza.',img:img.cheese,backup:'./media/paceña.webp'},
  {id:'mani',name:'Hamburguesa picante de maní',cat:'parrilla',price:36,desc:'Carne a la parrilla, queso mozzarella y salsa picante de maní.',img:img.grill,backup:'./media/mani.webp',tag:'PICANTE'},
  {id:'maracuya',name:'Hamburguesa Maracuyá',cat:'parrilla',price:35,desc:'Carne de res a la parrilla, cebolla y salsa dulce de maracuyá.',img:img.double,backup:'./media/maracuya.webp'},
  {id:'bbq',name:'Hamburguesa a la barbacoa',cat:'parrilla',price:41,desc:'Carne a la parrilla, tocino, aros de cebolla sofritas y salsa barbacoa.',img:img.cheese,backup:'./media/barbacoa.webp'},
  {id:'pina-grill',name:'Hamburguesa piña grill',cat:'parrilla',price:46,desc:'Carne a la parrilla, piña grillada y queso mozzarella.',img:img.burger,backup:'./media/piña.webp'},
  {id:'simple-doble',name:'Simple Doble',cat:'dobles',price:41,desc:'Pan brioche, lechuga y doble porción de carne a la parrilla, tomate y salsa de la casa.',img:img.double,backup:'./media/doble.webp'},
  {id:'pacena-doble',name:'Paceña Doble',cat:'dobles',price:42,desc:'Doble porción de carne a la parrilla con chorrelana tradicional.',img:img.cheese,backup:'./media/paceña.webp'},
  {id:'maracuya-doble',name:'Maracuyá Doble',cat:'dobles',price:46,desc:'Doble porción de carne, cebolla y salsa dulce de maracuyá.',img:img.double,backup:'./media/maracuya.webp'},
  {id:'mani-doble',name:'Maní Doble',cat:'dobles',price:47,desc:'Doble porción de carne, queso mozzarella y salsa picante de maní.',img:img.grill,backup:'./media/mani.webp',tag:'PICANTE'},
  {id:'bbq-doble',name:'Barbacoa Doble',cat:'dobles',price:51,desc:'Doble porción de carne, tocino, aros de cebolla y salsa barbacoa.',img:img.cheese,backup:'./media/barbacoa.webp'},
  {id:'pina-doble',name:'Piña Doble',cat:'dobles',price:56,desc:'Doble porción de carne con piña grillada a la parrilla.',img:img.burger,backup:'./media/piña.webp'},
  {id:'simple-mixta',name:'Simple Mixta',cat:'mixtas',price:41,desc:'Hamburguesa simple acompañada de salchipapas.',img:img.double,backup:'./media/doble.webp'},
  {id:'pacena-mixta',name:'Paceña Mixta',cat:'mixtas',price:42,desc:'Hamburguesa paceña acompañada de salchipapas.',img:img.cheese,backup:'./media/paceña.webp'},
  {id:'mani-mixta',name:'Maní Mixta',cat:'mixtas',price:47,desc:'Hamburguesa picante de maní acompañada de salchipapas.',img:img.grill,backup:'./media/mani.webp',tag:'PICANTE'},
  {id:'maracuya-mixta',name:'Maracuyá Mixta',cat:'mixtas',price:46,desc:'Hamburguesa dulce de maracuyá acompañada de salchipapas.',img:img.double,backup:'./media/maracuya.webp'},
  {id:'bbq-mixta',name:'Barbacoa Mixta',cat:'mixtas',price:51,desc:'Hamburguesa barbacoa acompañada de salchipapas.',img:img.cheese,backup:'./media/barbacoa.webp'},
  {id:'pina-mixta',name:'Piña Mixta',cat:'mixtas',price:56,desc:'Hamburguesa piña grill acompañada de salchipapas.',img:img.burger,backup:'./media/piña.webp'},
  {id:'salchipapas',name:'Salchipapas',cat:'salchipapas',price:28,desc:'Papas fritas, salchicha, salsa de la casa y ketchup.',img:img.fries,backup:'./media/salchipapas.webp'}
 ];
 const grid=document.getElementById('foodGrid'),search=document.getElementById('searchInput'),bar=document.getElementById('cartBar'),count=document.getElementById('cartCount'),total=document.getElementById('cartTotal');
 let filter='todos';
 const storage='el-local-pedido-v1';
 let cart={};try{cart=JSON.parse(localStorage.getItem(storage)||'{}')||{}}catch(_){cart={};}
 const money=n=>'Bs '+n;
 function render(){
  const q=(search.value||'').toLocaleLowerCase('es');
  const items=products.filter(p=>(filter==='todos'||filter===p.cat)&&(p.name+' '+p.desc).toLocaleLowerCase('es').includes(q));
  grid.innerHTML=items.map(p=>'<article class="food-card"><img src="'+p.img+'" data-fallback="'+p.backup+'" alt="'+p.name+'" loading="lazy"><div class="food-body"><small>'+p.cat.toUpperCase()+(p.tag?' · '+p.tag:'')+'</small><h3>'+p.name+'</h3><p>'+p.desc+'</p><div class="food-foot"><strong>'+money(p.price)+'</strong><button type="button" data-add="'+p.id+'">Agregar +</button></div></div></article>').join('')||'<p>No encontramos ese antojo.</p>';
  updateCart();
 }
 function updateCart(){
  const n=Object.values(cart).reduce((a,b)=>a+b,0);
  const sum=products.reduce((a,p)=>a+p.price*(cart[p.id]||0),0);
  count.textContent=n+' '+(n===1?'producto':'productos');
  total.textContent=money(sum);
  bar.hidden=n===0;
  localStorage.setItem(storage,JSON.stringify(cart));
 }
 grid.addEventListener('error',e=>{
  const image=e.target;
  if(image instanceof HTMLImageElement && image.dataset.fallback && image.src!==new URL(image.dataset.fallback,location.href).href) image.src=image.dataset.fallback;
 },true);
 document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('[data-filter]').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');filter=b.dataset.filter;render();
 }));
 search.addEventListener('input',render);
 grid.addEventListener('click',e=>{
  const b=e.target.closest('[data-add]');if(!b)return;
  cart[b.dataset.add]=(cart[b.dataset.add]||0)+1;updateCart();b.textContent='Agregado ✓';
  setTimeout(()=>{if(b.isConnected)b.textContent='Agregar +'},900);
 });
 const modal=document.getElementById('orderModal'),lines=document.getElementById('orderLines');
 function showOrder(){
  const chosen=products.filter(p=>cart[p.id]);
  const sum=chosen.reduce((a,p)=>a+p.price*cart[p.id],0);
  lines.innerHTML=chosen.map(p=>'<div class="order-line"><span>'+cart[p.id]+' × '+p.name+'</span><span>'+money(p.price*cart[p.id])+'</span></div>').join('')+'<div class="order-line"><strong>Total</strong><strong>'+money(sum)+'</strong></div>';
  modal.hidden=false;
 }
 document.getElementById('showOrder').addEventListener('click',showOrder);
 document.getElementById('closeModal').addEventListener('click',()=>modal.hidden=true);
 modal.addEventListener('click',e=>{if(e.target===modal)modal.hidden=true;});
 document.getElementById('copyOrder').addEventListener('click',async()=>{
  const chosen=products.filter(p=>cart[p.id]);
  const sum=chosen.reduce((a,p)=>a+p.price*cart[p.id],0);
  const text='Pedido El Local\\n'+chosen.map(p=>cart[p.id]+' x '+p.name+' - Bs '+p.price*cart[p.id]).join('\\n')+'\\nTotal: Bs '+sum;
  try{await navigator.clipboard.writeText(text);document.getElementById('copyOrder').textContent='Copiado ✓';}
  catch(_){document.getElementById('copyOrder').textContent='No se pudo copiar';}
 });
 document.getElementById('clearOrder').addEventListener('click',()=>{cart={};updateCart();modal.hidden=true;render();});
 const st=document.getElementById('appStatus'),up=()=>st.textContent=navigator.onLine?'En línea':'Modo sin conexión';
 up();addEventListener('online',up);addEventListener('offline',up);
 if('serviceWorker'in navigator&&(location.protocol==='https:'||location.hostname==='localhost'))navigator.serviceWorker.register('./sw.js').catch(console.warn);
 render();
})();