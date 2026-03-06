// Polaris Sync Plugin - Code.js (FIXED ICONS + SHADOWS)
(async () => {
  const multiResData = __CAPTURED_DATA__;

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
                visible: true, blendMode: 'NORMAL'
            });
        }
    });
    return shadows;
  }

  await figma.loadFontAsync({ family: "Helvetica Neue", style: "Medium" });
  await figma.loadFontAsync({ family: "Helvetica Neue", style: "Regular" });
  
  const viewportCenter = figma.viewport.center;

  async function drawNode(parent, data, offX, offY) {
    const s = data.styles;
    const bgColor = parseColor(s.backgroundColor);
    const textColor = parseColor(s.color);
    
    // 1. ICON LOGIC (REVERTED TO WORKING VERSION)
    if (data.iconType === 'svg' && data.svgContent) {
        try {
            const svgNode = figma.createNodeFromSvg(data.svgContent);
            const scale = Math.min(s.width / svgNode.width, s.height / svgNode.height);
            svgNode.rescale(scale);
            svgNode.x = (s.x - offX) + (s.width - svgNode.width) / 2;
            svgNode.y = (s.y - offY) + (s.height - svgNode.height) / 2;
            
            const iconColor = { r: textColor.r, g: textColor.g, b: textColor.b };
            function applyIconColor(node) {
                if (node.type === "VECTOR" || node.type === "BOOLEAN_OPERATION" || node.type === "LINE" || node.type === "ELLIPSE" || node.type === "RECTANGLE") {
                    node.fills = [{ type: 'SOLID', color: iconColor, opacity: textColor.a }];
                }
                if ("children" in node) node.children.forEach(applyIconColor);
            }
            if ("fills" in svgNode) svgNode.fills = [];
            svgNode.children.forEach(applyIconColor);
            parent.appendChild(svgNode);
            return;
        } catch (e) {}
    }

    const frame = figma.createFrame();
    frame.name = data.tag + (data.text ? `: ${data.text.substring(0,10)}` : "");
    frame.resize(Math.max(0.1, s.width), Math.max(0.1, s.height));
    frame.x = s.x - offX;
    frame.y = s.y - offY;
    
    frame.fills = bgColor.a > 0 ? [{ type: 'SOLID', color: { r: bgColor.r, g: bgColor.g, b: bgColor.b }, opacity: bgColor.a }] : [];
    const radius = parseFloat(s.borderRadius);
    if (radius) frame.cornerRadius = radius;

    // BORDERS & SHADOWS (KEEPING THE PERFECTION)
    const hasBorder = (side) => s[side] && !s[side].includes('0px none');
    if (hasBorder('borderBottom') || hasBorder('borderTop') || hasBorder('borderLeft') || hasBorder('borderRight')) {
        frame.strokes = [{ type: 'SOLID', color: { r: 0.88, g: 0.89, b: 0.9 } }];
        frame.strokeWeight = 1;
        frame.strokeTopWeight = hasBorder('borderTop') ? 1 : 0;
        frame.strokeBottomWeight = hasBorder('borderBottom') ? 1 : 0;
        frame.strokeLeftWeight = hasBorder('borderLeft') ? 1 : 0;
        frame.strokeRightWeight = hasBorder('borderRight') ? 1 : 0;
    }

    const effects = parseShadows(s.boxShadow);
    if (effects.length > 0) frame.effects = effects;

    if (data.text && data.text.length > 0) {
      const textNode = figma.createText();
      const style = parseInt(s.fontWeight) >= 500 ? "Medium" : "Regular";
      textNode.fontName = { family: "Helvetica Neue", style: style };
      textNode.characters = data.text;
      textNode.fontSize = parseFloat(s.fontSize) || 14;
      textNode.fills = [{ type: 'SOLID', color: { r: textColor.r, g: textColor.g, b: textColor.b }, opacity: textColor.a }];
      
      const tW = s.width - (s.paddingLeft || 0) - (s.paddingRight || 0);
      const tH = s.height - (s.paddingTop || 0) - (s.paddingBottom || 0);
      textNode.resize(Math.max(1, tW), Math.max(1, tH));
      textNode.x = s.paddingLeft || 0;
      textNode.y = s.paddingTop || 0;
      textNode.textAlignHorizontal = s.textAlign === 'right' ? "RIGHT" : (s.textAlign === 'center' ? "CENTER" : "LEFT");
      textNode.textAlignVertical = "CENTER";
      frame.appendChild(textNode);
    }

    parent.appendChild(frame);
    if (data.children) {
      for (const child of data.children) {
        await drawNode(frame, child, s.x, s.y);
      }
    }
  }

  const keys = Object.keys(multiResData);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const uiData = multiResData[key];
    const mainFrame = figma.createFrame();
    mainFrame.name = `Polaris Restored - ${key}`;
    mainFrame.resize(uiData.styles.width, uiData.styles.height);
    const spacing = 500;
    mainFrame.x = viewportCenter.x - (uiData.styles.width / 2) + (i * (uiData.styles.width + spacing));
    mainFrame.y = viewportCenter.y - (uiData.styles.height / 2);
    const bg = parseColor(uiData.styles.backgroundColor);
    mainFrame.fills = [{ type: 'SOLID', color: { r: bg.r, g: bg.g, b: bg.b }, opacity: bg.a || 1 }];
    for (const child of uiData.children) {
      await drawNode(mainFrame, child, uiData.styles.x, uiData.styles.y);
    }
  }
  figma.closePlugin("Polaris Sync Restored! 🚀 Icons are fixed, shadows are kept.");
})();
