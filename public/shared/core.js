/* OshRest core: i18n, тема, Supabase, вход, уведомления, общие виджеты */
(function () {
  'use strict';
  const OSH = window.OSH = {};
  const ls = { get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => [].slice.call((r || document).querySelectorAll(s));
  OSH.$ = $; OSH.$$ = $$;

  // ---------- i18n ----------
  const D = {}; OSH.addT = o => Object.assign(D, o);
  let L = parseInt(ls.get('osh-lang'), 10); if (!(L >= 0 && L < 3)) L = 1;
  OSH.lang = () => L;
  const t = OSH.t = (k, a) => { const v = D[k]; let s = v ? (v[L] || v[1]) : k; if (a) for (const x in a) s = s.replace('{' + x + '}', a[x]); return s; };
  OSH.addT({
    ok: ['Макул', 'Ок', 'OK'], cancel: ['Жокко чыгаруу', 'Отменить', 'Cancel'], close: ['Жабуу', 'Закрыть', 'Close'], save: ['Сактоо', 'Сохранить', 'Save'], del: ['Өчүрүү', 'Удалить', 'Delete'],
    edit: ['Түзөтүү', 'Изменить', 'Edit'], add: ['Кошуу', 'Добавить', 'Add'], logout: ['Чыгуу', 'Выйти', 'Log out'], login: ['Кирүү', 'Войти', 'Log in'], name: ['Аты-жөнү', 'Имя', 'Name'],
    phone: ['Телефон', 'Телефон', 'Phone'], pass: ['Сырсөз', 'Пароль', 'Password'], install: ['Орнотуу', 'Установить', 'Install'], loading: ['Жүктөлүүдө…', 'Загрузка…', 'Loading…'],
    s_new: ['Күтүүдө', 'Ожидает', 'Pending'], s_confirmed: ['Тастыкталды', 'Подтверждена', 'Confirmed'], s_declined: ['Четке кагылды', 'Отклонена', 'Declined'], s_cancelled: ['Жокко чыгарылды', 'Отменена', 'Cancelled'], s_answered: ['Жооп берилди', 'Отвечено', 'Answered'],
    night: ['сом/түн', 'сом/ночь', 'KGS/night'], nights: ['түн', 'ноч.', 'nights'], som: ['сом', 'сом', 'KGS'], guests: ['Коноктор', 'Гости', 'Guests'], total: ['Жалпы сумма', 'Итого', 'Total'],
    free: ['Бош', 'Свободно', 'Available'], busy: ['Бош эмес', 'Занято', 'Unavailable'], incl: ['баада', 'включено', 'included'], from: ['баасы', 'от', 'from'],
    booking: ['Брондоо', 'Бронь', 'Booking'], inquiry: ['Суроо', 'Вопрос', 'Inquiry'], call: ['Чалуу', 'Позвонить', 'Call'], msg: ['Билдирүү', 'Сообщение', 'Message'], reply: ['Жооп', 'Ответ', 'Reply'],
    sent_reply: ['Жооп жөнөтүү', 'Отправить ответ', 'Send reply'], confirm: ['Ырастоо', 'Подтвердить', 'Confirm'], decline: ['Четке кагуу', 'Отклонить', 'Decline'], neterr: ['Тармак катасы', 'Ошибка сети', 'Network error'],
    wrongsite: ['Бул аккаунт башка сайтка таандык.', 'Этот аккаунт относится к другому сайту.', 'This account belongs to another site.'],
    nocfg: ['Сервер конфигурацияланган эмес (Supabase).', 'Сервер не настроен (Supabase). Проверьте переменные окружения на Render.', 'Server is not configured (Supabase). Check Render environment variables.'],
    badlogin: ['Логин же сырсөз туура эмес', 'Неверный логин или пароль', 'Wrong login or password'],
    iosinst: ['Safari: «Бөлүшүү» → «Башкы экранга кошуу»', 'Safari: «Поделиться» → «На экран Домой»', 'Safari: Share → Add to Home Screen'],
    theme: ['Тема', 'Тема', 'Theme'], newreq: ['Жаңы билдирүү', 'Новая заявка', 'New request'], ago: ['азыр', 'только что', 'just now']
  });
  const cats = () => (window.CATALOG && CATALOG.cats) || {};
  OSH.catIcon = k => (cats()[k] || ['📍'])[0];
  OSH.catName = k => (cats()[k] ? cats()[k][1][L] : k);
  OSH.regName = k => (CATALOG.regs[k] ? CATALOG.regs[k][L] : k);
  OSH.amName = k => (CATALOG.am[k] ? CATALOG.am[k][0] + ' ' + CATALOG.am[k][1 + L] : k);
  OSH.svName = k => (CATALOG.sv[k] ? CATALOG.sv[k].i + ' ' + CATALOG.sv[k].l[L] : k);

  // ---------- утилиты ----------
  const esc = OSH.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  OSH.money = n => String(Math.round(+n || 0)).replace(/\B(?=(\d{3})+$)/g, ' ');
  OSH.stars = v => { const n = Math.round(v || 0); return '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n); };
  const hash = s => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); };
  OSH.grad = (id, i) => { const h = hash(String(id)) + (i || 0) * 47; return 'linear-gradient(150deg,hsl(' + (h % 360) + ',58%,52%),hsl(' + ((h * 7 + 60) % 360) + ',50%,30%))'; };
  OSH.photoStyle = (p, i, emoji) => { const u = p.photos && p.photos[i]; return u ? 'background-image:url(' + esc(u) + ')' : 'background:' + OSH.grad(p.id, i); };
  OSH.iso = d => { const x = new Date(d.getTime() - d.getTimezoneOffset() * 6e4); return x.toISOString().slice(0, 10); };
  OSH.today = () => OSH.iso(new Date());
  OSH.nights = (a, b) => Math.round((new Date(b) - new Date(a)) / 864e5);
  OSH.fdate = s => s ? new Date(s + (s.length > 10 ? '' : 'T00:00')).toLocaleDateString(['ky-KG', 'ru-RU', 'en-GB'][L], { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  OSH.ftime = s => new Date(s).toLocaleString(['ky-KG', 'ru-RU', 'en-GB'][L], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  OSH.loginToEmail = s => { s = String(s || '').trim().toLowerCase(); if (s.includes('@')) return s; if (/^[+\d\s()-]{7,}$/.test(s)) return s.replace(/\D/g, '') + '@phone.oshrest.local'; return s.replace(/[^a-z0-9._-]/g, '') + '@owner.oshrest.local'; };
  OSH.dispLogin = (email, login) => login || String(email || '').split('@')[0];
  OSH.debounce = (f, ms) => { let x; return function () { const a = arguments; clearTimeout(x); x = setTimeout(() => f.apply(null, a), ms); }; };
  OSH.waLink = p => 'https://wa.me/' + String(p || '').replace(/\D/g, '');
  OSH.telLink = p => 'tel:' + String(p || '').replace(/[^\d+]/g, '');

  // ---------- тема ----------
  function setTheme(v) { document.documentElement.setAttribute('data-theme', v); ls.set('osh-theme', v); const m = $('meta[name=theme-color]'); if (m) m.content = v === 'dark' ? '#0a1220' : '#2f6bff'; $$('[data-act=theme]').forEach(b => b.textContent = v === 'dark' ? '☀️' : '🌙'); }
  OSH.toggleTheme = function (ev) {
    const cur = document.documentElement.getAttribute('data-theme'), nx = cur === 'dark' ? 'light' : 'dark';
    if (ev && ev.clientX != null) { document.documentElement.style.setProperty('--tx', ev.clientX + 'px'); document.documentElement.style.setProperty('--ty', ev.clientY + 'px'); }
    if (document.startViewTransition && !matchMedia('(prefers-reduced-motion:reduce)').matches) document.startViewTransition(() => setTheme(nx)); else setTheme(nx);
  };

  // ---------- линза: блик следует за курсором ----------
  document.addEventListener('pointermove', e => { const b = e.target.closest && e.target.closest('.lens'); if (!b) return; const r = b.getBoundingClientRect(); b.style.setProperty('--mx', (e.clientX - r.left) + 'px'); b.style.setProperty('--my', (e.clientY - r.top) + 'px'); }, { passive: true });

  // ---------- уведомления сверху ----------
  OSH.toast = function (o) {
    let box = $('#toasts'); if (!box) { box = document.createElement('div'); box.id = 'toasts'; document.body.appendChild(box); }
    const el = document.createElement('div'); el.className = 'toast ' + (o.type || '');
    el.innerHTML = '<span class="ti">' + (o.icon || 'ℹ️') + '</span><div style="flex:1">' + (o.title ? '<b>' + esc(o.title) + '</b>' : '') + (o.text ? '<span class="m">' + esc(o.text) + '</span>' : '') + '</div><button class="lens sm ic" aria-label="close">×</button>';
    const kill = () => { el.classList.add('out'); setTimeout(() => el.remove(), 300); };
    el.querySelector('button').onclick = e => { e.stopPropagation(); kill(); };
    if (o.onclick) { el.style.cursor = 'pointer'; el.onclick = () => { kill(); o.onclick(); }; }
    box.appendChild(el); setTimeout(kill, o.ms || 6000);
    try { if (o.vibrate && navigator.vibrate) navigator.vibrate([80, 40, 80]); } catch (e) {}
  };
  OSH.err = m => OSH.toast({ type: 'err', icon: '⚠️', text: m || t('neterr') });

  // ---------- окно ----------
  OSH.sheet = function (html, wide) {
    let d = $('#dlg'); if (!d) { d = document.createElement('div'); d.id = 'dlg'; d.className = 'dlg'; d.innerHTML = '<div class="sheet" id="sheet"></div>'; document.body.appendChild(d); d.addEventListener('mousedown', e => { if (e.target === d) OSH.closeSheet(); }); }
    $('#sheet').innerHTML = '<button class="lens ic x" data-act="closesheet" aria-label="close">×</button>' + html; if (wide) $('#sheet').style.maxWidth = '980px'; else $('#sheet').style.maxWidth = '';
    d.classList.add('open'); document.body.style.overflow = 'hidden'; return $('#sheet');
  };
  OSH.closeSheet = function () { const d = $('#dlg'); if (d) d.classList.remove('open'); document.body.style.overflow = ''; };
  OSH.ask = function (text, yes) { const s = OSH.sheet('<div class="sp"><p style="font-size:1.05rem;margin-top:2rem">' + esc(text) + '</p><div class="g2"><button class="lens" data-act="closesheet">' + t('cancel') + '</button><button class="lens bad" id="askY">' + t('ok') + '</button></div></div>'); $('#askY', s).onclick = () => { OSH.closeSheet(); yes(); }; };
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { OSH.closeSheet(); const lb = $('#lb'); if (lb) lb.classList.remove('open'); } });

  // ---------- лайтбокс ----------
  OSH.lightbox = function (items, i) {
    let lb = $('#lb'); if (!lb) { lb = document.createElement('div'); lb.id = 'lb'; lb.className = 'lb'; lb.innerHTML = '<div class="big" id="lbig"></div><p id="lcap"></p><button class="lens ic" id="lx" style="top:14px;right:14px">×</button><button class="lens ic" id="lpv" style="left:10px;top:50%">‹</button><button class="lens ic" id="lnx" style="right:10px;top:50%">›</button>'; document.body.appendChild(lb); }
    let k = i; const show = () => { const x = items[k]; const b = $('#lbig'); b.style.cssText = x.style; b.textContent = x.style.indexOf('url(') > -1 ? '' : x.e; $('#lcap').textContent = x.c || ''; };
    $('#lx').onclick = () => lb.classList.remove('open'); $('#lpv').onclick = () => { k = (k + items.length - 1) % items.length; show(); }; $('#lnx').onclick = () => { k = (k + 1) % items.length; show(); };
    lb.onclick = e => { if (e.target === lb) lb.classList.remove('open'); };
    let sx = null; lb.ontouchstart = e => sx = e.touches[0].clientX; lb.ontouchend = e => { if (sx == null) return; const d = e.changedTouches[0].clientX - sx; if (Math.abs(d) > 50) (d < 0 ? $('#lnx') : $('#lpv')).click(); sx = null; };
    show(); lb.classList.add('open');
  };

  // ---------- PWA ----------
  let dip = null;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); dip = e; $$('.install').forEach(b => b.classList.add('show')); });
  window.addEventListener('appinstalled', () => { dip = null; $$('.install').forEach(b => b.classList.remove('show')); });
  const standalone = () => matchMedia('(display-mode:standalone)').matches || navigator.standalone;
  OSH.install = async function () { if (dip) { dip.prompt(); await dip.userChoice; dip = null; $$('.install').forEach(b => b.classList.remove('show')); } else OSH.toast({ icon: '📲', text: t('iosinst'), ms: 9000 }); };
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !standalone();

  // ---------- шапка ----------
  OSH.header = function (brand, sub, extra) {
    return '<header class="top"><div class="brand"><span class="lg">⛰</span><span>' + esc(brand) + (sub ? '<small>' + esc(sub) + '</small>' : '') + '</span></div>' + (extra || '') +
      '<button class="lens sm install' + (isIOS ? ' show' : '') + '" data-act="install">📲 <span class="hide-s">' + t('install') + '</span></button>' +
      '<button class="lens sm ic" data-act="lang" aria-label="language" title="KY / RU / EN">' + ['KY', 'RU', 'EN'][L] + '</button>' +
      '<button class="lens sm ic" data-act="theme" aria-label="theme">' + (document.documentElement.getAttribute('data-theme') === 'dark' ? '☀️' : '🌙') + '</button></header>';
  };
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const a = b.dataset.act;
    if (a === 'theme') OSH.toggleTheme(e); else if (a === 'lang') { L = (L + 1) % 3; ls.set('osh-lang', L); document.documentElement.lang = ['ky', 'ru', 'en'][L]; if (OSH.rerender) OSH.rerender(); }
    else if (a === 'install') OSH.install(); else if (a === 'closesheet') OSH.closeSheet();
  });

  // ---------- Supabase и API ----------
  OSH.api = async function (path, method, body) {
    const h = { 'Content-Type': 'application/json' };
    if (OSH.sb) { const { data } = await OSH.sb.auth.getSession(); if (data.session) h.Authorization = 'Bearer ' + data.session.access_token; }
    const r = await fetch(path, { method: method || 'POST', headers: h, body: body ? JSON.stringify(body) : undefined });
    let j = {}; try { j = await r.json(); } catch (e) {}
    if (!r.ok) throw new Error(j.error || t('neterr')); return j;
  };
  OSH.watch = function (table, filter, cb) {
    const cfg = { event: '*', schema: 'public', table }; if (filter) cfg.filter = filter;
    return OSH.sb.channel('rt-' + table + '-' + Math.random().toString(36).slice(2)).on('postgres_changes', cfg, cb).subscribe();
  };

  // сжатие и загрузка фото в Supabase Storage
  OSH.upload = async function (file, folder) {
    const img = await new Promise((ok, no) => { const u = URL.createObjectURL(file), i = new Image(); i.onload = () => { URL.revokeObjectURL(u); ok(i); }; i.onerror = no; i.src = u; });
    const k = Math.min(1, 1400 / Math.max(img.width, img.height)), c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', .82));
    const path = (folder || 'misc') + '/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.jpg';
    const { error } = await OSH.sb.storage.from('photos').upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000' });
    if (error) throw error; return OSH.sb.storage.from('photos').getPublicUrl(path).data.publicUrl;
  };

  // ---------- экран входа ----------
  // o: {site, title, sub, register:bool, forgot:bool, loginLabel, loginPh}
  function authScreen(o, done) {
    let mode = 'in';
    const root = $('#app');
    const draw = () => {
      root.innerHTML = '<div class="aurora"><i></i><i></i><i></i></div>' + OSH.header('OshRest', o.badge) +
        '<div class="auth"><form class="authbox" id="af" autocomplete="on"><div style="font-size:2.4rem">' + o.icon + '</div><h1>' + esc(o.title) + '</h1><p class="sub">' + esc(o.sub) + '</p>' +
        (o.register ? '<div class="seg"><button type="button" data-m="in" class="' + (mode === 'in' ? 'on' : '') + '">' + t('login') + '</button><button type="button" data-m="up" class="' + (mode === 'up' ? 'on' : '') + '">' + t('a_reg') + '</button></div>' : '') +
        (mode === 'up' ? '<label class="f">' + t('name') + '<input id="an" required maxlength="80" autocomplete="name"></label>' : '') +
        '<label class="f">' + o.loginLabel + '<input id="al" required autocomplete="username" autocapitalize="none" inputmode="' + (o.register ? 'email' : 'text') + '" placeholder="' + esc(o.loginPh || '') + '"></label>' +
        '<label class="f">' + t('pass') + '<input id="ap" type="password" required minlength="' + (mode === 'up' ? 6 : 1) + '" autocomplete="' + (mode === 'up' ? 'new-password' : 'current-password') + '"></label>' +
        '<div class="ferr" id="ae"></div><button class="lens pri block" id="ab" type="submit">' + (mode === 'up' ? t('a_reg') : t('login')) + '</button>' +
        (o.forgot && mode === 'in' ? '<div style="text-align:center;margin-top:.5rem"><button class="lnk" type="button" id="afg">' + t('a_forgot') + '</button></div>' : '') +
        '<p class="m" style="text-align:center;margin:.6rem 0 0">' + esc(o.foot || '') + '</p></form></div>';
      $$('[data-m]', root).forEach(b => b.onclick = () => { mode = b.dataset.m; draw(); });
      const fg = $('#afg', root); if (fg) fg.onclick = forgot;
      $('#af', root).onsubmit = async ev => {
        ev.preventDefault(); const err = $('#ae'), btn = $('#ab'); err.textContent = ''; btn.disabled = true;
        const login = $('#al').value, pass = $('#ap').value;
        try {
          if (mode === 'up') { await OSH.api('/api/register', 'POST', { login, password: pass, name: $('#an').value }); }
          const { error } = await OSH.sb.auth.signInWithPassword({ email: OSH.loginToEmail(login), password: pass });
          if (error) throw new Error(t('badlogin'));
          done();
        } catch (e) { err.textContent = e.message; btn.disabled = false; }
      };
    };
    const forgot = () => {
      const s = OSH.sheet('<div class="sp"><h2 style="margin-top:2rem">' + t('a_forgot') + '</h2><p class="m">' + t('a_forgot_d') + '</p><label class="f">' + o.loginLabel + '<input id="fl" autocapitalize="none"></label><label class="f">' + t('a_note') + '<input id="fn" maxlength="200"></label><div class="ferr" id="fe"></div><button class="lens pri block" id="fs">' + t('a_send') + '</button></div>');
      $('#fl', s).value = ($('#al') || {}).value || '';
      $('#fs', s).onclick = async () => { try { await OSH.api('/api/forgot', 'POST', { login: $('#fl', s).value, note: $('#fn', s).value }); OSH.closeSheet(); OSH.toast({ type: 'ok', icon: '✅', text: t('a_sent') }); } catch (e) { $('#fe', s).textContent = e.message; } };
    };
    draw(); OSH.rerender = draw;
  }
  OSH.addT({
    a_reg: ['Катталуу', 'Регистрация', 'Sign up'], a_forgot: ['Сырсөздү унуттум', 'Забыли пароль?', 'Forgot password?'],
    a_forgot_d: ['Суроо башкы администраторго жөнөтүлөт, ал сизге жаңы сырсөз берет.', 'Запрос уйдёт главному администратору — он выдаст новый пароль.', 'The request goes to the main administrator, who will issue a new password.'],
    a_note: ['Байланыш үчүн комментарий', 'Комментарий для связи', 'Contact note'], a_send: ['Жөнөтүү', 'Отправить', 'Send'], a_sent: ['Суроо башкы администраторго жөнөтүлдү', 'Запрос отправлен главному администратору', 'Request sent to the main administrator'],
    a_wait: ['Профиль жүктөлүүдө…', 'Загружаем профиль…', 'Loading profile…']
  });

  // ---------- запуск ----------
  // o: {site, role, auth:{...}, start(profile)}
  OSH.start = function (o) {
    document.documentElement.lang = ['ky', 'ru', 'en'][L];
    document.addEventListener('DOMContentLoaded', async () => {
      const root = $('#app'), cfg = window.OSH_CFG || {};
      if ('serviceWorker' in navigator) navigator.serviceWorker.register(o.sw, { scope: o.scope }).catch(() => {});
      if (!cfg.url || !cfg.key || !window.supabase) { root.innerHTML = '<div class="auth"><div class="authbox"><h1>⚙️</h1><p>' + t('nocfg') + '</p></div></div>'; return; }
      OSH.sb = supabase.createClient(cfg.url, cfg.key, { auth: { storageKey: 'osh-auth-' + o.site, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } });
      OSH.logout = async () => { await OSH.sb.auth.signOut(); location.reload(); };
      const enter = async () => {
        root.innerHTML = '<div class="aurora"><i></i><i></i><i></i></div><div class="auth"><span class="spin"></span></div>';
        const { data: { session } } = await OSH.sb.auth.getSession();
        if (!session) return authScreen(o.auth, enter);
        const { data: prof, error } = await OSH.sb.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
        if (error || !prof || o.role.indexOf(prof.role) < 0) {
          await OSH.sb.auth.signOut();
          authScreen(o.auth, enter); const e = $('#ae'); if (e) e.textContent = error ? t('neterr') : t('wrongsite'); return;
        }
        OSH.me = prof; OSH.session = session; o.start(prof);
      };
      OSH.sb.auth.onAuthStateChange(ev => { if (ev === 'SIGNED_OUT' && OSH.me) location.reload(); });
      enter();
    });
  };

  // ---------- карточка заявки (общая) ----------
  // ctx: {places:{id:place}, rooms:{id:room}, mode:'owner'|'tourist'|'admin', fresh:Set}
  OSH.reqHtml = function (r, ctx) {
    const p = ctx.places[r.place_id] || { name: '—' }, rm = r.room_id && ctx.rooms[r.room_id];
    const stc = r.status === 'confirmed' ? 'ok' : (r.status === 'declined' || r.status === 'cancelled') ? 'no' : r.status === 'answered' ? '' : 'new';
    let h = '<div class="rq' + (ctx.fresh && ctx.fresh.has(r.id) ? ' fresh' : '') + '" data-rid="' + r.id + '"><div style="display:flex;gap:.5rem;align-items:center;flex-wrap:wrap"><b>' + (r.kind === 'booking' ? '🛏 ' : '💬 ') + esc(p.name) + '</b><span class="badge ' + stc + '">' + t('s_' + r.status) + '</span><span class="m" style="margin-left:auto">' + OSH.ftime(r.created_at) + '</span></div>';
    if (ctx.mode !== 'tourist') h += '<div>👤 <b>' + esc(r.tourist_name || '—') + '</b> · <a href="' + OSH.telLink(r.tourist_phone) + '">' + esc(r.tourist_phone || '') + '</a></div>';
    if (r.kind === 'booking') h += '<div class="m">' + (rm ? esc(rm.name) + ' · ' : '') + OSH.fdate(r.d1) + ' → ' + OSH.fdate(r.d2) + ' (' + OSH.nights(r.d1, r.d2) + ' ' + t('nights') + ') · 👥 ' + r.guests + ' · <b class="pc">' + OSH.money(r.total) + ' ' + t('som') + '</b></div>' + ((r.services || []).length ? '<ul class="tags">' + r.services.map(k => '<li>' + esc(OSH.svName(k)) + '</li>').join('') + '</ul>' : '');
    if (r.message) h += '<div style="margin:.2rem 0">💬 ' + esc(r.message) + '</div>';
    if (r.reply) h += '<div class="panel" style="margin:.4rem 0;padding:.5rem .7rem"><b>' + t('reply') + ':</b> ' + esc(r.reply) + '</div>';
    h += '<div class="acts">';
    if (ctx.mode === 'tourist') {
      if ((r.status === 'new' || r.status === 'confirmed') && r.kind === 'booking' && r.d1 >= OSH.today()) h += '<button class="lens sm" data-cx="' + r.id + '">' + t('cancel') + '</button>';
      if (p.phone) h += '<a class="lens sm" href="' + OSH.telLink(p.phone) + '">📞 ' + t('call') + '</a><a class="lens sm ok" target="_blank" rel="noopener" href="' + OSH.waLink(p.whatsapp || p.phone) + '">WhatsApp</a>';
    } else {
      if (r.kind === 'booking' && r.status === 'new') h += '<button class="lens sm ok" data-ok="' + r.id + '">✔ ' + t('confirm') + '</button><button class="lens sm bad" data-no="' + r.id + '">✖ ' + t('decline') + '</button>';
      h += '<button class="lens sm" data-rp="' + r.id + '">💬 ' + t('reply') + '</button><a class="lens sm" href="' + OSH.telLink(r.tourist_phone) + '">📞</a><a class="lens sm ok" target="_blank" rel="noopener" href="' + OSH.waLink(r.tourist_phone) + '">WhatsApp</a>';
    }
    return h + '</div></div>';
  };
})();
