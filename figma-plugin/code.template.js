/**
 * Figma Plugin Code Template
 * --------------------------
 * This script runs inside the Figma sandbox. It receives the serialized
 * JSON blueprint from the UI and reconstructs it as native Figma layers.
 */

figma.showUI(__html__, { width: 320, height: 480 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'import') {
    // __CAPTURED_DATA__ is injected by the update-plugin.cjs script
    const allData = msg.dataOverride || __CAPTURED_DATA__;
    const selectedIds = msg.ids;
    
    /** Parses CSS rgba/rgb strings into Figma's color format */
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

    /** Parses complex CSS box-shadows into Figma Drop Shadow effects */
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

    // Pre-load essential fonts to ensure text nodes render without throwing errors
    const fontFamilies = ["Helvetica Neue", "Inter", "Roboto", "Arial"];
    const fontStyles = ["Regular", "Medium", "Bold"];
    async function loadFonts() {
      for (const family of fontFamilies) {
        for (const style of fontStyles) {
          try { await figma.loadFontAsync({ family, style }); } catch (e) { /* Ignore unsupported fonts */ }
        }
      }
    }
    await loadFonts();
    
    const viewportCenter = figma.viewport.center;

    /**
     * Recursive drawing engine. Maps JSON node properties to Figma Node properties.
     */
    async function drawNode(parent, data, offX, offY) {
      try {
        const s = data.styles;
        const bgColor = parseColor(s.backgroundColor);
        const textColor = parseColor(s.color);
        const opacity = parseFloat(s.opacity) || 1;
        
        // Skip invisible nodes completely
        if (opacity < 0.01 || s.display === 'none') return;

        // 1. Text Node Handling (Atomic Precision)
        if (data.tag === 'text-node' && data.text) {
          const textNode = figma.createText();
          const fontWeight = parseInt(s.fontWeight);
          const style = fontWeight >= 700 ? "Bold" : (fontWeight >= 500 ? "Medium" : "Regular");
          
          let fontSet = false;
          for (const family of fontFamilies) {
            try {
              textNode.fontName = { family, style };
              fontSet = true;
              break;
            } catch (e) {}
          }

          if (fontSet) {
            textNode.characters = data.text;
            textNode.fontSize = parseFloat(s.fontSize) || 14;
            textNode.fills = [{ type: 'SOLID', color: { r: textColor.r, g: textColor.g, b: textColor.b }, opacity: textColor.a * opacity }];
            textNode.resize(Math.max(1, s.width), Math.max(1, s.height));
            textNode.x = s.x - offX; 
            textNode.y = s.y - offY;
            textNode.textAlignHorizontal = s.textAlign === 'right' ? "RIGHT" : (s.textAlign === 'center' ? "CENTER" : "LEFT");
            textNode.textAlignVertical = "TOP";
            parent.appendChild(textNode);
          }
          return;
        }

        // 2. SVG Node Handling
        if (data.iconType === 'svg' && data.svgContent) {
            try {
                const svgNode = figma.createNodeFromSvg(data.svgContent);
                const scale = Math.min(s.width / svgNode.width, s.height / svgNode.height);
                svgNode.rescale(scale);
                svgNode.x = (s.x - offX) + (s.width - svgNode.width) / 2;
                svgNode.y = (s.y - offY) + (s.height - svgNode.height) / 2;
                const color = { r: textColor.r, g: textColor.g, b: textColor.b };
                
                // Colorize the SVG vectors
                function applyColor(node) {
                    if (node.type === "VECTOR" || node.type === "BOOLEAN_OPERATION") node.fills = [{ type: 'SOLID', color }];
                    if ("children" in node) node.children.forEach(applyColor);
                }
                svgNode.children.forEach(applyColor);
                parent.appendChild(svgNode);
                return;
            } catch (e) {}
        }

        // 3. Standard Frame Handling
        const frame = figma.createFrame();
        frame.name = data.tag;
        frame.resize(Math.max(0.1, s.width), Math.max(0.1, s.height));
        frame.x = s.x - offX; 
        frame.y = s.y - offY;
        
        // Backgrounds
        if (bgColor.a > 0) {
          frame.fills = [{ type: 'SOLID', color: { r: bgColor.r, g: bgColor.g, b: bgColor.b }, opacity: bgColor.a * opacity }];
        } else {
          frame.fills = [];
        }

        // Border Radius
        const radius = parseFloat(s.borderRadius);
        if (radius) frame.cornerRadius = radius;

        // Strokes (Borders)
        const hasBorder = (side) => s[side] && !s[side].includes('none') && !s[side].startsWith('0px');
        if (hasBorder('borderBottom') || hasBorder('borderTop') || hasBorder('borderLeft') || hasBorder('borderRight')) {
            frame.strokes = [{ type: 'SOLID', color: { r: 0.8, g: 0.8, b: 0.8 } }];
            frame.strokeWeight = 1;
        }

        // Shadows
        const effects = parseShadows(s.boxShadow);
        if (effects.length > 0) frame.effects = effects;

        parent.appendChild(frame);
        
        // Recurse children
        if (data.children) {
          for (const child of data.children) { 
            await drawNode(frame, child, s.x, s.y); 
          }
        }
      } catch (err) {
        console.warn('Failed to draw node:', err);
      }
    }

    // ─── Import Orchestrator ───
    let currentX = viewportCenter.x;
    const requestedResolutions = msg.resolutions || ['1080p'];
    
    for (const screenId of selectedIds) {
      const screenData = allData[screenId]; 
      if (!screenData) continue;

      for (const resKey of requestedResolutions) {
        const uiData = screenData[resKey];
        if (!uiData || !uiData.styles) continue;

        figma.notify(`Importing ${screenData.name || screenId} (${resKey})...`, { timeout: 1000 });

        const mainFrame = figma.createFrame();
        mainFrame.name = `${screenData.name || screenId} (${resKey})`;
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
        // Increment X to prevent overlapping imports
        currentX += uiData.styles.width + 500; 
      }
    }
    
    figma.closePlugin("UI Import complete! 🚀");
  }
};
