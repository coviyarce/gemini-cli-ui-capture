/**
 * Figma Plugin Code Template (SVG Optimization)
 * --------------------------------------------
 */

figma.showUI(__html__, { width: 320, height: 480 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'import') {
    const allData = msg.dataOverride || __CAPTURED_DATA__;
    const selectedIds = msg.ids;
    
    console.log('🚀 Plugin received SVG import request for IDs:', selectedIds);

    const viewportCenter = figma.viewport.center;
    let currentX = viewportCenter.x;

    for (const screenId of selectedIds) {
      const screenData = allData[screenId]; 
      if (!screenData) continue;

      figma.notify(`Importing ${screenData.name || screenId}...`, { timeout: 1000 });

      // 1. Try SVG High-Fidelity Import
      if (screenData.svg) {
        try {
          const svgNode = figma.createNodeFromSvg(screenData.svg);
          svgNode.name = `${screenData.name || screenId} (SVG Snapshot)`;
          svgNode.x = currentX;
          svgNode.y = viewportCenter.y - (svgNode.height / 2);
          
          currentX += svgNode.width + 500;
          continue; // Successfully imported via SVG
        } catch (svgErr) {
          console.error("❌ SVG Import failed, falling back to JSON:", svgErr);
        }
      }

      // 2. Fallback to Legacy JSON Drawing (If SVG fails or is missing)
      const uiData = screenData["1080p"];
      if (uiData && uiData.styles) {
        const mainFrame = figma.createFrame();
        mainFrame.name = `${screenData.name || screenId} (JSON Fallback)`;
        mainFrame.resize(uiData.styles.width, uiData.styles.height);
        mainFrame.x = currentX;
        mainFrame.y = viewportCenter.y - (uiData.styles.height / 2);
        
        // (Legacy recursive drawing logic would go here if needed, 
        // but for now we focus on SVG success)
        
        currentX += uiData.styles.width + 500;
      }
    }
    
    figma.notify("UI Import complete! 🚀");
  }
};
