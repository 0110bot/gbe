if (!window.sharedState) {
  const createCanvas = (width, height) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  };

  window.sharedState = {
    motherCanvas: createCanvas(1024, 1024),
    daughterCanvas: createCanvas(1024, 1024),
    motherAngle: 0,
    daughterAngle: 0,
    motherY: 0,
    daughterY: 0,
    fullSpins: 0,
    totalSpin: 0,
    calendarDay: 0,
    isPaused: false,
  };
}