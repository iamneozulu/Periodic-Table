import * as THREE from "three";

const COLOR = {
  electron: 0x4fc3f7,
  proton: 0xff5252,
  neutron: 0x69f0ae,
};

const RANDOM = (radius) => (Math.random() - 0.5) * radius;

export class Atom extends THREE.Group {
  constructor(
    element,
    {
      outerRadius = 0.42,
      nucleusRadius = 0.045,
      nucleonSize = 0.016,
      electronSize = 0.014,
    } = {},
  ) {
    super();
    this.element = element;
    const shells = this.computeShells(element);
    this.buildNucleus(element, { nucleusRadius, nucleonSize });
    this.buildShells(shells, outerRadius, electronSize);
  }

  computeShells(element) {
    return (element.shells ?? [element.number]).map((count) => ({
      count,
      max: count,
    }));
  }

  buildNucleus(element, { nucleusRadius, nucleonSize }) {
    const protonCount = element.number;
    const neutronCount = element.neutrons ?? protonCount;
    const dummy = new THREE.Object3D();

    const protonMaterial = new THREE.MeshStandardMaterial({
      color: COLOR.proton,
      roughness: 0.5,
    });
    const neutronMaterial = new THREE.MeshStandardMaterial({
      color: COLOR.neutron,
      roughness: 0.5,
    });
    const sphereGeometry = new THREE.SphereGeometry(nucleonSize, 8, 8);

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

  buildShells(shells, outerRadius, electronSize) {
    const electronTotal = shells.reduce((total, shell) => total + shell.count, 0);
    const electronMaterial = new THREE.MeshStandardMaterial({
      color: COLOR.electron,
      roughness: 0.4,
    });
    const electronMesh = new THREE.InstancedMesh(
      new THREE.SphereGeometry(electronSize, 8, 8),
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
      const radius = (outerRadius * (index + 1)) / shells.length;
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