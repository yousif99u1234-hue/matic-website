/* MATIC — creative sections: layer-by-layer print, film, calculator, ticker */
(() => {
  const $ = (s) => document.querySelector(s);
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const RED = css('--accent') || '#d23a1e';

  const secProgress = (sec) => {
    const r = sec.getBoundingClientRect();
    const total = r.height - innerHeight;
    return total > 0 ? clamp(-r.top / total) : 0;
  };

  /* =========================================================
     1. Layer-by-layer print (canvas, scroll-driven)
     ========================================================= */
  const layersSec = $('#layers'), cv = $('#layerCanvas');
  if (layersSec && cv) {
    const ctx = cv.getContext('2d');
    const W = 900, H = 900;
    const dpr = Math.min(2, devicePixelRatio || 1);
    cv.width = W * dpr; cv.height = H * dpr; ctx.scale(dpr, dpr);

    const numEl = $('#layerNum'), timeEl = $('#layerTime'), barEl = $('#layerBar');
    const stages = [...document.querySelectorAll('#layerStages li')];

    // crown outline (hangs from the plate; occlusal cusps are printed last, at the bottom)
    const CW = 300, CH = 330;
    const crownPath = (x, y) => {
      const p = new Path2D();
      p.moveTo(x + 52, y);
      p.lineTo(x + CW - 52, y);
      p.quadraticCurveTo(x + CW - 8, y + 30, x + CW - 6, y + 150);
      p.quadraticCurveTo(x + CW, y + 230, x + CW - 22, y + 262);
      p.quadraticCurveTo(x + CW - 34, y + CH + 8, x + CW - 62, y + CH - 6);   // cusp 1
      p.quadraticCurveTo(x + CW - 92, y + 278, x + CW - 118, y + CH - 2);
      p.quadraticCurveTo(x + CW / 2, y + CH + 12, x + 118, y + CH - 2);          // cusp 2
      p.quadraticCurveTo(x + 92, y + 278, x + 62, y + CH - 6);
      p.quadraticCurveTo(x + 34, y + CH + 8, x + 22, y + 262);                   // cusp 3
      p.quadraticCurveTo(x, y + 230, x + 6, y + 150);
      p.quadraticCurveTo(x + 8, y + 30, x + 52, y);
      p.closePath();
      return p;
    };

    let lastP = -1;
    const draw = (p, t) => {
      ctx.clearRect(0, 0, W, H);
      // grid
      ctx.strokeStyle = 'rgba(221,221,221,.05)'; ctx.lineWidth = 1;
      for (let i = 0; i <= W; i += 45) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke(); }

      const vatY = 690;                      // resin surface (cure plane)
      const supH = 56;                       // support height
      const supP = clamp(p / .16);           // supports print first
      const crP = clamp((p - .16) / .82);    // then the crown
      const built = supH * supP + CH * crP;  // total printed height
      const peel = p > 0 && p < .99 && !reduce ? Math.max(0, Math.sin(t / 260)) * 10 : 0;
      const plateY = vatY - built - 22 - peel;
      const cx = W / 2;

      // Z tower + arm
      ctx.fillStyle = 'rgba(221,221,221,.08)'; ctx.fillRect(cx + 250, 70, 46, vatY - 40);
      ctx.strokeStyle = 'rgba(221,221,221,.25)'; ctx.strokeRect(cx + 250, 70, 46, vatY - 40);
      ctx.fillStyle = '#cfcfcf'; ctx.fillRect(cx - 40, plateY - 70, 336, 26);
      ctx.fillStyle = RED; ctx.fillRect(cx + 200, plateY - 76, 30, 38); ctx.fillRect(cx - 30, plateY - 74, 22, 34);
      ctx.fillStyle = '#9a9a9a'; ctx.fillRect(cx - 24, plateY - 44, 48, 26);

      // build plate (metal)
      const g = ctx.createLinearGradient(cx - 200, 0, cx + 200, 0);
      g.addColorStop(0, '#5c5c5c'); g.addColorStop(.35, '#dadada'); g.addColorStop(.6, '#8d8d8d'); g.addColorStop(1, '#3a3a3a');
      ctx.fillStyle = g; ctx.fillRect(cx - 200, plateY - 18, 400, 18);

      // supports
      const crownTop = plateY + supH;
      ctx.strokeStyle = 'rgba(241,236,226,.9)'; ctx.lineWidth = 3;
      [-90, -40, 10, 60, 100].forEach((dx, i) => {
        const len = supH * supP;
        ctx.beginPath(); ctx.moveTo(cx + dx, plateY); ctx.lineTo(cx + dx + (i - 2) * 4 * supP, plateY + len); ctx.stroke();
      });

      // ghost of the full crown
      const x0 = cx - CW / 2;
      const path = crownPath(x0, crownTop);
      ctx.setLineDash([5, 7]); ctx.strokeStyle = 'rgba(221,221,221,.22)'; ctx.lineWidth = 1.5; ctx.stroke(path); ctx.setLineDash([]);

      // printed part of the crown
      if (crP > 0) {
        ctx.save(); ctx.clip(path);
        const cg = ctx.createLinearGradient(x0, 0, x0 + CW, 0);
        cg.addColorStop(0, '#bdb5a6'); cg.addColorStop(.45, '#f3eee4'); cg.addColorStop(1, '#a59d8f');
        ctx.fillStyle = cg; ctx.fillRect(x0, crownTop, CW, CH * crP);
        // layer lines
        ctx.strokeStyle = 'rgba(0,0,0,.08)'; ctx.lineWidth = 1;
        for (let y = crownTop; y < crownTop + CH * crP; y += 5) { ctx.beginPath(); ctx.moveTo(x0, y + .5); ctx.lineTo(x0 + CW, y + .5); ctx.stroke(); }
        // freshly cured layer glow
        const fy = crownTop + CH * crP;
        if (crP < 1) { const fg = ctx.createLinearGradient(0, fy - 26, 0, fy); fg.addColorStop(0, 'rgba(210,58,30,0)'); fg.addColorStop(1, 'rgba(210,58,30,.55)'); ctx.fillStyle = fg; ctx.fillRect(x0, fy - 26, CW, 26); }
        ctx.restore();
        ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1;
        ctx.save(); ctx.beginPath(); ctx.rect(x0 - 4, crownTop - 2, CW + 8, CH * crP + 2); ctx.clip(); ctx.stroke(path); ctx.restore();
      }

      // vat
      ctx.fillStyle = 'rgba(122,20,16,.55)'; ctx.fillRect(cx - 260, vatY, 520, 60);
      ctx.strokeStyle = '#8d8d8d'; ctx.lineWidth = 3; ctx.strokeRect(cx - 270, vatY - 6, 540, 72);
      // UV light engine
      const on = p > 0.005 && p < .99;
      const flick = on ? (reduce ? .8 : .65 + .35 * Math.abs(Math.sin(t / 90))) : .15;
      const uv = ctx.createRadialGradient(cx, vatY + 60, 10, cx, vatY + 60, 320);
      uv.addColorStop(0, `rgba(210,58,30,${.55 * flick})`); uv.addColorStop(1, 'rgba(210,58,30,0)');
      ctx.fillStyle = uv; ctx.fillRect(cx - 320, vatY - 200, 640, 330);
      ctx.fillStyle = RED; ctx.globalAlpha = flick; ctx.fillRect(cx - 250, vatY + 64, 500, 3); ctx.globalAlpha = 1;
      // base
      ctx.fillStyle = 'rgba(221,221,221,.08)'; ctx.fillRect(cx - 300, vatY + 76, 600, 90);
      ctx.strokeStyle = 'rgba(221,221,221,.25)'; ctx.strokeRect(cx - 300, vatY + 76, 600, 90);
      ctx.fillStyle = RED; ctx.fillRect(cx - 300, vatY + 150, 600, 3);

      // HUD labels
      ctx.font = '500 15px "Geist Mono", monospace'; ctx.fillStyle = 'rgba(221,221,221,.55)';
      ctx.fillText(`Z +${(built / 10).toFixed(2)} MM`, cx - 200, plateY - 90);
      ctx.fillText(on ? 'UV ON' : (p >= .99 ? 'DONE' : 'IDLE'), cx - 260, vatY + 112);
      ctx.fillStyle = RED;
      if (p >= .99) { ctx.font = '500 18px "Geist Mono", monospace'; ctx.fillText('● PERMANENT CROWN — COMPLETE', cx - 160, 60); }
    };

    const tick = (t) => {
      const p = secProgress(layersSec);
      const vis = layersSec.getBoundingClientRect();
      if (vis.bottom > 0 && vis.top < innerHeight) {
        draw(p, t);
        if (p !== lastP) {
          numEl.textContent = String(Math.round(p * 960)).padStart(4, '0');
          const sec = Math.round(p * 18 * 60);
          timeEl.textContent = `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
          barEl.style.width = (p * 100) + '%';
          let cur = -1;
          stages.forEach((li, i) => { const on = p >= +li.dataset.at; li.classList.toggle('on', on); if (on) cur = i; });
          stages.forEach((li, i) => li.classList.toggle('now', i === cur));
          lastP = p;
        }
      }
      requestAnimationFrame(tick);
    };
    document.fonts.ready.then(() => requestAnimationFrame(tick));
  }

  /* =========================================================
     2. Film player
     ========================================================= */
  const film = $('#film'), vid = $('#filmVideo'), frame = $('#filmFrame');
  if (film && vid) {
    const tc = $('#filmTc'), bar = $('#filmBar'), btn = $('#filmPlay');
    let userPaused = false;
    const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
    const sync = () => {
      const d = vid.duration || 32;
      tc.textContent = `${fmt(vid.currentTime)} / ${fmt(d)}`;
      bar.style.width = (vid.currentTime / d * 100) + '%';
      if (!vid.paused) requestAnimationFrame(sync);
    };
    vid.addEventListener('play', () => { film.classList.add('is-playing'); frame.dataset.cursor = 'Pause'; sync(); });
    vid.addEventListener('pause', () => { film.classList.remove('is-playing'); frame.dataset.cursor = 'Play'; });
    const toggle = () => { if (vid.paused) { userPaused = false; vid.play().catch(() => {}); } else { userPaused = true; vid.pause(); } };
    frame.addEventListener('click', toggle);
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && e.intersectionRatio > .45 && !userPaused && !reduce) vid.play().catch(() => {});
      else if (!e.isIntersecting || e.intersectionRatio < .2) vid.pause();
    }, { threshold: [0, .2, .45, .7] }).observe(frame);
    frame.dataset.cursor = 'Play';
  }

  /* =========================================================
     3. Calculator
     ========================================================= */
  const per = $('#cPerMonth'), days = $('#cLabDays');
  if (per && days) {
    const fill = (el) => el.style.setProperty('--p', ((el.value - el.min) / (el.max - el.min) * 100) + '%');
    const roll = (el, to, dec = 0, suffix = '') => {
      const from = parseFloat(el.dataset.v || 0); el.dataset.v = to;
      if (reduce) { el.innerHTML = to.toFixed(dec) + suffix; return; }
      const t0 = performance.now();
      const step = (t) => {
        const k = clamp((t - t0) / 420), e = 1 - Math.pow(1 - k, 3);
        el.innerHTML = (from + (to - from) * e).toFixed(dec) + suffix;
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };
    const update = () => {
      const n = +per.value, d = +days.value;
      $('#cPerMonthV').textContent = n;
      $('#cLabDaysV').textContent = d + (d === 1 ? ' day' : ' days');
      roll($('#oVisits'), n);
      roll($('#oWait'), n * d);
      roll($('#oPrint'), n * 18 / 60, 1, '<small>h</small>');
      $('#oLabTxt').textContent = d + (d === 1 ? ' day' : ' days');
      $('#oLabBar').style.setProperty('--w', (d / 21 * 100) + '%');
      fill(per); fill(days);
    };
    per.addEventListener('input', update); days.addEventListener('input', update);
    update();
  }

  /* =========================================================
     4. Ticker — speed and direction follow your scroll
     ========================================================= */
  const track = $('#ticker');
  if (track && !reduce) {
    let x = 0, dir = -1, last = performance.now(), lastY = scrollY;
    const run = track.firstElementChild;
    const loop = (t) => {
      const dt = Math.min(64, t - last); last = t;
      const dy = scrollY - lastY; lastY = scrollY;
      if (dy) dir = dy > 0 ? -1 : 1;
      const boost = Math.min(14, Math.abs(dy) * .35);
      x += dir * (0.9 + boost) * dt * 0.06;
      const w = run.offsetWidth;
      if (x <= -w) x += w; if (x > 0) x -= w;
      track.style.transform = `translate3d(${x}px,0,0)`;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
})();
