const axios = require('axios');

// ============================================================
// 💎 K-TRACE MASTER INTEL REPORT - JSON API EDITION
// ============================================================
module.exports = async (req, res) => {
  // CORS & Content-Type Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const mobile = req.query.mobile;

  // Validation: Missing Parameter
  if (!mobile) {
    return res.status(400).json({
      status: false,
      statusCode: 400,
      creator: 'KaluaApiAdmin',
      message: 'Mobile parameter missing hai!',
      usage: '/api/lookup?mobile=9999999891'
    });
  }

  const cleanNumber = String(mobile).replace(/\D/g, '');

  // Validation: Length Check
  if (cleanNumber.length < 10) {
    return res.status(400).json({
      status: false,
      statusCode: 400,
      creator: 'KaluaApiAdmin',
      message: 'Invalid mobile number! Minimum 10 digits required.'
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

    // Parsed Attributes
    const name = d.name || d.fullname || 'N/A';
    const fname = d.fname || d.father_name || d.fatherName || 'N/A';
    const altNum = d.alt || d.alternate_number || d.alt_number || 'N/A';
    const email = d.email || d.Mail || 'N/A';
    const id = d.id || d.uid || 'N/A';
    const circle = d.circle || d.operator || 'N/A';

    // Address & Location Logic
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

    // Success JSON Response
    return res.status(200).json({
      status: true,
      statusCode: 200,
      creator: 'KaluaApiAdmin',
      result: {
        personal_identity: {
          name: name,
          father_name: fname,
          id_number: id
        },
        communication: {
          primary_mobile: cleanNumber,
          alternate_mobile: altNum,
          email: email,
          circle: circle
        },
        location: {
          address: locationDetails,
          state: state,
          pincode: pincode
        }
      }
    });

  } catch (error) {
    // Error JSON Response
    return res.status(500).json({
      status: false,
      statusCode: 500,
      creator: 'KaluaApiAdmin',
      error: 'SYSTEM_CONNECTION_FAILED',
      message: error.message || 'Upstream server request failed'
    });
  }
};
