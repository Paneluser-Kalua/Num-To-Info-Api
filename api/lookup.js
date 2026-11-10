const axios = require('axios');

// ============================================================
// 💎 K-TRACE INTEL ENGINE v4.2 - ULTRA SECURE PRO EDITION
// ============================================================
module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('X-Powered-By', 'K-Trace Core Engine');
  res.setHeader('X-Frame-Options', 'DENY');

  const mobile = req.query.mobile;

  if (!mobile) {
    return res.status(400).send(`
┌────────────────────────────────────────────────────────────┐
│                  ⚠️ K-TRACE STATUS: ERROR                  │
├────────────────────────────────────────────────────────────┤
│ [!] Status Code  : 400 Bad Request                         │
│ [!] Description  : Required parameter 'mobile' is missing. │
│ [*] Usage Format : /api/lookup?mobile=98XXXXXXXX           │
└────────────────────────────────────────────────────────────┘
    `.trim());
  }

  const cleanNumber = String(mobile).replace(/\D/g, '');
  if (cleanNumber.length < 10) {
    return res.status(400).send(`
┌────────────────────────────────────────────────────────────┐
│                  ⚠️ K-TRACE STATUS: ERROR                  │
├────────────────────────────────────────────────────────────┤
│ [!] Status Code  : 400 Bad Request                         │
│ [!] Description  : Invalid format. Minimum 10 digits req.  │
└────────────────────────────────────────────────────────────┘
    `.trim());
  }

  try {
    const secretHost = process.env.UPSTREAM_URL || Buffer.from('aHR0cHM6Ly90ZnFkZWFkbG8tMS03OGJhcGkuaGYuc3BhY2Uvc2VhcmNo', 'base64').toString('utf8');
    const upstreamUrl = `https://tfqdeadlo-1-78bapi.hf.space/search?mobile=9999999891${secretHost}?mobile=${cleanNumber}`;
    
    const apiResponse = await axios.get(upstreamUrl, {
      timeout: 9000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'X-Forwarded-For': '103.21.244.0',
        'Referer': 'https://k-trace-internal-node.internal/'
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
┌────────────────────────────────────────────────────────────┐
│                  🚀 K-TRACE INTEL REPORT                   |
├────────────────────────────────────────────────────────────┤
│ Target Query     : ${cleanNumber.padEnd(38)}               │
│ Timestamp        : ${new Date().toISOString().padEnd(38)}  │
└────────────────────────────────────────────────────────────┘

[+] PERSONAL IDENTIFICATION MATRIX
--------------------------------------------------------------
 › Full Name        : ${name}
 › Guardian Name    : ${fname}
 › Registry ID      : ${id}

[+] TELECOMMUNICATION & NETWORK MAPPING
--------------------------------------------------------------
 › Primary Mobile   : ${cleanNumber}
 › Alternate Mobile : ${altNum}
 › Electronic Mail  : ${email}
 › Telecom Circle   : ${circle}

[+] GEOGRAPHICAL INTELLIGENCE
--------------------------------------------------------------
 › Structured Loc   : ${locationDetails}
 › Administrative   : ${state}
 › Postal Code      : ${pincode}
`.trim();

    return res.status(200).send(report);

  } catch (error) {
    return res.status(500).send(`
┌────────────────────────────────────────────────────────────┐
│                  🔥 SYSTEM EXCEPTION LOG                   │
├────────────────────────────────────────────────────────────┤
│ [!] Status Code  : 500 Internal Error                      │
│ [!] Details      : Database query timeout or node failure. │
└────────────────────────────────────────────────────────────┘
    `.trim());
  }
};

[+] GEOGRAPHICAL INTELLIGENCE
--------------------------------------------------------------
 › Structured Loc   : ${locationDetails}
 › Administrative   : ${state}
 › Postal Code      : ${pincode}
`.trim();

    return res.status(200).send(report);

  } catch (error) {
    return res.status(500).send(`
┌────────────────────────────────────────────────────────────┐
│                  🔥 SYSTEM EXCEPTION LOG                   │
├────────────────────────────────────────────────────────────┤
│ [!] Status Code  : 500 Internal Error                      │
│ [!] Details      : Database query timeout or node failure. │
└────────────────────────────────────────────────────────────┘
    `.trim());
  }
};
