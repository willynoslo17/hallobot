/* Hallobot – motion layer. Progressive enhancement: everything is readable without JS. */
(function () {
  var d = document, root = d.documentElement;
  root.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Scroll progress bar
  var bar = d.createElement('div'); bar.className = 'scroll-progress'; bar.setAttribute('aria-hidden', 'true');
  d.body.appendChild(bar);
  function onScroll() {
    var h = root.scrollHeight - innerHeight;
    bar.style.setProperty('--p', h > 0 ? Math.min(1, scrollY / h) : 0);
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // Reveal on scroll
  d.querySelectorAll('main section:not(.hero) .section-title, main section:not(.hero) .section-lead, .dark-band, .faq, .table-scroll, form.card')
    .forEach(function (el) { el.classList.add('reveal'); });
  d.querySelectorAll('main .cards, main .steps, main .list-check, main .timeline').forEach(function (el) { el.classList.add('reveal-stagger'); });
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    d.querySelectorAll('.reveal, .reveal-stagger').forEach(function (el) { io.observe(el); });
  } else {
    d.querySelectorAll('.reveal, .reveal-stagger').forEach(function (el) { el.classList.add('in'); });
  }

  // 3D tilt on the chat stage
  var stage = d.querySelector('.stage'), demo = d.querySelector('.chat-demo');
  if (stage && demo && !reduce && matchMedia('(pointer:fine)').matches) {
    stage.addEventListener('pointermove', function (e) {
      var r = stage.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      demo.style.transform = 'rotateY(' + (x * 12) + 'deg) rotateX(' + (-y * 10) + 'deg) translateZ(0)';
    });
    stage.addEventListener('pointerleave', function () { demo.style.transform = ''; });
  }

  // Live chat replay
  var list = d.querySelector('.chat-demo .bubbles');
  var flag = d.querySelector('.chat-demo .lang-flag');
  var LBL = { nb: 'NO', es: 'ES', en: 'EN' };
  function setFlag(l) { if (flag) { flag.dataset.l = l; flag.textContent = LBL[l] || l; } }
  if (list && !reduce) {
    var msgs = Array.prototype.slice.call(list.children);
    var timer = [], running = false;
    function clear() { timer.forEach(clearTimeout); timer = []; }
    function play() {
      clear(); running = true;
      msgs.forEach(function (m) { m.remove(); });
      list.classList.add('live');
      var t = 400;
      msgs.forEach(function (m) {
        var bot = m.classList.contains('bubble-bot');
        if (bot) {
          timer.push(setTimeout(function () {
            var ty = d.createElement('div'); ty.className = 'typing'; ty.setAttribute('aria-hidden', 'true');
            ty.innerHTML = '<i></i><i></i><i></i>'; list.appendChild(ty);
          }, t));
          t += 1100;
        }
        timer.push(setTimeout(function () {
          var ty = list.querySelector('.typing'); if (ty) ty.remove();
          setFlag(m.getAttribute('lang'));
          list.appendChild(m);
        }, t));
        t += bot ? 1700 : 900 + Math.min(1200, m.textContent.length * 18);
      });
      timer.push(setTimeout(function () { running = false; }, t));
    }
    var btn = d.querySelector('.demo-replay');
    if (btn) { btn.hidden = false; btn.addEventListener('click', play); }
    if ('IntersectionObserver' in window) {
      var seen = false;
      new IntersectionObserver(function (es) { if (es[0].isIntersecting && !seen) { seen = true; play(); } }, { threshold: .35 }).observe(list);
    } else play();
  }

  // Canvas depth field: greetings floating in 3D space
  var cv = d.querySelector('.stage-canvas');
  if (cv && cv.getContext) {
    var ctx = cv.getContext('2d'), W, H, DPR = Math.min(2, devicePixelRatio || 1);
    var words = ['Hei', 'Hola', 'Hi', 'Takk', 'Gracias', 'Thanks', 'Ja', 'Sí', 'Yes', '?', '…', 'Hallo'];
    var cols = ['#2b4cff', '#ff5a36', '#8fb800'];
    var N = innerWidth < 700 ? 22 : 40, P = [];
    for (var i = 0; i < N; i++) P.push({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: Math.random(), w: words[i % words.length], c: cols[i % 3] });
    var mx = 0, my = 0;
    addEventListener('pointermove', function (e) { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; }, { passive: true });
    function size() { var r = cv.getBoundingClientRect(); W = r.width; H = r.height; cv.width = W * DPR; cv.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0); }
    size(); addEventListener('resize', size);
    var visible = true;
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(cv);
    function frame() {
      if (visible) {
        ctx.clearRect(0, 0, W, H);
        P.sort(function (a, b) { return a.z - b.z; });
        P.forEach(function (p) {
          if (!reduce) { p.z += 0.0016; if (p.z > 1) { p.z = 0; p.x = Math.random() * 2 - 1; p.y = Math.random() * 2 - 1; } }
          var s = 0.35 + p.z * 1.4;
          var x = W / 2 + (p.x * W * .5 + mx * 60 * p.z) * s * .8;
          var y = H / 2 + (p.y * H * .5 + my * 40 * p.z) * s * .8;
          ctx.globalAlpha = Math.sin(p.z * Math.PI) * .55;
          ctx.fillStyle = p.c;
          ctx.font = '900 ' + Math.round(12 + p.z * 34) + 'px "Arial Black", Helvetica, sans-serif';
          ctx.fillText(p.w, x, y);
        });
      }
      if (!reduce) requestAnimationFrame(frame);
    }
    frame();
  }
})();
