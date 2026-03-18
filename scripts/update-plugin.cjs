const fs = require('fs');
const path = require('path');

// ── Configuration Paths (Relative to project root) ──
const rootDir = path.join(__dirname, '..');
const uiDataPath = path.join(rootDir, '../polaris-ds/superscan/ui-structure.json');
const templateCodePath = path.join(rootDir, 'figma-plugin/code.template.js');
const templateUIPath = path.join(rootDir, 'figma-plugin/ui.template.html');
const finalCodePath = path.join(rootDir, 'figma-plugin/code.js');
const finalUIPath = path.join(rootDir, 'figma-plugin/ui.html');

async function syncPlugin() {
    console.log('🔄 Syncing SuperScan Plugin components...');

    try {
        if (!fs.existsSync(uiDataPath)) {
            console.warn('⚠️ No captured data found at assets/ui-structure.json. Plugin will start empty.');
        }
        
        const uiDataRaw = fs.existsSync(uiDataPath) ? fs.readFileSync(uiDataPath, 'utf8') : '{}';
        
        // Format for injection into backticks
        const escapedData = uiDataRaw.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
        const dataInjection = 'JSON.parse(`' + escapedData + '`)';

        // 1. Inject into Logic (code.js)
        if (fs.existsSync(templateCodePath)) {
            let codeContent = fs.readFileSync(templateCodePath, 'utf8');
            codeContent = codeContent.replace(/__CAPTURED_DATA__/g, dataInjection);
            fs.writeFileSync(finalCodePath, codeContent);
        }

        // 2. Inject into UI (ui.html)
        if (fs.existsSync(templateUIPath)) {
            let uiHtml = fs.readFileSync(templateUIPath, 'utf8');
            uiHtml = uiHtml.replace(/__CAPTURED_DATA__/g, dataInjection);
            fs.writeFileSync(finalUIPath, uiHtml);
        }

        console.log('✅ Plugin code updated. Please refresh the plugin in Figma.');

    } catch (error) {
        console.error('❌ Synchronization failed:', error);
    }
}

syncPlugin();
