const axios = require('axios');

// Vercel Serverless Timeout Limit
module.exports.maxDuration = 15;

// ============================================================
// 💎 KALUA INTEL ENGINE - PRIVATE ENTERPRISE EDITION
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
      status: false,
      code: 400,
      developer: "Kalua",
      channel: "@KaluaApiStore",
      message: "Missing mobile parameter. Usage: /api/lookup?mobile=9999999891"
    });
  }

  const cleanNumber = String(mobile).replace(/\D/g, '');
  if (cleanNumber.length < 10) {
    return res.status(400).json({
      status: false,
      code: 400,
      developer: "Kalua",
      channel: "@KaluaApiStore",
      message: "Invalid format. Mobile number must be at least 10 digits."
    });
  }

  try {
    const internalCoreUrl = `https://api.allprinthub.in/api?num_info_767&key=7day&%40Ronak_api=9162516577&mobile=${cleanNumber}`;
    
    const apiResponse = await axios.get(internalCoreUrl, {
      timeout: 12000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const rawData = apiResponse.data || {};

    // 🔍 Deep search helper for nested objects
    function findKey(obj, targetKeys) {
      if (!obj || typeof obj !== 'object') return 'N/A';
      for (const k of targetKeys) {
        if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') {
          return obj[k];
        }
      }
      for (const key of Object.keys(obj)) {
        if (typeof obj[key] === 'object') {
          const found = findKey(obj[key], targetKeys);
          if (found !== 'N/A') return found;
        }
      }
      return 'N/A';
    }

    const name = findKey(rawData, ['name', 'fullname', 'full_name', 'userName', 'owner_name']);
    const fname = findKey(rawData, ['fname', 'father_name', 'fatherName', 'father']);
    const altNum = findKey(rawData, ['alt', 'alternate_number', 'alt_number', 'alternate']);
    const email = findKey(rawData, ['email', 'Mail', 'mail']);
    const id = findKey(rawData, ['id', 'uid', 'user_id']);
    const circle = findKey(rawData, ['circle', 'operator', 'telecom_circle']);
    const address = findKey(rawData, ['address', 'location', 'full_address']);

    let state = findKey(rawData, ['state']);
    let pincode = findKey(rawData, ['pincode', 'pin', 'postal_code']);
    let locationDetails = address;

    if (address !== 'N/A' && address.includes('!')) {
      const parts = address.split('!').map(p => p.trim()).filter(Boolean);
      if (parts.length > 0) {
        locationDetails = parts.join(', ');
        state = parts[parts.length - 2] || state;
        const possiblePin = parts[parts.length - 1];
        if (/^\d{6}$/.test(possiblePin)) {
          pincode = possiblePin;
        }
      }
    }

    const payload = {
      status: true,
      code: 200,
      developer: "Kalua",
      channel: "@KaluaApiStore",
      query: cleanNumber,
      result: {
        identity: {
          name: name,
          father_name: fname,
          unique_id: id
        },
        communication: {
          primary_number: cleanNumber,
          alternate_number: altNum,
          email_address: email,
          telecom_circle: circle
        },
        address: {
          full_location: locationDetails,
          state: state,
          pincode: pincode
        }
      }
    };

    return res.status(200).json(payload);

  } catch (error) {
    return res.status(500).json({
      status: false,
      code: 500,
      developer: "Kalua",
      channel: "@KaluaApiStore",
      error: "Database lookup failed or connection timeout.",
      details: error.message
    });
  }
};
