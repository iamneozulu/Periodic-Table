import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('three', () => {
  class MockObject3D {
    constructor() {
      this.children = [];
      this.position = { set: () => {} };
      this.rotation = { set: () => {} };
      this.scale = { setScalar: () => {} };
      this.matrix = {};
    }
    add(...objects) {
      this.children.push(...objects);
      return this;
    }
    updateMatrix() {}
  }

  class MockGroup extends MockObject3D {}

  class MockMeshStandardMaterial {
    constructor(options = {}) {
      Object.assign(this, options);
      this.type = 'MeshStandardMaterial';
    }
  }

  class MockSphereGeometry {
    constructor(radius, w, h) {
      this.type = 'SphereGeometry';
      this.radius = radius;
      this.widthSegments = w;
      this.heightSegments = h;
    }
  }

  class MockTorusGeometry {
    constructor(radius, tube, radialSeg, tubularSeg) {
      this.type = 'TorusGeometry';
      this.radius = radius;
      this.tube = tube;
    }
  }

  class MockInstancedMesh {
    constructor(geometry, material, count) {
      this.geometry = geometry;
      this.material = material;
      this.count = count;
      this.instanceMatrix = { needsUpdate: false };
      this.setMatrixAt = vi.fn();
    }
  }

  return {
    Group: MockGroup,
    Object3D: MockObject3D,
    MeshStandardMaterial: MockMeshStandardMaterial,
    SphereGeometry: MockSphereGeometry,
    TorusGeometry: MockTorusGeometry,
    InstancedMesh: MockInstancedMesh,
  };
});

const THREE = await import('three');
const { Atom } = await import('../src/world/Atom.js');

const ELEMENTS = {
  hydrogen: { number: 1, symbol: 'H', shells: [1], neutrons: 0 },
  oxygen: { number: 8, symbol: 'O', shells: [2, 6], neutrons: 8 },
  iron: { number: 26, symbol: 'Fe', shells: [2, 8, 14, 2], neutrons: 30 },
};

describe('Atom', () => {
  let atom;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('is a THREE.Group', () => {
    atom = new Atom(ELEMENTS.hydrogen);
    expect(atom).toBeInstanceOf(THREE.Group);
  });

  it('stores the element', () => {
    atom = new Atom(ELEMENTS.oxygen);
    expect(atom.element).toBe(ELEMENTS.oxygen);
  });

  describe('computeShells', () => {
    it('returns each shell count and max', () => {
      atom = new Atom(ELEMENTS.oxygen);
      const shells = atom.computeShells(ELEMENTS.oxygen);
      expect(shells).toEqual([
        { count: 2, max: 2 },
        { count: 6, max: 6 },
      ]);
    });

    it('falls back to a single shell of size = atomic number when absent', () => {
      atom = new Atom({ number: 4 });
      expect(atom.computeShells({ number: 4 })).toEqual([{ count: 4, max: 4 }]);
    });
  });

  describe('buildNucleus', () => {
    it('creates a proton InstancedMesh with count = atomic number', () => {
      atom = new Atom(ELEMENTS.iron);
      const protonMesh = atom.children.find(
        (c) =>
          c.children[0] &&
          c.children[0].count === 26,
      );
      expect(protonMesh).toBeDefined();
      const nucleus = atom.children.find((c) => c.children.length === 2);
      expect(nucleus.children[0].count).toBe(26);
      expect(nucleus.children[1].count).toBe(30);
    });

    it('places each proton and neutron via setMatrixAt', () => {
      atom = new Atom(ELEMENTS.oxygen);
      const nucleus = atom.children.find((c) => c.children.length === 2);
      const [protons, neutrons] = nucleus.children;
      expect(protons.setMatrixAt).toHaveBeenCalledTimes(8);
      expect(neutrons.setMatrixAt).toHaveBeenCalledTimes(8);
      expect(protons.instanceMatrix.needsUpdate).toBe(true);
    });
  });

  describe('buildShells', () => {
    it('creates one electron mesh for the total electron count', () => {
      atom = new Atom(ELEMENTS.iron);
      const electronMesh = atom.children.find((c) => c.count === 26 && c.setMatrixAt);
      expect(electronMesh).toBeDefined();
    });

    it('creates one ring InstancedMesh with one instance per shell', () => {
      atom = new Atom(ELEMENTS.iron);
      const ringMesh = atom.children.find(
        (c) => c.geometry && c.geometry.type === 'TorusGeometry',
      );
      expect(ringMesh).toBeDefined();
      expect(ringMesh.count).toBe(4);
      expect(ringMesh.instanceMatrix.needsUpdate).toBe(true);
    });
  });
});