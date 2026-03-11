# SuperScan UI Sync Kit (v3.1 - RSC) 🚀

This repository is a powerful, high-precision engine that "captures" your web application (React, HTML, Vue, etc.) and converts it into perfectly editable **Vector Designs** directly inside Figma.

Think of it as a "Super Screenshot" that instead of a flat image, gives you the actual buttons, texts, and icons as real Figma layers.

---

## 🌟 What's New in v3.1 - RSC?

- **SuperScan Folder:** All your scan results are now neatly organized in your project's `polaris-ds/superscan` folder.
- **Figma File Browser:** You can now manually "Browse" and select your scan files directly from the Figma plugin.
- **Atomic Precision:** Text and icons are placed exactly where they appear in the browser, with 0% overlap.
- **Simplified for Everyone:** Designed so that anyone, even if they only know how to open an email, can follow the steps below.

---

## 📦 1. Installation (The "First Time" Setup)

If you are a new user, follow these simple steps:

1. **Download the Kit:**
   Open your terminal (or command prompt) and type:
   ```bash
   git clone git@github.com:coviyarce/gemini-cli-ui-capture.git
   ```
2. **Go to the Folder:**
   ```bash
   cd gemini-cli-ui-capture
   ```
3. **Install the Tools:**
   ```bash
   npm install
   ```
4. **Create the Storage Folder:**
   Make sure you have a folder named `superscan` inside your main project (e.g., `polaris-ds/superscan`). The tool will save everything there.

---

## 🚀 2. How to Use (Step-by-Step)

### Step A: Start your Web App
Make sure the website or application you want to capture is running on your computer (usually at `http://localhost:5173` or `http://localhost:3000`).

### Step B: Run the "Capture"
In your terminal, inside the `gemini-cli-ui-capture` folder, run this command:
```bash
node scripts/capture-to-figma.cjs --rebuild
```
*Wait a few seconds... The tool will "scan" your app and save a file called `ui-structure.json` in your `polaris-ds/superscan` folder.*

### Step C: Update the Plugin
Run this second command to tell the plugin that there is new data:
```bash
node scripts/update-plugin.cjs
```

---

## 🎨 3. Import into Figma (The Fun Part)

1. **Open Figma** on your computer.
2. Go to the menu: **Plugins > Development > Import plugin from manifest...**
3. Select the file `manifest.json` located inside `gemini-cli-ui-capture/figma-plugin`.
4. **Run the Plugin:** You will see a window called **SuperScan UI Sync Kit**.
5. **Select your Scan File:**
   - Click on **"Click to select ui-structure.json"**.
   - Navigate to your project folder: `polaris-ds/superscan/`.
   - Select the `ui-structure.json` file.
6. **Choose your Screens:** Tick the boxes of the pages you want to bring into Figma.
7. Click **Import Selected**. Done! 🚀

---

## 🤖 For Developers & AI Users

This kit is the perfect bridge for those using **Claude, Cursor, or Gemini CLI**. 

1. Ask the AI to build a component.
2. Run this kit to "scan" the AI's result.
3. Import it into Figma to verify if the spacing, colors, and layout match your design requirements exactly.

### 🔌 Figma MCP (Advanced)
If you want the AI to "see" your Figma designs directly, you can connect the **Figma MCP Server**.

**Setup:**
1. Generate a **Personal Access Token** in your Figma account settings.
2. Add this to your AI tool's configuration (Claude Desktop, Gemini CLI, etc.):

```json
{
  "mcpServers": {
    "figma": {
      "command": "npx",
      "args": ["-y", "@figma/mcp"],
      "env": {
        "FIGMA_ACCESS_TOKEN": "YOUR_TOKEN_HERE"
      }
    }
  }
}
```

---
*Built with ❤️ by [Luis Covilla (Coviyarce)](https://github.com/coviyarce)*
