import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export function createRenderer(canvas, container) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.SRGBColorSpace;
  return renderer;
}

export function createCamera(container) {
  const aspect = container.clientWidth / container.clientHeight;
  const zoom = 25;

  const camera = new THREE.OrthographicCamera(
    container.clientWidth / -zoom,
    container.clientWidth / zoom,
    container.clientHeight / zoom,
    container.clientHeight / -zoom,
    0.1, 1000
  );
  camera.position.set(-180, 60, 20);
  camera.lookAt(0, 0, 0);
  return camera;
}

export function setupControls(camera, domElement) {
  const controls = new OrbitControls(camera, domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;
  controls.zoomSpeed = 1;
  controls.target.set(0, 0, 0);
  controls.update();
  return controls;
}
