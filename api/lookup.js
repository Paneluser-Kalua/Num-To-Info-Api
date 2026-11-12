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

  // Set Enterprise Headers
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('X-Engine-Version', '3.4.0-production');
  res.setHeader('X-Developer', 'Kalua');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ⏳ Strict License & Expiry Verification (Feb 2027)
  const EXPIRY_DATE = new Date('2027-02-11T23:59:59Z');
  if (new Date() > EXPIRY_DATE) {
    return res.status(403).json({
      success: false,
      error: {
        code: 403,
        message: "API license expired. Contact administrator @KaluaApiStore for renewal.",
        timestamp
      }
    });
  }

  const { mobile } = req.query;

  // Parameter Validation
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
  
  // Format & Length Validation (Standard 10-digit mobile check)
  if (cleanNumber.length !== 10) {
    return res.status(400).json({
      success: false,
      error: {
        code: 400,
        message: "Invalid mobile format. Exactly 10 digits required.",
        timestamp
      }
    });
  }

  try {
    // Secure Internal Core Routing
    const coreConnectorUrl = `https://api.allprinthub.in/api?num_info_767&key=7day&%40Ronak_api=9162516577&mobile=${cleanNumber}`;
    
    const dbResponse = await axios.get(coreConnectorUrl, {
      timeout: 12000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KaluaCoreEngine/1.0)'
      }
    });

    const responsePayload = dbResponse.data || {};
    
    let records = [];
    if (responsePayload.data && Array.isArray(responsePayload.data)) {
      records = responsePayload.data;
    } else if (responsePayload.data && typeof responsePayload.data === 'object') {
      records = [responsePayload.data];
    }

    // Fallback default structure if no record found
    const primaryRecord = records.length > 0 ? records[0] : {
      oid: "N/A",
      mobile: cleanNumber,
      name: "N/A",
      fname: "N/A",
      address: "N/A",
      alt: "N/A",
      circle: "N/A",
      id: "N/A",
      email: null
    };

    // Construct Enterprise Response Payload (Single Clean Record)
    const finalOutput = {
      success: true,
      status: 200,
      meta: {
        developer: "Kalua",
        channel: "@KaluaApiStore",
        request_id: requestId,
        timestamp
      },
      query: cleanNumber,
      count: 1,
      data: primaryRecord
    };

    return res.status(200).json(finalOutput);

  } catch (error) {
    // Enterprise Error Boundary Log (Zero external trace)
    return res.status(500).json({
      success: false,
      error: {
        code: 500,
        message: "Database core query timeout or connection failed.",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        request_id: requestId,
        timestamp
      }
    });
  }
};
