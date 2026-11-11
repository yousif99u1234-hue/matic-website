/* MATIC — interactions */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- photo slots: use photo if it loads, else keep drawing ---------- */
  $$('.media .photo').forEach(img => {
    const ok = () => img.closest('.media').classList.add('has-photo');
    const bad = () => img.remove();
    if (img.complete) { img.naturalWidth ? ok() : bad(); }
    else { img.addEventListener('load', ok, { once: true }); img.addEventListener('error', bad, { once: true }); }
  });

  /* ---------- clock (Baghdad time) ---------- */
  const clock = $('#clock');
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Baghdad', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const tick = () => { clock.textContent = fmt.format(new Date()); };
  tick(); setInterval(tick, 1000);
  $('#year').textContent = new Date().getFullYear();

  /* ---------- HUD bars = scroll progress ---------- */
  const barsEl = $('#bars');
  const BAR_N = 160;
  barsEl.innerHTML = '<i></i>'.repeat(BAR_N);
  const bars = [...barsEl.children];
  let lastOn = -1;
  const paintBars = (p) => {
    const on = Math.round(p * BAR_N);
    if (on === lastOn) return;
    bars.forEach((b, i) => b.classList.toggle('on', i < on));
    lastOn = on;
  };

  /* (cursor + coordinate readout live in cursor.js) */

  /* ---------- mobile menu ---------- */
  const burger = $('#burger'), mnav = $('#mobileNav');
  const setMenu = (open) => { mnav.classList.toggle('is-open', open); burger.setAttribute('aria-expanded', open); burger.textContent = open ? 'Close' : 'Menu'; document.body.style.overflow = open ? 'hidden' : ''; if (window.__lenis) open ? window.__lenis.stop() : window.__lenis.start(); };
  burger.addEventListener('click', () => setMenu(!mnav.classList.contains('is-open')));
  $$('a', mnav).forEach(a => a.addEventListener('click', () => setMenu(false)));

  /* ---------- hero layer counter ---------- */
  const layer = $('#layer');
  let L = 1;
  setInterval(() => { L = L >= 960 ? 1 : L + 7; layer.textContent = String(L).padStart(4, '0'); }, 120);

  /* ---------- dial ticks ---------- */
  const ring = $('#dialRing');
  const NS = 'http://www.w3.org/2000/svg';
  for (let i = 0; i < 120; i++) {
    const a = (i / 120) * Math.PI * 2;
    const major = i % 10 === 0;
    const r1 = 292, r2 = major ? 270 : 280;
    const l = document.createElementNS(NS, 'line');
    l.setAttribute('x1', 300 + Math.sin(a) * r1); l.setAttribute('y1', 300 - Math.cos(a) * r1);
    l.setAttribute('x2', 300 + Math.sin(a) * r2); l.setAttribute('y2', 300 - Math.cos(a) * r2);
    if (major) l.classList.add('major');
    ring.appendChild(l);
  }

  /* ---------- pinned specs ---------- */
  const SPECS = [
    { label: 'Print time', num: '18', unit: 'min', name: 'Permanent crown', note: 'From design file to a finished permanent crown, printed chairside.' },
    { label: 'R&D', num: '2+', unit: 'yrs', name: 'Built in Iraq', note: 'More than two years of research and development before launch.' },
    { label: 'Origin', num: '1st', unit: '', name: 'Made in Iraq', note: 'The first dental 3D printer designed and built in Iraq.' },
    { label: 'Support', num: '100', unit: '%', name: 'Local support', note: 'Installation, training and service by the MATIC team in Iraq.' },
  ];
  const specsSec = $('#specs');
  const sNum = $('#specNum'), sUnit = $('#specUnit'), sLabel = $('#specLabel'), sIdx = $('#specIdx'),
        sName = $('#specName'), sCount = $('#specCount'), sNote = $('#specNote');
  let specCur = 0;
  const setSpec = (i) => {
    if (i === specCur) return;
    specCur = i;
    const s = SPECS[i];
    sNum.classList.add('is-out');
    [sName, sCount].forEach(el => el.style.opacity = 0);
    setTimeout(() => {
      sNum.textContent = s.num; sUnit.textContent = s.unit; sLabel.textContent = s.label;
      sIdx.textContent = String(i + 1).padStart(2, '0');
      sName.textContent = s.name; sCount.textContent = String(i + 1).padStart(3, '0'); sNote.textContent = s.note;
      sNum.classList.remove('is-out');
      [sName, sCount].forEach(el => el.style.opacity = 1);
    }, reduce ? 0 : 260);
  };

  /* ---------- statement marquee ---------- */
  const stSec = $('.statement');
  const stLine = $('.statement__line');

  /* ---------- product features ---------- */
  const prodSec = $('#product');
  const cards = $$('.fcard');
  const callouts = $$('.callout');
  const featIdx = $('#featIdx');
  let featCur = -1;
  const setFeat = (i) => {
    if (i === featCur) return;
    featCur = i;
    cards.forEach((c, k) => c.classList.toggle('is-active', k === i));
    callouts.forEach((c, k) => c.classList.toggle('is-on', k <= i));
    featIdx.textContent = String(i + 1).padStart(2, '0');
  };

  const secProgress = (sec) => {
    const r = sec.getBoundingClientRect();
    const total = r.height - innerHeight;
    return total > 0 ? clamp(-r.top / total, 0, 1) : 0;
  };

  /* ---------- field gallery ---------- */
  const fieldSec = $('#field'), fieldTrack = $('#fieldTrack'), fieldIdx = $('#fieldIdx');

  /* ---------- nav current section ---------- */
  const navLinks = $$('.hud__nav a');
  const navTargets = navLinks.map(a => $(a.getAttribute('href')));

  /* ---------- main scroll loop ---------- */
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const doc = document.documentElement;
    paintBars(clamp(scrollY / (doc.scrollHeight - innerHeight), 0, 1));

    const sp = secProgress(specsSec);
    setSpec(Math.min(SPECS.length - 1, Math.floor(sp * SPECS.length)));
    ring.style.transform = `rotate(${sp * 180}deg)`;

    const tp = secProgress(stSec);
    const lineW = stLine.scrollWidth;
    stLine.style.transform = `translate3d(${-tp * (lineW - innerWidth * 0.92)}px,0,0)`;

    if (getComputedStyle($('.product__sticky')).position === 'sticky') {
      const pp = secProgress(prodSec);
      setFeat(Math.min(cards.length - 1, Math.floor(pp * cards.length)));
    }

    if (fieldTrack && getComputedStyle($('.field__sticky')).position === 'sticky') {
      const fp = secProgress(fieldSec);
      const maxX = fieldTrack.scrollWidth - innerWidth;
      fieldTrack.style.transform = `translate3d(${-fp * Math.max(0, maxX)}px,0,0)`;
      fieldIdx.textContent = String(Math.min(5, 1 + Math.floor(fp * 5))).padStart(2, '0');
    }

    let cur = -1;
    navTargets.forEach((t, i) => { if (t && t.getBoundingClientRect().top < innerHeight * 0.4) cur = i; });
    navLinks.forEach((a, i) => a.classList.toggle('is-current', i === cur));
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  /* ---------- catalog filters ---------- */
  const filterBtns = $$('.filters button');
  const apps = $$('.app');
  filterBtns.forEach(btn => btn.addEventListener('click', () => {
    const f = btn.dataset.filter;
    filterBtns.forEach(b => { const on = b === btn; b.classList.toggle('is-active', on); b.setAttribute('aria-selected', on); });
    apps.forEach(a => a.classList.toggle('is-hidden', f !== 'all' && !a.dataset.cat.split(' ').includes(f)));
  }));

  /* ---------- reveal + counters + meters ---------- */
  $$('.catalog__head, .flagship, .app, .pkg, .compare__left, .compare__right, .band__item, .clinics__head, .doc, .timeline__item, .founder, .academy__head, .acard, .faq__head, .qa, .film__head, .film__frame, .calc__copy, .calc__out, .contact__left, .form, .footer__cols')
    .forEach(el => el.classList.add('reveal'));

  const countUp = (el) => {
    const end = +el.dataset.count, suf = el.dataset.suffix || '';
    if (reduce) { el.textContent = end + suf; return; }
    const t0 = performance.now(), dur = 1400;
    const step = (t) => {
      const k = clamp((t - t0) / dur, 0, 1), e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(end * e) + suf;
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      $$('[data-count]', en.target).forEach(countUp);
      io.unobserve(en.target);
    });
  }, { threshold: 0, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal, .compare').forEach(el => io.observe(el));

  /* ---------- quote CTA → preselect product ---------- */
  const sel = $('#productSelect');
  $$('[data-product]').forEach(a => a.addEventListener('click', () => {
    const v = a.dataset.product;
    [...sel.options].forEach(o => { if (o.text === v) sel.value = o.value; });
  }));

  /* ---------- form → WhatsApp ---------- */
  const form = $('#quoteForm'), err = $('#formErr');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const d = new FormData(form);
    const name = (d.get('name') || '').trim();
    if (!name) { err.textContent = 'Please add your name.'; form.name.focus(); return; }
    err.textContent = '';
    const lines = [
      'Hello MATIC, I would like a quote.',
      `Name: ${name}`,
      d.get('clinic') ? `Clinic: ${d.get('clinic')}` : '',
      `City: ${d.get('city')}`,
      `Interested in: ${d.get('product')}`,
      d.get('message') ? `Message: ${d.get('message')}` : '',
    ].filter(Boolean).join('\n');
    window.open('https://wa.me/9647810112266?text=' + encodeURIComponent(lines), '_blank', 'noopener');
  });
})();
