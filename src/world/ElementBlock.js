import * as THREE from "three";
import { CATEGORY_COLORS } from "../data/elements.js";
import { Atom } from "./Atom.js";

export class ElementBlock extends THREE.Group {
  constructor(element, { size = 1, spacing = 1.4 } = {}) {
    super();
    this.element = element;

    const color = CATEGORY_COLORS[element.category];
    const glass = new THREE.MeshStandardMaterial({
      color,
      transparent: true,
      opacity: 0.15,
      roughness: 0.15,
      metalness: 0.1,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const label = new THREE.MeshStandardMaterial({
      map: this.createLabelTexture(),
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      roughness: 0.3,
    });

    const geometry = new THREE.BoxGeometry(size, size, size);
    this.cube = new THREE.Mesh(geometry, [
      glass,
      glass,
      glass,
      glass,
      label,
      glass,
    ]);
    this.cube.userData.block = this;
    this.add(this.cube);

    const edges = new THREE.EdgesGeometry(geometry);
    this.outline = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.85 }),
    );
    this.add(this.outline);

    this.add(new Atom(element, { outerRadius: 0.42 }));

    this.position.set(
      (element.group - 10) * spacing,
      (5 - element.period) * spacing,
      0,
    );
  }

  createLabelTexture() {
    const color = CATEGORY_COLORS[this.element.category];
    const css = `#${color.toString(16).padStart(6, "0")}`;
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");

    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.font = "bold 40px sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fillText(String(this.element.number), 32, 28);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 92px sans-serif";
    ctx.fillStyle = css;
    ctx.fillText(this.element.symbol, 128, 120);

    ctx.font = "20px sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillText(this.element.name.toUpperCase(), 128, 200);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    return texture;
  }

  setHovered(active) {
    this.scale.setScalar(active ? 1.15 : 1);
    this.outline.material.opacity = active ? 1 : 0.85;
  }
}