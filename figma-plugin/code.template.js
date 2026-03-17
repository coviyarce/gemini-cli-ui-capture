/**
 * Figma Plugin Code Template (Atomic High-Fidelity)
 * -----------------------------------------------
 * This engine maps complex browser styles (Flex, Z-index, shadows) 
 * to native Figma Frame and Vector nodes.
 */

figma.showUI(__html__, { width: 340, height: 500 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'import') {
    const allData = msg.dataOverride || __CAPTURED_DATA__;
    const selectedIds = msg.ids;
    
    console.log('🚀 Plugin received Atomic Import request for IDs:', selectedIds);

    // ── Helper: Parse Colors ──
    function parseColor(cssColor) {
      if (!cssColor || cssColor === 'transparent' || cssColor === 'rgba(0, 0, 0, 0)') return { r: 0, g: 0, b: 0, a: 0 };
      const match = cssColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (!match) return { r: 1, g: 1, b: 1, a: 1 };
      return { 
        r: parseInt(match[1]) / 255, 
        g: parseInt(match[2]) / 255, 
        b: parseInt(match[3]) / 255, 
        a: match[4] ? parseFloat(match[4]) : 1 
      };
    }

    // ── Helper: Parse Shadows ──
    function parseShadows(shadowString) {
      if (!shadowString || shadowString === 'none') return [];
      const shadows = [];
      const parts = shadowString.split(/,(?![^\(]*\))/);
      parts.forEach(sh => {
          const match = sh.match(/(rgba?\(.*?\))\s*(-?\d+px)\s*(-?\d+px)\s*(\d+px)\s*(-?\d+px)?/);
          if (match) {
              const color = parseColor(match[1]);
              shadows.push({
                  type: 'DROP_SHADOW', 
                  color: { r: color.r, g: color.g, b: color.b, a: color.a },
                  offset: { x: parseFloat(match[2]), y: parseFloat(match[3]) },
                  radius: parseFloat(match[4]), 
                  spread: match[5] ? parseFloat(match[5]) : 0,
                  visible: true, 
                  blendMode: 'NORMAL'
              });
          }
      });
      return shadows;
    }

    // ── Helper: Font Loading ──
    const fontFamilies = ["Helvetica Neue", "Inter", "Roboto", "Arial", "sans-serif"];
    async function loadFont(family, weight) {
      const style = weight >= 700 ? "Bold" : (weight >= 500 ? "Medium" : "Regular");
      try {
        await figma.loadFontAsync({ family, style });
        return { family, style };
      } catch (e) {
        try {
          await figma.loadFontAsync({ family: "Inter", style: "Regular" });
          return { family: "Inter", style: "Regular" };
        } catch (e2) { return null; }
      }
    }

    /**
     * Recursive drawing engine. Maps JSON node properties to Figma Node properties.
     */
    async function drawNode(parent, data, offX, offY, depth = 0) {
      if (depth > 50) return;
      try {
        const s = data.styles;
        if (!s) return;

        const opacity = parseFloat(s.opacity) || 1;
        if (opacity < 0.01 || s.display === 'none' || (s.width <= 0 && s.height <= 0)) return;

        // 1. TEXT NODE
        if (data.tag === 'text-node' && data.text && data.text.trim()) {
          const textNode = figma.createText();
          const font = await loadFont(s.fontFamily.split(',')[0].replace(/"/g, ''), parseInt(s.fontWeight));
          if (font) {
            textNode.fontName = font;
            textNode.characters = data.text;
            textNode.fontSize = Math.max(1, parseFloat(s.fontSize) || 14);
            const color = parseColor(s.color);
            textNode.fills = [{ type: 'SOLID', color: { r: color.r, g: color.g, b: color.b }, opacity: color.a * opacity }];
            textNode.resize(Math.max(1, s.width), Math.max(1, s.height));
            textNode.x = s.x - offX; 
            textNode.y = s.y - offY;
            textNode.textAlignHorizontal = s.textAlign === 'right' ? "RIGHT" : (s.textAlign === 'center' ? "CENTER" : "LEFT");
            parent.appendChild(textNode);
          }
          return;
        }

        // 2. SVG / ICON
        if (data.tag === 'svg' && data.svgContent) {
          try {
            const svgNode = figma.createNodeFromSvg(data.svgContent);
            svgNode.x = s.x - offX;
            svgNode.y = s.y - offY;
            // Scale if needed
            const scale = Math.min(s.width / svgNode.width, s.height / svgNode.height);
            if (scale > 0 && scale !== 1) svgNode.rescale(scale);
            parent.appendChild(svgNode);
            return;
          } catch (e) { console.warn("SVG error:", e); }
        }

        // 3. FRAME / CONTAINER
        const frame = figma.createFrame();
        frame.name = data.tag || "div";
        frame.resize(Math.max(0.1, s.width), Math.max(0.1, s.height));
        frame.x = s.x - offX; 
        frame.y = s.y - offY;
        
        const bgColor = parseColor(s.backgroundColor);
        if (bgColor.a > 0) {
          frame.fills = [{ type: 'SOLID', color: { r: bgColor.r, g: bgColor.g, b: bgColor.b }, opacity: bgColor.a * opacity }];
        } else {
          frame.fills = [];
        }

        const radius = parseFloat(s.borderRadius);
        if (radius) frame.cornerRadius = radius;

        // Borders
        const hasBorder = (side) => s[side] && !s[side].includes('none') && !s[side].startsWith('0px');
        if (hasBorder('borderBottom') || hasBorder('borderTop') || hasBorder('borderLeft') || hasBorder('borderRight')) {
          const borderColor = parseColor(s.borderTop.split(' ')[2]); // Simplistic extraction
          frame.strokes = [{ type: 'SOLID', color: { r: borderColor.r, g: borderColor.g, b: borderColor.b } }];
          frame.strokeWeight = parseFloat(s.borderTop.split(' ')[0]) || 1;
        }

        const effects = parseShadows(s.boxShadow);
        if (effects.length > 0) frame.effects = effects;

        parent.appendChild(frame);
        
        if (data.children && data.children.length > 0) {
          for (const child of data.children) { 
            await drawNode(frame, child, s.x, s.y, depth + 1); 
          }
        }
      } catch (err) { /* silent catch */ }
    }

    const viewportCenter = figma.viewport.center;
    let currentX = viewportCenter.x;

    for (const screenId of selectedIds) {
      const screenData = allData[screenId]; 
      if (!screenData) continue;

      const uiData = screenData["1080p"];
      if (!uiData || !uiData.styles) continue;

      figma.notify(`Importing ${screenData.name || screenId}...`, { timeout: 1000 });

      const mainFrame = figma.createFrame();
      mainFrame.name = `${screenData.name || screenId}`;
      mainFrame.resize(uiData.styles.width, uiData.styles.height);
      mainFrame.x = currentX;
      mainFrame.y = viewportCenter.y - (uiData.styles.height / 2);
      
      const bg = parseColor(uiData.styles.backgroundColor);
      mainFrame.fills = [{ type: 'SOLID', color: { r: bg.r, g: bg.g, b: bg.b }, opacity: bg.a || 1 }];
      
      if (uiData.children) {
        for (const child of uiData.children) { 
          await drawNode(mainFrame, child, uiData.styles.x, uiData.styles.y); 
        }
      }
      currentX += uiData.styles.width + 500;
    }
    
    figma.notify("UI Import complete! 🚀");
  }
};
