// Генерирует public/shared/icons.css — векторные иконки (маски) без эмодзи.
'use strict';
const fs = require('fs'), path = require('path');
const I = {
  search: "<circle cx='11' cy='11' r='7'/><path d='M20 20l-3.5-3.5'/>",
  map: "<path d='M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z'/><path d='M9 4v14M15 6v14'/>",
  heart: "<path d='M12 20s-7-4.4-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.6-9 9-9 9z'/>",
  'heart-fill': "<path fill='black' d='M12 20s-7-4.4-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.6-9 9-9 9z'/>",
  receipt: "<path d='M6 3h12v18l-3-2-3 2-3-2-3 2z'/><path d='M9 8h6M9 12h6'/>",
  user: "<circle cx='12' cy='8' r='4'/><path d='M4 21c1-4 4-6 8-6s7 2 8 6'/>",
  users: "<circle cx='9' cy='8' r='3.5'/><path d='M2.5 20c.8-3.5 3.3-5 6.5-5s5.7 1.5 6.5 5'/><circle cx='17' cy='9' r='2.8'/><path d='M17 14.5c2.6 0 4.2 1.4 4.8 4.5'/>",
  chart: "<path d='M4 20V4M4 20h16'/><path d='M8 16v-5M13 16V8M18 16v-8'/>",
  key: "<circle cx='8' cy='14' r='4'/><path d='M11 11l9-9M16 6l3 3M14 8l2 2'/>",
  lock: "<rect x='5' y='11' width='14' height='10' rx='2'/><path d='M8 11V8a4 4 0 0 1 8 0v3'/>",
  building: "<path d='M4 21V5l8-2v18M12 8h8v13M2 21h20'/><path d='M7 9h2M7 13h2M7 17h2M15 12h2M15 16h2'/>",
  home: "<path d='M3 11l9-8 9 8M5 10v11h14V10'/><path d='M10 21v-6h4v6'/>",
  tent: "<path d='M3 20h18M5 20v-6a7 6 0 0 1 14 0v6'/><path d='M12 8V4M9 20v-5h6v5'/>",
  trees: "<path d='M12 3l6 8h-3l5 7H4l5-7H6z'/><path d='M12 18v3'/>",
  flame: "<path d='M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z'/>",
  mountain: "<path d='M2 20l7-13 4 7 3-4 6 10z'/>",
  landmark: "<path d='M3 21h18M5 21V10M19 21V10M9 21V10M15 21V10M3 10l9-6 9 6z'/>",
  sparkle: "<path d='M12 3l2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2z'/>",
  waves: "<path d='M2 9c2.5-2 4.5-2 7 0s4.5 2 7 0 4.5-2 6 0M2 15c2.5-2 4.5-2 7 0s4.5 2 7 0 4.5-2 6 0'/>",
  pin: "<path d='M12 21s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12z'/><circle cx='12' cy='9' r='2.5'/>",
  sun: "<circle cx='12' cy='12' r='4'/><path d='M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5'/>",
  moon: "<path d='M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10z'/>",
  download: "<path d='M12 3v12M7 10l5 5 5-5M4 20h16'/>",
  logout: "<path d='M10 4H5v16h5M15 8l4 4-4 4M19 12H9'/>",
  refresh: "<path d='M20 11a8 8 0 0 0-14-4L4 9M4 4v5h5M4 13a8 8 0 0 0 14 4l2-2M20 20v-5h-5'/>",
  play: "<path fill='black' d='M7 4l13 8-13 8z'/>",
  mountain2: "<path d='M2 20l7-13 4 7 3-4 6 10z'/>",
};
let css = '/* Сгенерировано scripts/gen-icons-css.js — не править вручную */\n[class^="i-"]{display:inline-block;width:1.2em;height:1.2em;background:currentColor;-webkit-mask:var(--m) center/contain no-repeat;mask:var(--m) center/contain no-repeat;vertical-align:-.22em;flex:none}\n';
const uri = b => 'url("data:image/svg+xml,' + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'>" + b + '</svg>').replace(/'/g, '%27') + '")';
for (const [k, v] of Object.entries(I)) css += '.i-' + k + '{--m:' + uri(v) + '}\n';
css += '.on>.i-heart{--m:' + uri(I['heart-fill']) + '}\n';
fs.writeFileSync(path.join(__dirname, '../public/shared/icons.css'), css);
console.log('icons:', Object.keys(I).length);
