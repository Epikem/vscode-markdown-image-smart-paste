# Markdown Image Smart Paste - User Guide

## Installation

### 1. Install Dependencies

---
$ cd markdown-image-smart-paste
$ pnpm install
---

### 2. Build

---
$ pnpm run compile
---

Or run in watch mode:

---
$ pnpm run watch
---

## Development and Testing

### Extension Debugging

1. Open the `markdown-image-smart-paste` folder in VS Code
2. Press `F5` to run Extension Development Host
3. Open a markdown file in the new window
4. Copy an image to the clipboard
5. Upload the image using one of these methods:
   - **Smart Paste (recommended)**: After setting up keybindings, press `cmd+v` in a markdown file
   - **Manual Command**: Run `Paste Image to S3` from Command Palette (`Cmd+Shift+P`)

### Run Tests

---
$ pnpm test
---

## Configuration

Configure the following items in VS Code settings:

### Required Settings

- `markdownImageSmartPaste.bucket`: S3 bucket name (required)

### Optional Settings

- `markdownImageSmartPaste.region`: AWS region (default: `ap-northeast-2`)
- `markdownImageSmartPaste.prefix`: S3 key prefix template (default: `images/${yyyy}/${MM}`)
- `markdownImageSmartPaste.publicBaseUrl`: CDN/static hosting domain
- `markdownImageSmartPaste.useAclPublicRead`: Set ACL to public-read (default: `false`)
- `markdownImageSmartPaste.altFrom`: Alt text generation method (`filename`, `timestamp`, `none`)
- `markdownImageSmartPaste.linkMode`: Link mode (`url`, `key`, `name`)
- `markdownImageSmartPaste.enableOnPaste`: Enable automatic paste upload (default: `true`)
- `markdownImageSmartPaste.logging`: Logging level (`error`, `info`, `debug`)

### Settings Example (settings.json)

---
{
  "markdownImageSmartPaste.bucket": "my-image-bucket",
  "markdownImageSmartPaste.region": "ap-northeast-2",
  "markdownImageSmartPaste.prefix": "blog/images/${yyyy}/${MM}",
  "markdownImageSmartPaste.publicBaseUrl": "https://cdn.example.com",
  "markdownImageSmartPaste.useAclPublicRead": true,
  "markdownImageSmartPaste.altFrom": "filename",
  "markdownImageSmartPaste.linkMode": "url",
  "markdownImageSmartPaste.enableOnPaste": true,
  "markdownImageSmartPaste.logging": "info"
}
---

## AWS Credentials

The extension looks for AWS credentials in the following priority order:

1. `~/.aws/credentials` file
2. Environment variables: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`

### AWS Credentials Setup Example

---
$ aws configure
AWS Access Key ID [None]: YOUR_ACCESS_KEY
AWS Secret Access Key [None]: YOUR_SECRET_KEY
Default region name [None]: ap-northeast-2
Default output format [None]: json
---

## Keybinding Configuration

### Smart Paste (Recommended)

When pressing `cmd+v` in a markdown file, it automatically detects whether the clipboard contains text or an image and processes it accordingly:
- **Text**: Execute normal paste
- **Image**: Upload to S3 and insert markdown

#### Setup Method

Refer to the `keybindings-example.json` file and add the following to VS Code's `keybindings.json`:

---
[
  {
    "key": "cmd+v",
    "command": "markdownImageSmartPaste.smartPaste",
    "when": "editorTextFocus && editorLangId == markdown"
  }
]
---

Or search for `markdownImageSmartPaste.smartPaste` in VS Code's Keyboard Shortcuts (`Cmd+K Cmd+S`) and bind it to `cmd+v`.

### Command List

- `markdownImageSmartPaste.pasteImage`: Manual image upload (command palette)
- `markdownImageSmartPaste.smartPaste`: Smart paste (automatic text/image detection, recommended)
- `markdownImageSmartPaste.toggleOnPaste`: Toggle automatic upload on/off

### Recommended Keybinding

Override `Cmd+V` in markdown files for smart paste:

---
{
  "key": "cmd+v",
  "command": "markdownImageSmartPaste.smartPaste",
  "when": "editorTextFocus && editorLangId == markdown"
}
---

This keybinding automatically detects clipboard content:
- **If text is in clipboard**: Normal paste
- **If image is in clipboard**: Upload to S3 and insert markdown link
- **If image upload fails**: Fall back to normal paste

## Usage

### Method 1: Smart Paste (Recommended)

1. Open a markdown file
2. Set keybinding for `smartPaste` command (e.g., `Cmd+V`)
3. Copy an image to clipboard (screenshot, file copy, etc.)
4. Press the keybinding
5. If clipboard contains an image, automatically upload to S3 and insert markdown link
6. If clipboard contains text, execute normal paste

### Method 2: Manual Upload

1. Open a markdown file
2. Copy an image to clipboard
3. Run `Paste Image to S3` from Command Palette (`Cmd+Shift+P`)
4. Check upload progress
5. When completed, markdown image link is automatically inserted at cursor position

## Packaging and Distribution

### Generate VSIX File

---
$ pnpm install -g @vscode/vsce
$ vsce package
---

Install the generated `.vsix` file in VS Code:

1. Command Palette (`Cmd+Shift+P`)
2. Select `Extensions: Install from VSIX...`
3. Select the generated `.vsix` file

## Troubleshooting

### Upload Failures

- Check if AWS credentials are set correctly
- Check if S3 bucket name is correct
- Check if IAM permissions include `s3:PutObject`
- Check error logs in Output channel (`Markdown Image Smart Paste`)

### Clipboard Image Not Detected

- Check if image file was copied directly (browser images may not be supported)
- Supported image formats: JPG, PNG, GIF, WebP, HEIC, SVG

### Status Bar Icon Shows Warning

- Check if required settings (`markdownImageSmartPaste.bucket`) are configured
- Hover over status bar icon to see error message

