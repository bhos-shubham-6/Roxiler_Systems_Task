# Roxiler - Store Ratings Platform

Full-stack web application for submitting and managing store ratings with role-based access control.

## Tech Stack

- **Backend:** Express.js, MySQL/PostgreSQL/PGLite, JWT authentication
- **Frontend:** React (Vite), React Router

## Features

### System Administrator
- Dashboard with total users, stores, and ratings
- Add users (admin, normal user, store owner) and stores
- View/filter/sort users and stores
- View user details (including store owner ratings)

### Normal User
- Sign up and login
- Browse/search stores by name and address
- Submit and modify ratings (1-5)
- Update password

### Store Owner
- View users who rated their store
- See average store rating
- Update password

## Prerequisites

- Node.js 18+
- MySQL 8+ (recommended) or PostgreSQL 14+

## Quick Start

### 1. Configure Database

MySQL mode (default in `.env`):

```env
DB_MODE=mysql
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=roxiler_db
```

Create DB once:

```sql
CREATE DATABASE roxiler_db;
```

Optional PostgreSQL mode:

```env
DB_MODE=postgres
DATABASE_URL=postgresql://postgres:password@localhost:5432/roxiler_db
```

Optional embedded mode (no DB install):

```env
DB_MODE=embedded
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
npm install
npm run db:init
npm run dev
```

Backend runs at `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`

## Default Admin Credentials

| Email | Password |
|-------|----------|
| admin@roxiler.com | Admin@123 |

## API Endpoints

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | Public | User signup |
| POST | /api/auth/login | Public | Login |
| PUT | /api/auth/password | Auth | Update password |
| GET | /api/admin/dashboard | Admin | Dashboard stats |
| GET/POST | /api/admin/users | Admin | List/create users |
| GET | /api/admin/users/:id | Admin | User details |
| GET/POST | /api/admin/stores | Admin | List/create stores |
| GET | /api/stores | User | List stores with ratings |
| POST/PUT | /api/stores/:id/ratings | User | Submit/update rating |
| GET | /api/store-owner/dashboard | Store Owner | Owner dashboard |
| GET | /api/store-owner/raters | Store Owner | List raters |

## Form Validations

- **Name:** 20-60 characters
- **Address:** Max 400 characters
- **Password:** 8-16 characters, one uppercase, one special character
- **Email:** Standard email format
- **Rating:** 1-5

## Project Structure

```
Roxiler/
├── backend/
│   ├── src/
│   │   ├── db/          # Database pool & init
│   │   ├── middleware/   # Auth middleware
│   │   ├── routes/       # API routes
│   │   ├── utils/        # Query helpers
│   │   └── validators/   # Input validation
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/          # Axios client
│   │   ├── components/   # Shared UI
│   │   ├── context/      # Auth context
│   │   ├── pages/        # Role dashboards
│   │   └── utils/        # Form validation
│   └── package.json
└── docker-compose.yml
```
