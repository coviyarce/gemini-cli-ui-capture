# SuperScan UI Bridge — Gemini CLI Rules (v4.4 Optimized)

This project is a high-fidelity UI-to-Figma bridge. Use these rules to maintain the architectural integrity of the capture and plugin logic.

## 💎 High-Fidelity Logic Rules

- **SVG Rescaling:** ALWAYS use proportional rescaling for SVGs. Never use `resize()` on an SVG node as it causes stretching. Use `rescale()` based on `Math.min(targetWidth / nativeWidth, targetHeight / nativeHeight)`.
- **MUI "Square Fix":** When recoloring SVGs, ONLY apply `fills` or `strokes` to nodes of type `VECTOR` or `BOOLEAN_OPERATION`. Never apply styles to `FRAME` or `GROUP` nodes to avoid creating solid squares from invisible containers.
- **viewBox Priority:** Always prioritize the SVG `viewBox` for defining the natural proportions of an icon. If a `viewBox` is present, use it to set the base `width` and `height` before importing to Figma.
- **Text Alignment:** 
    - Map CSS `start`/`left` to `LEFT`, `center` to `CENTER`, and `end`/`right` to `RIGHT`.
    - Always set `textAlignVertical: "CENTER"` for UI components like buttons and inputs.
- **Noise Filtering:** Ignore any elements with `width < 2px` or `height < 2px` to prevent cluttering the Figma canvas with ripple effects or decorative artifacts.

## 🛠 Development Standards

- **ES5+ Compatibility:** DO NOT use modern JavaScript syntax like Optional Chaining (`?.`) or Nullish Coalescing (`??`) in `figma-plugin/code.template.js`. The Figma environment may not support them without transpilation.
- **Capture Consistency:** Ensure `capture-config.json` is updated with the correct `baseUrl` (typically `http://localhost:5173` for Vite) before running a capture.
- **Sync Workflow:** After any change to `code.template.js` or `ui-structure.json`, always run `npm run update-plugin` to synchronize the final `code.js` used by Figma.

## 🚀 Release Policy

- **Version 4.0+:** All new features must adhere to the **Professional Fidelity Manifest** documented in `README.md`.
- **Pushing Changes:** Only push to `main` after verifying the visual fidelity of the import in Figma.
