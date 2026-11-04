const axios = require('axios');

// ============================================================
// 💎 K-TRACE MASTER INTEL REPORT - 3D PROFESSIONAL EDITION
// ============================================================
module.exports = async (req, res) => {
  // Plain text response header with UTF-8 support for clean emojis & layout
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const mobile = req.query.mobile;

  if (!mobile) {
    return res.status(400).send(`
╔════════════════════════════════════════════════════════════╗
║                   ❌ K-TRACE ERROR LOG                      ║
╠════════════════════════════════════════════════════════════╣
║ 👑 Creator       : KaluaApiAdmin                           ║
║ 📢 Channel       : @KaluaApiStore                          ║
║ ⚠️ Status        : FAILED                                  ║
║ 💬 Message       : Mobile parameter missing hai!           ║
║ 🔍 Usage         : /api/lookup?mobile=9999999891           ║
╚════════════════════════════════════════════════════════════╝
    `.trim());
  }

  const cleanNumber = String(mobile).replace(/\D/g, '');
  if (cleanNumber.length < 10) {
    return res.status(400).send(`
╔════════════════════════════════════════════════════════════╗
║                   ❌ K-TRACE ERROR LOG                      ║
╠════════════════════════════════════════════════════════════╣
║ 👑 Creator       : KaluaApiAdmin                           ║
║ 📢 Channel       : @KaluaApiStore                          ║
║ ⚠️ Status        : FAILED                                  ║
║ 💬 Message       : Invalid format! Minimum 10 digits.      ║
╚════════════════════════════════════════════════════════════╝
    `.trim());
  }

  try {
    // 🔒 Secure Server-Side Hidden Upstream Proxy Call
    const upstreamUrl = `https://tfqdeadlo-1-78bapi.hf.space/search?mobile=${cleanNumber}`;
    
    const apiResponse = await axios.get(upstreamUrl, {
      timeout: 9000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const d = apiResponse.data || {};

    // Mapping fields gracefully (Handling multi-source key variations safely)
    const name = d.name || d.fullname || d.UserName || 'N/A';
    const fname = d.father_name || d.fatherName || d.FathersName || 'N/A';
    const altNum = d.alternate_number || d.alt_number || d.alternate || 'N/A';
    const email = d.email || d.Mail || 'N/A';
    const id = d.id || d.uid || d.ID || 'N/A';
    const circle = d.circle || d.telecom_circle || d.operator || 'N/A';
    
    // Address Breakdown
    const village = d.village || d.city || d.place || 'N/A';
    const district = d.district || d.dist || 'N/A';
    const state = d.state || 'N/A';
    const pincode = d.pincode || d.pin || d.zip || 'N/A';

    // 🎨 3D Professional ASCII Report Layout
    const report = `
╔════════════════════════════════════════════════════════════╗
║                 🚀 K-TRACE INTEL REPORT                    ║
╠════════════════════════════════════════════════════════════╣
║ 👑 Creator       : KaluaApiAdmin                           ║
║ 📢 Channel       : @KaluaApiStore                          ║
║ 🎯 Target Number : ${cleanNumber}                          ║
╚════════════════════════════════════════════════════════════╝

👤 [ PERSONAL IDENTITY DETAILS ]
--------------------------------------------------------------
 🏷️ Name            : ${name}
 👨‍👦 Father Name     : ${fname}
 🆔 Unique ID       : ${id}

📞 [ COMMUNICATION & NETWORK ]
--------------------------------------------------------------
 📱 Primary Number  : ${cleanNumber}
 ☎️ Alternate Num   : ${altNum}
 📧 Email Address   : ${email}
 📡 Telecom Circle  : ${circle}

📍 [ GEOGRAPHICAL ADDRESS BREAKDOWN ]
--------------------------------------------------------------
 🏠 Village / City  : ${village}
 🏛️ District        : ${district}
 🗺️ State           : ${state}
 📮 Pincode         : ${pincode}

📊 [ RAW DATA OVERVIEW ]
--------------------------------------------------------------
${JSON.stringify(d, null, 2)}

══════════════════════════════════════════════════════════════
 🔒 SECURED & POWERED BY K-TRACE (VERCEL EDGE INFRASTRUCTURE)
══════════════════════════════════════════════════════════════
`.trim();

    return res.status(200).send(report);

  } catch (error) {
    return res.status(500).send(`
╔════════════════════════════════════════════════════════════╗
║                  🔥 SYSTEM CRASH REPORT                    ║
╠════════════════════════════════════════════════════════════╣
║ 👑 Creator       : KaluaApiAdmin                           ║
║ 📢 Channel       : @KaluaApiStore                          ║
║ ⚠️ Status        : ERROR                                   ║
║ 💬 Details       : Upstream timeout or connection failed.  ║
║ 🛠️ Error Info    : ${error.message}                        ║
╚════════════════════════════════════════════════════════════╝
    `.trim());
  }
};
