# SuperScan UI Bridge v4.0 🚀

**High-Fidelity UI-to-Figma bridge for AI-driven development.**

SuperScan is a toolkit designed to bridge the gap between local AI development environments and Figma. It allows you to capture live React/Web components from your local server and import them directly into Figma as precise, editable layers.

Built for engineers using **Gemini-CLI**, **Claude**, **Cursor**, or any local LLM workflow.

---

## 🌟 Why SuperScan?

- **Figma Make Continuity:** If you run out of AI tokens in Figma, continue your work locally and sync back to the canvas.
- **CLI Agnostic:** Works with any AI that can modify your local code.
- **High Fidelity:** Captures sub-pixel positioning, borders, SVGs, and typography with atomic precision.
- **No Cost:** Avoid expensive subscriptions for design-to-code syncing.

---

## 🛠 Setup & Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/coviyarce/superscan-ui-sync.git
   cd superscan-ui-sync
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Install the Figma Plugin:**
   - Open Figma.
   - Go to `Plugins` > `Development` > `Import plugin from manifest...`.
   - Select `figma-plugin/manifest.json` from this project.

---

## 🚀 Workflow with Gemini-CLI (MCP)

This project is optimized for a **design-to-code-to-design** loop using Gemini-CLI and the Figma MCP.

1. **Modify Code:** Use Gemini-CLI to build or update your components locally.
2. **Configure Capture:** Update `capture-config.json` with your local server URL and the screens you want to sync.
   ```json
   {
     "baseUrl": "http://localhost:5173",
     "screens": [{ "id": "my-comp", "name": "My Component", "selector": "#root" }]
   }
   ```
3. **Capture & Sync:**
   ```bash
   npm run sync
   ```
4. **Import in Figma:** Open the SuperScan plugin in Figma and click the pre-loaded workspace data.

---

## 🤖 Usage with Other CLIs / Manual Flow

If you are using Claude Pro, Cursor, or other tools:

1. **Generate UI Structure:** Run `npm run capture` to generate the `assets/ui-structure.json` file.
2. **Manual Load:** 
   - Open the SuperScan plugin in Figma.
   - Drag and drop your `ui-structure.json` file into the plugin's upload zone.
3. **Select & Import:** Choose the sections you want to bring to the canvas.

---

## 📐 Configuration (`capture-config.json`)

| Field | Description |
| :--- | :--- |
| `baseUrl` | The URL of your local development server (e.g., Vite, Webpack). |
| `screens` | Array of objects defining what to capture. |
| `screens.actions` | Optional: steps to take (click, wait) before capturing (e.g., opening a modal). |
| `selector` | The CSS selector of the element to capture (defaults to `body`). |

---

## 📄 License & Credits

Built with ❤️ by **Luis Covilla ([Coviyarce](https://github.com/coviyarce))**.

Licensed under the [MIT License](LICENSE).
