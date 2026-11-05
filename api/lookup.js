const axios = require('axios');

// ============================================================
// 💎 K-TRACE MASTER INTEL REPORT - 3D GLASSMORPHIC UI EDITION
// ============================================================
module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');

  const mobile = req.query.mobile;
  const userKey = req.query.key;
  const MASTER_SECRET_KEY = "kalua_secret_999"; 

  // 🛡️ Security Check
  if (!userKey || userKey !== MASTER_SECRET_KEY) {
    return res.status(403).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Access Denied - K-Trace</title>
          <style>
              * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
              body { background: #020617; color: #f8fafc; min-height: 100vh; display: flex; justify-content: center; align-items: center; padding: 20px; }
              .card { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(20px); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 20px; padding: 30px; max-width: 420px; width: 100%; text-align: center; box-shadow: 0 25px 50px rgba(0,0,0,0.8); }
              h1 { color: #ef4444; font-size: 22px; margin-bottom: 15px; }
              p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
          </style>
      </head>
      <body>
          <div class="card">
              <h1>🚫 ACCESS DENIED</h1>
              <p>Invalid ya missing API Secret Key! Yeh API secured hai aur unauthorized access strictly prohibited hai.</p>
          </div>
      </body>
      </html>
    `);
  }

  if (!mobile) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Error - K-Trace</title>
          <style>
              * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
              body { background: #020617; color: #f8fafc; min-height: 100vh; display: flex; justify-content: center; align-items: center; padding: 20px; }
              .card { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(20px); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 20px; padding: 30px; max-width: 420px; width: 100%; text-align: center; box-shadow: 0 25px 50px rgba(0,0,0,0.8); }
              h1 { color: #38bdf8; font-size: 22px; margin-bottom: 15px; }
              p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
          </style>
      </head>
      <body>
          <div class="card">
              <h1>❌ MISSING PARAMETER</h1>
              <p>Mobile parameter missing hai! Sahi format use karein:<br><code>/api/lookup?mobile=9999999891&key=YOUR_KEY</code></p>
          </div>
      </body>
      </html>
    `);
  }

  const cleanNumber = String(mobile).replace(/\D/g, '');
  if (cleanNumber.length < 10) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invalid Number - K-Trace</title>
          <style>
              * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
              body { background: #020617; color: #f8fafc; min-height: 100vh; display: flex; justify-content: center; align-items: center; padding: 20px; }
              .card { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(20px); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 20px; padding: 30px; max-width: 420px; width: 100%; text-align: center; box-shadow: 0 25px 50px rgba(0,0,0,0.8); }
              h1 { color: #38bdf8; font-size: 22px; margin-bottom: 15px; }
              p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
          </style>
      </head>
      <body>
          <div class="card">
              <h1>⚠️ INVALID FORMAT</h1>
              <p>Mobile number minimum 10 digits ka hona chahiye.</p>
          </div>
      </body>
      </html>
    `);
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

    const htmlReport = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>K-Trace Intel Report - ${cleanNumber}</title>
        <style>
            * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', system-ui, sans-serif; }
            body {
                background: radial-gradient(circle at center, #1e1b4b, #0f172a, #020617);
                color: #f8fafc;
                min-height: 100vh;
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 15px;
            }
            .report-card {
                background: rgba(15, 23, 42, 0.75);
                backdrop-filter: blur(25px);
                -webkit-backdrop-filter: blur(25px);
                border: 1px solid rgba(56, 189, 248, 0.25);
                border-radius: 20px;
                width: 100%;
                max-width: 460px;
                padding: 24px;
                box-shadow: 0 30px 60px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.15);
            }
            .header {
                text-align: center;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                padding-bottom: 14px;
                margin-bottom: 18px;
            }
            .header h1 {
                font-size: 20px;
                font-weight: 800;
                color: #38bdf8;
                text-shadow: 0 0 15px rgba(56, 189, 248, 0.6);
                letter-spacing: 0.5px;
                margin-bottom: 4px;
            }
            .header .meta {
                font-size: 12px;
                color: #a5b4fc;
                font-weight: 500;
            }
            .section-title {
                font-size: 12px;
                font-weight: 700;
                color: #38bdf8;
                text-transform: uppercase;
                letter-spacing: 0.8px;
                margin: 14px 0 8px 0;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            .grid {
                background: rgba(2, 6, 23, 0.6);
                border: 1px solid rgba(255, 255, 255, 0.06);
                border-radius: 12px;
                padding: 10px 14px;
            }
            .row {
                display: flex;
                justify-content: space-between;
                padding: 7px 0;
                border-bottom: 1px solid rgba(255, 255, 255, 0.04);
                font-size: 13px;
            }
            .row:last-child { border-bottom: none; }
            .label { color: #94a3b8; font-weight: 500; }
            .value { color: #f8fafc; font-weight: 600; text-align: right; max-width: 60%; word-break: break-word; }
            .footer {
                margin-top: 18px;
                text-align: center;
                font-size: 11px;
                color: #64748b;
                border-top: 1px solid rgba(255, 255, 255, 0.08);
                padding-top: 12px;
                letter-spacing: 0.3px;
            }
        </style>
    </head>
    <body>
        <div class="report-card">
            <div class="header">
                <h1>🚀 K-TRACE INTEL REPORT</h1>
                <div class="meta">Admin: @KaluaApiAdmin | Target: ${cleanNumber}</div>
            </div>

            <div class="section-title">👤 Personal Identity Details</div>
            <div class="grid">
                <div class="row"><span class="label">🏷️ Name</span><span class="value">${name}</span></div>
                <div class="row"><span class="label">👨‍👦 Father Name</span><span class="value">${fname}</span></div>
                <div class="row"><span class="label">🆔 Unique ID</span><span class="value">${id}</span></div>
            </div>

            <div class="section-title">📞 Communication & Network</div>
            <div class="grid">
                <div class="row"><span class="label">📱 Primary Number</span><span class="value">${cleanNumber}</span></div>
                <div class="row"><span class="label">☎️ Alternate Num</span><span class="value">${altNum}</span></div>
                <div class="row"><span class="label">📧 Email Address</span><span class="value">${email}</span></div>
                <div class="row"><span class="label">📡 Telecom Circle</span><span class="value">${circle}</span></div>
            </div>

            <div class="section-title">📍 Geographical Address Breakdown</div>
            <div class="grid">
                <div class="row"><span class="label">🏠 Full Location</span><span class="value">${locationDetails}</span></div>
                <div class="row"><span class="label">🗺️ State</span><span class="value">${state}</span></div>
                <div class="row"><span class="label">📮 Pincode</span><span class="value">${pincode}</span></div>
            </div>

            <div class="footer">
                🔒 Secured & Powered by K-Trace (Vercel Edge Infrastructure)
            </div>
        </div>
    </body>
    </html>
    `.trim();

    return res.status(200).send(htmlReport);

  } catch (error) {
    return res.status(500).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>System Error - K-Trace</title>
          <style>
              * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
              body { background: #020617; color: #f8fafc; min-height: 100vh; display: flex; justify-content: center; align-items: center; padding: 20px; }
              .card { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(20px); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 20px; padding: 30px; max-width: 420px; width: 100%; text-align: center; box-shadow: 0 25px 50px rgba(0,0,0,0.8); }
              h1 { color: #ef4444; font-size: 22px; margin-bottom: 15px; }
              p { color: #94a3b8; font-size: 14px; line-height: 1.6; }
          </style>
      </head>
      <body>
          <div class="card">
              <h1>🔥 SYSTEM CRASH</h1>
              <p>Upstream timeout ya connection fail ho gaya hai.<br><br>Error: ${error.message}</p>
          </div>
      </body>
      </html>
    `);
  }
};
