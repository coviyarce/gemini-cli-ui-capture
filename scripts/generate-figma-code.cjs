const fs = require('fs');
const ui = JSON.parse(fs.readFileSync('ui-structure.json', 'utf8'));

function parseColor(cssColor) {
  const match = cssColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!match) return { r: 1, g: 1, b: 1, a: 1 };
  return {
    r: parseInt(match[1]) / 255,
    g: parseInt(match[2]) / 255,
    b: parseInt(match[3]) / 255,
    a: match[4] ? parseFloat(match[4]) : 1
  };
}

let figmaCode = `
(async () => {
  // Load font first
  await figma.loadFontAsync({ family: "Helvetica Neue", style: "Medium" });
  await figma.loadFontAsync({ family: "Helvetica Neue", style: "Regular" });
  
  const mainFrame = figma.createFrame();
  mainFrame.name = "Workflows Capture (Polaris DS)";
  mainFrame.resize(${ui.styles.width}, ${ui.styles.height});
  mainFrame.x = 0;
  mainFrame.y = 0;
  
  function createNode(parent, data, offsetX, offsetY) {
    const { r, g, b, a } = parseColor(data.styles.backgroundColor);
    let node;
    
    if (data.text && data.text.trim().length > 0) {
      node = figma.createText();
      node.characters = data.text.trim();
      node.fontSize = parseFloat(data.styles.fontSize);
      const fontStyle = data.styles.fontWeight >= 500 ? "Medium" : "Regular";
      node.fontName = { family: "Helvetica Neue", style: fontStyle };
      const { r: tr, g: tg, b: tb } = parseColor(data.styles.color);
      node.fills = [{ type: 'SOLID', color: { r: tr, g: tg, b: tb } }];
    } else {
      node = figma.createFrame();
      node.fills = a > 0 ? [{ type: 'SOLID', color: { r, g, b }, opacity: a }] : [];
      const radius = parseFloat(data.styles.borderRadius);
      if (radius) node.cornerRadius = radius;
    }
    
    node.name = data.tag;
    node.resize(Math.max(1, data.styles.width), Math.max(1, data.styles.height));
    node.x = data.styles.x - offsetX;
    node.y = data.styles.y - offsetY;
    
    parent.appendChild(node);
    
    if (data.children && node.type === 'FRAME') {
      for (const child of data.children) {
        createNode(node, child, data.styles.x, data.styles.y);
      }
    }
  }

  // Draw background if needed
  const { r, g, b, a } = parseColor(ui.styles.backgroundColor);
  mainFrame.fills = [{ type: 'SOLID', color: { r, g, b }, opacity: a }];

  for (const child of ui.children) {
    createNode(mainFrame, child, ui.styles.x, ui.styles.y);
  }
  
  figma.viewport.scrollAndZoomIntoView([mainFrame]);
  console.log("UI Capture to Figma finished!");
})();
`.replace(/parseColor\(data.styles.backgroundColor\)/g, (match, data) => {
    // This is just a placeholder for the logic that will run in the console
    return "/* Color parsed from CSS */"; 
});

// Refined generator to embed the data directly
const finalScript = `
(async () => {
  const uiData = ${JSON.stringify(ui)};
  
  function parseColor(cssColor) {
    const match = cssColor.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)(?:,\\s*([\\d.]+))?\\)/);
    if (!match) return { r: 1, g: 1, b: 1, a: 1 };
    return {
      r: parseInt(match[1]) / 255,
      g: parseInt(match[2]) / 255,
      b: parseInt(match[3]) / 255,
      a: match[4] ? parseFloat(match[4]) : 1
    };
  }

  await figma.loadFontAsync({ family: "Helvetica Neue", style: "Medium" });
  await figma.loadFontAsync({ family: "Helvetica Neue", style: "Regular" });
  
  const mainFrame = figma.createFrame();
  mainFrame.name = "Workflows Capture (" + new Date().toLocaleTimeString() + ")";
  mainFrame.resize(uiData.styles.width, uiData.styles.height);
  
  function draw(parent, data, offX, offY) {
    const { r, g, b, a } = parseColor(data.styles.backgroundColor);
    let node;
    
    if (data.text && data.text.trim().length > 0) {
      node = figma.createText();
      node.fontName = { family: "Helvetica Neue", style: data.styles.fontWeight >= 500 ? "Medium" : "Regular" };
      node.characters = data.text.trim();
      node.fontSize = parseFloat(data.styles.fontSize) || 12;
      const { r: tr, g: tg, b: tb } = parseColor(data.styles.color);
      node.fills = [{ type: 'SOLID', color: { r: tr, g: tg, b: tb } }];
    } else {
      node = figma.createFrame();
      node.fills = a > 0 ? [{ type: 'SOLID', color: { r, g, b }, opacity: a }] : [];
      const radius = parseFloat(data.styles.borderRadius);
      if (radius) node.cornerRadius = radius;
    }
    
    node.resize(Math.max(1, data.styles.width), Math.max(1, data.styles.height));
    node.x = data.styles.x - offX;
    node.y = data.styles.y - offY;
    parent.appendChild(node);
    
    if (data.children && node.type === 'FRAME') {
      data.children.forEach(c => draw(node, c, data.styles.x, data.styles.y));
    }
  }

  const bg = parseColor(uiData.styles.backgroundColor);
  mainFrame.fills = [{ type: 'SOLID', color: { r: bg.r, g: bg.g, b: bg.b }, opacity: bg.a }];
  
  uiData.children.forEach(c => draw(mainFrame, c, uiData.styles.x, uiData.styles.y));
  figma.viewport.scrollAndZoomIntoView([mainFrame]);
})();
`;

fs.writeFileSync('figma-console-script.js', finalScript);
console.log('Script generated! Copy the contents of figma-console-script.js and paste it into the Figma Console.');
