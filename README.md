# 🚀 KhidmaShop Backend API

Backend robuste et scalable pour la plateforme de e-commerce KhidmaShop, construit avec **NestJS**, **Prisma** et **PostgreSQL**.

## 📋 Table des Matières

- [Features](#-features)
- [Stack Technique](#-stack-technique)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Lancement](#-lancement)
- [API Documentation](#-api-documentation)
- [Architecture](#-architecture)

---

## ✨ Features

- ✅ **Authentification Hybride**
  - Clients: OTP via SMS (Vonage/Nexmo)
  - Admins: Email + Password (bcrypt)
  - JWT tokens (Access + Refresh)

- ✅ **Gestion Complète E-Commerce**
  - Produits CRUD avec filtres avancés
  - Catégories avec images
  - Commandes avec snapshots historiques
  - Utilisateurs et profils

- ✅ **Sécurité Robuste**
  - JWT Guards avec RBAC (Role-Based Access Control)
  - Password hashing (bcrypt)
  - CORS configurable
  - Rate limiting sur endpoints sensibles
  - Helmet pour security headers

- ✅ **Developer Experience**
  - Swagger/OpenAPI documentation complète
  - Seeding automatique
  - Migrations Prisma
  - Logger Winston structuré
  - ValidationPipe global avec DTOs

---

## 🛠️ Stack Technique

| Composant | Technology |
|-----------|-----------|
| **Framework** | NestJS 10+ |
| **Base de données** | PostgreSQL 16 |
| **ORM** | Prisma 5+ |
| **Authentication** | JWT + Passport |
| **Validation** | class-validator + class-transformer |
| **SMS** | Vonage/Nexmo API |
| **Documentation** | Swagger/OpenAPI |
| **Logging** | Winston |
| **Security** | bcrypt + Helmet |

---

## 📦 Installation

### Prérequis
- Node.js 18+
- PostgreSQL 14+ (local ou Docker)
- npm ou pnpm

### 1. Clone et Installation

```bash
cd KhidmaShop-backend
npm install
```

### 2. Configuration PostgreSQL

#### Option A: Docker (Recommandé)

```bash
docker-compose up -d postgres
```

Cela lance PostgreSQL sur `localhost:5432`

#### Option B: PostgreSQL Local

```bash
createdb khidmashop
```

### 3. Variables d'Environnement

```bash
cp .env.example .env
```

Editez `.env` avec vos credentials:

```env
DATABASE_URL=postgresql://db_user:db_password@localhost:5432/khidmashop?schema=public
JWT_SECRET=your-secret-key-min-32-chars
VONAGE_API_KEY=your-vonage-key
VONAGE_API_SECRET=your-vonage-secret
CORS_ORIGIN=http://localhost:3000
```

### 4. Setup Prisma

```bash
# Générer Prisma Client
npm run prisma:generate

# Créer les tables (run migrations)
npm run prisma:migrate

# Seeder les données de démo
npm run prisma:seed
```

---

## 🚀 Lancement

### Version Développement (watch mode)

```bash
npm run start:dev
```

Server démarre sur: http://localhost:3001

### Version Production

```bash
npm run build
npm run start:prod
```

---

## 📘 API Documentation

### Swagger/OpenAPI

Une fois le serveur démarré, accedez à:

```
http://localhost:3001/api/docs
```

### Routes Principales

#### 🔐 Authentication
```
POST   /auth/send-otp              Send OTP to phone
POST   /auth/verify-otp            Verify OTP and get tokens
POST   /auth/admin-login           Admin login (email + password)
POST   /auth/refresh               Refresh access token
```

#### 📦 Products
```
GET    /products                   List products with filters
GET    /products/featured          Get featured products only
GET    /products/:id               Get product details
GET    /products/brands            Get all brands
POST   /products                   Create product (admin)
PUT    /products/:id               Update product (admin)
PATCH  /products/:id/toggle        Toggle active status (admin)
DELETE /products/:id               Delete product (admin)
```

#### 🏷️ Categories
```
GET    /categories                 List categories
GET    /categories/:id             Get category details
POST   /categories                 Create category (admin)
PUT    /categories/:id             Update category (admin)
PATCH  /categories/:id/toggle      Toggle active (admin)
DELETE /categories/:id             Delete category (admin)
```

#### 🛒 Orders
```
GET    /orders                     List orders (own for clients, all for admin)
GET    /orders/:id                 Get order details
POST   /orders                     Create order (clients)
PATCH  /orders/:id/status          Update status (admin)
```

#### 👤 Users
```
GET    /users                      List users (admin)
GET    /users/:id                  Get user details
PUT    /users/:id                  Update user profile
```

---

## 🏗️ Architecture

### Structure Répertoires

```
src/
├── core/                          # Logique métier & infrastructure
│   ├── exceptions/
│   │   └── custom.exceptions.ts
│   ├── filters/
│   │   └── http-exception.filter.ts
│   ├── interceptors/
│   │   └── response.interceptor.ts
│   └── decorators/
│       └── public.decorator.ts
│
├── common/                        # Éléments partagés
│   ├── decorators/
│   │   ├── auth.decorator.ts
│   │   ├── roles.decorator.ts
│   │   └── current-user.decorator.ts
│   ├── guards/
│   │   ├── jwt.guard.ts
│   │   ├── roles.guard.ts
│   │   └── optional-jwt.guard.ts
│   ├── constants/
│   │   ├── error-codes.ts
│   │   └── messages.ts
│   ├── dto/
│   │   └── response.dto.ts
│   └── utils/
│       ├── logger.ts
│       └── validators.ts
│
├── config/                        # Configuration app
│   ├── database.config.ts
│   ├── jwt.config.ts
│   ├── sms.config.ts
│   └── cors.config.ts
│
├── modules/
│   ├── auth/                      # Module Authentification
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts
│   │   ├── dto/
│   │   │   ├── send-otp.dto.ts
│   │   │   ├── verify-otp.dto.ts
│   │   │   └── admin-login.dto.ts
│   │   └── interfaces/
│   │       └── jwt-payload.interface.ts
│   │
│   ├── sms/                       # Service SMS
│   │   ├── sms.module.ts
│   │   └── sms.service.ts
│   │
│   ├── users/                     # Module Utilisateurs
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── dto/
│   │       ├── create-user.dto.ts
│   │       └── update-user.dto.ts
│   │
│   ├── products/                  # Module Produits
│   │   ├── products.module.ts
│   │   ├── products.controller.ts
│   │   ├── products.service.ts
│   │   └── dto/
│   │       ├── create-product.dto.ts
│   │       ├── update-product.dto.ts
│   │       └── filter-products.dto.ts
│   │
│   ├── categories/                # Module Catégories
│   │   ├── categories.module.ts
│   │   ├── categories.controller.ts
│   │   ├── categories.service.ts
│   │   └── dto/
│   │       ├── create-category.dto.ts
│   │       └── update-category.dto.ts
│   │
│   └── orders/                    # Module Commandes
│       ├── orders.module.ts
│       ├── orders.controller.ts
│       ├── orders.service.ts
│       └── dto/
│           ├── create-order.dto.ts
│           └── update-order-status.dto.ts
│
├── prisma/
│   └── schema.prisma              # Schéma DB
│
└── main.ts                        # Entry point
```

---

## 🔐 Authentification & Sécurité

### Flow Auth Client (OTP)

1. Client envoie phone → `POST /auth/send-otp`
2. Backend génère OTP (6 chiffres)
3. SMS envoyé via Vonage
4. Client saisit OTP → `POST /auth/verify-otp`
5. ✅ Retour: `{ accessToken, refreshToken }`
6. User auto-créé en DB si 1ère connexion

### Flow Auth Admin (Email + Password)

1. Admin saisit email + password → `POST /auth/admin-login`
2. Password vérifié contra DB (bcrypt)
3. ✅ Retour: `{ accessToken, refreshToken }`

### Token Management

- **Access Token** : 15 minutes (JWT)
- **Refresh Token** : 7 jours (JWT)
- Endpoint `/auth/refresh` pour renouveler access token

### Guards & RBAC

```typescript
// Protéger une route
@UseGuards(JwtGuard)
@Post('/sensitive')
async sensitiveAction() { }

// Admin only
@UseGuards(JwtGuard, RolesGuard)
@Roles('ADMIN')
@Post('/admin-only')
async adminAction() { }

// Public (pas de guard)
@Public()
@Get('/products')
async getPublicProducts() { }
```

---

## 🗄️ Base de Données

### Schéma Prisma

Le fichier `prisma/schema.prisma` contient:

- **User** : Clients + Admins avec roles
- **OTP** : Codes OTP avec expiration
- **Category** : Catégories avec image
- **Product** : Produits avec variantes (sizes, colors)
- **Order** : Commandes avec snapshots items
- **OrderItem** : Items de commande avec snapshot produit

### Relations

```
User (1) ──── (Many) Order
        └──── (Many) OTP

Category (1) ──── (Many) Product

Product (1) ──── (Many) OrderItem

Order (1) ──── (Many) OrderItem
```

---

## 📊 Response Format Standard

### Success Response

```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": [...],
  "error": null
}
```

### Error Response

```json
{
  "success": false,
  "message": "Invalid OTP",
  "data": null,
  "error": {
    "code": "AUTH_OTP_INVALID",
    "details": "Code OTP has expired"
  }
}
```

---

## 🧪 Testing

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov

# E2E tests
npm run test:e2e
```

---

## 🛠️ Admin Commands

```bash
# Reset databse (WARNING: destructive!)
npm run prisma:reset

# Interactive Prisma Studio
npm run prisma:studio

# View database migrations
npm run prisma:migrate -- --dry-run
```

---

## 🚀 Déploiement

### Environment Production

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@prod-host:5432/khidmashop
JWT_SECRET=your-long-random-secret-32+ chars
VONAGE_API_KEY=production-key
VONAGE_API_SECRET=production-secret
CORS_ORIGIN=https://khidmashop.com
```

### Build & Deploy

```bash
npm run build
npm run prisma:migrate:deploy
npm run start:prod
```

---

## 📞 Support & Documentation

- API Docs: http://localhost:3001/api/docs
- Prisma Docs: https://www.prisma.io/docs/
- NestJS Docs: https://docs.nestjs.com/
- Vonage Docs: https://developer.vonage.com/

---

## 📄 License

UNLICENSED - Private Project

---

**Créé avec ❤️ par le team KhidmaShop** 🚀
