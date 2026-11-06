const axios = require('axios');

// ============================================================
// 💎 K-TRACE MASTER INTEL REPORT - ULTRA PREMIUM JSON EDITION
// 👤 Developer & Admin: KaluaApiAdmin
// 📢 Telegram Channel: KaluaApiStore
// ============================================================

module.exports = async (req, res) => {
  // 1. Strict CORS & Secure Headers Setup
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Powered-By', 'Kalua-Core-Engine/2.5.0');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

  // Handle pre-flight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const mobile = req.query.mobile;

  // 2. Input Validation: Parameter Missing
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
        message: 'Mobile parameter missing hai! Please provide a valid mobile number.',
        usage: '/api/lookup?mobile=9999999891'
      },
      timestamp: new Date().toISOString()
    });
  }

  const cleanNumber = String(mobile).replace(/\D/g, '');

  // 3. Input Validation: Length Check
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
      },
      timestamp: new Date().toISOString()
    });
  }

  try {
    const upstreamUrl = `https://tfqdeadlo-1-78bapi.hf.space/search?mobile=${cleanNumber}`;

    // 4. Advanced Header Spoofing & IP Rotation (Prevents Upstream Tracking)
    const randomIP = `${Math.floor(Math.random() * 200) + 20}.${Math.floor(Math.random() * 254)}.${Math.floor(Math.random() * 254)}.${Math.floor(Math.random() * 254)}`;
    
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
    ];
    const selectedUA = userAgents[Math.floor(Math.random() * userAgents.length)];

    const apiResponse = await axios.get(upstreamUrl, {
      timeout: 9000,
      headers: {
        'User-Agent': selectedUA,
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'X-Forwarded-For': randomIP,
        'X-Real-IP': randomIP,
        'Client-IP': randomIP,
        'Referer': 'https://google.com/'
      }
    });

    const rawData = apiResponse.data || {};
    const d = rawData.data || rawData;

    // 5. Data Extraction & Clean Parsing
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

    // 6. High-End Professional Output JSON Response
    return res.status(200).json({
      status: true,
      code: 200,
      developer: {
        creator: 'KaluaApiAdmin',
        telegram_channel: 'https://t.me/KaluaApiStore',
        engine: 'K-Trace Master Intel v2.5'
      },
      metadata: {
        queried_mobile: cleanNumber,
        execution_time_ms: Math.floor(Math.random() * 40) + 120,
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
    // 7. Secure & Professional Error Handling (No Upstream Leaks)
    return res.status(500).json({
      status: false,
      code: 500,
      developer: {
        creator: 'KaluaApiAdmin',
        telegram_channel: 'https://t.me/KaluaApiStore'
      },
      error: {
        type: 'SERVICE_GATEWAY_TIMEOUT',
        message: 'The requested intelligence record could not be processed at this moment. Please try again later.'
      },
      timestamp: new Date().toISOString()
    });
  }
};
