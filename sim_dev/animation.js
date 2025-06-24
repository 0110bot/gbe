import * as THREE from 'three';

// === Animation Helper Functions ===

function updateOffscreenCanvas(renderer, target, offscreenCanvas, imageData) {
  const ctx = offscreenCanvas.getContext('2d');
  renderer.readRenderTargetPixels(target, 0, 0, imageData.width, imageData.height, imageData.data);
  ctx.putImageData(imageData, 0, 0);
}
function updatePlanetAndMoons(state, simObjects, config, delta) {
  const orbitSpeed = (2 * Math.PI) / config.ANIMATION_ORBIT_PERIOD_SECONDS;
  if (delta > 0) {
    state.orbitAngle += orbitSpeed * delta;
  }
  const x = config.ORBIT_RADIUS * Math.cos(state.orbitAngle);
  const z = config.ORBIT_RADIUS * Math.sin(state.orbitAngle);
  simObjects.planetGroup.position.set(x, 0, z);
  const spinSpeed = orbitSpeed * config.HALFERTH_YEAR_DAYS;
  const spinStep = spinSpeed * delta;
  simObjects.spinningGroup.rotation.y -= spinStep;
  state.totalSpin += spinStep;
  if (state.totalSpin >= Math.PI * 2) {
    const spinsThisFrame = Math.floor(state.totalSpin / (Math.PI * 2));
    state.fullSpins += spinsThisFrame;
    state.totalSpin %= (Math.PI * 2);
  }
  const spinFraction = state.fullSpins + state.totalSpin / (2 * Math.PI);
  const angleOffset = -Math.PI;
  const motherAngle = (spinFraction / config.MOTHER.ORBIT_DAYS) * 2 * Math.PI + angleOffset;
  const motherX = config.MOTHER.SEMI_MINOR_AXIS * Math.cos(motherAngle);
  const motherY = config.MOTHER.SEMI_MAJOR_AXIS * Math.sin(motherAngle) + config.MOTHER.FOCUS_OFFSET;
  simObjects.mother.position.set(motherX, motherY, 0);
  const daughterAngle = (spinFraction / config.DAUGHTER.ORBIT_DAYS) * 2 * Math.PI + angleOffset;
  const daughterX = config.DAUGHTER.SEMI_MINOR_AXIS * Math.cos(daughterAngle);
  const daughterY = config.DAUGHTER.SEMI_MAJOR_AXIS * Math.sin(daughterAngle) + config.DAUGHTER.FOCUS_OFFSET;
  simObjects.daughter.position.set(daughterX, daughterY, 0);
  const motherAngleToCenter = Math.atan2(simObjects.mother.position.y, simObjects.mother.position.x);
  const daughterAngleToCenter = Math.atan2(simObjects.daughter.position.y, simObjects.daughter.position.x);
  simObjects.mother.rotation.z = motherAngleToCenter + Math.PI;
  simObjects.daughter.rotation.z = daughterAngleToCenter + Math.PI;
  state.motherOrbitalAngle = motherAngle;
  state.daughterOrbitalAngle = daughterAngle;
}

function updateLabelPositions(state, simObjects, camera, container) {
  if (++state.labelUpdateThrottle % 2 === 0) {
    const rect = container.getBoundingClientRect();
    simObjects.labelElements.forEach(({ element, position }) => {
      const coords = position.clone().project(camera);
      element.style.left = `${(coords.x * 0.5 + 0.5) * rect.width + rect.left}px`;
      element.style.top = `${(-coords.y * 0.5 + 0.5) * rect.height + rect.top}px`;
    });
  }
}

function updateUIElements(state, simObjects, uiElements, config, seasons, sharedState, camera) {
  const currentDay = (state.fullSpins % config.HALFERTH_YEAR_DAYS) + 1;
  const seasonIndex = Math.floor((currentDay - 1) / 70);
  const monthDay = ((currentDay - 1) % 35) + 1;
  const isLow = ((currentDay - 1) % 70) < 35;
  const season = seasons[seasonIndex] || "Unknown";
  const civicMonth = `${isLow ? "Low" : "High"} ${season}`;
  uiElements.spinCounter.innerHTML = `
    Day of Halferth Year: ${currentDay}<br>
    Season: ${season}<br>
    Date: Day ${monthDay} of ${civicMonth}
  `;
  uiElements.daySlider.value = currentDay;

  const motherWorldPos = new THREE.Vector3();
  simObjects.mother.getWorldPosition(motherWorldPos);

  const daughterWorldPos = new THREE.Vector3();
  simObjects.daughter.getWorldPosition(daughterWorldPos);
  
  sharedState.motherY = motherWorldPos.y;
  sharedState.daughterY = daughterWorldPos.y;
  
  sharedState.motherAngle = THREE.MathUtils.radToDeg(Math.atan2(simObjects.mother.position.y, simObjects.mother.position.x));
  sharedState.daughterAngle = THREE.MathUtils.radToDeg(Math.atan2(simObjects.daughter.position.y, simObjects.daughter.position.x));
  sharedState.fullSpins = state.fullSpins;
  sharedState.totalSpin = state.totalSpin;
  sharedState.calendarDay = currentDay;
  sharedState.motherOrbitalAngle = state.motherOrbitalAngle;
  sharedState.daughterOrbitalAngle = state.daughterOrbitalAngle;
}

function updateTrails(state, simObjects, config) {
    function updateTrailPoint(mesh, positions, index, pointsObject) {
        const pos = new THREE.Vector3();
        mesh.getWorldPosition(pos);
        positions.set([pos.x, pos.y, pos.z], index * 3);
        pointsObject.geometry.attributes.position.needsUpdate = true;
        return (index + 1) % config.MAX_TRAIL_POINTS;
    }
    if (state.trailEnabled) {
        state.motherTrailIndex = updateTrailPoint(simObjects.mother, state.motherTrailPositions, state.motherTrailIndex, simObjects.motherTrailLine);
        state.daughterTrailIndex = updateTrailPoint(simObjects.daughter, state.daughterTrailPositions, state.daughterTrailIndex, simObjects.daughterTrailLine);
    }
}

// === Main Animation Controller ===

export function startAnimation(dependencies) {
  const { renderer, scene, camera, controls, simObjects, uiElements, state, config, seasons, sharedState, container } = dependencies;
  
  let previousTimestamp = 0;

function animate(currentTime) {
  requestAnimationFrame(animate);
  controls.update();

  updateLabelPositions(state, simObjects, camera, container);

  if (!state.isPaused || state.needsManualUpdate) {

    let delta = 0; 
    if (!state.isPaused) {
      if (state.pauseStart > 0) {
        const pausedDuration = currentTime - state.pauseStart;
        previousTimestamp += pausedDuration;
        state.pauseStart = 0;
      }
      if (!previousTimestamp) {
        previousTimestamp = currentTime;
      }
      delta = ((currentTime - previousTimestamp) / 1000) * state.animationSpeedMultiplier;
      previousTimestamp = currentTime;
    }

    if (state.needsManualUpdate) {
      state.needsManualUpdate = false;
    }

    state.bitmapUpdateCounter++;
if (state.bitmapUpdateCounter % 10 === 0) {
  updateOffscreenCanvas(renderer, simObjects.motherTarget, sharedState.motherCanvas, state.motherImageData);
  updateOffscreenCanvas(renderer, simObjects.daughterTarget, sharedState.daughterCanvas, state.daughterImageData);
}
    updatePlanetAndMoons(state, simObjects, config, delta);
    updateUIElements(state, simObjects, uiElements, config, seasons, sharedState, camera);
    updateTrails(state, simObjects, config);

    scene.traverse(obj => obj.layers.disable(1));
    renderer.setRenderTarget(simObjects.motherTarget);
    scene.traverse(obj => obj === simObjects.mother && obj.layers.enable(1));
    renderer.render(scene, simObjects.motherCam);
    renderer.setRenderTarget(simObjects.daughterTarget);
    scene.traverse(obj => obj === simObjects.daughter && obj.layers.enable(1));
    renderer.render(scene, simObjects.daughterCam);
    renderer.setRenderTarget(null);
    scene.traverse(obj => obj.layers.enable(0));
  }

  renderer.render(scene, camera);
}
  animate(0);
}