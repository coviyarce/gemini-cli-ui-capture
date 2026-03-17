const fs = require('fs');
const path = require('path');

// ─── Configuration Paths ───
const uiDataPath = path.join(__dirname, '../../polaris-ds/superscan/ui-structure.json');
const templateCodePath = path.join(__dirname, '../figma-plugin/code.template.js');
const templateUIPath = path.join(__dirname, '../figma-plugin/ui.template.html');
const finalCodePath = path.join(__dirname, '../figma-plugin/code.js');
const finalUIPath = path.join(__dirname, '../figma-plugin/ui.html');

async function syncPlugin() {
    console.log('🔄 Starting Plugin Synchronization (v3.7 Total Refresh)...');

    try {
        if (!fs.existsSync(uiDataPath)) {
            console.error('❌ Data file not found at:', uiDataPath);
            return;
        }
        const uiDataRaw = fs.readFileSync(uiDataPath, 'utf8');
        const uiDataObject = JSON.parse(uiDataRaw);
        
        console.log('   ↳ Found screens:', Object.keys(uiDataObject));

        // Format for injection into backticks
        const escapedData = uiDataRaw.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
        const dataInjection = 'JSON.parse(`' + escapedData + '`)';

        // 1. Inject into Logic (code.js)
        if (fs.existsSync(templateCodePath)) {
            let codeContent = fs.readFileSync(templateCodePath, 'utf8');
            codeContent = codeContent.replace(/__CAPTURED_DATA__/g, dataInjection);
            fs.writeFileSync(finalCodePath, codeContent);
            console.log('   ↳ Logic (code.js) fully refreshed from template.');
        }

        // 2. Inject into UI (ui.html)
        if (fs.existsSync(templateUIPath)) {
            let uiHtml = fs.readFileSync(templateUIPath, 'utf8');
            uiHtml = uiHtml.replace(/__CAPTURED_DATA__/g, dataInjection);
            fs.writeFileSync(finalUIPath, uiHtml);
            console.log('   ↳ Interface (ui.html) fully refreshed from template.');
        }

        console.log('✅ Plugin sync complete. Please restart the plugin in Figma. 🚀');

    } catch (error) {
        console.error('❌ Synchronization failed:', error);
    }
}

syncPlugin();
