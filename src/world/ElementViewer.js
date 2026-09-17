import * as THREE from "three";
import { CATEGORY_COLORS } from "../data/elementData.js";
import { ELEMENT_HISTORY } from "../data/elementFacts.js";
import { Atom } from "./Atom.js";

const BOX_SIZE = 4.5;
const WALL_OPACITY = 0.55;
const UP_AXIS = new THREE.Vector3(0, 1, 0);

export class ElementViewer extends THREE.Scene {
  constructor({ element, domElement, onClose }) {
    super();
    this.element = element;
    this.onClose = onClose;

    const color = CATEGORY_COLORS[element.category];
    this.background = new THREE.Color(color).multiplyScalar(0.6);

    this.content = new THREE.Group();
    const isMobile = window.innerWidth <= 720;
    if (isMobile) {
      this.content.position.set(1.5, 2.6, 0);
      this.content.scale.setScalar(0.55);
    } else {
      this.content.position.set(-1.7, 0, 0);
    }
    this.add(this.content);

    this.addLights();
    this.buildBox(element);
    this.content.add(new Atom(element, {
      outerRadius: 1.5,
      nucleusRadius: 0.22,
      nucleonSize: 0.072,
      electronSize: 0.045,
    }));

    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      300,
    );
    if (isMobile) {
      this.camera.position.set(1.5, 0.3, 11);
      this.camera.lookAt(new THREE.Vector3(1.5, 0.3, 0));
    } else {
      this.camera.position.set(1.5, 0, 10);
      this.camera.lookAt(new THREE.Vector3(1.5, 0, 0));
    }

    this.drag = { active: false, lastX: 0 };
    this.yawVelocity = 0;
    this.bindDragHandlers(domElement);

    this.buildOverlay();
  }

  addLights() {
    this.add(new THREE.AmbientLight(0xffffff, 0.9));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
    keyLight.position.set(2, 3, 4);
    this.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0x8899ff, 0.6);
    fillLight.position.set(-3, -1, -3);
    this.add(fillLight);
  }

  buildBox(element) {
    const color = CATEGORY_COLORS[element.category];
    const wallMaterial = new THREE.MeshStandardMaterial({
      color,
      transparent: true,
      opacity: WALL_OPACITY,
      roughness: 0.4,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });

    const half = BOX_SIZE / 2;
    const wallGeometry = new THREE.PlaneGeometry(BOX_SIZE, BOX_SIZE);

    const back = new THREE.Mesh(wallGeometry, wallMaterial);
    back.position.z = -half;
    this.content.add(back);

    const left = new THREE.Mesh(wallGeometry, wallMaterial);
    left.position.x = -half;
    left.rotation.y = Math.PI / 2;
    this.content.add(left);

    const right = new THREE.Mesh(wallGeometry, wallMaterial);
    right.position.x = half;
    right.rotation.y = -Math.PI / 2;
    this.content.add(right);

    const bottom = new THREE.Mesh(wallGeometry, wallMaterial);
    bottom.position.y = -half;
    bottom.rotation.x = -Math.PI / 2;
    this.content.add(bottom);

    const top = new THREE.Mesh(wallGeometry, wallMaterial);
    top.position.y = half;
    top.rotation.x = Math.PI / 2;
    this.content.add(top);

    const frame = new THREE.EdgesGeometry(new THREE.BoxGeometry(BOX_SIZE, BOX_SIZE, BOX_SIZE));
    const outline = new THREE.LineSegments(
      frame,
      new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.9 }),
    );
    this.content.add(outline);
  }

  buildOverlay() {
    const color = CATEGORY_COLORS[this.element.category];
    const css = `#${color.toString(16).padStart(6, "0")}`;
    const category = this.element.category
      .replace(/([A-Z])/g, " $1")
      .toLowerCase();
    const history =
      ELEMENT_HISTORY[this.element.number] ?? {
        discovered: "Discovery details not recorded.",
        fact: "Properties still under study.",
      };

    const panel = document.createElement("div");
    panel.className = "viewer-overlay";
    panel.setAttribute("data-element", this.element.symbol);
    panel.innerHTML = `
      <button class="viewer-close" type="button" title="Back to table">×</button>
      <div class="viewer-tile" style="border-color:${css}">
        <div class="viewer-symbol" style="color:${css}">${this.element.symbol}</div>
        <div class="viewer-number">${this.element.number}</div>
      </div>
      <h2 class="viewer-name">${this.element.name}</h2>
      <p class="viewer-category">${category} · ${this.element.name}</p>
      <div class="viewer-stats">
        <div class="viewer-stat"><span>Atomic number</span><b>${this.element.number}</b></div>
        <div class="viewer-stat"><span>Symbol</span><b>${this.element.symbol}</b></div>
        <div class="viewer-stat"><span>Period</span><b>${this.element.period}</b></div>
        <div class="viewer-stat"><span>Group</span><b>${this.element.group}</b></div>
        <div class="viewer-stat"><span>Protons</span><b>${this.element.number}</b></div>
        <div class="viewer-stat"><span>Neutrons</span><b>${this.element.neutrons ?? Math.round(this.element.number * 1.25)}</b></div>
        <div class="viewer-stat"><span>Electrons</span><b>${this.element.number}</b></div>
      </div>
      <div class="viewer-about">
        <div class="viewer-about-row">
          <span class="viewer-about-label">Discovery</span>
          <p>${history.discovered}</p>
        </div>
        <div class="viewer-about-row">
          <span class="viewer-about-label">Fun fact</span>
          <p>${history.fact}</p>
        </div>
      </div>
      <p class="viewer-hint">Drag to rotate the atom</p>
    `;

    panel.querySelector(".viewer-close").addEventListener("click", () => {
      this.onClose();
    });

    document.body.appendChild(panel);
    this.overlay = panel;
  }

  onPointerDown(event) {
    if (event.button !== 0) return;
    this.drag.active = true;
    this.drag.lastX = event.clientX;
    this.yawVelocity = 0;
    this.domElement.setPointerCapture(event.pointerId);
  }

  onPointerMove(event) {
    if (!this.drag.active) return;
    const dx = event.clientX - this.drag.lastX;
    this.drag.lastX = event.clientX;

    const speed = 0.005;
    this.content.rotateOnWorldAxis(UP_AXIS, dx * speed);
    this.yawVelocity = dx * speed;
  }

  onPointerUp(event) {
    if (!this.drag.active) return;
    this.drag.active = false;
    if (this.domElement.hasPointerCapture(event.pointerId)) {
      this.domElement.releasePointerCapture(event.pointerId);
    }
  }

  bindDragHandlers(domElement) {
    this.domElement = domElement;
    domElement.addEventListener("pointerdown", (e) => this.onPointerDown(e));
    domElement.addEventListener("pointermove", (e) => this.onPointerMove(e));
    domElement.addEventListener("pointerup", (e) => this.onPointerUp(e));
  }

  update() {
    if (!this.drag.active && Math.abs(this.yawVelocity) > 0.00001) {
      this.content.rotateOnWorldAxis(UP_AXIS, this.yawVelocity);
      this.yawVelocity *= 0.92;
    }
  }

  dispose() {
    this.drag.active = false;
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
  }
}