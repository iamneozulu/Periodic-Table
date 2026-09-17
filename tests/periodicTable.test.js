import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('three', () => {
  class MockVector3 {
    constructor(x = 0, y = 0, z = 0) {
      this.x = x;
      this.y = y;
      this.z = z;
    }
    add(other) {
      this.x += other.x;
      this.y += other.y;
      this.z += other.z;
      return this;
    }
    divideScalar(s) {
      this.x /= s;
      this.y /= s;
      this.z /= s;
      return this;
    }
  }

  class MockGroup {
    constructor() {
      this.children = [];
      this.position = new MockVector3();
    }
    add(child) {
      this.children.push(child);
      return this;
    }
  }

  return {
    Group: MockGroup,
    Vector3: MockVector3,
  };
});

vi.mock('../src/world/ElementBlock.js', () => {
  class MockElementBlock {
    constructor(element, options = {}) {
      this.element = element;
      this.cube = { userData: { block: this } };
      this.spacing = options.spacing ?? 1.4;
      this.position = {
        x: (element.group - 10) * this.spacing,
        y: (5 - element.period) * this.spacing,
        z: 0,
      };
      this.hovered = false;
      this.dimmed = false;
      this.highlighted = false;
      this.resetVisualCalls = 0;
    }
    setHovered(on) { this.hovered = on; }
    setDimmed(on) { this.dimmed = on; }
    setHighlighted(on) { this.highlighted = on; }
    resetVisual() {
      this.resetVisualCalls += 1;
      this.hovered = false;
      this.dimmed = false;
      this.highlighted = false;
    }
  }

  return { ElementBlock: MockElementBlock };
});

import { PeriodicTable } from '../src/world/PeriodicTable.js';

describe('PeriodicTable', () => {
  let table;

  beforeEach(() => {
    vi.clearAllMocks();
    table = new PeriodicTable({ spacing: 1.4, size: 1 });
  });

  it('creates one block per element (118)', () => {
    expect(table.blocks).toHaveLength(118);
  });

  it('adds every block to the scene group', () => {
    expect(table.group.children).toHaveLength(118);
  });

  it('initial state has no hover or active category', () => {
    expect(table.hovered).toBeNull();
    expect(table.activeCategory).toBeNull();
  });

  it('positions blocks via element period/group', () => {
    const hydrogen = table.blocks.find((b) => b.element.number === 1);
    expect(hydrogen.position.x).toBeCloseTo((1 - 10) * 1.4);
    expect(hydrogen.position.y).toBeCloseTo((5 - 1) * 1.4);
    expect(hydrogen.position.z).toBeCloseTo(0);
  });

  it('getBlockAt returns the block under the raycast hit', () => {
    const iron = table.blocks.find((b) => b.element.number === 26);
    const raycaster = {
      setFromCamera: vi.fn(),
      intersectObjects: vi.fn(() => [{ object: { userData: { block: iron } } }]),
    };
    const hit = table.getBlockAt({ x: 0, y: 0 }, raycaster, {});
    expect(hit).toBe(iron);
  });

  it('getBlockAt returns null when nothing is hit', () => {
    const raycaster = {
      setFromCamera: vi.fn(),
      intersectObjects: vi.fn(() => []),
    };
    expect(table.getBlockAt({ x: 0, y: 0 }, raycaster, {})).toBeNull();
  });

  it('setHovered toggles the previous and new block', () => {
    const a = table.blocks[0];
    const b = table.blocks[1];
    table.setHovered(a);
    expect(a.hovered).toBe(true);
    table.setHovered(b);
    expect(a.hovered).toBe(false);
    expect(b.hovered).toBe(true);
    expect(table.hovered).toBe(b);
  });

  it('filterCategory highlights matching and dims the rest', () => {
    const center = table.filterCategory('transitionMetal');
    expect(table.activeCategory).toBe('transitionMetal');
    const inCat = table.blocks.filter((b) => b.element.category === 'transitionMetal');
    const outCat = table.blocks.filter((b) => b.element.category !== 'transitionMetal');
    expect(inCat.length).toBeGreaterThan(0);
    for (const block of inCat) {
      expect(block.highlighted).toBe(true);
      expect(block.dimmed).toBe(false);
    }
    for (const block of outCat) {
      expect(block.highlighted).toBe(false);
      expect(block.dimmed).toBe(true);
    }
    expect(center).toBeDefined();
  });

  it('filterCategory with the same category clears the filter', () => {
    table.filterCategory('halogen');
    const result = table.filterCategory('halogen');
    expect(result).toBeNull();
    expect(table.activeCategory).toBeNull();
    for (const block of table.blocks) {
      expect(block.highlighted).toBe(false);
      expect(block.dimmed).toBe(false);
    }
  });

  it('clearFilter resets all block visuals', () => {
    table.filterCategory('nobleGas');
    table.clearFilter();
    expect(table.activeCategory).toBeNull();
    for (const block of table.blocks) {
      expect(block.resetVisualCalls).toBeGreaterThanOrEqual(1);
      expect(block.highlighted).toBe(false);
    }
  });

  it('getCategoryCenter averages the matching positions', () => {
    const center = table.getCategoryCenter('alkaliMetal');
    const inCat = table.blocks.filter((b) => b.element.category === 'alkaliMetal');
    expect(inCat.length).toBeGreaterThan(0);
    const avgX = inCat.reduce((s, b) => s + b.position.x, 0) / inCat.length;
    const avgY = inCat.reduce((s, b) => s + b.position.y, 0) / inCat.length;
    expect(center.x).toBeCloseTo(avgX);
    expect(center.y).toBeCloseTo(avgY);
  });

  it('getCategoryCenter returns zero vector for unknown category', () => {
    const center = table.getCategoryCenter('notACategory');
    expect(center.x).toBe(0);
    expect(center.y).toBe(0);
    expect(center.z).toBe(0);
  });
});