import * as path from 'path';

export interface GeneratedNames {
  key: string;
  name: string;
  alt: string;
}

export function generateNames(
  prefix: string,
  originalFilename: string,
  altFrom: 'filename' | 'timestamp' | 'none'
): GeneratedNames {
  const now = new Date();
  
  // Generate timestamp-based filename
  const timestamp = formatTimestamp(now);
  const ext = getExtension(originalFilename);
  const name = `${timestamp}.${ext}`;
  
  // Process prefix template
  const processedPrefix = processPrefix(prefix, now);
  
  // Combine to create S3 key
  const key = path.posix.join(processedPrefix, name);
  
  // Generate alt text based on altFrom setting
  let alt = '';
  if (altFrom === 'filename') {
    alt = path.basename(originalFilename, path.extname(originalFilename));
  } else if (altFrom === 'timestamp') {
    alt = timestamp;
  }
  
  return { key, name, alt };
}

function formatTimestamp(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

function processPrefix(prefix: string, date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return prefix
    .replace(/\$\{yyyy\}/g, String(year))
    .replace(/\$\{MM\}/g, month)
    .replace(/\$\{dd\}/g, day);
}

function getExtension(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  
  // Map common extensions
  const extMap: { [key: string]: string } = {
    '.jpg': 'jpg',
    '.jpeg': 'jpg',
    '.png': 'png',
    '.gif': 'gif',
    '.webp': 'webp',
    '.heic': 'heic',
    '.svg': 'svg'
  };
  
  return extMap[ext] || 'jpg';
}

export function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  
  const mimeMap: { [key: string]: string } = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.heic': 'image/heic',
    '.svg': 'image/svg+xml'
  };
  
  return mimeMap[ext] || 'application/octet-stream';
}

