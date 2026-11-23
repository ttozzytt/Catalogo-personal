'use strict';
(() => {
  const $=id=>document.getElementById(id), STORE='tada';
  const state={products:[],filter:'todos',view:'inicio',list:{},profile:null,orders:[],pending:null,expiresAt:0,timer:null,cloud:null,ageConfirmed:false,ready:false};
  const node=(tag,text,cls)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=String(text);if(cls)el.className=cls;return el;};
  function toast(message,type){const el=$('toast');el.textContent=message;el.className='toast show'+(type?' '+type:'');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.className='toast',3200);}
  function status(s,label){$('networkStatus').dataset.state=s;$('networkStatus').querySelector('b').textContent=label;}
  function showView(name){const target=$('view-'+name);if(!target)return;document.querySelectorAll('.view').forEach(v=>{v.hidden=true;v.classList.remove('active');});target.hidden=false;target.classList.add('active');document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===name));state.view=name;if(location.hash!=='#'+name)history.replaceState(null,'','#'+name);if(name==='lista')renderList();if(name==='cuenta')fillDeliveryProfile();if(name==='pedidos')renderOrders();}
  document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
  document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.go)));
  const totalUnits=()=>Object.values(state.list).reduce((sum,n)=>sum+Number(n||0),0);
  function mapProduct(row){
    const s=row.specs||{};
    return{id:row.item_code,name:row.name,category:row.category,brand:row.brand||'',type:s.type||row.category,
      description:row.description||'',image:row.image_url||'',imageAlt:row.image_alt||row.name,price:row.price===null?null:Number(row.price),
      formatGroup:s.presentationGroup==='cajas'?'packs':(s.presentationGroup||'botellas'),ageRestricted:Boolean(s.ageRestricted),priceSource:s.priceSource||'',priceCheckedAt:s.priceCheckedAt||'',priceNote:s.priceNote||''};
  }
  function listTotal(){
    const rows=state.products.filter(p=>state.list[p.id]);
    if(!rows.length)return 0;
    if(rows.some(p=>p.price===null||p.price===undefined))return null;
    return rows.reduce((sum,p)=>sum+(Number(p.price)*Number(state.list[p.id]||0)),0);
  }
  function updateBadges(){
    const n=totalUnits();$('listBadge').textContent=n;$('mobileBadge').textContent=n;
    $('listSummary').textContent=n+' unidades seleccionadas';
    const total=listTotal();
    $('listTotal').textContent=total===null?'Total: Consultar':'Total: '+formatPrice({price:total});
  }
  async function saveList(){try{await state.cloud.saveUserState(STORE,'cart',{quantities:state.list});}catch(error){toast('No se pudo sincronizar la lista: '+error.message,'error');}}
  function formatPrice(p){
    if(p.price===null)return 'Consultar';
    const amount='Bs '+p.price.toLocaleString('es-BO',{minimumFractionDigits:p.price%1?2:0,maximumFractionDigits:2});
    return amount;
  }
  function renderProducts(){
    const grid=$('productGrid'),q=$('productSearch').value.trim().toLocaleLowerCase('es');grid.replaceChildren();
    const rows=state.products.filter(p=>(state.filter==='todos'||p.category===state.filter||p.formatGroup===state.filter)&&(p.name+' '+p.brand+' '+p.type+' '+p.description).toLocaleLowerCase('es').includes(q));
    if(!rows.length){grid.append(node('p','No encontramos presentaciones con ese criterio.','empty-state'));return;}
    rows.forEach(p=>{
      const card=node('article',undefined,'product-card'),art=node('div',undefined,'product-art'),img=node('img');
      img.src=p.image||'';img.alt=p.imageAlt;img.loading='lazy';img.decoding='async';
      img.addEventListener('error',()=>{img.remove();art.append(node('span',p.brand||p.name,'brand-fallback'));},{once:true});art.append(img);
      const body=node('div',undefined,'product-body');
      body.append(node('small',(p.brand||p.type)+' · '+p.type+(p.ageRestricted?' · +18':'')),node('h3',p.name),node('p',p.description));
      if(p.priceSource)body.append(node('small','Precio de referencia: '+p.priceSource+' · '+p.priceCheckedAt,'price-source-note'));
      else if(p.priceNote)body.append(node('small',p.priceNote,'price-source-note'));
      const foot=node('div',undefined,'product-foot'),priceWrap=node('div',undefined,'product-price-wrap');
      priceWrap.append(node('strong',formatPrice(p)));

      const button=node('button',state.list[p.id]?'Añadido ✓':'Añadir +');button.type='button';
      button.addEventListener('click',async()=>{state.list[p.id]=(state.list[p.id]||0)+1;updateBadges();button.textContent='Añadido ✓';await saveList();toast(p.name+' agregado a tu lista.');});
      foot.append(priceWrap,button);body.append(foot);card.append(art,body);grid.append(card);
    });
  }
  function renderList(){
    const area=$('selectedList');area.replaceChildren();const rows=state.products.filter(p=>state.list[p.id]);
    if(!rows.length){area.append(node('p','Tu lista está vacía. Explora el catálogo para agregar bebidas.','empty-state'));updateBadges();return;}
    rows.forEach(p=>{
      const row=node('article',undefined,'selected-row'),info=node('div');info.append(node('strong',p.name),node('small',p.type+' · '+state.list[p.id]+' unidad(es) · '+formatPrice(p)+(p.price===null?'':' · Subtotal '+formatPrice({price:p.price*state.list[p.id]}))));
      const controls=node('div',undefined,'quantity-controls'),minus=node('button','−'),count=node('b',state.list[p.id]),plus=node('button','+');minus.type=plus.type='button';
      minus.setAttribute('aria-label','Quitar una unidad de '+p.name);plus.setAttribute('aria-label','Agregar una unidad de '+p.name);
      minus.addEventListener('click',async()=>{state.list[p.id]--;if(state.list[p.id]<=0)delete state.list[p.id];updateBadges();renderList();await saveList();});
      plus.addEventListener('click',async()=>{state.list[p.id]++;updateBadges();renderList();await saveList();});
      controls.append(minus,count,plus);row.append(info,controls);area.append(row);
    });updateBadges();
  }
  function fillDeliveryProfile(){
    const p=state.profile||{};
    $('deliveryName').value=p.display_name||'';$('deliveryPhone').value=p.phone||'';
    $('deliveryCity').value=p.city||'';$('deliveryZone').value=p.zone||'';
    $('deliveryAddress').value=p.address||'';$('deliveryReference').value=p.reference||'';
    $('deliveryNotes').value='';
    $('adultConfirm').checked=false;$('idAtDoor').checked=false;
    $('accountGreeting').textContent=p.display_name?'Hola, '+p.display_name.split(' ')[0]+'.':'Datos para tu próxima entrega.';
  }
  function collectDelivery(){return{name:$('deliveryName').value.trim(),phone:$('deliveryPhone').value.trim(),city:$('deliveryCity').value,zone:$('deliveryZone').value.trim(),address:$('deliveryAddress').value.trim(),reference:$('deliveryReference').value.trim(),notes:$('deliveryNotes').value.trim(),adultConfirmed:$('adultConfirm').checked,idAtDoor:$('idAtDoor').checked};}
  function validateDelivery(d){
    if(totalUnits()===0){$('deliveryMessage').textContent='Primero agrega bebidas a tu pedido.';return false;}
    if(d.name.length<2||!/^\d{8}$/.test(d.phone)||!d.city||d.zone.length<2||d.address.length<4||d.reference.length<3){$('deliveryMessage').textContent='Revisa nombre, celular, ciudad, zona, dirección y referencia.';return false;}
    if(!d.adultConfirmed||!d.idAtDoor){$('deliveryMessage').textContent='Confirma que eres mayor de edad y que presentarás tu carnet físico al recibir.';return false;}
    return true;
  }
  function closeDeliveryConfirm(message){clearInterval(state.timer);state.timer=null;state.pending=null;state.expiresAt=0;$('deliveryConfirm').hidden=true;if(message)toast(message);}
  function updateCountdown(){const left=Math.max(0,state.expiresAt-Date.now()),seconds=Math.ceil(left/1000);$('deliveryCountdown').textContent='00:'+String(seconds).padStart(2,'0');$('deliveryCountdownBar').style.width=(left/60000*100)+'%';if(left<=0)closeDeliveryConfirm('El tiempo terminó. El pedido no se guardó.');}
  async function confirmDelivery(){
    const order=state.pending;if(!order)return;
    if(Date.now()>=state.expiresAt){closeDeliveryConfirm('El tiempo terminó. Prepara de nuevo el pedido.');return;}
    $('confirmDeliveryPending').disabled=true;
    try{
      const d=order.delivery;
      state.profile=await state.cloud.saveProfile(STORE,{display_name:d.name,phone:d.phone,city:d.city,zone:d.zone,address:d.address,reference:d.reference,contact_preference:'whatsapp'});
      await state.cloud.submit(STORE,'order',d.name,d.phone,{
        delivery_method:'delivery',address:d.address,reference:d.reference,
        request_data:{items:order.items,city:d.city,zone:d.zone,address:d.address,reference:d.reference,deliveryNotes:d.notes,ageAttested:true,physicalIdToShowAtDelivery:true,identityDocumentNumberStored:false,identityDocumentPhotoStored:false}
      });
      state.orders=await state.cloud.requests(STORE);
      state.list={};await state.cloud.saveUserState(STORE,'cart',{quantities:{}});
      closeDeliveryConfirm('Pedido registrado. Revisa Mis pedidos.');
      updateBadges();renderList();$('deliveryMessage').textContent='Pedido registrado.';
      showView('pedidos');
    }catch(error){toast('No se pudo registrar el pedido: '+error.message,'error');}
    finally{$('confirmDeliveryPending').disabled=false;}
  }

  async function saveDeliveryProfile(){
    const d=collectDelivery();
    if(d.name.length<2||d.phone.length!==8||!d.phone.split('').every(ch=>ch>='0'&&ch<='9')){
      $('profileSaveMessage').textContent='Escribe tu nombre y un celular boliviano de 8 dígitos.';
      return;
    }
    if(!state.cloud){$('profileSaveMessage').textContent='Conectando con la base de datos. Inténtalo de nuevo en unos segundos.';return;}
    $('saveDeliveryProfile').disabled=true;
    try{
      state.profile=await state.cloud.saveProfile(STORE,{
        display_name:d.name,phone:d.phone,city:d.city||null,zone:d.zone||null,
        address:d.address||null,reference:d.reference||null,contact_preference:'whatsapp'
      });
      $('accountGreeting').textContent='Hola, '+d.name.split(' ')[0]+'.';
      $('profileSaveMessage').textContent='Tu perfil se guardó correctamente en la nube.';
      toast('Datos de entrega guardados en tu cuenta.');
    }catch(error){
      $('profileSaveMessage').textContent='No se pudo guardar: '+error.message;
    }finally{$('saveDeliveryProfile').disabled=false;}
  }
  $('saveDeliveryProfile').addEventListener('click',saveDeliveryProfile);
  $('deliveryForm').addEventListener('submit',event=>{
    event.preventDefault();const d=collectDelivery();if(!validateDelivery(d))return;
    const items=state.products.filter(p=>state.list[p.id]).map(p=>({id:p.id,name:p.name,brand:p.brand,presentation:p.type,quantity:state.list[p.id],unitPrice:p.price}));
    state.pending={items,delivery:d};state.expiresAt=Date.now()+60000;
    $('deliveryConfirmSummary').textContent=items.map(p=>p.quantity+' × '+p.name).join(' · ')+' | Entrega: '+d.zone+', '+d.city+' | '+d.name+' · '+d.phone;
    $('deliveryConfirm').hidden=false;updateCountdown();state.timer=setInterval(updateCountdown,250);$('confirmDeliveryPending').focus();
  });
  $('closeDeliveryConfirm').addEventListener('click',()=>closeDeliveryConfirm('Solicitud cancelada.'));
  $('cancelDeliveryPending').addEventListener('click',()=>closeDeliveryConfirm('Solicitud cancelada.'));
  $('confirmDeliveryPending').addEventListener('click',confirmDelivery);
  function renderOrders(){
    const list=$('ordersList');list.replaceChildren();
    if(!state.orders.length){list.append(node('p','Todavía no hay solicitudes de delivery.','empty-state'));return;}
    state.orders.forEach(row=>{
      const d=row.request_data||{},items=Array.isArray(d.items)?d.items:[],card=node('article',undefined,'order-card'),main=node('div');
      main.append(node('strong','TaDa · '+row.id.slice(0,8).toUpperCase()),node('p',items.map(p=>p.quantity+' × '+p.name).join(' · ')),node('small',row.contact_name+' · '+(d.zone||'')+', '+(d.city||'')+' · '+row.phone),node('small','Estado: '+(row.status==='pending'?'Pendiente':row.status==='confirmed'?'Confirmado':row.status==='cancelled'?'Cancelado':'En revisión')));
      card.append(main);list.append(card);
    });
  }
  $('productSearch').addEventListener('input',renderProducts);
  document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('[data-filter]').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.filter=b.dataset.filter;renderProducts();}));
  document.querySelectorAll('[data-category]').forEach(b=>b.addEventListener('click',()=>{state.filter=b.dataset.category;document.querySelectorAll('[data-filter]').forEach(x=>x.classList.toggle('active',x.dataset.filter===state.filter));showView('catalogo');renderProducts();}));
  $('clearList').addEventListener('click',async()=>{state.list={};updateBadges();renderList();await saveList();toast('Lista vaciada en la nube.');});
  $('continueDelivery').addEventListener('click',()=>{if(!totalUnits()){toast('Agrega al menos una bebida.','error');return;}showView('cuenta');});
  $('deleteDeliveryProfile').addEventListener('click',async()=>{
    if(!confirm('¿Eliminar tu perfil de entrega de TaDa de la nube?'))return;
    try{await state.cloud.deleteProfile(STORE);state.profile=null;fillDeliveryProfile();toast('Perfil eliminado de la base de datos.');}
    catch(error){toast('No se pudo eliminar: '+error.message,'error');}
  });
  $('clearOrders').addEventListener('click',async()=>{
    if(!confirm('¿Borrar el historial de pedidos de TaDa en la nube?'))return;
    try{await state.cloud.deleteRequests(STORE);state.orders=[];renderOrders();toast('Historial eliminado de la base de datos.');}
    catch(error){toast('No se pudo borrar: '+error.message,'error');}
  });
  $('confirmAge').addEventListener('click',()=>{state.ageConfirmed=true;$('ageGate').hidden=true;startApp();});
  $('denyAge').addEventListener('click',()=>{$('ageTitle').textContent='Acceso no disponible';$('ageMessage').textContent='Este catálogo solo está disponible para personas mayores de 18 años.';$('confirmAge').disabled=true;$('denyAge').disabled=true;$('denyAge').textContent='Acceso restringido';});
  async function startApp(){
    if(state.ready||!state.ageConfirmed)return;state.ready=true;
    try{
      state.cloud=await window.catalogCloudReady;
      const [items,cart,profile,orders]=await Promise.all([
        state.cloud.items(STORE),state.cloud.userState(STORE,'cart',{quantities:{}}),state.cloud.profile(STORE),state.cloud.requests(STORE)
      ]);
      state.products=items.map(mapProduct);state.list=cart.quantities&&typeof cart.quantities==='object'?cart.quantities:{};
      state.profile=profile;state.orders=orders;renderProducts();renderList();fillDeliveryProfile();renderOrders();status('online','Online · Base sincronizada');
      if(!state.products.length)$('productGrid').replaceChildren(node('p','El catálogo todavía no tiene marcas publicadas.','empty-state'));
    }catch(error){console.error(error);status('offline','Sin conexión a la base');$('productGrid').replaceChildren(node('p',(error.message||'No se pudo conectar con Supabase.')+' Revisa el acceso anónimo en el proyecto.','empty-state'));$('deliveryMessage').textContent=error.message||'No se pudo conectar con Supabase.';}
  }
  function checkNetwork(){if(!navigator.onLine){status('offline','Offline');return;}if(state.cloud)status('online','Online · Base conectada');}
  showView('inicio');status('checking','Conectando…');
  window.addEventListener('online',checkNetwork);window.addEventListener('offline',checkNetwork);
  window.addEventListener('pagehide',()=>clearInterval(state.timer));
  if('serviceWorker'in navigator&&(location.protocol==='https:'||location.hostname==='localhost'))navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).catch(console.warn);
})();