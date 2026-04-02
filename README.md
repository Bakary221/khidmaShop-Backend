# 🚀 KhidmaShop Backend API

Backend scalable pour la marketplace KhidmaShop : NestJS (App Router), Prisma et PostgreSQL orchestrent l'authentification OTP, la gestion complète du catalogue et des commandes, ainsi qu'une couche d'administration sécurisée.

## 📦 Stack technique
- **NestJS 10+** (Modular architecture, Guards, Interceptors, Pipes)
- **Prisma 5+** sur PostgreSQL 16 (migrations, seeding, schéma typé)
- **JWT** (access + refresh, tokens en cookies HttpOnly, SameSite configurable)
- **Vonage (OTP)** avec fallback simulation dans `SmsService`
- **Cloudinary** pour centraliser les images produits/catégories
- **Logger Winston** configuré via `LOG_LEVEL`
- **Swagger / OpenAPI** accessible sur `/api/docs`

## ✨ Principales capacités
1. **Authentification hybride**
   - Clients : `POST /auth/send-otp` → envoie OTP à un numéro validé via regex internationale.
   - Vérification : `POST /auth/verify-otp` stocke le user, génère access + refresh tokens, les greffe dans des cookies sécurisés.
   - Admins : `POST /auth/admin-login` avec email + mot de passe bcryptisé ; il existe aussi `POST /auth/logout` et `POST /auth/refresh`.
2. **Catalogue & produits**
   - CRUD complet (création, update, suppression, toggle active) avec restrictions `@Roles('ADMIN')`.
   - Filtrage public (`search`, `brand`, `categoryId`, `maxPrice`), routes `GET /products`, `GET /products/featured`, `GET /products/brands`, `GET /products/:id`, `GET /products/stats`.
   - Images téléversées vers Cloudinary (ou conservées en base si `SKIP_CLOUDINARY_UPLOAD=true`).
3. **Catégories**
   - `GET /categories`, `GET /categories/:id` (option `includeInactive`).
   - Admin : création, mise à jour, toggle `active`, suppression protégée (vérifie qu'aucun produit n'y est lié).
4. **Commandes & workflow client/admin**
   - `POST /orders` : valide les profils, vérifie le stock, saisit latitude/longitude, calcule les totaux et prend des snapshots produits.
   - `GET /orders` (les clients n'ont que les leurs, les admins voient toutes les commandes), `GET /orders/:id`, `PATCH /orders/:id/status`, `GET /orders/stats`.
   - L'ordre se base sur un enum `OrderStatus` (`PENDING`, `CONFIRMED`, `DELIVERED`).
5. **Utilisateurs**
   - Profil, CRUD, statistiques (`/users/stats`), et endpoint `GET /users/me` qui respecte la guard JWT.
6. **Sécurité & infrastructure**
   - Guard global `JwtGuard` appliqué via `APP_GUARD`, décorateurs `@Public()` + `@Roles('ADMIN')` pour exposer/fermer les routes.
   - Token refresh avec stockage sha256 (service `RefreshTokenService`), cookies `khidma_access_token`, `refresh_token`, `khidma_role`.
   - Interceptor global `ResponseInterceptor` + filter `HttpExceptionFilter` garantissant un format `{
       success, message, data, error
     }`.

## 🧱 Structure importante
```
src/
├── modules/         # auth, users, products, categories, orders, sms
├── common/          # guards, services (Prisma, Cloudinary, refresh token), utils
├── core/            # décorateurs publics, interceptors, filtres, exceptions
├── prisma/          # schema.prisma + seed.ts
└── main.ts          # bootstrap (validation, body-parser 5MB, Swagger, CORS)
```

## ⚙️ Prérequis & configuration
- Node.js 18+
- PostgreSQL 16 (local ou via Docker)
- npm

### 1. Démarrer la base
```bash
# Option recommandée : reproduire l'environnement PostgreSQL
docker-compose up -d postgres
```
ou bien créer manuellement la base (`createdb khidmashop`).

### 2. Installer les dépendances
```bash
npm install
```

### 3. Variables d'environnement
Copier `.env` (fourni) et ajuster :

| Clé | Usage | Note |
|---|---|---|
| `DATABASE_URL` | Connexion PostgreSQL | `postgresql://user:pass@host:5432/khidmashop?schema=public`
| `JWT_SECRET` / `JWT_REFRESH_SECRET` | Signatures (>=32 caractères) | 
| `JWT_EXPIRATION`, `JWT_REFRESH_EXPIRATION` | Durées en secondes (900 / 1 296 000 par défaut) |
| `JWT_COOKIE_SAMESITE`, `JWT_COOKIE_SECURE` | SameSite/secure des cookies (optionnel) |
| `CORS_ORIGIN` | Origine frontend (ex: `http://localhost:3000`) |
| `CLOUDINARY_*` | ApiKey + dossier ; `SKIP_CLOUDINARY_UPLOAD=true` pour tests locaux |
| `VONAGE_API_KEY`, `VONAGE_API_SECRET`, `VONAGE_FROM` | En production, mettre les identifiants Vonage | défauts `test-*` déclenchent `sendMockSms` |
| `OTP_EXPIRATION_MINUTES`, `OTP_LENGTH` | TTL, longueur OTP |
| `LOG_LEVEL` | `debug`, `info`, etc. |

> **Astuce** : sans Vonage valide, `SmsService` simule l'envoi et affiche dans la console les codes OTP générés.

### 4. Prisma
```bash
npm run prisma:generate
npm run prisma:migrate # ou `migrate dev`
npm run prisma:seed  # réinitialise / crée jeux de données (admin + clients)
```
> Les seeds créent des catégories, produits, deux commandes exemples, un admin `admin@khidma.shop / khidma123` et un client `0700000001`.

### 5. Lancer
```bash
npm run start:dev       # watch-mode (~localhost:3001)
npm run build
npm run start:prod
```

## 🧪 Scripts utiles
- `npm run lint`
- `npm run test` / `test:watch` / `test:cov` (Jest est configuré mais aucun spec n'est livré) → créer vos suites.
- `npm run prisma:studio`
- `npm run prisma:reset` (⚠️ destructif)

## 📚 Documentation & aides
- API : `http://localhost:3001/api/docs`
- Schéma Prisma expliqué dans `prisma/schema.prisma` et `DATABASE_SCHEMA.md`
- Flow OTP / SMS : `SMS_CONFIGURATION.md`
- Quickstart & implémentations détaillées : `QUICKSTART.md`, `IMPLEMENTATION_COMPLETE.md`.

## 🚪 Points d'intégration
- **Front Next.js** : consomme les cookies JWT (`khidma_access_token`, `refresh_token`) grâce à `credentials: 'include'`.
- **CloudinaryService** : upload des `data:` URIs ; en cas d'échec, la valeur initiale est renvoyée.
- **Refresh tokens** : stockés hashés, invalidés lors du logout ou du refresh.

## 🚀 Production checklist
1. Mettre `NODE_ENV=production`, `JWT_COOKIE_SECURE=true`, définir `CORS_ORIGIN` exact.
2. Utiliser `npm run prisma:migrate:deploy` au lieu de `migrate dev`.
3. Fournir des clés Vonage / Cloudinary réelles (ou `SKIP_CLOUDINARY_UPLOAD=true`).
4. Ajouter une stratégie de monitoring (logs centralisés) et des tests automatisés (Jest est prêt à être utilisé).
5. Prévoir un reverse proxy/Load Balancer pour injecter les cookies avec TLS.

## 👮‍♂️ Sécurité & format de réponses
- EVT `CustomException` renvoie `success: false` + `error: { code, details }`.
- `JwtGuard` se branche sur chaque requête (sauf `@Public()`), `RolesGuard` protège les endpoints administrateurs.
- `ValidationPipe` global avec `whitelist` + `forbidNonWhitelisted` + `enableImplicitConversion`.
- `bodyParser` accepté jusqu’à 5 Mo pour les uploads via Cloudinary.

## ⚠️ Limitations connues
- Aucune file de travaux (queues) : les uploads images se font synchrone et peuvent échouer sans gestion lourde.
- Pas de rate limiting intégré (à ajouter en cas de forte charge/abuse).
- Les tests Jest sont déclarés mais il faut créer des specs.

**Bonne exploration !**
