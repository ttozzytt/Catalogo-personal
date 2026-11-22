'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const STORE = 'navaja27';
  const QR_MATRIX_B64 = '/jHRFvPpkIuD/BHNdu0u2yJzUG6GPGVQ/oUIArt04EHAogX6fpXbo4tv9Da/O3euwVI2xTePHdRxB/qqqqqqqqqqr+AEPDHNDkQa6gCWhsz/bIPmcC0HDWh8Csgmq6rblfn1gFHHmEl7LCI930Cxg55jdlEzppmfzKrMbGyAwMlWPk7XbGcdS3OAPwYEcZx4fDPMTZsBfZGiYZoh5hbZDqsK0X3CI++I3oYXKoi8vaUd5voHJCKncbkB2dY3QYAU8jNEM1S8ainuqXhJeehuQnpuK7d61GWjpXj7lgCMNxgn8NgA5Vtnb4/T/zz76KSfoceqZEXMEfojxTaupapzlaxagrcxwBUWkyxwA/EI/Sovt9L++mP9JiMMQokMvHvO6MzgDrN35CdXceQRkERKRaZQTmgWhdg9ANa4Wmq/AWIZGuGvbDcuEY1kjvxPP0zDpXn/MK6oVRCpOUSjyKCa2+pkzdqo2tjtVM/9rPHW/8Ma+rXk8AwCty/LPXxi3TC4EDfj6dy96QzM18IAku2IjtfiZfaY7RF7gtjqYDlm4Qc9HctbSdpmuHT9YfK9YEcJomwYGdj8Qp+29vt+cxvxYp+Esz5NHc7xRRNF6T0UeoO9rJ/yorqqzMW8LGAgcfNLRBfuG//MNvhRr++KejkvM4OZA9GoaiIC7dFsXE9I3JPDPgXs3X8WiEtcdDkoCjWjL3aIm1U1SpK7aqMLB7SFfdMg1+5sbhR18IR4Zyfiva7vQjLVF/jMrAMPlZENKYFR0MQ5Hh3Z2aKqpLY4lq3lUs/r6DYS3aFGIqbFkjwE7KI+DEvBkLTes8tvw6XbKkHmwCJFwvW01rubqJjTpzK3J3Y3euFuE627A6TLQRSKt6a6D5jfPqlJ+IBy0ceIZx4nJF/5zTKgLKq5ECpQXpbRkvFGaUcXumhY+4n/4ipPldUD1lkmn/5KxO6eVw8WKGpqkvMEdJVQY3dvXAOv64ARL5bXsI6dAA==';
  const state = { services: [], filter: 'todos', view: 'inicio', requests: [], profile: null, pending: null, timer: null, expiresAt: 0, cloud: null };
  const node = (tag, text, cls) => { const el = document.createElement(tag); if (text !== undefined) el.textContent = String(text); if (cls) el.className = cls; return el; };
  function toast(message, type) { const el=$('toast'); el.textContent=message; el.className='toast show'+(type?' '+type:''); clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.className='toast',3200); }
  function setStatus(stateName,label) { $('networkStatus').dataset.state=stateName; $('networkStatus').querySelector('b').textContent=label; }
  function money(value) { return value===null || value===undefined ? 'Consultar' : 'Bs '+Number(value).toLocaleString('es-BO'); }
  function showView(name) {
    const target=$('view-'+name); if(!target)return;
    document.querySelectorAll('.view').forEach(v=>{v.hidden=true;v.classList.remove('active');});
    target.hidden=false;target.classList.add('active');
    document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
    state.view=name;if(location.hash!=='#'+name)history.replaceState(null,'','#'+name);
    if(name==='mis-turnos')renderRequests(); if(name==='cuenta')renderProfile();
  }
  document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
  document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.go)));
  function localDate() { const now=new Date();return new Date(now.getTime()-now.getTimezoneOffset()*60000).toISOString().slice(0,10); }
  function setMinimumDate() { const input=$('bookingDate');input.min=localDate();if(!input.value||input.value<input.min)input.value=input.min; }
  function mapService(row) {
    const s=row.specs||{};
    return { id:row.item_code,name:row.name,category:row.category||'otros',price:row.price,priceLabel:s.priceLabel||money(row.price),duration:Number(row.duration_minutes)||30,durationLabel:s.durationLabel||(row.duration_minutes+' min'),description:row.description||'',details:s.details||row.description||'',image:row.image_url||'',imageAlt:row.image_alt||row.name,photoUrl:s.photoUrl,photoCredit:s.photoCredit };
  }
  function populateSelect() {
    const select=$('bookingService');select.replaceChildren(new Option('Selecciona un servicio',''));
    state.services.forEach(s=>select.add(new Option(s.name+' · '+s.priceLabel,s.id)));
  }
  function renderServices() {
    const grid=$('serviceGrid'),q=$('serviceSearch').value.trim().toLocaleLowerCase('es');grid.replaceChildren();
    const rows=state.services.filter(s=>(state.filter==='todos'||s.category===state.filter)&&(s.name+' '+s.description+' '+s.category).toLocaleLowerCase('es').includes(q));
    if(!rows.length){grid.append(node('p','No hay servicios que coincidan.','empty-state'));return;}
    rows.forEach(s=>{
      const card=node('article',undefined,'service-card'),img=node('img');img.src=s.image||'./imagenes/imagen-respaldo.svg';img.alt=s.imageAlt;img.loading='lazy';img.decoding='async';img.width=640;img.height=420;
      img.addEventListener('error',()=>{img.src='./imagenes/imagen-respaldo.svg';},{once:true});
      const body=node('div',undefined,'service-body');
      body.append(node('small',s.category.toUpperCase()+' · '+s.durationLabel),node('h3',s.name),node('p',s.description));
      if(s.photoUrl&&s.photoCredit){const credit=node('a','Foto: '+s.photoCredit+' · Pexels ↗','photo-credit');credit.href=s.photoUrl;credit.target='_blank';credit.rel='noopener noreferrer';body.append(credit);}
      const detail=node('details',undefined,'service-detail-wrap');detail.append(node('summary','Ver detalles'),node('p',s.details));
      const foot=node('div',undefined,'service-bottom'),price=node('strong',s.priceLabel),button=node('button','Elegir servicio');button.type='button';
      button.addEventListener('click',()=>{$('bookingService').value=s.id;showView('turnos');toast('Servicio seleccionado: '+s.name);});
      foot.append(price,button);body.append(detail,foot);card.append(img,body);grid.append(card);
    });
  }
  document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{
    document.querySelectorAll('[data-filter]').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.filter=b.dataset.filter;renderServices();
  }));
  $('serviceSearch').addEventListener('input',renderServices);
  function profilePayload() {
    return {
      display_name:$('profileName').value.trim(),
      phone:$('profilePhone').value.trim(),
      contact_preference:$('profileContact').value==='Llamada'?'phone':'whatsapp'
    };
  }
  function fillProfileToBooking() {
    if(!state.profile)return;
    $('clientName').value=state.profile.display_name||'';
    $('clientPhone').value=state.profile.phone||'';
  }
  function renderProfile() {
    const p=state.profile||{};
    $('profileName').value=p.display_name||'';
    $('profilePhone').value=p.phone||'';
    $('profileContact').value=p.contact_preference==='phone'?'Llamada':'WhatsApp';
    $('profileGreeting').textContent=p.display_name?'Hola, '+p.display_name.split(' ')[0]+'.':'Aún no guardaste tu perfil.';
  }
  function closeConfirm(message) {
    clearInterval(state.timer);state.timer=null;state.pending=null;state.expiresAt=0;$('bookingConfirm').hidden=true;if(message)toast(message);
  }
  function updateCountdown() {
    const left=Math.max(0,state.expiresAt-Date.now()),seconds=Math.ceil(left/1000);
    $('bookingCountdown').textContent='00:'+String(seconds).padStart(2,'0');
    $('countdownBar').style.width=(left/60000*100)+'%';
    if(left<=0)closeConfirm('El tiempo terminó. La solicitud no se guardó.');
  }
  function openConfirm(data) {
    state.pending=data;state.expiresAt=Date.now()+60000;
    $('confirmDetails').textContent=data.service+' · '+data.date.split('-').reverse().join('/')+' · '+data.time+' · '+data.name;
    $('bookingConfirm').hidden=false;updateCountdown();state.timer=setInterval(updateCountdown,250);$('confirmPending').focus();
  }
  function toDate(row) {
    const d=row.request_data||{};
    return (d.date|| (row.requested_for?new Date(row.requested_for).toLocaleDateString('en-CA'):''))+' '+(d.time||'');
  }
  function requestAmount(row) {
    const data=row.request_data||{};
    if(typeof data.priceAmount==='number'&&Number.isFinite(data.priceAmount))return data.priceAmount;
    const match=String(data.referencePrice||'').match(/Bs\s*([\d.,]+)/i);
    if(!match)return null;
    const amount=Number(match[1].replace(/,/g,''));
    return Number.isFinite(amount)?amount:null;
  }
  function drawAltokeQr() {
    const canvas=$('qrPaymentCanvas');
    if(!canvas||canvas.dataset.ready==='yes')return;
    const packed=window.atob(QR_MATRIX_B64),modules=77,quiet=4,cell=8,total=(modules+quiet*2)*cell;
    canvas.width=total;canvas.height=total;
    const ctx=canvas.getContext('2d',{alpha:false});
    ctx.imageSmoothingEnabled=false;ctx.fillStyle='#fff';ctx.fillRect(0,0,total,total);ctx.fillStyle='#050505';
    for(let bit=0;bit<modules*modules;bit++){
      const byte=packed.charCodeAt(bit>>3),mask=1<<(7-(bit&7));
      if(byte&mask){
        const x=bit%modules,y=Math.floor(bit/modules);
        ctx.fillRect((x+quiet)*cell,(y+quiet)*cell,cell,cell);
      }
    }
    canvas.dataset.ready='yes';
  }
  function openQrPayment(row) {
    const amount=requestAmount(row),data=row.request_data||{};
    $('qrPaymentTitle').textContent='Pago con QR · Navaja 27';
    $('qrPaymentService').textContent=(data.serviceName||'Servicio')+' · '+toDate(row);
    $('qrPaymentAmount').textContent=amount===null?'Precio por confirmar':'Precio de referencia: Bs '+amount.toLocaleString('es-BO');
    $('qrPaymentStatus').textContent='El monto es referencial. Confirma el precio con Navaja 27 y verifica el beneficiario y el importe en tu aplicación bancaria antes de autorizar.';
    drawAltokeQr();
    $('qrPaymentModal').hidden=false;
    $('closeQrPayment').focus();
  }
  function renderRequests() {
    const list=$('requestList');list.replaceChildren();
    if(!state.requests.length){list.append(node('p','Todavía no tienes solicitudes guardadas.','empty-state'));return;}
    state.requests.forEach(row=>{
      const d=row.request_data||{},card=node('article',undefined,'request-card'),info=node('div');
      const amount=requestAmount(row);
      info.append(node('h3',d.serviceName||'Turno solicitado'),node('p',toDate(row)+' · '+row.contact_name+' · '+row.phone),node('small','Estado: '+(row.status||'pending')),node('small',amount===null?'Precio por confirmar':'Precio de referencia: Bs '+amount.toLocaleString('es-BO')));
      const actions=node('div',undefined,'request-actions'),pay=node('button',amount===null?'Consultar precio':'Pagar con QR');
      pay.type='button';pay.disabled=amount===null;pay.addEventListener('click',()=>openQrPayment(row));
      actions.append(pay);card.append(info,actions);list.append(card);
    });
  }
  async function confirmPending() {
    const data=state.pending;if(!data)return;
    if(Date.now()>=state.expiresAt){closeConfirm('El tiempo terminó. Vuelve a solicitar el turno.');return;}
    $('confirmPending').disabled=true;
    try {
      await state.cloud.saveProfile(STORE,{display_name:data.name,phone:data.phone,contact_preference:state.profile?.contact_preference||'whatsapp'});
      state.profile=await state.cloud.profile(STORE);
      await state.cloud.submit(STORE,'appointment',data.name,data.phone,{
        requested_for:new Date(data.date+'T'+data.time+':00').toISOString(),
        request_data:{serviceCode:data.serviceCode,serviceName:data.service,date:data.date,time:data.time,note:data.note,durationMinutes:data.duration,referencePrice:data.priceLabel,priceAmount:data.priceAmount,currency:'BOB',paymentMethod:'qr',paymentStatus:data.priceAmount===null?'quote_required':'qr_pending_configuration'}
      });
      state.requests=await state.cloud.requests(STORE);
      closeConfirm('Solicitud registrada en tu historial en línea. Falta la confirmación real de Navaja 27.');
      $('bookingForm').reset();fillProfileToBooking();setMinimumDate();showView('mis-turnos');
    } catch(error) { toast('No se pudo guardar: '+error.message,'error'); }
    finally { $('confirmPending').disabled=false; }
  }
  $('bookingForm').addEventListener('submit',event=>{
    event.preventDefault();
    const name=$('clientName').value.trim(),phone=$('clientPhone').value.trim(),service=state.services.find(x=>x.id===$('bookingService').value),date=$('bookingDate').value,time=$('bookingTime').value,noteText=$('bookingNote').value.trim();
    if(name.length<2||!/^\d{8}$/.test(phone)||!service||!date||!time){$('bookingMessage').textContent='Revisa nombre, celular de 8 dígitos, servicio, fecha y hora.';return;}
    const start=new Date(date+'T'+time+':00');if(Number.isNaN(start.getTime())||start<=new Date()){$('bookingMessage').textContent='Elige una fecha y hora futuras.';return;}
    const conflict=state.requests.some(r=>{const d=r.request_data||{};return r.request_type==='appointment'&&d.date===date&&d.time===time&&r.status!=='cancelled';});
    if(conflict){toast('Ya tienes una solicitud para ese horario. Elige otra hora.','error');return;}
    $('bookingMessage').textContent='Conexión lista. Revisa los datos antes de confirmar.';
    openConfirm({name,phone,service:service.name,serviceCode:service.id,date,time,note:noteText,duration:service.duration,priceLabel:service.priceLabel,priceAmount:service.price});
  });
  $('confirmPending').addEventListener('click',confirmPending);
  $('closeQrPayment').addEventListener('click',()=>$('qrPaymentModal').hidden=true);
  $('closeQrPaymentBottom').addEventListener('click',()=>$('qrPaymentModal').hidden=true);
  $('qrPaymentModal').addEventListener('click',event=>{if(event.target===$('qrPaymentModal'))$('qrPaymentModal').hidden=true;});
  $('cancelPending').addEventListener('click',()=>closeConfirm('Solicitud temporal cancelada.'));
  $('closeConfirm').addEventListener('click',()=>closeConfirm('Solicitud temporal cancelada.'));
  $('clearRequests').addEventListener('click',async()=>{
    if(!confirm('¿Borrar tu historial de solicitudes de Navaja 27 en la nube?'))return;
    try{await state.cloud.deleteRequests(STORE);state.requests=[];renderRequests();toast('Historial eliminado de la base de datos.');}
    catch(error){toast('No se pudo borrar: '+error.message,'error');}
  });
  $('profileForm').addEventListener('submit',async event=>{
    event.preventDefault();const p=profilePayload();
    if(p.display_name.length<2||!/^\d{8}$/.test(p.phone)){$('profileMessage').textContent='Ingresa un nombre válido y un celular boliviano de 8 dígitos.';return;}
    if(!state.cloud){$('profileMessage').textContent='Conectando con la base de datos. Inténtalo de nuevo en unos segundos.';return;}
    const button=event.currentTarget.querySelector('button[type="submit"]');button.disabled=true;
    try{state.profile=await state.cloud.saveProfile(STORE,p);$('profileMessage').textContent='Perfil creado o actualizado correctamente en la nube.';renderProfile();fillProfileToBooking();toast('Perfil sincronizado.');}
    catch(error){$('profileMessage').textContent='No se pudo guardar: '+error.message;}
    finally{button.disabled=false;}
  });
  $('deleteProfile').addEventListener('click',async()=>{
    if(!confirm('¿Eliminar tu perfil de Navaja 27 de la nube?'))return;
    try{await state.cloud.deleteProfile(STORE);state.profile=null;renderProfile();toast('Perfil eliminado de la base de datos.');}
    catch(error){toast('No se pudo eliminar: '+error.message,'error');}
  });
  async function init() {
    try {
      state.cloud=await window.catalogCloudReady;
      const [items,profile,requests]=await Promise.all([state.cloud.items(STORE),state.cloud.profile(STORE),state.cloud.requests(STORE)]);
      state.services=items.map(mapService);state.profile=profile;state.requests=requests;
      populateSelect();renderServices();renderProfile();fillProfileToBooking();
      if(!state.services.length)$('serviceGrid').replaceChildren(node('p','El catálogo todavía no tiene servicios publicados.','empty-state'));
      const start=location.hash.replace('#','');showView(['inicio','servicios','turnos','mis-turnos','cuenta'].includes(start)?start:'inicio');
      setMinimumDate();setStatus('online','Online · Base sincronizada');
    } catch(error) {
      console.error(error);setStatus('offline','Sin conexión a la base');
      const message=error.message||'No se pudo conectar con Supabase.';
      $('serviceGrid').replaceChildren(node('p',message+' Revisa la conexión y la configuración de acceso anónimo.','empty-state'));
      $('bookingMessage').textContent=message;
      $('profileMessage').textContent=message;
      showView('inicio');
    }
  }
  let checkTimer=null;
  function networkCheck(){if(!navigator.onLine){setStatus('offline','Offline');return;}if(state.cloud)setStatus('online','Online · Base conectada');}
  window.addEventListener('online',networkCheck);window.addEventListener('offline',networkCheck);
  window.addEventListener('pagehide',()=>{clearInterval(checkTimer);clearInterval(state.timer);});
  if('serviceWorker'in navigator&&(location.protocol==='https:'||location.hostname==='localhost'))navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).catch(console.warn);
  init();checkTimer=setInterval(networkCheck,25000);
})();