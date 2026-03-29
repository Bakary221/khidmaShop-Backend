import { Injectable } from '@nestjs/common';
import { Vonage } from '@vonage/server-sdk';
import { getLogger } from '@/common/utils/logger';

const logger = getLogger('SmsService');

@Injectable()
export class SmsService {
  private vonage: Vonage | null = null;
  private isProductionMode = false;

  constructor() {
    // Vérifier si les credentials Vonage sont configurés pour la production
    const apiKey = process.env.VONAGE_API_KEY;
    const apiSecret = process.env.VONAGE_API_SECRET;

    if (apiKey && apiSecret && apiKey !== 'test-key' && apiSecret !== 'test-secret') {
      this.vonage = new Vonage({
        apiKey,
        apiSecret,
      });
      this.isProductionMode = true;
      logger.log('Mode production activé pour les SMS (Vonage configuré)');
    } else {
      logger.log('Mode développement activé pour les SMS (simulation)');
    }
  }

  async sendSms(phone: string, message: string): Promise<boolean> {
    logger.log(`Tentative d'envoi SMS à ${phone}`);

    if (this.isProductionMode && this.vonage) {
      // Mode production : envoi réel via Vonage
      return this.sendRealSms(phone, message);
    } else {
      // Mode développement : simulation
      return this.sendMockSms(phone, message);
    }
  }

  private async sendRealSms(phone: string, message: string): Promise<boolean> {
    if (!this.vonage) {
      throw new Error('Service Vonage non initialisé');
    }

    try {
      const from = process.env.VONAGE_FROM || 'KhidmaShop';

      const result = await this.vonage.sms.send({
        to: phone,
        from: from,
        text: message,
      });

      const messageStatus = result.messages[0];
      const success = messageStatus.status === '0';

      if (success) {
        logger.log(`SMS envoyé avec succès à ${phone} (ID: ${messageStatus['message-id']})`);
      } else {
        logger.error(`Échec de l'envoi SMS à ${phone}: ${messageStatus.errorText || 'Erreur inconnue'}`);
      }

      return success;
    } catch (error) {
      logger.error(`Erreur lors de l'envoi du SMS à ${phone}:`, error);
      throw new Error('Impossible d\'envoyer le SMS');
    }
  }

  private async sendMockSms(phone: string, message: string): Promise<boolean> {
    logger.log(`[MODE DÉVELOPPEMENT] Simulation d'envoi SMS à ${phone}`);

    // Simuler un délai réseau réaliste
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

    // Simuler occasionnellement un échec (5% de chance)
    const shouldFail = Math.random() < 0.05;

    if (shouldFail) {
      logger.warn(`[MODE DÉVELOPPEMENT] Simulation d'échec d'envoi SMS à ${phone}`);
      throw new Error('Erreur simulée lors de l\'envoi du SMS');
    }

    logger.log(`[MODE DÉVELOPPEMENT] SMS simulé envoyé à ${phone}: "${message}"`);
    return true;
  }
}
