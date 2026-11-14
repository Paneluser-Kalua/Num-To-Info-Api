const axios = require('axios');

// ============================================================
// 💎 NUM HITEK — 3D PREMIUM INTEL
// ============================================================

const UPSTREAM = 'https://bronx-ultra-king.duckdns.org/api/custom/num-hitek';
const KEY = '999';
const W = 42;
const BAR = '━'.repeat(W);
const ADD_MAX = 88;

// ---------- helpers ----------
const clean = (v) =>
  v == null ? '' : String(v).replace(/[\u0000-\u001F\u007F]+/g, ' ').replace(/\s+/g, ' ').trim();

const pad2 = (n) => String(n).padStart(2, '0');

function stamp(d) {
  return `${pad2(d.getDate())}-${pad2(d.getMonth() + 1)}-${d.getFullYear()}`;
}

function addr(s) {
  if (!s) return '';
  const parts = clean(s)
    .split(/[!,;|]+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const out = [];
  for (const p of parts) {
    if (!out.some((o) => o.toLowerCase() === p.toLowerCase())) out.push(p);
  }

  let a = out.join(', ');
  if (a.length > ADD_MAX) a = a.slice(0, ADD_MAX - 1).trimEnd() + '…';
  return a;
}

function numbers(rec, self) {
  const set = new Set();
  for (const [k, v] of Object.entries(rec)) {
    if (!/^Phone\d*$/.test(k)) continue;
    for (const n of clean(v).split(/\D+/)) {
      if (n.length >= 10) {
        const t = n.slice(-10);
        if (t !== self) set.add(t);
      }
    }
  }
  return [...set];
}

function errorBox(msg, usage) {
  const out = [
    BAR,
    ' ⟨ NUM HITEK ⟩  ✕ FAILED',
    BAR,
    ` ⚠  ${clean(msg)}`,
  ];
  if (usage) out.push(` ↳  ${usage}`);
  out.push(BAR);
  return out.join('\n');
}

// ============================================================

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');

  let mobile = req.query.mobile;
  if (Array.isArray(mobile)) mobile = mobile[0];

  if (!mobile) {
    return res.status(400).send(errorBox('Mobile parameter missing.', '/api/lookup?mobile=9876543210'));
  }

  let digits = String(mobile).replace(/\D/g, '');
  if (digits.length > 10) digits = digits.slice(-10);

  if (!/^[6-9]\d{9}$/.test(digits)) {
    return res.status(400).send(errorBox('Invalid number. 10 digits, starts 6-9.', '/api/lookup?mobile=9876543210'));
  }

  try {
    const { data } = await axios.get(`${UPSTREAM}?key=${KEY}&num=${digits}`, {
      timeout: 12000,
      responseType: 'json',
      maxContentLength: 20_000_000,
      validateStatus: (s) => s < 500,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'application/json',
      },
    });

    const records = Array.isArray(data && data.records) ? data.records : [];

    if (!records.length) {
      res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
      return res.status(404).send(errorBox('No record found for this number.'));
    }

    // ---- build compact lines ----
    const seen = new Set();
    const lines = [];
    let idx = 0;

    for (const rec of records) {
      const name = clean(rec.FullName) || 'N/A';
      const father = clean(rec.FatherName);
      const doc = clean(rec.DocumentNumber);
      const add = addr(rec.Adres);
      const nums = numbers(rec, digits);

      const sig = `${name.toLowerCase()}|${doc}`;
      if (seen.has(sig)) continue;
      seen.add(sig);

      idx += 1;
      lines.push(`[${pad2(idx)}] ${name}`);
      if (father) lines.push(`     S/O  ${father}`);
      if (doc && !/^x+$/i.test(doc)) lines.push(`     DOC  ${doc}`);
      if (add) lines.push(`     ADD  ${add}`);
      if (nums.length) lines.push(`     NUM  ${nums.join(' ')}`);
      lines.push('');
    }

    if (!idx) return res.status(404).send(errorBox('No usable record found.'));

    const exp = stamp(new Date(Date.now() + 86_400_000));

    const report = [
      BAR,
      ` ⟨ NUM HITEK ⟩  ${digits}`,
      ` DEMO 24H  ·  EXP ${exp}`,
      BAR,
      '',
      ...lines,
      BAR,
      ` ◈ ${idx} RECORD${idx > 1 ? 'S' : ''}  ·  ${digits}`,
      BAR,
    ].join('\n');

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).send(report);
  } catch (err) {
    res.setHeader('Cache-Control', 's-maxage=30');
    const timedOut = err.code === 'ECONNABORTED' || /timeout/i.test(err.message);
    const msg = timedOut
      ? 'Upstream timeout.'
      : err.response
        ? `Upstream HTTP ${err.response.status}.`
        : clean(err.message);
    return res.status(502).send(errorBox(msg));
  }
};

module.exports.config = { maxDuration: 30 };
