import * as THREE from "three";

const COLOR = {
  electron: 0x4fc3f7,
  proton: 0xff5252,
  neutron: 0x69f0ae,
};

const RANDOM = (radius) => (Math.random() - 0.5) * radius;

export class Atom extends THREE.Group {
  constructor(element, { outerRadius = 0.42 } = {}) {
    super();
    this.element = element;
    const shells = this.computeShells(element);
    this.buildNucleus(element);
    this.buildShells(shells, outerRadius);
  }

  computeShells(element) {
    const shellCount = Math.min(element.period, 7);
    let remaining = element.number;
    const shells = [];
    for (let n = 1; n <= shellCount; n++) {
      const capacity = 2 * n * n;
      const count = Math.min(capacity, remaining);
      shells.push({ n, count });
      remaining -= count;
    }
    return shells;
  }

  buildNucleus(element) {
    const protonCount = element.number;
    const neutronCount = Math.round(element.number * 1.25);
    const nucleusRadius = 0.045;
    const dummy = new THREE.Object3D();

    const protonMaterial = new THREE.MeshStandardMaterial({
      color: COLOR.proton,
      roughness: 0.5,
    });
    const neutronMaterial = new THREE.MeshStandardMaterial({
      color: COLOR.neutron,
      roughness: 0.5,
    });
    const sphereGeometry = new THREE.SphereGeometry(0.02, 8, 8);

    const protonMesh = new THREE.InstancedMesh(
      sphereGeometry,
      protonMaterial,
      protonCount,
    );
    const neutronMesh = new THREE.InstancedMesh(
      sphereGeometry,
      neutronMaterial,
      neutronCount,
    );

    for (let i = 0; i < protonCount; i++) {
      dummy.position.set(
        RANDOM(nucleusRadius),
        RANDOM(nucleusRadius),
        RANDOM(nucleusRadius),
      );
      dummy.updateMatrix();
      protonMesh.setMatrixAt(i, dummy.matrix);
    }
    for (let i = 0; i < neutronCount; i++) {
      dummy.position.set(
        RANDOM(nucleusRadius),
        RANDOM(nucleusRadius),
        RANDOM(nucleusRadius),
      );
      dummy.updateMatrix();
      neutronMesh.setMatrixAt(i, dummy.matrix);
    }
    protonMesh.instanceMatrix.needsUpdate = true;
    neutronMesh.instanceMatrix.needsUpdate = true;

    const nucleus = new THREE.Group();
    nucleus.add(protonMesh, neutronMesh);
    this.add(nucleus);
  }

  buildShells(shells, outerRadius) {
    const electronTotal = shells.reduce((total, shell) => total + shell.count, 0);
    const electronMaterial = new THREE.MeshStandardMaterial({
      color: COLOR.electron,
      roughness: 0.4,
    });
    const electronMesh = new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.028, 8, 8),
      electronMaterial,
      electronTotal,
    );

    const ringMaterial = new THREE.MeshStandardMaterial({
      color: 0xbfd4ff,
      transparent: true,
      opacity: 0.45,
      roughness: 0.5,
    });
    const ringMesh = new THREE.InstancedMesh(
      new THREE.TorusGeometry(1, 0.014, 6, 48),
      ringMaterial,
      shells.length,
    );

    const dummy = new THREE.Object3D();
    let electronIndex = 0;

    shells.forEach((shell, index) => {
      const radius = (outerRadius * shell.n) / shells.length;
      const electrons = shell.count;

      dummy.position.set(0, 0, 0);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(radius);
      dummy.updateMatrix();
      ringMesh.setMatrixAt(index, dummy.matrix);

      for (let k = 0; k < electrons; k++) {
        const angle = (k / electrons) * Math.PI * 2;
        dummy.position.set(
          radius * Math.cos(angle),
          radius * Math.sin(angle),
          0,
        );
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        electronMesh.setMatrixAt(electronIndex, dummy.matrix);
        electronIndex++;
      }
    });

    electronMesh.instanceMatrix.needsUpdate = true;
    ringMesh.instanceMatrix.needsUpdate = true;

    this.add(electronMesh, ringMesh);
  }
}