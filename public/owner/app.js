/* Сайт владельцев объектов: заявки в реальном времени, объекты, номера, фото */
(function () {
  'use strict';
  const { $, $$, t, esc, money } = OSH;
  OSH.addT({
    ow_title: ['Администратор кириши', 'Вход для администраторов объектов', 'Venue administrator sign in'], ow_sub: ['Логин жана сырсөздү башкы администратор берет', 'Логин и пароль выдаёт главный администратор', 'Login and password are issued by the main administrator'],
    ow_login: ['Логин', 'Логин', 'Login'], ow_foot: ['Бул жерде катталуу жок', 'Регистрации здесь нет', 'No self-registration here'],
    n_req: ['Заявкалар', 'Заявки', 'Requests'], n_obj: ['Жайлар', 'Объекты', 'Places'], n_me: ['Профиль', 'Профиль', 'Profile'],
    k_new: ['Жаңы', 'Новые', 'New'], k_conf: ['Тастыкталган', 'Подтверждено', 'Confirmed'], k_rev: ['Киреше, сом', 'Доход, сом', 'Revenue, KGS'], k_all: ['Бардыгы', 'Всего', 'Total'],
    f_all: ['Баары', 'Все', 'All'], f_new: ['Жаңы', 'Новые', 'New'], norq: ['Заявкалар жок', 'Заявок нет', 'No requests'], newreq_t: ['Жаңы заявка!', 'Новая заявка!', 'New request!'],
    banner: ['Жаңы заявка: {n}. Көрүү үчүн басыңыз', 'Новых заявок: {n}. Нажмите, чтобы посмотреть', 'New requests: {n}. Tap to view'],
    nopl: ['Азырынча жай жок. Башкы администратор сизге жай ыйгарат же өзүңүз кошуңуз.', 'Объектов пока нет. Добавьте свой объект.', 'No places yet. Add your venue.'], addpl: ['Жай кошуу', 'Добавить объект', 'Add place'],
    pl_edit: ['Жайды түзөтүү', 'Редактирование объекта', 'Edit place'], f_cat: ['Категория', 'Категория', 'Category'], f_reg: ['Район', 'Район', 'District'], f_name: ['Аталышы', 'Название', 'Name'], f_desc: ['Сүрөттөмө', 'Описание', 'Description'],
    f_price: ['Баасы төмөндөн (сом)', 'Цена от (сом)', 'Price from (KGS)'], f_hours: ['Иш убактысы', 'Часы работы', 'Opening hours'], f_wa: ['WhatsApp номери', 'WhatsApp', 'WhatsApp'], f_lat: ['Кеңдик (lat)', 'Широта (lat)', 'Latitude'], f_lng: ['Узундук (lng)', 'Долгота (lng)', 'Longitude'],
    f_active: ['Сайтта көрсөтүү', 'Показывать на сайте', 'Visible on the site'], f_sv: ['Кошумча кызматтар', 'Дополнительные услуги', 'Services'], f_ph: ['Сүрөттөр', 'Фотографии', 'Photos'], addph: ['Сүрөт кошуу', 'Добавить фото', 'Add photos'],
    rooms: ['Бөлмөлөр', 'Номера', 'Rooms'], addrm: ['Бөлмө кошуу', 'Добавить номер', 'Add room'], rm_edit: ['Бөлмө', 'Номер', 'Room'], r_area: ['Аянты, м²', 'Площадь, м²', 'Area, m²'], r_cap: ['Сыйымдуулук', 'Вместимость', 'Capacity'], r_beds: ['Керебеттер', 'Кроватей', 'Beds'], r_bt: ['Керебет түрү', 'Тип кроватей', 'Bed type'],
    r_price: ['Баасы (сом/түн)', 'Цена (сом/ночь)', 'Price (KGS/night)'], r_am: ['Бөлмөдөгү шарттар', 'Условия в номере', 'Amenities'], r_av: ['Бош (брондоого ачык)', 'Свободен (доступен для брони)', 'Available for booking'],
    saved: ['Сакталды', 'Сохранено', 'Saved'], conf_del: ['Чын эле өчүрөсүзбү?', 'Точно удалить?', 'Really delete?'], rp_t: ['Жооп жазуу', 'Ответ туристу', 'Reply to tourist'], rp_ph: ['Жообуңуз…', 'Ваш ответ…', 'Your reply…'],
    me_t: ['Профиль', 'Профиль', 'Profile'], uploading: ['Жүктөлүүдө…', 'Загрузка…', 'Uploading…'], stat_: ['Статус', 'Статус', 'Status'], noacc: ['Жай жок', 'Нет объектов', 'No places'], mark: ['Баарын окулду деп белгилөө', 'Отметить всё прочитанным', 'Mark all as read']
  });
  const S = { v: 'req', f: 'all', places: [], rooms: [], reqs: [], fresh: new Set(), newCount: 0 };
  const byId = a => a.reduce((m, x) => (m[x.id] = x, m), {});
  const sb = () => OSH.sb;

  OSH.start({
    site: 'owner', role: ['owner', 'admin'], sw: '/owner/sw.js', scope: '/owner/',
    auth: { site: 'owner', icon: '🏨', badge: 'Бизнес', title: t('ow_title'), sub: t('ow_sub'), register: false, forgot: true, loginLabel: t('ow_login'), loginPh: 'hotel-osh', foot: t('ow_foot') },
    start: boot
  });

  async function load() {
    const me = OSH.me;
    let pq = sb().from('places').select('*').order('created_at'); if (me.role === 'owner') pq = pq.eq('owner_id', me.id);
    const pl = await pq; S.places = pl.data || [];
    const ids = S.places.map(p => p.id);
    if (ids.length) {
      const [rm, rq] = await Promise.all([sb().from('rooms').select('*').in('place_id', ids).order('price'), sb().from('requests').select('*').in('place_id', ids).order('created_at', { ascending: false }).limit(300)]);
      S.rooms = rm.data || []; S.reqs = rq.data || [];
    } else { S.rooms = []; S.reqs = []; }
  }
  async function boot() {
    $('#app').innerHTML = '<div class="aurora"><i></i><i></i><i></i></div><div class="auth"><span class="spin"></span></div>';
    await load();
    S.newCount = S.reqs.filter(r => !r.seen_by_owner && r.status === 'new').length;
    OSH.watch('requests', null, p => {
      const r = p.new; if (!r || !r.id || !S.places.some(x => x.id === r.place_id)) return;
      const i = S.reqs.findIndex(x => x.id === r.id);
      if (p.eventType === 'INSERT' && i < 0) {
        S.reqs.unshift(r); S.fresh.add(r.id); S.newCount++;
        const pl = S.places.find(x => x.id === r.place_id);
        OSH.toast({ type: 'new', icon: r.kind === 'booking' ? '🛎️' : '💬', title: t('newreq_t'), text: (r.tourist_name || '') + ' — ' + (pl ? pl.name : '') + (r.kind === 'booking' ? ' · ' + money(r.total) + ' ' + t('som') : ''), onclick: () => go('req'), ms: 10000, vibrate: true });
        beep(); tt();
      } else if (i > -1) S.reqs[i] = r;
      if (S.v === 'req') drawReqList(); head();
    });
    // резерв: опрос раз в 45 сек, если realtime недоступен
    setInterval(async () => { if (document.hidden) return; const old = new Set(S.reqs.map(r => r.id)); await load(); S.reqs.forEach(r => { if (!old.has(r.id)) { S.fresh.add(r.id); S.newCount++; OSH.toast({ type: 'new', icon: '🛎️', title: t('newreq_t'), text: r.tourist_name || '' }); beep(); } }); tt(); if (S.v === 'req') drawReqList(); head(); }, 45000);
    OSH.rerender = render; render();
  }
  function tt() { document.title = (S.newCount ? '(' + S.newCount + ') ' : '') + 'OshRest Бизнес'; }
  let ac; function beep() { try { ac = ac || new (window.AudioContext || window.webkitAudioContext)(); const o = ac.createOscillator(), g = ac.createGain(); o.connect(g); g.connect(ac.destination); o.type = 'sine'; o.frequency.setValueAtTime(880, ac.currentTime); o.frequency.setValueAtTime(1320, ac.currentTime + .12); g.gain.setValueAtTime(.12, ac.currentTime); g.gain.exponentialRampToValueAtTime(.001, ac.currentTime + .4); o.start(); o.stop(ac.currentTime + .4); } catch (e) {} }

  function render() {
    document.body.classList.add('hasnav');
    const tabs = [['req', '🧾', 'n_req'], ['obj', '🏨', 'n_obj'], ['me', '👤', 'n_me']];
    $('#app').innerHTML = '<div class="aurora"><i></i><i></i><i></i></div>' + OSH.header('OshRest', 'Бизнес') + '<div id="bn"></div><main class="wrap view" id="main"></main>' +
      '<nav class="tabs">' + tabs.map(a => '<button data-v="' + a[0] + '" class="' + (S.v === a[0] ? 'on' : '') + '"><span>' + a[1] + '</span>' + t(a[2]) + '</button>').join('') + '</nav>';
    head(); draw();
  }
  function head() {
    const b = $('#bn'); if (b) b.innerHTML = S.newCount ? '<div class="banner" id="bnc">🔔 ' + t('banner', { n: S.newCount }) + '</div>' : '';
    const n = $('nav.tabs [data-v=req]'); if (n) { const d = $('.dot', n); if (d) d.remove(); if (S.newCount) n.insertAdjacentHTML('beforeend', '<i class="dot">' + S.newCount + '</i>'); }
  }
  function go(v) { S.v = v; $$('nav.tabs button').forEach(b => b.classList.toggle('on', b.dataset.v === v)); draw(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function draw() {
    const m = $('#main'); m.classList.remove('view'); void m.offsetWidth; m.classList.add('view');
    if (S.v === 'req') {
      const nw = S.reqs.filter(r => r.status === 'new').length, cf = S.reqs.filter(r => r.status === 'confirmed'), rev = cf.reduce((s, r) => s + (r.total || 0), 0);
      m.innerHTML = '<div class="kg"><div class="kpi"><small>' + t('k_new') + '</small><b>' + nw + '</b></div><div class="kpi"><small>' + t('k_conf') + '</small><b>' + cf.length + '</b></div><div class="kpi"><small>' + t('k_rev') + '</small><b>' + money(rev) + '</b></div><div class="kpi"><small>' + t('k_all') + '</small><b>' + S.reqs.length + '</b></div></div>' +
        '<div class="chips" style="margin-top:.8rem">' + [['all', 'f_all'], ['new', 'f_new'], ['booking', 'booking'], ['inquiry', 'inquiry']].map(a => '<button class="lens chip sm' + (S.f === a[0] ? ' on' : '') + '" data-flt="' + a[0] + '">' + t(a[1]) + '</button>').join('') + '<button class="lens chip sm" id="mk">✓ ' + t('mark') + '</button></div><div class="panel" id="rl"></div>';
      drawReqList();
    } else if (S.v === 'obj') drawObj(); else drawMe();
  }
  function drawReqList() {
    const box = $('#rl'); if (!box) return;
    let l = S.reqs; if (S.f === 'new') l = l.filter(r => r.status === 'new'); else if (S.f === 'booking' || S.f === 'inquiry') l = l.filter(r => r.kind === S.f);
    box.innerHTML = l.map(r => OSH.reqHtml(r, { places: byId(S.places), rooms: byId(S.rooms), mode: 'owner', fresh: S.fresh })).join('') || '<div class="empty"><b>🧾</b>' + t('norq') + '</div>';
  }
  async function setReq(id, patch) {
    const { data, error } = await sb().from('requests').update(patch).eq('id', id).select().single(); if (error) return OSH.err(error.message);
    const i = S.reqs.findIndex(x => x.id === id); if (i > -1) S.reqs[i] = data; drawReqList(); return data;
  }
  async function markSeen() {
    const ids = S.reqs.filter(r => !r.seen_by_owner).map(r => r.id); S.fresh.clear(); S.newCount = 0; head(); tt(); drawReqList();
    if (ids.length) { await sb().from('requests').update({ seen_by_owner: true }).in('id', ids); S.reqs.forEach(r => r.seen_by_owner = true); }
  }

  // ---------- объекты ----------
  function drawObj() {
    const m = $('#main');
    m.innerHTML = '<div style="display:flex;align-items:center;gap:.6rem;flex-wrap:wrap"><h2 class="sec" style="margin:.6rem 0">' + t('n_obj') + '</h2><button class="lens gold" id="addpl" style="margin-left:auto">＋ ' + t('addpl') + '</button></div>' +
      '<div class="cards">' + (S.places.map(p => { const n = S.rooms.filter(r => r.place_id === p.id).length; return '<article class="card click" data-pl="' + p.id + '"><div class="pw"><div class="ph" style="' + OSH.photoStyle(p, 0) + '">' + ((p.photos || [])[0] ? '' : OSH.catIcon(p.category)) + '</div></div><div class="cb"><h3>' + esc(p.name) + '</h3><div class="m">' + OSH.catName(p.category) + ' · ' + OSH.regName(p.region) + ' · 🛏 ' + n + '</div><div class="pr"><span class="badge ' + (p.active ? 'ok' : 'no') + '">' + (p.active ? '●' : '○') + ' ' + t('f_active') + '</span><b class="pc">' + (p.price_from ? money(p.price_from) + ' ' + t('som') : '') + '</b></div></div></article>'; }).join('') || '<div class="empty"><b>🏨</b>' + t('nopl') + '</div>') + '</div>';
  }
  function placeForm(p) {
    const isNew = !p; p = p || { category: 'hotel', region: 'osh', services: [], photos: [], active: true, price_from: 0 };
    const sv = byKey(p.services || [], 'k');
    const h = '<div class="sp"><h2 style="margin-top:2.4rem">' + (isNew ? t('addpl') : t('pl_edit')) + '</h2><form id="pf">' +
      '<div class="g2"><label class="f">' + t('f_cat') + '<select id="pc">' + Object.keys(CATALOG.cats).map(k => '<option value="' + k + '"' + (p.category === k ? ' selected' : '') + '>' + OSH.catIcon(k) + ' ' + OSH.catName(k) + '</option>').join('') + '</select></label>' +
      '<label class="f">' + t('f_reg') + '<select id="pr">' + Object.keys(CATALOG.regs).map(k => '<option value="' + k + '"' + (p.region === k ? ' selected' : '') + '>' + OSH.regName(k) + '</option>').join('') + '</select></label></div>' +
      '<label class="f">' + t('f_name') + '<input id="pn" required maxlength="120" value="' + esc(p.name || '') + '"></label><label class="f">' + t('f_desc') + '<textarea id="pd" maxlength="1500">' + esc(p.description || '') + '</textarea></label>' +
      '<div class="g2"><label class="f">' + t('phone') + '<input id="pph" type="tel" value="' + esc(p.phone || '+996 ') + '"></label><label class="f">' + t('f_wa') + '<input id="pwa" type="tel" value="' + esc(p.whatsapp || '') + '"></label></div>' +
      '<div class="g3"><label class="f">' + t('f_price') + '<input id="ppr" type="number" min="0" value="' + (p.price_from || 0) + '"></label><label class="f">' + t('f_lat') + '<input id="pla" type="number" step="any" value="' + (p.lat == null ? '' : p.lat) + '"></label><label class="f">' + t('f_lng') + '<input id="plo" type="number" step="any" value="' + (p.lng == null ? '' : p.lng) + '"></label></div>' +
      '<label class="f">' + t('f_hours') + '<input id="phr" maxlength="40" value="' + esc(p.hours || '24/7') + '"></label><button type="button" class="lens sm" id="geo">📍 GPS</button>' +
      '<h3>' + t('f_sv') + '</h3>' + Object.keys(CATALOG.sv).map(k => { const c = CATALOG.sv[k], s = sv[k]; return '<div class="chk"><input type="checkbox" data-s="' + k + '"' + (s ? ' checked' : '') + '><span>' + c.i + ' ' + c.l[OSH.lang()] + '</span><small><input type="number" min="0" data-sp="' + k + '" value="' + (s ? s.p : c.p) + '" style="width:90px;min-height:34px;padding:.2rem .4rem"> ' + t('som') + (c.per === 'p' ? '/👤' : '') + '</small></div>'; }).join('') +
      '<h3>' + t('f_ph') + '</h3><div id="phs" class="g3"></div><label class="lens block" style="margin-top:.5rem">📷 ' + t('addph') + '<input type="file" id="pfile" accept="image/*" multiple hidden></label>' +
      '<label class="chk"><input type="checkbox" id="pa"' + (p.active ? ' checked' : '') + '> ' + t('f_active') + '</label>' +
      '<div class="g2" style="margin-top:.8rem"><button class="lens pri" type="submit">' + t('save') + '</button>' + (isNew ? '<button type="button" class="lens" data-act="closesheet">' + t('cancel') + '</button>' : '<button type="button" class="lens bad" id="pdel">' + t('del') + '</button>') + '</div></form>' +
      (isNew ? '' : '<h2 class="sec" style="margin-top:1.6rem">' + t('rooms') + '</h2><div id="rl2"></div><button class="lens gold block" id="addrm">＋ ' + t('addrm') + '</button>') + '</div>';
    const s = OSH.sheet(h, true); let photos = (p.photos || []).slice();
    const drawPh = () => { $('#phs', s).innerHTML = photos.map((u, i) => '<div style="position:relative"><div class="ph" style="aspect-ratio:4/3;border-radius:12px;background-image:url(' + esc(u) + ');background-size:cover;background-position:center"></div><button type="button" class="lens sm ic bad" data-rmph="' + i + '" style="position:absolute;top:4px;right:4px">×</button></div>').join(''); };
    drawPh();
    s.onclick = e => { const b = e.target.closest('[data-rmph]'); if (b) { photos.splice(+b.dataset.rmph, 1); drawPh(); } };
    $('#pfile', s).onchange = async e => { const fs = [].slice.call(e.target.files); for (const f of fs) { try { OSH.toast({ icon: '⏳', text: t('uploading'), ms: 1500 }); photos.push(await OSH.upload(f, OSH.me.id)); drawPh(); } catch (er) { OSH.err(er.message); } } e.target.value = ''; };
    $('#geo', s).onclick = () => navigator.geolocation && navigator.geolocation.getCurrentPosition(g => { $('#pla', s).value = g.coords.latitude.toFixed(5); $('#plo', s).value = g.coords.longitude.toFixed(5); }, () => OSH.err('GPS'));
    $('#pf', s).onsubmit = async ev => {
      ev.preventDefault();
      const rec = { category: $('#pc', s).value, region: $('#pr', s).value, name: $('#pn', s).value.trim(), description: $('#pd', s).value.trim(), phone: $('#pph', s).value.trim(), whatsapp: $('#pwa', s).value.replace(/\D/g, '') || $('#pph', s).value.replace(/\D/g, ''), price_from: +$('#ppr', s).value || 0, lat: $('#pla', s).value === '' ? null : +$('#pla', s).value, lng: $('#plo', s).value === '' ? null : +$('#plo', s).value, hours: $('#phr', s).value.trim(), active: $('#pa', s).checked, photos,
        services: $$('[data-s]:checked', s).map(c => ({ k: c.dataset.s, p: +$('[data-sp=' + c.dataset.s + ']', s).value || 0, per: CATALOG.sv[c.dataset.s].per })) };
      if (isNew) rec.owner_id = OSH.me.id;
      const q = isNew ? sb().from('places').insert(rec).select().single() : sb().from('places').update(rec).eq('id', p.id).select().single();
      const { data, error } = await q; if (error) return OSH.err(error.message);
      OSH.toast({ type: 'ok', icon: '✅', text: t('saved') });
      if (isNew) { S.places.push(data); drawObj(); placeForm(data); } else { S.places[S.places.findIndex(x => x.id === p.id)] = data; drawObj(); }
    };
    if (!isNew) {
      $('#pdel', s).onclick = () => OSH.ask(t('conf_del'), async () => { const { error } = await sb().from('places').delete().eq('id', p.id); if (error) return OSH.err(error.message); S.places = S.places.filter(x => x.id !== p.id); S.rooms = S.rooms.filter(x => x.place_id !== p.id); drawObj(); });
      const rl = () => { $('#rl2', s).innerHTML = S.rooms.filter(r => r.place_id === p.id).map(r => '<div class="panel" style="display:flex;gap:.6rem;align-items:center;flex-wrap:wrap"><div style="flex:1"><b>' + esc(r.name) + '</b><div class="m">👥 ' + r.capacity + ' · ' + money(r.price) + ' ' + t('som') + ' · ' + (r.available ? '✔ ' + t('free') : '✖ ' + t('busy')) + '</div></div><button class="lens sm" data-er="' + r.id + '">' + t('edit') + '</button></div>').join(''); };
      rl(); $('#rl2', s).onclick = e => { const b = e.target.closest('[data-er]'); if (b) roomForm(p, S.rooms.find(x => x.id === b.dataset.er)); };
      $('#addrm', s).onclick = () => roomForm(p, null);
    }
  }
  const byKey = (a, k) => a.reduce((m, x) => (m[x[k]] = x, m), {});
  function roomForm(p, r) {
    const isNew = !r; r = r || { capacity: 2, beds: 1, price: p.price_from || 1000, amenities: [], photos: [], available: true };
    const h = '<div class="sp"><h2 style="margin-top:2.4rem">' + t('rm_edit') + ' · ' + esc(p.name) + '</h2><form id="rf"><label class="f">' + t('f_name') + '<input id="rn" required maxlength="100" value="' + esc(r.name || '') + '"></label>' +
      '<div class="g3"><label class="f">' + t('r_area') + '<input id="ra" type="number" min="0" value="' + (r.area || '') + '"></label><label class="f">' + t('r_cap') + '<input id="rc" type="number" min="1" required value="' + r.capacity + '"></label><label class="f">' + t('r_beds') + '<input id="rb" type="number" min="1" value="' + r.beds + '"></label></div>' +
      '<div class="g2"><label class="f">' + t('r_bt') + '<input id="rt" maxlength="40" value="' + esc(r.bed_type || '') + '"></label><label class="f">' + t('r_price') + '<input id="rp" type="number" min="0" required value="' + r.price + '"></label></div>' +
      '<h3>' + t('r_am') + '</h3><div style="display:flex;flex-wrap:wrap;gap:.35rem">' + Object.keys(CATALOG.am).map(k => '<label class="chk" style="margin:0"><input type="checkbox" data-a="' + k + '"' + ((r.amenities || []).indexOf(k) > -1 ? ' checked' : '') + '>' + esc(OSH.amName(k)) + '</label>').join('') + '</div>' +
      '<h3>' + t('f_ph') + '</h3><div id="rph" class="g3"></div><label class="lens block" style="margin-top:.5rem">📷 ' + t('addph') + '<input type="file" id="rfile" accept="image/*" multiple hidden></label>' +
      '<label class="chk"><input type="checkbox" id="rav"' + (r.available ? ' checked' : '') + '> ' + t('r_av') + '</label>' +
      '<div class="g2" style="margin-top:.8rem"><button class="lens pri" type="submit">' + t('save') + '</button>' + (isNew ? '<button type="button" class="lens" id="rback">' + t('cancel') + '</button>' : '<button type="button" class="lens bad" id="rdel">' + t('del') + '</button>') + '</div></form></div>';
    const s = OSH.sheet(h, true); let photos = (r.photos || []).slice();
    const drawPh = () => { $('#rph', s).innerHTML = photos.map((u, i) => '<div style="position:relative"><div class="ph" style="aspect-ratio:4/3;border-radius:12px;background-image:url(' + esc(u) + ');background-size:cover;background-position:center"></div><button type="button" class="lens sm ic bad" data-rmph="' + i + '" style="position:absolute;top:4px;right:4px">×</button></div>').join(''); }; drawPh();
    s.onclick = e => { const b = e.target.closest('[data-rmph]'); if (b) { photos.splice(+b.dataset.rmph, 1); drawPh(); } };
    $('#rfile', s).onchange = async e => { for (const f of [].slice.call(e.target.files)) { try { photos.push(await OSH.upload(f, OSH.me.id)); drawPh(); } catch (er) { OSH.err(er.message); } } e.target.value = ''; };
    const back = () => placeForm(S.places.find(x => x.id === p.id));
    const minPrice = async () => { const rs = S.rooms.filter(x => x.place_id === p.id); if (rs.length) { const m = Math.min.apply(null, rs.map(x => x.price)); const { data } = await sb().from('places').update({ price_from: m }).eq('id', p.id).select().single(); if (data) S.places[S.places.findIndex(x => x.id === p.id)] = data; } };
    if (isNew) $('#rback', s).onclick = back; else $('#rdel', s).onclick = () => OSH.ask(t('conf_del'), async () => { const { error } = await sb().from('rooms').delete().eq('id', r.id); if (error) return OSH.err(error.message); S.rooms = S.rooms.filter(x => x.id !== r.id); await minPrice(); back(); drawObj(); });
    $('#rf', s).onsubmit = async ev => {
      ev.preventDefault();
      const rec = { place_id: p.id, name: $('#rn', s).value.trim(), area: +$('#ra', s).value || null, capacity: +$('#rc', s).value || 1, beds: +$('#rb', s).value || 1, bed_type: $('#rt', s).value.trim(), price: +$('#rp', s).value || 0, amenities: $$('[data-a]:checked', s).map(c => c.dataset.a), photos, available: $('#rav', s).checked };
      const { data, error } = await (isNew ? sb().from('rooms').insert(rec) : sb().from('rooms').update(rec).eq('id', r.id)).select().single(); if (error) return OSH.err(error.message);
      if (isNew) S.rooms.push(data); else S.rooms[S.rooms.findIndex(x => x.id === r.id)] = data;
      await minPrice(); OSH.toast({ type: 'ok', icon: '✅', text: t('saved') }); back(); drawObj();
    };
  }
  function drawMe() {
    const me = OSH.me;
    $('#main').innerHTML = '<h2 class="sec">' + t('me_t') + '</h2><div class="panel" style="max-width:480px"><label class="f">' + t('ow_login') + '<input value="' + esc(me.login || '') + '" disabled></label><label class="f">' + t('name') + '<input id="mn" value="' + esc(me.full_name || '') + '" maxlength="80"></label><label class="f">' + t('phone') + '<input id="mp" type="tel" value="' + esc(me.phone || '') + '"></label><div class="g2"><button class="lens pri" id="ms">' + t('save') + '</button><button class="lens bad" id="mo">' + t('logout') + '</button></div></div>';
    $('#mo').onclick = OSH.logout;
    $('#ms').onclick = async () => { const { error } = await sb().from('profiles').update({ full_name: $('#mn').value.trim(), phone: $('#mp').value.trim() }).eq('id', me.id); if (error) return OSH.err(error.message); OSH.toast({ type: 'ok', icon: '✅', text: t('saved') }); };
  }

  document.addEventListener('click', e => {
    const T = e.target; let b;
    if ((b = T.closest('nav.tabs [data-v]'))) return go(b.dataset.v);
    if (T.closest('#bnc')) { go('req'); S.f = 'new'; draw(); return; }
    if ((b = T.closest('[data-flt]'))) { S.f = b.dataset.flt; $$('[data-flt]').forEach(x => x.classList.toggle('on', x === b)); return drawReqList(); }
    if (T.closest('#mk')) return markSeen();
    if ((b = T.closest('[data-ok]'))) return setReq(b.dataset.ok, { status: 'confirmed', seen_by_owner: true });
    if ((b = T.closest('[data-no]'))) return setReq(b.dataset.no, { status: 'declined', seen_by_owner: true });
    if ((b = T.closest('[data-rp]'))) {
      const id = b.dataset.rp, r = S.reqs.find(x => x.id === id);
      const s = OSH.sheet('<div class="sp"><h2 style="margin-top:2.4rem">' + t('rp_t') + '</h2><p class="m">' + esc(r.tourist_name || '') + ' · ' + esc(r.tourist_phone || '') + (r.message ? '<br>💬 ' + esc(r.message) : '') + '</p><label class="f"><textarea id="rpt" maxlength="500" placeholder="' + t('rp_ph') + '">' + esc(r.reply || '') + '</textarea></label><button class="lens pri block" id="rps">' + t('sent_reply') + '</button></div>');
      $('#rps', s).onclick = async () => { const v = $('#rpt', s).value.trim(); if (!v) return; const patch = { reply: v, seen_by_owner: true }; if (r.kind === 'inquiry') patch.status = 'answered'; await setReq(id, patch); OSH.closeSheet(); OSH.toast({ type: 'ok', icon: '✅', text: t('saved') }); };
      return;
    }
    if (T.closest('#addpl')) return placeForm(null);
    if ((b = T.closest('[data-pl]'))) return placeForm(S.places.find(x => x.id === b.dataset.pl));
  });
})();
