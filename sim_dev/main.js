import * as THREE from 'three';

// === Import Modules ===
import { CONFIG, SEASONS } from './config.js';
import { createRenderer, createCamera, setupControls } from './setupThree.js';
import { createUI } from './ui.js';
import { createSceneObjects } from './objects.js';
import { startAnimation } from './animation.js';

// === Basic Setup ===
const canvas = document.getElementById("halferthCanvas");
const container = document.getElementById("mainSimPanel");
const labelContainer = document.getElementById('labelContainer');
const sharedState = window.sharedState;

const scene = new THREE.Scene();
const renderer = createRenderer(canvas, container);
const camera = createCamera(container);
const controls = setupControls(camera, renderer.domElement);

// === Simulation State ===
const simulationState = {
  needsManualUpdate: false,
  totalSpin: 0,
  fullSpins: 0,
  labelUpdateThrottle: 0,
  orbitAngle: 0,
  isPaused: false,
  pauseStart: 0,
  trailEnabled: false,
  motherTrailPositions: new Float32Array(CONFIG.MAX_TRAIL_POINTS * 3),
  daughterTrailPositions: new Float32Array(CONFIG.MAX_TRAIL_POINTS * 3),
  motherTrailIndex: 0,
  daughterTrailIndex: 0,
  bitmapUpdateCounter: 0,
  animationSpeedMultiplier: 1,
  motherImageData: new ImageData(1024, 1024),
  daughterImageData: new ImageData(1024, 1024),
 };

// === UI Callbacks ===
const uiCallbacks = {
  onPauseClick: () => {
    simulationState.isPaused = !simulationState.isPaused;
    sharedState.isPaused = simulationState.isPaused;
    const pauseButton = uiElements.pauseButton; // Get button from uiElements
    if (simulationState.isPaused) {
      simulationState.pauseStart = performance.now();
      pauseButton.textContent = 'Resume Orbital Motion';
    } else {
      pauseButton.textContent = 'Pause Orbital Motion';
    }
  },
  onTrailsToggle: (enabled) => {
    simulationState.trailEnabled = enabled;
    if (!simulationState.trailEnabled) {
      simulationState.motherTrailPositions.fill(0);
      simulationState.daughterTrailPositions.fill(0);
      simulationState.motherTrailIndex = 0;
      simulationState.daughterTrailIndex = 0;
      simObjects.motherTrailLine.geometry.setDrawRange(0, 0);
      simObjects.daughterTrailLine.geometry.setDrawRange(0, 0);
      simObjects.motherTrailLine.geometry.attributes.position.needsUpdate = true;
      simObjects.daughterTrailLine.geometry.attributes.position.needsUpdate = true;
    }
  },
  onLinesToggle: (visible) => {
    simObjects.orbitRing.visible = visible;
    simObjects.axisLine.visible = visible;
    simObjects.seasonalLines.forEach(line => line.visible = visible);
  },
  onLabelsToggle: (visible) => {
    labelContainer.classList.toggle('labels-hidden', !visible);
  },
  onSpeedChange: (speed) => {
    simulationState.animationSpeedMultiplier = speed;
  },
  onDaySliderChange: (dayValue) => {
  const day = parseInt(dayValue, 10);
  simulationState.fullSpins = day - 1;
  simulationState.totalSpin = 0;
  simulationState.orbitAngle = (day / CONFIG.HALFERTH_YEAR_DAYS) * (2 * Math.PI);
  simulationState.needsManualUpdate = true; 
}
};

// === Initialize Modules ===
const uiElements = createUI(CONFIG, uiCallbacks);
const simObjects = createSceneObjects(scene, CONFIG, labelContainer);

simObjects.motherTrailLine.geometry.setAttribute('position', new THREE.BufferAttribute(simulationState.motherTrailPositions, 3));
simObjects.daughterTrailLine.geometry.setAttribute('position', new THREE.BufferAttribute(simulationState.daughterTrailPositions, 3));

// === Start Simulation ===
startAnimation({
  renderer,
  scene,
  camera,
  controls,
  simObjects,
  uiElements,
  state: simulationState,
  config: CONFIG,
  seasons: SEASONS,
  sharedState,
  container
});

// === Event Listeners ===
window.addEventListener('resize', () => {
  const aspect = container.clientWidth / container.clientHeight;
  const zoomFactor = 30;
  camera.left = container.clientWidth / -zoomFactor;
  camera.right = container.clientWidth / zoomFactor;
  camera.top = container.clientHeight / zoomFactor;
  camera.bottom = container.clientHeight / -zoomFactor;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
});

window.dispatchEvent(new Event('resize'));