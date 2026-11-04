const axios = require('axios');

// ============================================================
// 🔒 PERMANENT MASTER LOOKUP API - KALUA API STORE
// ============================================================
module.exports = async (req, res) => {
  // Global CORS Headers set kiye gaye hain
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET query param ya POST body payload dono ko auto-detect karega
  const mobile = req.query.mobile || req.body?.mobile;

  if (!mobile) {
    return res.status(400).json({
      status: false,
      creator: "KaluaApiAdmin",
      channel: "@KaluaApiStore",
      error: 'Mobile parameter missing hai. Example usage: /api/number?mobile=9999999891'
    });
  }

  const cleanNumber = String(mobile).replace(/\D/g, '');
  if (cleanNumber.length < 10) {
    return res.status(400).json({
      status: false,
      creator: "KaluaApiAdmin",
      channel: "@KaluaApiStore",
      error: 'Invalid mobile number format. Must be at least 10 digits.'
    });
  }

  try {
    // 🔒 FULLY PRIVATE UPSTREAM ROUTE (Kisi ko dikhai nahi dega)
    const hiddenUpstreamUrl = `https://tfqdeadlo-1-78bapi.hf.space/search?mobile=${cleanNumber}`;
    
    const apiResponse = await axios.get(hiddenUpstreamUrl, {
      timeout: 9000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    // Clean Branded Output Response
    return res.status(200).json({
      status: true,
      creator: "KaluaApiAdmin",
      channel: "@KaluaApiStore",
      target: cleanNumber,
      result: apiResponse.data
    });

  } catch (error) {
    return res.status(500).json({
      status: false,
      creator: "KaluaApiAdmin",
      channel: "@KaluaApiStore",
      error: 'Upstream server error ya response timeout ho gaya hai.',
      details: error.message
    });
  }
};
