# Configuration du Service SMS - KhidmaShop

## 📱 Présentation

Le service SMS de KhidmaShop permet d'envoyer des codes OTP (One-Time Password) aux utilisateurs via SMS pour l'authentification sans mot de passe.

## 🔧 Variables d'Environnement

Voici les variables requises dans le fichier `.env` pour configurer le service SMS :

```env
# SMS Configuration (Vonage)
VONAGE_API_KEY=your-vonage-api-key
VONAGE_API_SECRET=your-vonage-api-secret
VONAGE_FROM=KhidmaShop
OTP_EXPIRATION_MINUTES=5
OTP_LENGTH=6
```

### Description des Variables

| Variable | Description | Exemple | Obligatoire |
|----------|-------------|---------|------------|
| `VONAGE_API_KEY` | Clé API Vonage | `abc123def456` | ✅ |
| `VONAGE_API_SECRET` | Secret API Vonage | `secret789xyz` | ✅ |
| `VONAGE_FROM` | Nom d'expéditeur SMS | `KhidmaShop` | ✅ |
| `OTP_EXPIRATION_MINUTES` | Durée de validité du code OTP en minutes | `5` | ✅ |
| `OTP_LENGTH` | Longueur du code OTP généré | `6` | ✅ |

## 🚀 Comment Obtenir les Identifiants Vonage

### Étape 1 : Créer un Compte Vonage

1. Allez sur [https://www.vonage.com/](https://www.vonage.com/)
2. Cliquez sur **"Sign up"** pour créer un compte
3. Complétez les informations requises (Email, Mot de passe, Entreprise, etc.)
4. Acceptez les conditions d'utilisation

### Étape 2 : Vérifier Votre Email

1. Vérifiez votre email pour confirmer votre compte
2. Vous recevrez un email de confirmation avec un lien d'activation
3. Cliquez sur le lien pour activer votre compte

### Étape 3 : Accéder à la Console Vonage

1. Connectez-vous à [https://dashboard.vonage.com/](https://dashboard.vonage.com/)
2. Allez dans **"Settings"** → **"API credentials"**
3. Vous verrez vos identifiants :
   - **API Key** → `VONAGE_API_KEY`
   - **API Secret** → `VONAGE_API_SECRET`

### Étape 4 : Configurer un Numéro Expéditeur

1. Dans la console Vonage, allez dans **"SMS"** → **"Settings"**
2. Configurez le **"Sender ID"** (le nom ou numéro qui apparaîtra sur l'SMS)
3. Utilisez ce sender ID pour la variable `VONAGE_FROM`

## ⚙️ Configuration du Backend

### 1. Mettre à Jour le Fichier .env

Créez ou mettez à jour votre fichier `.env` :

```env
# Application
NODE_ENV=development
PORT=3001
APP_NAME=KhidmaShop API

# Database
DATABASE_URL=postgresql://bakary:bakary@localhost:5432/khidmashop?schema=public

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_EXPIRATION=900
JWT_REFRESH_SECRET=your-super-secret-refresh-key-min-32-characters
JWT_REFRESH_EXPIRATION=604800

# SMS / Vonage
VONAGE_API_KEY=your-actual-api-key
VONAGE_API_SECRET=your-actual-api-secret
VONAGE_FROM=KhidmaShop
OTP_EXPIRATION_MINUTES=5
OTP_LENGTH=6

# CORS
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=debug
```

### 2. Redémarrer le Serveur

Après avoir mis à jour le `.env`, redémarrez le serveur :

```bash
npm run start:dev
```

## 🧪 Tester l'Envoi de SMS

### 1. Utiliser Swagger

1. Accédez à `http://localhost:3001/api/docs`
2. Allez à la section **Auth** → **POST /auth/send-otp**
3. Entrez un numéro de téléphone valide :
   ```json
   {
     "phone": "0700000001"
   }
   ```
4. Cliquez sur **"Try it out"**

### 2. Réponse Attendue

Si le service SMS est bien configuré, vous recevrez :

```json
{
  "success": true,
  "message": "Code OTP envoyé avec succès à 0700000001",
  "data": null,
  "error": null
}
```

### 3. Vérifier le Code OTP

Consultez votre SMS pour obtenir le code à 6 chiffres, puis utilisez l'endpoint `/auth/verify-otp` :

```bash
curl -X POST http://localhost:3001/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "0700000001",
    "code": "123456"
  }'
```

## 📋 Mode Développement (Sans Vonage)

Si vous ne disposez pas de crédits Vonage ou pour développer localement, le service SMS est configuré en **mode stub** dans le développement.

### Comment Voir les Codes OTP en Développement

1. Les codes OTP sont enregistrés dans les **logs du serveur**
2. Lors du lancement du serveur, recherchez dans les logs :
   ```
   2026-03-28 22:21:41 [info] [SmsService] SMS Log Mode: Code OTP 653421 envoyé à 0700000001
   ```
3. Utilisez ce code dans l'endpoint `/auth/verify-otp`

## 🔐 Sécurité

### Bonnes Pratiques

1. **Ne jamais commiter le `.env`** - Ajoutez-le à `.gitignore`
2. **Utiliser des variables d'environnement en production** - Ne pas hardcoder les clés
3. **Activer HTTPS en production** - Les OTP ne doivent pas transiter en HTTP
4. **Limiter les tentatives** - Maximum 5 tentatives par OTP
5. **Logs sécurisés** - Ne pas logger les codes OTP en production

### Exemple de .gitignore

```
.env
.env.local
.env.production
node_modules/
dist/
logs/
```

## 🛠️ Dépannage

### Le SMS n'est pas reçu

**Cause possible 1 : Crédits insuffisants**
- Vérifiez votre solde Vonage : https://dashboard.vonage.com/
- Le SMS coûte généralement 0,05 EUR par SMS

**Cause possible 2 : Numéro invalide**
- Assurez-vous que le numéro commence par le pays code (+33 pour la France)
- Format accepté : Commençant par 0 ou avec code pays

**Cause possible 3 : VONAGE_FROM incorrect**
- Vérifiez que le sender ID est approuvé dans les paramètres Vonage

### Le code d'erreur "Invalid_credentials"

- Vérifiez que `VONAGE_API_KEY` et `VONAGE_API_SECRET` sont corrects
- Copiez-collez directement depuis le dashboard Vonage
- Redémarrez le serveur après chaque modification

### Les logs ne montrent pas l'envoi

- Vérifiez que `LOG_LEVEL=debug` est défini dans le `.env`
- Vérifiez que le service SMS reçoit bien la requête
- Vérifiez la connexion réseau (firewall, proxy)

## 📚 Ressources Utiles

- **Documentation Vonage** : https://developer.vonage.com/en/api/sms
- **Guide de Démarrage Vonage** : https://developer.vonage.com/en/get-started/sms
- **Dashboard Vonage** : https://dashboard.vonage.com/

## 📞 Support

Pour toute question concernant le service SMS :

1. Consultez la documentation Vonage
2. Vérifiez les logs du serveur
3. Testez en mode développement avec les logs
4. Contactez le support Vonage pour les problèmes de débit

---

**Dernière mise à jour** : 28 Mars 2026  
**Version** : 1.0.0
