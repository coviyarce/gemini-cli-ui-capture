/**
 * SuperScan UI Bridge — Unit Test Suite
 * Professional Validation 1a
 */

// ── Mock helper (simulates the internal logic of figma-plugin/code.template.js)
function parseColor(cssColor) {
  if (!cssColor || cssColor === 'transparent' || cssColor === 'rgba(0, 0, 0, 0)') return { r: 0, g: 0, b: 0, a: 0 };
  const match = cssColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!match) return { r: 1, g: 1, b: 1, a: 1 };
  return { 
    r: parseInt(match[1]) / 255, 
    g: parseInt(match[2]) / 255, 
    b: parseInt(match[3]) / 255, 
    a: match[4] ? parseFloat(match[4]) : 1 
  };
}

// ── Tests ──

describe('SuperScan Core Logic: parseColor', () => {
  test('should parse solid hex colors represented as RGB', () => {
    const color = parseColor('rgb(255, 255, 255)');
    expect(color.r).toBe(1);
    expect(color.g).toBe(1);
    expect(color.b).toBe(1);
    expect(color.a).toBe(1);
  });

  test('should parse RGBA colors with opacity', () => {
    const color = parseColor('rgba(0, 180, 237, 0.5)');
    expect(color.r).toBeCloseTo(0);
    expect(color.g).toBeCloseTo(180/255);
    expect(color.b).toBeCloseTo(237/255);
    expect(color.a).toBe(0.5);
  });

  test('should handle transparent colors gracefully', () => {
    const color = parseColor('transparent');
    expect(color.a).toBe(0);
  });

  test('should fallback to white for malformed strings', () => {
    const color = parseColor('unknown-format');
    expect(color.r).toBe(1);
  });
});

describe('SuperScan Data Structure Validation', () => {
  test('should verify the existence and validity of ui-structure.json', () => {
    const fs = require('fs');
    const path = require('path');
    const dataPath = path.join(__dirname, '../assets/ui-structure.json');
    
    expect(fs.existsSync(dataPath)).toBe(true);
    
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const screens = Object.keys(data);
    
    // We should have screens in the snapshot
    expect(screens.length).toBeGreaterThan(0);
    
    // Check required properties for Figma rendering in at least one screen
    const firstScreen = data[screens[0]];
    expect(firstScreen).toHaveProperty('name');
    expect(firstScreen).toHaveProperty('1080p');
    expect(firstScreen['1080p']).toHaveProperty('tag');
    expect(firstScreen['1080p']).toHaveProperty('styles');
    expect(firstScreen['1080p'].styles).toHaveProperty('width');
    expect(firstScreen['1080p'].styles).toHaveProperty('height');
  });
});

describe('Figma Plugin Manifest Validation', () => {
  test('should verify the manifest.json is correct for production', () => {
    const manifest = require('../figma-plugin/manifest.json');
    expect(manifest.name).toBe('SuperScan UI Bridge v4.0');
    expect(manifest.id).toBe('superscan-ui-bridge');
    expect(manifest.main).toBe('code.js');
    expect(manifest.ui).toBe('ui.html');
  });
});
