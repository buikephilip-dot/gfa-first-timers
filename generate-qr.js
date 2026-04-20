# Deployment Guide

## Basic local deployment

1. Install Node.js 18 or later.
2. Extract the project folder.
3. Open a terminal in the folder.
4. Run:

```bash
npm install
cp .env.example .env
npm start
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
npm install
npm start
```

## Production checklist

- Change `JWT_SECRET`
- Change admin password
- Put the app behind HTTPS
- Update `BASE_URL`
- Back up `firstTimers.db`
- Restrict admin access to trusted staff

## Low cost hosting options

- Render
- Railway
- DigitalOcean App Platform
- VPS with Ubuntu + Nginx

## Example on Render

- Create a new Web Service
- Build command: `npm install`
- Start command: `npm start`
- Add environment variables from `.env`

## Database backup

The SQLite file is `firstTimers.db`.

Manual backup:

```bash
cp firstTimers.db firstTimers.backup.db
```
