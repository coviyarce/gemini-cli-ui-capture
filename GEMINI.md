# 💎 SuperScan Engineering Manifesto (v4.5 - Deep Scan)

Este manifiesto es la fuente de verdad absoluta para el mantenimiento del puente UI-to-Figma. Cualquier IA o desarrollador debe validar su código contra estas reglas.

---

## 🚀 Reglas de Oro de Fidelidad Visual

### 1. El Motor SVG (Zero-Square Policy)
*   **Filtro de Nodos:** El coloreado recursivo **NUNCA** debe aplicarse a `FRAME` o `GROUP`. Solo a `VECTOR`, `BOOLEAN_OPERATION`, `STAR`, `LINE`, `ELLIPSE`, `RECTANGLE`.
*   **Preservación de Transparencia:** Solo aplicar `fills` o `strokes` si el nodo ya tiene una propiedad de relleno/trazo definida. No forzar colores en áreas vacías.
*   **viewBox-First Parsing:** El `viewBox` manda. Si un SVG tiene `viewBox`, el `width` y `height` iniciales de la cadena XML deben coincidir con él para evitar distorsiones de coordenadas en el parser de Figma.

### 2. Proporción y Centrado (MUI Optimized)
*   **Escalado Proporcional:** Prohibido el uso de `resize()` en SVGs. Usar `rescale(Math.min(scaleX, scaleY))`.
*   **Centrado Matemático:** Los iconos deben centrarse en su caja de CSS usando: `(containerSize - nodeSize) / 2`.
*   **Noise Filtering:** Ignorar elementos menores a 2px. Son "basura visual" generada por efectos de ripple o sombras de MUI.

### 3. Tipografía y Alineación
*   **Verticality:** Forzar `textAlignVertical: "CENTER"` en todos los textos de botones e inputs.
*   **Logical Mapping:** Mapear `start`➔`LEFT`, `end`➔`RIGHT`.
*   **Font Fallback:** Priorizar "Helvetica Neue" para Polaris DS, con fallback a "Inter".

---

## 🎬 Reglas de Storyboard (Deep Scan)
*   **Horizontal Gap (150px):** Espaciado entre pasos (`steps`) de un mismo flujo.
*   **Vertical Gap (300px):** Espaciado entre diferentes flujos (`flows`).
*   **Context Persistence:** El navegador no debe reiniciarse entre pasos para mantener estados de modales o formularios abiertos.

---

## 🛠 Estándares de Código
*   **ES5 Compatibility:** Prohibido el uso de `?.` (Optional Chaining) o `??` (Nullish Coalescing) dentro de `code.template.js`.
*   **Auto-Validation:** Antes de cada release, se deben correr los tests unitarios de `ui-capture/test`.
