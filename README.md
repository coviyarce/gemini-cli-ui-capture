# 🚀 Gemini CLI UI Capture Tool for Figma

A powerful toolkit for **UI-to-Design** synchronization. This tool captures live web interfaces (localhost or production) and recreates them as high-fidelity, editable vector layers in Figma using a local development plugin.

Built specifically to bridge the gap in environments where the native Figma MCP `capture_ui` tool is not directly exposed, allowing developers to maintain a perfect sync between their code and their design canvas.

---

## ✨ Features & Evolution

This tool evolved through rigorous iteration to achieve near-perfect design fidelity:

- **1.0: Basic Capture** - Initial implementation of DOM scanning (Portrait only).
- **2.0: Multi-Resolution** - Support for dual-view captures (1080p and 720p) to test responsiveness.
- **3.0: Precision Alignment** - Added support for CSS Flexbox, Padding, and Text Alignment, ensuring content is centered exactly as in the browser.
- **4.0: High Fidelity** - Support for `box-shadow` (translated to Figma Drop Shadows), full borders, and corner radii.
- **5.0: Vector & Icons** - Real SVG extraction and rendering using Figma's vector engine. Support for Material Icon fonts and automatic color synchronization with design themes.

---

## 🛠 Prerequisites

### CLI Side (Development Environment)
- **Node.js** (v16 or higher)
- **Puppeteer**: Used to drive the headless browser for pixel-perfect UI extraction.
- **Gemini CLI / MCP**: Configured with Figma MCP permissions.

### Figma Side
- **Figma Desktop App** (Recommended for local plugin development).
- **Figma Account**: Permissions to import local plugins.

---

## 🚀 Quick Start

### 1. Installation
Clone this toolkit into your project or as a standalone tool:
```bash
git clone https://github.com/coviyarce/gemini-cli-ui-capture.git
cd gemini-cli-ui-capture
npm install puppeteer
```

### 2. Capture your UI
Run the capture script to generate the UI blueprint. Ensure your local dev server is running (e.g., `http://localhost:5173`).
```bash
node scripts/capture-to-figma.cjs
```
This generates `ui-structure.json` containing the detailed map of your interface.

### 3. Update the Plugin
Sync the captured data into the Figma plugin code:
```bash
node scripts/update-plugin.cjs
```

### 4. Run in Figma
1. Open Figma -> Menu -> **Plugins** -> **Development** -> **Import plugin from manifest...**
2. Select the `figma-plugin/manifest.json` file from this folder.
3. Run **"Polaris Sync Plugin"**.
4. The tool will detect your current viewport center and create two frames (1080p & 720p) with editable vector layers.

---

## 📂 Repository Structure

- `scripts/capture-to-figma.cjs`: The core engine that uses Puppeteer to scan the DOM and styles.
- `scripts/update-plugin.cjs`: Utility to inject captured data into the Figma plugin.
- `figma-plugin/`: The local Figma plugin source code.
  - `manifest.json`: Plugin configuration.
  - `code.template.js`: The logic for drawing nodes in Figma (Text, Frames, SVGs, Shadows).
  - `code.js`: The active plugin file (generated).

---

## 🔒 Security & Privacy
This tool is designed for private use. It does **not** store or transmit your Figma credentials or personal access tokens. All capture data remains local to your machine until you run the plugin within your authorized Figma session.

---

## 🤝 Contribution
Created and maintained by **coviyarce**. Feel free to fork and adapt for your own Design Systems!
