const axios = require('axios');

// ============================================================
// 💎 K-TRACE MASTER INTEL REPORT - TELEGRAM COMPACT EDITION
// ============================================================
module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const mobile = req.query.mobile;

  if (!mobile) {
    return res.status(400).send(`❌ *K-TRACE ERROR*\n\n⚠️ Status: FAILED\n💬 Message: Mobile parameter missing hai!\n🔍 Usage: \`/api/lookup?mobile=9999999891\``);
  }

  const cleanNumber = String(mobile).replace(/\D/g, '');
  if (cleanNumber.length < 10) {
    return res.status(400).send(`❌ *K-TRACE ERROR*\n\n⚠️ Status: FAILED\n💬 Message: Invalid format! Minimum 10 digits required.`);
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

    const report = `
👤 *PERSONAL IDENTITY*
├ 🏷️ *Name:* ${name}
├ 👨‍👦 *Father:* ${fname}
└ 🆔 *ID:* ${id}

📞 *COMMUNICATION & NETWORK*
├ 📱 *Primary:* ${cleanNumber}
├ ☎️ *Alternate:* ${altNum}
├ 📧 *Email:* ${email}
└ 📡 *Circle:* ${circle}

📍 *LOCATION DETAILS*
├ 🏠 *Address:* ${locationDetails}
├ 🗺️ *State:* ${state}
└ 📮 *Pincode:* ${pincode}
    `.trim();

    return res.status(200).send(report);

  } catch (error) {
    return res.status(500).send(`🔥 *SYSTEM ERROR*\n\n⚠️ Connection Failed\n🛠️ Details: ${error.message}`);
  }
};
