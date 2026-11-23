'use strict';
(() => {
  const $=id=>document.getElementById(id),STORE='antojitos';
  const state={products:[],filter:'todos',view:'inicio',cart:{},note:'',visibleCount:8,profile:null,orders:[],mode:'Retiro en local',pending:null,expiresAt:0,timer:null,cloud:null};
  const node=(tag,text,cls)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=String(text);if(cls)el.className=cls;return el;};
  function toast(message,type){const el=$('toast');el.textContent=message;el.className='toast show'+(type?' '+type:'');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.className='toast',3200);}
  function status(s,label){$('networkStatus').dataset.state=s;$('networkStatus').querySelector('b').textContent=label;}
  function money(v){return v===null||v===undefined?'':'Bs '+Number(v).toLocaleString('es-BO',{minimumFractionDigits:0,maximumFractionDigits:2});}
  function count(){return Object.values(state.cart).reduce((a,b)=>a+Number(b||0),0);}
  function total(){const rows=selectedProducts();if(rows.some(p=>p.price===null||p.price===undefined))return null;return rows.reduce((sum,p)=>sum+Number(p.price)*(state.cart[p.id]||0),0);}
  function selectedProducts(){return state.products.filter(p=>state.cart[p.id]);}
  function updateBadge(){const n=count();$('cartBadge').textContent=n;$('mobileCartBadge').textContent=n;}
  async function saveCartState(){try{await state.cloud.saveUserState(STORE,'cart',{quantities:state.cart,note:state.note,mode:state.mode});}catch(error){toast('No se pudo sincronizar el carrito: '+error.message,'error');}}
  function mapProduct(row){const s=row.specs||{};return{id:row.item_code,name:row.name,category:row.category,price:row.price===null?null:Number(row.price),priceLabel:money(row.price),description:row.description||'',image:row.image_url||'',imageAlt:row.image_alt||row.name,fallback:s.fallback||''};}
  function foodPlaceholder(category){
    const art={
      hamburguesas:'<ellipse cx="320" cy="340" rx="210" ry="24" fill="#4d281d" opacity=".13"/><path d="M145 236Q145 92 320 92t175 144Z" fill="#d99643" stroke="#9b5725" stroke-width="12"/><g fill="#ffdf9b"><ellipse cx="250" cy="145" rx="8" ry="4"/><ellipse cx="320" cy="126" rx="8" ry="4"/><ellipse cx="390" cy="150" rx="8" ry="4"/><ellipse cx="285" cy="184" rx="7" ry="4"/><ellipse cx="355" cy="182" rx="7" ry="4"/></g><path d="M142 235q30-26 58 0t58 0t58 0t58 0t58 0t58 0t30 0v28H142Z" fill="#70a84b"/><path d="M150 263h340l-28 33H178Z" fill="#f3c64e"/><path d="M158 292h324v38H158Z" rx="18" fill="#633321"/><path d="M165 330h310q-12 42-155 42t-155-42Z" fill="#d99643"/>',
      choripanes:'<ellipse cx="320" cy="332" rx="230" ry="28" fill="#4d281d" opacity=".13"/><path d="M110 248Q180 126 330 155q145 27 201 135l-35 45q-175 32-355-32Z" fill="#dca04d" stroke="#a35b2b" stroke-width="10"/><path d="M145 246q145-81 339 8l-25 48q-175-47-298 5Z" fill="#b9442f"/><path d="M150 232q150-73 315 7" fill="none" stroke="#7e2f23" stroke-width="18" stroke-linecap="round"/><path d="M160 272q138-42 295 5" fill="none" stroke="#f4cf69" stroke-width="12" stroke-linecap="round"/>',
      'hot-dogs':'<ellipse cx="320" cy="335" rx="222" ry="26" fill="#4d281d" opacity=".13"/><path d="M105 252Q148 164 320 154t215 98q-22 95-214 96T105 252Z" fill="#e0a14d" stroke="#a35b2b" stroke-width="10"/><path d="M128 245q190-92 385 0l-22 60q-176 48-341-4Z" fill="#b83b2c" stroke="#873020" stroke-width="8"/><path d="M170 244q150-57 289-1" fill="none" stroke="#f2d66b" stroke-width="14" stroke-linecap="round"/><path d="M184 270q120 43 240 0" fill="none" stroke="#e8ae49" stroke-width="8" stroke-linecap="round"/>',
      salchipapas:'<path d="M145 190h350l-42 158q-130 64-266 0Z" fill="#c86c32" stroke="#7b3d24" stroke-width="12"/><path d="M174 216l42-94 24 9-26 104M238 208l22-115 26 5-14 114M303 206l5-126 28 2 5 126M365 209l-10-110 26-5 17 114M426 221l-34-94 23-12 47 92" stroke="#f1c45b" stroke-width="24" stroke-linecap="round"/><g fill="#b94a39"><rect x="194" y="238" width="70" height="26" rx="13" transform="rotate(18 194 238)"/><rect x="300" y="270" width="78" height="26" rx="13" transform="rotate(-12 300 270)"/><rect x="382" y="237" width="70" height="26" rx="13" transform="rotate(18 382 237)"/></g>',
      parrillitas:'<ellipse cx="320" cy="320" rx="224" ry="34" fill="#4d281d" opacity=".13"/><ellipse cx="320" cy="258" rx="218" ry="105" fill="#663b2b"/><ellipse cx="320" cy="248" rx="194" ry="82" fill="#f0d7a9"/><path d="M190 220q75-58 143 0t115 0" fill="none" stroke="#a8462c" stroke-width="42" stroke-linecap="round"/><path d="M205 277l165-45M230 305l160-48M320 178l75 124" stroke="#5b2d24" stroke-width="10" stroke-linecap="round"/><g fill="#e0a340"><rect x="415" y="220" width="20" height="80" rx="8" transform="rotate(18 415 220)"/><rect x="450" y="225" width="20" height="80" rx="8" transform="rotate(18 450 225)"/></g>',
      bebidas:'<ellipse cx="320" cy="350" rx="120" ry="18" fill="#4d281d" opacity=".13"/><path d="M255 105h130l-10 210q-55 32-110 0Z" fill="#df9e35" stroke="#9b5725" stroke-width="12"/><rect x="274" y="175" width="92" height="72" rx="12" fill="#fff2d4"/><path d="M278 86h84v34h-84Z" fill="#f1d5a5" stroke="#9b5725" stroke-width="10"/><path d="M294 202q26-28 52 0t0 30" fill="none" stroke="#b9442f" stroke-width="12" stroke-linecap="round"/>'
    };
    const drawing=art[category]||art.hamburguesas;
    const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 420"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#fff2df"/><stop offset="1" stop-color="#f3d6b5"/></linearGradient></defs><rect width="640" height="420" rx="30" fill="url(#bg)"/>'+drawing+'<text x="320" y="395" text-anchor="middle" font-family="Arial,sans-serif" font-size="18" font-weight="700" letter-spacing="5" fill="#8f3925">ANTOJITOS</text></svg>';
    return 'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(svg);
  }
  function setView(name){
    const target=$('view-'+name);if(!target)return;document.querySelectorAll('.view').forEach(v=>{v.hidden=true;v.classList.remove('active');});
    target.hidden=false;target.classList.add('active');document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
    state.view=name;if(location.hash!=='#'+name)history.replaceState(null,'','#'+name);
    if(name==='pedido')renderOrder();if(name==='cuenta')renderProfile();if(name==='checkout')renderCheckoutSummary();if(name==='historial')renderHistory();
  }
  document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
  document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.go)));
  async function loadProducts(){
    const data=await state.cloud.items(STORE);state.products=data.map(mapProduct);renderProducts();if(state.view==='pedido')renderOrder();
  }
  function renderProducts(){
    const grid=$('productGrid'),query=$('productSearch').value.trim().toLocaleLowerCase('es');grid.replaceChildren();
    const rows=state.products.filter(p=>(state.filter==='todos'||p.category===state.filter)&&(p.name+' '+p.description+' '+p.category).toLocaleLowerCase('es').includes(query));
    if(!rows.length){grid.append(node('p','No hay productos con ese criterio.','empty-state'));$('showMore').hidden=true;return;}
    rows.slice(0,state.visibleCount).forEach(p=>{
      const card=node('article',undefined,'food-card'),media=node('div',undefined,'food-media'),img=node('img');img.src=p.image;img.alt=p.imageAlt;img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';img.width=640;img.height=420;
      img.addEventListener('error',()=>{img.src=foodPlaceholder(p.category);img.alt=p.name+' · ilustración local';img.classList.add('image-fallback');},{once:true});
      media.append(img);
      const body=node('div',undefined,'food-body');body.append(node('small',p.category.toUpperCase()),node('h3',p.name),node('p',p.description));
      const foot=node('div',undefined,'food-foot'),price=node('strong',money(p.price)),button=node('button',state.cart[p.id]?'Añadir otro +':'Agregar +');button.type='button';
      button.addEventListener('click',async()=>{state.cart[p.id]=(state.cart[p.id]||0)+1;updateBadge();button.textContent='Agregado ✓';await saveCartState();toast(p.name+' agregado al pedido.');});
      foot.append(price,button);body.append(foot);card.append(media,body);grid.append(card);
    });
    const more=$('showMore');more.hidden=rows.length<=state.visibleCount;more.textContent='Mostrar '+Math.min(8,rows.length-state.visibleCount)+' productos más · '+rows.length+' en total';
  }
  function renderOrder(){
    const list=$('orderLines');list.replaceChildren();const rows=selectedProducts();
    if(!rows.length)list.append(node('p','Todavía no agregaste productos.','empty-state'));
    rows.forEach(p=>{
      const row=node('article',undefined,'order-row'),info=node('div');info.append(node('strong',p.name),node('small',p.price===null?state.cart[p.id]+' unidad(es)':money(p.price)+' por unidad · Subtotal '+money(p.price*state.cart[p.id])));
      const controls=node('div',undefined,'quantity-controls'),minus=node('button','−'),qty=node('b',state.cart[p.id]),plus=node('button','+');minus.type=plus.type='button';
      minus.setAttribute('aria-label','Quitar una unidad de '+p.name);plus.setAttribute('aria-label','Agregar una unidad de '+p.name);
      minus.addEventListener('click',async()=>{state.cart[p.id]--;if(state.cart[p.id]<=0)delete state.cart[p.id];renderOrder();updateBadge();await saveCartState();});
      plus.addEventListener('click',async()=>{state.cart[p.id]++;renderOrder();updateBadge();await saveCartState();});
      controls.append(minus,qty,plus);row.append(info,controls);list.append(row);
    });
    $('orderTotal').textContent=money(total());$('orderNote').value=state.note;
  }
  document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-filter]').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.filter=b.dataset.filter;state.visibleCount=8;renderProducts();}));
  $('productSearch').addEventListener('input',()=>{state.visibleCount=8;renderProducts();});
  $('showMore').addEventListener('click',()=>{state.visibleCount+=8;renderProducts();});
  document.querySelectorAll('[data-category]').forEach(b=>b.addEventListener('click',()=>{state.filter=b.dataset.category;state.visibleCount=8;document.querySelectorAll('[data-filter]').forEach(x=>x.classList.toggle('active',x.dataset.filter===state.filter));setView('menu');renderProducts();}));
  $('orderNote').addEventListener('input',()=>{state.note=$('orderNote').value;saveCartState();});
  $('clearCart').addEventListener('click',async()=>{state.cart={};state.note='';renderOrder();updateBadge();await saveCartState();toast('Carrito vacío y sincronizado.');});
  $('goCheckout').addEventListener('click',()=>{if(!count()){toast('Agrega al menos un producto.','error');return;}setView('checkout');});
  function renderProfile(){const p=state.profile||{};$('profileName').value=p.display_name||'';$('profilePhone').value=p.phone||'';$('profileMode').value=state.mode;$('profileZone').value=p.zone||'';$('profileAddress').value=p.address||'';$('profileGreeting').textContent=p.display_name?'Hola, '+p.display_name.split(' ')[0]+'.':'Completa tu perfil.';}
  $('profileForm').addEventListener('submit',async event=>{
    event.preventDefault();const p={display_name:$('profileName').value.trim(),phone:$('profilePhone').value.trim(),zone:$('profileZone').value.trim(),address:$('profileAddress').value.trim(),city:'La Paz',contact_preference:'whatsapp'};
    if(p.display_name.length<2||!/^\d{8}$/.test(p.phone)){$('profileMessage').textContent='Escribe un nombre válido y un celular boliviano de 8 dígitos.';return;}
    if(!state.cloud){$('profileMessage').textContent='Conectando con la base de datos. Inténtalo de nuevo en unos segundos.';return;}
    const button=event.currentTarget.querySelector('button[type="submit"]');button.disabled=true;
    try{state.profile=await state.cloud.saveProfile(STORE,p);state.mode=$('profileMode').value;await saveCartState();$('profileMessage').textContent='Perfil creado o actualizado correctamente en la nube.';renderProfile();toast('Perfil sincronizado.');}
    catch(error){$('profileMessage').textContent='No se pudo guardar: '+error.message;}
    finally{button.disabled=false;}
  });
  $('deleteProfile').addEventListener('click',async()=>{
    if(!confirm('¿Eliminar tu perfil de Antojitos de la nube?'))return;
    try{await state.cloud.deleteProfile(STORE);state.profile=null;renderProfile();toast('Perfil eliminado de la base de datos.');}
    catch(error){toast('No se pudo eliminar: '+error.message,'error');}
  });
  function setMode(mode){state.mode=mode;$('checkoutMode').value=mode;document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));$('deliveryFields').hidden=mode!=='Entrega a domicilio';$('checkoutZone').required=mode==='Entrega a domicilio';$('checkoutAddress').required=mode==='Entrega a domicilio';$('checkoutReference').required=mode==='Entrega a domicilio';}
  document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
  function renderCheckoutSummary(){
    $('checkoutTotal').textContent=money(total());const list=$('checkoutItems');list.replaceChildren();
    selectedProducts().forEach(p=>list.append(node('p',(state.cart[p.id]||0)+' × '+p.name+' — '+money(p.price===null?null:p.price*state.cart[p.id]))));
    $('checkoutName').value=state.profile?.display_name||$('checkoutName').value;
    $('checkoutPhone').value=state.profile?.phone||$('checkoutPhone').value;
    $('checkoutZone').value=state.profile?.zone||$('checkoutZone').value;
    $('checkoutAddress').value=state.profile?.address||$('checkoutAddress').value;
    setMode(state.mode);
  }
  function buildOrder(){
    const customer={name:$('checkoutName').value.trim(),phone:$('checkoutPhone').value.trim(),mode:state.mode,zone:$('checkoutZone').value.trim(),address:$('checkoutAddress').value.trim(),reference:$('checkoutReference').value.trim(),instructions:$('checkoutInstructions').value.trim()};
    return{items:selectedProducts().map(p=>({id:p.id,name:p.name,price:p.price,priceLabel:p.priceLabel,quantity:state.cart[p.id],subtotal:p.price===null?null:p.price*state.cart[p.id]})),estimatedTotal:total(),note:$('orderNote').value.trim(),customer};
  }
  $('checkoutForm').addEventListener('submit',event=>{
    event.preventDefault();if(!count()){toast('Tu carrito está vacío.','error');setView('menu');return;}
    const order=buildOrder(),c=order.customer;
    if(c.name.length<2||!/^\d{8}$/.test(c.phone)||!$('checkoutConsent').checked){$('checkoutMessage').textContent='Revisa nombre, celular y aceptación de la solicitud.';return;}
    if(c.mode==='Entrega a domicilio'&&(c.zone.length<2||c.address.length<4||c.reference.length<3)){$('checkoutMessage').textContent='Completa zona, calle y referencia de entrega.';return;}
    if(order.estimatedTotal===null){$('checkoutMessage').textContent='Hay productos sin precio. Confirma el importe antes de enviar el pedido.';}
    state.pending=order;state.expiresAt=Date.now()+60000;
    $('confirmSummary').textContent=order.items.map(p=>p.quantity+' × '+p.name).join(' · ')+' | '+money(order.estimatedTotal)+' | '+c.mode;
    $('orderConfirm').hidden=false;updateCountdown();state.timer=setInterval(updateCountdown,250);$('acceptConfirm').focus();
  });
  function updateCountdown(){const left=Math.max(0,state.expiresAt-Date.now()),sec=Math.ceil(left/1000);$('confirmCountdown').textContent='00:'+String(sec).padStart(2,'0');$('confirmCountdownBar').style.width=(left/60000*100)+'%';if(left<=0)closeConfirm('El tiempo terminó. El pedido no se guardó; tu carrito sigue disponible.');}
  function closeConfirm(message){clearInterval(state.timer);state.timer=null;state.pending=null;state.expiresAt=0;$('orderConfirm').hidden=true;if(message)toast(message);}
  $('closeConfirm').addEventListener('click',()=>closeConfirm('Confirmación cancelada; el carrito se conservó.'));
  $('cancelConfirm').addEventListener('click',()=>closeConfirm('Confirmación cancelada; el carrito se conservó.'));
  $('acceptConfirm').addEventListener('click',async()=>{
    const order=state.pending;if(!order)return;
    if(Date.now()>=state.expiresAt){closeConfirm('El tiempo terminó. Vuelve a confirmar el pedido.');return;}
    $('acceptConfirm').disabled=true;
    try{
      const c=order.customer;
      state.profile=await state.cloud.saveProfile(STORE,{display_name:c.name,phone:c.phone,city:'La Paz',zone:c.zone,address:c.address,reference:c.reference,contact_preference:'whatsapp'});
      const delivery=c.mode==='Entrega a domicilio'?'delivery':'pickup';
      await state.cloud.submit(STORE,'order',c.name,c.phone,{
        delivery_method:delivery,address:delivery==='delivery'?c.address:null,reference:c.reference||null,
        request_data:{items:order.items,estimatedTotal:order.estimatedTotal,priceIsEstimate:true,note:order.note,customer:c}
      });
      state.orders=await state.cloud.requests(STORE);
      state.cart={};state.note='';await state.cloud.saveUserState(STORE,'cart',{quantities:{},note:'',mode:state.mode});
      closeConfirm('Pedido registrado en tu historial en línea. El negocio debe confirmar la solicitud.');
      $('checkoutForm').reset();updateBadge();renderOrder();setView('historial');
    }catch(error){toast('No se pudo registrar el pedido: '+error.message,'error');}
    finally{$('acceptConfirm').disabled=false;}
  });
  function renderHistory(){
    const list=$('historyList');list.replaceChildren();
    if(!state.orders.length){list.append(node('p','Todavía no tienes pedidos guardados.','empty-state'));return;}
    state.orders.forEach(row=>{
      const d=row.request_data||{},items=Array.isArray(d.items)?d.items:[],card=node('article',undefined,'history-card'),info=node('div');
      info.append(node('strong',(d.estimatedTotal===null?'Total por cotizar':money(d.estimatedTotal))+' · '+row.id.slice(0,8).toUpperCase()),
        node('p',items.map(p=>p.quantity+' × '+p.name).join(' · ')),
        node('small',row.contact_name+' · '+row.phone+' · '+(row.delivery_method==='delivery'?'Entrega a domicilio':'Retiro en local')+(row.address?' · '+row.address:'')),
        node('small','Estado: '+(row.status==='pending'?'Pendiente':row.status==='confirmed'?'Confirmado':row.status==='cancelled'?'Cancelado':'En revisión')));
      card.append(info);list.append(card);
    });
  }
  $('clearHistory').addEventListener('click',async()=>{
    if(!confirm('¿Borrar el historial de pedidos de Antojitos en la nube?'))return;
    try{await state.cloud.deleteRequests(STORE);state.orders=[];renderHistory();toast('Historial eliminado de la base de datos.');}
    catch(error){toast('No se pudo borrar: '+error.message,'error');}
  });
  async function init(){
    try{
      state.cloud=await window.catalogCloudReady;
      const [items,cart,profile,orders]=await Promise.all([
        state.cloud.items(STORE),state.cloud.userState(STORE,'cart',{quantities:{},note:'',mode:'Retiro en local'}),state.cloud.profile(STORE),state.cloud.requests(STORE)
      ]);
      state.products=items.map(mapProduct);state.cart=cart.quantities||{};state.note=cart.note||'';state.mode=cart.mode||'Retiro en local';state.profile=profile;state.orders=orders;
      updateBadge();renderProducts();renderProfile();if(state.view==='pedido')renderOrder();if(state.view==='historial')renderHistory();
      if(!state.products.length)$('productGrid').replaceChildren(node('p','El menú todavía no tiene productos publicados.','empty-state'));
      status('online','Online · Base sincronizada');
    }catch(error){console.error(error);status('offline','Sin conexión a la base');$('productGrid').replaceChildren(node('p',(error.message||'No se pudo conectar con Supabase.')+' Revisa el acceso anónimo al proyecto.','empty-state'));$('checkoutMessage').textContent=error.message||'No se pudo conectar con Supabase.';}
  }
  function network(){if(!navigator.onLine){status('offline','Offline');return;}if(state.cloud)status('online','Online · Base conectada');}
  const start=location.hash.replace('#','');setView(['inicio','menu','pedido','cuenta','checkout','historial'].includes(start)?start:'inicio');
  setMode('Retiro en local');status('checking','Conectando…');
  window.addEventListener('online',network);window.addEventListener('offline',network);
  window.addEventListener('pagehide',()=>clearInterval(state.timer));
  if('serviceWorker'in navigator&&(location.protocol==='https:'||location.hostname==='localhost'))navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).catch(console.warn);
  init();
})();