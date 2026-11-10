/* Сайт туристов: поиск, карта, избранное, бронь/вопрос, мои заявки */
(function () {
  'use strict';
  const { $, $$, t, esc, money } = OSH;
  OSH.addT({
    tr_title: ['Саякатчы кирүү', 'Вход для туристов', 'Tourist sign in'], tr_sub: ['Ош облусунун эс алуучу жайларын табыңыз жана брондоңуз', 'Находите и бронируйте места отдыха Ошской области', 'Find and book places to relax in Osh Region'],
    tr_login: ['Телефон же e-mail', 'Телефон или e-mail', 'Phone or e-mail'], tr_foot: ['Бир жолу кириңиз — чыкмайынча кайра сурабайт', 'Войдите один раз — повторно вводить не придётся до выхода', 'Sign in once — no need to repeat until you log out'],
    tag: ['Ош облусунун эс алуучу жайлары', 'Места отдыха Ошской области', 'Places to relax in Osh Region'], tag2: ['Мейманкана, юрта, көл, тоо — бардыгы бир жерде', 'Отели, юрты, озёра и горы — всё в одном месте', 'Hotels, yurts, lakes and mountains — all in one place'],
    ph: ['Жайды издөө…', 'Найти место…', 'Search places…'], n_home: ['Издөө', 'Поиск', 'Search'], n_map: ['Карта', 'Карта', 'Map'], n_fav: ['Тандалма', 'Избранное', 'Saved'], n_req: ['Заявки', 'Заявки', 'Requests'], n_me: ['Профиль', 'Профиль', 'Profile'],
    all: ['Баары', 'Все', 'All'], reg: ['Бардык райондор', 'Все районы', 'All districts'], s1: ['Рейтинг боюнча', 'По рейтингу', 'By rating'], s2: ['Баасы төмөндөн', 'Сначала дешёвые', 'Price: low first'],
    found: ['Табылды', 'Найдено', 'Found'], none: ['Эч нерсе табылган жок', 'Ничего не найдено', 'Nothing found'], nofav: ['Тандалма бош', 'Избранное пусто', 'No saved places'], norq: ['Азырынча заявка жок', 'Заявок пока нет', 'No requests yet'],
    desc: ['Сүрөттөмө', 'Описание', 'Description'], rooms: ['Бөлмөлөр жана баалар', 'Номера и цены', 'Rooms & prices'], inroom: ['Бөлмөдөгү шарттар', 'Условия в номере', 'In-room amenities'], svc: ['Кошумча кызматтар', 'Дополнительные услуги', 'Services'],
    book: ['Брондоо', 'Бронирование', 'Booking'], pick: ['Бөлмөнү тандаңыз', 'Выберите номер', 'Select a room'], d1: ['Келүү', 'Заезд', 'Check-in'], d2: ['Кетүү', 'Выезд', 'Check-out'],
    send: ['Брондоо жөнөтүү', 'Отправить бронь', 'Send booking'], ask: ['Администраторго суроо', 'Вопрос администратору', 'Ask the administrator'], askph: ['Суроо же каалоо…', 'Ваш вопрос или пожелание…', 'Your question or wishes…'], asksend: ['Суроо жөнөтүү', 'Отправить вопрос', 'Send question'],
    e_n: ['Эң аз 1 түн тандаңыз', 'Выберите минимум 1 ночь', 'Choose at least 1 night'], e_g: ['Бул бөлмө эң көп {n} адамга', 'В этом номере максимум {n} гостей', 'This room fits up to {n} guests'], e_b: ['Бул даталарда бөлмө бош эмес', 'На эти даты номер занят', 'Room is taken for these dates'],
    sent: ['Заявка жөнөтүлдү! Администратор көрдү.', 'Заявка отправлена! Администратор увидит её сразу.', 'Request sent! The administrator will see it instantly.'], sentq: ['Суроо жөнөтүлдү', 'Вопрос отправлен', 'Question sent'], needph: ['Телефонуңузду жазыңыз', 'Укажите телефон для связи', 'Enter your phone'],
    gps: ['Багыт', 'Маршрут', 'Directions'], upd: ['Заявкаңыз жаңыртылды', 'Ваша заявка обновлена', 'Your request was updated'], prof: ['Профиль', 'Профиль', 'Profile'], saved: ['Сакталды', 'Сохранено', 'Saved'], open: ['Ачык', 'Работает', 'Open'], mylogin: ['Логин', 'Логин', 'Login'],
    cphotos: ['Сүрөттөр', 'Фото', 'Photos'], interior: ['Ички көрүнүш', 'Интерьер', 'Interior'], outside: ['Сырткы көрүнүшү', 'Снаружи', 'Exterior'], around: ['Айлана-чөйрө', 'Окрестности', 'Surroundings'], bath: ['Санитардык бөлмө', 'Санузел', 'Bathroom'], view: ['Терезеден көрүнүш', 'Вид из окна', 'View'], room: ['Бөлмө', 'Номер', 'Room']
  });
  const S = { v: 'home', q: '', cat: '', reg: '', sort: 'r', places: [], rooms: [], favs: new Set(), reqs: [], unread: 0, cur: null };
  const norm = s => String(s).toLowerCase().replace(/ө/g, 'о').replace(/ү/g, 'у').replace(/ң/g, 'н').replace(/ё/g, 'е');
  const byId = a => a.reduce((m, x) => (m[x.id] = x, m), {});
  const roomsOf = pid => S.rooms.filter(r => r.place_id === pid);

  OSH.start({
    site: 'tourist', role: ['tourist'], sw: '/sw.js', scope: '/',
    auth: { site: 'tourist', icon: '🏔️', badge: '', title: t('tr_title'), sub: t('tr_sub'), register: true, loginLabel: t('tr_login'), loginPh: '+996 555 123456', foot: t('tr_foot') },
    start: boot
  });

  async function boot(me) {
    $('#app').innerHTML = '<div class="aurora"><i></i><i></i><i></i></div><div class="auth"><span class="spin"></span></div>';
    const uid = me.id, sb = OSH.sb;
    const [pl, rm, fv, rq] = await Promise.all([
      sb.from('places').select('*').eq('active', true), sb.from('rooms').select('*').order('price'),
      sb.from('favorites').select('place_id'), sb.from('requests').select('*').eq('tourist_id', uid).order('created_at', { ascending: false })]);
    if (pl.error) { OSH.err(pl.error.message); }
    S.places = pl.data || []; S.rooms = rm.data || []; S.favs = new Set((fv.data || []).map(x => x.place_id)); S.reqs = rq.data || [];
    OSH.watch('requests', 'tourist_id=eq.' + uid, p => {
      const r = p.new; if (!r || !r.id) return;
      const i = S.reqs.findIndex(x => x.id === r.id); if (i > -1) { const old = S.reqs[i]; S.reqs[i] = r; if (old.status !== r.status || old.reply !== r.reply) { S.unread++; OSH.toast({ type: 'new', icon: r.status === 'confirmed' ? '✅' : r.status === 'declined' ? '❌' : '💬', title: t('upd'), text: t('s_' + r.status) + (r.reply ? ' — ' + r.reply : ''), onclick: () => go('req'), vibrate: true }); } } else S.reqs.unshift(r);
      if (S.v === 'req') drawReq(); navBadge();
    });
    OSH.rerender = render; render();
  }

  function render() {
    document.body.classList.add('hasnav');
    const tabs = [['home', '🔍', 'n_home'], ['map', '🗺️', 'n_map'], ['fav', '♥', 'n_fav'], ['req', '🧾', 'n_req'], ['me', '👤', 'n_me']];
    $('#app').innerHTML = '<div class="aurora"><i></i><i></i><i></i></div>' + OSH.header('OshRest', '') +
      '<div id="hero"></div><main class="wrap view" id="main"></main><footer>OshRest · ' + new Date().getFullYear() + '</footer>' +
      '<nav class="tabs">' + tabs.map(a => '<button data-v="' + a[0] + '" class="' + (S.v === a[0] ? 'on' : '') + '"><span>' + a[1] + '</span>' + t(a[2]) + (a[0] === 'req' && S.unread ? '<i class="dot">' + S.unread + '</i>' : '') + '</button>').join('') + '</nav>';
    draw();
  }
  function navBadge() { const b = $('nav.tabs [data-v=req]'); if (!b) return; const d = $('.dot', b); if (d) d.remove(); if (S.unread) b.insertAdjacentHTML('beforeend', '<i class="dot">' + S.unread + '</i>'); }
  function go(v) { S.v = v; if (v === 'req') { S.unread = 0; } $$('nav.tabs button').forEach(b => b.classList.toggle('on', b.dataset.v === v)); navBadge(); draw(); window.scrollTo({ top: 0, behavior: 'smooth' }); }

  function draw() {
    const hero = $('#hero'), main = $('#main'); main.classList.remove('view'); void main.offsetWidth; main.classList.add('view');
    hero.innerHTML = (S.v === 'home' || S.v === 'map') ? '<section class="hero"><h1>' + t('tag') + '</h1><p>' + t('tag2') + '</p><div class="search"><input id="q" type="search" autocomplete="off" placeholder="' + t('ph') + '" value="' + esc(S.q) + '"></div></section>' : '';
    const q = $('#q'); if (q) q.oninput = OSH.debounce(e => { S.q = e.target.value; drawList(); }, 200);
    if (S.v === 'home' || S.v === 'map') { main.innerHTML = filtersHtml() + '<div id="list"></div>'; bindFilters(); drawList(); }
    else if (S.v === 'fav') { const l = S.places.filter(p => S.favs.has(p.id)); main.innerHTML = '<h2 class="sec">♥ ' + t('n_fav') + '</h2><div class="cards">' + (l.map(cardHtml).join('') || '<div class="empty"><b>♡</b>' + t('nofav') + '</div>') + '</div>'; }
    else if (S.v === 'req') { main.innerHTML = '<h2 class="sec">' + t('n_req') + '</h2><div class="panel" id="rl"></div>'; drawReq(); }
    else if (S.v === 'me') drawMe();
  }
  function filtersHtml() {
    return '<div class="chips"><button class="lens chip' + (S.cat ? '' : ' on') + '" data-c="">' + t('all') + '</button>' + Object.keys(CATALOG.cats).map(k => '<button class="lens chip' + (S.cat === k ? ' on' : '') + '" data-c="' + k + '">' + OSH.catIcon(k) + ' ' + OSH.catName(k) + '</button>').join('') + '</div>' +
      '<div class="g2" style="margin:.4rem 0"><select id="sr"><option value="">' + t('reg') + '</option>' + Object.keys(CATALOG.regs).map(k => '<option value="' + k + '"' + (S.reg === k ? ' selected' : '') + '>' + OSH.regName(k) + '</option>').join('') + '</select><select id="ss"><option value="r">' + t('s1') + '</option><option value="p"' + (S.sort === 'p' ? ' selected' : '') + '>' + t('s2') + '</option></select></div>';
  }
  function bindFilters() {
    $$('[data-c]').forEach(b => b.onclick = () => { S.cat = b.dataset.c; $$('[data-c]').forEach(x => x.classList.toggle('on', x === b)); drawList(); });
    $('#sr').onchange = e => { S.reg = e.target.value; drawList(); }; $('#ss').onchange = e => { S.sort = e.target.value; drawList(); };
  }
  function filtered() {
    const q = norm(S.q).split(/\s+/).filter(Boolean);
    return S.places.filter(p => { const s = norm(p.name + ' ' + (p.description || '') + ' ' + OSH.catName(p.category) + ' ' + OSH.regName(p.region)); return q.every(w => s.indexOf(w) > -1) && (!S.cat || p.category === S.cat) && (!S.reg || p.region === S.reg); })
      .sort((a, b) => S.sort === 'p' ? a.price_from - b.price_from : b.rating - a.rating);
  }
  function cardHtml(p) {
    const f = S.favs.has(p.id), n = roomsOf(p.id).length;
    return '<article class="card click" data-id="' + p.id + '"><div class="pw"><div class="ph" style="' + OSH.photoStyle(p, 0) + '">' + (p.photos && p.photos[0] ? '' : OSH.catIcon(p.category)) + '</div></div><button class="lens sm ic fav' + (f ? ' on' : '') + '" data-f="' + p.id + '" aria-label="favorite">♥</button>' +
      '<div class="cb"><h3>' + esc(p.name) + '</h3><div class="m">' + OSH.catName(p.category) + ' · ' + OSH.regName(p.region) + (n ? ' · 🛏 ' + n : '') + '</div><div class="pr"><span class="st">' + OSH.stars(p.rating) + ' <span class="m">' + (+p.rating).toFixed(1) + '</span></span><b class="pc">' + (p.price_from ? t('from') + ' ' + money(p.price_from) + ' ' + t('night') : '') + '</b></div></div></article>';
  }
  function drawList() {
    const r = filtered(), box = $('#list'); if (!box) return;
    if (S.v === 'map') { box.innerHTML = '<p class="m">' + t('found') + ': ' + r.length + '</p><div id="map"></div>'; drawMap(r); return; }
    box.innerHTML = '<p class="m">' + t('found') + ': ' + r.length + '</p><div class="cards">' + (r.map(cardHtml).join('') || '<div class="empty"><b>🔎</b>' + t('none') + '</div>') + '</div>';
  }
  async function drawMap(list) {
    if (!window.L) await new Promise(ok => { const c = document.createElement('link'); c.rel = 'stylesheet'; c.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'; document.head.appendChild(c); const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'; s.onload = ok; s.onerror = ok; document.head.appendChild(s); });
    const el = $('#map'); if (!el) return; if (!window.L) { el.innerHTML = '<div class="empty">🗺️ OpenStreetMap</div>'; return; }
    const m = L.map(el, { zoomControl: true }).setView([40.4, 72.9], 8);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© OpenStreetMap' }).addTo(m);
    const pts = [];
    list.filter(p => p.lat && p.lng).forEach(p => {
      const ic = L.divIcon({ className: '', html: '<div style="width:36px;height:36px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:' + OSH.grad(p.id, 0) + ';border:2px solid #fff;box-shadow:0 3px 8px rgba(0,0,0,.4);display:grid;place-items:center"><span style="transform:rotate(45deg);font-size:16px">' + OSH.catIcon(p.category) + '</span></div>', iconSize: [36, 36], iconAnchor: [18, 36] });
      const mk = L.marker([p.lat, p.lng], { icon: ic }).addTo(m); pts.push([p.lat, p.lng]);
      mk.bindPopup('<b>' + esc(p.name) + '</b><br>' + (p.price_from ? t('from') + ' ' + money(p.price_from) + ' ' + t('som') : '') + '<br><a href="#" data-pop="' + p.id + '">→</a>');
    });
    if (pts.length > 1) m.fitBounds(pts, { padding: [30, 30] }); else if (pts.length) m.setView(pts[0], 11);
    m.on('popupopen', e => { const a = e.popup.getElement().querySelector('[data-pop]'); if (a) a.onclick = ev => { ev.preventDefault(); openPlace(a.dataset.pop); }; });
    setTimeout(() => m.invalidateSize(), 200);
  }

  function drawReq() {
    const box = $('#rl'); if (!box) return;
    const ctx = { places: byId(S.places), rooms: byId(S.rooms), mode: 'tourist' };
    box.innerHTML = S.reqs.map(r => OSH.reqHtml(r, ctx)).join('') || '<div class="empty"><b>🧾</b>' + t('norq') + '</div>';
  }
  function drawMe() {
    const me = OSH.me;
    $('#main').innerHTML = '<h2 class="sec">' + t('prof') + '</h2><div class="panel" style="max-width:480px"><label class="f">' + t('name') + '<input id="pn" value="' + esc(me.full_name || '') + '" maxlength="80"></label><label class="f">' + t('phone') + '<input id="pp" type="tel" value="' + esc(me.phone || '') + '" maxlength="30"></label><label class="f">' + t('mylogin') + '<input value="' + esc(me.login || '') + '" disabled></label><div class="g2"><button class="lens pri" id="ps">' + t('save') + '</button><button class="lens bad" id="po">' + t('logout') + '</button></div></div>';
    $('#po').onclick = OSH.logout;
    $('#ps').onclick = async () => { const { error } = await OSH.sb.from('profiles').update({ full_name: $('#pn').value.trim(), phone: $('#pp').value.trim() }).eq('id', me.id); if (error) return OSH.err(error.message); me.full_name = $('#pn').value.trim(); me.phone = $('#pp').value.trim(); OSH.toast({ type: 'ok', icon: '✅', text: t('saved') }); };
  }

  // ---------- карточка места ----------
  function openPlace(id) {
    const p = S.places.find(x => x.id === id); if (!p) return; S.cur = p; const rs = roomsOf(id), f = S.favs.has(id);
    const nph = (p.photos || []).length ? p.photos.length : 4, emo = ['🏠', '🏞', '🍽', '🛋'];
    let h = '<div class="gal" id="gal">' + Array.from({ length: nph }, (_, i) => '<div class="ph" data-gi="' + i + '" style="' + OSH.photoStyle(p, i) + '">' + ((p.photos || []).length ? '' : emo[i]) + '</div>').join('') + '</div><div class="sp"><h1 style="margin:.2em 0">' + esc(p.name) + '</h1><div class="m">' + OSH.catName(p.category) + ' · ' + OSH.regName(p.region) + '</div>' +
      '<p><span class="st">' + OSH.stars(p.rating) + '</span> ' + (+p.rating).toFixed(1) + (p.hours ? ' · 🕒 ' + esc(p.hours) : '') + '</p>' + (p.price_from ? '<b class="pc">' + t('from') + ' ' + money(p.price_from) + ' ' + t('night') + '</b>' : '') +
      '<p style="display:flex;gap:.5rem;flex-wrap:wrap">' + (p.phone ? '<a class="lens" href="' + OSH.telLink(p.phone) + '">📞 ' + t('call') + '</a><a class="lens ok" target="_blank" rel="noopener" href="' + OSH.waLink(p.whatsapp || p.phone) + '">WhatsApp</a>' : '') +
      (p.lat ? '<a class="lens" target="_blank" rel="noopener" href="https://www.openstreetmap.org/directions?to=' + p.lat + '%2C' + p.lng + '">🧭 ' + t('gps') + '</a>' : '') + '<button class="lens ic' + (f ? ' on' : '') + '" data-f="' + id + '" style="' + (f ? 'color:var(--pk)' : '') + '">' + (f ? '♥' : '♡') + '</button></p>' +
      (p.description ? '<h2 class="sec">' + t('desc') + '</h2><p>' + esc(p.description) + '</p>' : '');
    if (rs.length) h += '<h2 class="sec">' + t('rooms') + '</h2>' + rs.map(r => '<section class="room">' + ((r.photos || []).length ? '<div class="gal">' + r.photos.map((u, i) => '<div class="ph" data-rgi="' + r.id + '" data-i="' + i + '" style="aspect-ratio:16/9;background-image:url(' + esc(u) + ')"></div>').join('') + '</div>' : '') +
      '<div class="rb"><h3>' + esc(r.name) + '</h3><p style="margin:.3rem 0">' + (r.available ? '<span class="badge ok">✔ ' + t('free') + '</span>' : '<span class="badge no">✖ ' + t('busy') + '</span>') + ' <b class="pc">' + money(r.price) + ' ' + t('night') + '</b></p>' +
      '<div class="sp2">' + (r.area ? '<span>📐 ' + r.area + ' m²</span>' : '') + '<span>👥 ' + r.capacity + '</span><span>🛏 ' + r.beds + ' × ' + esc(r.bed_type || '') + '</span></div><b>' + t('inroom') + '</b><ul class="tags">' + (r.amenities || []).map(a => '<li>' + esc(OSH.amName(a)) + '</li>').join('') + '</ul></div></section>').join('');
    const sv = p.services || [];
    if (sv.length) h += '<h2 class="sec">' + t('svc') + '</h2><ul class="tags">' + sv.map(s => '<li>' + esc(OSH.svName(s.k)) + ' · ' + (s.p ? money(s.p) + ' ' + t('som') : t('incl')) + '</li>').join('') + '</ul>';
    const me = OSH.me;
    if (rs.some(r => r.available)) {
      h += '<div class="box"><h2 class="sec" style="margin-top:0">' + t('book') + '</h2><label class="f">' + t('pick') + '<select id="bR"><option value="">—</option>' + rs.filter(r => r.available).map(r => '<option value="' + r.id + '">' + esc(r.name) + ' · ' + money(r.price) + ' ' + t('som') + ' (≤' + r.capacity + ')</option>').join('') + '</select></label>' +
        '<div class="g2"><label class="f">' + t('d1') + '<input id="bA" type="date" min="' + OSH.today() + '"></label><label class="f">' + t('d2') + '<input id="bB" type="date" min="' + OSH.today() + '"></label></div>' +
        '<div class="g2"><label class="f">' + t('guests') + '<input id="bG" type="number" min="1" value="2"></label><label class="f">' + t('phone') + '<input id="bP" type="tel" value="' + esc(me.phone || '+996 ') + '"></label></div>' +
        sv.map(s => '<label class="chk"><input type="checkbox" data-sv="' + s.k + '"> ' + esc(OSH.svName(s.k)) + '<small>' + (s.p ? money(s.p) + ' ' + t('som') + (s.per === 'p' ? '/👤' : '') : t('incl')) + '</small></label>').join('') +
        '<div class="quote" id="bQ"></div><button class="lens gold block" id="bS" disabled>' + t('send') + '</button></div>';
    }
    h += '<div class="box" style="border-color:var(--ln);background:none"><h2 class="sec" style="margin-top:0">' + t('ask') + '</h2><label class="f"><textarea id="iM" maxlength="500" placeholder="' + t('askph') + '"></textarea></label><label class="f">' + t('phone') + '<input id="iP" type="tel" value="' + esc(me.phone || '+996 ') + '"></label><button class="lens pri block" id="iS">' + t('asksend') + '</button></div></div>';
    OSH.sheet(h); bindPlace(p, rs);
  }
  function bindPlace(p, rs) {
    const sh = $('#sheet');
    $$('[data-gi]', sh).forEach(el => el.onclick = () => { const n = $$('[data-gi]', sh); OSH.lightbox(n.map((x, i) => ({ style: x.getAttribute('style').replace(/aspect-ratio[^;]*;?/, '') + ';background-size:cover;background-position:center', e: x.textContent, c: p.name })), +el.dataset.gi); });
    const q = () => {
      const rid = $('#bR', sh).value, a = $('#bA', sh).value, b = $('#bB', sh).value, g = +$('#bG', sh).value || 1, qq = $('#bQ', sh), bt = $('#bS', sh);
      qq.className = 'quote'; bt.disabled = true; if (!rid || !a || !b) { qq.textContent = ''; return null; }
      const r = rs.find(x => x.id === rid), n = OSH.nights(a, b); let err = '';
      if (n < 1) err = t('e_n'); else if (g > r.capacity) err = t('e_g', { n: r.capacity });
      if (err) { qq.className = 'quote bad'; qq.textContent = err; return null; }
      let tot = r.price * n; $$('[data-sv]:checked', sh).forEach(c => { const s = (p.services || []).find(x => x.k === c.dataset.sv); if (s) tot += s.p * (s.per === 'p' ? g : 1); });
      qq.textContent = t('total') + ': ' + money(tot) + ' ' + t('som') + ' · ' + n + ' ' + t('nights');
      OSH.sb.rpc('room_busy', { p_room: rid, p_d1: a, p_d2: b }).then(({ data }) => { if (data) { qq.className = 'quote bad'; qq.textContent = t('e_b'); bt.disabled = true; } else bt.disabled = false; });
      return { rid, a, b, g };
    };
    if ($('#bR', sh)) {
      sh.addEventListener('change', e => { if (e.target.id === 'bA') { const bb = $('#bB', sh); bb.min = e.target.value; if (bb.value <= e.target.value) bb.value = ''; } if (['bR', 'bA', 'bB', 'bG'].indexOf(e.target.id) > -1 || e.target.dataset.sv) q(); });
      $('#bG', sh).oninput = q;
      $('#bS', sh).onclick = async () => {
        const x = q(); if (!x) return; const ph = $('#bP', sh).value.trim(); if (ph.replace(/\D/g, '').length < 7) return OSH.err(t('needph'));
        const btn = $('#bS', sh); btn.disabled = true;
        const { data, error } = await OSH.sb.from('requests').insert({ kind: 'booking', place_id: p.id, room_id: x.rid, tourist_name: OSH.me.full_name, tourist_phone: ph, d1: x.a, d2: x.b, guests: x.g, services: $$('[data-sv]:checked', sh).map(c => c.dataset.sv) }).select().single();
        if (error) { btn.disabled = false; return OSH.err(error.message); }
        S.reqs.unshift(data); OSH.closeSheet(); OSH.toast({ type: 'ok', icon: '✅', text: t('sent') }); go('req');
      };
    }
    $('#iS', sh).onclick = async () => {
      const m = $('#iM', sh).value.trim(), ph = $('#iP', sh).value.trim(); if (!m) return; if (ph.replace(/\D/g, '').length < 7) return OSH.err(t('needph'));
      const { data, error } = await OSH.sb.from('requests').insert({ kind: 'inquiry', place_id: p.id, tourist_name: OSH.me.full_name, tourist_phone: ph, message: m }).select().single();
      if (error) return OSH.err(error.message); S.reqs.unshift(data); OSH.closeSheet(); OSH.toast({ type: 'ok', icon: '✅', text: t('sentq') }); go('req');
    };
  }

  // ---------- события ----------
  document.addEventListener('click', async e => {
    const T = e.target; let b;
    if ((b = T.closest('[data-f]'))) {
      e.stopPropagation(); const id = b.dataset.f, on = S.favs.has(id);
      on ? S.favs.delete(id) : S.favs.add(id);
      const r = on ? await OSH.sb.from('favorites').delete().eq('user_id', OSH.me.id).eq('place_id', id) : await OSH.sb.from('favorites').insert({ user_id: OSH.me.id, place_id: id });
      if (r.error) { on ? S.favs.add(id) : S.favs.delete(id); return OSH.err(r.error.message); }
      $$('[data-f="' + id + '"]').forEach(x => { x.classList.toggle('on', !on); if (x.closest('#sheet')) { x.textContent = on ? '♡' : '♥'; x.style.color = on ? '' : 'var(--pk)'; } });
      if (S.v === 'fav') draw(); return;
    }
    if ((b = T.closest('[data-cx]'))) { const id = b.dataset.cx; const { error } = await OSH.sb.from('requests').update({ status: 'cancelled' }).eq('id', id); if (error) return OSH.err(error.message); const r = S.reqs.find(x => x.id === id); if (r) r.status = 'cancelled'; drawReq(); return; }
    if ((b = T.closest('nav.tabs [data-v]'))) { go(b.dataset.v); return; }
    if (T.closest('#sheet') || T.closest('#lb')) return;
    if ((b = T.closest('[data-id]'))) openPlace(b.dataset.id);
  });
})();
