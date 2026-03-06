const fs = require('fs');
const path = require('path');

const uiDataPath = path.join(__dirname, 'ui-structure.json');
const configPath = path.join(__dirname, '../capture-config.json');
const templatePath = path.join(__dirname, '../figma-plugin/code.template.js');
const uiTemplatePath = path.join(__dirname, '../figma-plugin/ui.html');
const codePath = path.join(__dirname, '../figma-plugin/code.js');

// 1. Get captured data and config
const uiData = fs.readFileSync(uiDataPath, 'utf8');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// 2. Refresh code.js from template
let code = fs.readFileSync(templatePath, 'utf8');
code = code.replace('__CAPTURED_DATA__', uiData);
fs.writeFileSync(codePath, code);

// 3. Update ui.html with screen metadata
let uiHtml = fs.readFileSync(uiTemplatePath, 'utf8');
const screenMetadata = config.screens.map(s => ({ id: s.id, name: s.name }));
uiHtml = uiHtml.replace('__SCREEN_METADATA__', JSON.stringify(screenMetadata));
fs.writeFileSync(uiTemplatePath, uiHtml);

console.log('Figma Plugin (Code & UI) refreshed with Multi-Screen support! 🚀');
