const axios = require('axios');

// ============================================================
// 📄 K-TRACE TEXT REPORT FORMAT API - KALUA API STORE
// ============================================================
module.exports = async (req, res) => {
  // Set response type as plain text so it renders like a clean report
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const mobile = req.query.mobile;

  if (!mobile) {
    return res.status(400).send(`
[ ERROR REPORT ]
------------------------------------------------------------
> Creator  : KaluaApiAdmin
> Channel  : @KaluaApiStore
> Status   : FAILED
> Message  : Mobile parameter missing hai! 
> Usage    : /api/lookup?mobile=9999999891
------------------------------------------------------------
    `.trim());
  }

  const cleanNumber = String(mobile).replace(/\D/g, '');
  if (cleanNumber.length < 10) {
    return res.status(400).send(`
[ ERROR REPORT ]
------------------------------------------------------------
> Creator  : KaluaApiAdmin
> Channel  : @KaluaApiStore
> Status   : FAILED
> Message  : Invalid mobile number format. Minimum 10 digits required.
------------------------------------------------------------
    `.trim());
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

    const data = apiResponse.data;

    // Formatting raw data into a clean, professional text report layout
    let report = `
🚗 K-TRACE NUMBER INTEL REPORT
------------------------------------------------------------
> Target Number : ${cleanNumber}
> Creator       : KaluaApiAdmin
> Channel       : @KaluaApiStore
------------------------------------------------------------
📊 FETCHED DETAILS:
`;

    // Automatically map and format object data keys nicely
    if (typeof data === 'object' && data !== null) {
      for (const [key, value] of Object.entries(data)) {
        report += `• ${key.toUpperCase()} : ${JSON.stringify(value)}\n`;
      }
    } else {
      report += `• RESULT : ${data}\n`;
    }

    report += `------------------------------------------------------------
[ SECURED & POWERED BY K-TRACE & VERCEL ]
`;

    return res.status(200).send(report.trim());

  } catch (error) {
    return res.status(500).send(`
[ SYSTEM ERROR REPORT ]
------------------------------------------------------------
> Creator  : KaluaApiAdmin
> Channel  : @KaluaApiStore
> Status   : ERROR
> Details  : Upstream server error ya timeout ho gaya hai.
> Error    : ${error.message}
------------------------------------------------------------
    `.trim());
  }
};
