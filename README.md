# Project Summary

This application is structured as a lightweight Express and SQLite project.

## Main layers

### Frontend
- `public/index.html`
- `public/admin.html`

### Backend
- `server.js`

### Data
- `firstTimers.db`

## API routes

### Public
- `POST /api/submit-first-timer`
- `GET /api/qr-code-data`

### Admin
- `POST /api/admin/login`
- `GET /api/admin/first-timers`
- `GET /api/admin/first-timers/:id`
- `PATCH /api/admin/first-timers/:id`
- `GET /api/admin/analytics`
- `GET /api/admin/export-csv`

## Current defaults

- Admin username: `admin`
- Admin password: `Admin@123`

## Safe next upgrades

- WhatsApp webhook on submission
- Email notification to follow up team
- PostgreSQL if scale grows
- Multi campus service support
- Role based permissions
