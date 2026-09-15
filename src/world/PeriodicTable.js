import * as THREE from "three";
import { ELEMENTS } from "../data/elements.js";
import { ElementBlock } from "./ElementBlock.js";

export class PeriodicTable {
  constructor(options = {}) {
    this.group = new THREE.Group();
    this.blocks = ELEMENTS.map((element) => {
      const block = new ElementBlock(element, options);
      this.group.add(block);
      return block;
    });
    this.hovered = null;
  }

  getBlockAt(pointer, raycaster, camera) {
    raycaster.setFromCamera(pointer, camera);
    const meshes = this.blocks.map((block) => block.cube);
    const hits = raycaster.intersectObjects(meshes, false);
    if (hits.length === 0) return null;
    return hits[0].object.userData.block;
  }

  setHovered(block) {
    if (block === this.hovered) return;
    if (this.hovered) this.hovered.setHovered(false);
    this.hovered = block;
    if (block) block.setHovered(true);
  }
}