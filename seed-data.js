# God's Family Assembly First Timers Form

A clean, mobile first web app for church first time visitor capture, follow up tracking, and QR based access.

## What is included

- Public first timer form
- Admin dashboard
- SQLite database
- Secure admin login
- CSV export
- QR code generator
- Seed data script

## Quick start

```bash
npm install
npm start
```

Then open:

- Form: http://localhost:3000/form
- Admin: http://localhost:3000/admin

Default admin login:

- Username: `admin`
- Password: `Admin@123`

Change those before production.

## Project files

- `public/index.html`
- `public/admin.html`
- `server.js`
- `package.json`
- `.env.example`
- `seed-data.js`
- `generate-qr.js`

## Configuration

Copy `.env.example` to `.env` and update the values:

```bash
PORT=3000
BASE_URL=http://localhost:3000
JWT_SECRET=change-me
ADMIN_PASSWORD=Admin@123
```

## Seed sample data

```bash
npm run seed
```

## Generate QR code

```bash
node generate-qr.js qr-code.html "God's Family Assembly" "http://localhost:3000/form"
```

## Notes

- Duplicate protection is based on phone number and date of visit.
- Draft form progress is saved in browser local storage.
- Department interests are shown only when needed.
- Contact method is shown only when follow up is requested.
