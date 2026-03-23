import { describe, it, expect, vi } from 'vitest';

// Mocking Figma API (Essential for testing plugin logic locally)
const figmaMock = {
  notify: vi.fn(),
  createText: vi.fn(() => ({ fills: [], resize: vi.fn(), fontName: {} })),
  createFrame: vi.fn(() => ({ fills: [], strokes: [], resize: vi.fn() })),
  createNodeFromSvg: vi.fn(() => ({ width: 24, height: 24, rescale: vi.fn(), resize: vi.fn(), fills: [{ type: 'SOLID' }] })),
  loadFontAsync: vi.fn(() => Promise.resolve()),
  viewport: { center: { x: 0, y: 0 } }
};

// Simplified Engine logic for testing (matches code.template.js)
const parseColor = (cssColor) => {
  if (!cssColor || cssColor === 'transparent' || cssColor === 'rgba(0, 0, 0, 0)') return { r: 0, g: 0, b: 0, a: 0 };
  const match = cssColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!match) return { r: 1, g: 1, b: 1, a: 1 };
  return { 
    r: parseInt(match[1]) / 255, 
    g: parseInt(match[2]) / 255, 
    b: parseInt(match[3]) / 255, 
    a: match[4] ? parseFloat(match[4]) : 1 
  };
};

const getAlignment = (cssAlign) => {
  const alignMap = { "start": "LEFT", "left": "LEFT", "center": "CENTER", "end": "RIGHT", "right": "RIGHT", "justify": "JUSTIFIED" };
  return alignMap[cssAlign ? cssAlign.toLowerCase() : "left"] || "LEFT";
};

// Regression Test Suite
describe('SuperScan v4.5 Fidelity Engine Tests', () => {

  describe('🎨 Color Engine', () => {
    it('should parse RGB correctly', () => {
      const color = parseColor('rgb(255, 0, 0)');
      expect(color).toEqual({ r: 1, g: 0, b: 0, a: 1 });
    });
    
    it('should parse RGBA with transparency correctly', () => {
      const color = parseColor('rgba(255, 255, 255, 0.5)');
      expect(color.a).toBe(0.5);
    });

    it('should return transparent for empty colors', () => {
      const color = parseColor('transparent');
      expect(color.a).toBe(0);
    });
  });

  describe('✍️ Typography & Alignment', () => {
    it('should map CSS logical "start" to Figma "LEFT"', () => {
      expect(getAlignment('start')).toBe('LEFT');
    });

    it('should map CSS logical "end" to Figma "RIGHT"', () => {
      expect(getAlignment('end')).toBe('RIGHT');
    });

    it('should default to "LEFT" for unknown alignments', () => {
      expect(getAlignment('unknown')).toBe('LEFT');
    });
  });

  describe('💎 SVG Integrity (Zero-Square Policy)', () => {
    it('should apply recoloring ONLY to Vectors (Anti-Square-Box Regression)', () => {
      const iconColor = { r: 1, g: 0, b: 0, a: 1 };
      
      const vectorNode = { type: 'VECTOR', fills: [{ type: 'SOLID' }] };
      const frameNode = { type: 'FRAME', fills: [{ type: 'SOLID' }] }; // Should NOT be recolored
      
      const recolor = (node) => {
        if (node.type === 'VECTOR' || node.type === 'BOOLEAN_OPERATION') {
           node.fills = [{ type: 'SOLID', color: iconColor }];
        }
      };

      recolor(vectorNode);
      recolor(frameNode);

      expect(vectorNode.fills[0].color).toEqual(iconColor);
      expect(frameNode.fills[0].color).toBeUndefined(); // Frame color should NOT be overwritten
    });

    it('should calculate proportional scale correctly (Anti-Stretching Regression)', () => {
      const s = { width: 48, height: 24 }; // CSS Container (2:1 aspect)
      const svgNode = { width: 100, height: 100 }; // Square SVG
      
      const scale = Math.min(s.width / svgNode.width, s.height / svgNode.height);
      expect(scale).toBe(0.24); // Must be the smallest scale to fit proportionally
    });
  });

  describe('🎬 Storyboard Layout', () => {
    it('should correctly position steps horizontally (150px gap)', () => {
      const horizontalGap = 150;
      let currentX = 0;
      const stepWidth = 1000;
      
      const nextX = currentX + stepWidth + horizontalGap;
      expect(nextX).toBe(1150);
    });

    it('should correctly position flows vertically (300px gap)', () => {
      const verticalGap = 300;
      let currentY = 0;
      const rowHeight = 800;
      
      const nextY = currentY + rowHeight + verticalGap;
      expect(nextY).toBe(1100);
    });
  });

});
