'use strict';
(() => {
  const $=id=>document.getElementById(id),STORE='el-local';
  const state={products:[],filter:'todos',view:'inicio',cart:{},note:'',visibleCount:8,profile:null,orders:[],mode:'Retiro en local',pending:null,expiresAt:0,timer:null,cloud:null};
  const node=(tag,text,cls)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=String(text);if(cls)el.className=cls;return el;};
  function toast(message,type){const el=$('toast');el.textContent=message;el.className='toast show'+(type?' '+type:'');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.className='toast',3200);}
  function status(s,label){$('networkStatus').dataset.state=s;$('networkStatus').querySelector('b').textContent=label;}
  function money(v){return 'Bs '+Number(v||0).toLocaleString('es-BO',{minimumFractionDigits:0,maximumFractionDigits:2});}
  function count(){return Object.values(state.cart).reduce((a,b)=>a+Number(b||0),0);}
  function total(){return state.products.reduce((sum,p)=>sum+Number(p.price||0)*(state.cart[p.id]||0),0);}
  function selectedProducts(){return state.products.filter(p=>state.cart[p.id]);}
  function updateBadge(){const n=count();$('cartBadge').textContent=n;$('mobileCartBadge').textContent=n;}
  async function saveCartState(){try{await state.cloud.saveUserState(STORE,'cart',{quantities:state.cart,note:state.note,mode:state.mode});}catch(error){toast('No se pudo sincronizar el carrito: '+error.message,'error');}}
  function mapProduct(row){const s=row.specs||{};return{id:row.item_code,name:row.name,category:row.category,price:Number(row.price)||0,description:row.description||'',image:row.image_url||'',fallback:s.fallback||''};}
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
      const card=node('article',undefined,'food-card'),img=node('img');img.src=p.image;img.alt=p.name;img.loading='lazy';img.decoding='async';img.width=640;img.height=420;
      img.addEventListener('error',()=>{if(p.fallback)img.src=p.fallback;},{once:true});
      const body=node('div',undefined,'food-body');body.append(node('small',p.category.toUpperCase()),node('h3',p.name),node('p',p.description));
      const foot=node('div',undefined,'food-foot'),price=node('strong',money(p.price)),button=node('button',state.cart[p.id]?'Añadir otro +':'Agregar +');button.type='button';
      button.addEventListener('click',async()=>{state.cart[p.id]=(state.cart[p.id]||0)+1;updateBadge();button.textContent='Agregado ✓';await saveCartState();toast(p.name+' agregado al pedido.');});
      foot.append(price,button);body.append(foot);card.append(img,body);grid.append(card);
    });
    const more=$('showMore');more.hidden=rows.length<=state.visibleCount;more.textContent='Mostrar '+Math.min(8,rows.length-state.visibleCount)+' productos más · '+rows.length+' en total';
  }
  function renderOrder(){
    const list=$('orderLines');list.replaceChildren();const rows=selectedProducts();
    if(!rows.length)list.append(node('p','Todavía no agregaste productos.','empty-state'));
    rows.forEach(p=>{
      const row=node('article',undefined,'order-row'),info=node('div');info.append(node('strong',p.name),node('small',money(p.price)+' por unidad · Subtotal '+money(p.price*state.cart[p.id])));
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
    if(!confirm('¿Eliminar tu perfil de El Local de la nube?'))return;
    try{await state.cloud.deleteProfile(STORE);state.profile=null;renderProfile();toast('Perfil eliminado de la base de datos.');}
    catch(error){toast('No se pudo eliminar: '+error.message,'error');}
  });
  function setMode(mode){state.mode=mode;$('checkoutMode').value=mode;document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));$('deliveryFields').hidden=mode!=='Entrega a domicilio';$('checkoutZone').required=mode==='Entrega a domicilio';$('checkoutAddress').required=mode==='Entrega a domicilio';$('checkoutReference').required=mode==='Entrega a domicilio';}
  document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
  function renderCheckoutSummary(){
    $('checkoutTotal').textContent=money(total());const list=$('checkoutItems');list.replaceChildren();
    selectedProducts().forEach(p=>list.append(node('p',(state.cart[p.id]||0)+' × '+p.name+' — '+money(p.price*state.cart[p.id]))));
    $('checkoutName').value=state.profile?.display_name||$('checkoutName').value;
    $('checkoutPhone').value=state.profile?.phone||$('checkoutPhone').value;
    $('checkoutZone').value=state.profile?.zone||$('checkoutZone').value;
    $('checkoutAddress').value=state.profile?.address||$('checkoutAddress').value;
    setMode(state.mode);
  }
  function buildOrder(){
    const customer={name:$('checkoutName').value.trim(),phone:$('checkoutPhone').value.trim(),mode:state.mode,zone:$('checkoutZone').value.trim(),address:$('checkoutAddress').value.trim(),reference:$('checkoutReference').value.trim(),instructions:$('checkoutInstructions').value.trim()};
    return{items:selectedProducts().map(p=>({id:p.id,name:p.name,price:p.price,quantity:state.cart[p.id],subtotal:p.price*state.cart[p.id]})),estimatedTotal:total(),note:$('orderNote').value.trim(),customer};
  }
  $('checkoutForm').addEventListener('submit',event=>{
    event.preventDefault();if(!count()){toast('Tu carrito está vacío.','error');setView('menu');return;}
    const order=buildOrder(),c=order.customer;
    if(c.name.length<2||!/^\d{8}$/.test(c.phone)||!$('checkoutConsent').checked){$('checkoutMessage').textContent='Revisa nombre, celular y aceptación de la solicitud.';return;}
    if(c.mode==='Entrega a domicilio'&&(c.zone.length<2||c.address.length<4||c.reference.length<3)){$('checkoutMessage').textContent='Completa zona, calle y referencia de entrega.';return;}
    state.pending=order;state.expiresAt=Date.now()+60000;
    $('confirmSummary').textContent=order.items.map(p=>p.quantity+' × '+p.name).join(' · ')+' | '+money(order.estimatedTotal)+' (estimado) | '+c.mode;
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
      const d=row.request_data||{},c=d.customer||{},items=Array.isArray(d.items)?d.items:[],card=node('article',undefined,'history-card'),info=node('div');
      info.append(node('strong',money(d.estimatedTotal)+' · '+row.id.slice(0,8).toUpperCase()),node('p',items.map(p=>p.quantity+' × '+p.name).join(' · ')),node('small',row.contact_name+' · '+row.phone+' · '+(row.delivery_method==='delivery'?'Entrega a domicilio':'Retiro en local')+(row.address?' · '+row.address:'')),node('small','Estado: '+row.status));
      const copy=node('button','Copiar resumen');copy.type='button';
      copy.addEventListener('click',async()=>{const text='PEDIDO · EL LOCAL\n'+items.map(p=>p.quantity+' × '+p.name+' — '+money(p.subtotal)).join('\n')+'\nTOTAL ESTIMADO: '+money(d.estimatedTotal)+'\nCliente: '+row.contact_name+' · '+row.phone+'\nModalidad: '+(row.delivery_method==='delivery'?'Entrega a domicilio':'Retiro en local')+'\nDirección: '+(row.address||'Retiro')+'\nReferencia: '+(row.reference||'—')+'\nObservaciones: '+(d.note||c.instructions||'—')+'\nPendiente de confirmación del negocio.';try{await navigator.clipboard.writeText(text);toast('Resumen copiado.');}catch(_){toast('No se pudo copiar.','error');}});
      card.append(info,copy);list.append(card);
    });
  }
  $('clearHistory').addEventListener('click',async()=>{
    if(!confirm('¿Borrar el historial de pedidos de El Local en la nube?'))return;
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