const axios = require('axios');

// Vercel Serverless Timeout Limit
module.exports.maxDuration = 15;

// ============================================================
// 💎 KALUA INTEL ENGINE - PROPRIETARY ENTERPRISE EDITION
// ============================================================
module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // ⏳ Automatic Expiry Logic (3 Months Expiry)
  const EXPIRY_DATE = new Date('2027-02-11T23:59:59Z');
  if (new Date() > EXPIRY_DATE) {
    return res.status(403).json({
      status: false,
      error: "API license expired. Contact administrator @KaluaApiStore for renewal."
    });
  }

  const mobile = req.query.mobile;

  if (!mobile) {
    return res.status(400).json({
      status: "error",
      message: "Mobile parameter missing. Example: /api/lookup?mobile=9999999891",
      count: 0,
      data: null
    });
  }

  const cleanNumber = String(mobile).replace(/\D/g, '');
  if (cleanNumber.length < 10) {
    return res.status(400).json({
      status: "error",
      message: "Invalid format. Minimum 10 digits required.",
      count: 0,
      data: null
    });
  }

  try {
    // Masked internal secure core routing
    const coreConnectorUrl = `https://api.allprinthub.in/api?num_info_767&key=7day&%40Ronak_api=9162516577&mobile=${cleanNumber}`;
    
    const dbResponse = await axios.get(coreConnectorUrl, {
      timeout: 12000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const responsePayload = dbResponse.data || {};
    
    let records = [];
    if (responsePayload.data && Array.isArray(responsePayload.data)) {
      records = responsePayload.data;
    } else if (responsePayload.data && typeof responsePayload.data === 'object') {
      records = [responsePayload.data];
    }

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

    const finalOutput = {
      status: responsePayload.status || "success",
      message: responsePayload.message || "Records found successfully",
      count: 1,
      data: primaryRecord
    };

    return res.status(200).json(finalOutput);

  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Database core query timeout or connection failed.",
      count: 0,
      data: null
    });
  }
};
