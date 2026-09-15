import * as THREE from "three";
import { ELEMENTS } from "./data/elements.js";
import { SceneManager } from "./three/SceneManager.js";
import { PeriodicTable } from "./world/PeriodicTable.js";
import { ElementViewer } from "./world/ElementViewer.js";
import { HUD } from "./ui/HUD.js";

const SPACING = 1.4;
const SIZE = 1;

const hydrogen = ELEMENTS.find((element) => element.number === 1);
const hydrogenPosition = new THREE.Vector3(
  (hydrogen.group - 10) * SPACING,
  (5 - hydrogen.period) * SPACING,
  0,
);

const sceneManager = new SceneManager(document.getElementById("app"), {
  target: hydrogenPosition,
  cameraPosition: hydrogenPosition.clone().add(new THREE.Vector3(0, 0.8, 6)),
});

const hud = new HUD();
hud.buildLegend();

const table = new PeriodicTable({ spacing: SPACING, size: SIZE });
sceneManager.scene.add(table.group);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(1, 1);
let viewer = null;
let pointerDown = null;

function openViewer(element) {
  if (viewer) return;
  document.body.classList.add("viewing");
  viewer = new ElementViewer({
    element,
    domElement: sceneManager.renderer.domElement,
    onClose: () => {
      viewer.dispose();
      viewer = null;
      document.body.classList.remove("viewing");
      sceneManager.setView(null);
    },
  });
  sceneManager.setView(viewer);
}

window.addEventListener("pointermove", (event) => {
  if (viewer) return;

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

window.addEventListener("pointerdown", (event) => {
  pointerDown = { x: event.clientX, y: event.clientY };
});

window.addEventListener("pointerup", (event) => {
  if (viewer || !pointerDown) return;
  const moved = Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y);
  pointerDown = null;
  if (moved > 6) return;

  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  const block = table.getBlockAt(pointer, raycaster, sceneManager.camera);
  if (block) openViewer(block.element);
});

sceneManager.start();