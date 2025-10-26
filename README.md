# VS Code Extension: Markdown Image Smart Paste

Smart paste extension: Automatically detects text/images when pasting with `cmd+v` in markdown files, uploads images to S3, and inserts markdown snippets.

> ⚠️ **Disclaimer**  
> This project was created with vibe coding. Use at your own risk. **NO WARRANTY** provided.  
> Tested on macOS only.

## Quick Start

---
# Install dependencies
$ pnpm install

# Run in development mode
$ pnpm run watch

# Press F5 in VS Code to start debugging
---

📖 For more details:
- User Guide: `USAGE.md`
- Development Guide: `DEVELOPMENT.md`

---

## Features

- ✅ **Smart Detection**: Automatic text/image differentiation
- ✅ **One-Click**: Upload and insert with cmd+v
- ✅ **S3 Upload**: Rule-based filename/path generation (e.g., `images/YYYY/MM/YYYYMMDDHHMMSS.ext`)
- ✅ **Public URL**: Automatic markdown image snippet insertion after S3 upload
- ✅ **Fallback Handling**: Automatic default paste on failure
- ✅ **Cross-Platform**: macOS, Linux, Windows support

### How It Works
1. Perform paste (Cmd+V) in a markdown file
2. Analyze clipboard content (detect file path / file:// URL / image data)
3. Generate filename/path according to upload rules
4. Upload to AWS S3 → obtain public URL
5. Insert into editor as `![ALT](URL)`

## Architecture Overview
- VS Code Extension (TypeScript)
  - `extension.ts`: Activation/deactivation, event subscription, command registration
  - `PasteInterceptor`: Intercept paste events, detect images
  - `Uploader`: S3 uploader (aws-sdk v3 or AWS CLI integration)
  - `NamePolicy`: Filename/path rule generation
  - `Config`: Settings loading/validation

## Settings
- `markdownImageSmartPaste.bucket` (string, required): S3 bucket name
- `markdownImageSmartPaste.region` (string, optional): Default `ap-northeast-2`
- `markdownImageSmartPaste.prefix` (string, optional): Default `images/${yyyy}/${MM}`
- `markdownImageSmartPaste.publicBaseUrl` (string, optional): CDN/static hosting domain
- `markdownImageSmartPaste.useAclPublicRead` (boolean, optional): Default false
- `markdownImageSmartPaste.altFrom` (enum: filename|timestamp|none, optional): Default filename
- `markdownImageSmartPaste.linkMode` (enum: url|key|name, optional): Default url
- `markdownImageSmartPaste.enableOnPaste` (boolean): Enable/disable automatic paste behavior
- `markdownImageSmartPaste.logging` (enum: error|info|debug, optional): Default info

## Behavior Rules
- Only works when paste context is in markdown/markdown-compatible editor
- Only intercepts when clipboard contains image file path or image binary
- Insert on successful upload, fallback to original paste behavior on failure
- Filename: `YYYYMMDDHHMMSS.ext` (low collision probability)
- Path: `${prefix}/YYYY/MM/` (grouped by month)

## Security/Authentication
- Priority order:
  1) `~/.aws/credentials`
  2) Environment variables `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`

## Commands/Keybindings
- Commands
  - `markdownImageSmartPaste.pasteImage`: Force image paste (command palette)
  - `markdownImageSmartPaste.smartPaste`: Smart paste (automatic text/image detection, default cmd+v binding)
  - `markdownImageSmartPaste.toggleOnPaste`: Toggle automatic behavior on/off
- Keybinding configuration (add to keybindings.json)
---
{
  "key": "cmd+v",
  "command": "markdownImageSmartPaste.smartPaste",
  "when": "editorTextFocus && editorLangId == markdown"
}
---

Refer to `keybindings-example.json` to configure for your environment.

## Failure/Fallback Strategy
- If not an image: Pass through to default paste
- Upload failure: Show error toast to user, pass through to default paste
- URL generation failure: Attempt fallback to `key`-based link mode

## Snippet Template
- Template string support: `![${alt}](${link})`
- Variables
  - `${url}`, `${key}`, `${name}`, `${alt}`, `${timestamp}`

## Filename/Path Rules
- Alt extraction priority: Filename (without extension) → Timestamp → Empty string
- Extension mapping: mime → jpg|png|gif|webp|heic|svg
- Collision prevention: Timestamp + optional 3-4 digit random number option

## Performance/UX
- Show upload progress in status bar (spinner)
- Display clickable URL in status bar after completion
- Provide user cancel action (ESC)

## Logging/Diagnostics
- `markdownImageSmartPaste.logging` (error|info|debug)
- Output: VS Code Output channel `Markdown Image Smart Paste`

## Development/Execution
- Install dependencies
---
$ npm i
$ npm run watch
---

- Run/Debug: VS Code `F5` (Extension Development Host)

## Operational Tips
- In corporate proxy environments, proxy settings need to be applied to SDK configuration

## Disclaimer

This software is provided "as is", without warranty of any kind, express or implied. As this was created with vibe coding, thorough testing is recommended before production use.
