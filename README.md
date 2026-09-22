# EIC-SiteSight

A Progressive Web App (PWA) for site defect reporting, developed for EIC Advance Sdn Bhd.

---

## Setup Instructions

### Prerequisites
- Node.js v18+
- PostgreSQL v15+
- pgAdmin 4 (optional, for GUI database management)

---

### 1. Database Setup

1. Open pgAdmin or psql
2. Create a new database called `eic_sitesight`
3. Open the file `server/db/schema.sql`
4. Run the SQL in pgAdmin's Query Tool or psql

Default admin credentials:
- Email: `admin@eicadvance.com`
- Password: `admin123`

---

### 2. Server Setup

```bash
cd server
npm install
```

Edit the `.env` file and update:
```
DB_PASSWORD=your_postgres_password
JWT_SECRET=any_random_long_string_here
```

Start the server:
```bash
npm run dev
```

Server runs on: http://localhost:5000

---

### 3. Client Setup

```bash
cd client
npm install
npm run dev
```

Client runs on: http://localhost:5173

---

## Routes

| Route | Description | Auth |
|-------|-------------|------|
| `/` | Field defect submission form | None |
| `/admin/login` | Admin login | None |
| `/admin/dashboard` | Report management dashboard | Required |
| `/admin/report/:id` | Report detail + PDF generation | Required |

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/reports | Submit defect report | No |
| GET | /api/reports | Get all reports (filters) | Yes |
| GET | /api/reports/:id | Get single report | Yes |
| PATCH | /api/reports/:id/status | Update status | Yes |
| GET | /api/reports/:id/pdf | Generate PDF | Yes |
| POST | /api/auth/login | Admin login | No |
