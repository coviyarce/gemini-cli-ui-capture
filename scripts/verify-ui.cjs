const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  const filePath = 'file://' + path.resolve('ui-capture/figma-plugin/ui.html');
  
  console.log('Opening:', filePath);
  await page.goto(filePath, { waitUntil: 'networkidle0' });
  await page.setViewport({ width: 320, height: 520 });
  
  // Wait for the screens to render (the data comes from ui-data.js)
  await page.waitForSelector('.screen-item', { timeout: 5000 });
  
  // Take a screenshot
  await page.screenshot({ path: 'ui-capture/assets/internal-plugin-verify.png' });
  
  // Extract some text to verify content
  const screens = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.screen-name')).map(el => el.textContent.trim());
  });
  
  console.log('✅ Captured Screens in UI:', screens);
  await browser.close();
})();
