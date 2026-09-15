import * as THREE from "three";
import { SceneManager } from "./three/SceneManager.js";
import { PeriodicTable } from "./world/PeriodicTable.js";
import { HUD } from "./ui/HUD.js";

const sceneManager = new SceneManager(document.getElementById("app"));

const hud = new HUD();
hud.buildLegend();

const table = new PeriodicTable({ spacing: 1.4, size: 1 });
sceneManager.scene.add(table.group);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(1, 1);

window.addEventListener("pointermove", (event) => {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

  const block = table.getBlockAt(pointer, raycaster, sceneManager.camera);
  table.setHovered(block);

  document.body.style.cursor = block ? "pointer" : "default";
  if (block) {
    hud.updateInfo(block.element);
  } else {
    hud.reset();
  }
});

sceneManager.start();