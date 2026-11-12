/* MATIC assistant — dialogue engine (scripted demo)
   Knowledge comes only from what MATIC has published. Anything unknown is handed to the team. */
(() => {
  const PHONE = '0781 011 2266';
  const WORKSHOP = 'https://docs.google.com/forms/d/e/1FAIpQLScCdgK0DbEgdxjDHsGng812qRNN-0fW2VS-qgxosYFeYDZxcQ/viewform';

  /* ---------- Arabic / dialect normalisation ---------- */
  const norm = (s) => (s || '')
    .toLowerCase()
    .replace(/[ً-ْـ]/g, '')           // tashkeel + tatweel
    .replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
    .replace(/گ/g, 'ك').replace(/چ/g, 'ج').replace(/ڤ/g, 'ف').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
    .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ').trim();

  /* ---------- intents (keywords are matched after normalisation) ---------- */
  const INTENTS = [
    { id: 'human',    tag: 'Wants a person',  kw: ['موظف', 'شخص', 'انسان', 'احجي ويه', 'احجي مع', 'اتصل', 'تلفون', 'رقمكم', 'رقم الشركه', 'مبيعات', 'agent', 'human', 'call'] },
    { id: 'price',    tag: 'Price',           kw: ['سعر', 'اسعار', 'شكد', 'بيش', 'بكم', 'كلفه', 'تكلفه', 'قسط', 'اقساط', 'تقسيط', 'price', 'cost', 'كم سعر', 'غاليه', 'رخيصه'] },
    { id: 'demo',     tag: 'Demo request',    kw: ['ديمو', 'demo', 'اشوفها', 'اجربها', 'تجربه', 'زياره', 'عرض حي', 'اشوف الطابعه', 'اشوف شغلها', 'تجون', 'تجي للعياده'] },
    { id: 'buy',      tag: 'Buying intent',   kw: ['اشتري', 'شراء', 'اريد طابعه', 'احجز طابعه', 'اطلب', 'طلب', 'buy', 'order', 'ناوي اشتري', 'متوفره'] },
    { id: 'origin',   tag: 'Made in Iraq?',   kw: ['عراقي', 'عراقيه', 'صنع', 'مصنوع', 'مصنعه', 'مستورد', 'صيني', 'الصين', 'تجميع', 'made', 'قطع'] },
    { id: 'speed',    tag: 'Speed',           kw: ['وقت', 'سرعه', 'سريعه', 'سريع', 'دقيقه', 'دقايق', 'ساعه', 'ياخذ', 'تاخذ', 'speed', 'fast', '18'] },
    { id: 'apps',     tag: 'Applications',    kw: ['اطبع', 'تطبع', 'استخدام', 'استخدامات', 'تيجان', 'تاج', 'كراون', 'crown', 'guide', 'دليل', 'جراحي', 'موديل', 'اورثو', 'اليقنر', 'aligner', 'splint', 'سبلنت', 'نايت', 'inlay', 'onlay', 'انلي', 'اونلي', 'ريتينر', 'retainer'] },
    { id: 'workshop', tag: 'Workshop',        kw: ['ورشه', 'ورش', 'دوره', 'كورس', 'تدريب', 'اتعلم', 'workshop', 'ديجتال', 'digital', 'محاضره'] },
    { id: 'support',  tag: 'Support',         kw: ['صيانه', 'عطل', 'عطلت', 'يصلح', 'تصلح', 'ضمان', 'كفاله', 'قطع غيار', 'دعم', 'support', 'warranty', 'خربت'] },
    { id: 'users',    tag: 'Social proof',    kw: ['منو يستخدم', 'زبائن', 'عملاء', 'كم طابعه', 'بعتو', 'بايعين', 'اطباء يستخدمون', 'تجارب', 'ريفيو', 'review'] },
    { id: 'location', tag: 'Location',        kw: ['وين', 'مكانكم', 'عنوان', 'موقعكم', 'location', 'address', 'فرع', 'شوروم', 'معرض'] },
    { id: 'resin',    tag: 'Materials',       kw: ['ريزن', 'رزن', 'resin', 'مواد', 'ماده', 'خامات'] },
    { id: 'research', tag: 'Research',        kw: ['بحث', 'بحوث', 'مجله', 'مجلات', 'journal', 'sherlock', 'شيرلوك', 'نشر'] },
    { id: 'thanks',   tag: 'Thanks',          kw: ['شكرا', 'مشكور', 'مشكورين', 'تسلم', 'تسلمون', 'thanks', 'عاشت ايدك', 'عاشت ايدكم', 'ممنون'] },
    { id: 'greet',    tag: 'Greeting',        kw: ['هلو', 'هلا', 'مرحبا', 'السلام', 'سلام', 'شلونكم', 'صباح', 'مساء', 'hi', 'hello', 'هاي'] },
  ];

  const detect = (text) => {
    const n = ' ' + norm(text) + ' ';
    let best = null, bestHits = 0;
    for (const it of INTENTS) {
      let hits = 0;
      for (const k of it.kw) if (n.includes(norm(k))) hits += k.length > 4 ? 2 : 1;
      if (hits > bestHits) { best = it; bestHits = hits; }
    }
    return best ? { ...best, conf: Math.min(0.98, 0.55 + bestHits * 0.15) } : { id: 'unknown', tag: 'Unknown', conf: 0.2 };
  };

  /* ---------- answers ---------- */
  const MENU = ['شكد سعر الطابعة؟', 'صدك مصنوعة بالعراق؟', 'شنو أگدر أطبع بيها؟', 'أريد أحجز ديمو'];
  const A = {
    greet: () => [
      'هلا بيك دكتور 👋 أنا مساعد ماتك.',
      'ماتك أول طابعة ثلاثية الأبعاد لطب الأسنان مصنوعة بالعراق. شلون أگدر أساعدك اليوم؟',
    ],
    origin: () => [
      'إي نعم 🇮🇶 ماتك مصممة ومصنوعة بالعراق من فريق ماتك، وتطويرها أخذ أكثر من سنتين.',
      'إذا تحب تعرف تفاصيل التصنيع والقطع بالضبط، فريقنا يگدر يشرحلك بالتفصيل أو تشوفها بعينك بديمو.',
    ],
    speed: () => [
      'التاج الدائم (Permanent crown) ينطبع بحدود 18 دقيقة بالعيادة ⏱️',
      'يعني المريض يگدر يطلع بالتاج النهائي بنفس الزيارة بدل ما ينتظر المختبر أيام.',
    ],
    apps: () => [
      'ماتك تطبع:\n• تيجان دائمة ومؤقتة\n• Inlays و Onlays\n• أدلة جراحية للزراعة\n• موديلات دراسية وشغل\n• Night guards و Splints\n• موديلات للريتينر والـ Clear aligners',
      'شنو أكثر شي تشتغل عليه بعيادتك؟',
    ],
    workshop: () => [
      'عدنا ورش عملية (Hands-on) تجرب بيها الـ Digital Dentistry بإيدك قبل ما تقرر: سكان، ديزاين، وطباعة ويه فريق ماتك.',
      'تگدر تسجل من هنا 👇\n' + WORKSHOP,
    ],
    support: () => [
      'التنصيب والتدريب والصيانة وقطع الغيار كلها يسويها فريق ماتك داخل العراق، فما تنتظر شحن من برا 🔧',
      'تفاصيل الضمان بالضبط يرسلها فريق المبيعات ويه عرض السعر.',
    ],
    users: () => [
      'أكثر من 100 طابعة ماتك شغالة هسه بعيادات ومراكز بالعراق 🦷',
      'مثلاً د. محمد هيكل (Haykel Clinic) يستخدمها من 6 أشهر للأدلة الجراحية والتيجان الدائمة والـ Clear aligners.',
    ],
    location: () => [
      'حالياً أفضل طريقة نرتبلك ديمو أو زيارة، وفريقنا يرسلك الموقع والتوقيت المناسب 📍',
    ],
    resin: () => [
      'سؤال مهم 👌 تفاصيل المواد والريزنات المتوافقة يجاوبك عليها فريقنا التقني بدقة. حولت سؤالك إلهم.',
    ],
    research: () => [
      'إذا أنت طبيب باحث، عدنا ميزة Sherlock Journals على منصة ماتك تساعدك تلگى المجلة العلمية المناسبة لبحثك حسب المجال والاحتياج والميزانية 🔬',
    ],
    thanks: () => ['العفو دكتور 🙏 إذا عندك أي سؤال ثاني آني موجود.'],
    human: () => [
      'أكيد 👍 حولتك لفريق المبيعات وراح يتواصلون وياك بأقرب وقت.',
      'وإذا مستعجل تگدر تتصل مباشرة على ' + PHONE,
    ],
    unknown: () => [
      'سؤال حلو 👌 ما عندي جواب دقيق عليه هسه، فحولته لفريق ماتك حتى يجاوبك شخص مختص.',
    ],
  };

  /* ---------- qualification flow ---------- */
  const STEPS = {
    q_name: { ask: 'حتى أرتبلك الموضوع بسرعة، شنو اسمك الكريم؟', chips: [] },
    q_role: { ask: 'إنت تشتغل بـ:', chips: ['عندي عيادة', 'مختبر أسنان', 'مركز تخصصي', 'طالب / خريج'] },
    q_city: { ask: 'بيا مدينة؟', chips: ['بغداد', 'البصرة', 'أربيل', 'الموصل', 'النجف', 'كربلاء', 'السليمانية', 'غيرها'] },
    q_use:  { ask: 'شنو أكثر شي ناوي تطبعه؟', chips: ['تيجان', 'أدلة جراحية', 'موديلات وأورثو', 'كلشي'] },
    q_time: { ask: 'وآخر سؤال: متى ناوي تبدي؟', chips: ['هذا الشهر', 'خلال 1-3 أشهر', 'بس أستكشف'] },
  };
  const ORDER = ['q_name', 'q_role', 'q_city', 'q_use', 'q_time'];

  const ROLE = (n) => /طالب|خريج|كليه|student/.test(n) ? 'Student / graduate'
    : /مختبر|لاب|lab/.test(n) ? 'Dental lab'
    : /مركز|center/.test(n) ? 'Specialist center'
    : /عياده|clinic|عندي/.test(n) ? 'Clinic owner' : null;
  const TIME = (n) => /هذا الشهر|هالشهر|هسه|فورا|قريب|this month/.test(n) ? 'This month'
    : /1|2|3|شهر|اشهر|month/.test(n) ? '1–3 months'
    : /استكشف|بس اسال|بعدين|explor/.test(n) ? 'Exploring' : null;
  const USE = (n) => /كلشي|كل شي|الكل|all/.test(n) ? 'Everything'
    : /تيجان|تاج|كراون|crown/.test(n) ? 'Crowns'
    : /جراحي|دليل|guide|زراعه/.test(n) ? 'Surgical guides'
    : /موديل|اورثو|اليقنر|aligner|ريتينر/.test(n) ? 'Models & ortho' : null;

  /* ---------- engine ---------- */
  class Bot {
    constructor(hooks) { this.h = hooks; this.reset(); }

    reset() {
      this.stage = 'idle';
      this.lead = { name: '', role: '', city: '', use: '', timeline: '', interests: [], channel: '', startedAt: new Date() };
      this.log = [];
      this.handoff = false;
      this.unanswered = 0;
      this.h.onState(this.snapshot());
    }

    snapshot() {
      return { stage: this.stage, lead: { ...this.lead, interests: [...this.lead.interests] }, score: this.score(), log: [...this.log], handoff: this.handoff };
    }

    score() {
      const l = this.lead; let s = 0;
      s += { 'Clinic owner': 30, 'Specialist center': 30, 'Dental lab': 25, 'Student / graduate': 5 }[l.role] || 0;
      s += { 'This month': 40, '1–3 months': 25, 'Exploring': 5 }[l.timeline] || 0;
      if (l.interests.includes('Demo request')) s += 15;
      if (l.interests.includes('Buying intent')) s += 15;
      if (l.interests.includes('Price')) s += 10;
      if (l.city) s += 5;
      if (l.name) s += 5;
      return Math.min(100, s);
    }

    interest(tag) { if (!this.lead.interests.includes(tag)) this.lead.interests.push(tag); }

    startQual(reasonLines) {
      if (this.stage === 'done') return [...reasonLines, ...this.doneFollowUp()];
      if (this.stage !== 'idle') return reasonLines;
      this.stage = 'q_name';
      return [...reasonLines, { text: STEPS.q_name.ask, chips: [] }];
    }

    doneFollowUp() {
      return [{ text: 'معلوماتك وصلت لفريق المبيعات ✅ أضفت سؤالك هذا لطلبك حتى يجاوبونك عليه.', chips: MENU }];
    }

    askStep(st) {
      const def = STEPS[st];
      const q = typeof def.ask === 'function' ? def.ask(this.lead) : def.ask;
      return { text: q, chips: def.chips };
    }

    nextStep() {
      const i = ORDER.indexOf(this.stage);
      if (i < ORDER.length - 1) { this.stage = ORDER[i + 1]; return [this.askStep(this.stage)]; }
      this.stage = 'done'; this.handoff = true;
      const l = this.lead;
      const out = [
        `تمام ${l.name} 🙌 جمعت طلبك:\n• ${this.arRole(l.role)}\n• ${l.city}\n• ${this.arUse(l.use)}\n• ${this.arTime(l.timeline)}`,
        'حولته هسه لفريق مبيعات ماتك، وراح يتواصلون وياك بعرض سعر ومواعيد الديمو. وإذا مستعجل: ' + PHONE,
      ];
      if (l.timeline === 'Exploring' || l.role === 'Student / graduate') out.push({ text: 'وإذا تحب تبدي بخطوة خفيفة، الورشة العملية بداية ممتازة 👇\n' + WORKSHOP, chips: MENU });
      else out.push({ text: 'بالانتظار أي سؤال ثاني؟', chips: MENU });
      return out;
    }

    arRole(r) { return { 'Clinic owner': 'عيادة', 'Specialist center': 'مركز تخصصي', 'Dental lab': 'مختبر أسنان', 'Student / graduate': 'طالب / خريج' }[r] || r; }
    arUse(u) { return { Everything: 'كل الاستخدامات', Crowns: 'تيجان', 'Surgical guides': 'أدلة جراحية', 'Models & ortho': 'موديلات وأورثو' }[u] || u; }
    arTime(t) { return { 'This month': 'يبدي هذا الشهر', '1–3 months': 'خلال 1-3 أشهر', Exploring: 'يستكشف حالياً' }[t] || t; }

    handleStepAnswer(text, n) {
      const st = this.stage;
      if (st === 'q_name') {
        const name = text.trim()
          .replace(/^(اسمي|انا|آنا|أنا|my name is|i am|i'm)\s+/i, '')
          .replace(/^(الدكتوره|الدكتور|دكتوره|دكتور|د\.\s*|د\s+|dr\.?\s*)/i, '')
          .trim().slice(0, 40);
        if (!name || name.length < 2) return [{ text: 'ممكن تكتبلي اسمك؟ 🙂', chips: [] }];
        this.lead.name = 'د. ' + name;
        return [`تشرفنا ${this.lead.name} 🌟`, ...this.nextStep()];
      }
      if (st === 'q_role') { const r = ROLE(n); this.lead.role = r || text.slice(0, 40); return this.nextStep(); }
      if (st === 'q_city') { this.lead.city = text.slice(0, 30); return this.nextStep(); }
      if (st === 'q_use') { const u = USE(n); this.lead.use = u || text.slice(0, 40); return this.nextStep(); }
      if (st === 'q_time') { const t = TIME(n); this.lead.timeline = t || text.slice(0, 40); return this.nextStep(); }
      return [];
    }

    reply(text) {
      const n = norm(text);
      const it = detect(text);
      const inQual = this.stage.startsWith('q_');
      // during qualification: short/obvious answers go to the flow; real questions get answered then the step is repeated
      const isQuestion = it.id !== 'unknown' && it.id !== 'greet' && it.id !== 'thanks' && (n.split(' ').length > 2 || /\?|؟/.test(text));
      const stepAnswerLike = inQual && (!isQuestion || (this.stage === 'q_use' && it.id === 'apps') || (this.stage === 'q_city'));
      const entry = { t: new Date(), text, intent: it.tag, conf: it.conf, stage: this.stage };

      let out = [];
      if (stepAnswerLike) {
        entry.intent = 'Answer · ' + { q_name: 'name', q_role: 'role', q_city: 'city', q_use: 'use case', q_time: 'timeline' }[this.stage];
        entry.conf = 0.95;
        out = this.handleStepAnswer(text, n);
      } else {
        switch (it.id) {
          case 'price': this.interest('Price'); out = this.startQual(['السعر يعتمد على الباقة: الطابعة + التدريب + خطة الصيانة 💡', 'حتى يرسلك فريق المبيعات عرض سعر دقيق يناسبك، أحتاج منك كم معلومة بسيطة.']); break;
          case 'demo': this.interest('Demo request'); out = this.startQual(['أكيد! أحلى شي تشوف الطابعة تطبع تاج قدامك 😎 نرتبلك ديمو.']); break;
          case 'buy': this.interest('Buying intent'); out = this.startQual(['ممتاز 👌 خليني أجمعلك المعلومات حتى يتواصل وياك فريق المبيعات مباشرة.']); break;
          case 'human': this.interest('Wants a person'); this.handoff = true; out = A.human(); break;
          case 'unknown': this.unanswered++; this.interest('Open question'); this.handoff = true; out = A.unknown(); break;
          default:
            this.interest(it.tag);
            out = A[it.id] ? A[it.id]() : A.unknown();
            if (this.stage === 'idle' && ['greet', 'thanks'].includes(it.id)) out = [...out.slice(0, -1), { text: out[out.length - 1], chips: MENU }];
            if (this.stage === 'idle' && ['origin', 'speed', 'users', 'support'].includes(it.id)) out.push({ text: 'تحب أرتبلك ديمو أو أرسلك عرض سعر؟', chips: ['أريد أحجز ديمو', 'شكد سعر الطابعة؟'] });
        }
        if (inQual && !stepAnswerLike) { const q = this.askStep(this.stage); out.push({ text: 'نرجع لطلبك 👇 ' + q.text, chips: q.chips }); }   // resume the flow
        if (this.stage === 'done' && !['thanks', 'greet', 'human'].includes(it.id) && it.id !== 'price' && it.id !== 'demo' && it.id !== 'buy') {
          const last = out[out.length - 1];
          if (typeof last === 'string') out[out.length - 1] = { text: last, chips: MENU };
        }
      }
      this.log.push(entry);
      this.h.onState(this.snapshot());
      return out.map(o => typeof o === 'string' ? { text: o, chips: null } : o);
    }
  }

  window.MaticBot = { Bot, MENU, norm, detect };
})();
