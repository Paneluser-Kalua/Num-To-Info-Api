const axios = require('axios');

// ============================================================
// 💎 NUM HITEK — JSON API · by prime07
// ============================================================

const BASE = (process.env.NH_BASE || 'https://api-munix.wisp.uno/number').trim();
const KEY  = (process.env.NH_KEY  || 'MUNIX-eIV68Wj9rrzp7l52NV1KTKTh5eNrhm').trim();
const PARAMS = ['number', 'num', 'mobile'];
const TIMEOUT = 12000;
const DEMO_DAYS = 1;
const UPGRADE_MSG = 'pls upgrade premium by KaluaApiAdmin';

const pad2 = (n) => String(n).padStart(2, '0');
const stamp = (d) => `${pad2(d.getDate())}-${pad2(d.getMonth() + 1)}-${d.getFullYear()}`;

// ---------- tiny cache ----------
const CACHE = new Map();
const TTL = 5 * 60 * 1000;
const CACHE_MAX = 500;

function cacheGet(k) {
  const hit = CACHE.get(k);
  if (!hit) return null;
  if (Date.now() > hit.exp) { CACHE.delete(k); return null; }
  return hit.val;
}
function cacheSet(k, val) {
  if (CACHE.size >= CACHE_MAX) CACHE.delete(CACHE.keys().next().value);
  CACHE.set(k, { val, exp: Date.now() + TTL });
}

// ---------- schema-agnostic parsing ----------
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

const clean = (v) =>
  v == null ? '' : String(v).replace(/[\u0000-\u001F\u007F]+/g, ' ').replace(/\s+/g, ' ').trim();

const clip = (s, max) => (s.length > max ? s.slice(0, max - 1).trimEnd() + '…' : s);

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
  const parts = clean(s).split(/[!,;|]+/).map((p) => p.trim()).filter(Boolean);
  const out = [];
  for (const p of parts) {
    if (!out.some((o) => o.toLowerCase() === p.toLowerCase())) out.push(p);
  }
  return clip(out.join(', '), 74);
}

function numbers(rec, self) {
  const set = new Set();
  for (const [k, v] of Object.entries(rec)) {
    if (!/^(phone|mobile|alt_?number|other)\d*$/i.test(k)) continue;
    for (const n of clean(v).split(/\D+/)) {
      if (n.length >= 10) {
        const t = n.slice(-10);
        if (t !== self) set.add(t);
      }
    }
  }
  return [...set];
}

function nets(rec) {
  const set = new Set();
  for (const [k, v] of Object.entries(rec)) {
    if (!/^(region|circle|operator|network)\d*$/i.test(k)) continue;
    for (const o of clean(v).split(/[;,]+/)) {
      const t = o.trim();
      if (t) set.add(t);
    }
  }
  return clip([...set].slice(0, 3).join(' · '), 38);
}

async function fetchRecords(digits) {
  let lastErr = null;
  for (const param of PARAMS) {
    const url = new URL(BASE);
    url.searchParams.set(param, digits);
    url.searchParams.set('key', KEY);

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
        },
      });

      let data;
      try { data = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { data = raw; }

      const records = extractRecords(data);
      if (records.length) return records;
    } catch (err) {
      lastErr = err;
    }
  }
  if (lastErr) throw lastErr;
  return [];
}

// ============================================================

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') return res.status(204).end();

  let mobile = req.query.mobile;
  if (Array.isArray(mobile)) mobile = mobile[0];

  if (!mobile) {
    return res.status(400).json({
      ok: false,
      error: 'Number is missing.',
      usage: '/api/lookup?mobile=9876543210',
      message: UPGRADE_MSG
    });
  }

  let digits = String(mobile).replace(/\D/g, '');
  if (digits.length > 10) digits = digits.slice(-10);

  if (!/^[6-9]\d{9}$/.test(digits)) {
    return res.status(400).json({
      ok: false,
      error: 'Number must be 10 digits, starting 6-9.',
      usage: '/api/lookup?mobile=9876543210',
      message: UPGRADE_MSG
    });
  }

  const cached = cacheGet(digits);
  if (cached) {
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(cached.status).json(cached.report);
  }

  try {
    const rawRecords = await fetchRecords(digits);
    const records = [];
    const seen = new Set();

    for (const rec of rawRecords) {
      const name = pick(rec, ['FullName', 'full_name', 'Name', 'name']) || 'UNKNOWN';
      const father = pick(rec, ['FatherName', 'father_name', 'Father', 'father']);
      const doc = pick(rec, ['DocumentNumber', 'document_number', 'DocumentNo', 'DocNumber', 'Aadhaar', 'ID', 'id']);
      const address = addr(pick(rec, ['Adres', 'Address', 'address', 'ADD', 'add']));
      const nums = numbers(rec, digits);
      const network = nets(rec);

      const sig = `${name.toLowerCase()}|${doc}`;
      if (seen.has(sig)) continue;
      seen.add(sig);

      records.push({
        name,
        father,
        id: doc && !/^x+$/i.test(doc) ? doc : '',
        address,
        numbers: nums,
        network,
      });
    }

    if (!records.length) {
      res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
      const badResponse = {
        ok: false,
        error: 'No record found for this number.',
        message: UPGRADE_MSG
      };
      cacheSet(digits, { status: 404, report: badResponse });
      return res.status(404).json(badResponse);
    }

    const report = {
      ok: true,
      number: digits,
      demo_days: `${DEMO_DAYS} Day`,
      expires: stamp(new Date(Date.now() + DEMO_DAYS * 86_400_000)),
      count: records.length,
      records,
      message: UPGRADE_MSG
    };

    cacheSet(digits, { status: 200, report });
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json(report);
  } catch (err) {
    res.setHeader('Cache-Control', 's-maxage=30');
    const msg =
      err.code === 'ECONNABORTED' || /timeout/i.test(err.message)
        ? 'Timeout. Please try again.'
        : err.response
          ? 'Server busy. Please try again.'
          : 'Temporary failure. Please try again.';

    return res.status(502).json({
      ok: false,
      error: msg,
      message: UPGRADE_MSG
    });
  }
};

module.exports.config = { maxDuration: 30 };
