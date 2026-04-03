# =========================
# 1. Builder stage
# =========================
FROM node:20-alpine AS builder

WORKDIR /app

# ✅ Installer OpenSSL (OBLIGATOIRE pour Prisma)
RUN apk add --no-cache openssl

# Copier les fichiers package
COPY package*.json ./

# Installer toutes les dépendances (y compris dev)
RUN npm ci

# Copier le code source
COPY . .

# Générer Prisma Client
RUN npx prisma generate

# Build de l'application (ex: TypeScript → dist/)
RUN npm run build


# =========================
# 2. Runner (production)
# =========================
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

# ✅ Installer OpenSSL (OBLIGATOIRE aussi ici)
RUN apk add --no-cache openssl

# Copier uniquement ce qui est nécessaire
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# ✅ IMPORTANT : Générer Prisma AVEC engine
RUN npx prisma generate

# Exposer le port
EXPOSE 3001

# Lancer migration + app
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]