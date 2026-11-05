const axios = require('axios');

// ============================================================
// 💎 K-TRACE MASTER INTEL API - CLEAN JSON EDITION
// ============================================================
module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const mobile = req.query.mobile;

  if (!mobile) {
    return res.status(400).json({
      status: false,
      creator: "KaluaApiAdmin",
      channel: "@KaluaApiStore",
      error: "Mobile parameter missing hai! Example: /api/lookup?mobile=9999999891"
    });
  }

  const cleanNumber = String(mobile).replace(/\D/g, '');
  if (cleanNumber.length < 10) {
    return res.status(400).json({
      status: false,
      creator: "KaluaApiAdmin",
      channel: "@KaluaApiStore",
      error: "Invalid mobile number format. Minimum 10 digits required."
    });
  }

  try {
    const upstreamUrl = `https://tfqdeadlo-1-78bapi.hf.space/search?mobile=${cleanNumber}`;
    
    const apiResponse = await axios.get(upstreamUrl, {
      timeout: 9000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const rawData = apiResponse.data || {};
    const d = rawData.data || rawData;

    // Address Parsing Logic
    let state = "N/A", pincode = "N/A", fullLocation = "N/A";
    if (d.address && typeof d.address === 'string') {
      const parts = d.address.split('!').map(p => p.trim()).filter(Boolean);
      if (parts.length > 0) {
        fullLocation = parts.join(', ');
        state = parts[parts.length - 2] || "N/A";
        const possiblePin = parts[parts.length - 1];
        if (/^\d{6}$/.test(possiblePin)) {
          pincode = possiblePin;
        }
      }
    }

    return res.status(200).json({
      status: true,
      creator: "KaluaApiAdmin",
      channel: "@KaluaApiStore",
      target: cleanNumber,
      result: {
        name: d.name || d.fullname || "N/A",
        father_name: d.fname || d.father_name || d.fatherName || "N/A",
        unique_id: d.id || d.uid || "N/A",
        primary_number: cleanNumber,
        alternate_number: d.alt || d.alternate_number || d.alt_number || "N/A",
        email: d.email || d.Mail || "N/A",
        circle: d.circle || d.operator || "N/A",
        address: {
          location: fullLocation,
          state: state,
          pincode: pincode
        }
      }
    });

  } catch (error) {
    return res.status(500).json({
      status: false,
      creator: "KaluaApiAdmin",
      channel: "@KaluaApiStore",
      error: "Upstream server error ya timeout ho gaya hai.",
      details: error.message
    });
  }
};
