/* MATIC assistant demo — UI controller */
(() => {
  const $ = (s) => document.querySelector(s);
  const chat = $('#chat'), chipsEl = $('#chips'), form = $('#composer'), input = $('#msg'), phone = $('#phone');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let skin = 'wa', busy = false, queue = Promise.resolve();

  const esc = (s) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const linkify = (s) => esc(s)
    .replace(/(https?:\/\/[^\s]+)/g, (u) => `<a href="${u}" target="_blank" rel="noopener">${u.length > 46 ? 'رابط التسجيل ↗' : u}</a>`)
    .replace(/0781 011 2266/g, '<a class="tel" href="tel:+9647810112266" dir="ltr">0781 011 2266</a>');
  const hhmm = (d = new Date()) => d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  const wait = (ms) => new Promise(r => setTimeout(r, reduce ? 0 : ms));
  const scroll = () => { chat.scrollTop = chat.scrollHeight; };

  /* ---------- storage (per-browser, optional) ---------- */
  const store = {
    get() { try { return JSON.parse(localStorage.getItem('matic-demo-leads') || '[]'); } catch { return []; } },
    set(v) { try { localStorage.setItem('matic-demo-leads', JSON.stringify(v)); } catch {} },
  };
  let savedLeads = store.get();

  /* ---------- dashboard ---------- */
  const EN = { 'Clinic owner': 'Clinic owner', 'Specialist center': 'Specialist center', 'Dental lab': 'Dental lab', 'Student / graduate': 'Student / graduate' };
  const setField = (id, val) => {
    const el = $(id); const v = val || '—';
    if (el.textContent !== v) { el.textContent = v; el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }
  };
  let lastSnap = null;
  const render = (s) => {
    lastSnap = s;
    const l = s.lead;
    setField('#fChannel', skin === 'wa' ? 'WhatsApp' : 'Instagram');
    setField('#fName', l.name); setField('#fRole', EN[l.role] || l.role); setField('#fCity', l.city);
    setField('#fUse', l.use); setField('#fTime', l.timeline);
    setField('#fInt', l.interests.join(', '));
    setField('#fHand', s.handoff ? 'Sent to sales ✓' : 'Not yet');
    $('#scoreNum').textContent = s.score;
    $('#scoreBar').style.strokeDashoffset = 326.7 * (1 - s.score / 100);
    const pill = $('#stagePill');
    const st = s.log.length === 0 ? ['Waiting', ''] : s.score >= 70 ? ['Hot lead', 'hot'] : s.score >= 35 ? ['Warm lead', 'warm'] : ['Cold / info', 'cold'];
    pill.textContent = st[0]; pill.className = 'pill mono ' + st[1];
    $('#log').innerHTML = s.log.slice().reverse().map(e =>
      `<li><span class="t">${hhmm(e.t)}</span><span class="q">${esc(e.text)}</span><span class="tag">${esc(e.intent)} · ${Math.round(e.conf * 100)}%</span></li>`).join('');
    if (s.stage === 'done' && !s.__saved) saveLead(s);
  };

  const bot = new MaticBot.Bot({ onState: (s) => render(s) });

  const saveLead = (s) => {
    const key = s.lead.startedAt.toISOString();
    if (savedLeads.some(x => x.started === key)) return;
    savedLeads.push({ started: key, channel: skin === 'wa' ? 'WhatsApp' : 'Instagram', name: s.lead.name, type: s.lead.role, city: s.lead.city,
      use: s.lead.use, timeline: s.lead.timeline, interests: s.lead.interests.join(' | '), score: s.score });
    store.set(savedLeads);
    $('#dashNote').textContent = `${savedLeads.length} lead${savedLeads.length > 1 ? 's' : ''} saved in this browser. Export them as CSV.`;
  };

  /* ---------- chat rendering ---------- */
  const addDay = () => { const d = document.createElement('div'); d.className = 'day'; d.textContent = 'اليوم'; chat.appendChild(d); };
  const addMsg = (who, text) => {
    const m = document.createElement('div');
    m.className = 'msg ' + who;
    m.innerHTML = linkify(text) + `<span class="meta">${hhmm()}${who === 'me' ? '<span class="tick">✓✓</span>' : ''}</span>`;
    chat.appendChild(m); scroll();
    return m;
  };
  const typing = () => { const t = document.createElement('div'); t.className = 'typing'; t.innerHTML = '<i></i><i></i><i></i>'; chat.appendChild(t); scroll(); return t; };
  const setChips = (list) => {
    chipsEl.innerHTML = '';
    (list || []).forEach(c => { const b = document.createElement('button'); b.type = 'button'; b.textContent = c; b.addEventListener('click', () => send(c)); chipsEl.appendChild(b); });
  };
  const presence = (t) => { $('#presence').textContent = t; };

  const botSay = async (replies) => {
    for (const r of replies) {
      presence('يكتب…');
      const t = typing();
      await wait(Math.min(1700, 450 + r.text.length * 14));
      t.remove();
      addMsg('bot', r.text);
      if (r.chips !== null && r.chips !== undefined) setChips(r.chips);
      await wait(220);
    }
    presence('متصل الآن');
  };

  const send = (text) => {
    text = (text || '').trim();
    if (!text) return;
    setChips([]);
    addMsg('me', text);
    queue = queue.then(async () => {
      busy = true;
      await wait(350);
      const replies = bot.reply(text);
      await botSay(replies);
      busy = false;
    });
  };

  form.addEventListener('submit', (e) => { e.preventDefault(); const v = input.value; input.value = ''; send(v); input.focus({ preventScroll: true }); });

  /* ---------- presenter samples ---------- */
  const SAMPLES = ['هلا شلونكم', 'شكد سعر الطابعة؟', 'صدك مصنوعة بالعراق لو مستوردة؟', 'شكد ياخذ وقت التاج؟', 'شنو أگدر أطبع بيها؟', 'أريد أحجز ديمو', 'عدكم ورشة؟', 'منو يصلحها إذا عطلت؟', 'منو يستخدمها من الأطباء؟', 'شنو الريزن المتوافق؟', 'أريد أحچي ويه موظف'];
  const sEl = $('#samples');
  SAMPLES.forEach(s => { const b = document.createElement('button'); b.type = 'button'; b.textContent = s; b.addEventListener('click', () => { send(s); if (innerWidth < 760) phone.scrollIntoView({ behavior: 'smooth', block: 'start' }); }); sEl.appendChild(b); });

  /* ---------- skins ---------- */
  document.querySelectorAll('.seg button').forEach(b => b.addEventListener('click', () => {
    skin = b.dataset.skin;
    document.querySelectorAll('.seg button').forEach(x => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-selected', x === b); });
    phone.classList.toggle('skin-wa', skin === 'wa'); phone.classList.toggle('skin-ig', skin === 'ig');
    $('.verified').style.display = '';
    if (lastSnap) render(lastSnap);
  }));

  /* ---------- reset ---------- */
  const start = async () => {
    chat.innerHTML = ''; setChips([]); addDay();
    bot.reset();
    await botSay([{ text: 'هلا بيك دكتور 👋 أنا مساعد ماتك الآلي.' }, { text: 'اسألني عن الطابعة، الأسعار، الديمو، أو الورش. وإذا تحب تحچي ويه شخص من الفريق كلي بس.', chips: MaticBot.MENU }]);
  };
  $('#resetBtn').addEventListener('click', () => { queue = queue.then(start); });

  /* ---------- export ---------- */
  $('#csvBtn').addEventListener('click', () => {
    const rows = [...savedLeads];
    if (lastSnap && lastSnap.log.length && !rows.some(x => x.started === lastSnap.lead.startedAt.toISOString())) {
      const l = lastSnap.lead;
      rows.push({ started: l.startedAt.toISOString(), channel: skin === 'wa' ? 'WhatsApp' : 'Instagram', name: l.name, type: l.role, city: l.city, use: l.use, timeline: l.timeline, interests: l.interests.join(' | '), score: lastSnap.score });
    }
    if (!rows.length) { $('#dashNote').textContent = 'No leads yet. Chat with the assistant first.'; return; }
    const head = ['started', 'channel', 'name', 'type', 'city', 'use', 'timeline', 'interests', 'score'];
    const csv = '﻿' + [head.join(','), ...rows.map(r => head.map(h => `"${String(r[h] ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'matic-leads.csv'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });

  $('#copyBtn').addEventListener('click', async () => {
    if (!lastSnap || !lastSnap.log.length) { $('#dashNote').textContent = 'Nothing to copy yet.'; return; }
    const s = lastSnap, l = s.lead;
    const txt = [
      `ليد جديد من ${skin === 'wa' ? 'واتساب' : 'إنستغرام'} — ${s.score}/100`,
      `الاسم: ${l.name || '—'}`, `النوع: ${l.role || '—'}`, `المدينة: ${l.city || '—'}`,
      `يريد يطبع: ${l.use || '—'}`, `التوقيت: ${l.timeline || '—'}`, `الاهتمامات: ${l.interests.join('، ') || '—'}`,
      `آخر رسالة: ${s.log[s.log.length - 1].text}`,
    ].join('\n');
    try { await navigator.clipboard.writeText(txt); $('#dashNote').textContent = 'Summary copied. Paste it into the sales WhatsApp group.'; }
    catch { $('#dashNote').textContent = txt; }
  });

  start();
})();
