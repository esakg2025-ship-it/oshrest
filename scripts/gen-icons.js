// Генерирует PNG-иконки PWA без зависимостей: node scripts/gen-icons.js
'use strict';
const fs = require('fs'), zlib = require('zlib'), path = require('path');
const crcT = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = b => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
const tri = (px, py, a, b, c) => { const s = (p, q, r) => (p[0] - r[0]) * (q[1] - r[1]) - (q[0] - r[0]) * (p[1] - r[1]); const P = [px, py], d1 = s(P, a, b), d2 = s(P, b, c), d3 = s(P, c, a); return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0)); };
function png(size, c1, c2) {
  const raw = Buffer.alloc((size * 4 + 1) * size), SS = 3;
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0;
      for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
        const u = (x + (sx + .5) / SS) / size, v = (y + (sy + .5) / SS) / size, t = (u + v) / 2;
        let col = [0, 1, 2].map(i => c1[i] + (c2[i] - c1[i]) * t);
        if ((u - .7) ** 2 + (v - .31) ** 2 < .06 ** 2) col = [255, 214, 90];
        else if (tri(u, v, [.38, .72], [.62, .44], [.86, .72])) col = col.map((c, i) => c * .25 + [255, 255, 255][i] * .75);
        else if (tri(u, v, [.14, .72], [.40, .34], [.66, .72])) col = [255, 255, 255];
        r += col[0]; g += col[1]; b += col[2];
      }
      const o = y * (size * 4 + 1) + 1 + x * 4, n = SS * SS;
      raw[o] = r / n; raw[o + 1] = g / n; raw[o + 2] = b / n; raw[o + 3] = 255;
    }
  }
  const ih = Buffer.alloc(13); ih.writeUInt32BE(size, 0); ih.writeUInt32BE(size, 4); ih[8] = 8; ih[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}
const sites = { '': [[47, 107, 255], [23, 184, 166]], owner: [[31, 157, 99], [23, 120, 140]], admin: [[120, 70, 230], [230, 90, 150]] };
for (const [dir, [c1, c2]] of Object.entries(sites)) {
  const d = path.join(__dirname, '../public', dir, 'icons'); fs.mkdirSync(d, { recursive: true });
  for (const s of [192, 512]) fs.writeFileSync(path.join(d, `icon-${s}.png`), png(s, c1, c2));
}
console.log('icons ok');
