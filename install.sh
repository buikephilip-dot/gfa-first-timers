const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

const outFile = process.argv[2] || 'qr-code.html';
const churchName = process.argv[3] || "God's Family Assembly";
const targetUrl = process.argv[4] || 'http://localhost:3000/form';

(async () => {
  const dataUrl = await QRCode.toDataURL(targetUrl, { width: 420, margin: 1 });
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${churchName} QR Code</title>
<style>
body{font-family:Arial,sans-serif;padding:40px;text-align:center;background:#f8fafc;color:#111827}
.card{background:#fff;max-width:680px;margin:0 auto;padding:30px;border-radius:20px;box-shadow:0 10px 30px rgba(0,0,0,.08)}
img{max-width:100%;height:auto}
.small{color:#6b7280}
button{padding:12px 16px;border:none;border-radius:12px;background:#1d4ed8;color:#fff;font-weight:700;cursor:pointer}
</style>
</head>
<body>
<div class="card">
<h1>${churchName}</h1>
<p>Scan to open the First Timers Form</p>
<img src="${dataUrl}" alt="QR Code" />
<p><strong>${targetUrl}</strong></p>
<p class="small">Print this on screens, flyers, banners, or welcome desk materials.</p>
<button onclick="window.print()">Print / Save as PDF</button>
</div>
</body>
</html>`;
  fs.writeFileSync(path.resolve(process.cwd(), outFile), html);
  console.log(`QR HTML generated at ${outFile}`);
})();
