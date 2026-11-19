const crypto = require('crypto');
const axios = require('axios');

const POWERED_BY = '@KaluaApiAdmin · @KaluaApiStore';
const PLAN_MS = 86_400_000;
const RATE_LIMIT = 60;
const CACHE_TTL = 300_000;
const STALE_TTL = 86_400_000;
const PARAMS = ['number', 'num', 'mobile'];

const DATA = new Map();
const HITS = new Map();

const clean = (v) =>
  v == null
    ? ''
    : String(v)
        .replace(/[\u0000-\u001F\u007F]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

const clip = (s, n) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);

function queryOf(req) {
  if (req.query && typeof req.query === 'object') return req.query;
  try {
    return Object.fromEntries(new URL(req.url || '/', 'http://localhost').searchParams);
  } catch {
    return {};
  }
}

function setStatus(res, code) {
  if (typeof res.status === 'function') res.status(code);
  else res.statusCode = code;
}

function upstream() {
  const raw = String(process.env.NH_BASE || '').trim();
  if (!raw) return null;
  let key = String(process.env.NH_KEY || '').trim();
  let base = raw;
  try {
    const u = new URL(raw);
    if (!key) key = u.searchParams.get('key') || '';
    for (const p of [...PARAMS, 'key']) u.searchParams.delete(p);
    base = u.toString().replace(/\/+$/, '');
  } catch {
    base = raw.replace(/\/+$/, '');
  }
  return key ? { base, key } : null;
}

function expiry() {
  const e = Date.parse(String(process.env.NH_EXPIRES || '').trim());
  if (Number.isFinite(e)) return e;
  const s = Date.parse(String(process.env.NH_START || '').trim());
  return Number.isFinite(s) ? s + PLAN_MS : 0;
}

function allowIp(ip, now) {
  if (HITS.size > 5000) {
    for (const [k, v] of HITS) if (now > v.reset) HITS.delete(k);
  }
  const h = HITS.get(ip);
  if (!h || now > h.reset) {
    HITS.set(ip, { n: 1, reset: now + 60_000 });
    return { ok: true, left: RATE_LIMIT - 1 };
  }
  h.n += 1;
  return h.n > RATE_LIMIT ? { ok: false, left: 0 } : { ok: true, left: RATE_LIMIT - h.n };
}

const REC_KEY = /^(records?|data|result|results|response|list|items|rows)$/i;
const FIELD_KEY =
  /^(full_?name|name|father_?name|father|adres|address|document_?number|document_?no|doc_?number|id|phone\d*|mobile\d*|region\d*|circle|operator|network)$/i;

const isRec = (o) =>
  !!o &&
  typeof o === 'object' &&
  !Array.isArray(o) &&
  Object.keys(o).some((k) => FIELD_KEY.test(k));

function extract(data) {
  const out = [];
  const stack = [{ n: data, d: 0 }];
  while (stack.length) {
    const { n, d } = stack.pop();
    if (!n || d > 6) continue;
    if (Array.isArray(n)) {
      for (const it of n) isRec(it) ? out.push(it) : stack.push({ n: it, d: d + 1 });
    } else if (typeof n === 'object') {
      for (const [k, v] of Object.entries(n)) {
        if (isRec(v)) out.push(v);
        else if (Array.isArray(v) && REC_KEY.test(k)) {
          for (const it of v) if (isRec(it)) out.push(it);
        } else stack.push({ n: v, d: d + 1 });
      }
    }
  }
  return out;
}

function pick(rec, names) {
  const low = Object.fromEntries(Object.entries(rec).map(([k, v]) => [k.toLowerCase(), v]));
  for (const n of names) {
    const c = clean(low[n.toLowerCase()]);
    if (c) return c;
  }
  return '';
}

function addr(s) {
  if (!s) return '';
  const out = [];
  for (const p of clean(s)
    .split(/[!,;|]+/)
    .map((x) => x.trim())
    .filter(Boolean)) {
    if (!out.some((o) => o.toLowerCase() === p.toLowerCase())) out.push(p);
  }
  return clip(out.join(', '), 74);
}

function altNums(rec, self) {
  const set = new Set();
  for (const [k, v] of Object.entries(rec)) {
    if (/^(phone|mobile|alt_?number|other)\d*$/i.test(k)) {
      for (const n of clean(v).split(/\D+/)) {
        if (n.length >= 10 && n.slice(-10) !== self) set.add(n.slice(-10));
      }
    }
  }
  return [...set];
}

function nets(rec) {
  const set = new Set();
  for (const [k, v] of Object.entries(rec)) {
    if (/^(region|circle|operator|network)\d*$/i.test(k)) {
      for (const o of clean(v).split(/[;,]+/)) if (o.trim()) set.add(o.trim());
    }
  }
  return clip([...set].slice(0, 3).join(' · '), 38);
}

// Sirf available (non-empty) fields rakhta hai taaki output clean aur premium lage
function compactObj(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined || v === '') continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out;
}

async function fetchRaw(digits, up) {
  let lastErr = null;
  let okAny = false;
  for (const p of PARAMS) {
    const u = new URL(up.base);
    u.searchParams.set(p, digits);
    u.searchParams.set('key', up.key);
    try {
      const r = await axios.get(u.toString(), {
        timeout: 12_000,
        responseType: 'text',
        transformResponse: [(d) => d],
        validateStatus: (s) => s >= 200 && s < 500,
        headers: {
          'User-Agent': 'Mozilla/5.0',
          Accept: 'application/json, text/plain, */*',
        },
      });
      if (r.status >= 400) {
        lastErr = new Error('STATUS_' + r.status);
        continue;
      }
      okAny = true;
      let parsed;
      try {
        parsed = typeof r.data === 'string' ? JSON.parse(r.data) : r.data;
      } catch {
        parsed = r.data;
      }
      const recs = extract(parsed);
      if (recs.length) return recs;
    } catch (e) {
      lastErr = e;
    }
  }
  if (!okAny && lastErr) throw lastErr;
  return [];
}

function formatRecords(digits, raw) {
  const seen = new Set();
  const records = [];
  for (const rec of raw) {
    const name = pick(rec, ['FullName', 'full_name', 'Name', 'name']);
    const father = pick(rec, ['FatherName', 'father_name', 'Father', 'father']);
    const rawDoc = pick(rec, [
      'DocumentNumber',
      'document_number',
      'DocumentNo',
      'DocNumber',
      'Aadhaar',
      'ID',
      'id',
    ]);
    const doc = rawDoc && !/^x+$/i.test(rawDoc) ? rawDoc : '';
    const address = addr(pick(rec, ['Adres', 'Address', 'address', 'ADD', 'add']));
    const numbers = altNums(rec, digits);
    const network = nets(rec);

    const item = compactObj({
      name: name || undefined,
      father: father || undefined,
      id: doc || undefined,
      address: address || undefined,
      numbers,
      network: network || undefined,
    });

    if (!Object.keys(item).length) continue;

    const sig = `${(name || '').toLowerCase()}|${doc.toLowerCase()}|${address.toLowerCase()}`;
    if (seen.has(sig)) continue;
    seen.add(sig);

    if (records.length >= 25) break;
    records.push(item);
  }
  return records;
}

function reply(res, status, ok, message, data, pretty, head) {
  setStatus(res, status);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Powered-By', POWERED_BY);

  const payload = compactObj({
    ok,
    status,
    message,
    powered_by: POWERED_BY,
    data,
  });

  res.end(head ? undefined : JSON.stringify(payload, null, pretty ? 2 : 0));
}

module.exports = async (req, res) => {
  const q = queryOf(req);
  const pretty = String(q.pretty ?? '1') !== '0';
  const head = req.method === 'HEAD';

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') return setStatus(res, 204), res.end();
  if (!['GET', 'HEAD'].includes(req.method)) {
    return reply(res, 405, false, 'Method not allowed.', undefined, pretty, head);
  }

  const path = String(req.url || '/').split('?')[0].replace(/\/+$/, '') || '/';
  if (path.endsWith('/health')) {
    return reply(res, 200, true, 'Active.', { status: 'online' }, pretty, head);
  }

  const exp = expiry();
  const up = upstream();
  const now = Date.now();

  if (!exp || !up) {
    return reply(res, 503, false, 'Service unavailable.', undefined, pretty, head);
  }
  if (now >= exp) {
    return reply(res, 403, false, 'Plan expired.', undefined, pretty, head);
  }

  let mobile = q.mobile ?? q.number ?? q.num;
  if (Array.isArray(mobile)) mobile = mobile[0];
  if (!mobile) {
    const seg = path.split('/').filter(Boolean).pop() || '';
    if (/^\+?91\d{10}$|^\d{10}$/.test(seg)) mobile = seg;
  }
  if (!mobile) {
    return reply(res, 400, false, 'Number is required.', undefined, pretty, head);
  }

  let digits = String(mobile).replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  else if (digits.length > 10) digits = digits.slice(-10);

  if (!/^[6-9]\d{9}$/.test(digits)) {
    return reply(res, 422, false, 'Invalid mobile number.', undefined, pretty, head);
  }

  const ip =
    String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'anon';
  const rl = allowIp(String(ip), now);
  res.setHeader('X-RateLimit-Limit', String(RATE_LIMIT));
  res.setHeader('X-RateLimit-Remaining', String(rl.left));
  if (!rl.ok) {
    return reply(res, 429, false, 'Too many requests.', undefined, pretty, head);
  }

  const cached = DATA.get(digits);
  const okPayload = (records) =>
    compactObj({
      number: digits,
      e164: '+91' + digits,
      count: records.length,
      records: records.length ? records : undefined,
    });

  if (cached && now - cached.at < CACHE_TTL) {
    return reply(res, 200, true, 'Success.', okPayload(cached.records), pretty, head);
  }

  try {
    const records = formatRecords(digits, await fetchRaw(digits, up));
    if (!records.length) {
      return reply(
        res,
        404,
        false,
        'No record found.',
        { number: digits, e164: '+91' + digits, count: 0 },
        pretty,
        head,
      );
    }
    DATA.set(digits, { records, at: Date.now() });
    return reply(res, 200, true, 'Success.', okPayload(records), pretty, head);
  } catch (e) {
    if (cached && now - cached.at < STALE_TTL) {
      return reply(res, 200, true, 'Success.', okPayload(cached.records), pretty, head);
    }
    const timeout = e?.code === 'ECONNABORTED' || /timeout/i.test(String(e?.message || ''));
    return reply(
      res,
      timeout ? 504 : 502,
      false,
      timeout ? 'Request timed out.' : 'Service busy.',
      undefined,
      pretty,
      head,
    );
  }
};

module.exports.config = { maxDuration: 30 };
