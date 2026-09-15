import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export class SceneManager {
  constructor(
    container,
    { cameraPosition, target } = {},
  ) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f1120);

    this.camera = new THREE.PerspectiveCamera(
      40,
      window.innerWidth / window.innerHeight,
      0.1,
      200,
    );
    this.camera.position.copy(
      cameraPosition ?? new THREE.Vector3(0, 3.5, 20),
    );

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.copy(target ?? new THREE.Vector3(0, 0, 0));
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enableZoom = true;
    this.controls.zoomSpeed = 1.2;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 60;
    this.controls.enableRotate = false;
    this.controls.mouseButtons.LEFT = THREE.MOUSE.PAN;
    this.controls.mouseButtons.MIDDLE = THREE.MOUSE.DOLLY;
    this.controls.mouseButtons.RIGHT = THREE.MOUSE.PAN;

    this.addLights();

    window.addEventListener("resize", () => this.onResize());
  }

  addLights() {
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(5, 10, 7);
    this.scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0x8899ff, 1.2);
    rimLight.position.set(-5, -3, -8);
    this.scene.add(rimLight);
  }

  onResize() {
    const active = this.view || this;
    active.camera.aspect = window.innerWidth / window.innerHeight;
    active.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  setView(view) {
    this.view = view;
    this.controls.enabled = !view;
  }

  start(onFrame) {
    const animate = () => {
      requestAnimationFrame(animate);
      const active = this.view || this;
      this.controls.update();
      if (active.update) active.update();
      if (onFrame) onFrame();
      this.renderer.render(active.scene || active, active.camera);
    };
    animate();
  }
}