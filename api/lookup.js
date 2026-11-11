const axios = require('axios');

// Vercel Serverless Timeout Limit
module.exports.maxDuration = 15;

// ============================================================
// 🔒 KALUA INTEL ENGINE - PRIVATE ENTERPRISE EDITION
// ============================================================
module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // ⏳ Automatic Expiry Logic (3 Months from Nov 2026 -> Feb 2027)
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
    // Fully concealed backend routing
    const internalCoreUrl = `https://api.allprinthub.in/api?=num_info_767&key=7day&%40Ronak_api=${cleanNumber}`;
    
    const apiResponse = await axios.get(internalCoreUrl, {
      timeout: 12000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const rawData = apiResponse.data || {};
    const d = rawData.data || rawData;

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
