import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const canvas = document.getElementById("halferthCanvas");

const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const camera = new THREE.OrthographicCamera(
  window.innerWidth / -25,
  window.innerWidth / 25,
  window.innerHeight / 25,
  window.innerHeight / -25,
  0.1,
  1000
);
camera.position.set(-180, 60, 20);
camera.lookAt(0, 0, 0);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.1;
controls.zoomSpeed = 1;
controls.target.set(0, 0, 0); // optional, keeps camera controls centered
controls.update();

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

let totalSpin = 0;
let fullSpins = 0;
let previousTime = 0;
let orbitAngle = 0;

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
const sunlight = new THREE.PointLight(0xffffff, 1000, 100);
sunlight.position.set(0, 0, 0); // center of the sun
scene.add(sunlight);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.03);
scene.add(ambientLight);

// === Sol South Arrow ===
const solSouthDirection = new THREE.Vector3(0, 1, 0);
const solSouthOrigin = new THREE.Vector3(0, centerY + 5, 0);
const solSouthArrow = new THREE.ArrowHelper(solSouthDirection, solSouthOrigin, 8, 0xffff00, 1.5, 0.75);
scene.add(solSouthArrow);

// === Sol South Label ===
const solLabel = document.createElement('div');
solLabel.style.position = 'absolute';
solLabel.style.color = 'red';
solLabel.style.fontSize = '12px';
solLabel.style.fontWeight = 'bold';
solLabel.innerHTML = 'S<br>O<br>U<br>T<br>H';
document.body.appendChild(solLabel);

const solLabelPos = new THREE.Vector3(0, 11, 0);
const spinCounter = document.createElement('div');
spinCounter.style.position = 'absolute';
spinCounter.style.top = '10px';
spinCounter.style.left = '10px';
spinCounter.style.color = 'white';
spinCounter.style.fontSize = '16px';
spinCounter.style.backgroundColor = 'rgba(0,0,0,0.5)';
spinCounter.style.padding = '5px';
spinCounter.innerHTML = 'Spins: 0';
document.body.appendChild(spinCounter);

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
  { label: 'NF<br>Equinox', angle: 0,     color: 0x00ff00 }, // green
  { label: 'LN', angle: 60,    color: 0x0000ff }, // blue
  { label: 'TLN<br>Solstice', angle: 90,    color: 0xff0000 }, // red
  { label: 'NS', angle: 120,   color: 0x0000ff }, // blue
  { label: 'DS<br>Z Axis', angle: 180,   color: 0x00ff00 }, // green
  { label: 'LD', angle: 240,   color: 0xffff00 }, // yellow
  { label: 'TLD<br>X Axis', angle: 270,    color: 0xff0000 }, // red
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

// === Halferth ===
const planetGeometry = new THREE.SphereGeometry(2, 32, 32);
const textureLoader = new THREE.TextureLoader();
const halferthTexture = textureLoader.load('/textures/halferth.png');

// Rotate texture 90° (π/2 radians)
halferthTexture.center.set(0.5, 0.5);
halferthTexture.rotation = Math.PI / 2;

const planetMaterial = new THREE.MeshPhongMaterial({
  map: halferthTexture,
  shininess: 10
});

const planet = new THREE.Mesh(planetGeometry, planetMaterial);
planet.rotation.z = THREE.MathUtils.degToRad(12.5);
scene.add(planet);
planet.castShadow = true;
planet.receiveShadow = true;
sun.receiveShadow = true;

// === Axis Line Through Planet (Polar Axis) ===
const axisLength = 10;
const axisMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 }); // red
const axisPoints = [
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(0, axisLength / 2, 0),
];
const axisGeometry = new THREE.BufferGeometry().setFromPoints(axisPoints);
const axisLine = new THREE.Line(axisGeometry, axisMaterial);

// Group the planet and its axis line
const planetGroup = new THREE.Group();
planetGroup.add(axisLine);

// New group to spin the planet
const spinningGroup = new THREE.Group();
spinningGroup.add(planet);
planetGroup.add(spinningGroup); // swap: planet → spinningGroup inside planetGroup


// Apply axial tilt: rotate 12.5° around Z-axis
planetGroup.rotation.x = THREE.MathUtils.degToRad(12.5);

// Move the group to its orbital position
planetGroup.position.set(ORBIT_RADIUS, centerY, 0);

// === Orbit Group (for planetary revolution) ===
const orbitGroup = new THREE.Group();
orbitGroup.add(planetGroup);
scene.add(orbitGroup);

// === Animate ===
function updateLabelPosition() {
  const coords = solLabelPos.clone().project(camera);
  solLabel.style.left = `${(coords.x * 0.5 + 0.5) * window.innerWidth}px`;
  solLabel.style.top = `${(-coords.y * 0.5 + 0.5) * window.innerHeight}px`;
}


let labelUpdateThrottle = 0;

let previousTimestamp = 0;

// === Moon Parameters ===
const moonTextureLoader = new THREE.TextureLoader();
const motherTexture = moonTextureLoader.load('/textures/mother.png');
const daughterTexture = moonTextureLoader.load('/textures/daughter.png');

const MOTHER_ORBIT_DAYS = 70;
const DAUGHTER_ORBIT_DAYS = 35;
const MOTHER_ECCENTRICITY = 0.35;
const DAUGHTER_ECCENTRICITY = 0.3;

const MOTHER_SMA = 7.0; // semi-major axis (display units)
const DAUGHTER_SMA = MOTHER_SMA * (413000 / 656000); // scaled down
const MOTHER_SMI = MOTHER_SMA * Math.sqrt(1 - MOTHER_ECCENTRICITY ** 2); // semi-minor
const DAUGHTER_SMI = DAUGHTER_SMA * Math.sqrt(1 - DAUGHTER_ECCENTRICITY ** 2);

const MOTHER_RADIUS = 1;
const DAUGHTER_RADIUS = 0.6;

// === Tilted Moon Orbit Group ===
const moonOrbitGroup = new THREE.Group();
moonOrbitGroup.rotation.z = THREE.MathUtils.degToRad(12.5);
planetGroup.add(moonOrbitGroup);

// === Mother Moon ===
const motherGeometry = new THREE.SphereGeometry(MOTHER_RADIUS, 32, 32);
const motherMaterial = new THREE.MeshPhongMaterial({ map: motherTexture });
const mother = new THREE.Mesh(motherGeometry, motherMaterial);
mother.castShadow = true;
mother.receiveShadow = true;

const motherGroup = new THREE.Group();
motherGroup.add(mother);
moonOrbitGroup.add(motherGroup);

// === Daughter Moon ===
const daughterGeometry = new THREE.SphereGeometry(DAUGHTER_RADIUS, 32, 32);
const daughterMaterial = new THREE.MeshPhongMaterial({ map: daughterTexture });
const daughter = new THREE.Mesh(daughterGeometry, daughterMaterial);
daughter.castShadow = true;
daughter.receiveShadow = true;

const daughterGroup = new THREE.Group();
daughterGroup.add(daughter);
moonOrbitGroup.add(daughterGroup);

// === Orbit Tracking Angles ===
let motherAngle = 0;
let daughterAngle = 0;


function animate(currentTime) {
  requestAnimationFrame(animate);

  if (!previousTimestamp) {
    previousTimestamp = currentTime;
    return; // Skip first frame to avoid large delta
  }

  const delta = (currentTime - previousTimestamp) / 1000;
  previousTimestamp = currentTime;

  // Orbit: 2π radians per full orbit → 0.0001 rad/frame (approx) → ~62.8 seconds per orbit
  const orbitSpeed = (2 * Math.PI) / 62.8; // ~0.1 rad/sec
  orbitAngle += orbitSpeed * delta;
  const x = ORBIT_RADIUS * Math.cos(orbitAngle);
  const z = ORBIT_RADIUS * Math.sin(orbitAngle);
  planetGroup.position.set(x, 0, z);

  // Spin: 420 rotations per orbit → 420 × 2π radians
  const spinSpeed = orbitSpeed * 420; // rad/sec
  const spinStep = spinSpeed * delta;
  spinningGroup.rotation.y -= spinStep;

  totalSpin += spinStep;
  if (totalSpin >= Math.PI * 2) {
    const spinsThisFrame = Math.floor(totalSpin / (Math.PI * 2));
    fullSpins += spinsThisFrame;
    totalSpin %= (Math.PI * 2);
  }


  const currentDay = fullSpins % 420;
spinCounter.innerHTML = `Days: ${currentDay}`;

// === Update Moons ===
const spinFraction = fullSpins + totalSpin / (2 * Math.PI);
const angleOffset = -Math.PI;

// Angles based on spin-driven day count
const motherAngle = (spinFraction / MOTHER_ORBIT_DAYS) * 2 * Math.PI + angleOffset;
const daughterAngle = (spinFraction / DAUGHTER_ORBIT_DAYS) * 2 * Math.PI + angleOffset;

// Elliptical orbit positions (along planet's Y-axis plane)
const MOTHER_FOCUS_OFFSET = MOTHER_SMA * MOTHER_ECCENTRICITY;
const DAUGHTER_FOCUS_OFFSET = DAUGHTER_SMA * DAUGHTER_ECCENTRICITY;

const motherX = MOTHER_SMI * Math.cos(motherAngle);
const motherY = MOTHER_SMA * Math.sin(motherAngle) + MOTHER_FOCUS_OFFSET;
mother.position.set(motherX, motherY, 0);

const daughterX = DAUGHTER_SMI * Math.cos(daughterAngle);
const daughterY = DAUGHTER_SMA * Math.sin(daughterAngle) + DAUGHTER_FOCUS_OFFSET;
daughter.position.set(daughterX, daughterY, 0);


  if (++labelUpdateThrottle % 2 === 0) {
    labelElements.forEach(({ element, position }) => {
      const coords = position.clone().project(camera);
      element.style.left = `${(coords.x * 0.5 + 0.5) * window.innerWidth}px`;
      element.style.top = `${(-coords.y * 0.5 + 0.5) * window.innerHeight}px`;
    });
    updateSolLabel();
  }

  controls.update();
  renderer.render(scene, camera);
}


const zoomFactor = 30; // Same as in camera constructor

window.addEventListener('resize', () => {
  const aspect = window.innerWidth / window.innerHeight;

  camera.left = window.innerWidth / -zoomFactor;
  camera.right = window.innerWidth / zoomFactor;
  camera.top = window.innerHeight / zoomFactor;
  camera.bottom = window.innerHeight / -zoomFactor;

  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});


function updateSolLabel() {
  const coords = solLabelPos.clone().project(camera);
  solLabel.style.left = `${(coords.x * 0.5 + 0.5) * window.innerWidth}px`;
  solLabel.style.top = `${(-coords.y * 0.5 + 0.5) * window.innerHeight}px`;
}


animate();
