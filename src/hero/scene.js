import * as THREE from "three";

const shapeIndices = { chart: 0, shield: 1, network: 2 };

const vertexShader = `
  attribute vec3 aChart;
  attribute vec3 aShield;
  attribute vec3 aNetwork;
  attribute float aSeed;
  uniform float uFromShape;
  uniform float uToShape;
  uniform float uMorph;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uScroll;
  uniform vec2 uPointer;
  varying float vAlpha;
  varying float vSeed;

  vec3 shapePosition(float shape) {
    if (shape < 0.5) return aChart;
    if (shape < 1.5) return aShield;
    return aNetwork;
  }

  void main() {
    float morph = smoothstep(0.0, 1.0, uMorph);
    vec3 point = mix(shapePosition(uFromShape), shapePosition(uToShape), morph);
    float drift = 1.0 - morph * 0.65;
    point.z += sin(uTime * 0.45 + aSeed * 35.0) * 0.06 * drift;
    point.xy += uPointer * 0.12;
    point.z -= uScroll * 1.7;

    vec4 viewPosition = modelViewMatrix * vec4(point, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    float pulse = 0.82 + 0.18 * sin(uTime * 1.4 + aSeed * 58.0);
    gl_PointSize = clamp(uPixelRatio * pulse * (19.0 / max(4.0, -viewPosition.z)), 1.0, 8.0);
    vAlpha = 0.28 + 0.2 * pulse;
    vSeed = aSeed;
  }
`;

const fragmentShader = `
  uniform vec3 uAccent;
  uniform vec3 uGlow;
  varying float vAlpha;
  varying float vSeed;

  void main() {
    vec2 point = gl_PointCoord - 0.5;
    float radius = length(point);
    float core = 1.0 - smoothstep(0.08, 0.5, radius);
    float halo = 1.0 - smoothstep(0.05, 0.72, radius);
    vec3 color = mix(uAccent, uGlow, gl_PointCoord.y * 0.72);
    float sparkle = 0.86 + 0.14 * sin(vSeed * 92.0);
    gl_FragColor = vec4(color, (core * 0.72 + halo * 0.28) * vAlpha * sparkle);
  }
`;

function seededRandom(seed) {
  let state = (seed + 1) >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function sampleEdge(random, polygon) {
  const index = Math.floor(random() * polygon.length);
  const start = polygon[index];
  const end = polygon[(index + 1) % polygon.length];
  const progress = random();
  return [
    start[0] + (end[0] - start[0]) * progress,
    start[1] + (end[1] - start[1]) * progress,
  ];
}

function insidePolygon(x, y, polygon) {
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index, index += 1) {
    const [currentX, currentY] = polygon[index];
    const [previousX, previousY] = polygon[previous];
    const crosses = (currentY > y) !== (previousY > y)
      && x < ((previousX - currentX) * (y - currentY)) / (previousY - currentY) + currentX;
    if (crosses) inside = !inside;
  }
  return inside;
}

function samplePolyline(random, points) {
  const index = Math.floor(random() * (points.length - 1));
  const start = points[index];
  const end = points[index + 1];
  const progress = random();
  return [
    start[0] + (end[0] - start[0]) * progress,
    start[1] + (end[1] - start[1]) * progress,
  ];
}

function chartPoint(random) {
  const levels = [-0.72, -0.46, 0.08, -0.22, 0.54, 0.34, 0.92, 0.68, 1.18];
  const x = random() * 5.8 - 2.9;
  const position = ((x + 2.9) / 5.8) * (levels.length - 1);
  const index = Math.min(Math.floor(position), levels.length - 2);
  const fraction = position - index;
  const lineY = levels[index] + (levels[index + 1] - levels[index]) * fraction;

  if (random() < 0.16) {
    return [x, lineY + (random() - 0.5) * 0.86, (random() - 0.5) * 0.24];
  }
  return [x, lineY + (random() - 0.5) * 0.18, (random() - 0.5) * 0.3];
}

const shieldOutline = [
  [-1.25, 1.18], [1.25, 1.18], [1.12, 0.18], [0.72, -0.76],
  [0, -1.42], [-0.72, -0.76], [-1.12, 0.18],
];

function shieldPoint(random) {
  const choice = random();
  if (choice < 0.2) {
    const [x, y] = sampleEdge(random, shieldOutline);
    return [x, y, (random() - 0.5) * 0.18];
  }

  if (choice < 0.34) {
    if (random() < 0.48) {
      const angle = Math.PI * random();
      return [
        Math.cos(angle) * 0.34,
        0.2 + Math.sin(angle) * 0.34,
        (random() - 0.5) * 0.12,
      ];
    }
    return [
      (random() - 0.5) * 0.62,
      -0.38 + random() * 0.48,
      (random() - 0.5) * 0.12,
    ];
  }

  let x;
  let y;
  do {
    x = random() * 2.4 - 1.2;
    y = random() * 2.5 - 1.3;
  } while (!insidePolygon(x, y, shieldOutline));
  return [x, y, (random() - 0.5) * 0.34];
}

const networkNodes = [
  [-1.55, 1.05], [-0.75, 0.54], [0, 0.95], [0.76, 0.42], [1.55, 0.96],
  [-1.3, -0.05], [-0.5, -0.55], [0.42, -0.1], [1.24, -0.72], [0, -1.12],
];
const networkEdges = [
  [0, 1], [1, 2], [2, 3], [3, 4], [1, 5], [5, 6], [6, 7],
  [7, 3], [7, 8], [6, 9], [9, 8], [5, 7], [2, 7],
];
const leftBracket = [[-1.62, 1.12], [-1.88, 1.12], [-1.88, 0.32], [-2.14, 0], [-1.88, -0.32], [-1.88, -1.12], [-1.62, -1.12]];
const rightBracket = leftBracket.map(([x, y]) => [-x, y]);

function networkPoint(random) {
  if (random() < 0.2) {
    const bracket = random() < 0.5 ? leftBracket : rightBracket;
    const [x, y] = samplePolyline(random, bracket);
    return [x, y, (random() - 0.5) * 0.2];
  }

  if (random() < 0.24) {
    const [x, y] = networkNodes[Math.floor(random() * networkNodes.length)];
    return [x + (random() - 0.5) * 0.12, y + (random() - 0.5) * 0.12, (random() - 0.5) * 0.22];
  }

  const [startIndex, endIndex] = networkEdges[Math.floor(random() * networkEdges.length)];
  const start = networkNodes[startIndex];
  const end = networkNodes[endIndex];
  const progress = random();
  return [
    start[0] + (end[0] - start[0]) * progress + (random() - 0.5) * 0.1,
    start[1] + (end[1] - start[1]) * progress + (random() - 0.5) * 0.1,
    (random() - 0.5) * 0.35,
  ];
}

function createShapeAttributes(count) {
  const chart = new Float32Array(count * 3);
  const shield = new Float32Array(count * 3);
  const network = new Float32Array(count * 3);
  const seeds = new Float32Array(count);

  for (let index = 0; index < count; index += 1) {
    const random = seededRandom(index * 17 + 3);
    const offset = index * 3;
    chart.set(chartPoint(random), offset);
    shield.set(shieldPoint(random), offset);
    network.set(networkPoint(random), offset);
    seeds[index] = random();
  }

  return { chart, network, seeds, shield };
}

export function createHeroScene(canvas, hero, settings, reducedMotion = false) {
  if (!canvas || !hero || !settings?.colors || !settings?.particleCount) {
    throw new Error("The hero particle scene requires a canvas, hero element, and scene settings.");
  }

  const mobile = window.matchMedia("(max-width: 700px)").matches;
  const count = mobile ? settings.particleCount.mobile : settings.particleCount.desktop;
  const { chart, network, seeds, shield } = createShapeAttributes(count);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(network, 3));
  geometry.setAttribute("aChart", new THREE.BufferAttribute(chart, 3));
  geometry.setAttribute("aShield", new THREE.BufferAttribute(shield, 3));
  geometry.setAttribute("aNetwork", new THREE.BufferAttribute(network, 3));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));

  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: false,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(pixelRatio);
  renderer.setClearColor(settings.colors.background, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 80);
  const baseCameraDistance = settings.cameraDistance;
  const group = new THREE.Group();
  scene.add(group);

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uAccent: { value: new THREE.Color(settings.shapeColors.network) },
      uFromShape: { value: shapeIndices.network },
      uGlow: { value: new THREE.Color(settings.colors.cyan) },
      uMorph: { value: 1 },
      uPixelRatio: { value: pixelRatio },
      uPointer: { value: new THREE.Vector2() },
      uScroll: { value: 0 },
      uTime: { value: 0 },
      uToShape: { value: shapeIndices.network },
    },
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  group.add(points);

  let frameId = null;
  let lastFrame = 0;
  let elapsed = 0;
  const visible = true;
  let sceneActive = true;
  let disposed = false;
  let pointerX = 0;
  let pointerY = 0;
  let targetPointerX = 0;
  let targetPointerY = 0;
  let scrollProgress = 0;
  let targetScrollProgress = 0;
  let currentShape = "network";
  let morphTarget = "network";

  const resize = () => {
    const bounds = hero.getBoundingClientRect();
    const width = Math.max(1, bounds.width);
    const height = Math.max(1, bounds.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.position.z = baseCameraDistance * Math.max(1, 0.8 / camera.aspect);
    camera.updateProjectionMatrix();
    material.uniforms.uPixelRatio.value = renderer.getPixelRatio();
    if (reducedMotion && sceneActive && !document.hidden) renderer.render(scene, camera);
  };

  const render = (time) => {
    frameId = null;
    if (disposed || document.hidden || !visible || !sceneActive) return;
    const delta = Math.min(Math.max((time - lastFrame) / 1000, 0), 0.05);
    lastFrame = time;
    elapsed += delta * settings.speed.drift;
    pointerX += (targetPointerX - pointerX) * 0.045;
    pointerY += (targetPointerY - pointerY) * 0.045;
    scrollProgress += (targetScrollProgress - scrollProgress) * 0.08;

    material.uniforms.uTime.value = elapsed;
    material.uniforms.uPointer.value.set(pointerX, -pointerY);
    material.uniforms.uScroll.value = scrollProgress;
    group.rotation.y = Math.sin(elapsed * 0.23) * 0.055 + pointerX * 0.035;
    group.rotation.x = Math.sin(elapsed * 0.19) * 0.035 - pointerY * 0.025;
    camera.position.x = pointerX * settings.speed.parallax;
    camera.position.y = -pointerY * settings.speed.parallax * 0.6;
    camera.position.z = baseCameraDistance * Math.max(1, 0.8 / camera.aspect)
      - scrollProgress * settings.scrollDepth;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
    frameId = window.requestAnimationFrame(render);
  };

  const syncLoop = () => {
    if (disposed) return;
    if (document.hidden || !visible || !sceneActive) {
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      frameId = null;
      lastFrame = 0;
      renderer.domElement.style.display = "none";
      renderer.domElement.style.visibility = "hidden";
      return;
    }
    renderer.domElement.style.display = "block";
    renderer.domElement.style.visibility = "visible";
    if (reducedMotion) {
      renderer.render(scene, camera);
      return;
    }
    if (frameId === null) frameId = window.requestAnimationFrame(render);
  };

  const onPointerMove = (event) => {
    targetPointerX = (event.clientX / window.innerWidth - 0.5) * 2;
    targetPointerY = (event.clientY / window.innerHeight - 0.5) * 2;
  };
  const onVisibilityChange = () => syncLoop();

  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", resize);
  document.addEventListener("visibilitychange", onVisibilityChange);
  if (!reducedMotion) window.addEventListener("pointermove", onPointerMove, { passive: true });
  resize();
  syncLoop();

  return {
    setActive(active) {
      if (disposed || sceneActive === active) return;
      sceneActive = active;
      syncLoop();
    },
    getStats() {
      const active = sceneActive && visible && !document.hidden && !disposed;
      return {
        renderLoops: active && frameId !== null ? 1 : 0,
        canvases: active && renderer.domElement.isConnected ? 1 : 0,
      };
    },
    beginMorph(shapeName) {
      if (!(shapeName in shapeIndices)) return;
      morphTarget = shapeName;
      material.uniforms.uFromShape.value = shapeIndices[currentShape];
      material.uniforms.uToShape.value = shapeIndices[morphTarget];
      material.uniforms.uMorph.value = 0;
      material.uniforms.uAccent.value.set(settings.shapeColors[shapeName]);
      if (reducedMotion) renderer.render(scene, camera);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("orientationchange", resize);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      group.remove(points);
      geometry.dispose();
      material.dispose();
      scene.clear();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.width = 0;
      renderer.domElement.height = 0;
      renderer.domElement.remove();
    },
    finishMorph() {
      currentShape = morphTarget;
      material.uniforms.uFromShape.value = shapeIndices[currentShape];
      material.uniforms.uToShape.value = shapeIndices[currentShape];
      material.uniforms.uMorph.value = 1;
    },
    setMorphProgress(progress) {
      material.uniforms.uMorph.value = THREE.MathUtils.clamp(progress, 0, 1);
    },
    setScrollProgress(progress) {
      targetScrollProgress = THREE.MathUtils.clamp(progress, 0, 1);
    },
    setShape(shapeName) {
      if (!(shapeName in shapeIndices)) return;
      currentShape = shapeName;
      morphTarget = shapeName;
      material.uniforms.uFromShape.value = shapeIndices[shapeName];
      material.uniforms.uToShape.value = shapeIndices[shapeName];
      material.uniforms.uMorph.value = 1;
      material.uniforms.uAccent.value.set(settings.shapeColors[shapeName]);
      if (reducedMotion) renderer.render(scene, camera);
    },
  };
}
