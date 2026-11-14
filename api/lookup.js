const axios = require('axios');

// ============================================================
// 💎 K-TRACE MASTER INTEL API - PROPRIETARY EDITION
// ============================================================
module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const mobile = req.query.mobile || req.query.num;

  if (!mobile) {
    const errorData = {
      status: false,
      "❌ ERROR LOG": {
        "Status": "FAILED",
        "Message": "Mobile parameter missing hai! Example: /api/lookup?mobile=9876543210"
      }
    };
    return res.status(400).send(JSON.stringify(errorData, null, 2));
  }

  const cleanNumber = String(mobile).replace(/\D/g, '');
  if (cleanNumber.length < 10) {
    const errorData = {
      status: false,
      "❌ ERROR LOG": {
        "Status": "FAILED",
        "Message": "Invalid format! Minimum 10 digits required."
      }
    };
    return res.status(400).send(JSON.stringify(errorData, null, 2));
  }

  try {
    const upstreamUrl = `https://bronx-ultra-king.duckdns.org/api/custom/num-hitek?key=999&num=${cleanNumber}`;
    
    const apiResponse = await axios.get(upstreamUrl, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const rawData = apiResponse.data || {};
    const d = rawData.data || rawData.result || rawData;

    const name = d.name || d.fullname || d.UserName || 'N/A';
    const fname = d.fname || d.father_name || d.fatherName || d.FatherName || 'N/A';
    const altNum = d.alt || d.alternate_number || d.alt_number || d.AlternateNumber || 'N/A';
    const email = d.email || d.Mail || d.Email || 'N/A';
    const id = d.id || d.uid || d.UniqueId || 'N/A';
    const circle = d.circle || d.operator || d.TelecomCircle || 'N/A';

    let state = 'N/A', pincode = 'N/A', locationDetails = 'N/A';
    const addr = d.address || d.Address || '';
    if (addr && typeof addr === 'string') {
      const parts = addr.split('!').map(p => p.trim()).filter(Boolean);
      if (parts.length > 0) {
        locationDetails = parts.join(', ');
        state = parts[parts.length - 2] || 'N/A';
        const possiblePin = parts[parts.length - 1];
        if (/^\d{6}$/.test(possiblePin)) {
          pincode = possiblePin;
        }
      }
    } else if (typeof addr === 'object' && addr !== null) {
      locationDetails = addr.location || addr.full || 'N/A';
      state = addr.state || 'N/A';
      pincode = addr.pincode || 'N/A';
    }

    const responseData = {
      status: true,
      "🚀 K-TRACE INTEL REPORT": {
        "🎯 Target Number": cleanNumber
      },
      "👤 [ PERSONAL IDENTITY DETAILS ]": {
        "🏷️ Name": name,
        "👨‍👦 Father Name": fname,
        "🆔 Unique ID": id
      },
      "📞 [ COMMUNICATION & NETWORK ]": {
        "📱 Primary Number": cleanNumber,
        "☎️ Alternate Num": altNum,
        "📧 Email Address": email,
        "📡 Telecom Circle": circle
      },
      "📍 [ GEOGRAPHICAL ADDRESS BREAKDOWN ]": {
        "🏠 Full Location": locationDetails,
        "🗺️ State": state,
        "📮 Pincode": pincode
      }
    };

    return res.status(200).send(JSON.stringify(responseData, null, 2));

  } catch (error) {
    const crashData = {
      status: false,
      "🔥 SYSTEM REPORT": {
        "Status": "ERROR",
        "Message": "Service temporarily busy, please try again."
      }
    };
    return res.status(500).send(JSON.stringify(crashData, null, 2));
  }
};
