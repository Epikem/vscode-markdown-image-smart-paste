import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { S3Uploader, UploadResult } from './uploader';
import { generateNames } from './namePolicy';
import { getConfig, validateConfig } from './config';

// Export function to check if clipboard contains image
export async function checkIfImageInClipboard(outputChannel: vscode.OutputChannel): Promise<boolean> {
  try {
    // First check if clipboard contains text
    const clipboardText = await vscode.env.clipboard.readText();
    
    if (clipboardText && clipboardText.length > 0) {
      log(outputChannel, 'debug', '[checkImage] Text detected in clipboard');
      return false;
    }
    
    log(outputChannel, 'debug', '[checkImage] No text, checking for image...');
    
    // No text, check if image exists
    const platform = process.platform;
    let result = false;
    
    if (platform === 'darwin') {
      result = await checkImageInClipboardMac();
    } else if (platform === 'linux') {
      result = await checkImageInClipboardLinux();
    } else if (platform === 'win32') {
      result = await checkImageInClipboardWindows();
    }
    
    log(outputChannel, 'debug', `[checkImage] Result: ${result}`);
    return result;
  } catch (error) {
    log(outputChannel, 'debug', `[checkImage] Error: ${error}`);
    return false;
  }
}

export async function handlePaste(outputChannel: vscode.OutputChannel): Promise<boolean> {
  const config = getConfig();
  const validationError = validateConfig(config);
  
  if (validationError || !config) {
    vscode.window.showErrorMessage(validationError || 'Configuration error');
    return false;
  }

  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return false;
  }

  // Only work in markdown files
  if (editor.document.languageId !== 'markdown') {
    return false;
  }

  let tempFile: string | null = null;

  try {
    // Get image from clipboard using system commands
    const imagePath = await getImageFromClipboard();
    
    if (!imagePath) {
      // No image in clipboard
      log(outputChannel, 'debug', 'Failed to get image from clipboard');
      return false;
    }

    tempFile = imagePath;

    // Log activity
    log(outputChannel, 'info', `Processing image from clipboard`);

    // Upload with progress
    const result = await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Uploading image to S3...',
        cancellable: true
      },
      async (progress, token) => {
        const uploader = new S3Uploader(config);
        
        // Generate a temp filename for upload
        const tempFilename = path.basename(imagePath);
        const names = generateNames(config.prefix, tempFilename, config.altFrom);
        
        if (token.isCancellationRequested) {
          throw new Error('Upload cancelled');
        }

        progress.report({ increment: 50, message: 'Uploading...' });
        
        const uploadResult = await uploader.upload(imagePath, names.key, tempFilename);
        
        progress.report({ increment: 50, message: 'Complete!' });
        
        return { ...uploadResult, alt: names.alt };
      }
    );

    // Insert markdown snippet
    await insertMarkdownSnippet(editor, result, config.linkMode);
    
    log(outputChannel, 'info', `Upload successful: ${result.url}`);
    vscode.window.showInformationMessage(`Image uploaded: ${result.name}`);
    
    return true;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    log(outputChannel, 'error', `Upload failed: ${errorMsg}`);
    vscode.window.showErrorMessage(`Failed to upload image: ${errorMsg}`);
    return false;
  } finally {
    // Clean up temp file
    if (tempFile && fs.existsSync(tempFile)) {
      try {
        fs.unlinkSync(tempFile);
      } catch (error) {
        log(outputChannel, 'debug', `Failed to delete temp file: ${tempFile}`);
      }
    }
  }
}

async function getImageFromClipboard(): Promise<string | null> {
  const platform = process.platform;
  
  if (platform === 'darwin') {
    // macOS: use pbpaste
    return await getImageFromClipboardMac();
  } else if (platform === 'linux') {
    // Linux: use xclip
    return await getImageFromClipboardLinux();
  } else if (platform === 'win32') {
    // Windows: use PowerShell
    return await getImageFromClipboardWindows();
  }
  
  return null;
}

// Check if clipboard contains image (without saving to file)
async function checkImageInClipboardMac(): Promise<boolean> {
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);
  
  try {
    const checkScript = `osascript -e 'set img to (the clipboard as «class PNGf»)'`;
    await execAsync(checkScript);
    return true;
  } catch {
    return false;
  }
}

async function checkImageInClipboardLinux(): Promise<boolean> {
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);
  
  try {
    await execAsync('which xclip');
    
    // Try to get image data from clipboard
    const { stdout } = await execAsync('xclip -selection clipboard -target image/png -t > /dev/null 2>&1 && echo "ok"');
    
    return stdout.trim() === 'ok';
  } catch {
    return false;
  }
}

async function checkImageInClipboardWindows(): Promise<boolean> {
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);
  
  try {
    const psScript = `
      Add-Type -AssemblyName System.Windows.Forms
      $clipboard = [System.Windows.Forms.Clipboard]
      if ($clipboard::ContainsImage()) {
        Write-Output "true"
      } else {
        Write-Output "false"
      }
    `;
    
    const { stdout } = await execAsync(`powershell -Command "${psScript.replace(/"/g, '\\"')}"`);
    
    return stdout.trim() === 'true';
  } catch {
    return false;
  }
}

async function getImageFromClipboardMac(): Promise<string | null> {
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);
  
  try {
    // Create temp directory
    const tempDir = path.join(require('os').tmpdir(), 'vscode-s3-image-uploader');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const tempFile = path.join(tempDir, `image-${crypto.randomBytes(8).toString('hex')}.png`);
    
    // Use osascript to extract image from clipboard
    // First check if there's an image in clipboard
    const checkScript = `osascript -e 'set img to (the clipboard as «class PNGf»)'`;
    
    let hasImage = false;
    try {
      await execAsync(checkScript);
      hasImage = true;
    } catch {
      // No image in clipboard
      return null;
    }
    
    if (hasImage) {
      // Save the image
      const saveScript = `
        set img to (the clipboard as «class PNGf»)
        set filePath to POSIX path of "${tempFile}"
        set fileHandle to open for access filePath with write permission
        write img to fileHandle
        close access fileHandle
      `;
      
      await execAsync(`osascript -e '${saveScript}'`);
      
      if (fs.existsSync(tempFile) && fs.statSync(tempFile).size > 0) {
        return tempFile;
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

async function getImageFromClipboardLinux(): Promise<string | null> {
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);
  
  try {
    // Check if xclip is available
    await execAsync('which xclip');
    
    const tempDir = path.join(require('os').tmpdir(), 'vscode-s3-image-uploader');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const tempFile = path.join(tempDir, `image-${crypto.randomBytes(8).toString('hex')}.png`);
    
    // Save clipboard image to temp file
    await execAsync(`xclip -selection clipboard -target image/png -out > "${tempFile}"`);
    
    if (fs.existsSync(tempFile) && fs.statSync(tempFile).size > 0) {
      return tempFile;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

async function getImageFromClipboardWindows(): Promise<string | null> {
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const execAsync = promisify(exec);
  
  try {
    const tempDir = path.join(require('os').tmpdir(), 'vscode-s3-image-uploader');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const tempFile = path.join(tempDir, `image-${crypto.randomBytes(8).toString('hex')}.png`);
    
    // PowerShell script to save clipboard image
    const psScript = `
      Add-Type -AssemblyName System.Windows.Forms
      $clipboard = [System.Windows.Forms.Clipboard]
      if ($clipboard::ContainsImage()) {
        $image = $clipboard::GetImage()
        $image.Save('${tempFile.replace(/\\/g, '\\\\')}', [System.Drawing.Imaging.ImageFormat]::Png)
        Write-Output "success"
      }
    `;
    
    const { stdout } = await execAsync(`powershell -Command "${psScript.replace(/"/g, '\\"')}"`);
    
    if (stdout.trim() === 'success' && fs.existsSync(tempFile) && fs.statSync(tempFile).size > 0) {
      return tempFile;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

async function insertMarkdownSnippet(
  editor: vscode.TextEditor,
  result: UploadResult & { alt: string },
  linkMode: 'url' | 'key' | 'name'
): Promise<void> {
  const link = linkMode === 'url' 
    ? result.url 
    : linkMode === 'key' 
      ? result.key 
      : result.name;
  
  const snippet = `![${result.alt}](${link})`;
  
  await editor.edit(editBuilder => {
    editBuilder.insert(editor.selection.active, snippet);
  });
}

export function log(
  outputChannel: vscode.OutputChannel,
  level: 'error' | 'info' | 'debug',
  message: string
): void {
  const config = getConfig();
  const configLevel = config?.logging || 'info';
  
  const levels = { error: 0, info: 1, debug: 2 };
  
  if (levels[level] <= levels[configLevel]) {
    const timestamp = new Date().toISOString();
    outputChannel.appendLine(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
  }
}

