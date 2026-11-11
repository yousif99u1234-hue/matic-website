/* MATIC — smooth scroll + HUD cursor
   Crosshair trails the pointer with easing; over interactive elements it
   "locks on" with corner brackets that snap to the element's bounds. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------- Lenis smooth scrolling ---------- */
  let lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    window.__lenis = lenis;
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      const el = id === '#top' ? 0 : document.querySelector(id);
      if (el === null) return;
      e.preventDefault();
      lenis.scrollTo(el, { offset: 0, duration: 1.6 });
    }));
  }

  if (!fine) return;            // touch devices keep the native behaviour
  document.documentElement.classList.add('has-cursor');

  /* ---------- build cursor ---------- */
  const cur = document.createElement('div');
  cur.className = 'cursor';
  cur.setAttribute('aria-hidden', 'true');
  cur.innerHTML = '<span class="cursor__cross"></span><span class="cursor__frame"><i></i><i></i><i></i><i></i></span><span class="cursor__label mono"></span>';
  document.body.appendChild(cur);
  const cross = cur.querySelector('.cursor__cross');
  const frame = cur.querySelector('.cursor__frame');
  const label = cur.querySelector('.cursor__label');
  const cx = document.getElementById('cx'), cy = document.getElementById('cy');

  const m = { x: innerWidth / 2, y: innerHeight / 2 };   // raw mouse
  const p = { x: m.x, y: m.y };                         // eased crosshair
  const f = { x: m.x, y: m.y, w: 22, h: 22 };          // eased frame
  const c = { x: 0, y: 0 };                             // eased coord readout
  let target = null, visible = false, down = false;

  const SEL = 'a, button, input, select, textarea, label, .app, .doc, .fcard, .pkg, [data-cursor]';
  const labelFor = (el) => {
    if (el.dataset.cursor) return el.dataset.cursor;
    if (el.matches('input, textarea, select, label')) return 'Input';
    if (el.matches('.app')) return 'Inspect';
    if (el.matches('.doc') || el.target === '_blank') return 'Open ↗';
    if (el.matches('button[type=submit]')) return 'Send';
    if (el.matches('.filters button')) return 'Filter';
    return 'Go';
  };

  addEventListener('mousemove', (e) => {
    m.x = e.clientX; m.y = e.clientY;
    if (!visible) { visible = true; p.x = f.x = m.x; p.y = f.y = m.y; cur.classList.add('is-on'); }
  }, { passive: true });
  document.addEventListener('mouseleave', () => { visible = false; cur.classList.remove('is-on'); });
  addEventListener('mousedown', () => { down = true; cur.classList.add('is-down'); });
  addEventListener('mouseup', () => { down = false; cur.classList.remove('is-down'); });

  document.addEventListener('mouseover', (e) => {
    const el = e.target.closest(SEL);
    if (el === target) return;
    target = el;
    cur.classList.toggle('is-lock', !!el);
    label.textContent = el ? labelFor(el) : '';
  });

  /* ---------- magnetic buttons ---------- */
  const mags = [...document.querySelectorAll('.btn, .hud__logo, .filters button')];
  mags.forEach(b => { b.__mx = 0; b.__my = 0; b.__tx = 0; b.__ty = 0; });

  /* ---------- hero parallax layers ---------- */
  const heroLayers = [
    [document.querySelector('.hero__stage .photo'), 18],
    [document.querySelector('.hero__stage .printer'), 22],
    [document.querySelector('.reticle--a'), -34],
    [document.querySelector('.reticle--b'), -48],
  ].filter(([el]) => el);
  const par = { x: 0, y: 0 };

  const tick = () => {
    const k = reduce ? 1 : 0.2;
    p.x = lerp(p.x, m.x, k); p.y = lerp(p.y, m.y, k);
    cross.style.transform = `translate3d(${p.x}px,${p.y}px,0)`;

    if (target && target.dataset.cursor && label.textContent !== target.dataset.cursor) label.textContent = target.dataset.cursor;

    // frame: around target, or hugging the crosshair
    let tx = p.x, ty = p.y, tw = 22, th = 22;
    if (target && target.isConnected) {
      const r = target.getBoundingClientRect();
      const pad = 6;
      tx = r.left + r.width / 2; ty = r.top + r.height / 2;
      tw = r.width + pad * 2; th = r.height + pad * 2;
    }
    const kf = reduce ? 1 : 0.22;
    f.x = lerp(f.x, tx, kf); f.y = lerp(f.y, ty, kf);
    f.w = lerp(f.w, tw, kf); f.h = lerp(f.h, th, kf);
    const s = down ? 0.92 : 1;
    frame.style.transform = `translate3d(${f.x - f.w / 2}px,${f.y - f.h / 2}px,0) scale(${s})`;
    frame.style.width = f.w + 'px'; frame.style.height = f.h + 'px';
    label.style.transform = `translate3d(${f.x + f.w / 2 + 8}px,${f.y - f.h / 2 - 2}px,0)`;

    // coordinate readout counts smoothly
    c.x = lerp(c.x, m.x, 0.15); c.y = lerp(c.y, m.y, 0.15);
    if (cx) { cx.textContent = 'X: ' + Math.round(c.x); cy.textContent = 'Y: ' + Math.round(c.y); }

    // magnetic pull
    mags.forEach(b => {
      let gx = 0, gy = 0;
      if (b === target || b.contains(target)) {
        const r = b.getBoundingClientRect();
        gx = (m.x - (r.left + r.width / 2)) * 0.22;
        gy = (m.y - (r.top + r.height / 2)) * 0.3;
      }
      b.__tx = lerp(b.__tx, gx, 0.18); b.__ty = lerp(b.__ty, gy, 0.18);
      if (Math.abs(b.__tx) > 0.05 || Math.abs(b.__ty) > 0.05 || gx) b.style.transform = `translate(${b.__tx}px,${b.__ty}px)`;
      else if (b.style.transform) b.style.transform = '';
    });

    // hero parallax (only while hero is on screen)
    if (scrollY < innerHeight * 1.2) {
      const nx = (m.x / innerWidth - 0.5), ny = (m.y / innerHeight - 0.5);
      par.x = lerp(par.x, nx, 0.06); par.y = lerp(par.y, ny, 0.06);
      heroLayers.forEach(([el, d]) => { el.style.translate = `${par.x * d}px ${par.y * d}px`; });
    }

    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})();
