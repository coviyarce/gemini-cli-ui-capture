/**
 * UI Capture Engine (Atomic Precision & SVG Snapshot)
 * --------------------------------------------------------
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../capture-config.json');
const uiDataPath = path.join(__dirname, '../../polaris-ds/superscan/ui-structure.json');

const wait = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const allScreensResults = {};

  try {
    for (const screen of config.screens) {
      console.log(`🚀 Precision Scanning: ${screen.name}...`);
      
      // Navigate to base
      await page.goto(config.baseUrl, { waitUntil: 'networkidle2' });
      await wait(2000);

      // Perform actions to reach screen
      if (screen.actions) {
        for (const action of screen.actions) {
          if (action.type === 'click') {
            try {
              const xpath = `//span[contains(text(), '${action.text}')] | //div[contains(text(), '${action.text}')] | //p[contains(text(), '${action.text}')] | //a[contains(text(), '${action.text}')]`;
              const elements = await page.$$(`::-p-xpath(${xpath})`);
              
              if (elements.length > 0) {
                await elements[0].click();
                await wait(1500); 
              } else {
                console.warn(`   ⚠️ Warning: Could not find element with text "${action.text}"`);
              }
            } catch (clickErr) {
              console.error(`   ❌ Click Error for "${action.text}":`, clickErr.message);
            }
          } else if (action.type === 'wait') {
            await wait(action.ms);
          }
        }
      }

      await wait(1000);

      // 1. Capture coordinates & metadata (Legacy JSON fallback)
      const screenData = await page.evaluate((sel) => {
        const root = document.querySelector(sel) || document.body;
        
        function serialize(el) {
          const styles = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          if (styles.display === 'none' || styles.visibility === 'hidden') return null;

          const node = {
            tag: el.tagName.toLowerCase(),
            styles: {
              backgroundColor: styles.backgroundColor,
              color: styles.color,
              fontSize: styles.fontSize,
              fontFamily: styles.fontFamily,
              fontWeight: styles.fontWeight,
              borderRadius: styles.borderRadius,
              borderTop: styles.borderTop,
              borderBottom: styles.borderBottom,
              borderLeft: styles.borderLeft,
              borderRight: styles.borderRight,
              boxShadow: styles.boxShadow,
              zIndex: parseInt(styles.zIndex) || 0,
              x: rect.left + window.scrollX,
              y: rect.top + window.scrollY,
              width: rect.width,
              height: rect.height,
              textAlign: styles.textAlign,
              display: styles.display,
              opacity: styles.opacity
            },
            children: []
          };

          if (el.childNodes.length > 0) {
            for (const child of el.childNodes) {
              if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
                node.children.push({ tag: 'text-node', text: child.textContent.trim(), styles: node.styles });
              } else if (child.nodeType === Node.ELEMENT_NODE) {
                const childNode = serialize(child);
                if (childNode) node.children.push(childNode);
              }
            }
          }
          return node;
        }
        return serialize(root);
      }, screen.selector);

      // 2. Capture high-fidelity SVG Snapshot
      // We use a simplified version of dom-to-svg logic
      const svgSnapshot = await page.evaluate(async (sel) => {
        const el = document.querySelector(sel) || document.body;
        const rect = el.getBoundingClientRect();
        
        // Use SVG foreignObject to wrap the HTML
        // Note: This is a robust way to get Figma-compatible SVG from DOM
        const svg = `
          <svg xmlns="http://www.w3.org/2000/svg" width="${rect.width}" height="${rect.height}">
            <foreignObject width="100%" height="100%">
              <div xmlns="http://www.w3.org/1999/xhtml" style="margin:0;padding:0;font-family:sans-serif;">
                ${el.innerHTML}
              </div>
            </foreignObject>
          </svg>
        `;
        return svg;
      }, screen.selector);

      allScreensResults[screen.id] = {
        name: screen.name,
        category: screen.category,
        "1080p": screenData,
        "svg": svgSnapshot
      };
    }
  } catch (err) {
    console.error("❌ Capture Error:", err);
  }

  fs.writeFileSync(uiDataPath, JSON.stringify(allScreensResults, null, 2));
  console.log('✅ Precision Scansion complete (JSON + SVG).');
  await browser.close();
})();
