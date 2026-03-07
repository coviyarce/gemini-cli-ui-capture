# Gemini CLI UI Capture Kit

This kit allows you to capture live web interfaces and convert them into high-fidelity vector layers within Figma. It acts as a universal bridge between your running code and design, enabling seamless synchronization without relying on static screenshots.

## Target Project Requirements

For the kit to work optimally with any project, the following is recommended:

1.  **Storyboard Tab (Highly Recommended):** Create a dedicated route or tab (e.g., `/master-scan`) that renders all components, modals, and states side-by-side in plain sight. This allows the capture tool to scan everything directly without needing to manually interact with floating modals.
2.  **Stable Selectors:** Ensure that important elements have predictable classes or attributes (MUI works perfectly by default).
3.  **Standard Fonts:** The kit prioritizes **Helvetica Neue** with fallbacks to Inter and Roboto.

## Kit Installation

If you want to use this kit independently (outside your main project):

```bash
git clone git@github.com:coviyarce/gemini-cli-ui-capture.git
cd gemini-cli-ui-capture
npm install
```

## Usage & Execution

### 1. Configuration
Edit `capture-config.json` to point to your local server and define the screens:

```json
{
  "baseUrl": "http://localhost:5173",
  "screens": [
    { "category": "Scan", "id": "master", "name": "Full Scan", "tabIndex": 4, "selector": "body" }
  ]
}
```

### 2. UI Capture
Ensure your application is running and execute the capture script:

*   **Full Rescan (Recommended):** Rebuilds the data file from scratch.
    ```bash
    node scripts/capture-to-figma.cjs --rebuild
    ```
*   **Incremental Update:** Only adds new screens defined in the config.
    ```bash
    node scripts/capture-to-figma.cjs
    ```

### 3. Plugin Injection
Synchronize the captured data with the local Figma plugin:
```bash
node scripts/update-plugin.cjs
```

### 4. Figma Import
1.  In Figma, go to `Plugins > Development > Import plugin from manifest...`.
2.  Select the `figma-plugin/manifest.json` file from this folder.
3.  Open the plugin, select the screens, and click **Import Selected**.

## High-Fidelity Features
- **True Vectorization:** These are not images; they are real Figma frames, vectors, and text layers.
- **Form Support:** Captures values of `input`, `select`, and placeholders.
- **Portals & Modals:** Detects elements rendered outside the normal document flow (like MUI Portals).
- **Multiple Resolutions:** Automatic capture in 1080p and 720p.

---
Built by [Coviyarce](https://github.com/coviyarce/gemini-cli-ui-capture)
