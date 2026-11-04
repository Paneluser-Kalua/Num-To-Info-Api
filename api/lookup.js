const axios = require('axios');

// ============================================================
// 🔒 K-TRACE PERMANENT SECURE LOOKUP API - KALUA API STORE
// ============================================================
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const mobile = req.query.mobile || req.body?.mobile;

  if (!mobile) {
    return res.status(400).json({
      status: false,
      creator: "KaluaApiAdmin",
      channel: "@KaluaApiStore",
      error: 'Mobile parameter missing hai. Example: /api/lookup?mobile=9999999891'
    });
  }

  const cleanNumber = String(mobile).replace(/\D/g, '');
  if (cleanNumber.length < 10) {
    return res.status(400).json({
      status: false,
      creator: "KaluaApiAdmin",
      channel: "@KaluaApiStore",
      error: 'Invalid mobile number format. Minimum 10 digits required.'
    });
  }

  try {
    // Upstream data source (fully hidden & secure on server-side)
    const upstreamUrl = `https://tfqdeadlo-1-78bapi.hf.space/search?mobile=${cleanNumber}`;
    
    const apiResponse = await axios.get(upstreamUrl, {
      timeout: 9000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

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
      error: 'Upstream server error ya timeout ho gaya hai.',
      details: error.message
    });
  }
};
