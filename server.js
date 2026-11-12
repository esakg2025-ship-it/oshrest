// OshRest — сервер для Render. Без внешних зависимостей (Node 18+).
// Отдаёт 3 сайта и безопасные админ-операции (создание владельцев, регистрация, "забыл пароль").
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');

const PORT = process.env.PORT || 3000;
const SB_URL = (process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SB_ANON = process.env.SUPABASE_ANON_KEY || '';
const SB_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ADMIN_LOGIN = (process.env.ADMIN_LOGIN || '').trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const RESEND_KEY = process.env.RESEND_API_KEY || '';
const NOTIFY_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || '';
const PUB = path.join(__dirname, 'public');

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8' };

// ---------- Supabase helpers ----------
// Новые ключи sb_secret_… передаются только в apikey; старые JWT-ключи service_role — ещё и в Authorization
const sbHeaders = (extra) => Object.assign({ apikey: SB_SERVICE, 'Content-Type': 'application/json' }, SB_SERVICE.startsWith('eyJ') ? { Authorization: 'Bearer ' + SB_SERVICE } : {}, extra || {});
async function sb(method, p, body, extra) {
  const r = await fetch(SB_URL + p, { method, headers: sbHeaders(extra), body: body ? JSON.stringify(body) : undefined });
  const txt = await r.text(); let data = null; try { data = txt ? JSON.parse(txt) : null; } catch (e) { data = txt; }
  return { ok: r.ok, status: r.status, data };
}
const loginToEmail = (s) => {
  s = String(s || '').trim().toLowerCase();
  if (s.includes('@')) return s;
  if (/^[+\d\s()-]{7,}$/.test(s)) return s.replace(/\D/g, '') + '@phone.oshrest.local';
  return s.replace(/[^a-z0-9._-]/g, '') + '@owner.oshrest.local';
};
async function userFromToken(req) {
  const m = /^Bearer (.+)$/.exec(req.headers.authorization || ''); if (!m) return null;
  const r = await fetch(SB_URL + '/auth/v1/user', { headers: { apikey: SB_ANON || SB_SERVICE, Authorization: 'Bearer ' + m[1] } });
  if (!r.ok) return null;
  const u = await r.json();
  const p = await sb('GET', '/rest/v1/profiles?id=eq.' + u.id + '&select=role');
  return { id: u.id, role: p.ok && p.data && p.data[0] ? p.data[0].role : null };
}
async function requireAdmin(req, res) {
  const u = await userFromToken(req);
  if (!u || u.role !== 'admin') { send(res, 403, { error: 'Только для главного администратора' }); return null; }
  return u;
}
// Профиль задаём явно (не полагаясь на триггер): роль всегда соответствует тому, как создан аккаунт
async function setProfile(id, p) { return sb('POST', '/rest/v1/profiles?on_conflict=id', Object.assign({ id }, p), { Prefer: 'resolution=merge-duplicates,return=minimal' }); }
async function findUserByEmail(email) {
  for (let page = 1; page < 20; page++) {
    const r = await sb('GET', `/auth/v1/admin/users?page=${page}&per_page=200`);
    const list = (r.data && r.data.users) || [];
    const f = list.find(u => (u.email || '').toLowerCase() === email);
    if (f) return f;
    if (list.length < 200) return null;
  }
  return null;
}
async function ensureAdmin() {
  if (!ADMIN_LOGIN || !ADMIN_PASSWORD) { console.log('! ADMIN_LOGIN / ADMIN_PASSWORD не заданы — главный админ не создан'); return; }
  const email = loginToEmail(ADMIN_LOGIN);
  let u = await findUserByEmail(email);
  if (!u) {
    const r = await sb('POST', '/auth/v1/admin/users', { email, password: ADMIN_PASSWORD, email_confirm: true, app_metadata: { role: 'admin' }, user_metadata: { full_name: 'Главный администратор', login: ADMIN_LOGIN } });
    if (!r.ok) { console.log('! Не удалось создать админа:', JSON.stringify(r.data)); return; }
    u = r.data;
  } else {
    await sb('PUT', '/auth/v1/admin/users/' + u.id, { password: ADMIN_PASSWORD, email_confirm: true, app_metadata: { role: 'admin' } });
  }
  await sb('POST', '/rest/v1/profiles?on_conflict=id', { id: u.id, role: 'admin', login: ADMIN_LOGIN, full_name: 'Главный администратор' }, { Prefer: 'resolution=merge-duplicates,return=minimal' });
  console.log('✓ Главный администратор готов:', email);
}

// ---------- utils ----------
function send(res, code, obj, headers) { res.writeHead(code, Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, headers || {})); res.end(JSON.stringify(obj)); }
function readBody(req) { return new Promise((ok, no) => { let b = ''; req.on('data', c => { b += c; if (b.length > 1e6) { req.destroy(); no(new Error('big')); } }); req.on('end', () => { try { ok(b ? JSON.parse(b) : {}); } catch (e) { no(e); } }); }); }
const hits = new Map();
function limited(ip, key, max, ms) { const k = key + ip, now = Date.now(), a = (hits.get(k) || []).filter(t => now - t < ms); a.push(now); hits.set(k, a); return a.length > max; }
setInterval(() => { const now = Date.now(); for (const [k, a] of hits) if (!a.some(t => now - t < 3600e3)) hits.delete(k); }, 600e3).unref();
const clean = (s, n) => String(s == null ? '' : s).trim().slice(0, n || 200);
const strongEnough = (p) => typeof p === 'string' && p.length >= 6 && p.length <= 72;

// ---------- API ----------
async function api(req, res, url) {
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  if (!SB_URL || !SB_SERVICE) return send(res, 503, { error: 'Сервер не настроен (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)' });
  const p = url.pathname;

  // Регистрация туриста
  if (req.method === 'POST' && p === '/api/register') {
    if (limited(ip, 'reg', 10, 3600e3)) return send(res, 429, { error: 'Слишком много попыток. Попробуйте позже.' });
    const b = await readBody(req), login = clean(b.login, 120), name = clean(b.name, 80);
    if (!login || !name) return send(res, 400, { error: 'Заполните имя и телефон/почту' });
    if (!strongEnough(b.password)) return send(res, 400, { error: 'Пароль: от 6 символов' });
    const email = loginToEmail(login);
    if (email.endsWith('@owner.oshrest.local')) return send(res, 400, { error: 'Введите телефон или e-mail' });
    const phone = email.endsWith('@phone.oshrest.local') ? '+' + email.split('@')[0] : clean(b.phone, 30);
    const r = await sb('POST', '/auth/v1/admin/users', { email, password: b.password, email_confirm: true, app_metadata: { role: 'tourist' }, user_metadata: { full_name: name, login, phone } });
    if (!r.ok) return send(res, r.status === 422 ? 409 : 400, { error: r.status === 422 ? 'Такой аккаунт уже есть. Войдите.' : 'Не удалось зарегистрировать' });
    await setProfile(r.data.id, { role: 'tourist', login, full_name: name, phone });
    return send(res, 200, { ok: true });
  }

  // Забыл пароль (владелец объекта) -> заявка главному админу
  if (req.method === 'POST' && p === '/api/forgot') {
    if (limited(ip, 'fg', 5, 3600e3)) return send(res, 429, { error: 'Слишком много попыток.' });
    const b = await readBody(req), login = clean(b.login, 120), note = clean(b.note, 300);
    if (!login) return send(res, 400, { error: 'Укажите логин' });
    await sb('POST', '/rest/v1/password_requests', { login, note }, { Prefer: 'return=minimal' });
    if (RESEND_KEY && NOTIFY_EMAIL) {
      fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + RESEND_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: 'OshRest <onboarding@resend.dev>', to: [NOTIFY_EMAIL], subject: 'OshRest: запрос на сброс пароля', text: `Логин: ${login}\nКомментарий: ${note || '—'}\nОткройте панель главного администратора -> Запросы паролей.` }) }).catch(() => {});
    }
    return send(res, 200, { ok: true }); // всегда одинаковый ответ
  }

  // --- Только главный админ ---
  if (p.startsWith('/api/admin/')) {
    const me = await requireAdmin(req, res); if (!me) return;
    if (req.method === 'POST' && p === '/api/admin/owners') {
      const b = await readBody(req), login = clean(b.login, 60).toLowerCase();
      if (!/^[a-z0-9._-]{3,40}$/.test(login)) return send(res, 400, { error: 'Логин: 3–40 символов, латиница, цифры, . _ -' });
      if (!strongEnough(b.password)) return send(res, 400, { error: 'Пароль: от 6 символов' });
      const r = await sb('POST', '/auth/v1/admin/users', { email: login + '@owner.oshrest.local', password: b.password, email_confirm: true, app_metadata: { role: 'owner' }, user_metadata: { full_name: clean(b.name, 80), login, phone: clean(b.phone, 30) } });
      if (!r.ok) return send(res, r.status === 422 ? 409 : 400, { error: r.status === 422 ? 'Такой логин уже занят' : 'Не удалось создать' });
      await setProfile(r.data.id, { role: 'owner', login, full_name: clean(b.name, 80), phone: clean(b.phone, 30) });
      return send(res, 200, { ok: true, id: r.data.id });
    }
    let m;
    if (req.method === 'POST' && (m = /^\/api\/admin\/users\/([0-9a-f-]{36})\/password$/.exec(p))) {
      const b = await readBody(req); if (!strongEnough(b.password)) return send(res, 400, { error: 'Пароль: от 6 символов' });
      const r = await sb('PUT', '/auth/v1/admin/users/' + m[1], { password: b.password });
      return send(res, r.ok ? 200 : 400, r.ok ? { ok: true } : { error: 'Не удалось сменить пароль' });
    }
    if (req.method === 'DELETE' && (m = /^\/api\/admin\/users\/([0-9a-f-]{36})$/.exec(p))) {
      if (m[1] === me.id) return send(res, 400, { error: 'Нельзя удалить себя' });
      const r = await sb('DELETE', '/auth/v1/admin/users/' + m[1]);
      return send(res, r.ok ? 200 : 400, r.ok ? { ok: true } : { error: 'Не удалось удалить' });
    }
  }
  return send(res, 404, { error: 'Not found' });
}

// ---------- static ----------
function serveStatic(req, res, url) {
  let p = decodeURIComponent(url.pathname);
  if (p === '/owner' || p === '/admin') { res.writeHead(301, { Location: p + '/' }); return res.end(); }
  if (p.endsWith('/')) p += 'index.html';
  const f = path.normalize(path.join(PUB, p));
  if (!f.startsWith(PUB)) { res.writeHead(403); return res.end(); }
  fs.stat(f, (e, st) => {
    if (e || !st.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('404'); }
    const ext = path.extname(f), rev = /sw\.js$|\.html$|\.webmanifest$/.test(f);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': rev ? 'no-cache' : 'public, max-age=3600', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'Service-Worker-Allowed': '/' });
    fs.createReadStream(f).pipe(res);
  });
}

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://x');
    if (url.pathname === '/config.js') {
      res.writeHead(200, { 'Content-Type': MIME['.js'], 'Cache-Control': 'no-cache' });
      return res.end('window.OSH_CFG=' + JSON.stringify({ url: SB_URL, key: SB_ANON }) + ';');
    }
    if (url.pathname === '/healthz') { res.writeHead(200); return res.end('ok'); }
    if (url.pathname.startsWith('/api/')) return await api(req, res, url);
    serveStatic(req, res, url);
  } catch (e) { console.error(e); if (!res.headersSent) send(res, 500, { error: 'Server error' }); else res.end(); }
}).listen(PORT, () => { console.log('OshRest on :' + PORT); ensureAdmin().catch(e => console.log('! ensureAdmin', e.message)); });
