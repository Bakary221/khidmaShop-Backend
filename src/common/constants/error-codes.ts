export enum ErrorCode {
  // Auth errors
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  AUTH_OTP_INVALID = 'AUTH_OTP_INVALID',
  AUTH_OTP_EXPIRED = 'AUTH_OTP_EXPIRED',
  AUTH_OTP_MAX_ATTEMPTS = 'AUTH_OTP_MAX_ATTEMPTS',
  AUTH_UNAUTHORIZED = 'AUTH_UNAUTHORIZED',
  AUTH_FORBIDDEN = 'AUTH_FORBIDDEN',

  // User errors
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
  USER_INVALID_PHONE = 'USER_INVALID_PHONE',
  USER_PROFILE_INCOMPLETE = 'USER_PROFILE_INCOMPLETE',

  // Product errors
  PRODUCT_NOT_FOUND = 'PRODUCT_NOT_FOUND',
  PRODUCT_OUT_OF_STOCK = 'PRODUCT_OUT_OF_STOCK',
  PRODUCT_ALREADY_EXISTS = 'PRODUCT_ALREADY_EXISTS',

  // Category errors
  CATEGORY_NOT_FOUND = 'CATEGORY_NOT_FOUND',
  CATEGORY_ALREADY_EXISTS = 'CATEGORY_ALREADY_EXISTS',
  CATEGORY_NOT_EMPTY = 'CATEGORY_NOT_EMPTY',

  // Order errors
  ORDER_NOT_FOUND = 'ORDER_NOT_FOUND',
  ORDER_EMPTY = 'ORDER_EMPTY',
  ORDER_INVALID_STATUS = 'ORDER_INVALID_STATUS',
  ORDER_CANCEL_WINDOW_EXPIRED = 'ORDER_CANCEL_WINDOW_EXPIRED',
  ORDER_CANNOT_CANCEL = 'ORDER_CANNOT_CANCEL',

  // Generic errors
  INVALID_INPUT = 'INVALID_INPUT',
  DATABASE_ERROR = 'DATABASE_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
}

export const ErrorMessages: Record<ErrorCode, string> = {
  [ErrorCode.AUTH_INVALID_CREDENTIALS]: 'Identifiants invalides',
  [ErrorCode.AUTH_OTP_INVALID]: 'Code OTP invalide',
  [ErrorCode.AUTH_OTP_EXPIRED]: 'Le code OTP a expiré',
  [ErrorCode.AUTH_OTP_MAX_ATTEMPTS]: 'Nombre maximum de tentatives OTP dépassé',
  [ErrorCode.AUTH_UNAUTHORIZED]: 'Accès non autorisé',
  [ErrorCode.AUTH_FORBIDDEN]: 'Accès interdit',

  [ErrorCode.USER_NOT_FOUND]: 'Utilisateur non trouvé',
  [ErrorCode.USER_ALREADY_EXISTS]: 'Utilisateur existe déjà',
  [ErrorCode.USER_INVALID_PHONE]: 'Numéro de téléphone invalide',
  [ErrorCode.USER_PROFILE_INCOMPLETE]: 'Profil utilisateur incomplet',

  [ErrorCode.PRODUCT_NOT_FOUND]: 'Produit non trouvé',
  [ErrorCode.PRODUCT_OUT_OF_STOCK]: 'Le produit est en rupture de stock',
  [ErrorCode.PRODUCT_ALREADY_EXISTS]: 'Le produit existe déjà',

  [ErrorCode.CATEGORY_NOT_FOUND]: 'Catégorie non trouvée',
  [ErrorCode.CATEGORY_ALREADY_EXISTS]: 'Catégorie existe déjà',
  [ErrorCode.CATEGORY_NOT_EMPTY]: 'Catégorie avec produits associés',

  [ErrorCode.ORDER_NOT_FOUND]: 'Commande non trouvée',
  [ErrorCode.ORDER_EMPTY]: 'La commande ne peut pas être vide',
  [ErrorCode.ORDER_INVALID_STATUS]: 'Statut de commande invalide',
  [ErrorCode.ORDER_CANCEL_WINDOW_EXPIRED]: 'Le délai d\'annulation de 30 minutes est dépassé',
  [ErrorCode.ORDER_CANNOT_CANCEL]: 'Cette commande ne peut plus être annulée',

  [ErrorCode.INVALID_INPUT]: 'Entrée invalide',
  [ErrorCode.DATABASE_ERROR]: 'Erreur de base de données',
  [ErrorCode.INTERNAL_SERVER_ERROR]: 'Erreur interne du serveur',
  [ErrorCode.RESOURCE_NOT_FOUND]: 'Ressource non trouvée',
};
