const axios = require('axios');
const http = require('http');
const https = require('https');

// ============================================================
// 💎 KALUA API ENTERPRISE GATEWAY - MASKED PRO EDITION
// 👤 Developer & Admin: KaluaApiAdmin
// 📢 Telegram Channel: KaluaApiStore
// ============================================================

const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 100 });
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 100 });

const secureClient = axios.create({
  httpAgent,
  httpsAgent,
  timeout: 7000
});

module.exports = async (req, res) => {
  // Ultra-Professional Enterprise Headers & Masking
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Powered-By', 'Kalua-Enterprise-Shield/4.0');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const mobile = req.query.mobile;

  if (!mobile) {
    return res.status(400).json({
      status: false,
      code: 400,
      developer: {
        creator: 'KaluaApiAdmin',
        telegram_channel: 'https://t.me/KaluaApiStore'
      },
      error: {
        type: 'MISSING_PARAMETER',
        message: 'Mobile parameter missing hai! Kripya valid number pass karein.',
        usage: '/api/lookup?mobile=9999999891'
      }
    });
  }

  const cleanNumber = String(mobile).replace(/\D/g, '');

  if (cleanNumber.length < 10) {
    return res.status(400).json({
      status: false,
      code: 400,
      developer: {
        creator: 'KaluaApiAdmin',
        telegram_channel: 'https://t.me/KaluaApiStore'
      },
      error: {
        type: 'INVALID_FORMAT',
        message: 'Invalid mobile number format! Minimum 10 digits required.'
      }
    });
  }

  const startTime = Date.now();

  try {
    // Hidden Upstream Target (Completely Masked from Client)
    const upstreamUrl = `https://tfqdeadlo-1-78bapi.hf.space/search?mobile=${cleanNumber}`;

    // Advanced Header Spoofing to look like native direct traffic
    const randomIP = `${Math.floor(Math.random() * 180) + 20}.${Math.floor(Math.random() * 254)}.${Math.floor(Math.random() * 254)}.${Math.floor(Math.random() * 254)}`;

    const apiResponse = await secureClient.get(upstreamUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'X-Forwarded-For': randomIP,
        'X-Real-IP': randomIP,
        'Referer': 'https://www.google.com/'
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

    // Ultra-Clean, Premium JSON Structure
    return res.status(200).json({
      status: true,
      code: 200,
      developer: {
        creator: 'KaluaApiAdmin',
        telegram_channel: 'https://t.me/KaluaApiStore',
        engine: 'Kalua Enterprise Core v4.0'
      },
      metadata: {
        queried_mobile: cleanNumber,
        execution_time_ms: executionTime,
        timestamp: new Date().toISOString()
      },
      result: {
        personal_identity: {
          full_name: name,
          father_name: fname,
          identity_id: id
        },
        communication_network: {
          primary_mobile: cleanNumber,
          alternate_mobile: altNum,
          email_address: email,
          telecom_circle: circle
        },
        location_intel: {
          full_address: locationDetails,
          state: state,
          pincode: pincode
        }
      }
    });

  } catch (error) {
    const executionTime = Date.now() - startTime;
    // Secure Fallback: Never leaks upstream errors or source URLs
    return res.status(502).json({
      status: false,
      code: 502,
      developer: {
        creator: 'KaluaApiAdmin',
        telegram_channel: 'https://t.me/KaluaApiStore'
      },
      error: {
        type: 'GATEWAY_TIMEOUT',
        message: 'Upstream intelligence node busy hai. Kripya thodi der baad prayas karein.'
      },
      metadata: {
        execution_time_ms: executionTime,
        timestamp: new Date().toISOString()
      }
    });
  }
};
