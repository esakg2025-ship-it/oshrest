/* Общий редактор объектов и номеров: данные, цены, услуги, фото и видео.
   Используется панелью владельца и панелью главного администратора. */
(function () {
  'use strict';
  const { $, $$, t, esc, money } = OSH;
  OSH.addT({
    e_new: ['Жаңы жай', 'Новый объект', 'New place'], e_edit: ['Жайды түзөтүү', 'Редактирование объекта', 'Edit place'], e_cat: ['Категория', 'Категория', 'Category'], e_reg: ['Район', 'Район', 'District'],
    e_name: ['Аталышы', 'Название', 'Name'], e_desc: ['Сүрөттөмө', 'Описание', 'Description'], e_phone: ['Телефон', 'Телефон', 'Phone'], e_wa: ['WhatsApp номери', 'Номер WhatsApp', 'WhatsApp number'],
    e_price: ['Баасы төмөндөн (сом)', 'Цена от (сом)', 'Price from (KGS)'], e_price_auto: ['Бөлмөлөрдүн эң арзан баасы автоматтык эсептелет', 'Считается автоматически по самому дешёвому номеру', 'Calculated automatically from the cheapest room'],
    e_lat: ['Кеңдик (lat)', 'Широта (lat)', 'Latitude'], e_lng: ['Узундук (lng)', 'Долгота (lng)', 'Longitude'], e_hours: ['Иш убактысы', 'Часы работы', 'Opening hours'], e_gps: ['Мен турган жерди алуу', 'Взять мои координаты', 'Use my location'],
    e_active: ['Сайтта көрсөтүү', 'Показывать на сайте', 'Visible on the site'], e_owner: ['Ээси (администратор)', 'Владелец (администратор)', 'Owner (administrator)'], e_none: ['— жок —', '— нет —', '— none —'], e_rating: ['Рейтинг (0–5)', 'Рейтинг (0–5)', 'Rating (0–5)'],
    e_sv: ['Кошумча кызматтар жана баалары', 'Дополнительные услуги и цены', 'Services and prices'], e_per: ['бир адамга', 'за человека', 'per person'], e_once: ['бир жолу', 'за всё', 'flat'],
    e_media: ['Сүрөттөр жана видеолор', 'Фото и видео', 'Photos and videos'], e_addph: ['Сүрөт кошуу', 'Добавить фото', 'Add photos'], e_addvid: ['Видео жүктөө', 'Загрузить видео', 'Upload video'], e_vidurl: ['Видео шилтемеси (YouTube же .mp4)', 'Ссылка на видео (YouTube или .mp4)', 'Video link (YouTube or .mp4)'],
    e_addurl: ['Шилтеме кошуу', 'Добавить ссылку', 'Add link'], e_cover: ['Мукаба кылуу', 'Сделать обложкой', 'Set as cover'], e_cover_l: ['Мукаба', 'Обложка', 'Cover'], e_video: ['Видео', 'Видео', 'Video'], e_nomedia: ['Азырынча файл жок', 'Файлов пока нет', 'No files yet'],
    e_hint_media: ['Сүрөт автоматтык кичирейтилет. Видео 50 МБга чейин.', 'Фото сжимаются автоматически. Видео до 50 МБ.', 'Photos are compressed automatically. Video up to 50 MB.'], e_uploading: ['Жүктөлүүдө…', 'Загрузка…', 'Uploading…'], e_bad_url: ['Шилтеме https:// менен башталышы керек', 'Ссылка должна начинаться с https://', 'Link must start with https://'],
    e_rooms: ['Бөлмөлөр жана баалар', 'Номера и цены', 'Rooms and prices'], e_addrm: ['Бөлмө кошуу', 'Добавить номер', 'Add room'], e_rm: ['Бөлмө', 'Номер', 'Room'], e_save_first: ['Бөлмө кошуу үчүн адегенде жайды сактаңыз', 'Чтобы добавить номера, сначала сохраните объект', 'Save the place first to add rooms'],
    e_area: ['Аянты, м²', 'Площадь, м²', 'Area, m²'], e_cap: ['Сыйымдуулук (адам)', 'Вместимость (человек)', 'Capacity (guests)'], e_beds: ['Керебеттер', 'Кроватей', 'Beds'], e_bt: ['Керебет түрү', 'Тип кроватей', 'Bed type'],
    e_rprice: ['Баасы (сом/түн)', 'Цена (сом/ночь)', 'Price (KGS/night)'], e_am: ['Бөлмөдөгү шарттар', 'Условия в номере', 'Amenities'], e_av: ['Бош (брондоого ачык)', 'Доступен для бронирования', 'Available for booking'],
    e_saved: ['Сакталды', 'Сохранено', 'Saved'], e_del: ['Өчүрүү', 'Удалить', 'Delete'], e_edit_b: ['Түзөтүү', 'Изменить', 'Edit'], e_cancel: ['Артка', 'Назад', 'Back'], e_save: ['Сактоо', 'Сохранить', 'Save'], e_conf: ['Чын эле өчүрөсүзбү?', 'Точно удалить?', 'Really delete?'],
    e_free: ['Бош', 'Свободен', 'Available'], e_busy: ['Бош эмес', 'Занят', 'Unavailable'], e_guests: ['адам', 'гост.', 'guests'], e_night: ['сом/түн', 'сом/ночь', 'KGS/night'], e_sec_main: ['Негизги маалымат', 'Основные данные', 'Main details'], e_sec_contact: ['Байланыш жана жайгашуу', 'Контакты и расположение', 'Contacts and location']
  });

  const uid = () => OSH.me.id;
  const val = (s, id) => $('#' + id, s).value;

  // ---------- менеджер фото и видео ----------
  function media(root, st) {
    const draw = () => {
      const ph = st.photos.map((u, i) => '<div class="mt"><div class="mi" style="background-image:url(' + esc(u) + ')"></div>' + (i === 0 ? '<span class="badge ok">' + t('e_cover_l') + '</span>' : '<button type="button" class="lens sm" data-mcover="' + i + '">' + t('e_cover') + '</button>') + '<button type="button" class="lens sm bad" data-mdp="' + i + '">' + t('e_del') + '</button></div>').join('');
      const vd = st.videos.map((u, i) => '<div class="mt"><div class="mi vd">' + (OSH.ytId(u) ? '<div class="yt"><i class=i-play></i> YouTube</div>' : '<video src="' + esc(u) + '" muted playsinline preload="metadata"></video>') + '<span class="vl">' + t('e_video') + '</span></div><button type="button" class="lens sm bad" data-mdv="' + i + '">' + t('e_del') + '</button></div>').join('');
      $('.mg', root).innerHTML = ph + vd || '<div class="m">' + t('e_nomedia') + '</div>';
    };
    root.innerHTML = '<div class="mg"></div><div class="mbar"><label class="lens">' + t('e_addph') + '<input type="file" accept="image/*" multiple hidden data-mph></label><label class="lens">' + t('e_addvid') + '<input type="file" accept="video/mp4,video/webm,video/quicktime" hidden data-mvd></label></div>' +
      '<div class="sw" style="margin-top:.5rem"><input type="url" placeholder="' + esc(t('e_vidurl')) + '" data-murl><button type="button" class="lens" data-madd>' + t('e_addurl') + '</button></div><p class="m">' + t('e_hint_media') + '</p>';
    draw();
    const busy = (on) => { root.style.opacity = on ? .55 : 1; root.style.pointerEvents = on ? 'none' : ''; };
    root.addEventListener('click', e => {
      let b;
      if ((b = e.target.closest('[data-mdp]'))) { st.photos.splice(+b.dataset.mdp, 1); draw(); }
      else if ((b = e.target.closest('[data-mdv]'))) { st.videos.splice(+b.dataset.mdv, 1); draw(); }
      else if ((b = e.target.closest('[data-mcover]'))) { const i = +b.dataset.mcover, x = st.photos.splice(i, 1)[0]; st.photos.unshift(x); draw(); }
      else if (e.target.closest('[data-madd]')) { const inp = $('[data-murl]', root), u = inp.value.trim(); if (!/^https:\/\//i.test(u)) return OSH.err(t('e_bad_url')); st.videos.push(u); inp.value = ''; draw(); }
    });
    root.addEventListener('change', async e => {
      const inp = e.target, files = [].slice.call(inp.files || []); if (!files.length) return;
      busy(true); OSH.toast({ text: t('e_uploading'), ms: 2500 });
      try {
        for (const f of files) {
          if (inp.hasAttribute('data-mph')) st.photos.push(await OSH.upload(f, uid()));
          else if (inp.hasAttribute('data-mvd')) st.videos.push(await OSH.uploadVideo(f, uid()));
          draw();
        }
      } catch (er) { OSH.err(er.message || String(er)); }
      inp.value = ''; busy(false);
    });
  }

  // ---------- объект ----------
  // ctx: {places, rooms, owners|null, isAdmin, refresh()}
  async function syncMinPrice(ctx, pid) {
    const rs = ctx.rooms.filter(x => x.place_id === pid); if (!rs.length) return;
    const m = Math.min.apply(null, rs.map(x => x.price));
    const { data } = await OSH.sb.from('places').update({ price_from: m }).eq('id', pid).select().single();
    if (data) { const i = ctx.places.findIndex(x => x.id === pid); if (i > -1) ctx.places[i] = data; }
  }
  function place(ctx, p) {
    const isNew = !p; p = p || { category: 'hotel', region: 'osh', services: [], photos: [], videos: [], active: true, price_from: 0, rating: 0, owner_id: ctx.isAdmin ? null : uid() };
    const sv = (p.services || []).reduce((m, x) => (m[x.k] = x, m), {}), rs = isNew ? [] : ctx.rooms.filter(r => r.place_id === p.id), L = OSH.lang();
    const h = '<div class="sp"><h2 style="margin-top:2.6rem">' + (isNew ? t('e_new') : t('e_edit') + ': ' + esc(p.name)) + '</h2><form id="pf">' +
      '<h3>' + t('e_sec_main') + '</h3><div class="g2"><label class="f">' + t('e_cat') + '<select id="pe_c">' + Object.keys(CATALOG.cats).map(k => '<option value="' + k + '"' + (p.category === k ? ' selected' : '') + '>' + esc(OSH.catName(k)) + '</option>').join('') + '</select></label>' +
      '<label class="f">' + t('e_reg') + '<select id="pe_r">' + Object.keys(CATALOG.regs).map(k => '<option value="' + k + '"' + (p.region === k ? ' selected' : '') + '>' + esc(OSH.regName(k)) + '</option>').join('') + '</select></label></div>' +
      '<label class="f">' + t('e_name') + '<input id="pe_n" required maxlength="120" value="' + esc(p.name || '') + '"></label><label class="f">' + t('e_desc') + '<textarea id="pe_d" maxlength="2000">' + esc(p.description || '') + '</textarea></label>' +
      (ctx.isAdmin ? '<div class="g2"><label class="f">' + t('e_owner') + '<select id="pe_o"><option value="">' + t('e_none') + '</option>' + (ctx.owners || []).map(o => '<option value="' + o.id + '"' + (p.owner_id === o.id ? ' selected' : '') + '>' + esc(o.full_name || o.login) + ' (' + esc(o.login) + ')</option>').join('') + '</select></label><label class="f">' + t('e_rating') + '<input id="pe_rt" type="number" min="0" max="5" step="0.1" value="' + (p.rating || 0) + '"></label></div>' : '') +
      '<h3>' + t('e_sec_contact') + '</h3><div class="g2"><label class="f">' + t('e_phone') + '<input id="pe_ph" type="tel" value="' + esc(p.phone || '+996 ') + '"></label><label class="f">' + t('e_wa') + '<input id="pe_wa" type="tel" value="' + esc(p.whatsapp || '') + '"></label></div>' +
      '<div class="g3"><label class="f">' + t('e_price') + '<input id="pe_pr" type="number" min="0" value="' + (p.price_from || 0) + '"' + (rs.length ? ' disabled' : '') + '></label><label class="f">' + t('e_lat') + '<input id="pe_la" type="number" step="any" value="' + (p.lat == null ? '' : p.lat) + '"></label><label class="f">' + t('e_lng') + '<input id="pe_lo" type="number" step="any" value="' + (p.lng == null ? '' : p.lng) + '"></label></div>' +
      (rs.length ? '<p class="m" style="margin-top:-.3rem">' + t('e_price_auto') + '</p>' : '') +
      '<div class="g2"><label class="f">' + t('e_hours') + '<input id="pe_h" maxlength="40" value="' + esc(p.hours || '24/7') + '"></label><div style="display:flex;align-items:end;margin:.55rem 0"><button type="button" class="lens block" id="pe_geo">' + t('e_gps') + '</button></div></div>' +
      '<h3>' + t('e_sv') + '</h3>' + Object.keys(CATALOG.sv).map(k => { const c = CATALOG.sv[k], s = sv[k]; return '<div class="chk"><input type="checkbox" data-s="' + k + '"' + (s ? ' checked' : '') + '><span>' + esc(c.l[L]) + '</span><small><input type="number" min="0" data-sp="' + k + '" value="' + (s ? s.p : c.p) + '" style="width:96px;min-height:34px;padding:.2rem .5rem"> ' + t('som') + ' / ' + (c.per === 'p' ? t('e_per') : t('e_once')) + '</small></div>'; }).join('') +
      '<h3>' + t('e_media') + '</h3><div id="pe_media" class="mbox"></div>' +
      '<label class="chk" style="margin-top:.8rem"><input type="checkbox" id="pe_a"' + (p.active ? ' checked' : '') + '> ' + t('e_active') + '</label>' +
      '<div class="g2" style="margin-top:.8rem"><button class="lens pri" type="submit">' + t('e_save') + '</button>' + (isNew ? '<button type="button" class="lens" data-act="closesheet">' + t('e_cancel') + '</button>' : '<button type="button" class="lens bad" id="pe_del">' + t('e_del') + '</button>') + '</div></form>' +
      '<h2 class="sec" style="margin-top:1.8rem">' + t('e_rooms') + '</h2>' + (isNew ? '<p class="m">' + t('e_save_first') + '</p>' : '<div id="pe_rl"></div><button class="lens gold block" id="pe_addrm" style="margin-top:.6rem">' + t('e_addrm') + '</button>') + '</div>';
    const s = OSH.sheet(h, true), st = { photos: (p.photos || []).slice(), videos: (p.videos || []).slice() };
    media($('#pe_media', s), st);
    $('#pe_geo', s).onclick = () => navigator.geolocation ? navigator.geolocation.getCurrentPosition(g => { $('#pe_la', s).value = g.coords.latitude.toFixed(5); $('#pe_lo', s).value = g.coords.longitude.toFixed(5); }, () => OSH.err('GPS')) : OSH.err('GPS');
    $('#pf', s).onsubmit = async ev => {
      ev.preventDefault();
      const ph = val(s, 'pe_ph').trim();
      const rec = { category: val(s, 'pe_c'), region: val(s, 'pe_r'), name: val(s, 'pe_n').trim(), description: val(s, 'pe_d').trim(), phone: ph, whatsapp: val(s, 'pe_wa').replace(/\D/g, '') || ph.replace(/\D/g, ''),
        lat: val(s, 'pe_la') === '' ? null : +val(s, 'pe_la'), lng: val(s, 'pe_lo') === '' ? null : +val(s, 'pe_lo'), hours: val(s, 'pe_h').trim(), active: $('#pe_a', s).checked, photos: st.photos, videos: st.videos,
        services: $$('[data-s]:checked', s).map(c => ({ k: c.dataset.s, p: Math.max(0, +$('[data-sp=' + c.dataset.s + ']', s).value || 0), per: CATALOG.sv[c.dataset.s].per })) };
      if (!rs.length) rec.price_from = Math.max(0, +val(s, 'pe_pr') || 0);
      if (ctx.isAdmin) { rec.owner_id = val(s, 'pe_o') || null; rec.rating = Math.max(0, Math.min(5, +val(s, 'pe_rt') || 0)); } else if (isNew) rec.owner_id = uid();
      const q = isNew ? OSH.sb.from('places').insert(rec) : OSH.sb.from('places').update(rec).eq('id', p.id);
      const { data, error } = await q.select().single(); if (error) return OSH.err(error.message);
      OSH.toast({ type: 'ok', text: t('e_saved') });
      if (isNew) { ctx.places.push(data); ctx.refresh(); place(ctx, data); } else { ctx.places[ctx.places.findIndex(x => x.id === p.id)] = data; ctx.refresh(); }
    };
    if (!isNew) {
      $('#pe_del', s).onclick = () => OSH.ask(t('e_conf'), async () => { const { error } = await OSH.sb.from('places').delete().eq('id', p.id); if (error) return OSH.err(error.message); ctx.places.splice(ctx.places.findIndex(x => x.id === p.id), 1); for (let i = ctx.rooms.length - 1; i >= 0; i--) if (ctx.rooms[i].place_id === p.id) ctx.rooms.splice(i, 1); ctx.refresh(); OSH.closeSheet(); });
      roomList(ctx, p, s);
      $('#pe_addrm', s).onclick = () => room(ctx, p, null);
    }
  }
  // список номеров с быстрым редактированием цены и доступности
  function roomList(ctx, p, s) {
    const box = $('#pe_rl', s);
    const draw = () => {
      const rs = ctx.rooms.filter(r => r.place_id === p.id);
      box.innerHTML = rs.map(r => '<div class="panel rr" data-rr="' + r.id + '"><div style="flex:1;min-width:150px"><b>' + esc(r.name) + '</b><div class="m">' + t('e_cap') + ': ' + r.capacity + '</div></div>' +
        '<label class="f" style="margin:0;min-width:130px">' + t('e_rprice') + '<input type="number" min="0" data-rpr="' + r.id + '" value="' + r.price + '"></label>' +
        '<label class="chk" style="margin:0"><input type="checkbox" data-rav="' + r.id + '"' + (r.available ? ' checked' : '') + '> ' + t('e_free') + '</label>' +
        '<button class="lens sm" data-redit="' + r.id + '">' + t('e_edit_b') + '</button></div>').join('') || '<p class="m">—</p>';
    };
    draw();
    const upd = async (id, patch) => {
      const { data, error } = await OSH.sb.from('rooms').update(patch).eq('id', id).select().single(); if (error) { OSH.err(error.message); return draw(); }
      ctx.rooms[ctx.rooms.findIndex(x => x.id === id)] = data; await syncMinPrice(ctx, p.id); ctx.refresh(); OSH.toast({ type: 'ok', text: t('e_saved'), ms: 1500 });
    };
    box.addEventListener('change', e => { const T = e.target; if (T.dataset.rpr) upd(T.dataset.rpr, { price: Math.max(0, Math.round(+T.value || 0)) }); else if (T.dataset.rav) upd(T.dataset.rav, { available: T.checked }); });
    box.addEventListener('click', e => { const b = e.target.closest('[data-redit]'); if (b) room(ctx, p, ctx.rooms.find(x => x.id === b.dataset.redit)); });
  }

  // ---------- номер ----------
  function room(ctx, p, r) {
    const isNew = !r; r = r || { capacity: 2, beds: 1, price: p.price_from || 1000, amenities: [], photos: [], videos: [], available: true };
    const L = OSH.lang();
    const h = '<div class="sp"><h2 style="margin-top:2.6rem">' + t('e_rm') + ': ' + esc(p.name) + '</h2><form id="rf"><label class="f">' + t('e_name') + '<input id="re_n" required maxlength="100" value="' + esc(r.name || '') + '"></label>' +
      '<div class="g3"><label class="f">' + t('e_area') + '<input id="re_a" type="number" min="0" value="' + (r.area || '') + '"></label><label class="f">' + t('e_cap') + '<input id="re_c" type="number" min="1" required value="' + r.capacity + '"></label><label class="f">' + t('e_beds') + '<input id="re_b" type="number" min="1" value="' + r.beds + '"></label></div>' +
      '<div class="g2"><label class="f">' + t('e_bt') + '<input id="re_t" maxlength="40" value="' + esc(r.bed_type || '') + '"></label><label class="f">' + t('e_rprice') + '<input id="re_p" type="number" min="0" required value="' + r.price + '"></label></div>' +
      '<h3>' + t('e_am') + '</h3><div style="display:flex;flex-wrap:wrap;gap:.35rem">' + Object.keys(CATALOG.am).map(k => '<label class="chk" style="margin:0"><input type="checkbox" data-a="' + k + '"' + ((r.amenities || []).indexOf(k) > -1 ? ' checked' : '') + '>' + esc(CATALOG.am[k][L]) + '</label>').join('') + '</div>' +
      '<h3>' + t('e_media') + '</h3><div id="re_media" class="mbox"></div><label class="chk" style="margin-top:.8rem"><input type="checkbox" id="re_av"' + (r.available ? ' checked' : '') + '> ' + t('e_av') + '</label>' +
      '<div class="g2" style="margin-top:.8rem"><button class="lens pri" type="submit">' + t('e_save') + '</button>' + (isNew ? '<button type="button" class="lens" id="re_back">' + t('e_cancel') + '</button>' : '<button type="button" class="lens bad" id="re_del">' + t('e_del') + '</button>') + '</div></form></div>';
    const s = OSH.sheet(h, true), st = { photos: (r.photos || []).slice(), videos: (r.videos || []).slice() };
    media($('#re_media', s), st);
    const back = () => place(ctx, ctx.places.find(x => x.id === p.id));
    if (isNew) $('#re_back', s).onclick = back;
    else $('#re_del', s).onclick = () => OSH.ask(t('e_conf'), async () => { const { error } = await OSH.sb.from('rooms').delete().eq('id', r.id); if (error) return OSH.err(error.message); ctx.rooms.splice(ctx.rooms.findIndex(x => x.id === r.id), 1); await syncMinPrice(ctx, p.id); ctx.refresh(); back(); });
    $('#rf', s).onsubmit = async ev => {
      ev.preventDefault();
      const rec = { place_id: p.id, name: val(s, 're_n').trim(), area: +val(s, 're_a') || null, capacity: Math.max(1, +val(s, 're_c') || 1), beds: Math.max(1, +val(s, 're_b') || 1), bed_type: val(s, 're_t').trim(), price: Math.max(0, Math.round(+val(s, 're_p') || 0)), amenities: $$('[data-a]:checked', s).map(c => c.dataset.a), photos: st.photos, videos: st.videos, available: $('#re_av', s).checked };
      const q = isNew ? OSH.sb.from('rooms').insert(rec) : OSH.sb.from('rooms').update(rec).eq('id', r.id);
      const { data, error } = await q.select().single(); if (error) return OSH.err(error.message);
      if (isNew) ctx.rooms.push(data); else ctx.rooms[ctx.rooms.findIndex(x => x.id === r.id)] = data;
      await syncMinPrice(ctx, p.id); OSH.toast({ type: 'ok', text: t('e_saved') }); ctx.refresh(); back();
    };
  }
  OSH.editor = { place, room };
})();
