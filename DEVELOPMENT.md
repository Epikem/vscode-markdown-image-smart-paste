# Markdown Image Smart Paste - Development Guide

## Project Structure

---
markdown-image-smart-paste/
├── .vscode/
│   ├── launch.json          # Debug configuration
│   ├── settings.json        # Workspace settings
│   └── tasks.json           # Build tasks
├── src/
│   ├── extension.ts         # Extension entry point
│   ├── config.ts            # Configuration loading and validation
│   ├── namePolicy.ts        # Filename/path generation rules
│   ├── uploader.ts          # S3 upload implementation
│   ├── pasteInterceptor.ts  # Paste event handling
│   └── test/
│       ├── runTest.ts       # Test runner
│       └── suite/
│           ├── index.ts     # Test suite loader
│           └── extension.test.ts  # Unit tests
├── dist/                    # Build output (bundle)
├── out/                     # Test compilation output
├── package.json             # Extension metadata
├── tsconfig.json            # TypeScript configuration
├── esbuild.js               # Bundler script
├── .vscodeignore            # Packaging exclusion files
├── .gitignore
├── README.md                # Design document
├── USAGE.md                 # User guide
└── keybindings-example.json # Keybindings example
---

## Getting Started

### 1. Install Dependencies

---
$ pnpm install
---

### 2. Run in Development Mode

Watch mode TypeScript compilation:

---
$ pnpm run watch
---

### 3. Debugging

1. Press `F5` in VS Code
2. Extension Development Host window opens
3. Open a markdown file in the new window and test

## Module Overview

### config.ts

Reads and validates VS Code settings.

- `getConfig()`: Read current configuration values
- `validateConfig()`: Validate required settings

### namePolicy.ts

Implements S3 key generation rules.

- `generateNames()`: Generate timestamp-based filenames and S3 keys
- `getMimeType()`: Extract MIME type from file extension
- Template variable support: `${yyyy}`, `${MM}`, `${dd}`

### uploader.ts

Uploads files to S3 using AWS SDK v3.

- `S3Uploader` class
- `upload()`: Upload files to S3 and generate URLs
- Credentials use AWS SDK's default credential chain

### pasteInterceptor.ts

Implements clipboard image processing and markdown insertion logic.

- `handlePaste()`: Paste event handler
- `checkIfImageInClipboard()`: Detect images in clipboard (platform-specific)
- Read image files from clipboard (macOS, Linux, Windows support)
- Display upload progress
- Generate and insert markdown snippets

### extension.ts

Entry point for the VS Code extension.

- `activate()`: Called when the extension is activated
- Command registration: `pasteImage`, `toggleOnPaste`, `smartPaste`
- Status bar item management
- Output channel creation
- `handleSmartPaste()`: Smart paste logic (automatic text/image detection)

## Build

### Development Build

---
$ pnpm run compile
---

### Production Build (Optimized)

---
$ pnpm run package
---

### Watch Mode

---
$ pnpm run watch
---

## Testing

### Run Tests

---
$ pnpm test
---

### Compile Tests Only

---
$ pnpm run compile-tests
---

### Writing Tests

Add `*.test.ts` files in the `src/test/suite/` directory.

## Packaging

### 1. Prerequisites

#### Create Visual Studio Code Marketplace Account

1. Go to [Visual Studio Marketplace](https://marketplace.visualstudio.com/manage)
2. Sign in with Azure DevOps account (Microsoft account)
3. Create a publisher (one-time only)
   - Publisher name should be lowercase letters (e.g., `epikem`)

#### Generate Personal Access Token (PAT)

1. Go to [Azure DevOps](https://dev.azure.com/)
2. User Settings > Personal Access Tokens
3. Click "New Token"
4. Settings:
   - Name: `VSCode Extension Publish`
   - Organization: `All accessible organizations`
   - Scopes: `Full access` or `Custom defined > Marketplace (Manage)`
5. **Copy and save the token immediately** (you won't see it again)

### 2. Generate VSIX Package

#### Install Packaging Tool

---
$ pnpm install -g @vscode/vsce
or
$ npm install -g @vscode/vsce
---

#### Generate VSIX File

---
$ vsce package
---

This command:
- Automatically runs `vscode:prepublish` script (production build)
- Excludes files specified in `.vscodeignore`
- Creates `markdown-image-smart-paste-0.0.1.vsix` file

### 3. Local Testing

Install the generated VSIX file locally for testing:

---
$ code --install-extension markdown-image-smart-paste-0.0.1.vsix
---

### 4. Publish to Marketplace

#### Login

---
$ vsce login epikem
---

Enter the Personal Access Token when prompted.

#### Publish

**Manual Version Update (Recommended):**

Update the `version` field in `package.json`:
```json
"version": "0.0.2"
```

Then package again:

---
$ vsce package
$ vsce publish
---

**Automatic Version Update:**

---
$ vsce publish patch   # 0.0.1 -> 0.0.2
$ vsce publish minor   # 0.0.1 -> 0.1.0
$ vsce publish major   # 0.0.1 -> 1.0.0
---

These commands automatically update the version in `package.json` and perform packaging/publishing.

### 5. Verify Publication

- Search on [Marketplace page](https://marketplace.visualstudio.com/)
- Usually searchable within minutes
- Updates reflected within 5-10 minutes

### 6. Deployment Checklist

Pre-deployment checks:

- [ ] Update `version` in `package.json`
- [ ] Update `README.md` with latest content
- [ ] Complete feature testing
- [ ] Check `.vscodeignore` file (exclude unnecessary files)
- [ ] Write browser-readable README.md

### Troubleshooting

#### "publisher not found" Error

Verify publisher name matches the `publisher` field in `package.json`

#### "Personal Access Token expired"

Generate a new token in Azure DevOps and run `vsce login` again

#### Package Size Limit

VS Code extensions have a 10MB limit. Add unnecessary dependencies to `.vscodeignore`:

---
# Exclude large test files
src/test/**
out/**
*.vsix
---

## Debugging Tips

### Check Output Channel

View > Output > Select "S3 Image Uploader" to check logs

### Set Logging Level

Adjust logging level in settings.json:

---
{
  "markdownImageSmartPaste.logging": "debug"
}
---

### Using Breakpoints

1. Set breakpoints in source code
2. Start debugging with `F5`
3. Execute commands in Extension Development Host
4. Stop at breakpoints to inspect variables

## Code Style

- Use TypeScript strict mode
- 2 space indentation
- Use ESModule import/export
- Use async/await

## Notes

### Clipboard API

VS Code's clipboard API only supports text (`readText()`, `writeText()`).
To read image data, platform-specific system commands are used:

- **macOS**: Use `osascript` to extract clipboard images via AppleScript
- **Linux**: Use `xclip` command (requires installation)
- **Windows**: Use PowerShell to save clipboard images

If there's no image in the clipboard, default paste behavior is maintained.

### AWS SDK

- Use AWS SDK v3 (modular packages)
- Only `@aws-sdk/client-s3` included in dependencies
- Credentials automatically loaded from environment variables or credentials file

### Bundling

- Fast build using esbuild
- `vscode` module handled as external
- Apply minify for production builds

## Troubleshooting

### TypeScript Errors

---
$ pnpm run compile
---

Use this command to check for compilation errors

### Test Failures

---
$ pnpm run compile-tests
---

Check for compilation errors first

### Extension Loading Failures

Check `activationEvents` and `main` path in `package.json`

## Contributing

1. Create an issue to discuss features/bugs
2. Create a branch and write code
3. Add tests
4. Create a Pull Request
