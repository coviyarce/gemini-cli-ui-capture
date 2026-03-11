/**
 * UI Capture Engine (Atomic Precision & Z-Order Scansion)
 * --------------------------------------------------------
 * This script automates a headless browser to navigate your application,
 * interact with it based on a configuration file, and extract a high-fidelity
 * "vector blueprint" of the DOM. 
 * 
 * Features:
 * - Atomic Text Nodes: Uses the Range API for pixel-perfect text alignment.
 * - Depth Sorting: Captures Z-index to preserve stacking contexts.
 * - Noise Filtering: Ignores decorative elements (e.g., ripples, backdrops).
 * - Multi-Resolution: Supports rendering across various viewport sizes.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// ─── Configuration Setup ───
const configPath = path.join(__dirname, '../capture-config.json');
const uiDataPath = path.join(__dirname, '../../polaris-ds/superscan/ui-structure.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Determine run mode (Rebuild vs Incremental)
const isFullRebuild = process.argv.includes('--rebuild') || !fs.existsSync(uiDataPath);
let allScreensResults = {};

if (!isFullRebuild) {
  try {
    allScreensResults = JSON.parse(fs.readFileSync(uiDataPath, 'utf8'));
  } catch (e) {
    allScreensResults = {};
  }
}

/**
 * Main Capture Routine
 */
(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  // Ensure assets directory exists (for optional screenshot caching)
  const assetsDir = path.join(__dirname, '../assets/screenshots');
  if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

  // Define target resolutions (Standard 1080p desktop)
  const resolutions = [{ name: "1080p", width: 1920, height: 1080 }];

  try {
    for (const screen of config.screens) {
      if (!isFullRebuild && allScreensResults[screen.id]) {
        console.log(`⏩ Skipping: ${screen.name} (Already captured)`);
        continue;
      }

      console.log(`🚀 Precision Scanning: ${screen.name}...`);
      const screenResolutions = { name: screen.name, category: screen.category };

      for (const res of resolutions) {
        await page.setViewport({ width: res.width, height: res.height });
        await page.goto(config.baseUrl, { waitUntil: 'networkidle2' });
        
        // Optional: Navigate to specific tab indexes if defined
        if (screen.tabIndex !== undefined) {
          await page.evaluate((index) => {
            const tabs = document.querySelectorAll('.MuiTab-root, .tab-button, [role="tab"]');
            if (tabs[index]) tabs[index].click();
          }, screen.tabIndex);
          await new Promise(r => setTimeout(r, 1000));
        }

        // Execute user-defined actions (Clicks, Typing, Waiting)
        if (screen.actions) {
          for (const action of screen.actions) {
            try {
              if (action.type === 'click') {
                if (action.text) {
                  await page.evaluate((text) => {
                    const elements = Array.from(document.querySelectorAll('button, [role="button"], li, input, a, span'));
                    const el = elements.find(e => e.textContent.trim().includes(text));
                    if (el) el.click();
                  }, action.text);
                } else {
                  await page.waitForSelector(action.selector);
                  await page.click(action.selector);
                }
              } else if (action.type === 'type') {
                await page.waitForSelector(action.selector);
                await page.type(action.selector, action.text);
              } else if (action.type === 'wait') {
                await new Promise(r => setTimeout(r, action.ms));
              }
            } catch (e) {
                console.warn(`⚠️ Warning: Failed to execute action: ${JSON.stringify(action)}`);
            }
          }
        }

        // Wait for a specific element to load before capturing
        if (screen.waitFor) {
          try { await page.waitForSelector(screen.waitFor, { timeout: 4000 }); } catch (e) {}
        }

        // ─── DOM Extraction Engine ───
        screenResolutions[res.name] = await page.evaluate((selector) => {
          
          /** Extracts computed styles and normalizes coordinates */
          function getStyles(el) {
            const s = window.getComputedStyle(el);
            const r = el.getBoundingClientRect();
            return {
              backgroundColor: s.backgroundColor, color: s.color,
              fontSize: s.fontSize, fontFamily: s.fontFamily, fontWeight: s.fontWeight,
              borderRadius: s.borderRadius, borderTop: s.borderTop, borderBottom: s.borderBottom,
              borderLeft: s.borderLeft, borderRight: s.borderRight, boxShadow: s.boxShadow,
              zIndex: s.zIndex === 'auto' ? 0 : parseInt(s.zIndex),
              x: r.left + window.scrollX, y: r.top + window.scrollY, 
              width: r.width, height: r.height, textAlign: s.textAlign,
              display: s.display, opacity: s.opacity
            };
          }

          // Filter out programmatic noise and UI framework overlays
          const BLOCKED_TEXT = ["true", "false", "null", "undefined"];
          const BLOCKED_CLASSES = ["MuiTouchRipple-root", "ripple", "focus-ring"];

          /** Recursive DOM Scanner */
          function scan(el) {
            if (!el || el.nodeType !== 1) return null;
            
            // Filter noise classes
            const className = el.className || "";
            if (typeof className === 'string' && BLOCKED_CLASSES.some(c => className.includes(c))) return null;

            const style = getStyles(el);
            
            // Ignore invisible elements
            if (style.display === 'none' || style.opacity < 0.01) return null;
            if (style.width === 0 && style.height === 0 && el.children.length === 0) return null;

            const node = { tag: el.tagName.toLowerCase(), styles: style, children: [] };
            
            // Handle SVGs natively
            if (node.tag === 'svg') {
              node.iconType = 'svg'; 
              node.svgContent = el.outerHTML;
              return node;
            }

            // Capture text precisely using the Range API
            for (const child of el.childNodes) {
              if (child.nodeType === 3) { // Text Node
                const text = child.textContent.trim();
                if (text.length > 0 && !BLOCKED_TEXT.includes(text.toLowerCase())) {
                  const range = document.createRange();
                  range.selectNodeContents(child);
                  const rect = range.getBoundingClientRect();
                  if (rect.width > 0 && rect.height > 0) {
                    node.children.push({
                      tag: "text-node",
                      text: text,
                      styles: {
                        ...style,
                        x: rect.left + window.scrollX, y: rect.top + window.scrollY,
                        width: rect.width, height: rect.height,
                        backgroundColor: "transparent"
                      }
                    });
                  }
                }
              }
            }

            // Special handling for Input fields to capture their values/placeholders
            const isTextInput = el.tagName === 'INPUT' && ['text', 'password', 'email', 'number', 'search', 'tel', 'url'].includes(el.type || 'text');
            if (isTextInput || el.tagName === 'TEXTAREA') {
              const val = el.value || el.placeholder;
              if (val) node.children.push({ tag: "text-node", text: val, styles: { ...style, backgroundColor: "transparent" } });
            }

            // Recurse through children
            for (const child of el.children) {
              const childNode = scan(child);
              if (childNode) node.children.push(childNode);
            }

            // Depth sorting: Z-index first, then original DOM order
            node.children.sort((a, b) => (a.styles.zIndex - b.styles.zIndex));
            return node;
          }

          const root = selector === 'body' ? document.body : (document.querySelector(selector) || document.body);
          return scan(root);
        }, screen.selector);
      }
      
      // Save results
      allScreensResults[screen.id] = screenResolutions;
    }
  } catch (err) {
    console.error("❌ Capture Error:", err);
  }

  // Write finalized data blueprint
  fs.writeFileSync(uiDataPath, JSON.stringify(allScreensResults, null, 2));
  console.log('✅ Precision Scansion complete.');
  await browser.close();
})();
