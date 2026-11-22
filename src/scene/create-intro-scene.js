import * as THREE from "three";
import { FontLoader } from "three/addons/loaders/FontLoader.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { createWorldScenes } from "./world-scenes.js";

const GOLD = 0xf3e5ab;
const BG = 0x050814;
const MIN_DOOR_PIXEL_RATIO = 0.75;
const DOOR_PIXEL_RATIO_STEP = 0.15;

const introScenes = new WeakMap();

export function createIntroScene(canvas, config) {
  if (!canvas) throw new Error("The intro scene requires its canvas.");
  const existingScene = introScenes.get(canvas);
  if (existingScene) return existingScene;

  let creation;
  creation = buildIntroScene(canvas, config).then((scene) => {
    const dispose = scene.dispose.bind(scene);
    scene.dispose = () => {
      dispose();
      if (introScenes.get(canvas) === creation) introScenes.delete(canvas);
    };
    scene.destroy = scene.dispose;
    return scene;
  }).catch((error) => {
    if (introScenes.get(canvas) === creation) introScenes.delete(canvas);
    throw error;
  });
  introScenes.set(canvas, creation);
  return creation;
}

async function buildIntroScene(canvas, config) {
  const font = await new FontLoader().loadAsync(config.fontUrl);
  const scene = new THREE.Scene();
  scene.background = null;
  scene.fog = new THREE.FogExp2(BG, 0.012);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  let rendererPixelRatio = Math.min(window.devicePixelRatio || 1, 1.25);
  renderer.setClearColor(BG, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.setPixelRatio(rendererPixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const environment = new RoomEnvironment(renderer);
  const environmentMap = pmremGenerator.fromScene(environment).texture;
  scene.environment = environmentMap;
  environment.dispose();
  pmremGenerator.dispose();

  const mobileQuery = window.matchMedia("(max-width: 767px)");
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const camera = new THREE.PerspectiveCamera(
    mobileQuery.matches ? 50 : 38,
    window.innerWidth / window.innerHeight,
    0.1,
    140,
  );
  camera.position.set(0, 0, 12.5);

  scene.add(new THREE.AmbientLight(0xcbd6ff, 1.05));
  const keyLight = new THREE.DirectionalLight(0xfff1c6, 3.4);
  keyLight.position.set(-4, 5, 8);
  scene.add(keyLight);

  const fillLight = new THREE.PointLight(0x3b82f6, 18, 30, 2);
  fillLight.position.set(5, -2, 4);
  scene.add(fillLight);

  const rimLight = new THREE.PointLight(0xf3e5ab, 25, 28, 2);
  rimLight.position.set(-4, 2, -2);
  scene.add(rimLight);

  const titleGroup = new THREE.Group();
  scene.add(titleGroup);

  const titleMaterial = new THREE.MeshStandardMaterial({
    color: GOLD,
    metalness: 0.88,
    roughness: 0.22,
    envMap: environmentMap,
    envMapIntensity: 1.6,
    emissive: 0x382c12,
    emissiveIntensity: 0.18,
  });
  const titleMeshes = [];
  const titleText = "DEVELOPER";
  const letterGeometries = [...titleText].map((letter) => {
    const geometry = new TextGeometry(letter, {
      font,
      size: 1.08,
      height: 0.24,
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: 0.045,
      bevelSize: 0.035,
      bevelSegments: 4,
    });
    geometry.computeBoundingBox();
    return geometry;
  });
  const titleWidth =
    letterGeometries.reduce(
      (width, geometry) => width + geometry.boundingBox.max.x - geometry.boundingBox.min.x,
      0,
    ) +
    (letterGeometries.length - 1) * 0.055;
  let letterX = -titleWidth / 2;
  letterGeometries.forEach((geometry) => {
    const bounds = geometry.boundingBox;
    const letterWidth = bounds.max.x - bounds.min.x;
    geometry.translate(
      -bounds.min.x,
      -(bounds.max.y + bounds.min.y) / 2,
      -(bounds.max.z + bounds.min.z) / 2,
    );
    const material = titleMeshes.length === 0 ? titleMaterial : titleMaterial.clone();
    const letter = new THREE.Mesh(geometry, material);
    letter.position.x = letterX;
    letterX += letterWidth + 0.055;
    letter.castShadow = false;
    letter.receiveShadow = false;
    titleGroup.add(letter);
    titleMeshes.push(letter);
  });

  let revealTimelineActive = false;
  let revealHasCompleted = false;

  const worldScenes = createWorldScenes({ scene, camera, canvas, font, config });

  const targetRotation = new THREE.Vector2();
  const clock = new THREE.Clock();
  let animationFrame = null;
  let disposed = false;
  let sceneActive = true;
  let renderMode = "INTRO";
  let gyroscopeEnabled = false;
  let motionReduced = motionQuery.matches;
  let worldBackdropActivated = false;
  let doorFpsWindowStart = null;
  let doorFpsFrames = 0;
  let orbitControls;
  let doorResizeObserver;

  const onPointerMove = (event) => {
    if (mobileQuery.matches || revealTimelineActive || revealHasCompleted) return;
    const pointerX = (event.clientX / window.innerWidth - 0.5) * 2;
    const pointerY = (event.clientY / window.innerHeight - 0.5) * 2;
    targetRotation.set(pointerY * -0.12, pointerX * 0.18);
  };

  const onDeviceOrientation = (event) => {
    if (event.beta == null || event.gamma == null) return;
    targetRotation.set(
      THREE.MathUtils.clamp(event.beta / 90, -1, 1) * -0.14,
      THREE.MathUtils.clamp(event.gamma / 45, -1, 1) * 0.2,
    );
  };

  const onResize = () => {
    if (disposed) return;
    const doorArea = renderMode === "DOORS"
      ? document.querySelector("#door-fallback")?.getBoundingClientRect()
      : null;
    const useDoorArea = doorArea && doorArea.width > 0 && doorArea.height > 0;
    const renderWidth = useDoorArea ? doorArea.width : window.innerWidth;
    const renderHeight = useDoorArea ? doorArea.height : window.innerHeight;
    camera.aspect = renderWidth / renderHeight;
    camera.fov = renderMode === "DOORS" ? 32 : mobileQuery.matches ? 50 : 38;
    camera.updateProjectionMatrix();
    const visibleWidth =
      Math.max(Math.abs(camera.position.z), 0.1) *
      2 *
      Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) *
      camera.aspect;
    const titleWidthRatio = mobileQuery.matches ? 0.78 : 0.88;
    const titleScale = Math.min(1, (visibleWidth * titleWidthRatio) / titleWidth);
    titleGroup.scale.setScalar(titleScale);
    renderer.setPixelRatio(rendererPixelRatio);
    renderer.setSize(renderWidth, renderHeight);
    if (useDoorArea) {
      renderer.domElement.style.position = "absolute";
      renderer.domElement.style.inset = "auto";
      renderer.domElement.style.left = "0";
      renderer.domElement.style.top = "0";
      renderer.domElement.style.width = `${doorArea.width}px`;
      renderer.domElement.style.height = `${doorArea.height}px`;
    } else {
      renderer.domElement.style.position = "fixed";
      renderer.domElement.style.inset = "0";
      renderer.domElement.style.left = "";
      renderer.domElement.style.top = "";
      renderer.domElement.style.width = `${window.innerWidth}px`;
      renderer.domElement.style.height = `${window.innerHeight}px`;
    }
    if (renderMode === "DOORS") worldScenes.resize();
  };

  const stopRenderLoop = () => {
    if (animationFrame === null) return;
    window.cancelAnimationFrame(animationFrame);
    animationFrame = null;
  };
  const syncRenderLoop = () => {
    const shouldRender = sceneActive && !document.hidden && !disposed;
    const shouldDisplayCanvas = shouldRender && renderMode !== "WALL";
    const worldStage = document.querySelector("#stage-two");
    renderer.domElement.style.zIndex = renderMode === "DOORS" ? "0" : "2";
    if (worldStage) {
      worldStage.style.zIndex = renderMode === "DOORS" ? "3" : "";
      worldStage.style.backgroundColor = renderMode === "DOORS" ? "transparent" : "";
    }
    renderer.domElement.style.display = shouldDisplayCanvas ? "block" : "none";
    renderer.domElement.style.visibility = shouldDisplayCanvas ? "visible" : "hidden";
    renderer.domElement.style.pointerEvents = "none";
    if (!shouldRender) {
      stopRenderLoop();
    } else if (animationFrame === null) {
      animationFrame = window.requestAnimationFrame(render);
    }
  };
  const onVisibilityChange = () => syncRenderLoop();
  onResize();
  const doorContainer = document.querySelector("#door-fallback");
  if ("ResizeObserver" in window && doorContainer) {
    doorResizeObserver = new ResizeObserver(() => {
      if (renderMode === "DOORS") onResize();
    });
    doorResizeObserver.observe(doorContainer);
  }

  const render = (time) => {
    animationFrame = null;
    if (!sceneActive || document.hidden || disposed) return;
    animationFrame = window.requestAnimationFrame(render);
    const elapsed = clock.getElapsedTime();
    if (renderMode === "DOORS") {
      if (doorFpsWindowStart === null) doorFpsWindowStart = time;
      doorFpsFrames += 1;
      const sampleDuration = time - doorFpsWindowStart;
      if (sampleDuration >= 2000) {
        const averageFps = doorFpsFrames * 1000 / sampleDuration;
        if (averageFps < 30 && rendererPixelRatio > MIN_DOOR_PIXEL_RATIO) {
          rendererPixelRatio = Math.max(
            MIN_DOOR_PIXEL_RATIO,
            Math.round((rendererPixelRatio - DOOR_PIXEL_RATIO_STEP) * 100) / 100,
          );
          renderer.setPixelRatio(rendererPixelRatio);
          const doorArea = document.querySelector("#door-fallback")?.getBoundingClientRect();
          if (doorArea?.width && doorArea.height) renderer.setSize(doorArea.width, doorArea.height);
        }
        doorFpsWindowStart = time;
        doorFpsFrames = 0;
      }
    } else {
      doorFpsWindowStart = null;
      doorFpsFrames = 0;
    }
    if (renderMode === "INTRO" && !motionReduced) {
      titleGroup.rotation.x += (targetRotation.x - titleGroup.rotation.x) * 0.055;
      titleGroup.rotation.y += (targetRotation.y - titleGroup.rotation.y) * 0.055;
      titleGroup.position.y = Math.sin(elapsed * 0.55) * 0.06;
    } else if (motionReduced) {
      titleGroup.rotation.set(0, 0, 0);
      titleGroup.position.y = 0;
    }

    if (renderMode === "DOORS") worldScenes.update(motionReduced);
    if (renderMode === "WALL") {
      renderer.clear(true, true, true);
      return;
    }
    if (renderMode === "INTRO") orbitControls?.enabled && orbitControls.update();
    renderer.render(scene, camera);
  };

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("orientationchange", onResize, { passive: true });
  document.addEventListener("visibilitychange", onVisibilityChange);
  renderer.domElement.style.pointerEvents = "none";
  syncRenderLoop();

  return {
    isMobile: () => mobileQuery.matches,
    isMotionReduced: () => motionQuery.matches,
    worldScenes,
    setActive(active) {
      if (disposed || sceneActive === active) return;
      sceneActive = active;
      syncRenderLoop();
    },
    setRenderMode(mode) {
      if (!["INTRO", "DOORS", "WALL"].includes(mode)) {
        throw new Error(`Unknown intro scene render mode: ${mode}`);
      }
      if (mode !== renderMode) {
        doorFpsWindowStart = null;
        doorFpsFrames = 0;
      }
      renderMode = mode;
      const doorArea = document.querySelector("#door-fallback");
      if (mode === "DOORS" && doorArea && renderer.domElement.parentElement !== doorArea) {
        doorArea.prepend(renderer.domElement);
      } else if (mode !== "DOORS" && renderer.domElement.parentElement !== document.querySelector("#app")) {
        document.querySelector("#app").insertBefore(renderer.domElement, document.querySelector("#reveal-flash"));
      }
      onResize();
      syncRenderLoop();
    },
    getStats() {
      const active = sceneActive && !document.hidden && !disposed;
      return {
        renderLoops: active && animationFrame !== null ? 1 : 0,
        canvases: active && renderer.domElement.isConnected ? 1 : 0,
      };
    },
    setWorldProgress(progress) {
      if (!worldBackdropActivated) {
        scene.background = new THREE.Color(BG);
        renderer.setClearColor(BG, 1);
        worldBackdropActivated = true;
      }
      worldScenes.setWorldProgress(progress);
    },
    setFreeLook(enabled) {
      if (!orbitControls) {
        orbitControls = new OrbitControls(camera, renderer.domElement);
        orbitControls.enableDamping = true;
        orbitControls.dampingFactor = 0.06;
        orbitControls.enablePan = false;
        orbitControls.minDistance = 2;
        orbitControls.maxDistance = 18;
      }
      orbitControls.target.copy(camera.position).add(new THREE.Vector3(0, 0, -6));
      orbitControls.enabled = enabled;
      orbitControls.update();
    },
    setMotionReduced(value) {
      motionReduced = value;
      worldScenes.setMotionReduced(value);
      if (value) {
        targetRotation.set(0, 0);
        titleGroup.rotation.set(0, 0, 0);
        titleGroup.position.y = 0;
      }
    },
    getRevealTargets: () => ({
      camera,
      titleGroup,
      titleMaterials: titleMeshes.map((letter) => letter.material),
    }),
    markRevealStarted() {
      revealTimelineActive = true;
    },
    markRevealComplete() {
      revealTimelineActive = false;
      revealHasCompleted = true;
      removeIntroTitle();
      camera.fov = mobileQuery.matches ? 50 : 38;
      camera.updateProjectionMatrix();
    },
    enableGyroscope() {
      if (gyroscopeEnabled || !("DeviceOrientationEvent" in window)) return;
      window.addEventListener("deviceorientation", onDeviceOrientation, { passive: true });
      gyroscopeEnabled = true;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      stopRenderLoop();
      renderer.domElement.style.display = "none";
      renderer.domElement.style.visibility = "hidden";
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("deviceorientation", onDeviceOrientation);
      doorResizeObserver?.disconnect();
      orbitControls?.dispose();
      worldScenes.dispose();
      removeIntroTitle();
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach((material) => material.dispose());
        } else {
          object.material?.dispose();
        }
      });
      environmentMap.dispose();
      renderer.dispose();
    },
    destroy() {
      this.dispose();
    },
  };

  function removeIntroTitle() {
    titleGroup.visible = false;
    titleGroup.removeFromParent();
    titleMeshes.forEach((letter) => {
      letter.geometry.dispose();
      letter.material.dispose();
    });
    titleMeshes.length = 0;
  }
}
