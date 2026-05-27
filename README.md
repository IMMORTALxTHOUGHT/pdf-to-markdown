# PDF to Markdown Converter

A cross-browser extension (Chrome + Firefox) that converts PDF files to Markdown — single files or entire folders, with batch processing.

Converted files are auto-downloaded as `.md` files. Everything runs entirely on your device — zero data leaves your browser.

## Features

- **High-quality conversion** — Powered by [Mozilla's pdf.js](https://mozilla.github.io/pdf.js/) and [@pdf2md/core](https://github.com/nickcoutsos/pdf2md) for proper text extraction, formatting, and layout
- **Batch conversion** — Drop an entire folder of PDFs, convert them all at once
- **Drag & drop** — Drag files or folders directly into the extension
- **File/folder pickers** — Native file dialogs with fallback for all browsers
- **Smart formatting** — Headings, bold, italic, lists, tables, code blocks, links, multi-column layouts, and metadata preserved
- **Private & offline** — All processing is client-side. No data ever sent anywhere
- **Cross-browser** — Chrome (Manifest V3) and Firefox 113+

## Installation

### Chrome Web Store

1. Visit the [Chrome Web Store listing](https://chrome.google.com/webstore/detail/pdf-to-markdown-converter/) *(link coming soon)*
2. Click **Add to Chrome**

### Firefox Add-ons

1. Visit the [Firefox Add-ons listing](https://addons.mozilla.org/firefox/addon/pdf-to-markdown-converter/) *(link coming soon)*
2. Click **Add to Firefox**

### Manual Install (Developer Mode)

```bash
git clone https://github.com/IMMORTALxTHOUGHT/pdf-to-markdown.git
cd pdf-to-markdown
npm install
npm run build
```

**Chrome:**
1. Go to `chrome://extensions`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked** and select the `dist/` folder

**Firefox:**
1. Go to `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Select `dist/manifest.json`

Or use `web-ext`:
```bash
npx web-ext run --source-dir dist
```

## Usage

1. Click the extension icon in your toolbar
2. Drag PDF files (or entire folders) onto the drop zone, or use the file/folder picker buttons
3. Check the file list and click **Convert All**
4. Each PDF is converted and the `.md` file is auto-downloaded to your Downloads folder

## Build

| Command | Description |
|---|---|
| `npm install` | Install dependencies |
| `npm run build` | Build the extension into `dist/` |
| `npm run watch` | Rebuild on file changes |
| `npm run lint` | Run web-ext lint on `dist/` |

The build bundles everything into `dist/` — icons, popup HTML/CSS/JS, background script, pdf.js worker, and WASM files.

## Privacy

This extension collects **zero data**. All PDF processing happens entirely on your device. No network requests are made. See [PRIVACY.md](PRIVACY.md) for the full privacy policy.

## License

MIT
