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

  function calculateVisibilityAngles(moonConfig) {
    const criticalAngle = Math.asin(-moonConfig.ECCENTRICITY);

    // --- MODIFIED ---
    // This selects the opposite (correct) half of the orbit to display.
    const riseAngle = criticalAngle;
    const setAngle = Math.PI - criticalAngle;
    
    const visibleDuration = setAngle - riseAngle;
    return { riseAngle, setAngle, visibleDuration };
  }

  const motherVisAngles = calculateVisibilityAngles(CONFIG.MOTHER);
  const daughterVisAngles = calculateVisibilityAngles(CONFIG.DAUGHTER);

  function getCoordinatesOnArc(normalizedAngle, arcParams) {
    const canvasAngle = normalizedAngle + Math.PI;
    const x = arcParams.centerX + arcParams.radiusX * Math.cos(canvasAngle);
    const y = arcParams.centerY + arcParams.radiusY * Math.sin(canvasAngle);
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

    ctx.beginPath();
    const horizontalRadius = (canvas.width / 2) * 0.95;
    const verticalRadius = canvas.height * 0.85;
    const yCenter = canvas.height - 10;
    
    ctx.ellipse(canvas.width / 2, yCenter, horizontalRadius, verticalRadius, 0, 0, 2 * Math.PI); 
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();

    const {
      motherCanvas,
      daughterCanvas,
      motherAngle,
      daughterAngle,
      motherOrbitalAngle,
      daughterOrbitalAngle,
    } = window.sharedState;

    const arcParams = {
      centerX: canvas.width / 2,
      centerY: yCenter,
      radiusX: horizontalRadius,
      radiusY: verticalRadius,
    };

    const wrappedMotherAngle = wrapAngle(motherOrbitalAngle);

    if (wrappedMotherAngle >= motherVisAngles.riseAngle && wrappedMotherAngle <= motherVisAngles.setAngle) {
      const progress = (wrappedMotherAngle - motherVisAngles.riseAngle) / motherVisAngles.visibleDuration;
      const normalizedAngle = progress * Math.PI;
      
      const coords = getCoordinatesOnArc(normalizedAngle, arcParams);
      const motherRoll = ((Math.cos(motherAngle * Math.PI / 180) + 1) / 2) * Math.PI;
      drawMoon(motherCanvas, coords.x, coords.y, 60, 1.0, motherRoll);
    }
    
    const wrappedDaughterAngle = wrapAngle(daughterOrbitalAngle);

    if (wrappedDaughterAngle >= daughterVisAngles.riseAngle && wrappedDaughterAngle <= daughterVisAngles.setAngle) {
      const progress = (wrappedDaughterAngle - daughterVisAngles.riseAngle) / daughterVisAngles.visibleDuration;
      const normalizedAngle = progress * Math.PI;

      const coords = getCoordinatesOnArc(normalizedAngle, arcParams);
      const daughterRoll = ((Math.cos(daughterAngle * Math.PI / 180) + 1) / 2) * Math.PI;
      drawMoon(daughterCanvas, coords.x, coords.y, 45, 0.6, daughterRoll);
    }

    if (horizonImage.complete && horizonImage.naturalHeight !== 0) {
      const horizonY = canvas.height - (canvas.width * (horizonImage.naturalHeight / horizonImage.naturalWidth));
      ctx.drawImage(horizonImage, 0, horizonY, canvas.width, canvas.width * (horizonImage.naturalHeight / horizonImage.naturalWidth));
    }

    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
});