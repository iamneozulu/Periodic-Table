import * as THREE from "three";
import { ELEMENTS, CATEGORY_COLORS } from "../data/elements.js";
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
    this.activeCategory = null;
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

  filterCategory(category) {
    if (this.activeCategory === category) {
      this.clearFilter();
      return null;
    }
    this.activeCategory = category;
    for (const block of this.blocks) {
      if (block.element.category === category) {
        block.setDimmed(false);
        block.setHighlighted(true);
      } else {
        block.setDimmed(true);
        block.setHighlighted(false);
      }
    }
    return this.getCategoryCenter(category);
  }

  clearFilter() {
    this.activeCategory = null;
    for (const block of this.blocks) {
      block.resetVisual();
    }
  }

  getCategoryCenter(category) {
    const matching = this.blocks.filter(
      (b) => b.element.category === category,
    );
    if (matching.length === 0) return new THREE.Vector3();
    const center = new THREE.Vector3();
    for (const block of matching) {
      center.add(block.position);
    }
    center.divideScalar(matching.length);
    return center;
  }
}