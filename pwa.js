'use strict';
(() => {
  const $ = id => document.getElementById(id);
  const STORE = 'navaja27';
  const QR_MATRIX_B64 = '/jHRFvPpkIuD/BHNdu0u2yJzUG6GPGVQ/oUIArt04EHAogX6fpXbo4tv9Da/O3euwVI2xTePHdRxB/qqqqqqqqqqr+AEPDHNDkQa6gCWhsz/bIPmcC0HDWh8Csgmq6rblfn1gFHHmEl7LCI930Cxg55jdlEzppmfzKrMbGyAwMlWPk7XbGcdS3OAPwYEcZx4fDPMTZsBfZGiYZoh5hbZDqsK0X3CI++I3oYXKoi8vaUd5voHJCKncbkB2dY3QYAU8jNEM1S8ainuqXhJeehuQnpuK7d61GWjpXj7lgCMNxgn8NgA5Vtnb4/T/zz76KSfoceqZEXMEfojxTaupapzlaxagrcxwBUWkyxwA/EI/Sovt9L++mP9JiMMQokMvHvO6MzgDrN35CdXceQRkERKRaZQTmgWhdg9ANa4Wmq/AWIZGuGvbDcuEY1kjvxPP0zDpXn/MK6oVRCpOUSjyKCa2+pkzdqo2tjtVM/9rPHW/8Ma+rXk8AwCty/LPXxi3TC4EDfj6dy96QzM18IAku2IjtfiZfaY7RF7gtjqYDlm4Qc9HctbSdpmuHT9YfK9YEcJomwYGdj8Qp+29vt+cxvxYp+Esz5NHc7xRRNF6T0UeoO9rJ/yorqqzMW8LGAgcfNLRBfuG//MNvhRr++KejkvM4OZA9GoaiIC7dFsXE9I3JPDPgXs3X8WiEtcdDkoCjWjL3aIm1U1SpK7aqMLB7SFfdMg1+5sbhR18IR4Zyfiva7vQjLVF/jMrAMPlZENKYFR0MQ5Hh3Z2aKqpLY4lq3lUs/r6DYS3aFGIqbFkjwE7KI+DEvBkLTes8tvw6XbKkHmwCJFwvW01rubqJjTpzK3J3Y3euFuE627A6TLQRSKt6a6D5jfPqlJ+IBy0ceIZx4nJF/5zTKgLKq5ECpQXpbRkvFGaUcXumhY+4n/4ipPldUD1lkmn/5KxO6eVw8WKGpqkvMEdJVQY3dvXAOv64ARL5bXsI6dAA==';
  const state = { services: [], filter: 'todos', view: 'inicio', requests: [], profile: null, pending: null, timer: null, expiresAt: 0, agendaDate: null, cloud: null };
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
    if(name==='mis-turnos'){state.agendaDate=state.agendaDate||localDate();renderRequests();}
    if(name==='cuenta')renderProfile();
    window.scrollTo({top:0,behavior:'auto'});
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
    const hasPrice=typeof data.priceAmount==='number'&&Number.isFinite(data.priceAmount);
    $('bookingQrPanel').hidden=!hasPrice;$('quoteOnlyNote').hidden=hasPrice;
    $('paymentAcknowledged').checked=false;$('confirmPending').disabled=hasPrice;
    $('bookingQrAmount').textContent=hasPrice?'Total a transferir: Bs '+data.priceAmount.toLocaleString('es-BO'):'Precio por confirmar';$('confirmPending').textContent=hasPrice?'Confirmar turno':'Enviar solicitud para cotizar';
    if(hasPrice)drawAltokeQr();
    $('bookingConfirm').hidden=false;updateCountdown();state.timer=setInterval(updateCountdown,250);$('confirmPending').focus();
  }
  function toDate(row) {
    const d=row.request_data||{};
    return (d.date|| (row.requested_for?new Date(row.requested_for).toLocaleDateString('en-CA'):''))+' '+(d.time||'');
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
  function dateFromIso(value){const [y,m,d]=value.split('-').map(Number);return new Date(y,m-1,d);}
  function isoFromDate(date){return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');}
  function shiftIsoDate(value,days){const date=dateFromIso(value);date.setDate(date.getDate()+days);return isoFromDate(date);}
  function agendaWeekStart(value){const date=dateFromIso(value);date.setDate(date.getDate()-((date.getDay()+6)%7));return isoFromDate(date);}
  function agendaDateLabel(value,options){return dateFromIso(value).toLocaleDateString('es-BO',options||{weekday:'long',day:'numeric',month:'long'});}
  function requestDate(row){const d=row.request_data||{};return d.date||(row.requested_for?isoFromDate(new Date(row.requested_for)):'');}
  function renderRequests(){
    const list=$('requestList');list.replaceChildren();
    const today=localDate();state.agendaDate=state.agendaDate||today;
    const all=state.requests.filter(row=>row.request_type==='appointment'&&!['cancelled','canceled'].includes(String(row.status||'').toLowerCase()));
    const toolbar=node('div',undefined,'agenda-toolbar');
    const weekStart=agendaWeekStart(state.agendaDate);
    const weekLabel=node('strong',agendaDateLabel(weekStart,{day:'numeric',month:'long'})+' – '+agendaDateLabel(shiftIsoDate(weekStart,6),{day:'numeric',month:'long',year:'numeric'}));
    const controls=node('div',undefined,'agenda-controls');
    const prev=node('button','‹','agenda-arrow'),next=node('button','›','agenda-arrow'),todayButton=node('button','Hoy','agenda-today');
    prev.type=next.type=todayButton.type='button';prev.setAttribute('aria-label','Semana anterior');next.setAttribute('aria-label','Semana siguiente');
    prev.addEventListener('click',()=>{state.agendaDate=shiftIsoDate(state.agendaDate,-7);renderRequests();});
    next.addEventListener('click',()=>{state.agendaDate=shiftIsoDate(state.agendaDate,7);renderRequests();});
    todayButton.addEventListener('click',()=>{state.agendaDate=today;renderRequests();});
    controls.append(prev,todayButton,next);toolbar.append(weekLabel,controls);list.append(toolbar);
    const week=node('div',undefined,'agenda-week'),dayNames=['lun','mar','mié','jue','vie','sáb','dom'];
    for(let i=0;i<7;i++){
      const date=shiftIsoDate(weekStart,i),dateRows=all.filter(row=>requestDate(row)===date);
      const button=node('button',undefined,'agenda-day'+(date===state.agendaDate?' active':'')+(date===today?' is-today':''));
      button.type='button';button.append(node('span',dayNames[i]),node('strong',String(dateFromIso(date).getDate())),node('small',dateRows.length?String(dateRows.length)+' turno(s)':'—'));
      button.setAttribute('aria-pressed',String(date===state.agendaDate));
      button.addEventListener('click',()=>{state.agendaDate=date;renderRequests();});week.append(button);
    }
    list.append(week);
    const dayTitle=node('div',undefined,'agenda-day-title');
    dayTitle.append(node('h2',agendaDateLabel(state.agendaDate)),node('small',state.agendaDate===today?'Agenda de hoy':state.agendaDate===shiftIsoDate(today,1)?'Agenda de mañana':'Turnos de esta fecha'));
    list.append(dayTitle);
    const dayRows=all.filter(row=>requestDate(row)===state.agendaDate).sort((a,b)=>String((a.request_data||{}).time||'').localeCompare(String((b.request_data||{}).time||'')));
    if(!dayRows.length){
      const empty=node('div',undefined,'agenda-empty');
      empty.append(node('strong','No tienes cortes agendados para este día.'),node('p','Cuando solicites un turno, aparecerá aquí con su hora y duración.'));
      const book=node('button','Reservar un corte','button-primary');book.type='button';book.addEventListener('click',()=>showView('turnos'));empty.append(book);list.append(empty);return;
    }
    const timeline=node('div',undefined,'agenda-timeline');
    dayRows.forEach(row=>{
      const d=row.request_data||{},event=node('article',undefined,'agenda-event'),time=node('div',undefined,'agenda-time'),info=node('div',undefined,'agenda-event-info');
      const startTime=String(d.time||'--:--'),duration=Number(d.durationMinutes||30),parts=startTime.split(':').map(Number);
      const endTime=parts.length===2&&parts.every(Number.isFinite)?String(Math.floor((parts[0]*60+parts[1]+duration)/60)%24).padStart(2,'0')+':'+String((parts[0]*60+parts[1]+duration)%60).padStart(2,'0'):'';
      time.append(node('strong',startTime),node('small',endTime?startTime+' – '+endTime:'Hora'));
      info.append(node('h3',d.serviceName||'Servicio de barbería'),node('p',(row.contact_name||'Cliente')+' · '+duration+' min'),node('small',row.status==='confirmed'?'Turno confirmado':'Pendiente de confirmación','agenda-status'));
      if(d.paymentStatus==='reported_paid_pending_manual_review')info.append(node('small','Pago informado · verificación manual pendiente','agenda-payment'));
      else if(d.paymentStatus==='quote_required')info.append(node('small','Precio por confirmar antes del pago','agenda-payment'));
      event.append(time,info);timeline.append(event);
    });
    list.append(timeline);
  }
  async function confirmPending() {
    const data=state.pending;if(!data)return;
    if(Date.now()>=state.expiresAt){closeConfirm('El tiempo terminó. Vuelve a solicitar el turno.');return;}
    if(data.priceAmount!==null&&!$('paymentAcknowledged').checked){toast('Primero realiza el pago por QR y marca la confirmación.','error');return;}
    $('confirmPending').disabled=true;
    try {
      await state.cloud.saveProfile(STORE,{display_name:data.name,phone:data.phone,contact_preference:state.profile?.contact_preference||'whatsapp'});
      state.profile=await state.cloud.profile(STORE);
      await state.cloud.submit(STORE,'appointment',data.name,data.phone,{
        requested_for:new Date(data.date+'T'+data.time+':00').toISOString(),
        request_data:{serviceCode:data.serviceCode,serviceName:data.service,date:data.date,time:data.time,note:data.note,durationMinutes:data.duration,referencePrice:data.priceLabel,priceAmount:data.priceAmount,currency:'BOB',paymentMethod:data.priceAmount===null?null:'Altoke QR',paymentStatus:data.priceAmount===null?'quote_required':'reported_paid_pending_manual_review',customerDeclaredPaid:data.priceAmount!==null&&$('paymentAcknowledged').checked,paymentVerification:'manual'}
      });
      state.requests=await state.cloud.requests(STORE);
      state.agendaDate=data.date;
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
  $('paymentAcknowledged').addEventListener('change',()=>{$('confirmPending').disabled=!$('paymentAcknowledged').checked;});
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