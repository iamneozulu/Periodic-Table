import { describe, it, expect } from 'vitest';
import { ELEMENT_HISTORY } from '../src/data/elementFacts.js';
import { ELEMENT_DATA } from '../src/data/elementData.js';

describe('ELEMENT_HISTORY', () => {
  it('covers every element 1..118', () => {
    const numbers = ELEMENT_DATA.map((el) => el.number);
    for (const number of numbers) {
      expect(ELEMENT_HISTORY[number]).toBeDefined();
    }
  });

  it('every entry has a discovery and a fact', () => {
    for (const entry of Object.values(ELEMENT_HISTORY)) {
      expect(typeof entry.discovered).toBe('string');
      expect(entry.discovered.length).toBeGreaterThan(0);
      expect(typeof entry.fact).toBe('string');
      expect(entry.fact.length).toBeGreaterThan(0);
    }
  });

  it('facts do not contain unescaped template-breaking characters', () => {
    for (const entry of Object.values(ELEMENT_HISTORY)) {
      expect(entry.discovered).not.toMatch(/`|\$\{/);
      expect(entry.fact).not.toMatch(/`|\$\{/);
    }
  });

  it('has one entry per element', () => {
    expect(Object.keys(ELEMENT_HISTORY)).toHaveLength(ELEMENT_DATA.length);
  });
});