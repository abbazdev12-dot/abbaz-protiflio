import * as THREE from "three";
import { disposeObject3D, removeListeners } from "../core/cleanup.js";
import "./doors.css";
import { mountHero } from "../hero/index.js";

const FOCUS_DURATION = 0.28;
const DOOR_OPEN_DURATION = 0.86;
const ENTRY_DURATION = 0.64;

export function createDoorsState(config) {
  let root = null;
  let context = null;
  let listeners = new Set();
  let sceneState = null;
  let heroController = null;
  let scheduledFrame = null;
  let navigationTimer = null;
  let fallbackEnterTimer = null;
  let pendingDoorsReturnUntil = 0;

  function enter(nextContext) {
    const previousRootClass = root?.className || "none";
    const isDoorsRoute = nextContext.route === "doors";
    const returningFromWorld = previousRootClass.split(" ").includes("world-state") && isDoorsRoute;
    const returning = returningFromWorld || (isDoorsRoute && performance.now() < pendingDoorsReturnUntil);
    if (isDoorsRoute && returning) {
      pendingDoorsReturnUntil = performance.now() + 800;
    } else if (!isDoorsRoute) {
      pendingDoorsReturnUntil = 0;
    }
    teardown();
    context = nextContext;
    root = document.createElement("main");
    root.id = "main-content";
    root.tabIndex = -1;
    root.dataset.stateRoot = "doors";

    if (context.route.startsWith("world:")) {
      renderWorld(context.route.slice("world:".length));
    } else if (context.route === "page") {
      renderPage();
    } else {
      renderDoors(returning);
    }

    context.app.replaceChildren(root);
    if (context.route === "doors") {
      setupDoorExperience(context);
    }
    return Promise.resolve({ ready: true });
  }

  function renderDoors(returning) {
    root.className = `doors-state${returning ? " is-returning" : ""}`;
    root.innerHTML = `
      <header class="foundation-header doors-header">
        <a class="foundation-brand" href="#doors" aria-label="ABBAS.P.A, return to doors">${config.site.name}</a>
        <nav aria-label="Primary navigation">
          <a href="#page">Portfolio</a>
        </nav>
      </header>
      <section class="doors-experience" aria-labelledby="doors-heading">
        <div class="doors-intro">
          <p class="eyebrow">ABBAS.P.A <span>·</span> FOUR WORLDS</p>
          <h1 id="doors-heading">Choose a direction.</h1>
          <p>Four doors into what I explore, build, and believe in.</p>
        </div>
        <div class="door-selector-grid" aria-label="Select a portfolio world">
          ${config.doors.map((door, index) => `
            <button
              class="door-selector${index >= 2 ? " is-hinge-right" : ""}"
              type="button"
              data-door-index="${index}"
              style="--door-accent:${door.accent};--door-warm:${door.warmAccent || "#D49A62"}"
              aria-label="${door.number}, ${door.title}: ${door.shortDescription || door.description} Open this world."
            >
              <span class="door-label">
                <span class="door-number">${door.number}</span>
                <strong class="door-title">${door.title}</strong>
                <span class="door-description">${door.shortDescription || door.description}</span>
                <span class="door-enter">OPEN WORLD <span aria-hidden="true">↗</span></span>
              </span>
            </button>
          `).join("")}
        </div>
        <p class="door-status" data-door-status role="status" aria-live="polite">
          Select a door to enter.
        </p>
      </section>
    `;

    const buttons = Array.from(root.querySelectorAll("[data-door-index]"));
    buttons.forEach((button, index) => {
      listen(button, "pointerenter", () => setHoveredDoor(index));
      listen(button, "pointerleave", () => {
        if (document.activeElement !== button) setHoveredDoor(null);
      });
      listen(button, "focus", () => setHoveredDoor(index));
      listen(button, "blur", () => {
        if (!button.matches(":hover")) setHoveredDoor(null);
      });
      listen(button, "click", () => activateDoor(index));
    });

    listen(root.querySelector(".door-selector-grid"), "keydown", (event) => {
      const currentIndex = buttons.indexOf(event.target);
      if (currentIndex < 0) return;

      let nextIndex = currentIndex;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        nextIndex = (currentIndex + 1) % buttons.length;
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
      } else {
        return;
      }

      event.preventDefault();
      buttons[nextIndex].focus();
    });
  }

  function setupDoorExperience(activeContext) {
    let renderer;
    let scene;
    try {
      renderer = activeContext.renderer.ensure();
      scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0x080705, 19, 42);
      const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
      const doors = config.doors.map((door, index) => createDoor(scene, door, index));
      addEnvironment(scene);

      const state = {
        context: activeContext,
        scene,
        camera,
        doors,
        renderer,
        hoveredDoor: null,
        selectedDoor: null,
        sequence: null,
        active: true,
        tickerCallback: null,
        lookAt: new THREE.Vector3()
      };
      sceneState = state;
      layoutScene(state);

      state.tickerCallback = (delta) => {
        if (!state.active) return;
        updateDoorSequence(state, delta);
        if (!state.active) return;
        updateDoorEmphasis(state, delta);

        try {
          state.renderer.render(state.scene, state.camera);
        } catch (error) {
          disableScene(state, error);
        }
      };

      const onResize = () => {
        if (sceneState !== state || !state.active) return;
        if (!state.sequence) {
          layoutScene(state);
        } else {
          state.camera.aspect = window.innerWidth / Math.max(window.innerHeight, 1);
          state.camera.updateProjectionMatrix();
        }
        activeContext.renderer.resize();
      };
      listen(window, "resize", onResize);

      scheduledFrame = window.requestAnimationFrame(() => {
        scheduledFrame = null;
        if (sceneState !== state || !state.active || !root?.isConnected) return;
        attachCanvas(activeContext, renderer);
        activeContext.renderer.resize();
        activeContext.ticker.register(state.tickerCallback);
        state.tickerCallback(0);
      });
    } catch (error) {
      if (scene) {
        disposeObject3D(scene);
        scene.clear();
      }
      hideCanvas(activeContext);
      showWebGLFallback(error);
    }
  }

  function createDoor(scene, door, index) {
    const width = door.doorWidth || 2.2;
    const height = door.doorHeight || 4;
    const depth = 0.4;
    const profile = door.archProfile || "round";
    const identityColor = new THREE.Color(door.accent);
    const warmColor = new THREE.Color(door.warmAccent || "#D49A62");
    const group = new THREE.Group();
    group.name = `door-${door.id}`;
    group.rotation.y = (index - 1.5) * 0.035;

    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0x514231,
      metalness: 0.74,
      roughness: 0.4,
      emissive: warmColor,
      emissiveIntensity: 0.075
    });
    const frame = new THREE.Mesh(
      new THREE.ExtrudeGeometry(createArchShape(width, height, profile), {
        depth,
        bevelEnabled: true,
        bevelThickness: 0.06,
        bevelSize: 0.045,
        bevelSegments: 3,
        curveSegments: 24
      }),
      frameMaterial
    );
    frame.position.z = -depth * 0.5;
    group.add(frame);

    const leafWidth = width - 0.18;
    const leafHeight = height - 0.18;
    const hingeSide = index < 2 ? -1 : 1;
    const hinge = new THREE.Group();
    hinge.position.set(hingeSide * leafWidth * 0.5, 0, 0.04);
    group.add(hinge);

    const material = new THREE.MeshStandardMaterial({
      color: 0x3b342b,
      metalness: 0.58,
      roughness: 0.48,
      emissive: identityColor.clone().multiplyScalar(0.28),
      emissiveIntensity: 0.075
    });
    const leaf = new THREE.Mesh(
      new THREE.ExtrudeGeometry(createArchShape(leafWidth, leafHeight, profile), {
        depth: 0.14,
        bevelEnabled: true,
        bevelThickness: 0.025,
        bevelSize: 0.025,
        bevelSegments: 2,
        curveSegments: 24
      }),
      material
    );
    leaf.position.set(-hingeSide * leafWidth * 0.5, 0, -0.035);
    hinge.add(leaf);

    const insetMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a251f,
      metalness: 0.48,
      roughness: 0.56,
      emissive: warmColor,
      emissiveIntensity: 0.065
    });
    const inset = new THREE.Mesh(
      new THREE.ExtrudeGeometry(
        createArchShape(leafWidth * 0.82, leafHeight * 0.84, profile),
        {
          depth: 0.022,
          bevelEnabled: true,
          bevelThickness: 0.01,
          bevelSize: 0.012,
          bevelSegments: 2,
          curveSegments: 20
        }
      ),
      insetMaterial
    );
    inset.position.set(-hingeSide * leafWidth * 0.5, 0.08, 0.14);
    hinge.add(inset);

    const detailGroup = new THREE.Group();
    detailGroup.position.set(-hingeSide * leafWidth * 0.5, 0.035, 0.205);
    hinge.add(detailGroup);
    const detailMaterials = addDoorDetails(detailGroup, door.id, leafWidth, leafHeight, identityColor, warmColor);

    const handle = new THREE.Mesh(
      new THREE.SphereGeometry(0.064, 14, 12),
      new THREE.MeshStandardMaterial({
        color: warmColor,
        metalness: 0.88,
        roughness: 0.24
      })
    );
    handle.position.set(
      -hingeSide * leafWidth * 0.5 - hingeSide * leafWidth * 0.31,
      leafHeight * 0.43,
      0.25
    );
    hinge.add(handle);

    const outlineShape = createArchShape(width, height, profile);
    const outline = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(
        outlineShape.getPoints(32).map((point) => new THREE.Vector3(point.x, point.y, 0.205))
      ),
      new THREE.LineBasicMaterial({
        color: warmColor,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        toneMapped: false
      })
    );
    group.add(outline);

    const accentLight = new THREE.PointLight(warmColor, 0.82, 7.4, 2);
    accentLight.position.set(0, height * 0.54, 0.7);
    group.add(accentLight);

    const hingeMaterial = new THREE.MeshStandardMaterial({
      color: 0x796246,
      metalness: 0.84,
      roughness: 0.3
    });
    [-0.08, height * 0.52, height - 0.3].forEach((y) => {
      const hingeBar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.045, 0.045, 0.22, 12),
        hingeMaterial
      );
      hingeBar.position.set(hingeSide * leafWidth * 0.5, y, 0.045);
      group.add(hingeBar);
    });

    const threshold = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.5, 0.14, 0.75),
      frameMaterial
    );
    threshold.position.set(0, -0.11, 0.25);
    group.add(threshold);

    const groundShadow = new THREE.Mesh(
      new THREE.CircleGeometry(1, 40),
      new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.42,
        depthWrite: false
      })
    );
    groundShadow.rotation.x = -Math.PI * 0.5;
    groundShadow.scale.set(width * 0.78, 1.35, 1);
    groundShadow.position.set(0, -0.16, 0.24);
    group.add(groundShadow);

    scene.add(group);
    return {
      group,
      hinge,
      material,
      insetMaterial,
      frameMaterial,
      detailMaterials,
      accentLight,
      outlineMaterial: outline.material,
      basePanelColor: material.color.clone(),
      baseInsetColor: insetMaterial.color.clone(),
      baseFrameColor: frameMaterial.color.clone(),
      baseFrameEmissive: frameMaterial.emissiveIntensity,
      baseDoorEmissive: material.emissiveIntensity,
      baseInsetEmissive: insetMaterial.emissiveIntensity,
      hover: 0,
      baseScale: 1,
      height,
      openAngle: hingeSide * 1.34
    };
  }

  function createArchShape(width, height, profile) {
    const radius = width * 0.5;
    const shape = new THREE.Shape();
    shape.moveTo(-radius, 0);
    shape.lineTo(radius, 0);

    if (profile === "pointed") {
      const springY = height * 0.78;
      shape.lineTo(radius, springY);
      shape.quadraticCurveTo(radius, height * 0.87, radius * 0.76, height * 0.92);
      shape.lineTo(0, height);
      shape.lineTo(-radius * 0.76, height * 0.92);
      shape.quadraticCurveTo(-radius, height * 0.87, -radius, springY);
    } else if (profile === "squared") {
      const corner = Math.min(0.2, radius * 0.18);
      shape.lineTo(radius, height - corner);
      shape.quadraticCurveTo(radius, height, radius - corner, height);
      shape.lineTo(-radius + corner, height);
      shape.quadraticCurveTo(-radius, height, -radius, height - corner);
    } else if (profile === "ellipse") {
      const springY = height * 0.68;
      shape.lineTo(radius, springY);
      shape.absellipse(0, springY, radius, height - springY, 0, Math.PI, false, 0);
      shape.lineTo(-radius, 0);
    } else {
      const springY = height - radius;
      shape.lineTo(radius, springY);
      shape.absarc(0, springY, radius, 0, Math.PI, false);
      shape.lineTo(-radius, 0);
    }

    shape.closePath();
    return shape;
  }

  function addDoorDetails(group, id, width, height, identityColor, warmColor) {
    const segments = [];
    const half = width * 0.5;
    const addPath = (points) => {
      for (let index = 0; index < points.length - 1; index += 1) {
        segments.push(...points[index], 0, ...points[index + 1], 0);
      }
    };

    if (id === "cybersecurity") {
      addPath([
        [0, height * 0.79],
        [width * 0.2, height * 0.7],
        [width * 0.18, height * 0.52],
        [0, height * 0.4],
        [-width * 0.18, height * 0.52],
        [-width * 0.2, height * 0.7],
        [0, height * 0.79]
      ]);
      addPath([[-half * 0.72, height * 0.27], [-width * 0.14, height * 0.38], [0, height * 0.4]]);
      addPath([[half * 0.72, height * 0.27], [width * 0.14, height * 0.38], [0, height * 0.4]]);
      addPath([[-half * 0.66, height * 0.18], [-half * 0.34, height * 0.18]]);
      addPath([[half * 0.34, height * 0.18], [half * 0.66, height * 0.18]]);
    } else if (id === "tech") {
      addPath([
        [-half * 0.7, height * 0.72],
        [-width * 0.18, height * 0.72],
        [-width * 0.18, height * 0.62],
        [width * 0.18, height * 0.62],
        [width * 0.18, height * 0.52],
        [half * 0.7, height * 0.52]
      ]);
      addPath([[-half * 0.7, height * 0.39], [-width * 0.12, height * 0.39], [-width * 0.12, height * 0.29], [half * 0.7, height * 0.29]]);
      addPath([[-width * 0.27, height * 0.81], [-width * 0.27, height * 0.75]]);
      addPath([[width * 0.27, height * 0.47], [width * 0.27, height * 0.41]]);
    } else if (id === "forex") {
      addPath([
        [-half * 0.68, height * 0.31],
        [-half * 0.68, height * 0.47],
        [-half * 0.4, height * 0.47],
        [-half * 0.4, height * 0.39]
      ]);
      addPath([[-half * 0.2, height * 0.37], [-half * 0.2, height * 0.58], [0, height * 0.58], [0, height * 0.45]]);
      addPath([[half * 0.22, height * 0.47], [half * 0.22, height * 0.68], [half * 0.43, height * 0.68], [half * 0.43, height * 0.55]]);
      addPath([[-half * 0.7, height * 0.22], [-width * 0.13, height * 0.22], [half * 0.12, height * 0.32], [half * 0.7, height * 0.32]]);
    } else {
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: warmColor,
        transparent: true,
        opacity: 0.2,
        side: THREE.DoubleSide,
        depthWrite: false,
        toneMapped: false
      });
      ringMaterial.userData.baseOpacity = ringMaterial.opacity;
      [0.27, 0.45, 0.63].forEach((radius) => {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.009, 5, 56), ringMaterial);
        ring.position.set(0, height * 0.58, 0.02);
        group.add(ring);
      });
      addPath([
        [-half * 0.68, height * 0.21],
        [-width * 0.2, height * 0.21],
        [0, height * 0.27],
        [width * 0.2, height * 0.21],
        [half * 0.68, height * 0.21]
      ]);
    }

    const lineMaterial = new THREE.LineBasicMaterial({
      color: identityColor,
      transparent: true,
      opacity: 0.52,
      depthWrite: false,
      toneMapped: false
    });
    lineMaterial.userData.baseOpacity = lineMaterial.opacity;
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute("position", new THREE.Float32BufferAttribute(segments, 3));
    group.add(new THREE.LineSegments(lineGeometry, lineMaterial));

    const nodeMaterial = new THREE.MeshBasicMaterial({
      color: warmColor,
      transparent: true,
      opacity: 0.58,
      toneMapped: false
    });
    nodeMaterial.userData.baseOpacity = nodeMaterial.opacity;
    [
      [-half * 0.7, height * 0.18],
      [half * 0.7, height * 0.18],
      [-half * 0.7, height * 0.28],
      [half * 0.7, height * 0.28]
    ].forEach(([x, y]) => {
      const node = new THREE.Mesh(new THREE.SphereGeometry(0.021, 8, 8), nodeMaterial);
      node.position.set(x, y, 0.012);
      group.add(node);
    });

    return [lineMaterial, nodeMaterial, ...group.children
      .filter((child) => child.material && child.material !== lineMaterial && child.material !== nodeMaterial)
      .map((child) => child.material)];
  }

  function addEnvironment(scene) {
    scene.add(new THREE.HemisphereLight(0xffe6c8, 0x17120d, 1.05));

    const keyLight = new THREE.DirectionalLight(0xffd5aa, 2.75);
    keyLight.position.set(-5, 8, 7);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xb8c1c8, 0.78);
    fillLight.position.set(6, 5, 4);
    scene.add(fillLight);

    const wall = new THREE.Mesh(
      new THREE.PlaneGeometry(60, 16),
      new THREE.MeshBasicMaterial({ color: 0x0b0907 })
    );
    wall.position.set(0, 5.2, -6.5);
    scene.add(wall);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(80, 80),
      new THREE.MeshStandardMaterial({
        color: 0x100e0b,
        metalness: 0.16,
        roughness: 0.88
      })
    );
    floor.rotation.x = -Math.PI * 0.5;
    floor.position.y = -0.18;
    scene.add(floor);

    const floorGrid = new THREE.GridHelper(80, 32, 0x493522, 0x282119);
    floorGrid.position.y = -0.17;
    const floorMaterials = Array.isArray(floorGrid.material) ? floorGrid.material : [floorGrid.material];
    floorMaterials.forEach((material) => {
      material.transparent = true;
      material.opacity = 0.24;
      material.depthWrite = false;
    });
    scene.add(floorGrid);

    const wallLines = new THREE.Group();
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x785637,
      transparent: true,
      opacity: 0.22,
      depthWrite: false
    });
    [-4.6, -4.25, 8.05].forEach((y) => {
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-18, y, -6.35),
        new THREE.Vector3(18, y, -6.35)
      ]);
      wallLines.add(new THREE.Line(geometry, lineMaterial));
    });
    scene.add(wallLines);

  }

  function layoutScene(state) {
    const width = window.innerWidth;
    const compact = width < 1250;
    const mobile = width <= 480;
    const tablet = width < 700;
    const scale = mobile ? 0.66 : tablet ? 0.73 : compact ? 0.82 : 1;
    const positions = compact
      ? mobile
        ? [[-0.91, 0.32], [0.91, 0.32], [-0.91, -3.08], [0.91, -3.08]]
        : tablet
          ? [[-1.03, 0.38], [1.03, 0.38], [-1.03, -3.12], [1.03, -3.12]]
          : [[-1.52, 0.42], [1.52, 0.42], [-1.52, -3.16], [1.52, -3.16]]
      : [[-4.62, -0.12], [-1.54, -0.12], [1.54, -0.12], [4.62, -0.12]];
    const targetY = compact ? 0.55 : 1.9;

    state.doors.forEach((door, index) => {
      const [x, y] = positions[index] || [0, -0.12];
      door.group.position.set(x, y, 0);
      door.baseScale = scale;
      door.group.scale.setScalar(scale);
    });

    state.camera.aspect = window.innerWidth / Math.max(window.innerHeight, 1);
    state.camera.fov = mobile ? 40 : compact ? 38 : 35;
    state.camera.position.set(0, targetY + (compact ? 2.15 : 2.45), compact ? 15.1 : 13.8);
    state.lookAt.set(0, targetY, 0);
    state.camera.lookAt(state.lookAt);
    state.camera.updateProjectionMatrix();
  }

  function updateDoorSequence(state, delta) {
    const sequence = state.sequence;
    if (!sequence) return;

    sequence.elapsed += delta;
    const door = state.doors[sequence.doorIndex];

    if (sequence.phase === "focus") {
      if (sequence.elapsed >= FOCUS_DURATION) {
        sequence.phase = "opening";
        sequence.elapsed = 0;
      }
      return;
    }

    if (sequence.phase === "opening") {
      const progress = Math.min(1, sequence.elapsed / DOOR_OPEN_DURATION);
      door.hinge.rotation.y = door.openAngle * easeInOut(progress);
      if (progress >= 1) {
        sequence.phase = "entry";
        sequence.elapsed = 0;
        sequence.startPosition.copy(state.camera.position);
        sequence.startLookAt.copy(state.lookAt);
        sequence.endPosition.set(
          door.group.position.x,
          door.group.position.y + door.height * door.baseScale * 0.52,
          -2.6
        );
        sequence.endLookAt.set(
          door.group.position.x,
          door.group.position.y + door.height * door.baseScale * 0.52,
          -11
        );
        root?.classList.add("is-entering");
      }
      return;
    }

    const progress = Math.min(1, sequence.elapsed / ENTRY_DURATION);
    const eased = easeInOut(progress);
    state.camera.position.lerpVectors(sequence.startPosition, sequence.endPosition, eased);
    state.lookAt.lerpVectors(sequence.startLookAt, sequence.endLookAt, eased);
    state.camera.lookAt(state.lookAt);
    root?.style.setProperty("--entry-darkness", String(eased * 0.76));

    if (progress >= 1 && !sequence.navigationStarted) {
      sequence.navigationStarted = true;
      state.context.navigate(`#world/${config.doors[sequence.doorIndex].id}`);
    }
  }

  function updateDoorEmphasis(state, delta) {
    const focusedDoor = state.selectedDoor ?? state.hoveredDoor;
    state.doors.forEach((door, index) => {
      const focused = focusedDoor === index;
      const dim = focusedDoor !== null && !focused ? 0.32 : 1;
      const target = focused ? 1 : 0;
      door.hover = THREE.MathUtils.damp(door.hover, target, 6.5, delta);
      door.group.scale.setScalar(door.baseScale * (1 + door.hover * 0.012));
      door.material.color.copy(door.basePanelColor).multiplyScalar(dim);
      door.insetMaterial.color.copy(door.baseInsetColor).multiplyScalar(dim);
      door.frameMaterial.color.copy(door.baseFrameColor).multiplyScalar(0.65 + dim * 0.35);
      door.material.emissiveIntensity = door.baseDoorEmissive + door.hover * 0.1;
      door.insetMaterial.emissiveIntensity = door.baseInsetEmissive + door.hover * 0.08;
      door.frameMaterial.emissiveIntensity = door.baseFrameEmissive + door.hover * 0.07;
      door.accentLight.intensity = (0.2 + door.hover * 0.72) * dim;
      door.outlineMaterial.opacity = (0.16 + door.hover * 0.3) * dim;
      door.detailMaterials.forEach((material) => {
        material.opacity = (material.userData.baseOpacity || 0.38) * (0.35 + door.hover * 0.65) * dim;
      });
    });
  }

  function easeInOut(value) {
    return value < 0.5
      ? 4 * value * value * value
      : 1 - Math.pow(-2 * value + 2, 3) / 2;
  }

  function attachCanvas(activeContext, renderer) {
    const canvas = activeContext.renderer.canvas;
    canvas.classList.remove("intro-points");
    canvas.classList.add("doors-scene-canvas");
    canvas.style.display = "";
    canvas.style.position = "fixed";
    canvas.style.inset = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.zIndex = "0";
    canvas.style.pointerEvents = "none";
    activeContext.renderer.container.append(canvas);
    renderer.setClearColor(0x080705, 0);
  }

  function setHoveredDoor(index) {
    if (sceneState?.sequence) return;
    if (sceneState?.active) sceneState.hoveredDoor = index;
    syncDoorEmphasis(index);
  }

  function syncDoorEmphasis(index) {
    const grid = root?.querySelector(".door-selector-grid");
    if (!grid) return;
    grid.classList.toggle("has-focused-door", index !== null);
    grid.querySelectorAll(".door-selector").forEach((button, buttonIndex) => {
      button.classList.toggle("is-focused", index === buttonIndex);
      button.classList.toggle("is-dimmed", index !== null && index !== buttonIndex);
    });
  }

  function activateDoor(index) {
    if (!root || sceneState?.sequence || navigationTimer !== null) return;
    const door = config.doors[index];
    if (!door) return;

    const activeContext = context;
    const status = root.querySelector("[data-door-status]");
    status.textContent = `Opening ${door.title}.`;
    root.querySelectorAll(".door-selector").forEach((button, buttonIndex) => {
      button.setAttribute("aria-disabled", "true");
      button.classList.toggle("is-opening", buttonIndex === index);
    });
    syncDoorEmphasis(index);

    if (activeContext.deviceProfile.reducedMotion) {
      activeContext.navigate(`#world/${door.id}`);
      return;
    }

    if (sceneState?.active) {
      sceneState.selectedDoor = index;
      sceneState.hoveredDoor = null;
      sceneState.sequence = {
        doorIndex: index,
        phase: "focus",
        elapsed: 0,
        navigationStarted: false,
        startPosition: sceneState.camera.position.clone(),
        startLookAt: sceneState.lookAt.clone(),
        endPosition: new THREE.Vector3(),
        endLookAt: new THREE.Vector3()
      };
      return;
    }

    root?.classList.add("is-entering");
    fallbackEnterTimer = window.setTimeout(() => {
      fallbackEnterTimer = null;
      root?.style.setProperty("--entry-darkness", "0.76");
    }, FOCUS_DURATION * 1000 + DOOR_OPEN_DURATION * 1000);
    navigationTimer = window.setTimeout(() => {
      navigationTimer = null;
      activeContext.navigate(`#world/${door.id}`);
    }, (FOCUS_DURATION + DOOR_OPEN_DURATION + ENTRY_DURATION) * 1000);
  }

  function disableScene(state, error) {
    if (!state.active) return;
    state.active = false;
    state.context.ticker.unregister(state.tickerCallback);
    disposeObject3D(state.scene);
    state.scene.clear();
    if (sceneState === state) sceneState = null;
    hideCanvas(state.context);
    showWebGLFallback(error);
  }

  function hideCanvas(activeContext) {
    const canvas = activeContext?.renderer?.canvas;
    if (!canvas) return;
    activeContext.renderer.container.append(canvas);
    canvas.classList.remove("doors-scene-canvas");
    canvas.style.display = "none";
    canvas.style.position = "";
    canvas.style.inset = "";
    canvas.style.width = "";
    canvas.style.height = "";
    canvas.style.zIndex = "";
    canvas.style.pointerEvents = "";
  }

  function showWebGLFallback(error) {
    root?.classList.add("is-webgl-fallback");
    const status = root?.querySelector("[data-door-status]");
    if (status) {
      status.textContent = "3D rendering is unavailable. The doors remain available as accessible controls.";
    }
    if (import.meta.env?.DEV) {
      console.warn("[doors] 3D rendering unavailable; using the accessible door fallback", error);
    }
  }

  function renderWorld(id) {
    const door = config.doors.find((item) => item.id === id) || config.doors[0];
    root.className = "world-state";
    root.style.setProperty("--door-accent", door.accent);
    root.innerHTML = `
      <header class="foundation-header">
        <a class="foundation-brand" href="#doors">${config.site.name}</a>
        <nav aria-label="Primary navigation">
          <a href="#doors">Back to doors</a>
          <a href="#page">Portfolio</a>
        </nav>
      </header>
      <section class="world-placeholder" aria-labelledby="world-heading">
        <a class="back-link" href="#doors">← All worlds</a>
        <p class="eyebrow">${door.number} / ${door.navLabel}</p>
        <h1 id="world-heading">${door.title}</h1>
        <p class="world-subtitle">${door.shortDescription || ""}</p>
        <p>${door.description}</p>
        ${door.focusAreas?.length ? `
          <h2>Areas I explore</h2>
          <ul class="world-focus">
            ${door.focusAreas.map((area) => `<li>${area}</li>`).join("")}
          </ul>
        ` : ""}
        ${door.skills.length ? `
          <h2>${door.skillTitle}</h2>
          <ul class="world-skills">
            ${door.skills.map((skill) => `<li><span>${skill.label}</span><small>${skill.level}</small></li>`).join("")}
          </ul>
        ` : `<p class="empty-state">No media or projects have been supplied for this world yet.</p>`}
        ${door.disclaimer ? `<p class="world-disclaimer">${door.disclaimer}</p>` : ""}
        ${door.scopeNote ? `<p class="world-disclaimer">${door.scopeNote}</p>` : ""}
      </section>
    `;
  }

  function renderPage() {
    root.className = "page-state hero-state";
    root.innerHTML = `
      <header class="foundation-header hero-header">
        <a class="foundation-brand" href="#doors">${config.site.name}</a>
        <nav aria-label="Primary navigation">
          <a href="#doors">Worlds</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>
      <div class="hero-mount" data-hero-mount></div>
    `;
    const mountPoint = root.querySelector("[data-hero-mount]");
    try {
      heroController = mountHero(mountPoint, config, {
        ticker: context.ticker,
        deviceProfile: context.deviceProfile,
        reducedMotion: context.deviceProfile?.reducedMotion,
        weak: context.deviceProfile?.weak,
        isMobile: window.innerWidth < 760 || context.deviceProfile?.weak
      });
    } catch (error) {
      if (import.meta.env?.DEV) console.error("[hero] failed to mount", error);
      mountPoint.innerHTML = `
        <section class="page-placeholder" aria-labelledby="portfolio-heading">
          <p class="eyebrow">${config.site.tagline}</p>
          <h1 id="portfolio-heading">${config.site.heroLine}</h1>
          <p>${config.site.supportingLine}</p>
          <a class="fallback-action" href="#doors">Explore worlds</a>
        </section>
      `;
    }
  }

  function listen(target, eventName, handler) {
    if (!target) return;
    target.addEventListener(eventName, handler);
    listeners.add(() => target.removeEventListener(eventName, handler));
  }

  function teardown() {
    if (scheduledFrame !== null) {
      window.cancelAnimationFrame(scheduledFrame);
      scheduledFrame = null;
    }
    if (navigationTimer !== null) {
      window.clearTimeout(navigationTimer);
      navigationTimer = null;
    }
    if (fallbackEnterTimer !== null) {
      window.clearTimeout(fallbackEnterTimer);
      fallbackEnterTimer = null;
    }
    if (heroController) {
      try { heroController.destroy(); } catch (_) {}
      heroController = null;
    }
    if (sceneState) {
      sceneState.active = false;
      sceneState.context.ticker.unregister(sceneState.tickerCallback);
      disposeObject3D(sceneState.scene);
      sceneState.scene.clear();
      sceneState = null;
    }
    removeListeners(listeners);
    hideCanvas(context);
    root?.remove();
    root = null;
  }

  function exit() {
    teardown();
  }

  return { enter, exit, destroy: exit };
}
