const axios = require('axios');

// ============================================================
// 💎 NUM HITEK — PREMIUM INTEL CORE  ·  by KaluaApiAdmin
// ============================================================

const SRC = 'https://bronx-ultra-king.duckdns.org/api/custom/num-hitek';
const KEY = '999';
const W = 36;
const ADD_MAX = 78;
const NET_MAX = 40;

const HTOP = '▗' + '▄'.repeat(W) + '▖';
const HBOT = '▝' + '▀'.repeat(W) + '▘';
const RULE = '─'.repeat(W);
const bar = (t = '') => (t ? `▐ ${t}` : '▐');

const MARK = ' ░▒▓█  N U M  ·  H I T E K  █▓▒░';
const SIGN = ' ⟡ by KaluaApiAdmin  ·  @KaluaApiStore';

// ---------- helpers ----------
const clean = (v) =>
  v == null ? '' : String(v).replace(/[\u0000-\u001F\u007F]+/g, ' ').replace(/\s+/g, ' ').trim();

const pad2 = (n) => String(n).padStart(2, '0');

const stamp = (d) => `${pad2(d.getDate())}-${pad2(d.getMonth() + 1)}-${d.getFullYear()}`;

const clip = (s, max) => (s.length > max ? s.slice(0, max - 1).trimEnd() + '…' : s);

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
  return clip(out.join(', '), ADD_MAX);
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

function nets(rec) {
  const set = new Set();
  for (const [k, v] of Object.entries(rec)) {
    if (!/^Region\d*$/.test(k)) continue;
    for (const o of clean(v).split(/[;,]+/)) {
      const t = o.trim();
      if (t) set.add(t);
    }
  }
  return clip([...set].slice(0, 3).join(' · '), NET_MAX);
}

function errorBox(msg, usage) {
  const body = [' ◈ ✕ FAILED', ` ⚠ ${clean(msg)}`];
  if (usage) body.push(` ↳ ${usage}`);
  return [HTOP, bar(MARK), HBOT, ...body.map(bar), HBOT, bar(SIGN), HBOT].join('\n');
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
    const { data } = await axios.get(`${SRC}?key=${KEY}&num=${digits}`, {
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

    const seen = new Set();
    const cards = [];
    let idx = 0;

    for (const rec of records) {
      const name = clean(rec.FullName) || 'UNKNOWN';
      const father = clean(rec.FatherName);
      const doc = clean(rec.DocumentNumber);
      const add = addr(rec.Adres);
      const nums = numbers(rec, digits);
      const net = nets(rec);

      const sig = `${name.toLowerCase()}|${doc}`;
      if (seen.has(sig)) continue;
      seen.add(sig);

      idx += 1;
      if (idx > 1) cards.push(RULE);

      cards.push(`${pad2(idx)} ▸ ${name}`);
      if (father) cards.push(`     S/O  ${father}`);
      if (doc && !/^x+$/i.test(doc)) cards.push(`     DOC  ${doc}`);
      if (add) cards.push(`     ADD  ${add}`);
      if (nums.length) cards.push(`     NUM  ${nums.join(' ')}`);
      if (net) cards.push(`     NET  ${net}`);
    }

    if (!idx) {
      res.setHeader('Cache-Control', 's-maxage=60');
      return res.status(404).send(errorBox('No usable record found.'));
    }

    const exp = stamp(new Date(Date.now() + 86_400_000));

    const head = [
      HTOP,
      bar(MARK),
      bar(),
      bar(` ◈ ${digits}`),
      bar(` ⟡ DEMO 24H  ·  EXP ${exp}`),
      HBOT,
    ];

    const foot = [
      HTOP,
      bar(` ◈ ${idx} RECORD${idx > 1 ? 'S' : ''}  ·  ${digits}`),
      bar(SIGN),
      HBOT,
    ];

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).send([...head, '', ...cards, '', ...foot].join('\n'));
  } catch (err) {
    res.setHeader('Cache-Control', 's-maxage=30');
    const msg =
      err.code === 'ECONNABORTED' || /timeout/i.test(err.message)
        ? 'Timeout. Try again.'
        : err.response
          ? 'Service busy. Try again.'
          : clean(err.message);
    return res.status(502).send(errorBox(msg));
  }
};

module.exports.config = { maxDuration: 30 };
