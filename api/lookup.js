const axios = require('axios');

// ⏱️ Vercel Function Execution Limit Set (15 Seconds)
module.exports.maxDuration = 15;

// ============================================================
// 💎 K-TRACE MASTER INTEL API - MOBILE OPTIMIZED JSON VIEWER
// ============================================================
module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const mobile = req.query.mobile;

  if (!mobile) {
    const errorData = {
      status: false,
      "❌ K-TRACE ERROR LOG": {
        "👑 Creator": "KaluaApiAdmin",
        "📢 Channel": "@KaluaApiStore",
        "⚠️ Status": "FAILED",
        "💬 Message": "Mobile parameter missing hai! Example: /api/lookup?mobile=9999999891"
      }
    };
    return res.status(400).send(renderJsonViewer(errorData));
  }

  const cleanNumber = String(mobile).replace(/\D/g, '');
  if (cleanNumber.length < 10) {
    const errorData = {
      status: false,
      "❌ K-TRACE ERROR LOG": {
        "👑 Creator": "KaluaApiAdmin",
        "📢 Channel": "@KaluaApiStore",
        "⚠️ Status": "FAILED",
        "💬 Message": "Invalid format! Minimum 10 digits required."
      }
    };
    return res.status(400).send(renderJsonViewer(errorData));
  }

  try {
    const upstreamUrl = `https://tfqdeadlo-1-78bapi.hf.space/search?mobile=${cleanNumber}`;
    
    const apiResponse = await axios.get(upstreamUrl, {
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

    const responseData = {
      status: true,
      "🚀 K-TRACE INTEL REPORT": {
        "👑 Creator": "KaluaApiAdmin",
        "📢 Channel": "@KaluaApiStore",
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
      },
      "footer": "🔒 SECURED & POWERED BY K-TRACE ( KALUA X ADITYA )"
    };

    return res.status(200).send(renderJsonViewer(responseData));

  } catch (error) {
    const crashData = {
      status: false,
      "🔥 SYSTEM CRASH REPORT": {
        "👑 Creator": "KaluaApiAdmin",
        "📢 Channel": "@KaluaApiStore",
        "⚠️ Status": "ERROR",
        "💬 Reason": "Upstream server slow ya sleep mode me hai. Dobara refresh karein.",
        "🛠️ Error Info": error.message
      }
    };
    return res.status(500).send(renderJsonViewer(crashData));
  }
};

function renderJsonViewer(obj) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>K-Trace Intel Report - API Viewer</title>
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Fira Code', Consolas, Monaco, monospace; }
            body {
                background: radial-gradient(circle at center, #1e1b4b, #0f172a, #020617);
                color: #e2e8f0;
                min-height: 100vh;
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 12px;
            }
            .json-card {
                background: rgba(15, 23, 42, 0.9);
                backdrop-filter: blur(25px);
                -webkit-backdrop-filter: blur(25px);
                border: 1px solid rgba(56, 189, 248, 0.35);
                border-radius: 18px;
                width: 100%;
                max-width: 460px;
                padding: 20px;
                box-shadow: 0 30px 60px rgba(0, 0, 0, 0.9), inset 0 1px 0 rgba(255, 255, 255, 0.15);
            }
            .top-bar {
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid rgba(255, 255, 255, 0.12);
                padding-bottom: 10px;
                margin-bottom: 14px;
                font-size: 11px;
                color: #38bdf8;
                font-weight: bold;
                letter-spacing: 0.5px;
            }
            pre {
                font-size: 12px;
                line-height: 1.6;
                color: #f8fafc;
                white-space: pre-wrap;
                word-break: break-word;
            }
            .string { color: #34d399; }
            .number { color: #fbbf24; }
            .boolean { color: #f43f5e; }
            .null { color: #94a3b8; }
            .key { color: #38bdf8; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="json-card">
            <div class="top-bar">
                <span>⚡ K-TRACE JSON OUTPUT</span>
                <span>🟢 MOBILE READY</span>
            </div>
            <pre id="output"></pre>
        </div>

        <script>
            function syntaxHighlight(json) {
                if (typeof json != 'string') {
                     json = JSON.stringify(json, undefined, 2);
                }
                json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
                    let cls = 'number';
                    if (/^"/.test(match)) {
                        if (/:$/.test(match)) {
                            cls = 'key';
                        } else {
                            cls = 'string';
                        }
                    } else if (/true|false/.test(match)) {
                        cls = 'boolean';
                    } else if (/null/.test(match)) {
                        cls = 'null';
                    }
                    return '<span class="' + cls + '">' + match + '</span>';
                });
            }

            const dataObj = ${JSON.stringify(obj)};
            document.getElementById('output').innerHTML = syntaxHighlight(dataObj);
        </script>
    </body>
    </html>
  `.trim();
}
