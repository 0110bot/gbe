import { CONFIG } from './config.js';

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("simCanvas");
  const ctx = canvas.getContext("2d");

  const horizonImage = new Image();
  horizonImage.src = 'textures/horizon.png';

  function resizeCanvas() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  function wrapAngle(angle) {
    return angle - (2 * Math.PI) * Math.floor((angle + Math.PI) / (2 * Math.PI));
  }

  function getCoordinatesOnEllipse(angle, ellipseParams) {
    const x = ellipseParams.centerX - ellipseParams.radiusX * Math.cos(angle);
    const y = ellipseParams.centerY - ellipseParams.radiusY * Math.sin(angle);
    return { x, y };
  }

  function drawMoon(imageSource, centerX, centerY, size, clipScale = 1, rotationAngle = 0) {
    if (!imageSource || !imageSource.width || !imageSource.height) return;
    const radius = size / 2;
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(-1, 1);
    ctx.rotate(rotationAngle + 3 * Math.PI / 2);
    ctx.beginPath();
    ctx.arc(0, 0, radius * clipScale, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(imageSource, -radius, -radius, size, size);
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const ellipseParams = {
        centerX: canvas.width / 2,
        centerY: canvas.height - 40,
        radiusX: (canvas.width / 2) * 0.95,
        radiusY: canvas.height * 0.75,
    };
    
    ctx.beginPath();
    ctx.ellipse(ellipseParams.centerX, ellipseParams.centerY, ellipseParams.radiusX, ellipseParams.radiusY, 0, 0, 2 * Math.PI); 
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 0;
    //ctx.stroke();

    const {
      motherCanvas,
      daughterCanvas,
      motherAngle,
      daughterAngle,
      motherOrbitalAngle,
      daughterOrbitalAngle,
    } = window.sharedState;

    // --- FINAL FIX ---
    // The rotational correction has been changed from 45 degrees to 12.5 degrees.
    const correctionValue = 12.5 * (Math.PI / 180);

    // --- Mother Moon Logic ---
    const wrappedMotherAngle = wrapAngle(motherOrbitalAngle);
    const correctedMotherAngle = wrappedMotherAngle + correctionValue;
    const motherCoords = getCoordinatesOnEllipse(correctedMotherAngle, ellipseParams);
    const motherRoll = ((Math.cos(motherAngle * Math.PI / 180) + 1) / 2) * Math.PI;
    drawMoon(motherCanvas, motherCoords.x, motherCoords.y, 60, 1.0, motherRoll);
    
    // --- Daughter Moon Logic ---
    const wrappedDaughterAngle = wrapAngle(daughterOrbitalAngle);
    const correctedDaughterAngle = wrappedDaughterAngle + correctionValue;
    const daughterCoords = getCoordinatesOnEllipse(correctedDaughterAngle, ellipseParams);
    const daughterRoll = ((Math.cos(daughterAngle * Math.PI / 180) + 1) / 2) * Math.PI;
    drawMoon(daughterCanvas, daughterCoords.x, daughterCoords.y, 45, 0.6, daughterRoll);

    // The Horizon Image is drawn LAST to appear on top of the moons.
    if (horizonImage.complete && horizonImage.naturalHeight !== 0) {
      const horizonY = canvas.height - (canvas.width * (horizonImage.naturalHeight / horizonImage.naturalWidth));
      ctx.drawImage(horizonImage, 0, horizonY, canvas.width, canvas.width * (horizonImage.naturalHeight / horizonImage.naturalWidth));
    }

    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
});