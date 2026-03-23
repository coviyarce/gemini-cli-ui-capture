# SuperScan UI Bridge v4.4 🚀 — Professional Fidelity

**High-Fidelity UI-to-Figma bridge for AI-driven development.**

SuperScan v4.4 is a specialized toolkit designed to bridge the gap between local React/MUI development and Figma. It ensures that components from design systems like **Polaris DS** are imported with atomic precision.

---

## 💎 High-Fidelity Logic Manifest (v4.4)

To ensure professional results, the following architectural rules are enforced:

### 1. SVG & Icon Precision
*   **Proportional Rescale:** Icons never stretch. We calculate the minimum scale factor to fit the vector naturally within its CSS container.
*   **Vector-Only Recoloring:** To avoid the "Square Box" bug (common in MUI), color styles are only applied to `VECTOR` and `BOOLEAN_OPERATION` nodes. Invisible interaction containers remain transparent.
*   **viewBox Awareness:** The plugin respects the native `viewBox` of the SVG for initial parsing, ensuring geometric integrity.

### 2. Typography & Layout
*   **Vertical Centering:** All text nodes default to `textAlignVertical: "CENTER"`, matching the behavior of professional UI components (Buttons, Inputs).
*   **Alignment Mapping:** Automatic translation of CSS logical properties (`start`, `end`, `justify`) to Figma's `LEFT`, `RIGHT`, `CENTER`.
*   **Noise Reduction:** Elements smaller than 2px (ripples, shadows, decorative artifacts) are automatically filtered out to keep the Figma layers panel clean.

### 3. Environment Compatibility
*   **ES5+ Safety:** Avoids modern syntax like Optional Chaining (`?.`) to ensure the plugin runs in all Figma environments without transpilation errors.

---

## 🛠 Setup & Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Install the Figma Plugin:**
   - Open Figma.
   - Go to `Plugins` > `Development` > `Import plugin from manifest...`.
   - Select `figma-plugin/manifest.json`.

---

## 🚀 Workflow

1. **Run Capture:**
   ```bash
   npm run capture
   ```
2. **Sync Plugin:**
   ```bash
   npm run update-plugin
   ```
3. **Import in Figma:** Open the SuperScan plugin and click your captured workspace.

---

Built with ❤️ by **Luis Covilla ([Coviyarce](https://github.com/coviyarce))**.
Licensed under the [MIT License](LICENSE).
