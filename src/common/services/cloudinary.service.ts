import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { getLogger } from '@/common/utils/logger';
import { createHash } from 'crypto';

const logger = getLogger('CloudinaryService');
type CloudinaryUploadResponse = { secure_url?: string };
type UploadFileInput = {
  buffer: Buffer;
  mimetype: string;
  originalname?: string;
};

@Injectable()
export class CloudinaryService {
  private readonly cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  private readonly apiKey = process.env.CLOUDINARY_API_KEY;
  private readonly apiSecret = process.env.CLOUDINARY_API_SECRET;
  private readonly baseUrl = this.cloudName
    ? `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`
    : '';
  private readonly folder = process.env.CLOUDINARY_FOLDER;
  private readonly skipUpload =
    process.env.SKIP_CLOUDINARY_UPLOAD === 'true' ||
    process.env.SKIP_CLOUDINARY_UPLOAD === '1';

  private ensureConfigured() {
    if (this.skipUpload) {
      return;
    }

    if (!this.cloudName || !this.apiKey || !this.apiSecret) {
      throw new InternalServerErrorException(
        'Cloudinary is not configured. Please set CLOUDINARY_* env vars.',
      );
    }
  }

  private getSignature(timestamp: number) {
    const params: Record<string, string> = {
      timestamp: timestamp.toString(),
    };

    if (this.folder) {
      params.folder = this.folder;
    }

    const sortedParams = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join('&');

    return createHash('sha1').update(`${sortedParams}${this.apiSecret}`).digest('hex');
  }

  private async performUpload(form: FormData) {
    logger.log('Uploading image to Cloudinary');
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      body: form,
    });

    let payload: CloudinaryUploadResponse | null = null;
    try {
      payload = await response.json();
    } catch (error) {
      logger.warn('Cloudinary response parse failed', error);
    }

    if (!response.ok || !payload?.secure_url) {
      logger.error('Cloudinary upload failed', payload);
      throw new InternalServerErrorException('Impossible d\'uploader l\'image');
    }

    return payload.secure_url as string;
  }

  async upload(dataUrl: string) {
    if (this.skipUpload) {
      logger.warn('SKIP_CLOUDINARY_UPLOAD=true, returning data URL without uploading.');
      return dataUrl;
    }

    this.ensureConfigured();

    if (!dataUrl.startsWith('data:')) {
      return dataUrl;
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const form = new FormData();
    form.append('file', dataUrl);
    form.append('api_key', this.apiKey);
    form.append('timestamp', timestamp.toString());
    form.append('signature', this.getSignature(timestamp));
    if (this.folder) {
      form.append('folder', this.folder);
    }

    try {
      return await this.performUpload(form);
    } catch (error) {
      logger.warn('Cloudinary upload request failed, falling back to local data URL', error);
      return dataUrl;
    }
  }

  async uploadFile(file: UploadFileInput) {
    if (this.skipUpload) {
      logger.warn('SKIP_CLOUDINARY_UPLOAD=true, returning local data URL without uploading.');
      return this.toDataUrl(file);
    }

    this.ensureConfigured();

    const timestamp = Math.floor(Date.now() / 1000);
    const form = new FormData();
    const blob = new Blob([file.buffer], {
      type: file.mimetype || 'application/octet-stream',
    });

    form.append('file', blob, file.originalname || 'upload');
    form.append('api_key', this.apiKey);
    form.append('timestamp', timestamp.toString());
    form.append('signature', this.getSignature(timestamp));
    if (this.folder) {
      form.append('folder', this.folder);
    }

    try {
      return await this.performUpload(form);
    } catch (error) {
      logger.warn('Cloudinary file upload request failed, falling back to local data URL', error);
      return this.toDataUrl(file);
    }
  }

  async uploadMany(images: string[]) {
    const uploaded = [];
    for (const image of images) {
      if (!image) continue;
      uploaded.push(await this.upload(image));
    }
    return uploaded;
  }

  async uploadManyFiles(files: UploadFileInput[]) {
    const uploaded = [];
    for (const file of files) {
      uploaded.push(await this.uploadFile(file));
    }
    return uploaded;
  }

  private toDataUrl(file: UploadFileInput) {
    const mime = file.mimetype || 'application/octet-stream';
    return `data:${mime};base64,${file.buffer.toString('base64')}`;
  }
}
