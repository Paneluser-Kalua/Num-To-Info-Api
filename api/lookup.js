const axios = require('axios');
const http = require('http');
const https = require('https');

// ============================================================
// 💎 KALUA API - ENTERPRISE INTEL GATEWAY (100% MASKED)
// 👑 Creator: KaluaApiAdmin | 📢 Channel: @KaluaApiStore
// ============================================================

const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 100 });
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 100 });

const turboClient = axios.create({
  httpAgent,
  httpsAgent,
  timeout: 7000
});

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const mobile = req.query.mobile;

  if (!mobile) {
    return res.status(400).json({
      status: false,
      code: 400,
      creator: 'KaluaApiAdmin',
      channel: '@KaluaApiStore',
      message: 'Mobile parameter missing! Usage: /api/lookup?mobile=9999999891'
    });
  }

  const cleanNumber = String(mobile).replace(/\D/g, '');

  if (cleanNumber.length < 10) {
    return res.status(400).json({
      status: false,
      code: 400,
      creator: 'KaluaApiAdmin',
      channel: '@KaluaApiStore',
      message: 'Invalid format! Minimum 10 digits required.'
    });
  }

  const startTime = Date.now();

  try {
    // Hidden & Fully Masked Internal Gateway Endpoint
    const internalNodeUrl = `https://tfqdeadlo-1-78bapi.hf.space/search?mobile=${cleanNumber}`;

    const apiResponse = await turboClient.get(internalNodeUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
      }
    });

    const rawData = apiResponse.data || {};
    const d = rawData.data || rawData;

    const name = d.name || d.fullname || 'N/A';
    const fname = d.fname || d.father_name || d.fatherName || 'N/A';
    const altNum = d.alt || d.alternate_number || d.alt_number || 'N/A';
    const email = d.email || d.Mail || 'N/A';
    const id = d.id || d.uid || 'N/A';
    const circle = d.circle || d.operator || 'N/A';

    let state = 'N/A', pincode = 'N/A', locationDetails = 'N/A';
    if (d.address && typeof d.address === 'string') {
      const parts = d.address.split('!').map(p => p.trim()).filter(Boolean);
      if (parts.length > 0) {
        locationDetails = parts.join(', ');
        state = parts[parts.length - 2] || 'N/A';
        const possiblePin = parts[parts.length - 1];
        if (/^\d{6}$/.test(possiblePin)) {
          pincode = possiblePin;
        }
      }
    }

    const executionTime = Date.now() - startTime;

    // Premium, Clean & Short JSON Response
    return res.status(200).json({
      status: true,
      code: 200,
      creator: 'KaluaApiAdmin',
      channel: '@KaluaApiStore',
      execution_time_ms: executionTime,
      result: {
        name: name,
        father_name: fname,
        mobile: cleanNumber,
        alternate_number: altNum,
        email: email,
        circle: circle,
        address: locationDetails,
        state: state,
        pincode: pincode,
        unique_id: id
      }
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    // Completely generic secure error output (No upstream link leak)
    return res.status(502).json({
      status: false,
      code: 502,
      creator: 'KaluaApiAdmin',
      channel: '@KaluaApiStore',
      execution_time_ms: executionTime,
      message: 'Service node currently busy or lookup failed. Please try again.'
    });
  }
};
