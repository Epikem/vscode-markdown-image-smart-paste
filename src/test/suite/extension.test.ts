import * as assert from 'assert';
import { generateNames } from '../../namePolicy';
import { validateConfig } from '../../config';

suite('Extension Test Suite', () => {
  test('generateNames should create timestamp-based filename', () => {
    const result = generateNames('images/${yyyy}/${MM}', 'test.png', 'filename');
    
    assert.ok(result.key.includes('images/'));
    assert.ok(result.name.endsWith('.png'));
    assert.strictEqual(result.alt, 'test');
  });

  test('generateNames should handle timestamp alt mode', () => {
    const result = generateNames('images', 'photo.jpg', 'timestamp');
    
    assert.ok(result.name.endsWith('.jpg'));
    assert.ok(result.alt.match(/^\d{14}$/)); // Timestamp format
  });

  test('generateNames should handle none alt mode', () => {
    const result = generateNames('images', 'image.png', 'none');
    
    assert.strictEqual(result.alt, '');
  });

  test('generateNames should process prefix template', () => {
    const result = generateNames('images/${yyyy}/${MM}', 'test.jpg', 'filename');
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    
    assert.ok(result.key.includes(`images/${year}/${month}/`));
  });

  test('validateConfig should return error for null config', () => {
    const error = validateConfig(null);
    assert.ok(error !== null);
    assert.ok(error.includes('bucket'));
  });

  test('validateConfig should return error for empty bucket', () => {
    const error = validateConfig({
      bucket: '',
      region: 'us-east-1',
      prefix: 'images',
      useAclPublicRead: false,
      altFrom: 'filename',
      linkMode: 'url',
      enableOnPaste: true,
      logging: 'info'
    });
    
    assert.ok(error !== null);
    assert.ok(error.includes('empty'));
  });

  test('validateConfig should return null for valid config', () => {
    const error = validateConfig({
      bucket: 'my-bucket',
      region: 'us-east-1',
      prefix: 'images',
      useAclPublicRead: false,
      altFrom: 'filename',
      linkMode: 'url',
      enableOnPaste: true,
      logging: 'info'
    });
    
    assert.strictEqual(error, null);
  });
});

