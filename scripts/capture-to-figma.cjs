const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  const resolutions = [
    { name: "1080p", width: 1920, height: 1080 },
    { name: "720p", width: 1280, height: 720 }
  ];

  const results = {};

  try {
    for (const res of resolutions) {
      console.log(`Final Perfection Capture at ${res.width}px...`);
      await page.setViewport({ width: res.width, height: res.height });
      await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
      
      const tabs = await page.$$('.MuiTab-root');
      if (tabs[3]) {
        await tabs[3].click();
        await new Promise(r => setTimeout(r, 2000));
      }

      results[res.name] = await page.evaluate(() => {
        function getStyles(el) {
          const styles = window.getComputedStyle(el);
          const rect = el.getBoundingClientRect();
          return {
            backgroundColor: styles.backgroundColor,
            color: styles.color,
            fontSize: styles.fontSize,
            fontFamily: styles.fontFamily,
            fontWeight: styles.fontWeight,
            borderRadius: styles.borderRadius,
            // Full border capture
            borderTop: styles.borderTop,
            borderBottom: styles.borderBottom,
            borderLeft: styles.borderLeft,
            borderRight: styles.borderRight,
            // SHADOW CAPTURE
            boxShadow: styles.boxShadow,
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            textAlign: styles.textAlign,
            paddingLeft: parseFloat(styles.paddingLeft) || 0,
            paddingRight: parseFloat(styles.paddingRight) || 0,
            paddingTop: parseFloat(styles.paddingTop) || 0,
            paddingBottom: parseFloat(styles.paddingBottom) || 0
          };
        }

        function scan(el) {
          if (!el || el.nodeType !== 1) return null;
          const styles = getStyles(el);
          const isSvg = el.tagName.toLowerCase() === 'svg';
          
          const node = {
            tag: el.tagName,
            styles: styles,
            children: []
          };

          if (isSvg) {
            node.svgContent = el.outerHTML;
            node.iconType = 'svg';
          } else {
            let text = "";
            for (const child of el.childNodes) {
                if (child.nodeType === 3 && child.textContent.trim().length > 0) {
                    text += child.textContent.trim() + " ";
                }
            }
            node.text = text.trim();
          }

          if (!isSvg) {
            for (const child of el.children) {
              const r = child.getBoundingClientRect();
              if (r.width > 0 || r.height > 0) {
                const c = scan(child);
                if (c) node.children.push(c);
              }
            }
          }
          return node;
        }

        const root = document.querySelector('.MuiPaper-root') || document.body;
        return scan(root);
      });
    }
  } catch (err) { console.error(err); }

  fs.writeFileSync(require('path').join(__dirname, 'ui-structure.json'), JSON.stringify(results, null, 2));
  console.log('Final Perfection Capture Finished!');
  await browser.close();
})();
