import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export class SceneManager {
  constructor(container) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f1120);

    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      200,
    );
    this.camera.position.set(0, 3.5, 20);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enableZoom = true;
    this.controls.zoomSpeed = 1.2;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 60;
    this.controls.enablePan = true;

    this.addLights();
    this.scene.add(new THREE.GridHelper(24, 24, 0x334b4b, 0x222636));

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
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  start(onFrame) {
    const animate = () => {
      requestAnimationFrame(animate);
      this.controls.update();
      if (onFrame) onFrame();
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }
}