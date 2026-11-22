(() => {
  const services = [
    {name:'Corte clásico',category:'cabello',price:25,time:'35 min',desc:'Corte tradicional con laterales limpios y acabado a tu gusto.',image:'https://images.pexels.com/photos/7447150/pexels-photo-7447150.jpeg?auto=compress&cs=tinysrgb&w=900'},
    {name:'Corte con degradado',category:'cabello',price:30,time:'45 min',desc:'Transición progresiva en laterales y nuca, con definición arriba.',image:'https://images.pexels.com/photos/32329615/pexels-photo-32329615.jpeg?auto=compress&cs=tinysrgb&w=900'},
    {name:'Corte infantil',category:'cabello',price:20,time:'30 min',desc:'Un acabado cómodo y limpio para los más pequeños.',image:'https://images.pexels.com/photos/8867538/pexels-photo-8867538.jpeg?auto=compress&cs=tinysrgb&w=900'},
    {name:'Barba más diseño',category:'barba',price:25,time:'30 min',desc:'Perfilado de barba y definición de líneas.',image:'https://images.pexels.com/photos/9992817/pexels-photo-9992817.jpeg?auto=compress&cs=tinysrgb&w=900'},
    {name:'Corte más barba',category:'combos',price:50,time:'65 min',desc:'Servicio combinado de cabello y barba.',image:'https://images.pexels.com/photos/12464843/pexels-photo-12464843.jpeg?auto=compress&cs=tinysrgb&w=900'},
    {name:'Depilación con hilo',category:'cejas',price:25,time:'20 min',desc:'Limpieza y definición del contorno de las cejas.',image:'https://images.pexels.com/photos/7447150/pexels-photo-7447150.jpeg?auto=compress&cs=tinysrgb&w=900'},
    {name:'Perfilación y diseño',category:'cejas',price:20,time:'25 min',desc:'Diseño de cejas adaptado a la forma del rostro.',image:'https://images.pexels.com/photos/8867538/pexels-photo-8867538.jpeg?auto=compress&cs=tinysrgb&w=900'},
    {name:'Experiencia VIP',category:'combos',price:null,time:'75 min',desc:'Cuidado premium y detalles especiales. Consultar precio.',image:'https://images.pexels.com/photos/32329615/pexels-photo-32329615.jpeg?auto=compress&cs=tinysrgb&w=900'}
  ];
  const grid = document.getElementById('serviceGrid');
  const search = document.getElementById('searchInput');
  const note = document.getElementById('selectionNote');
  let filter = 'todos';
  let selected = '';
  const money = value => value === null ? 'Consultar' : 'Bs ' + value;
  function render() {
    const query = (search.value || '').toLocaleLowerCase('es');
    const items = services.filter(service => (filter === 'todos' || service.category === filter) && (service.name + ' ' + service.desc).toLocaleLowerCase('es').includes(query));
    grid.innerHTML = items.map(service => '<article class="service-card ' + (selected === service.name ? 'selected' : '') + '"><img src="' + service.image + '" alt="' + service.name + '" loading="lazy"><div class="service-body"><small>' + service.category.toUpperCase() + ' · ' + service.time + '</small><h3>' + service.name + '</h3><p>' + service.desc + '</p><div class="service-bottom"><strong>' + money(service.price) + '</strong><button type="button" data-select="' + service.name + '">' + (selected === service.name ? 'Seleccionado' : 'Elegir servicio') + '</button></div></div></article>').join('') || '<p>No hay servicios con ese nombre.</p>';
  }
  document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-filter]').forEach(item => item.classList.remove('active'));
    button.classList.add('active');
    filter = button.dataset.filter;
    render();
  }));
  grid.addEventListener('click', event => {
    const button = event.target.closest('[data-select]');
    if (!button) return;
    selected = button.dataset.select;
    note.textContent = 'Servicio seleccionado: ' + selected + '. Coordina el turno directamente con Navaja 27.';
    render();
  });
  search.addEventListener('input', render);
  render();
  const status = document.getElementById('appStatus');
  const update = () => status.textContent = navigator.onLine ? 'En línea' : 'Modo sin conexión';
  update();
  window.addEventListener('online', update);
  window.addEventListener('offline', update);
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('./sw.js').catch(console.warn);
})();