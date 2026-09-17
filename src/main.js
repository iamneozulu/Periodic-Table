import * as THREE from "three";
import { ELEMENT_DATA } from "./data/elementData.js";
import { SceneManager } from "./three/SceneManager.js";
import { PeriodicTable } from "./world/PeriodicTable.js";
import { ElementViewer } from "./world/ElementViewer.js";
import { HUD } from "./ui/HUD.js";

const SPACING = 1.4;
const SIZE = 1;

const hydrogen = ELEMENT_DATA.find((element) => element.number === 1);
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

function flyToElement(element, onComplete) {
  const block = table.blocks.find((b) => b.element.number === element.number);
  if (!block) return onComplete?.();
  sceneManager.flyTo(block.position, onComplete);
}

function flyToPosition(position) {
  sceneManager.flyTo(position);
}

function getBlockForElement(element) {
  return table.blocks.find((b) => b.element.number === element.number);
}

// ── Category filter ──
function clearFilter() {
  if (!table.activeCategory) return;
  table.clearFilter();
  hud.setActiveCategory(null);
}

hud.onCategoryClick = (category) => {
  const center = table.filterCategory(category);
  if (center) {
    hud.setActiveCategory(category);
    flyToPosition(center);
  } else {
    hud.setActiveCategory(null);
  }
};

// ── Search ──
const searchInput = document.getElementById("search");
const searchResults = document.getElementById("search-results");
const searchRowEls = [];
let searchActiveIndex = 0;

function searchElements(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return ELEMENT_DATA.filter(
    (el) =>
      el.name.toLowerCase().startsWith(q) ||
      el.symbol.toLowerCase().startsWith(q) ||
      String(el.number) === q,
  ).slice(0, 8);
}

function selectSearchResult(el) {
  searchInput.value = "";
  searchResults.classList.remove("open");
  searchInput.blur();
  clearFilter();
  flyToElement(el);
}

function setActiveSearchIndex(index) {
  searchActiveIndex = index;
  searchRowEls.forEach((row, i) => row.classList.toggle("active", i === index));
  const row = searchRowEls[searchActiveIndex];
  if (row) row.scrollIntoView({ block: "nearest" });
}

function renderSearchResults(results) {
  searchResults.innerHTML = "";
  searchRowEls.length = 0;
  if (results.length === 0) {
    searchResults.classList.remove("open");
    return;
  }
  searchResults.classList.add("open");
  for (const el of results) {
    const row = document.createElement("div");
    row.className = "result";
    row.innerHTML = `<span class="sym">${el.symbol}</span><span class="nm">${el.name} (${el.number})</span>`;
    row.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      selectSearchResult(el);
    });
    row.addEventListener("pointerenter", () => {
      setActiveSearchIndex(searchRowEls.indexOf(row));
    });
    searchRowEls.push(row);
    searchResults.appendChild(row);
  }
  setActiveSearchIndex(0);
}

searchInput.addEventListener("input", () => {
  renderSearchResults(searchElements(searchInput.value));
});

searchInput.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown" && searchRowEls.length > 0) {
    e.preventDefault();
    setActiveSearchIndex((searchActiveIndex + 1) % searchRowEls.length);
  } else if (e.key === "ArrowUp" && searchRowEls.length > 0) {
    e.preventDefault();
    setActiveSearchIndex(
      (searchActiveIndex - 1 + searchRowEls.length) % searchRowEls.length,
    );
  } else if (e.key === "Enter" && searchRowEls.length > 0) {
    e.preventDefault();
    selectSearchResult(searchElements(searchInput.value)[searchActiveIndex]);
  } else if (e.key === "Escape") {
    searchInput.value = "";
    searchResults.classList.remove("open");
    searchInput.blur();
  }
});

searchInput.addEventListener("blur", () => {
  setTimeout(() => searchResults.classList.remove("open"), 150);
});

// ── Random picker ──
const randomButton = document.getElementById("random");
randomButton.addEventListener("click", () => {
  clearFilter();
  const element = ELEMENT_DATA[Math.floor(Math.random() * ELEMENT_DATA.length)];
  flyToElement(element);
});

// ── Hover ──
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

// ── Click → fly → open viewer ──
window.addEventListener("pointerdown", (event) => {
  if (
    event.target === searchInput ||
    searchResults.contains(event.target) ||
    event.target.closest("#random")
  ) {
    return;
  }
  pointerDown = { x: event.clientX, y: event.clientY };
});

window.addEventListener("pointerup", (event) => {
  if (viewer || !pointerDown) return;
  const moved = Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y);
  pointerDown = null;
  if (moved > 6) return;

  if (table.activeCategory && !event.target.closest("#legend")) clearFilter();

  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  const block = table.getBlockAt(pointer, raycaster, sceneManager.camera);
  if (block) {
    flyToElement(block.element, () => openViewer(block.element));
  }
});

let loaderHidden = false;
sceneManager.start(() => {
  if (loaderHidden) return;
  loaderHidden = true;
  const loader = document.getElementById("loader");
  if (loader) loader.classList.add("hidden");
});
