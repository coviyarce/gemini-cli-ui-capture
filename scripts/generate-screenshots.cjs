const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const assetsDir = path.join(__dirname, '../assets');
  if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir);

  // 1. Screenshot of the Web App (Workflows)
  console.log('Capturing Web App screenshot...');
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  
  // Go to Workflows tab
  const tabs = await page.$$('.MuiTab-root');
  if (tabs[3]) {
    await tabs[3].click();
    await new Promise(r => setTimeout(r, 2000));
  }
  await page.screenshot({ path: path.join(assetsDir, 'app-preview.png') });

  // 2. Screenshot of the Plugin UI (The Toggles!)
  console.log('Capturing Plugin UI screenshot...');
  const uiHtmlPath = 'file://' + path.join(__dirname, '../figma-plugin/ui.html');
  await page.setViewport({ width: 300, height: 450 });
  
  // We need to inject dummy metadata for the screenshot to look real
  await page.goto(uiHtmlPath);
  await page.evaluate(() => {
    const dummyMetadata = [
      { id: 'workflows', name: 'Workflows Table' },
      { id: 'bulk-search', name: 'Bulk Search Page' },
      { id: 'container-detail', name: 'Container Detail Card' }
    ];
    // Manually trigger the render logic since __SCREEN_METADATA__ is a placeholder
    const listDiv = document.getElementById('screen-list');
    listDiv.innerHTML = '';
    dummyMetadata.forEach(screen => {
      const div = document.createElement('div');
      div.className = 'screen-item';
      div.innerHTML = `
        <div class="screen-info"><span class="screen-name">${screen.name}</span></div>
        <label class="switch"><input type="checkbox" checked><span class="slider"></span></label>
      `;
      listDiv.appendChild(div);
    });
  });
  
  await page.screenshot({ path: path.join(assetsDir, 'plugin-ui.png') });

  console.log('Screenshots generated in assets/ folder! 📸');
  await browser.close();
})();
