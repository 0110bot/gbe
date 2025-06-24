export function createUI(config, callbacks) {
  // === UI Container ===
  const uiContainer = document.createElement('div');
  uiContainer.style.position = 'absolute';
  uiContainer.style.top = '10px';
  uiContainer.style.left = '10px';
  uiContainer.style.zIndex = '10';
  uiContainer.style.display = 'flex';
  uiContainer.style.flexDirection = 'column';
  uiContainer.style.gap = '10px';
  document.body.appendChild(uiContainer);

  // --- Spin Counter ---
  const spinCounter = document.createElement('div');
  spinCounter.style.color = 'white';
  spinCounter.style.fontSize = '16px';
  spinCounter.style.backgroundColor = 'rgba(0,0,0,0.5)';
  spinCounter.style.padding = '5px';
  spinCounter.innerHTML = 'Spins: 0';
  uiContainer.appendChild(spinCounter);

  // --- Pause Button ---
  const pauseButton = document.createElement('button');
  pauseButton.textContent = 'Pause Orbital Motion';
  pauseButton.style.padding = '2px 5px';
  pauseButton.style.fontSize = '14px';
  uiContainer.appendChild(pauseButton);
  // Event Listener
  pauseButton.addEventListener('click', () => {
    callbacks.onPauseClick();
    // The button text is updated directly by the callback in main.js
  });

  // --- Toggles ---
  const toggleContainer = document.createElement('div');
  toggleContainer.style.color = 'white';
  toggleContainer.style.backgroundColor = 'rgba(0,0,0,0.5)';
  toggleContainer.style.padding = '5px';
  toggleContainer.style.fontSize = '14px';
  toggleContainer.innerHTML = `
    <label><input type="checkbox" id="toggleTrails"> Trails</label><br>
    <label><input type="checkbox" id="toggleLines" checked> Lines</label><br>
    <label><input type="checkbox" id="toggleLabels" checked> Labels</label>
  `;
  uiContainer.appendChild(toggleContainer);
  // Event Listeners
  const trailsCheckbox = toggleContainer.querySelector('#toggleTrails');
  const linesCheckbox = toggleContainer.querySelector('#toggleLines');
  const labelsCheckbox = toggleContainer.querySelector('#toggleLabels');
  trailsCheckbox.addEventListener('change', (e) => callbacks.onTrailsToggle(e.target.checked));
  linesCheckbox.addEventListener('change', (e) => callbacks.onLinesToggle(e.target.checked));
  labelsCheckbox.addEventListener('change', (e) => callbacks.onLabelsToggle(e.target.checked));


  // --- Speed Controls ---
  const speedControlsContainer = document.createElement('div');
  speedControlsContainer.style.display = 'flex';
  speedControlsContainer.style.gap = '5px';
  speedControlsContainer.innerHTML = `
    <button data-speed="0.25">Slow</button>
    <button data-speed="1">Normal</button>
    <button data-speed="4">Fast</button>
  `;
  uiContainer.appendChild(speedControlsContainer);
  // Event Listener
  speedControlsContainer.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') {
      const speed = parseFloat(e.target.dataset.speed);
      callbacks.onSpeedChange(speed);
    }
  });


  // --- Day Slider ---
  const daySliderContainer = document.createElement('div');
  daySliderContainer.style.color = 'white';
  daySliderContainer.style.backgroundColor = 'rgba(0,0,0,0.5)';
  daySliderContainer.style.padding = '5px';
  daySliderContainer.innerHTML = `
    <label for="daySlider">Jump to Day:</label><br>
    <input type="range" id="daySlider" min="1" max="${config.HALFERTH_YEAR_DAYS}" value="1" style="width: 150px;">
  `;
  uiContainer.appendChild(daySliderContainer);
  // Event Listener
  const daySlider = daySliderContainer.querySelector('#daySlider');
  daySlider.addEventListener('input', () => callbacks.onDaySliderChange(daySlider.value));

  // Return elements that main.js needs to access directly
  return {
    spinCounter,
    daySlider,
    pauseButton, // Return pauseButton to allow text changes from main
  };
}