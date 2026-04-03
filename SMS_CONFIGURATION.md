# Configuration du Service SMS - KhidmaShop (Twilio)

## 📱 Présentation

Le service SMS de KhidmaShop permet d'envoyer des codes OTP (One-Time Password) aux utilisateurs via SMS pour l'authentification sans mot de passe.

## 🔧 Variables d'Environnement

Voici les variables requises dans le fichier `.env` pour configurer le service SMS avec Twilio :

```env
# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_FROM_PHONE=+1234567890
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

### Étape 1 : Créer un Compte Twilio

1. Allez sur [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Créez un compte gratuit avec votre email et numéro de téléphone
3. Vérifiez votre numéro de téléphone

### Étape 2 : Obtenir vos Identifiants Console

1. Connectez-vous à [https://console.twilio.com/](https://console.twilio.com/)
2. **Account SID** → `TWILIO_ACCOUNT_SID` (début AC...)
3. **Auth Token** → `TWILIO_AUTH_TOKEN` (copiez-le maintenant !)

### Étape 3 : Acheter un Numéro SMS

1. Allez dans **Phone Numbers** → **Buy a Number**
2. Sélectionnez un numéro capable d'envoyer SMS
3. Achetez le numéro (gratuit en essai)
4. **Phone Number** → `TWILIO_FROM_PHONE` (format +1XXXXXXXXXX)

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
