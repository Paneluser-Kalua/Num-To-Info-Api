const crypto = require('crypto');
const axios = require('axios');

// ═══════════════════════════════════════════════════════════
//  NUM HITEK API · 1 Day · ₹6
//  Powered by @KaluaApiAdmin · Channel: @KaluaApiStore
// ═══════════════════════════════════════════════════════════

const SERVICE = 'NUM HITEK';
const VERSION = '1';
const PRICE_INR = 6;
const PLAN_NAME = '1 Day';
const PLAN_MS = 86_400_000;

const POWERED_BY = '@KaluaApiAdmin';
const CHANNEL = '@KaluaApiStore';
const CHANNEL_URL = 'https://t.me/KaluaApiStore';
const LICENSEE = 'prime07';

const TIMEOUT = 12_000;
const RATE_LIMIT = 60;
const RATE_WINDOW = 60_000;
const MAX_RECORDS = 25;
const CACHE_TTL = 5 * 60_000;
const STALE_TTL = 24 * 3600_000;
const PARAMS = ['number', 'num', 'mobile'];
const ADD_MAX = 74;
const NET_MAX = 38;

// ── upstream: env only ──
function resolveUpstream() {
  const raw = String(process.env.NH_BASE || '').trim();
  if (!raw) return null;

  let key = String(process.env.NH_KEY || '').trim();
  let base = raw;

  try {
    const u = new URL(raw);
    if (!key) key = u.searchParams.get('key') || '';
    for (const p of [...PARAMS, 'key']) u.searchParams.delete(p);
    base = u.toString().replace(/\/$/, '');
  } catch {
    base = raw;
  }

  return key ? { base, key } : null;
}

// ── hard expiry ──
function expiryMs() {
  const e = Date.parse(process.env.NH_EXPIRES || '');
  if (Number.isFinite(e)) return e;
  const s = Date.parse(process.env.NH_START || '');
  if (Number.isFinite(s)) return s + PLAN_MS;
  return 0;
}

// ── runtime ──
const DATA = new Map();
const HITS = new Map();

const clean = (v) => (v == null ? '' : String(v).replace(/[\u0000-\u001F\u007F]+/g, ' ').replace(/\s+/g, ' ').trim());
const clip = (s, max) => (s.length > max ? s.slice(0, max - 1).trimEnd() + '…' : s);
const rid = () => crypto.randomBytes(8).toString('hex');
const iso = (ms) => new Date(ms).toISOString();

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

// ── parsing ──
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
      for (const it of n) (looksLikeRecord(it) ? out.push(it) : stack.push({ n: it, d: d + 1 }));
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
    for (const n of clean(v).split(/\D+/)) if (n.length >= 10 && n.slice(-10) !== self) set.add(n.slice(-10));
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

async function fetchRecords(digits, up) {
  let lastErr = null;
  for (const param of PARAMS) {
    const url = new URL(up.base);
    url.searchParams.set(param, digits);
    url.searchParams.set('key', up.key);
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
const brand = () => ({ powered_by: POWERED_BY, channel: CHANNEL, channel_url: CHANNEL_URL });

function licence(exp) {
  return {
    licensee: LICENSEE,
    issued_by: POWERED_BY,
    plan: PLAN_NAME,
    price_inr: PRICE_INR,
    issued_at: exp ? iso(exp - PLAN_MS) : null,
    expires_at: exp ? iso(exp) : null,
    notice: 'Single-client licence. Not for resale or redistribution.',
  };
}

function send(res, status, code, message, extra, id) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Service', SERVICE);
  res.setHeader('X-Api-Version', VERSION);
  res.setHeader('X-Powered-By', POWERED_BY);
  res.setHeader('X-Telegram-Channel', CHANNEL);
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
      brand: brand(),
      ...(extra || {}),
    },
    null,
    res.pretty ? 2 : 0,
  );
  res.end(res.headOnly ? undefined : body);
}

function docs(res, id, exp) {
  res.pretty = true;
  const remaining = exp ? Math.max(0, Math.floor((exp - Date.now()) / 1000)) : null;
  return send(res, 200, 'OK', 'Service documentation.', {
    description: 'Indian mobile number intelligence — carrier, circle, address and linked numbers in one call.',
    licence: licence(exp),
    plan: {
      name: PLAN_NAME,
      price_inr: PRICE_INR,
      duration_hours: 24,
      remaining_seconds: remaining,
      expiry: 'exact to the millisecond, no grace period',
    },
    endpoints: [
      { method: 'GET', path: '/:mobile', note: 'shortest form' },
      { method: 'GET', path: '/api/lookup/:mobile', note: 'canonical form' },
      { method: 'GET', path: '/api/lookup', params: { mobile: 'required · 10 digits · 6-9 start' } },
      { method: 'GET', path: '/api/health' },
    ],
    limits: { rate_limit: `${RATE_LIMIT}/min per IP`, cache: '5 min fresh · 24 h stale fallback', max_records: MAX_RECORDS },
    sample: {
      ok: true,
      status: 200,
      code: 'OK',
      data: { number: '9876543210', e164: '+919876543210', count: 1, records: [{ name: 'XXXXX', address: 'XXXXX', network: 'XXXXX' }] },
    },
    errors: {
      400: ['NUMBER_REQUIRED'],
      403: ['API_EXPIRED'],
      404: ['NO_RECORD'],
      405: ['METHOD_NOT_ALLOWED'],
      422: ['NUMBER_INVALID'],
      429: ['RATE_LIMITED'],
      502: ['SERVICE_BUSY'],
      504: ['LOOKUP_TIMEOUT'],
    },
    renew: { via: POWERED_BY, channel: CHANNEL_URL },
  }, id);
}

// ═══════════════════════════════════════════════════════════

module.exports = async (req, res) => {
  const id = rid();
  res.pretty = String(req.query.pretty ?? '1') !== '0';
  res.headOnly = req.method === 'HEAD';

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader(
    'Access-Control-Expose-Headers',
    'X-Service, X-Api-Version, X-Powered-By, X-Telegram-Channel, X-Request-Id, X-Cache, X-Api-Expires-At, X-Api-Remaining, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset',
  );
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.setHeader('Allow', 'GET, HEAD, OPTIONS');
    return send(res, 405, 'METHOD_NOT_ALLOWED', 'Method not allowed.', null, id);
  }

  const path = String(req.url || '').split('?')[0].replace(/\/+$/, '') || '/';
  const action = String(req.query.action || '').toLowerCase();

  const exp = expiryMs();

  if (path.endsWith('/docs') || action === 'docs') return docs(res, id, exp);
  if (path.endsWith('/health') || action === 'health')
    return send(res, 200, 'OK', 'Service healthy.', {
      data: {
        uptime_s: Math.floor(process.uptime()),
        expires_at: exp ? iso(exp) : null,
        remaining_seconds: exp ? Math.max(0, Math.floor((exp - Date.now()) / 1000)) : null,
      },
    }, id);

  if (!exp) return send(res, 503, 'SERVICE_MISCONFIGURED', 'Service not configured yet.', null, id);

  const now = Date.now();

  // exact cut — no grace, not one extra minute
  if (now >= exp) {
    res.setHeader('X-Api-Expires-At', iso(exp));
    return send(res, 403, 'API_EXPIRED', 'Plan expired. Renew to continue.', {
      expired_at: iso(exp),
      expired_seconds_ago: Math.floor((now - exp) / 1000),
      renew: { via: POWERED_BY, channel: CHANNEL_URL },
    }, id);
  }

  const remaining = Math.ceil((exp - now) / 1000);
  res.setHeader('X-Api-Expires-At', iso(exp));
  res.setHeader('X-Api-Remaining', String(remaining));

  // ── number: path or query ──
  let mobile = req.query.mobile;
  if (Array.isArray(mobile)) mobile = mobile[0];

  if (!mobile) {
    const seg = path.split('/').filter(Boolean).pop() || '';
    if (/^\+?\d{10,13}$/.test(seg)) mobile = seg;
  }

  if (!mobile) return docs(res, id, exp);

  let digits = String(mobile).replace(/\D/g, '');
  if (digits.length > 10) digits = digits.slice(-10);
  if (!/^[6-9]\d{9}$/.test(digits)) return send(res, 422, 'NUMBER_INVALID', 'Number must be 10 digits, starting 6-9.', null, id);

  // ── rate limit per IP ──
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'anon';
  const rl = limited(ip);
  res.setHeader('X-RateLimit-Limit', String(RATE_LIMIT));
  res.setHeader('X-RateLimit-Remaining', String(rl.left));
  res.setHeader('X-RateLimit-Reset', String(Math.ceil(rl.reset / 1000)));
  if (!rl.ok) {
    res.setHeader('Retry-After', String(Math.ceil(rl.reset / 1000)));
    return send(res, 429, 'RATE_LIMITED', 'Too many requests. Slow down.', null, id);
  }

  const up = resolveUpstream();
  if (!up) return send(res, 503, 'SERVICE_MISCONFIGURED', 'Service not configured yet.', null, id);

  const plan = { name: PLAN_NAME, price_inr: PRICE_INR, expires_at: iso(exp), remaining_seconds: remaining };
  const cached = DATA.get(digits);

  if (cached && now - cached.at < CACHE_TTL) {
    res.setHeader('X-Cache', 'HIT');
    return send(res, 200, 'OK', 'Report generated.', {
      licence: licence(exp),
      plan,
      cache: 'hit',
      data: { ...cached.report, number: digits, e164: '+91' + digits },
    }, id);
  }

  const started = Date.now();
  let result;

  try {
    result = build(digits, await fetchRecords(digits, up));
    if (result.records.length) DATA.set(digits, { report: result, at: Date.now() });
  } catch (err) {
    if (cached && now - cached.at < STALE_TTL) {
      res.setHeader('X-Cache', 'STALE');
      return send(res, 200, 'OK', 'Report served from cache.', {
        licence: licence(exp),
        plan,
        cache: 'stale',
        data: { ...cached.report, number: digits, e164: '+91' + digits },
      }, id);
    }
    const timeout = err.code === 'ECONNABORTED' || /timeout/i.test(err.message);
    return send(res, timeout ? 504 : 502, timeout ? 'LOOKUP_TIMEOUT' : 'SERVICE_BUSY', timeout ? 'Lookup timed out. Retry.' : 'Service busy. Retry.', {
      latency_ms: Date.now() - started,
    }, id);
  }

  if (!result.records.length) {
    return send(res, 404, 'NO_RECORD', 'No record found for this number.', {
      licence: licence(exp),
      data: { number: digits, e164: '+91' + digits, count: 0, records: [] },
    }, id);
  }

  res.setHeader('X-Cache', 'MISS');
  return send(res, 200, 'OK', 'Report generated.', {
    licence: licence(exp),
    plan,
    cache: 'miss',
    latency_ms: Date.now() - started,
    data: {
      number: digits,
      e164: '+91' + digits,
      plan_days: 1,
      expires_at: iso(exp),
      count: result.records.length,
      truncated: result.truncated,
      records: result.records,
    },
  }, id);
};

module.exports.config = { maxDuration: 30 };
