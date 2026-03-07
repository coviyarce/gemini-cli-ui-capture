/**
 * Plugin Synchronization Script
 * ---------------------------------
 * This script serves as the bridge between the headless browser capture 
 * and the Figma Plugin ecosystem.
 * 
 * Key Responsibilities:
 * 1. Reads the serialized vector blueprint from `ui-structure.json`.
 * 2. Injects this JSON data into the Figma Plugin logic (`code.template.js`) 
 *    so it can be evaluated securely within Figma's sandbox.
 * 3. Updates the Plugin's UI (`ui.html`) to dynamically list available screens
 *    without requiring hardcoded HTML changes.
 */

const fs = require('fs');
const path = require('path');

// ─── Configuration Paths ───
const uiDataPath = path.join(__dirname, 'ui-structure.json');
const templateCodePath = path.join(__dirname, '../figma-plugin/code.template.js');
const templateUIPath = path.join(__dirname, '../figma-plugin/ui.html');
const codePath = path.join(__dirname, '../figma-plugin/code.js');
const finalUIPath = path.join(__dirname, '../figma-plugin/ui.html');

/**
 * Main Synchronization Function
 */
function syncPlugin() {
    if (!fs.existsSync(uiDataPath)) {
        console.error('❌ Error: ui-structure.json not found. Please run the capture script first.');
        process.exit(1);
    }

    try {
        console.log('🔄 Starting Plugin Synchronization...');

        // 1. Read the captured UI data
        const uiData = fs.readFileSync(uiDataPath, 'utf8');

        // 2. Inject data into the main Plugin logic (code.js)
        let code = fs.readFileSync(templateCodePath, 'utf8');
        code = code.replace('__CAPTURED_DATA__', uiData);
        fs.writeFileSync(codePath, code);
        console.log('   ↳ Logic (code.js) updated successfully.');

        // 3. Inject data into the Plugin UI (ui.html)
        let uiHtml = fs.readFileSync(templateUIPath, 'utf8');
        
        // Dynamic injection logic to replace the data object gracefully
        const startToken = 'const allData = ';
        const endToken = ';';
        const startIdx = uiHtml.indexOf(startToken);
        
        if (startIdx !== -1) {
            const endIdx = uiHtml.indexOf(endToken, startIdx + startToken.length);
            const before = uiHtml.substring(0, startIdx + startToken.length);
            const after = uiHtml.substring(endIdx);
            uiHtml = before + uiData + after;
        } else {
            // Fallback for initial state templates
            uiHtml = uiHtml.replace('__CAPTURED_DATA__', uiData);
        }

        fs.writeFileSync(finalUIPath, uiHtml);
        console.log('   ↳ Interface (ui.html) updated successfully.');

        console.log('✅ Plugin UI & Logic synced! The Figma plugin is ready to use. 🚀');

    } catch (error) {
        console.error('❌ Synchronization failed:', error);
    }
}

// Execute sync
syncPlugin();
