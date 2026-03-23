/**
 * SuperScan Logic Engine v4.5 (Deep-Scan & Storyboard Mode)
 */

figma.showUI(__html__, { width: 380, height: 620 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'import') {
    const allData = msg.dataOverride || __CAPTURED_DATA__;
    const selectedFlowIds = msg.ids;
    if (!allData || !allData.flows) return;

    const settings = allData.settings || { horizontalGap: 150, verticalGap: 300 };

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
      const familyClean = family && family.includes('Helvetica') ? "Helvetica Neue" : "Inter";
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
      if (depth > 200 || !data) return;
      try {
        const s = data.styles;
        if (!s || s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') return;

        // --- 1. TEXT NODE ---
        if (data.tag === 'text-node') {
          if (!data.text || !data.text.trim()) return;
          const textNode = figma.createText();
          const font = await loadFont(s.fontFamily, parseInt(s.fontWeight));
          if (font) {
            textNode.fontName = font;
            textNode.characters = data.text.trim();
            textNode.fontSize = Math.max(1, parseFloat(s.fontSize) || 12);
            textNode.lineHeight = s.lineHeight !== 'normal' ? { value: parseFloat(s.lineHeight), unit: 'PIXELS' } : { unit: 'AUTO' };
            const color = parseColor(s.color);
            textNode.fills = [{ type: 'SOLID', color: { r: color.r, g: color.g, b: color.b }, opacity: color.a }];
            textNode.x = s.x - offX; 
            textNode.y = s.y - offY;
            textNode.resize(Math.max(1, s.width), Math.max(1, s.height));
            const alignMap = { "start": "LEFT", "left": "LEFT", "center": "CENTER", "end": "RIGHT", "right": "RIGHT", "justify": "JUSTIFIED" };
            const alignValue = alignMap[s.textAlign ? s.textAlign.toLowerCase() : "left"] || "LEFT";
            try { textNode.textAlignHorizontal = alignValue; textNode.textAlignVertical = "CENTER"; } catch(e) {}
            parent.appendChild(textNode);
          }
          return;
        }

        // --- 2. SVG (Icons) ---
        if (data.tag === 'svg' && data.svgContent) {
          try {
            const rawSvg = data.svgContent;
            const vbMatch = rawSvg.match(/viewBox=["'](\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)\s+(\d+\.?\d*)["']/);
            const vb = vbMatch ? { w: parseFloat(vbMatch[3]), h: parseFloat(vbMatch[4]) } : { w: s.width, h: s.height };
            const svgBody = rawSvg.replace(/<svg[^>]*>/, "").replace(/<\/svg>/, "");
            const cleanSvg = `<?xml version="1.0" encoding="utf-8"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="${vbMatch ? vbMatch[1]+' '+vbMatch[2]+' '+vbMatch[3]+' '+vbMatch[4] : '0 0 '+s.width+' '+s.height}" width="${vb.w}" height="${vb.h}">${svgBody}</svg>`;
            const svgNode = figma.createNodeFromSvg(cleanSvg);
            const scale = Math.min(s.width / svgNode.width, s.height / svgNode.height);
            if (scale > 0 && isFinite(scale)) svgNode.rescale(scale);
            svgNode.x = (s.x - offX) + (s.width - svgNode.width) / 2;
            svgNode.y = (s.y - offY) + (s.height - svgNode.height) / 2;
            const iconColor = parseColor(s.color);
            const recolor = (n) => {
              if (n.type === 'VECTOR' || n.type === 'BOOLEAN_OPERATION') {
                if (n.fills && n.fills.length > 0) n.fills = [{ type: 'SOLID', color: { r: iconColor.r, g: iconColor.g, b: iconColor.b }, opacity: iconColor.a }];
                if (n.strokes && n.strokes.length > 0) n.strokes = [{ type: 'SOLID', color: { r: iconColor.r, g: iconColor.g, b: iconColor.b }, opacity: iconColor.a }];
              }
              if ("children" in n) n.children.forEach(recolor);
            };
            recolor(svgNode);
            parent.appendChild(svgNode);
            return;
          } catch (e) { return; }
        }

        // --- 3. FRAME / DIV ---
        if (s.width < 2 || s.height < 2) return;
        const frame = figma.createFrame();
        frame.name = data.tag || "div";
        frame.resize(Math.max(0.1, s.width), Math.max(0.1, s.height));
        frame.x = s.x - offX; 
        frame.y = s.y - offY;
        frame.clipsContent = false;
        const bgColor = parseColor(s.backgroundColor);
        if (bgColor.a > 0) frame.fills = [{ type: 'SOLID', color: { r: bgColor.r, g: bgColor.g, b: bgColor.b }, opacity: bgColor.a }];
        else frame.fills = [];
        const parseBorder = (val) => {
          if (!val || val.includes('none') || val.startsWith('0px')) return { w: 0, c: { r: 0, g: 0, b: 0, a: 0 } };
          const m = val.match(/(\d+\.?\d*)px\s+\w+\s+(.*)/);
          return m ? { w: parseFloat(m[1]), c: parseColor(m[2]) } : { w: 0, c: { r: 0, g: 0, b: 0, a: 0 } };
        };
        const bt = parseBorder(s.borderTop); const bb = parseBorder(s.borderBottom);
        const bl = parseBorder(s.borderLeft); const br = parseBorder(s.borderRight);
        const dominant = [bt, bb, bl, br].find(b => b.w > 0) || { w: 0, c: { r: 0, g: 0, b: 0, a: 0 } };
        if (dominant.w > 0) {
          frame.strokes = [{ type: 'SOLID', color: { r: dominant.c.r, g: dominant.c.g, b: dominant.c.b }, opacity: dominant.c.a }];
          frame.strokeWeight = dominant.w;
          frame.strokeTopWeight = bt.w; frame.strokeBottomWeight = bb.w;
          frame.strokeLeftWeight = bl.w; frame.strokeRightWeight = br.w;
          frame.strokeAlign = "INSIDE";
        }
        if (s.borderRadius && s.borderRadius !== '0px') frame.cornerRadius = parseFloat(s.borderRadius) || 0;
        parent.appendChild(frame);
        if (data.children) { for (const child of data.children) await drawNode(frame, child, s.x, s.y, depth + 1); }
      } catch (err) {}
    }

    const viewportCenter = figma.viewport.center;
    let currentY = viewportCenter.y;

    for (const flowId of selectedFlowIds) {
      const flow = allData.flows[flowId]; 
      if (!flow || !flow.steps) continue;

      figma.notify(`🎬 Deep-Scan Storyboard: ${flow.name}...`);
      
      let currentX = viewportCenter.x;
      let maxHeightInRow = 0;

      for (const stepId in flow.steps) {
        const step = flow.steps[stepId];
        const uiData = step.data;
        if (!uiData) continue;

        const mainFrame = figma.createFrame();
        mainFrame.name = `${flow.name} / ${step.name}`;
        mainFrame.resize(uiData.styles.width, uiData.styles.height);
        mainFrame.x = currentX;
        mainFrame.y = currentY;
        
        const bg = parseColor(uiData.styles.backgroundColor);
        mainFrame.fills = [{ type: 'SOLID', color: { r: bg.r, g: bg.g, b: bg.b }, opacity: bg.a || 1 }];
        
        if (uiData.children) {
          for (const child of uiData.children) { 
            await drawNode(mainFrame, child, uiData.styles.x, uiData.styles.y); 
          }
        }

        // Update coordinates for Storyboard (Horizontal)
        currentX += uiData.styles.width + settings.horizontalGap;
        maxHeightInRow = Math.max(maxHeightInRow, uiData.styles.height);
      }

      // Update coordinates for next Flow (Vertical)
      currentY += maxHeightInRow + settings.verticalGap;
    }
    
    figma.notify("✅ Storyboard ready!");
  }
};
