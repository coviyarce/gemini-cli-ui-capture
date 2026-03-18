/**
 * SuperScan Logic Engine v4.2 (High-Fidelity Detail Recovery)
 */

figma.showUI(__html__, { width: 380, height: 560 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'import') {
    const allData = msg.dataOverride || __CAPTURED_DATA__;
    const selectedIds = msg.ids;

    if (!allData) return;

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

    async function loadFont(family, weight) {
      const familyClean = family ? family.split(',')[0].replace(/"/g, '') : "Inter";
      const style = weight >= 700 ? "Bold" : (weight >= 500 ? "Medium" : "Regular");
      try {
        await figma.loadFontAsync({ family: familyClean, style });
        return { family: familyClean, style };
      } catch (e) {
        try {
          await figma.loadFontAsync({ family: "Inter", style: "Regular" });
          return { family: "Inter", style: "Regular" };
        } catch (e2) { return null; }
      }
    }

    async function drawNode(parent, data, offX, offY, depth = 0) {
      if (depth > 150) return;
      try {
        const s = data.styles;
        if (!s || s.display === 'none' || s.opacity === '0') return;

        // --- 1. TEXT NODE ---
        if (data.tag === 'text-node') {
          const textNode = figma.createText();
          const font = await loadFont(s.fontFamily, parseInt(s.fontWeight));
          if (font) {
            textNode.fontName = font;
            textNode.characters = data.text || "";
            textNode.fontSize = Math.max(1, parseFloat(s.fontSize) || 12);
            const color = parseColor(s.color);
            textNode.fills = [{ type: 'SOLID', color: { r: color.r, g: color.g, b: color.b }, opacity: color.a }];
            
            textNode.x = s.x - offX; 
            textNode.y = s.y - offY;
            textNode.resize(Math.max(1, s.width), Math.max(1, s.height));
            parent.appendChild(textNode);
          }
          return;
        }

        // --- 2. SVG (Icons) ---
        if (data.tag === 'svg' && data.svgContent) {
          try {
            const svgNode = figma.createNodeFromSvg(data.svgContent);
            svgNode.x = s.x - offX;
            svgNode.y = s.y - offY;
            const scale = Math.min(s.width / svgNode.width, s.height / svgNode.height);
            if (scale > 0 && scale < 10) svgNode.rescale(scale);
            parent.appendChild(svgNode);
            return;
          } catch (e) {}
        }

        // --- 3. FRAME / DIV ---
        const frame = figma.createFrame();
        frame.name = data.tag || "div";
        frame.resize(Math.max(0.1, s.width), Math.max(0.1, s.height));
        frame.x = s.x - offX; 
        frame.y = s.y - offY;
        frame.clipsContent = false;

        const bgColor = parseColor(s.backgroundColor);
        if (bgColor.a > 0) {
          frame.fills = [{ type: 'SOLID', color: { r: bgColor.r, g: bgColor.g, b: bgColor.b }, opacity: bgColor.a }];
        } else {
          frame.fills = [];
        }

        // --- BORDERS & LINES (Detail Recovery) ---
        const drawBorder = (side, value) => {
          if (!value || value.includes('none') || value.startsWith('0px')) return;
          const match = value.match(/(\d+\.?\d*)px\s+\w+\s+(.*)/);
          if (!match) return;
          
          const weight = parseFloat(match[1]);
          const color = parseColor(match[2]);
          
          const line = figma.createLine();
          line.strokes = [{ type: 'SOLID', color: { r: color.r, g: color.g, b: color.b }, opacity: color.a }];
          line.strokeWeight = weight;
          
          if (side === 'top') {
            line.resize(s.width, 0);
            line.x = 0; line.y = 0;
          } else if (side === 'bottom') {
            line.resize(s.width, 0);
            line.x = 0; line.y = s.height;
          } else if (side === 'left') {
            line.rotation = 90;
            line.resize(s.height, 0);
            line.x = 0; line.y = 0;
          } else if (side === 'right') {
            line.rotation = 90;
            line.resize(s.height, 0);
            line.x = s.width; line.y = 0;
          }
          frame.appendChild(line);
        };

        drawBorder('top', s.borderTop);
        drawBorder('bottom', s.borderBottom);
        drawBorder('left', s.borderLeft);
        drawBorder('right', s.borderRight);

        if (s.borderRadius && s.borderRadius !== '0px') {
          const radius = parseFloat(s.borderRadius);
          if (radius) frame.cornerRadius = radius;
        }

        // Shadows
        if (s.boxShadow && s.boxShadow !== 'none') {
          // Simple shadow parsing can be complex, skipping for stability but noted
        }

        parent.appendChild(frame);
        
        if (data.children && data.children.length > 0) {
          for (const child of data.children) { 
            await drawNode(frame, child, s.x, s.y, depth + 1); 
          }
        }
      } catch (err) {}
    }

    const viewportCenter = figma.viewport.center;
    let currentX = viewportCenter.x;

    for (const screenId of selectedIds) {
      const screenData = allData[screenId]; 
      if (!screenData || !screenData["1080p"]) continue;

      figma.notify(`🚀 Precision Import: ${screenData.name || screenId}...`);

      const uiData = screenData["1080p"];
      const mainFrame = figma.createFrame();
      mainFrame.name = `${screenData.name || screenId} (Atomic v4.2)`;
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
    
    figma.notify("✅ Atomic Import complete!");
  }
};
