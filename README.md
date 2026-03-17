# SuperScan UI Sync Kit (v3.2 - SVG Edition) 🚀

This repository is a powerful, high-precision engine that "captures" your web application (React, HTML, Vue, etc.) and converts it into perfectly editable **SVG Vectors** directly inside Figma.

Think of it as a "Super Snapshot" that preserves every shadow, gradient, and layout detail as real vector paths.

---

## 🌟 What's New in v3.2?

- **SVG Snapshots:** High-fidelity capture using SVG `foreignObject`. It handles complex CSS effects (shadows, filters, specific fonts) much better than the old JSON mapping.
- **Hybrid Engine:** Captures both pixel-perfect coordinates (JSON) and visual snapshots (SVG).
- **Simplified Import:** Figma now treats imports as native SVG nodes, making the process faster and more reliable.

---

## 📦 1. Installation (The "First Time" Setup)

1. **Download the Kit:**
   ```bash
   git clone git@github.com:coviyarce/gemini-cli-ui-capture.git
   ```
2. **Go to the Folder & Install:**
   ```bash
   cd gemini-cli-ui-capture && npm install
   ```
3. **Create the Storage Folder:**
   Make sure you have a folder named `superscan` inside your main project (e.g., `polaris-ds/superscan`).

---

## 🚀 2. How to Use (Step-by-Step)

### Step A: Start your Web App
Ensure your app is running (e.g., `http://localhost:5173`).

### Step B: Run the "Capture"
```bash
npm run capture
```
*The tool will scan your app and save the SVG blueprints into `polaris-ds/superscan/ui-structure.json`.*

### Step C: Sync with Figma Plugin
```bash
npm run update-plugin
```

---

## 🎨 3. Import into Figma

1. **Open Figma** and load the plugin via **manifest.json**.
2. **Select your Scan File:** Use the file browser to pick the `ui-structure.json` from your `superscan/` folder.
3. **Choose your Screens:** Select the pages you want.
4. **Import:** The plugin will now prioritize the **SVG Snapshot** for maximum fidelity. Done! 🚀

---
*Built with ❤️ by [Luis Covilla (Coviyarce)](https://github.com/coviyarce)*
