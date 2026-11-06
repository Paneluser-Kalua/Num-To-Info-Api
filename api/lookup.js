const axios = require('axios');
const http = require('http');
const https = require('https');

const agentOpts = { keepAlive: true, maxSockets: 50 };
const client = axios.create({
  httpAgent: new http.Agent(agentOpts),
  httpsAgent: new https.Agent(agentOpts),
  timeout: 15000 // Extended timeout to 15 seconds to prevent drops
});

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  const mobile = req.query.mobile;
  if (!mobile || String(mobile).replace(/\D/g, '').length < 10) {
    return res.status(400).json({
      status: false,
      code: 400,
      creator: 'KaluaApiAdmin',
      channel: '@KaluaApiStore',
      message: 'Invalid or missing mobile number! Usage: /api/lookup?mobile=9999999891'
    });
  }

  const cleanNumber = String(mobile).replace(/\D/g, '');
  const start = Date.now();
  const upstreamUrl = `https://tfqdeadlo-1-78bapi.hf.space/search?mobile=${cleanNumber}`;

  let resUp = null;
  let success = false;

  // Retry loop to ensure it never fails on temporary slow responses
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      resUp = await client.get(upstreamUrl, {
        headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*'
        }
      });
      if (resUp && resUp.data) {
        success = true;
        break;
      }
    } catch (err) {
      if (attempt === 2) {
        // If both attempts fail, return clean JSON
        return res.status(502).json({
          status: false,
          code: 502,
          creator: 'KaluaApiAdmin',
          channel: '@KaluaApiStore',
          ms: Date.now() - start,
          message: 'Upstream server busy or sleeping. Please try again in a moment.'
        });
      }
    }
  }

  try {
    const d = resUp.data?.data || resUp.data || {};
    let address = 'N/A', state = 'N/A', pincode = 'N/A';

    if (typeof d.address === 'string') {
      const parts = d.address.split('!').map(p => p.trim()).filter(Boolean);
      if (parts.length > 0) {
        address = parts.join(', ');
        state = parts[parts.length - 2] || 'N/A';
        if (/^\d{6}$/.test(parts[parts.length - 1])) pincode = parts[parts.length - 1];
      }
    }

    return res.status(200).json({
      status: true,
      code: 200,
      creator: 'KaluaApiAdmin',
      channel: '@KaluaApiStore',
      ms: Date.now() - start,
      result: {
        name: d.name || d.fullname || 'N/A',
        father_name: d.fname || d.father_name || d.fatherName || 'N/A',
        mobile: cleanNumber,
        alt_number: d.alt || d.alternate_number || 'N/A',
        email: d.email || d.Mail || 'N/A',
        circle: d.circle || d.operator || 'N/A',
        address,
        state,
        pincode,
        id: d.id || d.uid || 'N/A'
      }
    });

  } catch (err) {
    return res.status(500).json({
      status: false,
      code: 500,
      creator: 'KaluaApiAdmin',
      channel: '@KaluaApiStore',
      message: 'Data parsing error.'
    });
  }
};
