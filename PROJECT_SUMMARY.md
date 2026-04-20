{
  "name": "gfa-first-timers",
  "version": "1.0.0",
  "description": "God's Family Assembly first timers form web app",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js",
    "seed": "node seed-data.js",
    "qr": "node generate-qr.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "json2csv": "^6.0.0-alpha.2",
    "jsonwebtoken": "^9.0.2",
    "qrcode": "^1.5.4",
    "sqlite3": "^5.1.7"
  }
}
