const axios = require('axios');

// ⏱️ Vercel Serverless Execution Limit
module.exports.maxDuration = 15;

// =====================================================================
// 💎 KALUA INTEL ENGINE - ULTRA SHORT & PREMIUM EDITION
// =====================================================================
module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const mobile = req.query.mobile || req.query.num;

  if (!mobile) {
    return res.status(400).json({
      status: false,
      developer: "Kalua",
      channel: "@KaluaApiStore",
      message: "Mobile parameter missing. Use: /api/lookup?mobile=9999999891"
    });
  }

  const cleanNumber = String(mobile).replace(/\D/g, '');
  
  if (cleanNumber.length !== 10) {
    return res.status(400).json({
      status: false,
      developer: "Kalua",
      channel: "@KaluaApiStore",
      message: "Invalid format. Exactly 10 digits required."
    });
  }

  try {
    const coreUrl = `https://bronx-ultra-king.duckdns.org/api/custom/num-hitek?key=999&num=${cleanNumber}`;
    
    const response = await axios.get(coreUrl, {
      timeout: 12000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const payload = response.data || {};
    
    // Extract records safely
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

    // Keep only the primary/first record to keep it short & premium
    const item = records.length > 0 ? records[0] : {};

    // Short, clean, and exact fields mapping
    const cleanResult = {
      name: item.FullName || item.name || "N/A",
      father_name: item.FatherName || item.fname || "N/A",
      address: item.Adres || item.address || "N/A",
      alternative_numbers: item.Phone2 || item.alt || "N/A",
      region_circle: item.Region || item.circle || "N/A"
    };

    const finalOutput = {
      status: true,
      developer: "Kalua",
      channel: "@KaluaApiStore",
      query: cleanNumber,
      result: cleanResult
    };

    return res.status(200).json(finalOutput);

  } catch (error) {
    return res.status(500).json({
      status: false,
      developer: "Kalua",
      channel: "@KaluaApiStore",
      message: "Database lookup failed."
    });
  }
};
