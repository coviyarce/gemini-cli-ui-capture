const fs = require('fs');
const path = require('path');

// ─── Configuration Paths ───
// Reading from the new superscan folder in polaris-ds
const uiDataPath = path.join(__dirname, '../../polaris-ds/superscan/ui-structure.json');
const templateCodePath = path.join(__dirname, '../figma-plugin/code.template.js');
const templateUIPath = path.join(__dirname, '../figma-plugin/ui.html');
const codePath = path.join(__dirname, '../figma-plugin/code.js');
const finalUIPath = path.join(__dirname, '../figma-plugin/ui.html');

async function syncPlugin() {
    console.log('🔄 Starting Plugin Synchronization (v3.5 Fix)...');

    try {
        // 1. Read the latest UI Blueprint
        if (!fs.existsSync(uiDataPath)) {
            console.error('❌ Data file not found at:', uiDataPath);
            console.log('   ↳ Please run capture-to-figma.cjs first.');
            return;
        }
        const uiData = fs.readFileSync(uiDataPath, 'utf8');

        // 2. Inject data into the Plugin Logic (code.js)
        let codeContent = fs.readFileSync(templateCodePath, 'utf8');
        const dataString = 'JSON.parse(`' + uiData.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$') + '`)';
        codeContent = codeContent.replace('const allData = msg.dataOverride || __CAPTURED_DATA__;', 'const allData = msg.dataOverride || ' + dataString + ';');
        fs.writeFileSync(codePath, codeContent);
        console.log('   ↳ Logic (code.js) fixed and updated.');

        // 3. Inject data into the Plugin UI (ui.html)
        let uiHtml = fs.readFileSync(templateUIPath, 'utf8');
        uiHtml = uiHtml.replace('let allData = __CAPTURED_DATA__;', 'let allData = ' + dataString + ';');
        fs.writeFileSync(finalUIPath, uiHtml);
        console.log('   ↳ Interface (ui.html) fixed and updated.');

        console.log('✅ Plugin UI & Logic synced! The Figma plugin is ready to use. 🚀');

    } catch (error) {
        console.error('❌ Synchronization failed:', error);
    }
}

syncPlugin();
