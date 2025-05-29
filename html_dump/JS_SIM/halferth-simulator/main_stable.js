import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const canvas = document.getElementById("halferthCanvas");

const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 10, 40);
camera.lookAt(0, 0, 0);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.1;
controls.zoomSpeed = 1;

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

// === Constants ===
const ORBIT_RADIUS = 30;
const centerY = 0;

// === Sun ===
const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
sun.position.set(0, centerY, 0);
scene.add(sun);

// === Light ===
const sunlight = new THREE.PointLight(0xffffff, 4, 300);
sunlight.position.set(0, centerY, 0);
scene.add(sunlight);
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

// === Sol South Arrow ===
const solSouthDirection = new THREE.Vector3(0, 1, 0);
const solSouthOrigin = new THREE.Vector3(0, centerY + 5, 0);
const solSouthArrow = new THREE.ArrowHelper(solSouthDirection, solSouthOrigin, 10, 0xff0000, 1.5, 0.75);
scene.add(solSouthArrow);

// === Sol South Label ===
const solLabel = document.createElement('div');
solLabel.style.position = 'absolute';
solLabel.style.color = 'red';
solLabel.style.fontSize = '16px';
solLabel.style.fontWeight = 'bold';
solLabel.innerHTML = 'Sol South';
document.body.appendChild(solLabel);

const solLabelPos = new THREE.Vector3(0, 15, 0);

// === Orbital Ring ===
const arcPoints = [];
const segmentCount = 128;
for (let i = 0; i <= segmentCount; i++) {
  const angle = (i / segmentCount) * Math.PI * 2;
  arcPoints.push(new THREE.Vector3(
    ORBIT_RADIUS * Math.cos(angle),
    centerY,
    ORBIT_RADIUS * Math.sin(angle)
  ));
}
const arcGeometry = new THREE.BufferGeometry().setFromPoints(arcPoints);
const arcMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
const orbitLine = new THREE.LineLoop(arcGeometry, arcMaterial);
scene.add(orbitLine);

// === Seasonal Spokes (S1–S6) ===
const seasonalSpokeData = [
  { label: 'NF', angle: 0,     color: 0x00ff00 }, // green
  { label: 'LN', angle: 60,    color: 0x0000ff }, // blue
  { label: 'TLN', angle: 90,    color: 0xff0000 }, // red
  { label: 'NS', angle: 120,   color: 0x0000ff }, // blue
  { label: 'DS', angle: 180,   color: 0x00ff00 }, // green
  { label: 'LD', angle: 240,   color: 0xffff00 }, // yellow
  { label: 'TLD', angle: 270,    color: 0xff0000 }, // red
  { label: 'DF', angle: 300,   color: 0xffff00 }, // yellow
];

const labelElements = [];

seasonalSpokeData.forEach(({ label, angle, color }) => {
  const rad = THREE.MathUtils.degToRad(angle);
  const x = ORBIT_RADIUS * Math.cos(rad);
  const z = ORBIT_RADIUS * Math.sin(rad);

  const points = [new THREE.Vector3(0, centerY, 0), new THREE.Vector3(x, centerY, z)];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color });
  const line = new THREE.Line(geometry, material);
  scene.add(line);

  // Create HTML label
  const div = document.createElement('div');
  div.style.position = 'absolute';
  div.style.color = 'white';
  div.style.fontSize = '14px';
  div.innerHTML = label;
  document.body.appendChild(div);
  labelElements.push({ element: div, position: new THREE.Vector3(x, centerY, z) });
});

// === Planet Test Body ===
const planetGeometry = new THREE.SphereGeometry(2, 32, 32);
const planetMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
const planet = new THREE.Mesh(planetGeometry, planetMaterial);
planet.rotation.z = THREE.MathUtils.degToRad(12.5);
planet.position.set(ORBIT_RADIUS, centerY, 0); // test pos
scene.add(planet);

// === Animate ===
function updateLabelPosition() {
  const coords = solLabelPos.clone().project(camera);
  solLabel.style.left = `${(coords.x * 0.5 + 0.5) * window.innerWidth}px`;
  solLabel.style.top = `${(-coords.y * 0.5 + 0.5) * window.innerHeight}px`;
}

function animate(time) {
  labelElements.forEach(({ element, position }) => {
    const coords = position.clone().project(camera);
    element.style.left = `${(coords.x * 0.5 + 0.5) * window.innerWidth}px`;
    element.style.top = `${(-coords.y * 0.5 + 0.5) * window.innerHeight}px`;
  });

  requestAnimationFrame(animate);
  planet.rotation.y += 0.01;
  controls.update();
  updateLabelPosition();
  renderer.render(scene, camera);
}

animate();
