import { S3Client, PutObjectCommand, PutObjectCommandInput } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import { MarkdownImageSmartPasteConfig } from './config';
import { getMimeType } from './namePolicy';

export interface UploadResult {
  url: string;
  key: string;
  name: string;
}

export class S3Uploader {
  private client: S3Client;
  private config: MarkdownImageSmartPasteConfig;
  
  constructor(config: MarkdownImageSmartPasteConfig) {
    this.config = config;
    this.client = new S3Client({
      region: config.region
    });
  }

  async upload(
    filePath: string,
    key: string,
    originalFilename: string
  ): Promise<UploadResult> {
    const fileContent = await fs.promises.readFile(filePath);
    const contentType = getMimeType(originalFilename);

    const params: PutObjectCommandInput = {
      Bucket: this.config.bucket,
      Key: key,
      Body: fileContent,
      ContentType: contentType
    };

    // Add ACL if configured
    if (this.config.useAclPublicRead) {
      params.ACL = 'public-read';
    }

    const command = new PutObjectCommand(params);
    await this.client.send(command);

    // Generate URL
    const url = this.generateUrl(key);
    const name = key.split('/').pop() || key;

    return { url, key, name };
  }

  private generateUrl(key: string): string {
    if (this.config.publicBaseUrl) {
      // Use custom base URL (CDN or static hosting)
      const baseUrl = this.config.publicBaseUrl.replace(/\/$/, '');
      return `${baseUrl}/${key}`;
    } else {
      // Use standard S3 URL
      return `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com/${key}`;
    }
  }
}

