(function () {
  var PHONE = '5551999445258';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  // intro loader: shows on every load, skipped with reduced motion
  var root = document.documentElement, loader = $('#loader');
  var skipIntro = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function finishIntro() {
    root.classList.add('ready');
    loader.classList.add('done');
    root.style.overflow = '';
    setTimeout(function () { loader.remove(); }, 1000);
  }
  if (skipIntro) { loader.remove(); root.classList.add('ready'); }
  else {
    root.style.overflow = 'hidden';
    setTimeout(finishIntro, 2200);
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

  // quote chat
  var log = $('#log'), ctl = $('#ctl');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var st, step, interacted = false, runId = 0;
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt) e.textContent = txt; return e; }
  function listPt(a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' e ' + a[a.length - 1]; }
  function toEnd() { log.scrollTop = log.scrollHeight; }
  function add(who, text, extra) { var m = el('div', 'msg msg--' + who + (extra ? ' ' + extra : ''), text); log.appendChild(m); toEnd(); return m; }
  function bot(text, next, extra) {
    var id = runId;
    ctl.innerHTML = '';
    var t = el('div', 'typing'); t.setAttribute('aria-hidden', 'true'); t.innerHTML = '<i></i><i></i><i></i>';
    log.appendChild(t); toEnd();
    setTimeout(function () {
      if (id !== runId) return;
      t.remove(); add('bot', text, extra); if (next) next();
    }, reduceMotion ? 0 : 650);
  }
  function focusFirst() { if (!interacted) return; var f = $('input:not([type=checkbox]),textarea,button', ctl); if (f) f.focus({ preventScroll: true }); }
  function field(multi, ph, onSend) {
    var row = el('form', 'chat__row'), inp = el(multi ? 'textarea' : 'input'); 
    if (multi) inp.rows = 1; else inp.type = 'text';
    inp.placeholder = ph; inp.setAttribute('aria-label', ph);
    var b = el('button', 'chat__send'); b.type = 'submit'; b.setAttribute('aria-label', 'Enviar');
    b.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d="M3 20.5v-6.7l9-1.8-9-1.8V3.5L22 12 3 20.5Z"/></svg>';
    row.appendChild(inp); row.appendChild(b);
    row.addEventListener('submit', function (e) { e.preventDefault(); onSend(inp.value.trim()); });
    return row;
  }
  function btn(label, cls, fn) { var b = el('button', 'chat__btn ' + (cls || ''), label); b.type = 'button'; b.addEventListener('click', fn); return b; }

  var DEMO = [
    ['me', 'Oi! Preciso de um orçamento de servidor para o escritório.'],
    ['bot', 'Olá! Claro. Quantas pessoas vão usar e para que ele vai servir: arquivos, sistema, câmeras?'],
    ['me', 'Somos 12 pessoas. Hoje um PC comum guarda os arquivos, está lento e não tem backup.'],
    ['bot', 'Entendi. A gente dimensiona o servidor e configura o backup. Agora vou montar o seu pedido. Qual é o seu nome?']
  ];
  function play(i, done) {
    var id = runId;
    if (i >= DEMO.length) { done(); return; }
    var m = DEMO[i], last = i === DEMO.length - 1;
    if (m[0] === 'me') {
      setTimeout(function () { if (id !== runId) return; add('me', m[1]); play(i + 1, done); }, reduceMotion ? 0 : 600);
    } else {
      bot(m[1], function () { play(i + 1, done); });
    }
  }
  function start() {
    runId++; st = { name: '', svcs: st && st.svcs.length ? st.svcs : ['Servidores'], onde: '', det: '' };
    log.innerHTML = '';
    add('bot', 'Exemplo de conversa', 'msg--tag');
    ctl.innerHTML = '';
    play(0, askName);
    syncPorts();
  }
  function askName() {
    ctl.innerHTML = '';
    ctl.appendChild(field(false, 'Seu nome', function (v) {
      if (!v) { add('bot', 'Preciso do seu nome para a equipe saber com quem falar.'); return; }
      interacted = true; st.name = v; add('me', v); askSvc(true);
    }));
    focusFirst();
  }
  function askSvc(first) {
    var render = function () {
      ctl.innerHTML = '';
      var chips = el('div', 'chat__chips');
      ['Servidores', 'Desktops', 'Notebooks', 'CFTV', 'Redes', 'Assistência técnica'].forEach(function (s) {
        var l = el('label'), i = el('input'), sp = el('span', '', s);
        i.type = 'checkbox'; i.value = s; i.checked = st.svcs.indexOf(s) > -1;
        i.addEventListener('change', function () {
          st.svcs = $$('input:checked', chips).map(function (x) { return x.value; }); syncPorts();
        });
        l.appendChild(i); l.appendChild(sp); chips.appendChild(l);
      });
      ctl.appendChild(chips);
      ctl.appendChild(btn('Continuar', 'chat__btn--go', function () {
        if (!st.svcs.length) { add('bot', 'Escolha pelo menos um serviço para eu seguir.'); return; }
        add('me', listPt(st.svcs)); askWhere();
      }));
      step = 'svc';
    };
    bot(first ? 'Prazer, ' + st.name + '! O que você precisa? Pode marcar mais de um.' : 'O que você precisa? Pode marcar mais de um.', render);
  }
  function askWhere() {
    bot('Prefere ser atendido na loja ou no seu local?', function () {
      step = 'where'; ctl.innerHTML = '';
      var acts = el('div', 'chat__acts');
      ['na loja', 'no meu local'].forEach(function (w) {
        acts.appendChild(btn(w === 'na loja' ? 'Na loja' : 'No meu local', '', function () { st.onde = w; add('me', w === 'na loja' ? 'Na loja' : 'No meu local'); askDet(); }));
      });
      ctl.appendChild(acts); focusFirst();
    });
  }
  function askDet() {
    bot('Quer contar mais algum detalhe? Por exemplo, o defeito do equipamento ou quantas câmeras precisa.', function () {
      step = 'det'; ctl.innerHTML = '';
      var done = function (v) { st.det = v; add('me', v || 'Sem detalhes'); finish(); };
      ctl.appendChild(field(true, 'Escreva aqui (opcional)', done));
      ctl.appendChild(btn('Pular', '', function () { done(''); }));
      focusFirst();
    });
  }
  function build() {
    var t = 'Olá, Tec-Ti! Meu nome é ' + st.name + '.\nTenho interesse em: ' + listPt(st.svcs) + '.\nPrefiro o atendimento ' + st.onde + '.';
    if (st.det) t += '\nDetalhes: ' + st.det;
    return t;
  }
  function finish() {
    bot('Pronto! Esta é a mensagem que vai abrir no WhatsApp:', function () {
      add('bot', build(), 'msg--sum');
      step = 'end'; ctl.innerHTML = '';
      var acts = el('div', 'chat__acts');
      acts.appendChild(btn('Enviar pelo WhatsApp', 'chat__btn--go', function () {
        window.open('https://wa.me/' + PHONE + '?text=' + encodeURIComponent(build()), '_blank', 'noopener');
      }));
      acts.appendChild(btn('Recomeçar', '', function () { interacted = true; start(); }));
      ctl.appendChild(acts); focusFirst();
    });
  }
  function syncPorts() {
    var s = st ? st.svcs : [];
    $$('.port').forEach(function (p) { p.classList.toggle('is-on', s.indexOf(p.dataset.service) > -1); });
  }

  // rack ports + card links pick a service and jump to the chat
  $$('[data-service]').forEach(function (b) {
    b.addEventListener('click', function () {
      var s = b.dataset.service, i = st.svcs.indexOf(s);
      if (i > -1 && b.classList.contains('port')) st.svcs.splice(i, 1); else if (i < 0) st.svcs.push(s);
      syncPorts();
      if (step === 'svc') $$('#ctl input[type=checkbox]').forEach(function (c) { c.checked = st.svcs.indexOf(c.value) > -1; });
      $('#orcamento').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    });
  });

  // theme toggle
  $('#theme').addEventListener('click', function () {
    var d = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = d;
    try { localStorage.setItem('tectiTheme', d); } catch (e) {}
  });

  st = { name: '', svcs: [], onde: '', det: '' };
  start();
})();
