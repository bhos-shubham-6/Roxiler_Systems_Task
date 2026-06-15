# Roxiler - Store Ratings Platform (Shubham Bhos)

### 1. Configure Database

Create DB once:

    CREATE DATABASE roxiler_db;

Add env file:

PORT=5000
DB_MODE=mysql
DATABASE_URL=postgresql://postgres:password@localhost:5432/roxiler_db
MYSQL_HOST=127.0.0.1
MYSQL_PORT=
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=roxiler_db
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

   add your MYSQL_PORT and MYSQL_PASSWORD

### 2. Backend Setup

cd backend
cp .env.example .env
npm install
npm run db:init
npm run dev

Backend run `http://localhost:5000`

### 3. Frontend Setup

cd frontend
npm install
npm run dev

Frontend run `http://localhost:3000`

## Default Admin Credentials

 Email : admin@roxiler.com 
 Password : Admin@123 
