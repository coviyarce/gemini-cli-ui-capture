const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const assetsDir = path.join(__dirname, '../assets');
  if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir);

  // 1. Screenshot of the Web App (Genericized with blur)
  console.log('Capturing Web App screenshot (genericized)...');
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle2' });
  
  // Apply blur to protect specific project details
  await page.evaluate(() => {
    document.body.style.filter = 'blur(8px)';
  });
  
  await page.screenshot({ path: path.join(assetsDir, 'app-preview.png') });

  // 2. Screenshot of the Plugin UI (Generic Names)
  console.log('Capturing Plugin UI screenshot...');
  const uiHtmlPath = 'file://' + path.join(__dirname, '../figma-plugin/ui.html');
  await page.setViewport({ width: 300, height: 450 });
  
  await page.goto(uiHtmlPath);
  await page.evaluate(() => {
    const dummyMetadata = [
      { id: 'dashboard', name: 'Main Dashboard' },
      { id: 'settings', name: 'User Settings' },
      { id: 'profile', name: 'Profile View' }
    ];
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
