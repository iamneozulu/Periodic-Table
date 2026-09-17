import { describe, it, expect } from 'vitest';
import { ELEMENT_DATA, CATEGORY_COLORS } from '../src/data/elementData.js';

describe('ELEMENT_DATA', () => {
  it('contains 118 elements', () => {
    expect(ELEMENT_DATA).toHaveLength(118);
  });

  it('has sequential atomic numbers 1..118', () => {
    const numbers = ELEMENT_DATA.map((el) => el.number);
    expect(numbers).toEqual(numbers.slice().sort((a, b) => a - b));
    expect(numbers[0]).toBe(1);
    expect(numbers[118 - 1]).toBe(118);
    expect(new Set(numbers).size).toBe(118);
  });

  it('has unique symbols', () => {
    const symbols = ELEMENT_DATA.map((el) => el.symbol);
    expect(new Set(symbols).size).toBe(118);
  });

  it('has unique names', () => {
    const names = ELEMENT_DATA.map((el) => el.name);
    expect(new Set(names).size).toBe(118);
  });

  it('every element has canonical fields typed correctly', () => {
    for (const el of ELEMENT_DATA) {
      expect(typeof el.number).toBe('number');
      expect(typeof el.symbol).toBe('string');
      expect(typeof el.name).toBe('string');
      expect(typeof el.period).toBe('number');
      expect(typeof el.group).toBe('number');
      expect(typeof el.neutrons).toBe('number');
      expect(Array.isArray(el.shells)).toBe(true);
      expect(el.shells.length).toBeGreaterThan(0);
      for (const count of el.shells) {
        expect(count).toBeGreaterThan(0);
      }
    }
  });

  it('every element belongs to a known category', () => {
    const known = Object.keys(CATEGORY_COLORS);
    for (const el of ELEMENT_DATA) {
      expect(known).toContain(el.category);
    }
  });

  it('covers every known category each period/groups map to valid coordinates', () => {
    for (const el of ELEMENT_DATA) {
      expect(el.period).toBeGreaterThanOrEqual(1);
      expect(el.group).toBeGreaterThanOrEqual(1);
      expect(el.group).toBeLessThanOrEqual(18);
    }
  });
});

describe('CATEGORY_COLORS', () => {
  it('defines a color for each of the 10 categories', () => {
    const categories = [...new Set(ELEMENT_DATA.map((el) => el.category))];
    expect(categories).toHaveLength(10);
    for (const cat of categories) {
      expect(CATEGORY_COLORS[cat]).toBeDefined();
      expect(typeof CATEGORY_COLORS[cat]).toBe('number');
    }
  });

  it('colors are valid hex-ish integers', () => {
    for (const color of Object.values(CATEGORY_COLORS)) {
      expect(color).toBeGreaterThanOrEqual(0);
      expect(color).toBeLessThanOrEqual(0xffffff);
      expect(Number.isInteger(color)).toBe(true);
    }
  });
});