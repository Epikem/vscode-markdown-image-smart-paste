import * as vscode from 'vscode';
import { handlePaste, log, checkIfImageInClipboard } from './pasteInterceptor';
import { getConfig, validateConfig } from './config';

let outputChannel: vscode.OutputChannel;
let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
  // Create output channel
  outputChannel = vscode.window.createOutputChannel('Markdown Image Smart Paste');
  context.subscriptions.push(outputChannel);
  
  // Create status bar item
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.text = '$(cloud-upload) S3';
  statusBarItem.tooltip = 'Markdown Image Smart Paste';
  context.subscriptions.push(statusBarItem);
  
  // Update status bar based on config
  updateStatusBar();
  
  log(outputChannel, 'info', 'Markdown Image Smart Paste extension activated');

  // Register pasteImage command
  const pasteImageCommand = vscode.commands.registerCommand(
    'markdownImageSmartPaste.pasteImage',
    async () => {
      await handlePaste(outputChannel);
    }
  );
  context.subscriptions.push(pasteImageCommand);

  // Register toggleOnPaste command
  const toggleOnPasteCommand = vscode.commands.registerCommand(
    'markdownImageSmartPaste.toggleOnPaste',
    async () => {
      const config = vscode.workspace.getConfiguration('markdownImageSmartPaste');
      const currentValue = config.get<boolean>('enableOnPaste');
      await config.update('enableOnPaste', !currentValue, vscode.ConfigurationTarget.Global);
      
      const newValue = !currentValue;
      vscode.window.showInformationMessage(
        `Markdown Image Smart Paste is now ${newValue ? 'enabled' : 'disabled'}`
      );
      updateStatusBar();
    }
  );
  context.subscriptions.push(toggleOnPasteCommand);

  // Listen for configuration changes
  const configChangeListener = vscode.workspace.onDidChangeConfiguration(e => {
    if (e.affectsConfiguration('markdownImageSmartPaste')) {
      updateStatusBar();
      log(outputChannel, 'info', 'Configuration changed');
    }
  });
  context.subscriptions.push(configChangeListener);

  // Register paste command handler for Cmd+V in markdown
  const smartPasteCommand = vscode.commands.registerCommand(
    'markdownImageSmartPaste.smartPaste',
    async () => {
      await handleSmartPaste(outputChannel);
    }
  );
  context.subscriptions.push(smartPasteCommand);
}

async function handleSmartPaste(outputChannel: vscode.OutputChannel): Promise<void> {
  log(outputChannel, 'debug', '[SmartPaste] Command triggered');
  
  const editor = vscode.window.activeTextEditor;
  
  // Early return: No editor or not markdown
  if (!editor || editor.document.languageId !== 'markdown') {
    log(outputChannel, 'debug', `[SmartPaste] Not markdown (lang: ${editor?.document.languageId}), default paste`);
    await executeDefaultPaste();
    return;
  }

  // Early return: Auto-paste disabled
  const config = getConfig();
  if (!config?.enableOnPaste) {
    log(outputChannel, 'debug', '[SmartPaste] Auto-paste disabled, default paste');
    await executeDefaultPaste();
    return;
  }

  log(outputChannel, 'debug', '[SmartPaste] Checking clipboard...');
  
  // Check if clipboard contains image
  let hasImage = false;
  try {
    hasImage = await checkIfImageInClipboard(outputChannel);
  } catch (error) {
    log(outputChannel, 'debug', `[SmartPaste] Check error: ${error}`);
  }
  
  log(outputChannel, 'debug', `[SmartPaste] Has image: ${hasImage}`);
  
  if (hasImage) {
    // Try upload, fallback to default paste on failure
    const success = await handlePaste(outputChannel);
    if (!success) {
      log(outputChannel, 'debug', '[SmartPaste] Upload failed, default paste');
      await executeDefaultPaste();
    }
  } else {
    // Default paste
    await executeDefaultPaste();
  }
}

function executeDefaultPaste(): Thenable<unknown> {
  return vscode.commands.executeCommand('editor.action.clipboardPasteAction');
}

function updateStatusBar() {
  const config = getConfig();
  const error = validateConfig(config);
  
  if (error) {
    statusBarItem.text = '$(alert) SmartPaste';
    statusBarItem.tooltip = error;
    statusBarItem.color = new vscode.ThemeColor('errorForeground');
  } else if (config?.enableOnPaste) {
    statusBarItem.text = '$(cloud-upload) SmartPaste';
    statusBarItem.tooltip = 'Markdown Image Smart Paste (enabled)';
    statusBarItem.color = undefined;
  } else {
    statusBarItem.text = '$(cloud-upload) SmartPaste';
    statusBarItem.tooltip = 'Markdown Image Smart Paste (disabled)';
    statusBarItem.color = new vscode.ThemeColor('disabledForeground');
  }
  
  statusBarItem.show();
}

export function deactivate() {
  log(outputChannel, 'info', 'Markdown Image Smart Paste extension deactivated');
}

