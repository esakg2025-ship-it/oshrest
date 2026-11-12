// Генерирует public/shared/catalog.js и supabase/seed.sql из шаблона oshrest_demo_v2.html
// Запуск: node scripts/build-data.js путь/к/oshrest_demo_v2.html
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const src = fs.readFileSync(process.argv[2] || 'oshrest_demo_v2.html', 'utf8');
const a = src.indexOf('var CAT='), b = src.indexOf('var DATA=');
if (a < 0 || b < 0) throw new Error('Шаблон не распознан');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(src.slice(a, b) + ';this.R={CAT,REG,AM,SV,RT,PL}', ctx);
const { CAT, REG, AM, SV, RT, PL } = ctx.R;

const root = path.join(__dirname, '..');
const ICON = { hotel: 'building', guest: 'home', yurt: 'tent', base: 'trees', camp: 'flame', mount: 'mountain', hist: 'landmark', sacred: 'sparkle', lake: 'waves' };
const catalog = {
  cats: Object.fromEntries(Object.entries(CAT).map(([k, v]) => [k, [ICON[k] || 'pin', v[1]]])),
  regs: REG,
  am: Object.fromEntries(Object.entries(AM).map(([k, v]) => [k, [v[1], v[2], v[3]]])),
  sv: Object.fromEntries(Object.entries(SV).map(([k, v]) => [k, { l: [v[1], v[2], v[3]], p: v[4], per: v[5] }])),
};
fs.writeFileSync(path.join(root, 'public/shared/catalog.js'), 'window.CATALOG=' + JSON.stringify(catalog) + ';\n');

const q = s => "'" + String(s).replace(/'/g, "''") + "'";
const arr = x => "ARRAY[" + x.map(q).join(',') + "]::text[]";
const pid = i => `00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`;
const rid = (i, j) => `00000000-0000-4000-9000-${String((i + 1) * 100 + j).padStart(12, '0')}`;
let sql = '-- Демо-данные из шаблона oshrest_demo_v2 (владелец не назначен: назначьте в панели главного админа)\n-- Номера телефонов вымышленные — замените на реальные.\n';
const places = [], rooms = [];
PL.forEach((p, i) => {
  const [cat, reg, name, price, rating, lat, lng, , svc, desc, hrs] = p;
  const rs = (RT[cat] || []).map((t, j) => {
    const pr = Math.round(price * t[5] / 50) * 50 || 500;
    return { j, n: t[0], ar: t[1], cap: t[2], bd: t[3], bt: t[4], pr, am: t[6], on: !((i + 1) % 7 === 3 && j === 0) };
  });
  const from = rs.length ? Math.min(...rs.map(r => r.pr)) : price;
  const phone = `+996 555 00${10 + i}0${i}`;
  const services = svc.map(k => ({ k, p: SV[k][4], per: SV[k][5] }));
  places.push(`(${q(pid(i))},${q(cat)},${q(reg)},${q(name)},${q(desc)},${from},${rating},${lat},${lng},${q(hrs)},${q(phone)},${q(phone.replace(/\D/g, ''))},${q(JSON.stringify(services))}::jsonb)`);
  rs.forEach(r => rooms.push(`(${q(rid(i, r.j))},${q(pid(i))},${q(r.n)},${r.ar},${r.cap},${r.bd},${q(r.bt)},${r.pr},${arr(r.am)},${r.on})`));
});
sql += 'insert into public.places (id,category,region,name,description,price_from,rating,lat,lng,hours,phone,whatsapp,services) values\n' + places.join(',\n') + '\non conflict (id) do nothing;\n\n';
sql += 'insert into public.rooms (id,place_id,name,area,capacity,beds,bed_type,price,amenities,available) values\n' + rooms.join(',\n') + '\non conflict (id) do nothing;\n';
fs.writeFileSync(path.join(root, 'supabase/seed.sql'), sql);
console.log('places:', places.length, 'rooms:', rooms.length);
