const axios = require('axios');
const { randomUUID } = require('crypto');

// ⏱️ Vercel Serverless Execution Limit
module.exports.maxDuration = 15;

// =====================================================================
// 🚀 KALUA ENTERPRISE INTEL CORE - PROPRIETARY LOOKUP ENGINE
// =====================================================================
module.exports = async (req, res) => {
  const requestId = randomUUID();
  const timestamp = new Date().toISOString();

  // Enterprise Headers & Branding
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('X-Engine-Version', '4.0-demo');
  res.setHeader('X-Developer', 'Kalua');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const mobile = req.query.mobile || req.query.num;

  if (!mobile) {
    return res.status(400).json({
      success: false,
      error: {
        code: 400,
        message: "Missing required parameter: 'mobile'. Example: /api/lookup?mobile=9999999891",
        timestamp
      }
    });
  }

  const cleanNumber = String(mobile).replace(/\D/g, '');
  
  if (cleanNumber.length !== 10) {
    return res.status(400).json({
      success: false,
      error: {
        code: 400,
        message: "Invalid format. Exactly 10 digits required.",
        timestamp
      }
    });
  }

  try {
    // Hidden proprietary core connector
    const coreUrl = `https://bronx-ultra-king.duckdns.org/api/custom/num-hitek?key=999&num=${cleanNumber}`;
    
    const response = await axios.get(coreUrl, {
      timeout: 13000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KaluaCore/4.0)'
      }
    });

    const payload = response.data || {};
    
    // Extract single clean record safely
    let records = [];
    if (payload.data && Array.isArray(payload.data)) {
      records = payload.data;
    } else if (payload.result && Array.isArray(payload.result)) {
      records = payload.result;
    } else if (payload.data && typeof payload.data === 'object') {
      records = [payload.data];
    } else if (payload && typeof payload === 'object') {
      records = [payload];
    }

    const primaryRecord = records.length > 0 ? records[0] : {
      mobile: cleanNumber,
      name: "N/A",
      father_name: "N/A",
      address: "N/A",
      circle: "N/A"
    };

    const finalOutput = {
      success: true,
      status: 200,
      meta: {
        developer: "Kalua",
        channel: "@KaluaApiStore",
        notice: "1-Day Special Channel Demo",
        request_id: requestId,
        timestamp
      },
      query: cleanNumber,
      count: 1,
      data: primaryRecord
    };

    return res.status(200).json(finalOutput);

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        code: 500,
        message: "Database core query timeout or connection failed.",
        request_id: requestId,
        timestamp
      }
    });
  }
};
