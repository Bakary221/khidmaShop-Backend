import { Injectable } from '@nestjs/common';
import twilio from 'twilio';
import { getLogger } from '@/common/utils/logger';

const logger = getLogger('SmsService');

@Injectable()
export class SmsService {
  private twilioClient: twilio.Twilio | null = null;
  private isProductionMode = false;

  constructor() {
    // Vérifier si les credentials Twilio sont configurés pour la production
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = process.env.TWILIO_FROM_PHONE;

    if (accountSid && authToken && fromPhone && accountSid !== 'test-sid') {
      this.twilioClient = twilio(accountSid, authToken);
      this.isProductionMode = true;
      logger.log('Mode production activé pour les SMS (Twilio configuré)');
    } else {
      logger.log('Mode développement activé pour les SMS (simulation)');
    }
  }

  async sendSms(phone: string, message: string): Promise<boolean> {
    logger.log(`Tentative d'envoi SMS à ${phone}`);

  if (this.isProductionMode && this.twilioClient) {
      // Mode production : envoi réel via Twilio
      return this.sendRealSms(phone, message);
    } else {
      // Mode développement : simulation
      return this.sendMockSms(phone, message);
    }
  }

  private async sendRealSms(phone: string, message: string): Promise<boolean> {
    if (!this.twilioClient) {
      throw new Error('Service Twilio non initialisé');
    }

    try {
      const from = process.env.TWILIO_FROM_PHONE || '+1234567890';

      const result = await this.twilioClient.messages.create({
        body: message,
        from: from,
        to: phone
      });

      if (result.sid) {
        logger.log(`SMS envoyé avec succès à ${phone} (SID: ${result.sid})`);
        return true;
      } else {
        logger.error(`Échec de l'envoi SMS à ${phone}`);
        return false;
      }
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
