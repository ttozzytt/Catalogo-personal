'use strict';
(() => {
  const $=id=>document.getElementById(id),STORE='compucenter';
  const state={products:[],filter:'todos',view:'inicio',compare:[],requests:[],profile:null,pending:null,expiresAt:0,timer:null,cloud:null};
  const node=(tag,text,cls)=>{const el=document.createElement(tag);if(text!==undefined)el.textContent=String(text);if(cls)el.className=cls;return el;};
  function toast(message,type){const el=$('toast');el.textContent=message;el.className='toast show'+(type?' '+type:'');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.className='toast',3200);}
  function status(s,label){$('networkStatus').dataset.state=s;$('networkStatus').querySelector('b').textContent=label;}
  function money(v){return v===null||v===undefined?'Cotizar':'Bs '+Number(v).toLocaleString('es-BO');}
  function mapProduct(row){
    const s=row.specs||{};
    return{id:row.item_code,name:row.name,brand:row.brand||'',category:row.category,categoryLabel:s.categoryLabel||row.category,
      price:row.price,shortDescription:row.description||s.shortDescription||'',image:row.image_url||'',imageAlt:row.image_alt||row.name,url:s.url||'https://www.compucenter.store/category/componentes-pc',
      specs:s,compare:s.compare!==false,artLabel:s.artLabel||row.brand||'COMPONENTE'};
  }
  function showView(name){
    const target=$('view-'+name);if(!target)return;
    document.querySelectorAll('.view').forEach(v=>{v.hidden=true;v.classList.remove('active');});
    target.hidden=false;target.classList.add('active');
    document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===name));
    state.view=name;if(location.hash!=='#'+name)history.replaceState(null,'','#'+name);
    if(name==='comparar')renderCompare();if(name==='historial')renderHistory();
  }
  document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
  document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.go)));
  function updateBadge(){$('compareBadge').textContent=state.compare.length;$('mobileCompareBadge').textContent=state.compare.length;}
  async function saveCompare(){try{await state.cloud.saveUserState(STORE,'compare',{ids:state.compare});}catch(error){toast('No se pudo sincronizar la comparación: '+error.message,'error');}}
  async function toggleCompare(id){
    if(state.compare.includes(id))state.compare=state.compare.filter(x=>x!==id);
    else if(state.compare.length>=3){toast('Puedes comparar hasta tres productos.','error');return;}
    else state.compare.push(id);
    updateBadge();await saveCompare();renderProducts();if(state.view==='comparar')renderCompare();
  }
  function renderProducts(){
    const grid=$('productGrid'),q=$('productSearch').value.trim().toLocaleLowerCase('es');grid.replaceChildren();
    const rows=state.products.filter(p=>(state.filter==='todos'||p.category===state.filter)&&(p.name+' '+p.brand+' '+p.shortDescription+' '+Object.values(p.specs||{}).join(' ')).toLocaleLowerCase('es').includes(q));
    $('catalogCount').textContent=rows.length+' productos · '+state.products.length+' en catálogo';
    if(!rows.length){grid.append(node('p','No hay componentes en esta categoría.','empty-state'));return;}
    rows.forEach(p=>{
      const card=node('article',undefined,'product-card'),art=node('div',undefined,'product-art'),body=node('div',undefined,'product-body');
      if(p.image){
        const img=node('img');img.src=p.image;img.alt=p.imageAlt;img.loading='lazy';img.decoding='async';
        img.addEventListener('error',()=>{img.remove();art.append(node('span',p.artLabel,'product-art-fallback'));},{once:true});art.append(img);
      }else art.append(node('span',p.artLabel,'product-art-fallback'));
      body.append(node('small',(p.brand||'A cotizar')+' · '+p.categoryLabel),node('h3',p.name),node('p',p.shortDescription));
      const foot=node('div',undefined,'product-foot'),price=node('strong',money(p.price)),actions=node('div',undefined,'product-actions');
      const detail=node('button','Ficha'),request=node('button',p.price===null?'Solicitar':'Cotizar +');detail.type=request.type='button';
      detail.addEventListener('click',()=>showDetail(p));request.addEventListener('click',()=>startRequest(p));
      if(p.compare===false)detail.classList.add('wide');
      else{const compare=node('button',state.compare.includes(p.id)?'Comparando ✓':'Comparar');compare.type='button';compare.classList.toggle('selected',state.compare.includes(p.id));compare.addEventListener('click',()=>toggleCompare(p.id));actions.append(compare);}
      actions.append(detail,request);foot.append(price,actions);body.append(foot);card.append(art,body);grid.append(card);
    });
  }
  function showDetail(p){
    $('detailTitle').textContent=p.name+' · '+(p.brand||'Pedido especial');$('detailSpecs').replaceChildren();
    const list=node('dl',undefined,'spec-list');
    Object.entries(p.specs||{}).filter(([k,v])=>!['url','shortDescription','categoryLabel','artLabel','compare'].includes(k)&&v!==null&&v!=='').forEach(([key,value])=>{
      const item=node('div');item.append(node('dt',key),node('dd',String(value)));list.append(item);
    });
    $('detailSpecs').append(list);$('detailLink').href=p.url;$('detailLink').textContent='Ver producto ↗';$('detailModal').hidden=false;$('closeDetail').focus();
  }
  function renderCompare(){
    const area=$('comparison');area.replaceChildren();const products=state.products.filter(p=>state.compare.includes(p.id));
    if(!products.length){area.append(node('p','Aún no seleccionaste componentes.','empty-state'));return;}
    const keys=['capacity','memory','type','speed','bus','interface','socket','chipset','cores','clock','cache','tdp','power','formFactor','warranty'];
    const fields=[['Fabricante',p=>p.brand],['Precio',p=>money(p.price)],['Tipo',p=>p.categoryLabel],...keys.map(k=>[k.charAt(0).toUpperCase()+k.slice(1),p=>p.specs?.[k]||'—'])];
    const table=node('table'),thead=node('thead'),head=node('tr');head.append(node('th','Característica'));
    products.forEach(p=>head.append(node('th',p.name)));thead.append(head);const tbody=node('tbody');
    fields.forEach(([label,get])=>{const row=node('tr');row.append(node('td',label));products.forEach(p=>row.append(node('td',String(get(p)||'—'))));tbody.append(row);});
    table.append(thead,tbody);area.append(table);
  }
  $('productSearch').addEventListener('input',renderProducts);
  document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{
    document.querySelectorAll('[data-filter]').forEach(x=>x.classList.remove('active'));b.classList.add('active');state.filter=b.dataset.filter;renderProducts();
  }));
  $('clearCompare').addEventListener('click',async()=>{state.compare=[];updateBadge();await saveCompare();renderCompare();renderProducts();toast('Comparación eliminada de tu cuenta.');});
  $('closeDetail').addEventListener('click',()=>$('detailModal').hidden=true);
  $('detailModal').addEventListener('click',e=>{if(e.target===$('detailModal'))$('detailModal').hidden=true;});
  function startRequest(p){
    showView('solicitud');
    if(p){$('requestCategory').value=p.category;$('requestBrand').value=p.brand;$('requestModel').value=p.name;$('requestQuantity').value='1';$('requestDetails').value=p.shortDescription;$('requestBudget').value=p.price??'';}
    else{$('requestCategory').value='cpu';$('requestModel').focus();}
    if(state.profile){$('requestName').value=state.profile.display_name||'';$('requestPhone').value=state.profile.phone||'';$('requestCity').value=state.profile.city||'';$('requestAddress').value=state.profile.address||'';}
  }
  const categoryNames={gpu:'Tarjeta gráfica',cpu:'Procesador',ram:'Memoria RAM',ssd:'SSD SATA',m2:'SSD M.2 NVMe',hdd:'Disco duro HDD',board:'Placa madre',power:'Fuente de poder',case:'Gabinete',other:'Otro componente'};
  function closeRequest(message){clearInterval(state.timer);state.timer=null;state.pending=null;state.expiresAt=0;$('requestConfirm').hidden=true;if(message)toast(message);}
  function updateCountdown(){const left=Math.max(0,state.expiresAt-Date.now()),sec=Math.ceil(left/1000);$('requestCountdown').textContent='00:'+String(sec).padStart(2,'0');$('requestCountdownBar').style.width=(left/60000*100)+'%';if(left<=0)closeRequest('El tiempo terminó. No se guardó la solicitud.');}
  function openRequestConfirm(data){
    state.pending=data;state.expiresAt=Date.now()+60000;
    $('requestSummary').textContent=data.quantity+' × '+(data.model||categoryNames[data.category])+' · '+categoryNames[data.category]+' · '+data.name+' · '+data.city+' · '+data.delivery;
    $('requestConfirm').hidden=false;updateCountdown();state.timer=setInterval(updateCountdown,250);$('acceptRequest').focus();
  }
  async function acceptRequest(){
    const d=state.pending;if(!d)return;
    if(Date.now()>=state.expiresAt){closeRequest('El tiempo terminó. Vuelve a preparar la solicitud.');return;}
    $('acceptRequest').disabled=true;
    try{
      state.profile=await state.cloud.saveProfile(STORE,{display_name:d.name,phone:d.phone,city:d.city,address:d.address||null,contact_preference:'whatsapp'});
      const delivery=d.delivery==='Retiro en tienda'?'pickup':d.delivery==='Consultar envío'?'carrier':'delivery';
      await state.cloud.submit(STORE,'quote',d.name,d.phone,{
        delivery_method:delivery,address:d.address||null,
        request_data:{category:d.category,categoryLabel:categoryNames[d.category]||d.category,brand:d.brand,model:d.model,quantity:d.quantity,budget:d.budget,details:d.details,city:d.city,deliveryLabel:d.delivery,priceAndStock:'to_confirm',requestPurpose:d.category==='cpu'?'quote_or_restock':'quote'}
      });
      state.requests=await state.cloud.requests(STORE);
      closeRequest('Solicitud guardada. Puedes revisarla en Mis solicitudes.');
      $('requestForm').reset();$('requestQuantity').value='1';renderHistory();showView('historial');
    }catch(error){toast('No se pudo guardar: '+error.message,'error');}
    finally{$('acceptRequest').disabled=false;}
  }
  $('requestForm').addEventListener('submit',event=>{
    event.preventDefault();
    const d={category:$('requestCategory').value,brand:$('requestBrand').value.trim(),model:$('requestModel').value.trim(),quantity:Number($('requestQuantity').value),
      budget:$('requestBudget').value?Number($('requestBudget').value):null,details:$('requestDetails').value.trim(),
      name:$('requestName').value.trim(),phone:$('requestPhone').value.trim(),city:$('requestCity').value,
      delivery:$('requestDelivery').value,address:$('requestAddress').value.trim()};
    if(!d.category||d.name.length<2||!/^\d{8}$/.test(d.phone)||!d.city||!Number.isInteger(d.quantity)||d.quantity<1||d.quantity>10||!$('requestConsent').checked){
      $('requestMessage').textContent='Revisa componente, nombre, celular, ciudad, cantidad y aceptación de la solicitud.';return;
    }
    if(d.budget!==null&&(!Number.isFinite(d.budget)||d.budget<0)){$('requestMessage').textContent='Escribe un presupuesto válido.';return;}
    $('requestMessage').textContent='Revisa tu solicitud antes de guardarla en línea.';openRequestConfirm(d);
  });
  $('closeRequestConfirm').addEventListener('click',()=>closeRequest('Solicitud cancelada.'));
  $('cancelRequest').addEventListener('click',()=>closeRequest('Solicitud cancelada.'));
  $('acceptRequest').addEventListener('click',acceptRequest);
  function renderHistory(){
    const list=$('historyList');list.replaceChildren();
    if(!state.requests.length){list.append(node('p','Todavía no tienes solicitudes.','empty-state'));return;}
    state.requests.forEach(row=>{
      const d=row.request_data||{},card=node('article',undefined,'history-card'),info=node('div');
      const title=(d.quantity||1)+' × '+(d.model||categoryNames[d.category]||'Componente');
      info.append(node('strong',title),
        node('p',(d.brand||'Marca por definir')+' · '+(d.categoryLabel||d.category||'Componente')+(d.budget!==null&&d.budget!==undefined?' · Presupuesto: '+money(d.budget):'')),
        node('small',row.contact_name+' · '+row.phone+' · '+(d.city||'')+' · '+(d.deliveryLabel||row.delivery_method||'')),
        node('small','Estado: '+row.status));
      card.append(info);list.append(card);
    });
  }
  $('clearRequests').addEventListener('click',async()=>{
    if(!confirm('¿Borrar tus solicitudes de CompuCenter de la nube?'))return;
    try{await state.cloud.deleteRequests(STORE);state.requests=[];renderHistory();toast('Historial eliminado de la base de datos.');}
    catch(error){toast('No se pudo borrar: '+error.message,'error');}
  });
  $('clearRequests').setAttribute('aria-label','Borrar historial de solicitudes');
  const cpuButton=document.querySelector('[data-request-cpu]');if(cpuButton)cpuButton.addEventListener('click',()=>startRequest(null));
  async function init(){
    try{
      state.cloud=await window.catalogCloudReady;
      const [items,compare,profile,requests]=await Promise.all([
        state.cloud.items(STORE),state.cloud.userState(STORE,'compare',{ids:[]}),state.cloud.profile(STORE),state.cloud.requests(STORE)
      ]);
      state.products=items.map(mapProduct);
      const ids=Array.isArray(compare.ids)?compare.ids:[];
      state.compare=ids.filter(id=>state.products.some(p=>p.id===id&&p.compare!==false)).slice(0,3);
      state.profile=profile;state.requests=requests;updateBadge();renderProducts();renderCompare();renderHistory();
      if(!state.products.length)$('productGrid').replaceChildren(node('p','No hay componentes publicados todavía.','empty-state'));
      status('online','Online · Base sincronizada');
    }catch(error){
      console.error(error);status('offline','Sin conexión a la base');
      $('productGrid').replaceChildren(node('p',(error.message||'No se pudo conectar con Supabase.')+' Revisa el acceso anónimo al proyecto.','empty-state'));
      $('requestMessage').textContent=error.message||'No se pudo conectar con Supabase.';
    }
  }
  function network(){if(!navigator.onLine){status('offline','Offline');return;}if(state.cloud)status('online','Online · Base conectada');}
  const start=location.hash.replace('#','');showView(['inicio','catalogo','comparar','solicitud','historial','tienda'].includes(start)?start:'inicio');
  status('checking','Conectando…');window.addEventListener('online',network);window.addEventListener('offline',network);
  window.addEventListener('pagehide',()=>clearInterval(state.timer));
  if('serviceWorker'in navigator&&(location.protocol==='https:'||location.hostname==='localhost'))navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).catch(console.warn);
  init();
})();