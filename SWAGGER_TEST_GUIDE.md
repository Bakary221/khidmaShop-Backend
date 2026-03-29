# Guide de Test du Backend KhidmaShop via Swagger

## 🚀 Accès à Swagger

Ouvrez votre navigateur et allez à : **http://localhost:3001/api/docs**

---

## 📝 Données de Test Pré-chargées

Le backend est initialisé avec les données de démonstration suivantes :

### 👤 Utilisateurs de Test

#### Client
```
Téléphone: +33700000001
Rôle: CLIENT
```

#### Administrateur
```
Email: admin@khidma.shop
Mot de passe: khidma123
Rôle: ADMIN
```

### 📁 Catégories (3)
- 1 🍕 Pizzas
- 2 🍔 Burgers
- 3 🍠 Frites

### 🛍️ Produits (5)
- 1 Pizza Margherita - 10€
- 2 Burger Classique - 8€
- 3 Frites - 3€
- 4 Pizza 4 Fromages - 12€
- 5 Burger Bacon - 10€

---

## 🔐 Authentification

### 1️⃣ Étape 1 : Envoyer un Code OTP

**Endpoint** : `POST /auth/send-otp`

**Requête** :
```json
{
  "phone": "+33700000001"
}
```

**Réponse attendue** :
```json
{
  "success": true,
  "message": "Code OTP envoyé avec succès à +33700000001",
  "data": null,
  "error": null
}
```

**Note** : En mode développement, le code OTP s'affiche dans les logs du serveur.  
**Code de test** : Consultez la console du terminal

---

### 2️⃣ Étape 2 : Vérifier le Code OTP

**Endpoint** : `POST /auth/verify-otp`

**Requête** (utilisez le code affiché dans les logs) :
```json
{
  "phone": "+33700000001",
  "otp": "123456"
}
```

**Réponse attendue** :
```json
{
  "success": true,
  "message": "Authentification réussie",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "error": null
}
```

**Conservez le token** pour les requêtes suivantes !

---

### 3️⃣ Connexion Administrateur

**Endpoint** : `POST /auth/admin-login`

**Requête** :
```json
{
  "email": "admin@khidma.shop",
  "password": "khidma123"
}
```

**Réponse attendue** :
```json
{
  "success": true,
  "message": "Authentification réussie",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "error": null
}
```

---

### 4️⃣ Rafraîchir le Token d'Accès

**Endpoint** : `POST /auth/refresh`

**Requête** :
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Réponse attendue** :
```json
{
  "success": true,
  "message": "Succès",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "error": null
}
```

---

## 🛍️ Produits

### Lister Tous les Produits

**Endpoint** : `GET /products`

**Paramètres (optionnels)** :
- `categoryId`: ID de la catégorie
- `brand`: Marque du produit
- `maxPrice`: Prix maximum
- `search`: Recherche textuelle

**Exemple de requête** :
```
GET /products?categoryId=1&maxPrice=15
```

**Réponse attendue** :
```json
{
  "success": true,
  "message": "Succès",
  "data": [
    {
      "id": "1",
      "name": "Pizza Margherita",
      "description": "Pizza classique",
      "price": 10,
      "brand": "KhidmaShop",
      "image": "https://...",
      "categoryId": "1",
      "quantity": 50,
      "active": true,
      "featured": true,
      "createdAt": "2026-03-28T00:00:00Z"
    }
  ],
  "error": null
}
```

### Produits en Vedette

**Endpoint** : `GET /products/featured`

**Réponse attendue** : Liste des produits marqués comme vedettes

### Toutes les Marques

**Endpoint** : `GET /products/brands`

**Réponse attendue** :
```json
{
  "success": true,
  "message": "Succès",
  "data": [
    "KhidmaShop",
    "Local"
  ],
  "error": null
}
```

### Statistiques Produits

**Endpoint** : `GET /products/stats`  
**Authentification requise** : ✅ Bearer Token

**Réponse attendue** :
```json
{
  "success": true,
  "message": "Succès",
  "data": {
    "total": 5,
    "featured": 2,
    "categories": 3
  },
  "error": null
}
```

### Créer un Produit

**Endpoint** : `POST /products`  
**Authentification requise** : ✅ Bearer Token (Admin)

**Requête** :
```json
{
  "name": "Pizza Régina",
  "description": "Pizza avec œuf et champignons",
  "price": 11.50,
  "brand": "KhidmaShop",
  "image": "https://...",
  "categoryId": "1",
  "quantity": 30,
  "featured": false
}
```

---

## 📦 Catégories

### Lister Toutes les Catégories

**Endpoint** : `GET /categories`

**Réponse attendue** :
```json
{
  "success": true,
  "message": "Succès",
  "data": [
    {
      "id": "cat_1",
      "name": "Pizzas",
      "slug": "pizzas",
      "image": "https://...",
      "active": true,
      "createdAt": "2026-03-28T00:00:00Z"
    }
  ],
  "error": null
}
```

### Créer une Catégorie

**Endpoint** : `POST /categories`  
**Authentification requise** : ✅ Bearer Token (Admin)

**Requête** :
```json
{
  "name": "Desserts",
  "slug": "desserts",
  "image": "https://..."
}
```

---

## 👥 Utilisateurs

### Lister Tous les Utilisateurs

**Endpoint** : `GET /users`  
**Authentification requise** : ✅ Bearer Token (Admin)

**Réponse attendue** :
```json
{
  "success": true,
  "message": "Succès",
  "data": [
    {
      "id": "user_1",
      "phone": "+33700000001",
      "role": "CLIENT",
      "createdAt": "2026-03-28T00:00:00Z"
    }
  ],
  "error": null
}
```

### Statistiques Utilisateurs

**Endpoint** : `GET /users/stats`  
**Authentification requise** : ✅ Bearer Token (Admin)

**Réponse attendue** :
```json
{
  "success": true,
  "message": "Succès",
  "data": {
    "total": 10,
    "clients": 9,
    "admins": 1
  },
  "error": null
}
```

---

## 📋 Commandes

### Lister les Commandes

**Endpoint** : `GET /orders`  
**Authentification requise** : ✅ Bearer Token

**Comportement** :
- **Client** : Voit uniquement ses propres commandes
- **Admin** : Voit toutes les commandes

**Réponse attendue** :
```json
{
  "success": true,
  "message": "Succès",
  "data": [
    {
      "id": "order_1",
      "userId": "user_1",
      "status": "pending",
      "totalAmount": 25.50,
      "items": [
        {
          "productId": "1",
          "quantity": 2,
          "price": 10,
          "ProductSnapshot": {
            "name": "Pizza Margherita"
          }
        }
      ],
      "createdAt": "2026-03-28T00:00:00Z"
    }
  ],
  "error": null
}
```

### Créer une Commande

**Endpoint** : `POST /orders`  
**Authentification requise** : ✅ Bearer Token

**Requête** :
```json
{
  "items": [
    {
      "productId": "1",
      "quantity": 2
    },
    {
      "productId": "3",
      "quantity": 1
    }
  ]
}
```

**Réponse attendue** :
```json
{
  "success": true,
  "message": "Succès",
  "data": {
    "id": "order_newly_created",
    "status": "pending",
    "totalAmount": 23.00,
    "items": [...]
  },
  "error": null
}
```

### Changer le Statut d'une Commande

**Endpoint** : `PATCH /orders/:id/status`  
**Authentification requise** : ✅ Bearer Token (Admin)

**Requête** :
```json
{
  "status": "completed"
}
```

**Statuts autorisés** : `pending`, `processing`, `completed`, `cancelled`

---

## 🔑 Comment Utiliser un Jeton Bearer

### Dans Swagger UI

1. Cliquez sur le bouton **"Authorize"** 🔒
2. Entrez votre `accessToken` (sans "Bearer")
3. Cliquez sur **"Authorize"**
4. Testez les endpoints protégés

### En Curl

```bash
curl -X GET http://localhost:3001/orders \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

---

## ⚠️ Codes d'Erreur Courants

| Code | Signification | Solution |
|------|---------------|----------|
| `401` | Jeton manquant ou invalide | Authentifiez-vous d'abord |
| `403` | Accès refusé | Vous n'avez pas les permissions |
| `404` | Ressource non trouvée | Vérifiez l'ID |
| `400` | Requête invalide | Vérifiez le format JSON |
| `500` | Erreur serveur | Consultez les logs |

---

## 📚 Environnement de Test Pré-configuré

Tout est prêt à tester immédiatement :

✅ Base de données synchronisée  
✅ Données de test chargées  
✅ Service SMS en mode développement (logs)  
✅ Authentification JWT fonctionnelle  
✅ Swagger documenté avec exemples  

---

**Dernière mise à jour** : 28 Mars 2026  
**Version** : 1.0.0
