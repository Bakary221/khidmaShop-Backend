# 🚀 KhidmaShop Backend - Quick Start Guide

## 5 Minutes Setup

### 1️⃣ **Start PostgreSQL** (Option A: Docker)

```bash
docker-compose up -d postgres
# Wait 10 seconds for DB to be ready
```

### 2️⃣ **Environment Setup**

```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL=postgresql://db_user:db_password@localhost:5432/khidmashop?schema=public
JWT_SECRET=your-32-character-minimum-secret-key-here
CORS_ORIGIN=http://localhost:3000
```

### 3️⃣ **Install & Migrate**

```bash
npm install

# Generate Prisma Client
npm run prisma:generate

# Create DB tables
npm run prisma:migrate

# Seed demo data
npm run prisma:seed
```

### 4️⃣ **Start Server**

```bash
npm run start:dev
```

✅ Server running: **http://localhost:3001**
📘 Swagger docs: **http://localhost:3001/api/docs**

---

## 🔓 Demo Credentials

| Type | Login | Password |
|------|-------|----------|
| **Client** | `0700000001` | OTP: `123456` |
| **Admin** | `admin@khidma.shop` | `khidma123` |

---

## 📝 Environment Variables

```env
# Core
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/khidmashop

# Authentication
JWT_SECRET=your-secret-key-32-chars-minimum
JWT_EXPIRATION=900
JWT_REFRESH_SECRET=your-refresh-secret-32-chars-minimum
JWT_REFRESH_EXPIRATION=604800

# SMS (Vonage)
VONAGE_API_KEY=your-key
VONAGE_API_SECRET=your-secret

# CORS
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=debug
```

---

##📂 Key Files

- **`prisma/schema.prisma`** - Database schema
- **`src/modules/auth/auth.service.ts`** - Authentication logic
- **`src/modules/auth/auth.controller.ts`** - Auth endpoints
- **`.env.example`** - Environment template

---

## 🛠️ Common Commands

```bash
# Start development server (watch mode)
npm run start:dev

# Start production build
npm run build && npm run start:prod

# View database UI
npm run prisma:studio

# Reset database (WARNING: DESTRUCTIVE)
npm run prisma:reset

# Format code
npm run format

# Lint code
npm run lint
```

---

## 🔧 Database Setup (Option B: Local PostgreSQL)

If you don't have Docker:

```bash
# Create database
createdb khidmashop

# Update .env
DATABASE_URL=postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/khidmashop
```

Then run:
```bash
npm run prisma:migrate
npm run prisma:seed
```

---

## ✅ Verification Checklist

After startup, verify:

- [ ] Server runs on `http://localhost:3001`
- [ ] Swagger accessible on `http://localhost:3001/api/docs`
- [ ] Database tables created (check `prisma studio`)
- [ ] Demo data seeded (check users, products, categories)
- [ ] Can send OTP to `0700000001`
- [ ] Can admin login with `admin@khidma.shop / khidma123`

---

## 🐛 Troubleshooting

### Connection refused on database

**Error**: `connect ECONNREFUSED 127.0.0.1:5432`

**Solution**:
```bash
# Ensure Docker is running
docker ps

# Start container if stopped
docker-compose up -d postgres

# Check PostgreSQL is running
docker logs khidmashop_postgres
```

### Prisma Client not found

**Error**: `Cannot find module '@prisma/client'`

**Solution**:
```bash
npm run prisma:generate
rm -rf node_modules/.prisma
npm install
```

### Migration failures

**Error**: `Migration lock` or `connection timeout`

**Solution**:
```bash
# Reset database (caution: deletes all data)
npm run prisma:reset

# Or, release lock manually in DB:
# DELETE FROM "_prisma_migrations" WHERE finished_at IS NULL;
```

### OTP SMS not sending

**In development**, SMS logs appear in console:
```
[DEV MODE] SMS to 0700000001: Your KhidmaShop verification code is: 123456
```

To use real SMS:
1. Create Vonage account: https://www.vonage.com/
2. Add credentials to `.env`:
   ```
   VONAGE_API_KEY=your-key
   VONAGE_API_SECRET=your-secret
   NODE_ENV=production
   ```

---

## 📞 Support

- **Swagger Docs**: http://localhost:3001/api/docs
- **Prisma Studio**: `npm run prisma:studio`
- **Check logs**: `tail -f logs/combined.log`

---

**Happy developing! 🎉**
