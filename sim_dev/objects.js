import * as THREE from 'three';

export function createSceneObjects(scene, config, labelContainer) {
  const textureLoader = new THREE.TextureLoader();

  // === Sun Setup ===
  const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
  const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
  const sun = new THREE.Mesh(sunGeometry, sunMaterial);
  scene.add(sun);
  sun.layers.set(0);

  const sunlight = new THREE.PointLight(0xffffff, 3000, 100);
  sunlight.castShadow = true;
  sunlight.shadow.mapSize.width = 4096;
  sunlight.shadow.mapSize.height = 4096;
  sunlight.shadow.radius = 4;
  sunlight.shadow.camera.near = 0.1;
  sunlight.shadow.camera.far = 1000;
  sunlight.shadow.camera.left = -25;
  sunlight.shadow.camera.right = 25;
  sunlight.shadow.camera.top = 25;
  sunlight.shadow.camera.bottom = -25;
  sunlight.shadow.bias = -0.005;
  sun.add(sunlight);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.05); 
  scene.add(ambientLight);

  const solSouthArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 5, 0), 2, 0xffff00, 1.5, 0.75);
  scene.add(solSouthArrow);

  // === Orbit and Seasonal Lines ===
  const arcPoints = [];
  const segmentCount = 128;
  for (let i = 0; i <= segmentCount; i++) {
    const angle = (i / segmentCount) * Math.PI * 2;
    arcPoints.push(new THREE.Vector3(config.ORBIT_RADIUS * Math.cos(angle), 0, config.ORBIT_RADIUS * Math.sin(angle)));
  }
  const arcGeometry = new THREE.BufferGeometry().setFromPoints(arcPoints);
  const arcMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
  const orbitRing = new THREE.LineLoop(arcGeometry, arcMaterial);
  scene.add(orbitRing);
  orbitRing.layers.set(1);

  const seasonalSpokeData = [
      { label: 'NF<br>Equinox', angle: 0, color: 0x00ff00 }, { label: 'LN', angle: 60, color: 0x0000ff },
      { label: 'TLN<br>Solstice', angle: 90, color: 0xff0000 }, { label: 'NS', angle: 120, color: 0x0000ff },
      { label: 'DS<br>-X Axis', angle: 180, color: 0x00ff00 }, { label: 'LD', angle: 240, color: 0xffff00 },
      { label: 'TLD<br>-Z Axis', angle: 270, color: 0xff0000 }, { label: 'DF', angle: 300, color: 0xffff00 },
  ];

  const seasonalLines = [];
  const labelElements = [];
  seasonalSpokeData.forEach(({ label, angle, color }) => {
    const rad = THREE.MathUtils.degToRad(angle);
    const x = config.ORBIT_RADIUS * Math.cos(rad);
    const z = config.ORBIT_RADIUS * Math.sin(rad);
    const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(x, 0, z)];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color });
    const line = new THREE.Line(geometry, material);
    scene.add(line);
    seasonalLines.push(line);
    line.layers.set(1);

    const div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.color = 'white';
    div.style.fontSize = '14px';
    div.innerHTML = label;
    labelContainer.appendChild(div);
    labelElements.push({ element: div, position: new THREE.Vector3(x, 0, z) });
  });

  // === Planet, Groups, and Axis ===
  const planetGroup = new THREE.Group();
  planetGroup.rotation.x = THREE.MathUtils.degToRad(config.PLANET_AXIAL_TILT);
  planetGroup.position.set(config.ORBIT_RADIUS, 0, 0);
  scene.add(planetGroup);

  const spinningGroup = new THREE.Group();
  planetGroup.add(spinningGroup);

  const planetGeometry = new THREE.SphereGeometry(2, 32, 32);
  const halferthTexture = textureLoader.load('textures/halferth.png');
  halferthTexture.center.set(0.5, 0.5);
  halferthTexture.rotation = Math.PI / 2;
  const planetMaterial = new THREE.MeshPhongMaterial({ map: halferthTexture, shininess: 10 });
  const planet = new THREE.Mesh(planetGeometry, planetMaterial);
  planet.layers.set(0);
  planet.rotation.x = Math.PI / 2;
  planet.castShadow = true;
  planet.receiveShadow = true;
  spinningGroup.add(planet);

  const arrowOrigin = new THREE.Vector3(0, -3, 0);
  const arrowDirection = new THREE.Vector3(0, 1, 0);
  const arrowLength = 8;
  const arrowColor = 0xffffff;
  const axisLine = new THREE.ArrowHelper(arrowDirection, arrowOrigin, arrowLength, arrowColor, 1, 0.5);
  planetGroup.add(axisLine);
  axisLine.layers.set(1);

  // === Moon Setup ===
  const moonOrbitGroup = new THREE.Group();
  moonOrbitGroup.rotation.z = THREE.MathUtils.degToRad(config.PLANET_AXIAL_TILT);
  planetGroup.add(moonOrbitGroup);

  // Mother Moon
  const motherGeometry = new THREE.SphereGeometry(config.MOTHER.RADIUS, 32, 32);
  motherGeometry.rotateY(Math.PI / 2);
  const motherMaterial = new THREE.MeshPhongMaterial({ map: textureLoader.load('textures/mother.png') });
  const mother = new THREE.Mesh(motherGeometry, motherMaterial);
  mother.layers.set(0);
  mother.castShadow = true;
  mother.receiveShadow = true;
  moonOrbitGroup.add(mother);

  // Daughter Moon
  const daughterGeometry = new THREE.SphereGeometry(config.DAUGHTER.RADIUS, 32, 32);
  daughterGeometry.rotateY(Math.PI / 2);
  const daughterMaterial = new THREE.MeshPhongMaterial({ map: textureLoader.load('textures/daughter.png') });
  const daughter = new THREE.Mesh(daughterGeometry, daughterMaterial);
  daughter.layers.set(0);
  daughter.castShadow = true;
  daughter.receiveShadow = true;
  moonOrbitGroup.add(daughter);

  // === Trail Setup ===
function createTrailLine(color, positions) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: color,
    size: 1.5, 
    sizeAttenuation: true
  });
  const points = new THREE.Points(geometry, material);
  scene.add(points);
  return points;
 }
  const motherTrailLine = createTrailLine(0xff00ff, new Float32Array(0)); 
  const daughterTrailLine = createTrailLine(0x00ffff, new Float32Array(0)); 
  motherTrailLine.layers.set(2);
  daughterTrailLine.layers.set(2);

  // === Moon Y-Cam Setup ===
  const motherCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  const motherTarget = new THREE.WebGLRenderTarget(1024, 1024);
  motherTarget.texture.encoding = THREE.SRGBColorSpace;
  motherCam.position.set(1.1, 0, 0);
  motherCam.up.set(0, 0, 1);
  motherCam.lookAt(0, 0, 0);
  mother.add(motherCam);
  motherCam.layers.set(0);

  const daughterCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
  const daughterTarget = new THREE.WebGLRenderTarget(1024, 1024);
  daughterTarget.texture.encoding = THREE.SRGBColorSpace;
  daughterCam.position.set(1, 0, 0);
  daughterCam.up.set(0, 0, 1);
  daughterCam.lookAt(0, 0, 0);
  daughter.add(daughterCam);
  daughterCam.layers.set(0);

  return {
    sun,
    planetGroup,
    spinningGroup,
    planet,
    axisLine,
    orbitRing,
    seasonalLines,
    labelElements,
    mother,
    daughter,
    motherTrailLine,
    daughterTrailLine,
    motherCam,
    motherTarget,
    daughterCam,
    daughterTarget
  };
}