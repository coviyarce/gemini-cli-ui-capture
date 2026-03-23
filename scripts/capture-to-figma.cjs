const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const configPath = path.join(rootDir, 'capture-config.json');
const uiDataPath = path.join(rootDir, 'assets/ui-structure.json');

const wait = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  if (!fs.existsSync(path.dirname(uiDataPath))) fs.mkdirSync(path.dirname(uiDataPath), { recursive: true });
  
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  console.log(`📡 Starting Deep-Scan UI Bridge v4.5 on ${config.baseUrl}...`);

  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  const allFlowsResults = {};

  try {
    // Process each flow as a separate "storyboard row"
    for (const flow of config.flows) {
      console.log(`   🚀 Deep-Scanning Flow: ${flow.name}...`);
      await page.goto(config.baseUrl, { waitUntil: 'networkidle2' });
      await wait(1500);

      allFlowsResults[flow.id] = { 
        name: flow.name, 
        category: flow.category, 
        steps: {} 
      };

      for (const step of flow.steps) {
        console.log(`      📸 Capturing Step: ${step.name}...`);
        
        // Execute actions for this step BEFORE capturing
        if (step.actions && step.actions.length > 0) {
          for (const action of step.actions) {
            if (action.type === 'click') {
              try {
                const xpath = `//span[contains(text(), '${action.text}')] | //div[contains(text(), '${action.text}')] | //button[contains(text(), '${action.text}')] | //a[contains(text(), '${action.text}')]`;
                const elements = await page.$$(`::-p-xpath(${xpath})`);
                if (elements.length > 0) {
                  await elements[0].click();
                  await wait(1000); 
                }
              } catch (e) { console.warn(`      ⚠️ Click failed for text: ${action.text}`); }
            } else if (action.type === 'type') {
              try {
                const selector = action.selector || 'input';
                await page.type(selector, action.value);
                await wait(500);
              } catch (e) { console.warn(`      ⚠️ Type failed for selector: ${action.selector}`); }
            } else if (action.type === 'wait') {
              await wait(action.ms);
            }
          }
        }

        // Capture current state of the page
        const screenData = await page.evaluate((sel) => {
          const root = document.querySelector(sel) || document.body;
          
          function serialize(el) {
            const styles = window.getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            if (styles.display === 'none' || styles.visibility === 'hidden' || styles.opacity === '0') return null;

            const node = {
              tag: el.tagName.toLowerCase(),
              styles: {
                backgroundColor: styles.backgroundColor,
                color: styles.color,
                fontSize: styles.fontSize,
                fontFamily: styles.fontFamily,
                fontWeight: styles.fontWeight,
                lineHeight: styles.lineHeight,
                borderRadius: styles.borderRadius,
                borderTop: styles.borderTop,
                borderBottom: styles.borderBottom,
                borderLeft: styles.borderLeft,
                borderRight: styles.borderRight,
                borderWidth: styles.borderWidth,
                borderStyle: styles.borderStyle,
                borderColor: styles.borderColor,
                paddingTop: styles.paddingTop,
                paddingBottom: styles.paddingBottom,
                paddingLeft: styles.paddingLeft,
                paddingRight: styles.paddingRight,
                boxShadow: styles.boxShadow,
                x: rect.left + window.scrollX,
                y: rect.top + window.scrollY,
                width: rect.width,
                height: rect.height,
                display: styles.display,
                flexDirection: styles.flexDirection,
                alignItems: styles.alignItems,
                justifyContent: styles.justifyContent,
                textAlign: styles.textAlign,
                color: styles.color,
                opacity: styles.opacity,
                zIndex: styles.zIndex === 'auto' ? 0 : parseInt(styles.zIndex)
              },
              children: []
            };

            if (node.tag === 'svg') {
              node.svgContent = el.outerHTML;
              return node;
            }

            for (const child of el.childNodes) {
              if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
                const range = document.createRange();
                range.selectNodeContents(child);
                const textRect = range.getBoundingClientRect();
                if (textRect.width > 0) {
                  node.children.push({
                    tag: 'text-node',
                    text: child.textContent.trim(),
                    styles: { ...node.styles, x: textRect.left + window.scrollX, y: textRect.top + window.scrollY, width: textRect.width, height: textRect.height }
                  });
                }
              } else if (child.nodeType === Node.ELEMENT_NODE) {
                const childNode = serialize(child);
                if (childNode) node.children.push(childNode);
              }
            }
            return node;
          }
          return serialize(root);
        }, step.selector);

        allFlowsResults[flow.id].steps[step.id] = { name: step.name, data: screenData };
      }
    }
  } catch (err) {
    console.error("❌ Deep-Scan Error:", err);
  }

  // Save the multi-step structure
  fs.writeFileSync(uiDataPath, JSON.stringify({ 
    version: "4.5-deep", 
    settings: config.settings,
    flows: allFlowsResults 
  }, null, 2));
  
  console.log('✅ Deep-Scan Snapshot successfully stored in assets/ui-structure.json.');
  await browser.close();
})();
