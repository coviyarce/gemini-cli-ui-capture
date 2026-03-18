/**
 * Figma Plugin Code Template (Precision JSON Rendering + SVG Fallback)
 * ---------------------------------------------------
 */

figma.showUI(__html__, { width: 320, height: 520 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'import') {
    const allData = msg.dataOverride || JSON.parse(`{}`);
    const selectedIds = msg.ids;
    
    console.log('🚀 Plugin received import request for IDs:', selectedIds);

    const viewportCenter = figma.viewport.center;
    let currentX = viewportCenter.x;

    // Helper functions for JSON rendering
    function parseColor(cssColor) {
      if (!cssColor) return { r: 1, g: 1, b: 1, a: 0 };
      const match = cssColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (!match) return { r: 1, g: 1, b: 1, a: 1 };
      return {
        r: parseInt(match[1]) / 255,
        g: parseInt(match[2]) / 255,
        b: parseInt(match[3]) / 255,
        a: match[4] ? parseFloat(match[4]) : 1
      };
    }

    async function loadFonts() {
      await figma.loadFontAsync({ family: "Inter", style: "Regular" });
      await figma.loadFontAsync({ family: "Inter", style: "Medium" });
      await figma.loadFontAsync({ family: "Inter", style: "Bold" });
      await figma.loadFontAsync({ family: "Helvetica Neue", style: "Regular" });
      await figma.loadFontAsync({ family: "Helvetica Neue", style: "Medium" });
      await figma.loadFontAsync({ family: "Helvetica Neue", style: "Bold" });
    }

    function drawNode(parent, data, offX, offY) {
      if (!data || !data.styles) return;
      
      const { r, g, b, a } = parseColor(data.styles.backgroundColor);
      let node;
      
      // Handle Text Nodes
      if (data.tag === 'text-node' || (data.children && data.children.length === 1 && data.children[0].tag === 'text-node')) {
        const textContent = data.tag === 'text-node' ? data.text : data.children[0].text;
        node = figma.createText();
        
        let style = "Regular";
        if (data.styles.fontWeight >= 700) style = "Bold";
        else if (data.styles.fontWeight >= 500) style = "Medium";
        
        node.fontName = { family: "Inter", style: style };
        node.characters = textContent || "";
        node.fontSize = parseFloat(data.styles.fontSize) || 12;
        
        const { r: tr, g: tg, b: tb, a: ta } = parseColor(data.styles.color);
        node.fills = [{ type: 'SOLID', color: { r: tr, g: tg, b: tb }, opacity: ta }];
      } else {
        node = figma.createFrame();
        node.fills = a > 0 ? [{ type: 'SOLID', color: { r, g, b }, opacity: a }] : [];
        const radius = parseFloat(data.styles.borderRadius);
        if (radius) node.cornerRadius = radius;

        if (data.styles.borderBottom && data.styles.borderBottom !== '0px none rgb(0, 0, 0)') {
          const bMatch = data.styles.borderBottom.match(/(\d+)px\s+\w+\s+(.*)/);
          if (bMatch) {
            const bWidth = parseInt(bMatch[1]);
            const { r: br, g: bg, b: bb } = parseColor(bMatch[2]);
            node.strokes = [{ type: 'SOLID', color: { r: br, g: bg, b: bb } }];
            node.strokeWeight = bWidth;
          }
        }
      }
      
      node.name = data.tag || "div";
      node.resize(Math.max(1, data.styles.width), Math.max(1, data.styles.height));
      node.x = data.styles.x - offX;
      node.y = data.styles.y - offY;
      parent.appendChild(node);
      
      if (data.children && node.type === 'FRAME') {
        data.children.forEach(child => {
          if (child.tag !== 'text-node') {
             drawNode(node, child, data.styles.x, data.styles.y);
          }
        });
      }
    }

    await loadFonts();

    for (const screenId of selectedIds) {
      const screenData = allData[screenId]; 
      if (!screenData) continue;

      figma.notify(`Importing ${screenData.name || screenId}...`, { timeout: 1000 });

      // ─── SVG ATTEMPT ───
      let svgImportSuccess = false;
      if (screenData.svg) {
        try {
          const svgNode = figma.createNodeFromSvg(screenData.svg);
          svgNode.name = `${screenData.name || screenId} (SVG Snapshot)`;
          svgNode.x = currentX;
          svgNode.y = viewportCenter.y - (svgNode.height / 2);
          figma.currentPage.appendChild(svgNode);
          svgImportSuccess = true;
          console.log('✅ SVG Snapshot imported successfully');
        } catch (e) {
          console.warn('⚠️ SVG Snapshot failed, falling back to JSON Precision Renderer:', e);
        }
      }

      // ─── JSON FALLBACK (OR PRIMARY IF SVG FAILED) ───
      // We always render the JSON version next to it if it failed, 
      // or if you want both for comparison. For now, we only fallback if SVG fails.
      if (!svgImportSuccess) {
        const uiData = screenData["1080p"];
        if (uiData && uiData.styles) {
          const mainFrame = figma.createFrame();
          mainFrame.name = `${screenData.name || screenId} (Atomic Precision)`;
          mainFrame.resize(uiData.styles.width, uiData.styles.height);
          mainFrame.x = currentX;
          mainFrame.y = viewportCenter.y - (uiData.styles.height / 2);
          
          const bg = parseColor(uiData.styles.backgroundColor);
          mainFrame.fills = [{ type: 'SOLID', color: { r: bg.r, g: bg.g, b: bg.b }, opacity: bg.a }];
          
          if (uiData.children) {
            uiData.children.forEach(child => drawNode(mainFrame, child, uiData.styles.x, uiData.styles.y));
          }
        }
      }
      
      const width = screenData["1080p"] ? screenData["1080p"].styles.width : 1920;
      currentX += width + 500;
    }
    
    figma.notify("UI Import complete! 🚀");
  }
};
