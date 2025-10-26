import * as vscode from 'vscode';

export interface MarkdownImageSmartPasteConfig {
  bucket: string;
  region: string;
  prefix: string;
  publicBaseUrl?: string;
  useAclPublicRead: boolean;
  altFrom: 'filename' | 'timestamp' | 'none';
  linkMode: 'url' | 'key' | 'name';
  enableOnPaste: boolean;
  logging: 'error' | 'info' | 'debug';
}

export function getConfig(): MarkdownImageSmartPasteConfig | null {
  const config = vscode.workspace.getConfiguration('markdownImageSmartPaste');
  
  const bucket = config.get<string>('bucket');
  if (!bucket) {
    return null;
  }

  return {
    bucket,
    region: config.get<string>('region') || 'ap-northeast-2',
    prefix: config.get<string>('prefix') || 'images/${yyyy}/${MM}',
    publicBaseUrl: config.get<string>('publicBaseUrl'),
    useAclPublicRead: config.get<boolean>('useAclPublicRead') || false,
    altFrom: config.get<'filename' | 'timestamp' | 'none'>('altFrom') || 'filename',
    linkMode: config.get<'url' | 'key' | 'name'>('linkMode') || 'url',
    enableOnPaste: config.get<boolean>('enableOnPaste') !== false,
    logging: config.get<'error' | 'info' | 'debug'>('logging') || 'info'
  };
}

export function validateConfig(config: MarkdownImageSmartPasteConfig | null): string | null {
  if (!config) {
    return 'S3 bucket name is required. Please set markdownImageSmartPaste.bucket in settings.';
  }
  
  if (!config.bucket.trim()) {
    return 'S3 bucket name cannot be empty.';
  }
  
  return null;
}

