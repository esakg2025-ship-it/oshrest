// Переводы демо-данных (ky — исходный язык шаблона). Генерирует supabase/i18n.sql
'use strict';
const fs = require('fs'), path = require('path');
const q = s => "'" + String(s).replace(/'/g, "''") + "'";
const P = [ // [ky name, ru name, en name, ky desc(из БД), ru desc, en desc]
  ['Сулайман-Тоо ыйык тоосу', 'Священная гора Сулайман-Тоо', 'Sulaiman-Too Sacred Mountain', 'Священная гора из списка Всемирного наследия ЮНЕСКО в центре города Ош.', 'A sacred mountain on the UNESCO World Heritage List, in the centre of Osh.'],
  ['Өзгөн архитектуралык комплекси', 'Узгенский архитектурный комплекс', 'Uzgen Architectural Complex', 'Комплекс средневековых минарета и мавзолеев.', 'A complex of a medieval minaret and mausoleums.'],
  ['Алай жайлоосундагы юрта лагери', 'Юрт-лагерь на джайлоо Алай', 'Yurt camp on the Alay summer pasture', 'Юрты на джайлоо, национальная кухня, конные прогулки.', 'Yurts on the summer pasture, national cuisine, horseback trips.'],
  ['Чоң-Алай өрөөнүндөгү юрта лагери', 'Юрт-лагерь в Чон-Алайской долине', 'Yurt camp in the Chon-Alay Valley', 'Начало горных маршрутов, гид. Может потребоваться разрешение на въезд в пограничную зону.', 'Starting point for mountain routes, guide available. A border-zone permit may be required.'],
  ['Альпинисттик базалык лагерь', 'Альпинистский базовый лагерь', 'Alpine base camp', 'База для восходителей, условия простые.', 'A base for climbers, basic conditions.'],
  ['Ош шаарындагы борбордук мейманкана', 'Центральная гостиница в городе Ош', 'Central hotel in Osh', 'В центре города, рядом с базаром и Сулайман-Тоо.', 'In the city centre, close to the bazaar and Sulaiman-Too.'],
  ['Ош шаарындагы бизнес-мейманкана', 'Бизнес-отель в городе Ош', 'Business hotel in Osh', 'Конференц-зал, парковка, трансфер.', 'Conference hall, parking, transfer.'],
  ['Ош конок үйү «Бакчалуу»', 'Гостевой дом «Бакчалуу» в Оше', 'Guest house “Bakchaluu” in Osh', 'Домашнее размещение, сад, национальная кухня.', 'Homestay with a garden and national cuisine.'],
  ['Өзгөндөгү конок үйү', 'Гостевой дом в Узгене', 'Guest house in Uzgen', 'Пешком до исторического комплекса, домашняя кухня.', 'Walking distance to the historic complex, home cooking.'],
  ['Дарыя боюндагы эс алуу борбору', 'Центр отдыха на берегу реки', 'Riverside recreation centre', 'Коттеджи на берегу реки, зона для мангала.', 'Cottages on the riverbank, barbecue area.'],
  ['Көл жээгиндеги эс алуу үйү', 'Дом отдыха на берегу озера', 'Lakeside holiday house', 'Домики у озера, лодки, рыбалка.', 'Lakeside cabins, boating, fishing.'],
  ['Көл жээгиндеги кемпинг аймагы', 'Кемпинг на берегу озера', 'Lakeside camping area', 'Места для палаток, зона для пикника.', 'Tent pitches and a picnic area.'],
];
// описания на кыргызском берём из БД (они уже в колонке description)
const R = { // ky -> [ru, en]
  'Стандарт 1 кишилик': ['Стандарт одноместный', 'Standard single'], 'Стандарт 2 кишилик': ['Стандарт двухместный', 'Standard double'], 'Люкс': ['Люкс', 'Suite'], 'Үй-бүлөлүк': ['Семейный', 'Family room'],
  'Бөлмө «Бакча»': ['Комната «Сад»', 'Garden room'], 'Үй-бүлөлүк бөлмө': ['Семейная комната', 'Family room'], 'Эконом': ['Эконом', 'Economy'], 'Юрта (2 киши)': ['Юрта (2 человека)', 'Yurt (2 guests)'], 'Юрта (4 киши)': ['Юрта (4 человека)', 'Yurt (4 guests)'],
  'Жыгач үй': ['Деревянный домик', 'Wooden cabin'], 'Коттедж 4 кишилик': ['Коттедж на 4 человека', 'Cottage (4 guests)'], 'Коттедж 6 кишилик': ['Коттедж на 6 человек', 'Cottage (6 guests)'], 'Стандарт бөлмө': ['Стандартный номер', 'Standard room'],
  'Жалпы бөлмө (6 орун)': ['Общая комната (6 мест)', 'Shared room (6 beds)'], 'Эки кишилик': ['Двухместный', 'Double room'], 'Көл жээгиндеги үйчө': ['Домик у озера', 'Lakeside cabin'], 'Стандарт': ['Стандарт', 'Standard'],
  'Чатыр орду': ['Место для палатки', 'Tent pitch'], 'Жабдылган чатыр': ['Оборудованная палатка', 'Equipped tent'] };
const B = { '1 керебет': ['1 кровать', '1 bed'], 'Эки кишилик': ['Двуспальная', 'Double'], 'Аралаш': ['Смешанные', 'Mixed'], 'Эки өзүнчө': ['Две раздельные', 'Two single beds'], 'Төшөк': ['Матрасы', 'Mattresses'], 'Эки кабаттуу': ['Двухъярусные', 'Bunk beds'] };
let sql = '-- Переводы демо-данных (ky/ru/en). Выполняется после seed.sql\n';
P.forEach((p, i) => {
  const id = `00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`;
  sql += `update public.places set i18n = jsonb_build_object('ky', jsonb_build_object('name', name, 'description', description), 'ru', jsonb_build_object('name', ${q(p[1])}, 'description', ${q(p[3])}), 'en', jsonb_build_object('name', ${q(p[2])}, 'description', ${q(p[4])})) where id = ${q(id)};\n`;
});
sql += "update public.rooms set i18n = jsonb_build_object('ky', jsonb_build_object('name', name, 'bed_type', coalesce(bed_type,'')));\n";
for (const [k, v] of Object.entries(R)) sql += `update public.rooms set i18n = i18n || jsonb_build_object('ru', coalesce(i18n->'ru','{}'::jsonb) || jsonb_build_object('name', ${q(v[0])}), 'en', coalesce(i18n->'en','{}'::jsonb) || jsonb_build_object('name', ${q(v[1])})) where name = ${q(k)};\n`;
for (const [k, v] of Object.entries(B)) sql += `update public.rooms set i18n = i18n || jsonb_build_object('ru', coalesce(i18n->'ru','{}'::jsonb) || jsonb_build_object('bed_type', ${q(v[0])}), 'en', coalesce(i18n->'en','{}'::jsonb) || jsonb_build_object('bed_type', ${q(v[1])})) where bed_type = ${q(k)};\n`;
fs.writeFileSync(path.join(__dirname, '../supabase/i18n.sql'), sql);
console.log('ok', sql.length);
