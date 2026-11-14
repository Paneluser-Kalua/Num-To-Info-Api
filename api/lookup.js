const axios = require('axios');

// ============================================================
// 🔒 KALUA API STORE - COMPACT INTEL ENGINE
// ============================================================
module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const mobile = req.query.mobile;

  if (!mobile) {
    return res.status(400).send(`
╔════════════════════════════════════════════════╗
║                ❌ ERROR LOG                    ║
╠════════════════════════════════════════════════╣
║ 💬 Mobile parameter missing hai!               ║
║ 🔍 Usage: /api/lookup?mobile=9876543210        ║
╚════════════════════════════════════════════════╝
    `.trim());
  }

  const cleanNumber = String(mobile).replace(/\D/g, '');
  if (cleanNumber.length < 10) {
    return res.status(400).send(`
╔════════════════════════════════════════════════╗
║                ❌ ERROR LOG                    ║
╠════════════════════════════════════════════════╣
║ 💬 Invalid format! Minimum 10 digits required. ║
╚════════════════════════════════════════════════╝
    `.trim());
  }

  try {
    // 🔒 Fully hidden internal secure proxy call
    const upstreamUrl = `http://bronx-ultra-king.duckdns.org/api/custom/num-hitek?key=999&num=${cleanNumber}`;
    
    const apiResponse = await axios.get(upstreamUrl, {
      timeout: 9000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const rawData = apiResponse.data || {};
    const d = rawData.data || rawData;

    // Mapping all main extracted fields cleanly
    const name = d.name || d.fullname || 'N/A';
    const fname = d.fname || d.father_name || d.fatherName || 'N/A';
    const altNum = d.alt || d.alternate_number || d.alt_number || 'N/A';
    const email = d.email || d.Mail || 'N/A';
    const id = d.id || d.uid || 'N/A';
    const circle = d.circle || d.operator || 'N/A';
    const address = d.address || 'N/A';

    // ⏳ 1-Day Demo Expiry Calculation
    const expiryDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    // Compact & Short 3D Professional Layout
    const report = `
╔════════════════════════════════════════════════╗
║            🔍 NUMBER INTEL REPORT              ║
╠════════════════════════════════════════════════╣
║ 🎯 Target : ${cleanNumber}                     ║
║ ⏳ Demo   : 24h (Exp: ${expiryDate})           ║
╚════════════════════════════════════════════════╝

👤 [ IDENTIFICATION ]
--------------------------------------------------
 🏷️ Name   : ${name}
 👨‍👦 Father : ${fname}
 🆔 ID     : ${id}

📞 [ NETWORK & CONTACT ]
--------------------------------------------------
 📱 Number : ${cleanNumber}
 ☎️ Alt    : ${altNum}
 📧 Email  : ${email}
 📡 Circle : ${circle}

📍 [ LOCATION ]
--------------------------------------------------
 🏠 Address: ${address}

══════════════════════════════════════════════════
 ⚡ EXCLUSIVE DEMO BY KALUA API STORE
══════════════════════════════════════════════════
`.trim();

    return res.status(200).send(report);

  } catch (error) {
    return res.status(500).send(`
╔════════════════════════════════════════════════╗
║                🔥 ERROR REPORT                 ║
╠════════════════════════════════════════════════╣
║ 💬 Lookup timeout or failed.                   ║
╚════════════════════════════════════════════════╝
    `.trim());
  }
};
