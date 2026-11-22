(() => {
  const base = 'https://franquicias.tada.com.bo/assets/img/';
  const products = [
    {id:'pacena',name:'Paceña',cat:'cervezas',kind:'Cerveza',detail:'Una de las marcas de cerveza del portafolio TaDa.',img:base+'Pace%C3%B1a.png'},
    {id:'huari',name:'Huari',cat:'cervezas',kind:'Cerveza',detail:'Cerveza premium boliviana presente en el portafolio.',img:base+'Huari.png'},
    {id:'corona',name:'Corona',cat:'cervezas',kind:'Cerveza',detail:'Cerveza internacional del catálogo de marcas.',img:base+'Corona.png'},
    {id:'casareal',name:'Casa Real',cat:'singani',kind:'Singani',detail:'Singani boliviano incluido en la selección de marcas.',img:base+'Casa_Real.png'},
    {id:'josecuervo',name:'José Cuervo',cat:'destilados',kind:'Tequila',detail:'Tequila de la selección internacional de destilados.',img:base+'Jose_Cuervo.png'},
    {id:'havana',name:'Havana Club',cat:'destilados',kind:'Ron',detail:'Ron de origen cubano presente en el portafolio.',img:base+'Havana.png'},
    {id:'fernet',name:'Fernet Branca',cat:'destilados',kind:'Amaro',detail:'Bebida amarga italiana de la selección de licores.',img:base+'Fernet_Branca.png'},
    {id:'cocacola',name:'Coca-Cola',cat:'sin-alcohol',kind:'Sin alcohol',detail:'Opción sin alcohol para acompañar cualquier encuentro.',img:base+'Coca_Cola.png'}
  ];
  const grid = document.getElementById('productGrid');
  const search = document.getElementById('searchInput');
  const bar = document.getElementById('selectionBar');
  const count = document.getElementById('selectionCount');
  const modal = document.getElementById('selectionModal');
  const lines = document.getElementById('selectionLines');
  let filter = 'todos';
  let selected = {};
  const render = () => {
    const query = (search.value || '').toLocaleLowerCase('es');
    const found = products.filter(p => (filter === 'todos' || filter === p.cat) && (p.name + ' ' + p.kind + ' ' + p.detail).toLocaleLowerCase('es').includes(query));
    grid.innerHTML = found.map(p => '<article class="product"><div class="product-art"><img src="' + p.img + '" alt="' + p.name + '" loading="lazy" onerror="this.style.display=\'none\'"></div><div class="product-body"><small>' + p.kind + '</small><h3>' + p.name + '</h3><p>' + p.detail + '</p><div class="product-foot"><span>Consultar precio</span><button type="button" data-add="' + p.id + '">' + (selected[p.id] ? 'Añadido ✓' : 'Añadir a lista +') + '</button></div></div></article>').join('') || '<p>No encontramos bebidas con ese nombre.</p>';
  };
  const updateSelection = () => {
    const total = Object.values(selected).reduce((a,b) => a + b, 0);
    count.textContent = total + (total === 1 ? ' producto' : ' productos');
    bar.hidden = total === 0;
  };
  document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-filter]').forEach(item => item.classList.remove('active'));
    button.classList.add('active');
    filter = button.dataset.filter;
    render();
  }));
  search.addEventListener('input', render);
  grid.addEventListener('click', event => {
    const button = event.target.closest('[data-add]');
    if (!button) return;
    const id = button.dataset.add;
    selected[id] = (selected[id] || 0) + 1;
    updateSelection();
    render();
  });
  const showSelection = () => {
    const chosen = products.filter(p => selected[p.id]);
    lines.innerHTML = chosen.map(p => '<div class="selection-line"><span>' + selected[p.id] + ' × ' + p.name + '</span><button type="button" data-remove="' + p.id + '">Quitar</button></div>').join('');
    modal.hidden = false;
  };
  document.getElementById('showSelection').addEventListener('click', showSelection);
  document.getElementById('closeModal').addEventListener('click', () => modal.hidden = true);
  modal.addEventListener('click', event => { if (event.target === modal) modal.hidden = true; });
  lines.addEventListener('click', event => {
    const button = event.target.closest('[data-remove]');
    if (!button) return;
    delete selected[button.dataset.remove];
    updateSelection();
    showSelection();
    render();
    if (!Object.keys(selected).length) modal.hidden = true;
  });
  document.getElementById('copySelection').addEventListener('click', async () => {
    const text = 'Mi selección TaDa\\n' + products.filter(p => selected[p.id]).map(p => selected[p.id] + ' × ' + p.name).join('\\n') + '\\nConsultar precio y disponibilidad.';
    const button = document.getElementById('copySelection');
    try { await navigator.clipboard.writeText(text); button.textContent = 'Copiado ✓'; }
    catch (_) { button.textContent = 'No se pudo copiar'; }
  });
  document.getElementById('clearSelection').addEventListener('click', () => { selected = {}; updateSelection(); render(); modal.hidden = true; });
  const status = document.getElementById('appStatus');
  const updateStatus = () => status.textContent = navigator.onLine ? 'En línea' : 'Modo sin conexión';
  updateStatus();
  window.addEventListener('online', updateStatus);
  window.addEventListener('offline', updateStatus);
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('./sw.js').catch(console.warn);
  updateSelection();
  render();
})();