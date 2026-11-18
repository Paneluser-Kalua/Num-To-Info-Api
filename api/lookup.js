const axios = require('axios');

// ============================================================
// 💎 NUM HITEK — CLEAN REPORT  ·  by prime07
// ============================================================

const W = 34;
const ADD_MAX = 74;
const NET_MAX = 38;
const DEMO_DAYS = 1;

// ---------- private upstream (never leaves the server) ----------
const BASE = (process.env.NH_BASE || 'https://api-munix.wisp.uno/number').trim();
const KEY  = (process.env.NH_KEY  || 'MUNIX-eIV68Wj9rrzp7l52NV1KTKTh5eNrhm').trim();
const PARAMS = ['number', 'num', 'mobile'];
const TIMEOUT = 12000;

const HTOP = '▗' + '▄'.repeat(W) + '▖';
const HBOT = '▝' + '▀'.repeat(W) + '▘';
const RULE = ' ' + '─'.repeat(W);
const bar = (t = '') => (t ? `▐ ${t}` : '▐');

const MARK = ' ◈ N U M   H I T E K';
const SIGN = ' by prime07';

// ---------- helpers ----------
const clean = (v) =>
  v == null ? '' : String(v).replace(/[\u0000-\u001F\u007F]+/g, ' ').replace(/\s+/g, ' ').trim();

const pad2 = (n) => String(n).padStart(2, '0');

const stamp = (d) => `${pad2(d.getDate())}-${pad2(d.getMonth() + 1)}-${d.getFullYear()}`;

const clip = (s, max) => (s.length > max ? s.slice(0, max - 1).trimEnd() + '…' : s);

const field = (label, value) => `     ${label.padEnd(8)} : ${value}`;

const dayWord = (n) => `${n} Day${n > 1 ? 's' : ''}`;

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

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
  return clip(out.join(', '), ADD_MAX);
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
  return clip([...set].slice(0, 3).join(' · '), NET_MAX);
}

// ---------- upstream ----------
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
          'Accept-Encoding': 'gzip, deflate, br',
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

// ---------- report builders ----------
function buildReport(digits, rawRecords) {
  const seen = new Set();
  const records = [];

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

  if (!records.length) return null;

  return {
    ok: true,
    number: digits,
    demoDays: DEMO_DAYS,
    expires: stamp(new Date(Date.now() + DEMO_DAYS * 86_400_000)),
    count: records.length,
    records,
  };
}

const fail = (error, usage) => ({ ok: false, error, usage });

// ---------- text render ----------
function renderText(r) {
  if (!r.ok) {
    const body = [' ✕ NOT WORKING', ` Reason : ${clean(r.error)}`];
    if (r.usage) body.push(` How to : ${r.usage}`);
    return [HTOP, bar(MARK), HBOT, ...body.map(bar), HBOT, bar(SIGN), HBOT].join('\n');
  }

  const head = [
    HTOP,
    bar(MARK),
    bar(),
    bar(` Number  : ${r.number}`),
    bar(` Demo    : ${dayWord(r.demoDays)}`),
    bar(` Expires : ${r.expires}`),
    HBOT,
  ];

  const cards = [];
  r.records.forEach((rec, i) => {
    if (i) cards.push(RULE);
    cards.push(` ${pad2(i + 1)} ▸ Name     : ${rec.name}`);
    if (rec.father) cards.push(field('Father', rec.father));
    if (rec.id) cards.push(field('ID', rec.id));
    if (rec.address) cards.push(field('Address', rec.address));
    if (rec.numbers.length) cards.push(field('Numbers', rec.numbers.join(' ')));
    if (rec.network) cards.push(field('Network', rec.network));
  });

  const foot = [
    HTOP,
    bar(` ◈ ${r.count} record${r.count > 1 ? 's' : ''} found`),
    bar(SIGN),
    HBOT,
  ];

  return [...head, '', ...cards, '', ...foot].join('\n');
}

// ---------- json render ----------
function renderJson(r) {
  if (!r.ok) {
    return JSON.stringify({ ok: false, error: r.error, usage: r.usage || null }, null, 2);
  }
  return JSON.stringify(
    {
      ok: true,
      number: r.number,
      demo_days: r.demoDays,
      expires: r.expires,
      count: r.count,
      records: r.records,
      text: renderText(r),
    },
    null,
    2,
  );
}

// ---------- html render ----------
function shell(title, inner, accent) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="robots" content="noindex">
<title>${esc(title)}</title>
<style>
*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{background:#080b10;color:#e8eef6;font:16px/1.55 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;padding:18px 14px 34px;-webkit-text-size-adjust:100%}
.wrap{max-width:560px;margin:0 auto}
.top{display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid #1c2532;background:linear-gradient(180deg,#0f1620,#0b1017);border-radius:14px;padding:12px 14px}
.brand{font-weight:800;letter-spacing:.14em;font-size:13px;color:${accent}}
.by{font-size:11px;color:#6f7f93;letter-spacing:.05em}
.meta{margin:12px 0 0;border:1px solid #1c2532;background:#0c121a;border-radius:14px;overflow:hidden}
.row{display:flex;justify-content:space-between;gap:14px;padding:10px 14px;border-top:1px solid #151d28;font-size:14px}
.row:first-child{border-top:0}
.k{color:#7d8da3;letter-spacing:.07em;font-size:11px;text-transform:uppercase;padding-top:3px}
.v{font-weight:600;text-align:right;word-break:break-word;font-variant-numeric:tabular-nums}
.card{margin:12px 0 0;border:1px solid #1c2532;background:#0c121a;border-radius:14px;padding:4px 14px 12px}
.no{font-size:11px;color:${accent};letter-spacing:.16em;padding-top:12px;font-weight:700}
.name{font-size:18px;font-weight:800;margin:2px 0 10px;word-break:break-word;line-height:1.35}
.f{display:grid;grid-template-columns:84px 1fr;gap:10px;padding:7px 0;border-top:1px dashed #17202b;font-size:14px}
.f .k{padding-top:2px}
.f .v{text-align:left;font-weight:500;color:#d5dee9}
.pill{display:inline-block;background:#122031;border:1px solid #1e3348;border-radius:999px;padding:3px 9px;margin:2px 4px 2px 0;font-size:12px;font-variant-numeric:tabular-nums}
.foot{margin-top:14px;display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:12px;color:#6f7f93}
button{font:inherit;font-size:12px;background:#101a26;color:#cfe0f0;border:1px solid #22303f;border-radius:10px;padding:8px 12px;cursor:pointer}
button:active{background:#172434}
.err{border:1px solid #3a1f24;background:#150e11;border-radius:14px;padding:14px;margin-top:12px}
.err .t{color:#ff6b81;font-weight:800;font-size:13px;letter-spacing:.1em}
.err .m{margin-top:6px;font-size:14px;word-break:break-word}
code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;color:#9fd0ff}
</style>
</head>
<body><div class="wrap">${inner}</div></body>
</html>`;
}

function renderHtml(r) {
  if (!r.ok) {
    const inner = `
<div class="top"><div class="brand">NUM HITEK</div><div class="by">by prime07</div></div>
<div class="err">
  <div class="t">NOT WORKING</div>
  <div class="m">${esc(r.error)}</div>
  ${r.usage ? `<div class="m" style="color:#7d8da3">Use: <code>${esc(r.usage)}</code></div>` : ''}
</div>`;
    return shell('Num Hitek · error', inner, '#ff6b81');
  }

  const cards = r.records
    .map((rec, i) => {
      const rows = [];
      if (rec.father) rows.push(`<div class="f"><div class="k">Father</div><div class="v">${esc(rec.father)}</div></div>`);
      if (rec.id) rows.push(`<div class="f"><div class="k">ID</div><div class="v">${esc(rec.id)}</div></div>`);
      if (rec.address) rows.push(`<div class="f"><div class="k">Address</div><div class="v">${esc(rec.address)}</div></div>`);
      if (rec.numbers.length)
        rows.push(
          `<div class="f"><div class="k">Numbers</div><div class="v">${rec.numbers
            .map((n) => `<span class="pill">${esc(n)}</span>`)
            .join('')}</div></div>`,
        );
      if (rec.network) rows.push(`<div class="f"><div class="k">Network</div><div class="v">${esc(rec.network)}</div></div>`);

      return `<div class="card"><div class="no">#${pad2(i + 1)}</div><div class="name">${esc(rec.name)}</div>${rows.join('')}</div>`;
    })
    .join('');

  const inner = `
<div class="top"><div class="brand">NUM HITEK</div><div class="by">by prime07</div></div>
<div class="meta">
  <div class="row"><div class="k">Number</div><div class="v">${esc(r.number)}</div></div>
  <div class="row"><div class="k">Demo</div><div class="v">${dayWord(r.demoDays)}</div></div>
  <div class="row"><div class="k">Expires</div><div class="v">${esc(r.expires)}</div></div>
</div>
${cards}
<div class="foot">
  <span>◈ ${r.count} record${r.count > 1 ? 's' : ''} found</span>
  <button id="cp">Copy</button>
</div>
<script>
document.getElementById('cp').addEventListener('click', async function () {
  var b = this, t = ${JSON.stringify(renderText(r))};
  try { await navigator.clipboard.writeText(t); b.textContent = 'Copied'; }
  catch (e) { b.textContent = 'Failed'; }
  setTimeout(function () { b.textContent = 'Copy'; }, 1500);
});
</script>`;

  return shell(`Num Hitek · ${r.number}`, inner, '#22d3ee');
}

// ---------- format negotiation ----------
function pickFormat(req) {
  const q = String((req.query && (req.query.format || req.query.json)) || '').toLowerCase();
  if (q === 'json' || q === '1') return 'json';
  if (q === 'html') return 'html';
  if (q === 'text' || q === 'txt') return 'text';

  const ua = String(req.headers['user-agent'] || '');
  const accept = String(req.headers.accept || '');

  const bot = /bot|crawl|spider|curl|wget|python|axios|node|okhttp|dart|whatsapp|telegram|facebook|slack|discord/i.test(ua);
  const browser = !bot && /Mozilla|Chrome|Chromium|Safari|Firefox|Edg\/|OPR\//i.test(ua);

  if (browser && /text\/html/.test(accept)) return 'html';
  if (/application\/json/.test(accept) && !/text\/html/.test(accept)) return 'json';
  return 'text';
}

function send(res, fmt, status, report) {
  res.statusCode = status;
  res.setHeader('Vary', 'Accept, User-Agent');

  if (fmt === 'json') {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.end(renderJson(report));
  }
  if (fmt === 'html') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.end(renderHtml(report));
  }
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  return res.end(renderText(report));
}

// ============================================================

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const fmt = pickFormat(req);

  let mobile = req.query.mobile;
  if (Array.isArray(mobile)) mobile = mobile[0];

  if (!mobile) {
    return send(res, fmt, 400, fail('Number is missing.', '/api/lookup?mobile=9876543210'));
  }

  let digits = String(mobile).replace(/\D/g, '');
  if (digits.length > 10) digits = digits.slice(-10);

  if (!/^[6-9]\d{9}$/.test(digits)) {
    return send(res, fmt, 400, fail('Number must be 10 digits, starting 6-9.', '/api/lookup?mobile=9876543210'));
  }

  const cached = cacheGet(digits);
  if (cached) {
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return send(res, fmt, cached.status, cached.report);
  }

  try {
    const rawRecords = await fetchRecords(digits);
    const report = rawRecords.length ? buildReport(digits, rawRecords) : null;

    if (!report) {
      res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
      const bad = fail('No record found for this number.');
      cacheSet(digits, { status: 404, report: bad });
      return send(res, fmt, 404, bad);
    }

    cacheSet(digits, { status: 200, report });
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return send(res, fmt, 200, report);
  } catch (err) {
    res.setHeader('Cache-Control', 's-maxage=30');
    const msg =
      err.code === 'ECONNABORTED' || /timeout/i.test(err.message)
        ? 'Timeout. Please try again.'
        : err.response
          ? 'Server busy. Please try again.'
          : 'Temporary failure. Please try again.';
    return send(res, fmt, 502, fail(msg));
  }
};

module.exports.config = { maxDuration: 30 };
