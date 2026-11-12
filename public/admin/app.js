/* Главный администратор: вся база, владельцы, пароли, статистика */
(function () {
  'use strict';
  const { $, $$, t, esc, money } = OSH;
  OSH.addT({
    ad_title: ['Башкы администратор', 'Главный администратор', 'Main administrator'], ad_sub: ['Бардык база ушул жерде гана башкарылат', 'Вся база управляется только здесь', 'The whole database is managed only here'], ad_login: ['Логин же e-mail', 'Логин или e-mail', 'Login or e-mail'],
    n_dash: ['Дашборд', 'Дашборд', 'Dashboard'], n_own: ['Админдер', 'Админы', 'Admins'], n_pl: ['Жайлар', 'Объекты', 'Places'], n_rq: ['Заявкалар', 'Заявки', 'Requests'], n_us: ['Туристтер', 'Туристы', 'Tourists'], n_pw: ['Сырсөздөр', 'Пароли', 'Passwords'],
    k_pl: ['Жайлар', 'Объекты', 'Places'], k_rm: ['Бөлмөлөр', 'Номера', 'Rooms'], k_ow: ['Администраторлор', 'Админы объектов', 'Venue admins'], k_us: ['Туристтер', 'Туристы', 'Tourists'], k_rq: ['Заявкалар', 'Заявки', 'Requests'], k_rev: ['Киреше, сом', 'Доход, сом', 'Revenue, KGS'],
    mb: ['Айлар боюнча заявкалар', 'Заявки по месяцам', 'Requests by month'], mr: ['Тастыкталган киреше', 'Подтверждённый доход', 'Confirmed revenue'], top: ['Популярдуу жайлар', 'Популярные места', 'Top places'],
    newown: ['Жаңы администратор түзүү', 'Создать администратора объекта', 'Create venue admin'], o_login: ['Логин (латын)', 'Логин (латиницей)', 'Login (latin)'], o_gen: ['Түзүү', 'Сгенерировать', 'Generate'], create: ['Түзүү', 'Создать', 'Create'],
    created: ['Аккаунт түзүлдү. Маалыматты администраторго жөнөтүңүз:', 'Аккаунт создан. Передайте данные администратору объекта:', 'Account created. Send these details to the venue admin:'], copy: ['Көчүрүү', 'Копировать', 'Copy'], copied: ['Көчүрүлдү', 'Скопировано', 'Copied'],
    chpw: ['Сырсөз алмаштыруу', 'Сменить пароль', 'Change password'], newpw: ['Жаңы сырсөз', 'Новый пароль', 'New password'], pwdone: ['Сырсөз жаңыртылды', 'Пароль обновлён', 'Password updated'], conf_del: ['Чын эле өчүрөсүзбү? Мунун баары өчөт.', 'Точно удалить? Данные будут потеряны.', 'Really delete? Data will be lost.'],
    owner_: ['Ээси', 'Владелец', 'Owner'], none: ['— жок —', '— нет —', '— none —'], noitems: ['Бош', 'Пусто', 'Empty'], pw_none: ['Сырсөз боюнча суроо жок', 'Запросов на сброс нет', 'No reset requests'], pw_for: ['Сырсөз суралды', 'Запрос сброса пароля', 'Password reset requested'],
    pw_mark: ['Аткарылды', 'Готово', 'Done'], pw_set: ['Жаңы сырсөз коюу', 'Задать новый пароль', 'Set new password'], saved: ['Сакталды', 'Сохранено', 'Saved'], csv: ['CSV жүктөө', 'Скачать CSV', 'Download CSV'], reg_at: ['Катталган', 'Регистрация', 'Registered'],
    f_cat: ['Категория', 'Категория', 'Category'], f_reg: ['Район', 'Район', 'District'], f_name: ['Аталышы', 'Название', 'Name'], f_active: ['Сайтта көрсөтүү', 'Показывать на сайте', 'Visible'], f_price: ['Баасы төмөндөн', 'Цена от', 'Price from'], f_rate: ['Рейтинг (0–5)', 'Рейтинг (0–5)', 'Rating (0–5)'], addpl: ['Жай кошуу', 'Добавить объект', 'Add place'],
    f_desc: ['Сүрөттөмө', 'Описание', 'Description'], f_lat: ['Кеңдик', 'Широта', 'Lat'], f_lng: ['Узундук', 'Долгота', 'Lng'], rooms: ['бөлмө', 'номеров', 'rooms'], seed_note: ['Ээси жок жайлар — «Ээси» тандаңыз', 'У объектов без владельца выберите «Владелец»', 'Assign an owner to unowned places'],
    me_out: ['Чыгуу', 'Выйти', 'Log out'], wk: ['Күн', 'День', 'Day']
  });
  const S = { v: 'dash', profiles: [], places: [], rooms: [], reqs: [], pw: [], rf: '' };
  const sb = () => OSH.sb, byId = a => a.reduce((m, x) => (m[x.id] = x, m), {});
  const owners = () => S.profiles.filter(p => p.role === 'owner'), tourists = () => S.profiles.filter(p => p.role === 'tourist');

  OSH.start({
    site: 'admin', role: ['admin'], sw: '/admin/sw.js', scope: '/admin/',
    auth: { site: 'admin', badge: 'Админ', title: t('ad_title'), sub: t('ad_sub'), register: false, forgot: false, loginLabel: t('ad_login'), loginPh: 'admin', foot: '' },
    start: boot
  });

  async function load() {
    const [pr, pl, rm, rq, pw] = await Promise.all([
      sb().from('profiles').select('*').order('created_at', { ascending: false }), sb().from('places').select('*').order('created_at'), sb().from('rooms').select('*'),
      sb().from('requests').select('*').order('created_at', { ascending: false }).limit(3000), sb().from('password_requests').select('*').order('created_at', { ascending: false }).limit(200)]);
    S.profiles = pr.data || []; S.places = pl.data || []; S.rooms = rm.data || []; S.reqs = rq.data || []; S.pw = pw.data || [];
  }
  async function boot() {
    $('#app').innerHTML = '<div class="aurora"><i></i><i></i><i></i></div><div class="auth"><span class="spin"></span></div>';
    await load();
    OSH.watch('password_requests', null, p => { if (p.eventType === 'INSERT') { S.pw.unshift(p.new); OSH.toast({ type: 'new', title: t('pw_for'), text: p.new.login, onclick: () => go('pw'), ms: 12000, vibrate: true }); head(); if (S.v === 'pw') draw(); } else if (p.new) { const i = S.pw.findIndex(x => x.id === p.new.id); if (i > -1) S.pw[i] = p.new; head(); if (S.v === 'pw') draw(); } });
    OSH.watch('requests', null, p => { if (p.eventType === 'INSERT') { S.reqs.unshift(p.new); } else if (p.new) { const i = S.reqs.findIndex(x => x.id === p.new.id); if (i > -1) S.reqs[i] = p.new; } if (S.v === 'dash' || S.v === 'rq') draw(); });
    OSH.rerender = render; render();
  }
  const tabs = [['dash', '<i class=i-chart></i>', 'n_dash'], ['own', '<i class=i-key></i>', 'n_own'], ['pl', '<i class=i-building></i>', 'n_pl'], ['rq', '<i class=i-receipt></i>', 'n_rq'], ['us', '<i class=i-users></i>', 'n_us'], ['pw', '<i class=i-lock></i>', 'n_pw']];
  function render() {
    document.body.classList.add('hasnav');
    $('#app').innerHTML = '<div class="aurora"><i></i><i></i><i></i></div>' + OSH.header('OshRest', 'Админ', '<button class="lens sm" id="lo"><span class="hide-s">' + t('me_out') + '</span></button>') + '<main class="wrap view" id="main"></main>' +
      '<nav class="tabs">' + tabs.map(a => '<button data-v="' + a[0] + '" class="' + (S.v === a[0] ? 'on' : '') + '"><span>' + a[1] + '</span>' + t(a[2]) + '</button>').join('') + '</nav>';
    $('#lo').onclick = OSH.logout; head(); draw();
  }
  function head() { const n = $('nav.tabs [data-v=pw]'); if (!n) return; const d = $('.dot', n); if (d) d.remove(); const c = S.pw.filter(x => x.status === 'new').length; if (c) n.insertAdjacentHTML('beforeend', '<i class="dot">' + c + '</i>'); }
  function go(v) { S.v = v; $$('nav.tabs button').forEach(b => b.classList.toggle('on', b.dataset.v === v)); draw(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function draw() { const m = $('#main'); m.classList.remove('view'); void m.offsetWidth; m.classList.add('view'); ({ dash, own: drawOwn, pl: drawPl, rq: drawRq, us: drawUs, pw: drawPw })[S.v](); }

  // ---------- дашборд ----------
  function dash() {
    const cf = S.reqs.filter(r => r.status === 'confirmed'), rev = cf.reduce((s, r) => s + (r.total || 0), 0), K = [[S.places.length, 'k_pl'], [S.rooms.length, 'k_rm'], [owners().length, 'k_ow'], [tourists().length, 'k_us'], [S.reqs.length, 'k_rq'], [money(rev), 'k_rev']];
    const now = new Date(), mk = []; for (let i = 11; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); mk.push(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')); }
    const key = r => OSH.iso(new Date(r.created_at)).slice(0, 7), bc = mk.map(k => S.reqs.filter(r => key(r) === k).length), rc = mk.map(k => cf.filter(r => key(r) === k).reduce((s, r) => s + (r.total || 0), 0));
    const mb = Math.max.apply(null, bc.concat(1)), mr = Math.max.apply(null, rc.concat(1)), cnt = {}; S.reqs.forEach(r => cnt[r.place_id] = (cnt[r.place_id] || 0) + 1);
    const top = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a]).slice(0, 5), pl = byId(S.places), lab = '<div class="bl">' + mk.map(x => '<span>' + x.slice(5) + '</span>').join('') + '</div>';
    $('#main').innerHTML = '<div class="kg">' + K.map(k => '<div class="kpi"><small>' + t(k[1]) + '</small><b>' + k[0] + '</b></div>').join('') + '</div>' +
      '<h2 class="sec">' + t('mb') + '</h2><div class="panel"><div class="bars">' + bc.map((v, i) => '<div title="' + mk[i] + ': ' + v + '" style="height:' + v / mb * 100 + '%;animation-delay:' + i * .04 + 's"></div>').join('') + '</div>' + lab + '</div>' +
      '<h2 class="sec">' + t('mr') + '</h2><div class="panel"><div class="bars r">' + rc.map((v, i) => '<div title="' + mk[i] + ': ' + money(v) + '" style="height:' + v / mr * 100 + '%;animation-delay:' + i * .04 + 's"></div>').join('') + '</div>' + lab + '</div>' +
      '<h2 class="sec">' + t('top') + '</h2><div class="panel">' + (top.map((id, i) => '<div class="rq">' + (i + 1) + '. <b>' + esc((pl[id] || { name: '—' }).name) + '</b> <span class="badge">' + cnt[id] + '</span></div>').join('') || '<div class="empty">' + t('noitems') + '</div>') + '</div>';
  }

  // ---------- владельцы ----------
  const gen = n => { const a = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789', u = new Uint32Array(n); crypto.getRandomValues(u); return Array.from(u, x => a[x % a.length]).join(''); };
  function drawOwn() {
    const o = owners(), pc = id => S.places.filter(p => p.owner_id === id).length;
    $('#main').innerHTML = '<h2 class="sec">' + t('n_own') + '</h2><div class="panel"><h3 style="margin-top:0">' + t('newown') + '</h3><form id="of"><div class="g2"><label class="f">' + t('o_login') + '<input id="ol" required pattern="[a-zA-Z0-9._-]{3,40}" autocapitalize="none"></label><label class="f">' + t('pass') + '<div class="sw"><input id="op" required minlength="6" value="' + gen(10) + '"><button type="button" class="lens sm" id="og"><i class=i-refresh></i></button></div></label></div><div class="g2"><label class="f">' + t('name') + '<input id="on" maxlength="80"></label><label class="f">' + t('phone') + '<input id="oph" type="tel"></label></div><button class="lens pri" type="submit">' + t('create') + '</button><div class="ferr" id="oe"></div></form><div id="ocred"></div></div>' +
      '<div class="panel tw"><table class="t"><thead><tr><th>' + t('name') + '</th><th>Login</th><th>' + t('n_pl') + '</th><th></th></tr></thead><tbody>' + (o.map(p => '<tr><td>' + esc(p.full_name || '—') + '<div class="m">' + esc(p.phone || '') + '</div></td><td><code>' + esc(p.login || '') + '</code></td><td>' + pc(p.id) + '</td><td style="white-space:nowrap"><button class="lens sm" data-pw="' + p.id + '">' + t('chpw') + '</button> <button class="lens sm bad" data-du="' + p.id + '">' + t('del') + '</button></td></tr>').join('') || '<tr><td colspan="4" class="empty">' + t('noitems') + '</td></tr>') + '</tbody></table></div>';
    $('#og').onclick = () => $('#op').value = gen(10);
    $('#of').onsubmit = async ev => {
      ev.preventDefault(); const login = $('#ol').value.trim().toLowerCase(), pw = $('#op').value; $('#oe').textContent = '';
      try { await OSH.api('/api/admin/owners', 'POST', { login, password: pw, name: $('#on').value, phone: $('#oph').value }); await load(); drawOwn(); credBox(login, pw); }
      catch (e) { $('#oe').textContent = e.message; }
    };
  }
  function credBox(login, pw) {
    const txt = 'OshRest Бизнес\n' + location.origin + '/owner/\nЛогин: ' + login + '\nПароль: ' + pw;
    const b = $('#ocred') || $('#main'); b.insertAdjacentHTML('afterbegin', '<div class="panel" style="border-color:var(--ok);margin-top:.8rem"><b>' + t('created') + '</b><pre style="white-space:pre-wrap;user-select:all;margin:.5rem 0">' + esc(txt) + '</pre><button class="lens sm" data-copy="' + esc(txt).replace(/\n/g, '&#10;') + '">' + t('copy') + '</button> <a class="lens sm ok" target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent(txt) + '">WhatsApp</a></div>');
  }
  function pwSheet(uid, login, after) {
    const s = OSH.sheet('<div class="sp"><h2 style="margin-top:2.4rem">' + t('chpw') + '</h2><p class="m">' + esc(login) + '</p><label class="f">' + t('newpw') + '<div class="sw"><input id="np" minlength="6" value="' + gen(10) + '"><button class="lens sm" id="ng"><i class=i-refresh></i></button></div></label><div class="ferr" id="ne"></div><button class="lens pri block" id="ns">' + t('save') + '</button></div>');
    $('#ng', s).onclick = () => $('#np', s).value = gen(10);
    $('#ns', s).onclick = async () => { const pw = $('#np', s).value; try { await OSH.api('/api/admin/users/' + uid + '/password', 'POST', { password: pw }); OSH.closeSheet(); OSH.toast({ type: 'ok', text: t('pwdone') }); if (after) await after(); credBox(login, pw); } catch (e) { $('#ne', s).textContent = e.message; } };
  }

  // ---------- объекты ----------
  function drawPl() {
    const ow = owners(), od = byId(S.profiles);
    $('#main').innerHTML = '<div style="display:flex;align-items:center;gap:.6rem;flex-wrap:wrap"><h2 class="sec" style="margin:.6rem 0">' + t('n_pl') + ' (' + S.places.length + ')</h2><button class="lens gold" id="apl" style="margin-left:auto">' + t('addpl') + '</button></div><p class="m">' + t('seed_note') + '</p><div class="panel tw"><table class="t"><thead><tr><th>' + t('f_name') + '</th><th>' + t('owner_') + '</th><th>' + t('f_active') + '</th><th></th></tr></thead><tbody>' +
      S.places.map(p => '<tr><td>' + OSH.catIcon(p.category) + ' <b>' + esc(p.name) + '</b><div class="m">' + OSH.regName(p.region) + ' · ' + S.rooms.filter(r => r.place_id === p.id).length + ' ' + t('rooms') + (p.price_from ? ' · ' + money(p.price_from) + ' ' + t('som') : '') + '</div></td><td><select data-own="' + p.id + '" style="min-width:140px"><option value="">' + t('none') + '</option>' + ow.map(o => '<option value="' + o.id + '"' + (p.owner_id === o.id ? ' selected' : '') + '>' + esc(o.full_name || o.login) + '</option>').join('') + '</select></td><td><input type="checkbox" data-act2="' + p.id + '"' + (p.active ? ' checked' : '') + ' style="width:22px;min-height:22px"></td><td style="white-space:nowrap"><button class="lens sm" data-ep="' + p.id + '">' + t('edit') + '</button> <button class="lens sm bad" data-dp="' + p.id + '">' + t('del') + '</button></td></tr>').join('') + '</tbody></table></div>';
  }
  const ectx = { get places() { return S.places; }, get rooms() { return S.rooms; }, set rooms(v) { S.rooms = v; }, get owners() { return owners(); }, isAdmin: true, refresh: () => { if (S.v === 'pl') drawPl(); } };
  const placeSheet = p => OSH.editor.place(ectx, p);

  // ---------- заявки ----------
  function drawRq() {
    const pl = byId(S.places), l = S.rf ? S.reqs.filter(r => r.place_id === S.rf) : S.reqs.slice(0, 300);
    $('#main').innerHTML = '<div style="display:flex;gap:.6rem;flex-wrap:wrap;align-items:center"><h2 class="sec" style="margin:.6rem 0">' + t('n_rq') + ' (' + S.reqs.length + ')</h2><select id="rfp" style="max-width:260px;margin-left:auto"><option value="">' + t('n_pl') + ': —</option>' + S.places.map(p => '<option value="' + p.id + '"' + (S.rf === p.id ? ' selected' : '') + '>' + esc(p.name) + '</option>').join('') + '</select><button class="lens sm" id="csvr">' + t('csv') + '</button></div><div class="panel" id="rl"></div>';
    $('#rl').innerHTML = l.map(r => OSH.reqHtml(r, { places: pl, rooms: byId(S.rooms.map(x => x)), mode: 'admin' }).replace(/<div class="acts">[\s\S]*<\/div><\/div>$/, '<div class="acts"><button class="lens sm bad" data-dr="' + r.id + '">' + t('del') + '</button></div></div>')).join('') || '<div class="empty">' + t('noitems') + '</div>';
    $('#rfp').onchange = e => { S.rf = e.target.value; drawRq(); };
    $('#csvr').onclick = () => csv('requests.csv', [['date', 'place', 'kind', 'status', 'tourist', 'phone', 'check_in', 'check_out', 'guests', 'total', 'message']].concat(S.reqs.map(r => [r.created_at, (pl[r.place_id] || {}).name, r.kind, r.status, r.tourist_name, r.tourist_phone, r.d1, r.d2, r.guests, r.total, r.message])));
  }
  function csv(name, rows) { const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"', b = new Blob(['﻿' + rows.map(r => r.map(q).join(',')).join('\n')], { type: 'text/csv' }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }

  // ---------- туристы ----------
  function drawUs() {
    const u = tourists(), rc = id => S.reqs.filter(r => r.tourist_id === id).length;
    $('#main').innerHTML = '<div style="display:flex;gap:.6rem;align-items:center;flex-wrap:wrap"><h2 class="sec" style="margin:.6rem 0">' + t('n_us') + ' (' + u.length + ')</h2><button class="lens sm" id="csvu" style="margin-left:auto">' + t('csv') + '</button></div><div class="panel tw"><table class="t"><thead><tr><th>' + t('name') + '</th><th>' + t('phone') + '</th><th>' + t('reg_at') + '</th><th>' + t('n_rq') + '</th><th></th></tr></thead><tbody>' +
      (u.map(p => '<tr><td>' + esc(p.full_name || '—') + '<div class="m">' + esc(p.login || '') + '</div></td><td>' + (p.phone ? '<a href="' + OSH.telLink(p.phone) + '">' + esc(p.phone) + '</a>' : '') + '</td><td>' + OSH.fdate(p.created_at.slice(0, 10)) + '</td><td>' + rc(p.id) + '</td><td><button class="lens sm bad" data-du="' + p.id + '">' + t('del') + '</button></td></tr>').join('') || '<tr><td colspan="5" class="empty">' + t('noitems') + '</td></tr>') + '</tbody></table></div>';
    $('#csvu').onclick = () => csv('tourists.csv', [['name', 'login', 'phone', 'registered']].concat(u.map(p => [p.full_name, p.login, p.phone, p.created_at])));
  }

  // ---------- запросы на сброс пароля ----------
  function drawPw() {
    $('#main').innerHTML = '<h2 class="sec">' + t('n_pw') + '</h2><div class="panel">' + (S.pw.map(x => { const o = S.profiles.find(p => (p.login || '').toLowerCase() === x.login.trim().toLowerCase() && p.role !== 'admin'); return '<div class="rq"><div style="display:flex;gap:.5rem;align-items:center;flex-wrap:wrap"><b>' + esc(x.login) + '</b><span class="badge ' + (x.status === 'new' ? 'new' : 'ok') + '">' + (x.status === 'new' ? t('s_new') : t('pw_mark')) + '</span><span class="m" style="margin-left:auto">' + OSH.ftime(x.created_at) + '</span></div>' + (o ? '<div class="m">' + esc(o.full_name || '') + ' · ' + esc(o.phone || '') + '</div>' : '') + (x.note ? '<div>' + esc(x.note) + '</div>' : '') + '<div class="acts">' + (o ? '<button class="lens sm pri" data-pwr="' + x.id + '" data-u="' + o.id + '" data-l="' + esc(o.login) + '">' + t('pw_set') + '</button>' : '') + (x.status === 'new' ? '<button class="lens sm" data-pd="' + x.id + '">' + t('pw_mark') + '</button>' : '') + '</div></div>'; }).join('') || '<div class="empty"><b><i class=i-lock></i></b>' + t('pw_none') + '</div>') + '</div>';
  }

  document.addEventListener('click', async e => {
    const T = e.target; let b;
    if ((b = T.closest('nav.tabs [data-v]'))) return go(b.dataset.v);
    if ((b = T.closest('[data-copy]'))) { try { await navigator.clipboard.writeText(b.dataset.copy); OSH.toast({ type: 'ok', text: t('copied'), ms: 1800 }); } catch (er) {} return; }
    if ((b = T.closest('[data-pw]'))) { const p = S.profiles.find(x => x.id === b.dataset.pw); return pwSheet(p.id, p.login); }
    if ((b = T.closest('[data-pwr]'))) { const id = b.dataset.pwr; return pwSheet(b.dataset.u, b.dataset.l, async () => { await sb().from('password_requests').update({ status: 'done' }).eq('id', id); const r = S.pw.find(x => x.id === id); if (r) r.status = 'done'; head(); drawPw(); }); }
    if ((b = T.closest('[data-pd]'))) { const id = b.dataset.pd; await sb().from('password_requests').update({ status: 'done' }).eq('id', id); const r = S.pw.find(x => x.id === id); if (r) r.status = 'done'; head(); return drawPw(); }
    if ((b = T.closest('[data-du]'))) { const id = b.dataset.du; return OSH.ask(t('conf_del'), async () => { try { await OSH.api('/api/admin/users/' + id, 'DELETE'); await load(); draw(); } catch (er) { OSH.err(er.message); } }); }
    if ((b = T.closest('[data-dp]'))) { const id = b.dataset.dp; return OSH.ask(t('conf_del'), async () => { const { error } = await sb().from('places').delete().eq('id', id); if (error) return OSH.err(error.message); S.places = S.places.filter(x => x.id !== id); drawPl(); }); }
    if ((b = T.closest('[data-dr]'))) { const id = b.dataset.dr; return OSH.ask(t('conf_del'), async () => { const { error } = await sb().from('requests').delete().eq('id', id); if (error) return OSH.err(error.message); S.reqs = S.reqs.filter(x => x.id !== id); drawRq(); }); }
    if ((b = T.closest('[data-ep]'))) return placeSheet(S.places.find(x => x.id === b.dataset.ep));
    if (T.closest('#apl')) return placeSheet(null);
  });
  document.addEventListener('change', async e => {
    const T = e.target;
    if (T.dataset.own !== undefined) { const { data, error } = await sb().from('places').update({ owner_id: T.value || null }).eq('id', T.dataset.own).select().single(); if (error) return OSH.err(error.message); S.places[S.places.findIndex(x => x.id === data.id)] = data; OSH.toast({ type: 'ok', text: t('saved'), ms: 1500 }); }
    if (T.dataset.act2) { const { data, error } = await sb().from('places').update({ active: T.checked }).eq('id', T.dataset.act2).select().single(); if (error) return OSH.err(error.message); S.places[S.places.findIndex(x => x.id === data.id)] = data; }
  });
})();
