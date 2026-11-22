import * as THREE from "three";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";

const DOOR_SKILL_ORDER = [
  { title: "Full Stack Development", portalColor: 0x2d4261 },
  { title: "Forex Trading", portalColor: 0x57434c },
  { title: "Ethical Hacking", portalColor: 0x607358 },
  { title: "Futures Trading", portalColor: 0x824b37 },
];
const DOOR_SPACING = 3.1;

function createFloorTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not create the door-room floor texture.");

  context.fillStyle = "#171413";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = "rgba(173, 139, 103, 0.045)";
  context.lineWidth = 2;
  for (let position = 0; position <= 512; position += 256) {
    context.beginPath();
    context.moveTo(0, position);
    context.lineTo(512, position);
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
  wallGradient.addColorStop(0, "#2a2523");
  wallGradient.addColorStop(0.7, "#211d1c");
  wallGradient.addColorStop(1, "#1a1716");
  context.fillStyle = wallGradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function createDoorLeafTexture(color) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 768;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not create the door finish texture.");

  const baseColor = `#${color.toString(16).padStart(6, "0")}`;
  context.fillStyle = baseColor;
  context.fillRect(0, 0, canvas.width, canvas.height);
  for (let x = 10; x < canvas.width; x += 18) {
    context.fillStyle = "rgba(255,255,255,0.08)";
    context.fillRect(x, 0, 3, canvas.height);
    context.fillStyle = "rgba(0,0,0,0.12)";
    context.fillRect(x + 5, 0, 2, canvas.height);
  }
  const sheen = context.createLinearGradient(0, 0, canvas.width, 0);
  sheen.addColorStop(0, "rgba(0,0,0,0.18)");
  sheen.addColorStop(0.18, "rgba(255,255,255,0.08)");
  sheen.addColorStop(0.8, "rgba(255,255,255,0.02)");
  sheen.addColorStop(1, "rgba(0,0,0,0.16)");
  context.fillStyle = sheen;
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
  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(34, 18),
    new THREE.MeshStandardMaterial({
      map: wallTexture,
      color: 0xffffff,
      roughness: 0.88,
      metalness: 0,
      side: THREE.DoubleSide,
    }),
  );
  wall.position.set(0, 6.8, -34.25);
  room.add(wall);

  const floorTexture = createFloorTexture();
  textures.add(floorTexture);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(38, 28),
    new THREE.MeshStandardMaterial({
      map: floorTexture,
      color: 0xffffff,
      roughness: 0.96,
      metalness: 0,
      side: THREE.DoubleSide,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -2.08, -23.5);
  room.add(floor);

  const trimMaterial = new THREE.MeshStandardMaterial({
    color: 0x403734,
    roughness: 0.62,
    metalness: 0,
  });
  const baseboard = new THREE.Mesh(
    new THREE.BoxGeometry(34, 0.22, 0.16),
    trimMaterial,
  );
  baseboard.position.set(0, -1.96, -34.12);
  room.add(baseboard);
  const roomLight = new THREE.PointLight(0xffe6d1, 22, 38, 2);
  roomLight.position.set(0, 4.8, -24);
  room.add(roomLight);
  return room;
}

function createSkillCardTexture(skill, color) {
  const canvas = document.createElement("canvas");
  canvas.width = 720;
  canvas.height = 860;
  const context = canvas.getContext("2d");
  if (!context) throw new Error(`Could not create a canvas card for ${skill.title}.`);

  const gradient = context.createLinearGradient(0, 0, 720, 860);
  gradient.addColorStop(0, "#f7f3ef");
  gradient.addColorStop(1, "#e5dfdb");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 720, 860);

  const colorGradient = context.createRadialGradient(360, 170, 15, 360, 170, 270);
  colorGradient.addColorStop(0, `${color}22`);
  colorGradient.addColorStop(1, `${color}00`);
  context.fillStyle = colorGradient;
  context.fillRect(0, 0, 720, 500);

  context.strokeStyle = `${color}77`;
  context.lineWidth = 2;
  context.beginPath();
  context.roundRect(32, 32, 656, 796, 30);
  context.stroke();

  context.fillStyle = color;
  context.font = "bold 84px monospace";
  context.fillText(skill.icon, 64, 162);
  context.fillStyle = "#242327";
  context.font = "600 38px sans-serif";
  const titleWords = skill.title.split(" ");
  let titleY = 250;
  let line = "";
  titleWords.forEach((word, index) => {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width > 575 && line) {
      context.fillText(line, 64, titleY);
      titleY += 48;
      line = word;
    } else {
      line = candidate;
    }
    if (index === titleWords.length - 1) context.fillText(line, 64, titleY);
  });

  context.fillStyle = "rgba(42, 40, 42, 0.78)";
  context.font = "24px sans-serif";
  const descriptionWords = skill.description.split(" ");
  let descriptionLine = "";
  let descriptionY = titleY + 68;
  descriptionWords.forEach((word) => {
    const candidate = descriptionLine ? `${descriptionLine} ${word}` : word;
    if (context.measureText(candidate).width > 570 && descriptionLine) {
      context.fillText(descriptionLine, 64, descriptionY);
      descriptionY += 34;
      descriptionLine = word;
    } else {
      descriptionLine = candidate;
    }
  });
  if (descriptionLine) context.fillText(descriptionLine, 64, descriptionY);

  const detailBullets = Array.isArray(skill.doorDetail) ? skill.doorDetail.slice(0, 3) : [];
  if (detailBullets.length) {
    let detailY = 540;
    context.textAlign = "left";
    detailBullets.forEach((detail) => {
      context.fillStyle = "#ba8e4d";
      context.beginPath();
      context.arc(72, detailY - 7, 4, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = "rgba(42,40,42,0.86)";
      context.font = "20px sans-serif";
      context.fillText(detail, 90, detailY);
      detailY += 38;
    });
  }

  let tagX = 64;
  let tagY = 650;
  context.font = "18px monospace";
  skill.tags.forEach((tag) => {
    const width = context.measureText(tag).width + 34;
    if (tagX + width > 650) {
      tagX = 64;
      tagY += 48;
    }
    context.fillStyle = "rgba(255,255,255,0.48)";
    context.strokeStyle = `${color}77`;
    context.beginPath();
    context.roundRect(tagX, tagY - 28, width, 40, 20);
    context.fill();
    context.stroke();
    context.fillStyle = "#39353a";
    context.fillText(tag, tagX + 17, tagY - 2);
    tagX += width + 12;
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function createArchShape(width, height, radius, openingWidth, openingHeight) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, 0);
  shape.lineTo(-width / 2, height - radius);
  shape.quadraticCurveTo(-width / 2, height, 0, height);
  shape.quadraticCurveTo(width / 2, height, width / 2, height - radius);
  shape.lineTo(width / 2, 0);
  shape.closePath();

  const openingRadius = openingWidth / 2;
  const opening = new THREE.Path();
  opening.moveTo(-openingWidth / 2, 0.08);
  opening.lineTo(-openingWidth / 2, openingHeight - openingRadius);
  opening.quadraticCurveTo(-openingWidth / 2, openingHeight, 0, openingHeight);
  opening.quadraticCurveTo(openingWidth / 2, openingHeight, openingWidth / 2, openingHeight - openingRadius);
  opening.lineTo(openingWidth / 2, 0.08);
  opening.closePath();
  shape.holes.push(opening);
  return shape;
}

function createDoorShape(width, height) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(0, height - width / 2);
  shape.quadraticCurveTo(0, height, width / 2, height);
  shape.quadraticCurveTo(width, height, width, height - width / 2);
  shape.lineTo(width, 0);
  shape.closePath();
  return shape;
}

function createDoorPlateTexture(skill, color) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  if (!context) throw new Error(`Could not create the label plate for ${skill.title}.`);

  context.fillStyle = "#d6bd82";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = "#f4e3b4";
  context.lineWidth = 5;
  context.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
  context.fillStyle = "#423a31";
  context.font = "600 34px sans-serif";
  context.textAlign = "center";
  const label = skill.title
    .replace("Full Stack Development", "FULL STACK")
    .replace("Forex Trading", "FOREX")
    .replace("Ethical Hacking", "CYBERSECURITY")
    .replace("Futures Trading", "FUTURES");
  context.fillText(label, canvas.width / 2, 78, canvas.width - 28);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function createDoor(skill, color, index, textures, scaleX, scaleY) {
  const root = new THREE.Group();
  root.position.set((index - 1.5) * DOOR_SPACING, -2.06, -32);
  root.scale.set(scaleX, scaleY, scaleY);
  root.userData.skill = skill;

  const frameShape = createArchShape(2.8, 3.55, 1.4, 2.38, 3.15);
  const frameGeometry = new THREE.ExtrudeGeometry(frameShape, {
    depth: 0.24,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelSize: 0.04,
    bevelThickness: 0.045,
  });
  const frameMaterial = new THREE.MeshStandardMaterial({
    color: 0x302a29,
    metalness: 0.08,
    roughness: 0.58,
    side: THREE.DoubleSide,
  });
  const frame = new THREE.Mesh(frameGeometry, frameMaterial);
  frame.position.z = -0.02;
  root.add(frame);

  const innerTrimGeometry = new THREE.ExtrudeGeometry(
    createArchShape(2.58, 3.34, 1.29, 2.38, 3.15),
    {
      depth: 0.05,
      bevelEnabled: false,
      curveSegments: 12,
    },
  );
  const innerTrim = new THREE.Mesh(
    innerTrimGeometry,
    new THREE.MeshStandardMaterial({
      color: 0x66594f,
      metalness: 0.2,
      roughness: 0.48,
      side: THREE.DoubleSide,
    }),
  );
  innerTrim.position.z = 0.32;
  root.add(innerTrim);

  const panelTexture = createSkillCardTexture(skill, `#${color.toString(16).padStart(6, "0")}`);
  textures.add(panelTexture);
  const cardMaterial = new THREE.MeshBasicMaterial({
    map: panelTexture,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const card = new THREE.Mesh(new THREE.PlaneGeometry(2.04, 2.52), cardMaterial);
  card.position.set(0, 1.45, -0.34);
  root.add(card);

  const leafWidth = 2.27;
  const hinge = new THREE.Group();
  hinge.position.set(-leafWidth / 2, 0, 0.12);
  root.add(hinge);

  const leafShape = createDoorShape(leafWidth, 3.1);
  const leafGeometry = new THREE.ExtrudeGeometry(leafShape, {
    depth: 0.11,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.025,
    bevelThickness: 0.035,
  });
  const leafTexture = createDoorLeafTexture(color);
  textures.add(leafTexture);
  const leafMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: leafTexture,
    metalness: 0.04,
    roughness: 0.62,
    emissive: color,
    emissiveIntensity: 0.025,
    side: THREE.DoubleSide,
  });
  const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
  hinge.add(leaf);

  const handlePlate = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.09, 0.04, 24),
    new THREE.MeshStandardMaterial({
      color: 0xcaa565,
      metalness: 0.55,
      roughness: 0.35,
    }),
  );
  handlePlate.position.set(leafWidth - 0.38, 1.32, 0.19);
  handlePlate.rotation.x = Math.PI / 2;
  hinge.add(handlePlate);

  const handle = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.07, 0.07),
    new THREE.MeshStandardMaterial({
      color: 0xcaa565,
      metalness: 0.62,
      roughness: 0.3,
    }),
  );
  handle.position.set(leafWidth - 0.56, 1.32, 0.24);
  hinge.add(handle);

  const plateTexture = createDoorPlateTexture(
    skill,
    `#${color.toString(16).padStart(6, "0")}`,
  );
  textures.add(plateTexture);
  const labelPlate = new THREE.Mesh(
    new THREE.BoxGeometry(1.05, 0.3, 0.08),
    new THREE.MeshStandardMaterial({
      color: 0xf3e5ab,
      metalness: 0.72,
      roughness: 0.25,
    }),
  );
  labelPlate.position.set(leafWidth / 2, 2, 0.17);
  hinge.add(labelPlate);
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(0.94, 0.22),
    new THREE.MeshBasicMaterial({ map: plateTexture, transparent: false }),
  );
  label.position.set(leafWidth / 2, 2, 0.22);
  hinge.add(label);

  const spill = new THREE.PointLight(color, 0, 5, 2);
  spill.position.set(0, 1.2, -0.8);
  root.add(spill);

  const hingePinGeometry = new THREE.CylinderGeometry(0.055, 0.055, 3.1, 12);
  const hingePinMaterial = new THREE.MeshStandardMaterial({
    color: 0xd3c5a5,
    metalness: 0.32,
    roughness: 0.55,
  });
  const hingePin = new THREE.Mesh(hingePinGeometry, hingePinMaterial);
  hingePin.position.set(-leafWidth / 2, 1.55, 0.2);
  root.add(hingePin);

  return {
    root,
    frame,
    leaf,
    hinge,
    card,
    spill,
    targetOpen: 0,
    color,
  };
}

export function createWorldScenes({ scene, camera, font, config }) {
  const textures = new Set();
  const isMobile = window.matchMedia("(max-width: 767px)").matches;
  const doorScaleX = 1;
  const doorScaleY = isMobile ? 1.55 : 1.72;
  const group = new THREE.Group();
  group.visible = false;
  scene.add(group);
  const doorRoom = createDoorRoom(textures);
  group.add(doorRoom);

  const portalSkills = DOOR_SKILL_ORDER.map(({ title, portalColor }) => {
    const skill = config.skills.find((entry) => entry.title === title);
    if (!skill) throw new Error(`Missing configured skill for portal: ${title}`);
    return { skill, color: portalColor };
  });
  const doors = portalSkills.map(({ skill, color }, index) => {
    const door = createDoor(skill, color, index, textures, doorScaleX, doorScaleY);
    group.add(door.root);
    return door;
  });

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

  const doorTargets = doors.flatMap((door) => [door.frame, door.leaf, door.card]);
  const interactiveTargets = projectPhones;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let pointerValid = false;
  let worldProgress = 0;
  let selectedDoor = null;
  let doorTransitionElapsed = 0;
  let motionReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let disposed = false;
  let lastFrameTime = performance.now();
  const baseCameraFov = camera.fov;
  const doorCameraFov = 60;
  let targetCameraFov = baseCameraFov;
  const cameraTarget = new THREE.Vector3(0, 0, -5);
  const lookTarget = new THREE.Vector3(0, 0, -7);
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

  const setDoorFocusTarget = (door) => {
    const x = door.root.position.x;
    cameraTarget.set(x, 0.12, -35.2);
    lookTarget.set(x, 1.35, -42);
    targetCameraFov = Math.max(36, doorCameraFov - 14);
  };

  const finishDoorSelection = () => {
    if (!selectedDoor) return;
    const title = selectedDoor.root.userData.skill.title;
    selectedDoor = null;
    doorTransitionElapsed = 0;
    window.dispatchEvent(new CustomEvent("portfolio:door-select", { detail: title }));
  };

  const selectDoor = (title) => {
    if (document.body.classList.contains("is-collection-open")) return false;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) motionReduced = true;
    const door = doors.find((entry) => entry.root.userData.skill.title === title);
    if (!door || selectedDoor) return false;
    selectedDoor = door;
    doorTransitionElapsed = 0;
    doors.forEach((entry) => {
      entry.targetOpen = entry === door ? 1 : 0;
    });
    setDoorFocusTarget(door);

    if (motionReduced) {
      camera.position.copy(cameraTarget);
      camera.lookAt(lookTarget);
      camera.fov = targetCameraFov;
      camera.updateProjectionMatrix();
      finishDoorSelection();
    }
    return true;
  };

  const setPointer = (event) => {
    pointer.set(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1,
    );
    pointerValid = true;
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
    setPointer(event);
    if (selectedDoor) return;
    raycaster.setFromCamera(pointer, camera);
    if (worldProgress >= doorStartProgress && worldProgress <= doorEndProgress) {
      const hit = raycaster.intersectObjects(doorTargets, false)[0]?.object;
      const door = doors.find((entry) => entry.frame === hit || entry.leaf === hit || entry.card === hit);
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
      (doorsSection.offsetTop + doorsSection.offsetHeight - window.innerHeight) / scrollRange,
      doorStartProgress + 0.01,
      1,
    );
    projectsStartProgress = THREE.MathUtils.clamp(projectsSection.offsetTop / scrollRange, 0, 1);
    const doorSceneVisible = worldProgress <= doorEndProgress;
    doorRoom.visible = doorSceneVisible;
    doors.forEach((door) => {
      door.root.visible = doorSceneVisible;
    });
    if (worldProgress < doorStartProgress) {
      const progressToDoors = doorStartProgress > 0 ? worldProgress / doorStartProgress : 1;
      targetCameraFov = baseCameraFov;
      cameraTarget.copy(doorApproachCurve.getPointAt(progressToDoors));
      lookTarget.copy(doorApproachLookCurve.getPointAt(progressToDoors));
    } else if (worldProgress <= doorEndProgress) {
      const doorProgress = (worldProgress - doorStartProgress) / (doorEndProgress - doorStartProgress);
      const x = THREE.MathUtils.lerp(doorStartX, doorEndX, doorProgress);
      targetCameraFov = doorCameraFov;
      cameraTarget.set(x, 0, -23);
      lookTarget.set(x, isMobile ? 3.4 : 3.1, -32);
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
    }
  };

  const update = () => {
    const now = performance.now();
    const delta = motionReduced ? 1 : Math.min((now - lastFrameTime) / 1000, 0.05);
    lastFrameTime = now;

    if (selectedDoor) {
      setDoorFocusTarget(selectedDoor);
      doorTransitionElapsed += delta;
      if (doorTransitionElapsed >= 1.08) finishDoorSelection();
    }

    if (worldProgressActive && !motionReduced) {
      const cameraEase = 1 - Math.exp(-delta * 7);
      const lookEase = 1 - Math.exp(-delta * 9);
      camera.position.lerp(cameraTarget, cameraEase);
      camera.lookAt(camera.position.clone().lerp(lookTarget, lookEase));
      camera.fov += (targetCameraFov - camera.fov) * (1 - Math.exp(-delta * 5));
      camera.updateProjectionMatrix();
    }

    if (selectedDoor) {
      doors.forEach((door) => {
        door.targetOpen = door === selectedDoor ? 1 : 0;
      });
    } else if (!document.body.classList.contains("is-collection-open") &&
      worldProgress >= doorStartProgress && worldProgress <= doorEndProgress && pointerValid &&
      window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(doorTargets, false)[0]?.object;
      const hoveredDoor = doors.find(
        (door) => door.frame === hit || door.leaf === hit || door.card === hit,
      );
      doors.forEach((door) => {
        door.targetOpen = door === hoveredDoor ? 1 : 0;
      });
    } else {
      doors.forEach((door) => {
        door.targetOpen = 0;
      });
    }

    doors.forEach((door) => {
      const openAmount = door.targetOpen > 0.5 ? 1.35 : 0;
      if (motionReduced) door.hinge.rotation.y = openAmount;
      else door.hinge.rotation.y += (openAmount - door.hinge.rotation.y) * Math.min(1, delta * 8);
      const cardTarget = door.targetOpen > 0.5 ? 0.96 : 0;
      if (motionReduced) {
        door.card.material.opacity = cardTarget;
        door.spill.intensity = door.targetOpen * (door === selectedDoor ? 4.5 : 3);
      } else {
        door.card.material.opacity +=
          (cardTarget - door.card.material.opacity) * Math.min(1, delta * 5);
        const spillTarget = door.targetOpen * (door === selectedDoor ? 4.5 : 3);
        door.spill.intensity += (spillTarget - door.spill.intensity) * Math.min(1, delta * 5);
      }
      door.leaf.material.emissiveIntensity =
        0.025 + door.targetOpen * 0.07 +
        (motionReduced ? 0 : Math.sin(now * 0.002 + door.color) * 0.025);
    });

  };

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerdown", onPointerDown);
  return {
    setWorldProgress,
    update,
    selectDoor,
    resetDoorSelection() {
      selectedDoor = null;
      doorTransitionElapsed = 0;
      pointerValid = false;
      doors.forEach((door) => {
        door.targetOpen = 0;
      });
      setWorldProgress(worldProgress);
      lastFrameTime = performance.now();
    },
    setMotionReduced(value) {
      motionReduced = value;
      lastFrameTime = performance.now();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
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
