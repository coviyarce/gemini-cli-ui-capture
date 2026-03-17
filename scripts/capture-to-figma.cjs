/**
 * UI Capture Engine (Atomic Precision & Icon Extraction)
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
      console.log(`🚀 Atomic Scan: ${screen.name}...`);
      
      await page.goto(config.baseUrl, { waitUntil: 'networkidle2' });
      await wait(1500);

      if (screen.actions) {
        for (const action of screen.actions) {
          if (action.type === 'click') {
            try {
              const xpath = `//span[contains(text(), '${action.text}')] | //div[contains(text(), '${action.text}')] | //p[contains(text(), '${action.text}')] | //a[contains(text(), '${action.text}')]`;
              const elements = await page.$$(`::-p-xpath(${xpath})`);
              if (elements.length > 0) {
                await elements[0].click();
                await wait(1000); 
              }
            } catch (e) {}
          } else if (action.type === 'wait') {
            await wait(action.ms);
          }
        }
      }

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

          // Special handling for SVGs (Icons)
          if (node.tag === 'svg') {
            node.svgContent = el.outerHTML;
            return node; // Don't serialize children of SVGs
          }

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

      allScreensResults[screen.id] = {
        name: screen.name,
        category: screen.category,
        "1080p": screenData
      };
    }
  } catch (err) {
    console.error("❌ Capture Error:", err);
  }

  fs.writeFileSync(uiDataPath, JSON.stringify(allScreensResults, null, 2));
  console.log('✅ Atomic Scansion complete.');
  await browser.close();
})();
