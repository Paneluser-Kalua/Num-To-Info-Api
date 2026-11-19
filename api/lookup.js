const crypto = require('crypto');
const axios = require('axios');

// ═══════════════════════════════════════════════════════════
//  NUM HITEK API · 1 Day · ₹6 · by prime07
// ═══════════════════════════════════════════════════════════

// ── private (drop the || fallbacks if repo is public) ──
const BASE = (process.env.NH_BASE || 'https://api-munix.wisp.uno/number').trim();
const UP_KEY = (process.env.NH_KEY || 'MUNIX-eIV68Wj9rrzp7l52NV1KTKTh5eNrhm').trim();

const SERVICE = 'NUM HITEK';
const VERSION = '1';
const OWNER = 'prime07';

const PLAN_HOURS = 24;
const PLAN_PRICE_INR = 6;
const PLAN_NAME = '1 Day';

const TIMEOUT = 12_000;
const RATE_LIMIT = 60;
const RATE_WINDOW = 60_000;
const MAX_RECORDS = 25;
const CACHE_TTL = 5 * 60_000;
const STALE_TTL = 24 * 3600_000;
const PARAMS = ['number', 'num', 'mobile'];
const ADD_MAX = 74;
const NET_MAX = 38;

// ── store ──
const KV_URL = process.env.KV_REST_API_URL || '';
const KV_TOKEN = process.env.KV_REST_API_TOKEN || '';
const USE_KV = !!(KV_URL && KV_TOKEN);

const MEM = new Map();
const DATA = new Map();
const HITS = new Map();
let seeded = false;

function seed() {
  if (seeded) return;
  seeded = true;
  try {
    const raw = process.env.NH_CLIENTS;
    if (!raw) return;
    for (const [k, v] of Object.entries(JSON.parse(raw))) {
      const exp = typeof v === 'string' ? v : v && v.expires_at;
      if (!exp) continue;
      MEM.set(k, {
        key: k,
        label: (v && v.label) || '',
        created_at: new Date().toISOString(),
        expires_at: exp,
        hits: 0,
      });
    }
  } catch {}
}

async function kv(cmd) {
  const r = await fetch(`${KV_URL}/${cmd.map((c) => encodeURIComponent(c)).join('/')}`, {
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
  });
  if (!r.ok) throw new Error('store');
  return r.json();
}

async function readKey(k) {
  if (USE_KV) {
    const j = await kv(['get', `nh:key:${k}`]);
    return j && j.result ? JSON.parse(j.result) : null;
  }
  return MEM.get(k) || null;
}

async function writeKey(rec) {
  if (USE_KV) return void (await kv(['set', `nh:key:${rec.key}`, JSON.stringify(rec)]));
  MEM.set(rec.key, rec);
}

async function listKeys() {
  if (!USE_KV) return [...MEM.values()];
  const found = [];
  let cursor = '0';
  do {
    const j = await kv(['scan', cursor, 'match', 'nh:key:*', 'count', '200']);
    cursor = String(j.cursor);
    for (const k of j.result || []) {
      const g = await kv(['get', k]);
      if (g.result) found.push(JSON.parse(g.result));
      if (found.length >= 2000) return found;
    }
  } while (cursor !== '0');
  return found;
}

// ── util ──
const clean = (v) =>
  v == null ? '' : String(v).replace(/[\u0000-\u001F\u007F]+/g, ' ').replace(/\s+/g, ' ').trim();
const clip = (s, max) => (s.length > max ? s.slice(0, max - 1).trimEnd() + '…' : s);
const rid = () => crypto.randomBytes(8).toString('hex');
const iso = (ms) => new Date(ms).toISOString();
const safeEq = (a, b) => {
  const A = Buffer.from(String(a));
  const B = Buffer.from(String(b));
  return A.length === B.length && crypto.timingSafeEqual(A, B);
};

function limited(k) {
  const now = Date.now();
  const h = HITS.get(k);
  if (!h || now > h.reset) {
    HITS.set(k, { n: 1, reset: now + RATE_WINDOW });
    return { ok: true, left: RATE_LIMIT - 1, reset: RATE_WINDOW };
  }
  h.n += 1;
  if (h.n > RATE_LIMIT) return { ok: false, left: 0, reset: h.reset - now };
  return { ok: true, left: RATE_LIMIT - h.n, reset: h.reset - now };
}

// ── parsing: raw shape never leaves the module ──
const REC_KEY = /^(records?|data|result|results|response|list|items|rows)$/i;
const FIELD_KEY =
  /^(full_?name|name|father_?name|father|adres|address|document_?number|document_?no|doc_?number|id|phone\d*|mobile\d*|region\d*|circle|operator|network)$/i;
const looksLikeRecord = (o) =>
  !!o && typeof o === 'object' && !Array.isArray(o) && Object.keys(o).some((k) => FIELD_KEY.test(k));

function extractRecords(data) {
  const out = [];
  const stack = [{ n: data, d: 0 }];
  while (stack.length) {
    const { n, d } = stack.pop();
    if (!n || d > 6) continue;
    if (Array.isArray(n)) {
      for (const it of n) looksLikeRecord(it) ? out.push(it) : stack.push({ n: it, d: d + 1 });
      continue;
    }
    if (typeof n !== 'object') continue;
    for (const [k, v] of Object.entries(n)) {
      if (looksLikeRecord(v)) out.push(v);
      else if (Array.isArray(v) && REC_KEY.test(k)) {
        for (const it of v) if (looksLikeRecord(it)) out.push(it);
      } else stack.push({ n: v, d: d + 1 });
    }
  }
  return out;
}

function pick(rec, names) {
  const lower = {};
  for (const [k, v] of Object.entries(rec)) lower[k.toLowerCase()] = v;
  for (const n of names) {
    const c = clean(lower[n.toLowerCase()]);
    if (c) return c;
  }
  return '';
}

function addr(s) {
  if (!s) return '';
  const out = [];
  for (const p of clean(s).split(/[!,;|]+/).map((x) => x.trim()).filter(Boolean)) {
    if (!out.some((o) => o.toLowerCase() === p.toLowerCase())) out.push(p);
  }
  return clip(out.join(', '), ADD_MAX);
}

function numbers(rec, self) {
  const set = new Set();
  for (const [k, v] of Object.entries(rec)) {
    if (!/^(phone|mobile|alt_?number|other)\d*$/i.test(k)) continue;
    for (const n of clean(v).split(/\D+/)) {
      if (n.length >= 10 && n.slice(-10) !== self) set.add(n.slice(-10));
    }
  }
  return [...set];
}

function nets(rec) {
  const set = new Set();
  for (const [k, v] of Object.entries(rec)) {
    if (!/^(region|circle|operator|network)\d*$/i.test(k)) continue;
    for (const o of clean(v).split(/[;,]+/)) if (o.trim()) set.add(o.trim());
  }
  return clip([...set].slice(0, 3).join(' · '), NET_MAX);
}

async function fetchRecords(digits) {
  let lastErr = null;
  for (const param of PARAMS) {
    const url = new URL(BASE);
    url.searchParams.set(param, digits);
    url.searchParams.set('key', UP_KEY);
    try {
      const { data: raw } = await axios.get(url.toString(), {
        timeout: TIMEOUT,
        responseType: 'text',
        transformResponse: [(d) => d],
        maxContentLength: 20_000_000,
        validateStatus: (s) => s < 500,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          Accept: 'application/json, text/plain, */*',
          'Accept-Encoding': 'gzip, deflate, br',
        },
      });
      let data;
      try {
        data = typeof raw === 'string' ? JSON.parse(raw) : raw;
      } catch {
        data = raw;
      }
      const records = extractRecords(data);
      if (records.length) return records;
    } catch (err) {
      lastErr = err;
    }
  }
  if (lastErr) throw lastErr;
  return [];
}

function build(digits, raw) {
  const seen = new Set();
  const records = [];
  for (const rec of raw) {
    const name = pick(rec, ['FullName', 'full_name', 'Name', 'name']) || 'UNKNOWN';
    const doc = pick(rec, ['DocumentNumber', 'document_number', 'DocumentNo', 'DocNumber', 'Aadhaar', 'ID', 'id']);
    const sig = `${name.toLowerCase()}|${doc}`;
    if (seen.has(sig)) continue;
    seen.add(sig);
    if (records.length >= MAX_RECORDS) break;
    records.push({
      name,
      father: pick(rec, ['FatherName', 'father_name', 'Father', 'father']) || null,
      id: doc && !/^x+$/i.test(doc) ? doc : null,
      address: addr(pick(rec, ['Adres', 'Address', 'address', 'ADD', 'add'])) || null,
      numbers: numbers(rec, digits),
      network: nets(rec) || null,
    });
  }
  return { records, truncated: raw.length > records.length };
}

// ── response ──
function send(res, status, code, message, extra, id) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Service', SERVICE);
  res.setHeader('X-Api-Version', VERSION);
  res.setHeader('X-Request-Id', id);
  const body = JSON.stringify(
    {
      ok: status < 400,
      status,
      code,
      message,
      service: SERVICE,
      version: VERSION,
      request_id: id,
      timestamp: iso(Date.now()),
      ...(extra || {}),
    },
    null,
    res.pretty ? 2 : 0,
  );
  res.end(res.headOnly ? undefined : body);
}

function docs(res, id) {
  res.pretty = true;
  return send(res, 200, 'OK', 'Service documentation.', {
    owner: OWNER,
    description: 'Indian mobile number intelligence — carrier, circle, address and linked numbers in one call.',
    plans: [{ name: PLAN_NAME, price_inr: PLAN_PRICE_INR, duration_hours: PLAN_HOURS, expiry: 'exact, no grace' }],
    auth: { type: 'api_key', location: 'query', param: 'key', prefix: 'NH-' },
    endpoints: [
      {
        method: 'GET',
        path: '/api/lookup',
        params: { key: 'required', mobile: 'required · 10 digits · 6-9 start' },
        rate_limit: `${RATE_LIMIT}/min per key`,
        cache: `5 min fresh, 24 h stale fallback`,
        max_records: MAX_RECORDS,
        sample: {
          ok: true,
          status: 200,
          code: 'OK',
          data: {
            number: '9876543210',
            e164: '+919876543210',
            count: 1,
            records: [{ name: 'XXXXX', father: 'XXXXX', address: 'XXXXX', numbers: ['XXXXXXXXXX'], network: 'XXXXX' }],
          },
        },
      },
    ],
    errors: {
      400: ['NUMBER_REQUIRED'],
      401: ['KEY_REQUIRED', 'KEY_INVALID', 'KEY_EXPIRED', 'KEY_REVOKED'],
      404: ['NO_RECORD'],
      405: ['METHOD_NOT_ALLOWED'],
      422: ['NUMBER_INVALID'],
      429: ['RATE_LIMITED'],
      502: ['SERVICE_BUSY'],
      504: ['LOOKUP_TIMEOUT'],
    },
    error_shape: { ok: false, status: 401, code: 'KEY_EXPIRED', message: 'Plan expired. Renew to continue.' },
  }, id);
}

// ── admin ──
async function adminGate(req, res, id) {
  const given = String(req.query.admin || req.headers['x-admin-key'] || '');
  const secret = String(process.env.NH_ADMIN || '');
  if (!secret) {
    send(res, 503, 'SERVICE_MISCONFIGURED', 'Service not configured yet.', null, id);
    return false;
  }
  if (!given || !safeEq(given, secret)) {
    send(res, 401, 'ADMIN_INVALID', 'Invalid admin secret.', null, id);
    return false;
  }
  return true;
}

async function mint(req, res, id) {
  if (!(await adminGate(req, res, id))) return;
  const hours = Math.min(Math.max(parseInt(req.query.hours, 10) || PLAN_HOURS, 1), 24 * 30);
  const label = clip(clean(req.query.label).replace(/[^A-Za-z0-9 _-]/g, '') || 'client', 32);
  const now = Date.now();
  const rec = {
    key: 'NH-' + crypto.randomBytes(18).toString('base64url'),
    label,
    created_at: iso(now),
    expires_at: iso(now + hours * 3600_000),
    hits: 0,
  };
  await writeKey(rec);
  return send(res, 201, 'KEY_CREATED', 'Client key created.', {
    data: { key: rec.key, label, plan: PLAN_NAME, price_inr: PLAN_PRICE_INR, created_at: rec.created_at, expires_at: rec.expires_at, duration_hours: hours },
  }, id);
}

async function revoke(req, res, id) {
  if (!(await adminGate(req, res, id))) return;
  let key = req.query.key;
  if (Array.isArray(key)) key = key[0];
  key = clean(key);
  if (!key) return send(res, 400, 'KEY_REQUIRED', 'Target "key" required.', null, id);
  const rec = await readKey(key);
  if (!rec) return send(res, 404, 'KEY_INVALID', 'Unknown API key.', null, id);
  rec.revoked_at = iso(Date.now());
  await writeKey(rec);
  return send(res, 200, 'KEY_REVOKED', 'Key revoked.', { data: { key, revoked_at: rec.revoked_at } }, id);
}

async function stats(req, res, id) {
  if (!(await adminGate(req, res, id))) return;
  const now = Date.now();
  const all = await listKeys();
  let active = 0;
  let expired = 0;
  let revoked = 0;
  let hits = 0;
  for (const r of all) {
    hits += r.hits || 0;
    if (r.revoked_at) revoked++;
    else if (Date.parse(r.expires_at) > now) active++;
    else expired++;
  }
  return send(res, 200, 'OK', 'Store statistics.', {
    data: { total: all.length, active, expired, revoked, total_requests: hits },
  }, id);
}

// ═══════════════════════════════════════════════════════════

module.exports = async (req, res) => {
  const id = rid();
  res.pretty = String(req.query.pretty ?? '1') !== '0';
  res.headOnly = req.method === 'HEAD';

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Key');
  res.setHeader(
    'Access-Control-Expose-Headers',
    'X-Service, X-Api-Version, X-Request-Id, X-Cache, X-Client-Label, X-Plan-Expires-At, X-Plan-Remaining, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset',
  );
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!['GET', 'HEAD', 'POST'].includes(req.method)) {
    res.setHeader('Allow', 'GET, HEAD, POST, OPTIONS');
    return send(res, 405, 'METHOD_NOT_ALLOWED', 'Method not allowed.', null, id);
  }

  seed();

  const path = String(req.url || '').split('?')[0];
  const action = String(req.query.action || '').toLowerCase();

  if (path.endsWith('/docs') || path === '/' || action === 'docs') return docs(res, id);
  if (path.endsWith('/mint') || action === 'mint') return mint(req, res, id);
  if (path.endsWith('/revoke') || action === 'revoke') return revoke(req, res, id);
  if (path.endsWith('/stats') || action === 'stats') return stats(req, res, id);

  // ── auth ──
  let key = req.query.key;
  if (Array.isArray(key)) key = key[0];
  key = clean(key);

  if (!key) {
    return send(res, 401, 'KEY_REQUIRED', 'API key required.', {
      hint: '/api/lookup?key=NH-xxxxxxxx&mobile=9876543210',
      docs: '/api/docs',
    }, id);
  }

  let client;
  try {
    client = await readKey(key);
  } catch {
    return send(res, 503, 'SERVICE_BUSY', 'Service busy. Retry shortly.', null, id);
  }

  if (!client) return send(res, 401, 'KEY_INVALID', 'Unknown API key.', { docs: '/api/docs' }, id);
  if (client.revoked_at) {
    return send(res, 401, 'KEY_REVOKED', 'Key revoked.', { revoked_at: client.revoked_at }, id);
  }

  const expMs = Date.parse(client.expires_at);
  const now = Date.now();
  if (!(expMs > now)) {
    res.setHeader('X-Plan-Expires-At', client.expires_at);
    return send(res, 401, 'KEY_EXPIRED', 'Plan expired. Renew to continue.', {
      expired_at: client.expires_at,
      expired_seconds_ago: Math.max(0, Math.floor((now - expMs) / 1000)),
    }, id);
  }

  const rl = limited(key);
  res.setHeader('X-RateLimit-Limit', String(RATE_LIMIT));
  res.setHeader('X-RateLimit-Remaining', String(rl.left));
  res.setHeader('X-RateLimit-Reset', String(Math.ceil(rl.reset / 1000)));
  if (!rl.ok) {
    res.setHeader('Retry-After', String(Math.ceil(rl.reset / 1000)));
    return send(res, 429, 'RATE_LIMITED', 'Too many requests. Slow down.', null, id);
  }

  const remaining = Math.max(0, Math.ceil((expMs - now) / 1000));
  res.setHeader('X-Client-Label', client.label || 'client');
  res.setHeader('X-Plan-Expires-At', client.expires_at);
  res.setHeader('X-Plan-Remaining', String(remaining));

  // ── input ──
  let mobile = req.query.mobile;
  if (Array.isArray(mobile)) mobile = mobile[0];

  if (!mobile) {
    return send(res, 400, 'NUMBER_REQUIRED', 'Query param "mobile" is required.', {
      hint: '/api/lookup?key=NH-xxxxxxxx&mobile=9876543210',
    }, id);
  }

  let digits = String(mobile).replace(/\D/g, '');
  if (digits.length > 10) digits = digits.slice(-10);
  if (!/^[6-9]\d{9}$/.test(digits)) {
    return send(res, 422, 'NUMBER_INVALID', 'Number must be 10 digits, starting 6-9.', null, id);
  }

  const plan = {
    name: PLAN_NAME,
    price_inr: PLAN_PRICE_INR,
    expires_at: client.expires_at,
    remaining_seconds: remaining,
  };

  // ── cache ──
  const cached = DATA.get(digits);
  const fresh = cached && now - cached.at < CACHE_TTL;

  if (fresh) {
    res.setHeader('X-Cache', 'HIT');
    return send(res, 200, 'OK', 'Report generated.', {
      plan,
      usage: { requests_used: client.hits || 0, rate_limit: RATE_LIMIT },
      cache: 'hit',
      data: { ...cached.report, number: digits, e164: '+91' + digits },
    }, id);
  }

  // ── work ──
  const started = Date.now();
  let result;
  let cacheState = 'miss';

  try {
    const raw = await fetchRecords(digits);
    result = build(digits, raw);
    if (result.records.length) DATA.set(digits, { report: result, at: Date.now() });
  } catch (err) {
    if (cached && now - cached.at < STALE_TTL) {
      res.setHeader('X-Cache', 'STALE');
      return send(res, 200, 'OK', 'Report served from cache.', {
        plan,
        usage: { requests_used: client.hits || 0, rate_limit: RATE_LIMIT },
        cache: 'stale',
        data: { ...cached.report, number: digits, e164: '+91' + digits },
      }, id);
    }
    const timeout = err.code === 'ECONNABORTED' || /timeout/i.test(err.message);
    return send(res, timeout ? 504 : 502, timeout ? 'LOOKUP_TIMEOUT' : 'SERVICE_BUSY', timeout ? 'Lookup timed out. Retry.' : 'Service busy. Retry.', {
      latency_ms: Date.now() - started,
    }, id);
  }

  res.setHeader('X-Cache', 'MISS');

  if (!result.records.length) {
    return send(res, 404, 'NO_RECORD', 'No record found for this number.', {
      data: { number: digits, e164: '+91' + digits, count: 0, records: [] },
    }, id);
  }

  client.hits = (client.hits || 0) + 1;
  writeKey(client).catch(() => {});

  return send(res, 200, 'OK', 'Report generated.', {
    plan,
    usage: { requests_used: client.hits, rate_limit: RATE_LIMIT },
    cache: cacheState,
    latency_ms: Date.now() - started,
    data: {
      number: digits,
      e164: '+91' + digits,
      plan_days: 1,
      expires_at: iso(Date.now() + 86_400_000),
      count: result.records.length,
      truncated: result.truncated,
      records: result.records,
    },
  }, id);
};

module.exports.config = { maxDuration: 30 };
