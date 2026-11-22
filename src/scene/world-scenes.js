import * as THREE from "three";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { gsap } from "gsap";

const DOOR_SKILL_ORDER = [
  { title: "Ethical Hacking", label: "HACKING", portalColor: 0x7cffb2 },
  { title: "Full Stack Development", label: "TECH", portalColor: 0x6c63ff },
  { title: "Forex Trading", label: "TRADING", portalColor: 0xffb454 },
  { title: "Futures Trading", label: "ME", portalColor: 0xff5c7a },
];
const DOOR_SPACING = 3.1;

function createFloorTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not create the door-room floor texture.");

  context.fillStyle = "#05060A";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = "rgba(255,255,255,0.06)";
  context.lineWidth = 2;
  for (let position = 0; position <= 512; position += 64) {
    context.beginPath();
    context.moveTo(0, position);
    context.lineTo(512, position);
    context.stroke();
    context.beginPath();
    context.moveTo(position, 0);
    context.lineTo(position, 512);
    context.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  texture.anisotropy = 4;
  return texture;
}

function createWallTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not create the door-room wall texture.");

  const wallGradient = context.createLinearGradient(0, 0, 0, canvas.height);
  wallGradient.addColorStop(0, "#090B12");
  wallGradient.addColorStop(0.7, "#070912");
  wallGradient.addColorStop(1, "#05060A");
  context.fillStyle = wallGradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function createDoorRoom(textures) {
  const room = new THREE.Group();
  const wallTexture = createWallTexture();
  textures.add(wallTexture);
  const wallMaterial = new THREE.MeshStandardMaterial({
    map: wallTexture,
    color: 0x090b12,
    roughness: 0.92,
    metalness: 0,
    side: THREE.DoubleSide,
  });
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(34, 18), wallMaterial);
  wall.position.set(0, 6.8, -34.25);
  room.add(wall);
  const sideWallGeometry = new THREE.PlaneGeometry(28, 18);
  const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-17, 6.8, -23.5);
  const rightWall = leftWall.clone();
  rightWall.position.x = 17;
  rightWall.rotation.y = -Math.PI / 2;
  room.add(leftWall, rightWall);

  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(34, 28),
    new THREE.MeshStandardMaterial({
      color: 0x05060a,
      roughness: 0.95,
      metalness: 0,
      side: THREE.DoubleSide,
    }),
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, 11.2, -23.5);
  room.add(ceiling);

  const floorTexture = createFloorTexture();
  textures.add(floorTexture);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(38, 28),
    new THREE.MeshStandardMaterial({
      map: floorTexture,
      color: 0x05060a,
      roughness: 0.28,
      metalness: 0.72,
      side: THREE.DoubleSide,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -2.08, -23.5);
  room.add(floor);

  const trimMaterial = new THREE.MeshStandardMaterial({
    color: 0x0b0d14,
    roughness: 0.42,
    metalness: 0.78,
  });
  const baseboard = new THREE.Mesh(
    new THREE.BoxGeometry(34, 0.22, 0.16),
    trimMaterial,
  );
  baseboard.position.set(0, -1.96, -34.12);
  room.add(baseboard);
  return room;
}

function createChamferedRectShape(width, height, chamfer) {
  const shape = new THREE.Shape();
  const left = -width / 2;
  const right = width / 2;
  const bottom = 0;
  const top = height;
  shape.moveTo(left + chamfer, bottom);
  shape.lineTo(right - chamfer, bottom);
  shape.lineTo(right, bottom + chamfer);
  shape.lineTo(right, top - chamfer);
  shape.lineTo(right - chamfer, top);
  shape.lineTo(left + chamfer, top);
  shape.lineTo(left, top - chamfer);
  shape.lineTo(left, bottom + chamfer);
  shape.closePath();

  const openingWidth = width - 0.48;
  const openingHeight = height - 0.3;
  const opening = new THREE.Path();
  opening.moveTo(-openingWidth / 2, 0.12);
  opening.lineTo(-openingWidth / 2, openingHeight - 0.12);
  opening.lineTo(openingWidth / 2, openingHeight - 0.12);
  opening.lineTo(openingWidth / 2, 0.12);
  opening.closePath();
  shape.holes.push(opening);
  return shape;
}

function createDoorLabelTexture(number, label, color) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not create the sci-fi door label texture.");
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.shadowColor = `#${color.toString(16).padStart(6, "0")}`;
  context.shadowBlur = 24;
  context.fillStyle = "#EDEFF6";
  context.font = '600 56px "JetBrains Mono", monospace';
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(`${number}  /  ${label}`, canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function createVerticalGlowTexture(color) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not create the door light texture.");
  const hex = `#${color.toString(16).padStart(6, "0")}`;
  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "rgba(255,255,255,0)");
  gradient.addColorStop(0.18, hex);
  gradient.addColorStop(0.62, hex);
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  const horizontalFade = context.createLinearGradient(0, 0, canvas.width, 0);
  horizontalFade.addColorStop(0, "rgba(255,255,255,0)");
  horizontalFade.addColorStop(0.5, "rgba(255,255,255,0.72)");
  horizontalFade.addColorStop(1, "rgba(255,255,255,0)");
  context.globalCompositeOperation = "destination-in";
  context.fillStyle = horizontalFade;
  context.fillRect(0, 0, canvas.width, canvas.height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createReflectionTexture(color) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not create the fake door reflection.");
  context.clearRect(0, 0, canvas.width, canvas.height);
  const hex = `#${color.toString(16).padStart(6, "0")}`;
  context.save();
  context.translate(0, canvas.height);
  context.scale(1, -1);
  context.strokeStyle = hex;
  context.lineWidth = 5;
  context.globalAlpha = 0.3;
  context.strokeRect(42, 18, 172, 220);
  context.lineWidth = 2;
  context.strokeRect(54, 30, 148, 196);
  context.restore();
  const fade = context.createLinearGradient(0, 0, 0, canvas.height);
  fade.addColorStop(0, "rgba(255,255,255,0)");
  fade.addColorStop(0.22, "rgba(255,255,255,0.12)");
  fade.addColorStop(0.58, "rgba(255,255,255,0.035)");
  fade.addColorStop(1, "rgba(255,255,255,0)");
  context.globalCompositeOperation = "destination-in";
  context.fillStyle = fade;
  context.fillRect(0, 0, canvas.width, canvas.height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createPortalMaterial(color) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uTime: { value: 0 },
      uBrightness: { value: 0.65 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uTime;
      uniform float uBrightness;
      varying vec2 vUv;
      void main() {
        float scan = sin((vUv.y * 34.0) - uTime * 2.2) * 0.5 + 0.5;
        float center = 1.0 - smoothstep(0.08, 0.72, abs(vUv.x - 0.5));
        float pulse = 0.78 + sin(uTime * 0.9 + vUv.y * 5.0) * 0.12;
        float edge = smoothstep(0.0, 0.09, vUv.x) * (1.0 - smoothstep(0.91, 1.0, vUv.x));
        float vertical = smoothstep(0.0, 0.22, vUv.y) * (1.0 - smoothstep(0.78, 1.0, vUv.y));
        float noise = fract(sin(dot(vUv * 240.0 + floor(uTime * 0.22), vec2(12.9898, 78.233))) * 43758.5453);
        float alpha = (0.32 + scan * 0.16 + center * 0.32 + noise * 0.025) * uBrightness * edge * vertical * pulse;
        gl_FragColor = vec4(uColor * (0.95 + scan * 0.45), alpha);
      }
    `,
  });
}

function createDoor(skill, displayLabel, color, index, textures, scaleX, scaleY, shared) {
  const root = new THREE.Group();
  root.position.set((index - 1.5) * DOOR_SPACING, -2.06, -32);
  root.scale.set(scaleX, scaleY, scaleY);
  root.userData.skill = skill;

  const width = 2.44;
  const height = 3.55;
  const doorFrame = new THREE.Mesh(shared.frameGeometry, shared.frameMaterial);
  doorFrame.position.z = -0.02;
  root.add(doorFrame);

  const portalMaterial = createPortalMaterial(color);
  const portalCard = new THREE.Mesh(shared.portalGeometry, portalMaterial);
  portalCard.position.set(0, height * 0.5, -0.12);
  root.add(portalCard);

  const leftPanelSci = new THREE.Object3D();
  leftPanelSci.position.set(-width * 0.255, height * 0.5, 0.13);
  const rightPanelSci = new THREE.Object3D();
  rightPanelSci.position.set(width * 0.255, height * 0.5, 0.13);
  const panels = new THREE.InstancedMesh(shared.panelGeometry, shared.panelMaterial, 2);
  const panelTransform = new THREE.Object3D();
  panelTransform.position.copy(leftPanelSci.position);
  panelTransform.updateMatrix();
  panels.setMatrixAt(0, panelTransform.matrix);
  panelTransform.position.copy(rightPanelSci.position);
  panelTransform.updateMatrix();
  panels.setMatrixAt(1, panelTransform.matrix);
  panels.computeBoundingSphere();
  panels.boundingSphere.radius += 0.6;
  root.add(panels);

  const seams = new THREE.InstancedMesh(shared.seamGeometry, shared.seamMaterial, 10);
  const seamTransform = new THREE.Object3D();
  let seamIndex = 0;
  for (let seam = 0; seam < 5; seam += 1) {
    const y = 0.55 + seam * (height - 0.9) / 4;
    [-1, 1].forEach((side) => {
      seamTransform.position.set(side * width * 0.255, y, 0.205);
      seamTransform.updateMatrix();
      seams.setMatrixAt(seamIndex, seamTransform.matrix);
      seamIndex += 1;
    });
  }
  root.add(seams);

  const centerLineSci = new THREE.Mesh(
    shared.centerLineGeometry,
    shared.centerLineMaterials[index],
  );
  centerLineSci.position.set(0, height * 0.5, 0.23);
  root.add(centerLineSci);

  const outlineSci = new THREE.Line(shared.outlineGeometry, shared.outlineMaterials[index]);
  outlineSci.position.z = 0.3;
  root.add(outlineSci);

  const leds = new THREE.InstancedMesh(shared.ledGeometry, shared.ledMaterials[index], 4);
  const ledTransform = new THREE.Object3D();
  let ledIndex = 0;
  [-1, 1].forEach((side) => {
    [-1, 1].forEach((vertical) => {
      ledTransform.position.set(
        side * (width * 0.47),
        height * (vertical > 0 ? 0.86 : 0.14),
        0.26,
      );
      ledTransform.updateMatrix();
      leds.setMatrixAt(ledIndex, ledTransform.matrix);
      ledIndex += 1;
    });
  });
  root.add(leds);

  const labelTexture = createDoorLabelTexture(String(index + 1).padStart(2, "0"), displayLabel, color);
  textures.add(labelTexture);
  const labelMaterial = new THREE.MeshBasicMaterial({
    map: labelTexture,
    transparent: true,
    opacity: 1,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
  const labelSci = new THREE.Mesh(shared.labelGeometry, labelMaterial);
  labelSci.position.set(0, height + 0.34, 0.12);
  root.add(labelSci);

  const spillTexture = createVerticalGlowTexture(color);
  textures.add(spillTexture);
  const spillMaterial = new THREE.MeshBasicMaterial({
    map: spillTexture,
    transparent: true,
    opacity: 0.18,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const spillSci = new THREE.Mesh(shared.spillGeometry, spillMaterial);
  spillSci.rotation.x = -Math.PI / 2;
  spillSci.position.set(0, -1.98, 1.2);
  root.add(spillSci);

  const reflectionTexture = createReflectionTexture(color);
  textures.add(reflectionTexture);
  const reflectionSci = new THREE.Mesh(
    shared.reflectionGeometry,
    new THREE.MeshBasicMaterial({
      map: reflectionTexture,
      transparent: true,
      opacity: 0.1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  reflectionSci.rotation.x = -Math.PI / 2;
  reflectionSci.position.set(0, -2.02, -0.15);
  root.add(reflectionSci);

  return {
    root,
    frame: doorFrame,
    card: portalCard,
    panels,
    leftPanel: leftPanelSci,
    rightPanel: rightPanelSci,
    portalMaterial,
    label: labelSci,
    labelMaterial,
    outline: outlineSci,
    reflection: reflectionSci,
    spill: spillSci,
    spillMaterial,
    centerLine: centerLineSci,
    targetOpen: 0,
    index,
    panelOpenOffset: 0.55,
    panelClosedX: width * 0.255,
    labelGlow: { value: 1 },
    color,
  };
}

export function createWorldScenes({ scene, camera, canvas, font, config }) {
  const textures = new Set();
  const isMobile = window.matchMedia("(max-width: 767px)").matches;
  const doorScaleX = 1;
  const doorScaleY = isMobile ? 1.55 : 1.72;
  const group = new THREE.Group();
  group.visible = false;
  scene.add(group);
  const doorRoom = createDoorRoom(textures);
  group.add(doorRoom);
  const auxiliaryPointLights = scene.children.filter((object) => object.isPointLight);

  const shared = {
    frameGeometry: new THREE.ExtrudeGeometry(createChamferedRectShape(2.8, 3.55, 0.18), {
      depth: 0.24,
      bevelEnabled: true,
      bevelSegments: 2,
      bevelSize: 0.035,
      bevelThickness: 0.04,
    }),
    frameMaterial: new THREE.MeshStandardMaterial({
      color: 0x0b0d14,
      metalness: 0.9,
      roughness: 0.35,
    }),
    panelGeometry: new THREE.BoxGeometry(1.12, 3.25, 0.12),
    panelMaterial: new THREE.MeshStandardMaterial({
      color: 0x171b24,
      metalness: 0.88,
      roughness: 0.32,
      emissive: 0x05070c,
      emissiveIntensity: 0.15,
    }),
    seamGeometry: new THREE.BoxGeometry(1.06, 0.018, 0.018),
    seamMaterial: new THREE.MeshBasicMaterial({
      color: 0x9da8ba,
      transparent: true,
      opacity: 0.22,
    }),
    portalGeometry: new THREE.PlaneGeometry(2.16, 3.25),
    centerLineGeometry: new THREE.BoxGeometry(0.018, 3.33, 0.018),
    centerLineMaterials: DOOR_SKILL_ORDER.map(({ portalColor }) =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(portalColor).multiplyScalar(1.7),
        transparent: true,
        opacity: 1,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      })),
    outlineMaterials: DOOR_SKILL_ORDER.map(({ portalColor }) =>
      new THREE.LineBasicMaterial({
        color: new THREE.Color(portalColor).multiplyScalar(1.8),
        transparent: true,
        opacity: 1,
        toneMapped: false,
      })),
    ledGeometry: new THREE.BoxGeometry(0.035, 0.035, 0.018),
    ledMaterials: DOOR_SKILL_ORDER.map(({ portalColor }) =>
      new THREE.MeshStandardMaterial({
        color: portalColor,
        emissive: portalColor,
        emissiveIntensity: 1.4,
        metalness: 0.2,
        roughness: 0.2,
      })),
    labelGeometry: new THREE.PlaneGeometry(2.2, 0.62),
    spillGeometry: new THREE.PlaneGeometry(4.636, 5.8),
    reflectionGeometry: new THREE.PlaneGeometry(2.8792, 3.4),
  };
  shared.outlineGeometry = new THREE.BufferGeometry().setFromPoints(
    [
      new THREE.Vector3(-1.22, 0, 0),
      new THREE.Vector3(1.22, 0, 0),
      new THREE.Vector3(1.4, 0.18, 0),
      new THREE.Vector3(1.4, 3.37, 0),
      new THREE.Vector3(1.22, 3.55, 0),
      new THREE.Vector3(-1.22, 3.55, 0),
      new THREE.Vector3(-1.4, 3.37, 0),
      new THREE.Vector3(-1.4, 0.18, 0),
      new THREE.Vector3(-1.22, 0, 0),
    ],
  );

  const portalSkills = DOOR_SKILL_ORDER.map(({ title, label, portalColor }) => {
    const skill = config.skills.find((entry) => entry.title === title);
    if (!skill) throw new Error(`Missing configured skill for portal: ${title}`);
    return { skill, label, color: portalColor };
  });
  const doors = portalSkills.map(({ skill, label, color }, index) => {
    const door = createDoor(skill, label, color, index, textures, doorScaleX, doorScaleY, shared);
    group.add(door.root);
    return door;
  });
  const doorFitBounds = new THREE.Box3();
  doors.forEach((door) => {
    door.root.updateWorldMatrix(true, true);
    doorFitBounds.expandByObject(door.frame);
    doorFitBounds.expandByObject(door.label);
  });
  const doorFitCenter = doorFitBounds.getCenter(new THREE.Vector3());
  const doorFitSize = doorFitBounds.getSize(new THREE.Vector3());
  const doorCameraPosition = new THREE.Vector3();

  const dustCount = 300;
  const dustPositions = new Float32Array(dustCount * 3);
  for (let index = 0; index < dustCount; index += 1) {
    const offset = index * 3;
    dustPositions[offset] = (Math.random() - 0.5) * 18;
    dustPositions[offset + 1] = -1.8 + Math.random() * 9;
    dustPositions[offset + 2] = -36 + Math.random() * 18;
  }
  const dustGeometry = new THREE.BufferGeometry();
  dustGeometry.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
  const dustMaterial = new THREE.PointsMaterial({
    color: 0x9da8ba,
    size: 0.018,
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const dust = new THREE.Points(dustGeometry, dustMaterial);
  dust.visible = false;
  group.add(dust);

  const projectPhones = (config.projects || []).slice(0, 3).map((project, index) => {
    const phone = new THREE.Group();
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(1.28, 2.3, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x8790a3, metalness: 0.45, roughness: 0.38 }),
    );
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(1.12, 2.12),
      new THREE.MeshBasicMaterial({ color: 0x10131a }),
    );
    screen.position.z = 0.07;
    phone.add(frame, screen);
    phone.position.set((index - 1) * 2.15, 0, -76);
    phone.userData.project = project;
    group.add(phone);
    return phone;
  });

  const sceneTitleGeometry = new TextGeometry("2026", {
    font,
    size: 1.2,
    height: 0.08,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.015,
    bevelSegments: 2,
  });
  const sceneTitle = new THREE.Mesh(
    sceneTitleGeometry,
    new THREE.MeshStandardMaterial({
      color: 0xf3e5ab,
      metalness: 0.55,
      roughness: 0.28,
      emissive: 0x463b20,
      emissiveIntensity: 0.4,
    }),
  );
  sceneTitle.position.set(-1.6, 3.5, -98);
  group.add(sceneTitle);

  const contactLabel = new THREE.Mesh(
    new TextGeometry("LET'S CONNECT", {
      font,
      size: 0.64,
      height: 0.06,
      bevelEnabled: true,
      bevelThickness: 0.018,
      bevelSize: 0.01,
      bevelSegments: 2,
    }),
    new THREE.MeshStandardMaterial({
      color: 0xf3e5ab,
      metalness: 0.48,
      roughness: 0.3,
      emissive: 0x463b20,
      emissiveIntensity: 0.34,
    }),
  );
  contactLabel.position.set(-3.1, 1.5, -117);
  group.add(contactLabel);

  const doorTargets = doors.flatMap((door) => [door.frame, door.panels, door.card]);
  const panelTransform = new THREE.Object3D();
  const updatePanelInstances = (door) => {
    panelTransform.position.copy(door.leftPanel.position);
    panelTransform.updateMatrix();
    door.panels.setMatrixAt(0, panelTransform.matrix);
    panelTransform.position.copy(door.rightPanel.position);
    panelTransform.updateMatrix();
    door.panels.setMatrixAt(1, panelTransform.matrix);
    door.panels.instanceMatrix.needsUpdate = true;
  };
  const interactiveTargets = projectPhones;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let pointerValid = false;
  let worldProgress = 0;
  let selectedDoor = null;
  let selectedDoorDetail;
  let selectionNavigates = true;
  let doorTransitionElapsed = 0;
  let doorTransitionTimeline;
  let doorNavigationTimer;
  let doorTransitionForceTimer;
  let doorNavigationDispatched = false;
  let motionReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let disposed = false;
  let lastFrameTime = performance.now();
  const baseCameraFov = camera.fov;
  const doorCameraFov = 32;
  const doorFocusFov = 46;
  let targetCameraFov = baseCameraFov;
  const cameraTarget = new THREE.Vector3(0, 0, -5);
  const lookTarget = new THREE.Vector3(0, 0, -7);
  const cameraMotionTarget = new THREE.Vector3();
  const cameraLookTarget = new THREE.Vector3();
  let cameraInitialized = false;
  let worldProgressActive = false;
  const doorStartX = isMobile ? -4.7 : -0.5;
  const doorEndX = isMobile ? 4.7 : 0.5;
  const doorApproachCurve = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(0, 0, -5),
      new THREE.Vector3(-0.5, 0.12, -11),
      new THREE.Vector3(doorStartX, 0, -23),
    ],
    false,
    "catmullrom",
    0.38,
  );
  const doorExitCurve = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(doorEndX, 0, -23),
      new THREE.Vector3(0, 0.1, -52),
      new THREE.Vector3(-0.9, 0.2, -58),
      new THREE.Vector3(0.85, -0.12, -78),
      new THREE.Vector3(-0.55, 0.1, -99),
      new THREE.Vector3(0, 0, -118),
    ],
    false,
    "catmullrom",
    0.38,
  );
  const doorLookStartX = doorStartX;
  const doorLookEndX = doorEndX;
  const doorApproachLookCurve = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(0, 0, -7),
      new THREE.Vector3(-0.3, 0.08, -18),
      new THREE.Vector3(doorLookStartX, isMobile ? 3.4 : 3.1, -32),
    ],
    false,
    "catmullrom",
    0.38,
  );
  const doorExitLookCurve = new THREE.CatmullRomCurve3(
    [
      new THREE.Vector3(doorLookEndX, 1.2, -32),
      new THREE.Vector3(0, 0, -54),
      new THREE.Vector3(-0.3, 0.08, -60),
      new THREE.Vector3(0.25, 0, -80),
      new THREE.Vector3(-0.2, 0.06, -101),
      new THREE.Vector3(0, 0, -120),
    ],
    false,
    "catmullrom",
    0.38,
  );
  const doorsSection = document.querySelector("#doors");
  const projectsSection = document.querySelector("#projects");
  const stageElement = document.querySelector("#stage-two");
  let doorStartProgress = 0;
  let doorEndProgress = 1;
  let projectsStartProgress = 1;

  const fitDoorCamera = () => {
    const tangent = Math.tan(THREE.MathUtils.degToRad(doorCameraFov / 2));
    const distance = Math.max(
      doorFitSize.y / (2 * tangent * 0.85),
      doorFitSize.x / (2 * tangent * Math.max(camera.aspect, 0.1) * 0.8),
    );
    doorCameraPosition.copy(doorFitCenter);
    doorCameraPosition.z += distance;
    targetCameraFov = doorCameraFov;
    cameraTarget.copy(doorCameraPosition);
    lookTarget.copy(doorFitCenter);
    if (worldProgressActive && worldProgress >= doorStartProgress &&
        worldProgress <= doorEndProgress && !selectedDoor) {
      camera.position.copy(doorCameraPosition);
      camera.lookAt(doorFitCenter);
      camera.fov = doorCameraFov;
      camera.updateProjectionMatrix();
      cameraInitialized = true;
    }
    camera.updateMatrixWorld(true);
  };

  const setDoorFocusTarget = (door) => {
    const x = door.root.position.x;
    cameraTarget.set(x, doorFitCenter.y, -35.2);
    lookTarget.set(x, doorFitCenter.y, -42);
    targetCameraFov = doorFocusFov;
  };

  const setDoorTarget = (door, open, durationOverride) => {
    const target = open ? 1 : 0;
    if (door.targetOpen === target && durationOverride === undefined) return;
    door.targetOpen = target;
    const duration = motionReduced ? 0 : durationOverride ?? 0.6;
    const ease = "power3.out";
    const labelGlowTarget = open ? 1.25 : 1;
    if (motionReduced) {
      door.labelGlow.value = labelGlowTarget;
      door.leftPanel.position.x = -door.panelClosedX - (open ? door.panelOpenOffset : 0);
      door.rightPanel.position.x = door.panelClosedX + (open ? door.panelOpenOffset : 0);
      door.portalMaterial.uniforms.uBrightness.value = open ? 1.25 : 0.65;
      door.spillMaterial.opacity = open ? 0.62 : 0.18;
      door.spill.scale.setScalar(open ? 1.18 : 1);
      return;
    }
    gsap.killTweensOf(door.leftPanel.position);
    gsap.killTweensOf(door.rightPanel.position);
    gsap.killTweensOf(door.labelGlow);
    gsap.to(door.leftPanel.position, {
      x: -door.panelClosedX - (open ? door.panelOpenOffset : 0),
      duration,
      ease,
    });
    gsap.to(door.rightPanel.position, {
      x: door.panelClosedX + (open ? door.panelOpenOffset : 0),
      duration,
      ease,
    });
    gsap.to(door.labelGlow, {
      value: labelGlowTarget,
      duration,
      ease,
    });
    gsap.to(door.portalMaterial.uniforms.uBrightness, {
      value: open ? 1.25 : 0.65,
      duration,
      ease,
    });
    gsap.to(door.spillMaterial, {
      opacity: open ? 0.62 : 0.18,
      duration,
      ease,
    });
    gsap.to(door.spill.scale, {
      x: open ? 1.18 : 1,
      y: open ? 1.18 : 1,
      duration,
      ease,
    });
  };

  const flashDoor = (door) => {
    const flash = document.querySelector("#reveal-flash");
    if (!flash) return;
    gsap.killTweensOf(flash);
    gsap.fromTo(
      flash,
      { opacity: 0.88, backgroundColor: "#ffffff", visibility: "visible" },
      {
        opacity: 0,
        backgroundColor: `#${door.color.toString(16).padStart(6, "0")}`,
        duration: motionReduced ? 0 : 0.48,
        ease: "power3.out",
        onComplete: () => { flash.style.visibility = "hidden"; },
      },
    );
  };

  const finishDoorSelection = () => {
    if (!selectedDoor) return;
    const title = selectedDoor.root.userData.skill.title;
    const detail = selectedDoorDetail ?? title;
    const shouldNavigate = selectionNavigates && !doorNavigationDispatched;
    window.clearTimeout(doorNavigationTimer);
    doorNavigationTimer = undefined;
    window.clearTimeout(doorTransitionForceTimer);
    doorTransitionForceTimer = undefined;
    selectedDoor = null;
    selectedDoorDetail = undefined;
    doorTransitionElapsed = 0;
    doorTransitionTimeline = undefined;
    if (shouldNavigate) {
      doorNavigationDispatched = true;
      window.dispatchEvent(new CustomEvent("portfolio:door-select", { detail }));
    }
  };

  const dispatchDoorSelection = () => {
    if (!selectedDoor || !selectionNavigates || doorNavigationDispatched) return;
    doorNavigationDispatched = true;
    window.dispatchEvent(new CustomEvent("portfolio:door-select", {
      detail: selectedDoorDetail ?? selectedDoor.root.userData.skill.title,
    }));
  };

  const forceFinishDoorTransition = () => {
    if (!selectedDoor) return;
    const openingDoor = selectedDoor;
    const timeline = doorTransitionTimeline;
    if (timeline) {
      timeline.progress(1);
      timeline.kill();
    }
    doors.forEach((door) => {
      const open = door === openingDoor;
      door.targetOpen = open ? 1 : 0;
      door.leftPanel.position.x = -door.panelClosedX - (open ? door.panelOpenOffset : 0);
      door.rightPanel.position.x = door.panelClosedX + (open ? door.panelOpenOffset : 0);
      door.portalMaterial.uniforms.uBrightness.value = open ? 1.25 : 0.65;
      door.spillMaterial.opacity = open ? 0.62 : 0.18;
      door.spill.scale.setScalar(open ? 1.18 : 1);
      door.labelGlow.value = open ? 1.25 : 1;
      updatePanelInstances(door);
    });
    if (selectedDoor) finishDoorSelection();
  };

  const selectDoor = (title, navigationDetail) => {
    if (document.body.classList.contains("is-collection-open")) return false;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) motionReduced = true;
    const door = doors.find((entry) => entry.root.userData.skill.title === title);
    if (!door || selectedDoor) return false;

    doors.forEach((entry) => {
      gsap.killTweensOf(entry.root);
      gsap.killTweensOf(entry.leftPanel.position);
      gsap.killTweensOf(entry.rightPanel.position);
      gsap.killTweensOf(entry.labelGlow);
      gsap.killTweensOf(entry.portalMaterial.uniforms.uBrightness);
      gsap.killTweensOf(entry.spillMaterial);
      gsap.killTweensOf(entry.spill.scale);
    });
    gsap.killTweensOf(camera);
    gsap.killTweensOf(camera.position);
    gsap.killTweensOf(camera.rotation);
    gsap.killTweensOf(lookTarget);
    doorTransitionTimeline?.kill();
    window.clearTimeout(doorNavigationTimer);
    window.clearTimeout(doorTransitionForceTimer);
    doorTransitionTimeline = undefined;
    doorNavigationTimer = undefined;
    doorTransitionForceTimer = undefined;

    selectedDoor = door;
    selectedDoorDetail = navigationDetail;
    selectionNavigates = true;
    doorNavigationDispatched = false;
    doorTransitionElapsed = 0;
    doors.forEach((entry) => setDoorTarget(entry, entry === door, 0.3));
    const currentLookTarget = lookTarget.clone();
    setDoorFocusTarget(door);
    const focusPosition = cameraTarget.clone();
    const focusLookTarget = lookTarget.clone();
    lookTarget.copy(currentLookTarget);

    if (motionReduced) {
      camera.position.copy(focusPosition);
      lookTarget.copy(focusLookTarget);
      camera.lookAt(lookTarget);
      camera.fov = targetCameraFov;
      camera.updateProjectionMatrix();
      finishDoorSelection();
      return true;
    }

    const flash = document.querySelector("#reveal-flash");
    const accent = `#${door.color.toString(16).padStart(6, "0")}`;
    if (flash) gsap.killTweensOf(flash);
    const timeline = gsap.timeline({
      onUpdate: () => {
        camera.lookAt(lookTarget);
        camera.updateProjectionMatrix();
      },
    });
    timeline
      .to(camera.position, {
        x: focusPosition.x,
        y: focusPosition.y,
        z: focusPosition.z,
        duration: 0.5,
        ease: "power2.in",
      }, 0)
      .to(lookTarget, {
        x: focusLookTarget.x,
        y: focusLookTarget.y,
        z: focusLookTarget.z,
        duration: 0.5,
        ease: "power2.in",
      }, 0)
      .to(camera, {
        fov: targetCameraFov,
        duration: 0.5,
        ease: "power2.in",
      }, 0)
      .call(finishDoorSelection, [], 0.8);
    if (flash) {
      gsap.set(flash, { opacity: 0, backgroundColor: "#ffffff", visibility: "visible" });
      timeline
        .to(flash, {
          opacity: 0.88,
          backgroundColor: accent,
          duration: 0.4,
          ease: "power2.out",
        }, 0)
        .to(flash, {
          opacity: 0,
          duration: 0.4,
          ease: "power2.in",
          onComplete: () => { flash.style.visibility = "hidden"; },
        }, 0.4);
    }
    doorTransitionTimeline = timeline;
    doorNavigationTimer = window.setTimeout(dispatchDoorSelection, 350);
    doorTransitionForceTimer = window.setTimeout(forceFinishDoorTransition, 1200);
    return true;
  };

  const focusDoor = (title) => {
    const door = doors.find((entry) => entry.root.userData.skill.title === title);
    if (!door || document.body.classList.contains("is-collection-open")) return false;
    selectedDoor = door;
    selectionNavigates = false;
    doorTransitionElapsed = 0;
    setDoorFocusTarget(door);
    doors.forEach((entry) => setDoorTarget(entry, entry === door));
    flashDoor(door);
    if (motionReduced) {
      camera.position.copy(cameraTarget);
      camera.lookAt(lookTarget);
      camera.fov = targetCameraFov;
      camera.updateProjectionMatrix();
    }
    return true;
  };

  const setPointer = (event) => {
    const bounds = canvas.getBoundingClientRect();
    if (
      event.clientX < bounds.left || event.clientX > bounds.right ||
      event.clientY < bounds.top || event.clientY > bounds.bottom
    ) {
      pointerValid = false;
      return false;
    }
    pointer.set(
      ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
      -((event.clientY - bounds.top) / bounds.height) * 2 + 1,
    );
    pointerValid = true;
    return true;
  };

  const onPointerMove = (event) => {
    if (document.body.classList.contains("is-collection-open")) {
      pointerValid = false;
      return;
    }
    if (window.matchMedia("(min-width: 768px) and (hover: hover) and (pointer: fine)").matches) {
      setPointer(event);
    }
  };

  const onPointerDown = (event) => {
    if (
      document.body.classList.contains("is-collection-open") ||
      (event.target instanceof Element &&
        event.target.closest("button, a, input, textarea, select, [role='button']"))
    ) return;
    if (!setPointer(event)) return;
    if (selectedDoor) return;
    raycaster.setFromCamera(pointer, camera);
    if (worldProgress >= doorStartProgress && worldProgress <= doorEndProgress) {
      const hit = raycaster.intersectObjects(doorTargets, false)[0]?.object;
      const door = doors.find((entry) => entry.frame === hit || entry.panels === hit || entry.card === hit);
      if (door) {
        selectDoor(door.root.userData.skill.title);
        return;
      }
    }

    if (worldProgress >= projectsStartProgress) return;
    const hit = raycaster.intersectObjects(interactiveTargets, true)[0]?.object;
    const phone = projectPhones.find((entry) => entry === hit || entry.children.includes(hit));
    if (phone) {
      window.dispatchEvent(new CustomEvent("portfolio:project-select", { detail: phone.userData.project.title }));
    }
  };

  const setWorldProgress = (progress) => {
    worldProgressActive = true;
    worldProgress = THREE.MathUtils.clamp(progress, 0, 1);
    group.visible = true;
    const scrollRange = Math.max(stageElement.scrollHeight - window.innerHeight, 1);
    doorStartProgress = THREE.MathUtils.clamp(doorsSection.offsetTop / scrollRange, 0, 1);
    doorEndProgress = THREE.MathUtils.clamp(
      (doorsSection.offsetTop + doorsSection.offsetHeight) / scrollRange,
      doorStartProgress + 0.01,
      1,
    );
    projectsStartProgress = THREE.MathUtils.clamp(projectsSection.offsetTop / scrollRange, 0, 1);
    const doorSceneVisible = worldProgress <= doorEndProgress;
    auxiliaryPointLights.forEach((light) => {
      light.visible = !doorSceneVisible;
    });
    if (doorSceneVisible) {
      scene.fog = new THREE.FogExp2(0x05060a, 0.06);
      scene.background = new THREE.Color(0x05060a);
    } else {
      scene.fog = new THREE.FogExp2(0x05060a, 0.012);
    }
    doorRoom.visible = doorSceneVisible;
    dust.visible = doorSceneVisible && !motionReduced;
    doors.forEach((door) => {
      door.root.visible = doorSceneVisible;
    });
    if (worldProgress < doorStartProgress) {
      const progressToDoors = doorStartProgress > 0 ? worldProgress / doorStartProgress : 1;
      targetCameraFov = baseCameraFov;
      cameraTarget.copy(doorApproachCurve.getPointAt(progressToDoors));
      lookTarget.copy(doorApproachLookCurve.getPointAt(progressToDoors));
    } else if (worldProgress <= doorEndProgress) {
      cameraTarget.copy(doorCameraPosition);
      lookTarget.copy(doorFitCenter);
      targetCameraFov = doorCameraFov;
    } else {
      const progressAfterDoors = (worldProgress - doorEndProgress) / (1 - doorEndProgress);
      targetCameraFov = baseCameraFov;
      cameraTarget.copy(doorExitCurve.getPointAt(progressAfterDoors));
      lookTarget.copy(doorExitLookCurve.getPointAt(progressAfterDoors));
    }
    if (!cameraInitialized || motionReduced) {
      camera.position.copy(cameraTarget);
      camera.lookAt(lookTarget);
      camera.fov = targetCameraFov;
      camera.updateProjectionMatrix();
      cameraInitialized = true;
      camera.updateMatrixWorld(true);
    }
  };

  const update = () => {
    const now = performance.now();
    const delta = motionReduced ? 1 : Math.min((now - lastFrameTime) / 1000, 0.05);
    lastFrameTime = now;

    if (selectedDoor && !selectionNavigates) {
      setDoorFocusTarget(selectedDoor);
      doorTransitionElapsed += delta;
      if (doorTransitionElapsed >= 1.08) finishDoorSelection();
    }

    if (worldProgressActive && !motionReduced && !(selectedDoor && selectionNavigates)) {
      const cameraEase = 1 - Math.exp(-delta * 7);
      const lookEase = 1 - Math.exp(-delta * 9);
      cameraMotionTarget.copy(cameraTarget);
      cameraLookTarget.copy(lookTarget);
      if (worldProgress >= doorStartProgress && worldProgress <= doorEndProgress && !selectedDoor) {
        cameraMotionTarget.z += Math.sin(now * 0.00028) * 0.012;
      }
      if (pointerValid) {
        cameraMotionTarget.x += pointer.x * 0.144;
      }
      camera.position.lerp(cameraMotionTarget, cameraEase);
      cameraLookTarget.copy(camera.position).lerp(lookTarget, lookEase);
      camera.lookAt(cameraLookTarget);
      camera.fov += (targetCameraFov - camera.fov) * (1 - Math.exp(-delta * 5));
      camera.updateProjectionMatrix();
    }

    if (selectedDoor) {
      doors.forEach((door) => setDoorTarget(door, door === selectedDoor));
    } else if (!document.body.classList.contains("is-collection-open") &&
      worldProgress >= doorStartProgress && worldProgress <= doorEndProgress && pointerValid &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(doorTargets, false)[0]?.object;
      const hoveredDoor = doors.find((door) =>
        door.frame === hit || door.panels === hit || door.card === hit);
      doors.forEach((door) => setDoorTarget(door, door === hoveredDoor));
    } else {
      doors.forEach((door) => setDoorTarget(door, false));
    }

    doors.forEach((door) => {
      updatePanelInstances(door);
      const time = motionReduced ? 0 : now * 0.001;
      const flickerPhase = (time + door.index * 1.1) % 4.2;
      const flicker = !motionReduced && flickerPhase < 0.055 ? 0.72 : 1;
      door.portalMaterial.uniforms.uTime.value = time;
      door.labelMaterial.opacity = door.labelGlow.value * flicker;
      door.outline.material.opacity = (0.9 + door.targetOpen * 0.1) * flicker;
    });

    if (!motionReduced) {
      dust.position.set(Math.sin(now * 0.00011) * 0.09, Math.sin(now * 0.00018) * 0.12, 0);
      dust.rotation.y += delta * 0.018;
    }

  };

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerdown", onPointerDown);
  const onDoorHover = (event) => {
    if (selectedDoor) return;
    const title = event.detail?.title;
    doors.forEach((door) => setDoorTarget(
      door,
      Boolean(title && door.root.userData.skill.title === title),
    ));
  };
  window.addEventListener("portfolio:door-hover", onDoorHover);
  return {
    setWorldProgress,
    resize: fitDoorCamera,
    update,
    selectDoor,
    focusDoor,
    resetDoorSelection() {
      doorTransitionTimeline?.kill();
      doorTransitionTimeline = undefined;
      window.clearTimeout(doorNavigationTimer);
      doorNavigationTimer = undefined;
      window.clearTimeout(doorTransitionForceTimer);
      doorTransitionForceTimer = undefined;
      selectedDoor = null;
      selectedDoorDetail = undefined;
      selectionNavigates = true;
      doorNavigationDispatched = false;
      doorTransitionElapsed = 0;
      pointerValid = false;
      gsap.killTweensOf(camera);
      gsap.killTweensOf(camera.position);
      gsap.killTweensOf(camera.rotation);
      gsap.killTweensOf(lookTarget);
      doors.forEach((door) => setDoorTarget(door, false));
      setWorldProgress(worldProgress);
      lastFrameTime = performance.now();
    },
    setMotionReduced(value) {
      motionReduced = value;
      if (value && selectedDoor && selectionNavigates) forceFinishDoorTransition();
      dust.visible = !value && worldProgress <= doorEndProgress;
      if (value) {
        doors.forEach((door) => {
          gsap.killTweensOf(door.leftPanel.position);
          gsap.killTweensOf(door.rightPanel.position);
          gsap.killTweensOf(door.portalMaterial.uniforms.uBrightness);
          gsap.killTweensOf(door.labelGlow);
          gsap.killTweensOf(door.spillMaterial);
          gsap.killTweensOf(door.spill.scale);
          const offset = door.targetOpen ? door.panelOpenOffset : 0;
          door.leftPanel.position.x = -door.panelClosedX - offset;
          door.rightPanel.position.x = door.panelClosedX + offset;
          updatePanelInstances(door);
          door.portalMaterial.uniforms.uBrightness.value = door.targetOpen ? 1.25 : 0.65;
          door.spillMaterial.opacity = door.targetOpen ? 0.62 : 0.18;
          door.spill.scale.setScalar(door.targetOpen ? 1.18 : 1);
          door.labelGlow.value = door.targetOpen ? 1.25 : 1;
        });
      }
      lastFrameTime = performance.now();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      doorTransitionTimeline?.kill();
      doorTransitionTimeline = undefined;
      window.clearTimeout(doorNavigationTimer);
      doorNavigationTimer = undefined;
      window.clearTimeout(doorTransitionForceTimer);
      doorTransitionForceTimer = undefined;
      gsap.killTweensOf(camera);
      gsap.killTweensOf(camera.position);
      gsap.killTweensOf(camera.rotation);
      gsap.killTweensOf(lookTarget);
      gsap.killTweensOf(document.querySelector("#reveal-flash"));
      doors.forEach((door) => {
        gsap.killTweensOf(door.leftPanel.position);
        gsap.killTweensOf(door.rightPanel.position);
        gsap.killTweensOf(door.portalMaterial.uniforms.uBrightness);
        gsap.killTweensOf(door.labelGlow);
        gsap.killTweensOf(door.spillMaterial);
        gsap.killTweensOf(door.spill.scale);
      });
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("portfolio:door-hover", onDoorHover);
      textures.forEach((texture) => texture.dispose());
      textures.clear();
      const geometries = new Set();
      const materials = new Set();
      group.traverse((object) => {
        if (object.geometry) geometries.add(object.geometry);
        if (object.material) {
          const objectMaterials = Array.isArray(object.material) ? object.material : [object.material];
          objectMaterials.forEach((material) => materials.add(material));
        }
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
    },
  };
}
