(function () {
  var PHONE = '5551999445258';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  // intro loader: once per session, skipped with reduced motion
  var root = document.documentElement, loader = $('#loader');
  var skipIntro = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  try { skipIntro = skipIntro || sessionStorage.getItem('tectiIntro') === '1'; } catch (e) {}
  function finishIntro() {
    root.classList.add('ready');
    loader.classList.add('done');
    root.style.overflow = '';
    setTimeout(function () { loader.remove(); }, 1000);
  }
  if (skipIntro) { loader.remove(); root.classList.add('ready'); }
  else {
    root.style.overflow = 'hidden';
    try { sessionStorage.setItem('tectiIntro', '1'); } catch (e) {}
    setTimeout(finishIntro, 1900);
  }

  // year
  $('#y').textContent = new Date().getFullYear();

  // header shadow line + mobile menu
  var top = $('#top');
  window.addEventListener('scroll', function () { top.classList.toggle('is-stuck', window.scrollY > 8); }, { passive: true });
  var burger = $('#burger'), nav = $('#nav');
  function closeNav() { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Abrir menu'); }
  burger.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  });
  $$('a', nav).forEach(function (a) { a.addEventListener('click', closeNav); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeNav(); });

  // reveal on scroll
  var items = $$('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    items.forEach(function (el, i) { el.style.transitionDelay = (i % 3) * 70 + 'ms'; io.observe(el); });
  } else { items.forEach(function (el) { el.classList.add('in'); }); }

  // quote builder
  var form = $('#quote'), nome = $('#nome'), det = $('#det'), prev = $('#preview');
  function services() { return $$('input[name=svc]:checked', form).map(function (i) { return i.value; }); }
  function where() { return $('input[name=onde]:checked', form).value; }
  function listPt(a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' e ' + a[a.length - 1]; }
  function build() {
    var s = services(), n = nome.value.trim(), d = det.value.trim();
    var t = 'Olá, Tec-Ti!' + (n ? ' Meu nome é ' + n + '.' : '');
    t += s.length ? '\nTenho interesse em: ' + listPt(s) + '.' : '\nGostaria de pedir um orçamento.';
    t += '\nPrefiro o atendimento ' + where() + '.';
    if (d) t += '\nDetalhes: ' + d;
    return t;
  }
  var tmr;
  function update() {
    prev.textContent = build();
    prev.classList.add('bump'); clearTimeout(tmr); tmr = setTimeout(function () { prev.classList.remove('bump'); }, 160);
    $('#svc-err').textContent = '';
    $$('#chips input').forEach(function () {});
    syncPorts();
  }
  function syncPorts() {
    var s = services();
    $$('.port').forEach(function (p) { p.classList.toggle('is-on', s.indexOf(p.dataset.service) > -1); });
  }
  form.addEventListener('input', function (e) { if (e.target === nome) $('#nome-err').textContent = ''; update(); });
  form.addEventListener('change', update);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = true;
    if (!nome.value.trim()) { $('#nome-err').textContent = 'Informe seu nome para a gente saber com quem falar.'; nome.focus(); ok = false; }
    if (!services().length && !det.value.trim()) {
      $('#svc-err').textContent = 'Escolha pelo menos um serviço ou conte o que você precisa.';
      if (ok) $('#chips input').focus();
      ok = false;
    }
    if (!ok) return;
    window.open('https://wa.me/' + PHONE + '?text=' + encodeURIComponent(build()), '_blank', 'noopener');
  });

  // service buttons (rack ports + card links) pre-fill the form
  $$('[data-service]').forEach(function (b) {
    b.addEventListener('click', function () {
      var box = $('input[name=svc][value="' + b.dataset.service + '"]', form);
      if (box) box.checked = !(b.classList.contains('port') && box.checked) ? true : false;
      update();
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      $('#orcamento').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      setTimeout(function () { nome.focus({ preventScroll: true }); }, reduce ? 0 : 600);
    });
  });

  update();
})();
