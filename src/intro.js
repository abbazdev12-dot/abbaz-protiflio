import "./intro.css";
import * as THREE from "three";

const introInstances = new WeakMap();

function makeBootLines(config) {
  const skillCount = config.skills?.length ?? 0;
  return [
    "Booting system kernel...",
    "CPU profile: x86_64 · 8 cores · 0x7F2A",
    "Mounting /dev/portfolio at 0x0000A13F",
    "Memory map: 0x7FA0_0000 · 64.0 MB allocated",
    "Loading package: three@0.160.0",
    "Loading three.js scene graph ✔",
    "Linking gsap timelines ✔",
    "Compiling shaders · vertex 0xA13F · fragment 0xB802",
    "WebGL2 context established · framebuffer 1920x1080",
    "Starting network daemon · port 5173 · TCP ✔",
    "net.iface up · 0xA13F · ping 12ms",
    "Checking ethical_hacking.permission = granted ✔",
    "forex.risk = managed ✔",
    "futures.margin = verified ✔",
    "Loading full_stack modules ✔",
    `Syncing config.js · ${config.name} · ${skillCount} skills`,
    "TLS handshake complete · cipher AES-256-GCM",
    "Shader bundle: 81.7 kB · checksum 0xA1C9",
    "GPU buffer pool ready · 0x00F4_2B10",
    "Routing port 5173 · HTTP/2 ready ✔",
    "Indexing interaction map · 24 nodes",
    "Verifying profile image · 1920x1080 ✔",
    "⚠ sleep: not found",
    "⚠ coffee: low",
    `✔ developer detected · ${config.name}`,
  ];
}

const pointVertexShader = `
  attribute vec3 aTarget;
  attribute vec3 aColor;
  attribute float aSeed;
  uniform float uMorph;
  uniform float uTime;
  uniform float uPixelRatio;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float morph = smoothstep(0.0, 1.0, uMorph);
    vec3 point = mix(position, aTarget, morph);
    float swirl = (1.0 - morph);
    float angle = uTime * 0.18 + aSeed * 6.28318;
    point.xy += vec2(cos(angle), sin(angle)) * swirl * 0.12;
    point.z += sin(uTime * 1.4 + aSeed * 28.0) * swirl * 0.12;
    vec4 viewPosition = modelViewMatrix * vec4(point, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = uPixelRatio * mix(2.4, 1.8, morph) * (7.5 / max(4.0, -viewPosition.z));
    vColor = aColor;
    vAlpha = 0.22 + morph * 0.78;
  }
`;

const pointFragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec2 point = gl_PointCoord - 0.5;
    float radius = length(point);
    float alpha = 1.0 - smoothstep(0.28, 0.5, radius);
    if (alpha < 0.04) discard;
    vec3 accent = mix(vec3(0.42, 0.39, 1.0), vec3(1.0, 0.36, 0.48), gl_PointCoord.y);
    gl_FragColor = vec4(mix(vColor, accent, 0.14), alpha * vAlpha);
  }
`;

function node(tag, className, text) {
  const element = document.createElement(tag);
  element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function createCodeRain(canvas, isMobile) {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not initialize the intro particle canvas.");
  const characters = "01{}[]<>/\\;:=+-";
  const particles = [];
  const maxParticles = isMobile ? 80 : 160;
  let animationFrame;
  let width = 0;
  let height = 0;
  let lastFrame = 0;
  let active = true;

  const resize = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    particles.length = 0;
    for (let index = 0; index < maxParticles; index += 1) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        velocity: 0.15 + Math.random() * 0.5,
        character: characters[Math.floor(Math.random() * characters.length)],
        color: Math.random() > 0.78 ? "255, 92, 122" : "108, 99, 255",
        alpha: 0.025 + Math.random() * 0.065,
      });
    }
  };
  const draw = (time) => {
    animationFrame = null;
    if (!active || document.hidden) return;
    if (time - lastFrame < 50) {
      animationFrame = requestAnimationFrame(draw);
      return;
    }
    lastFrame = time;
    context.clearRect(0, 0, width, height);
    context.font = '10px "JetBrains Mono", ui-monospace, monospace';
    particles.forEach((particle) => {
      particle.y += particle.velocity;
      if (particle.y > height + 12) {
        particle.y = -12;
        particle.x = Math.random() * width;
        particle.character = characters[Math.floor(Math.random() * characters.length)];
      }
      context.fillStyle = `rgba(${particle.color}, ${particle.alpha})`;
      context.fillText(particle.character, particle.x, particle.y);
    });
    animationFrame = requestAnimationFrame(draw);
  };
  const onVisibilityChange = () => {
    if (document.hidden || !active) {
      if (animationFrame !== null) cancelAnimationFrame(animationFrame);
      animationFrame = null;
    } else if (animationFrame === null) {
      animationFrame = requestAnimationFrame(draw);
    }
  };
  resize();
  animationFrame = requestAnimationFrame(draw);
  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", resize);
  document.addEventListener("visibilitychange", onVisibilityChange);
  return () => {
    active = false;
    cancelAnimationFrame(animationFrame);
    window.removeEventListener("resize", resize);
    window.removeEventListener("orientationchange", resize);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    context.clearRect(0, 0, width, height);
  };
}

function createAudioControls(muteButton) {
  let context;
  let master;
  let hum;
  let humGain;
  let enabled = false;
  let unlocked = false;
  const pendingClicks = new Set();

  const startAudio = () => {
    const AudioContext = window.AudioContext;
    if (!AudioContext) {
      muteButton.textContent = "AUDIO N/A";
      muteButton.disabled = true;
      return;
    }
    if (!context) {
      context = new AudioContext();
      master = context.createGain();
      master.gain.value = enabled ? 0.32 : 0;
      master.connect(context.destination);
      hum = context.createOscillator();
      hum.type = "sine";
      hum.frequency.value = 46;
      humGain = context.createGain();
      humGain.gain.value = 0.06;
      hum.connect(humGain);
      humGain.connect(master);
      hum.start();
    }
    if (context.state === "suspended") void context.resume();
    unlocked = true;
    muteButton.textContent = enabled ? "SOUND · MUTE" : "SOUND · ON";
  };

  const unlockFromGesture = () => {
    if (unlocked) return;
    startAudio();
  };
  const toggle = () => {
    enabled = !enabled;
    if (enabled && !unlocked) {
      startAudio();
      return;
    }
    if (master && context) {
      master.gain.cancelScheduledValues(context.currentTime);
      master.gain.setTargetAtTime(enabled ? 0.32 : 0, context.currentTime, 0.04);
    }
    muteButton.textContent = enabled ? "SOUND · MUTE" : "SOUND · ON";
  };
  const tone = (frequency, duration = 0.045, type = "square", volume = 0.06) => {
    if (!enabled || !unlocked || !context || !master) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    gain.gain.setValueAtTime(volume, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(master);
    oscillator.start();
    oscillator.stop(context.currentTime + duration);
    oscillator.addEventListener("ended", () => {
      oscillator.disconnect();
      gain.disconnect();
    }, { once: true });
  };
  const playKeyBurst = (count = 3) => {
    for (let index = 0; index < count; index += 1) {
      const timer = window.setTimeout(() => {
        pendingClicks.delete(timer);
        tone(480 + Math.random() * 420, 0.022, "square", 0.025);
      }, index * (18 + Math.random() * 23));
      pendingClicks.add(timer);
    }
  };
  const dispose = () => {
    pendingClicks.forEach((timer) => window.clearTimeout(timer));
    pendingClicks.clear();
    window.removeEventListener("pointerdown", unlockFromGesture, true);
    window.removeEventListener("keydown", unlockFromGesture, true);
    muteButton.removeEventListener("click", toggle);
    if (hum) {
      hum.stop();
      hum.disconnect();
      humGain?.disconnect();
    }
    if (context && context.state !== "closed") void context.close();
  };

  muteButton.textContent = "SOUND · ON";
  window.addEventListener("pointerdown", unlockFromGesture, true);
  window.addEventListener("keydown", unlockFromGesture, true);
  muteButton.addEventListener("click", toggle);
  return {
    click: () => tone(150, 0.12, "sine", 0.08),
    dispose,
    playKeyBurst,
    whoosh: () => tone(115, 0.34, "sawtooth", 0.04),
  };
}

function createPointCloud(canvas, frame, image, isMobile) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: false,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x070914, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.1, 80);
  camera.position.z = 8;
  const group = new THREE.Group();
  scene.add(group);

  const samplingCanvas = document.createElement("canvas");
  const samplingContext = samplingCanvas.getContext("2d", { willReadFrequently: true });
  if (!samplingContext) throw new Error("Could not sample the configured profile image.");
  const aspect = 4 / 5;
  const pointBudget = isMobile ? 6000 : 12000;
  const columns = Math.floor(Math.sqrt(pointBudget * aspect));
  const rows = Math.floor(columns / aspect);
  samplingCanvas.width = columns;
  samplingCanvas.height = rows;
  const imageAspect = image.naturalWidth / image.naturalHeight;
  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = image.naturalWidth;
  let sourceHeight = image.naturalHeight;
  if (imageAspect > aspect) {
    sourceWidth = image.naturalHeight * aspect;
    sourceX = (image.naturalWidth - sourceWidth) / 2;
  } else {
    sourceHeight = image.naturalWidth / aspect;
    sourceY = (image.naturalHeight - sourceHeight) * 0.36;
  }
  samplingContext.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    columns,
    rows,
  );
  const pixels = samplingContext.getImageData(0, 0, columns, rows).data;
  const count = columns * rows;
  const positions = new Float32Array(count * 3);
  const targets = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const frameBounds = frame.getBoundingClientRect();
  const worldPerPixel = (
    2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
  ) / window.innerHeight;
  const worldWidth = frameBounds.width * worldPerPixel;
  const worldHeight = frameBounds.height * worldPerPixel;
  for (let index = 0; index < count; index += 1) {
    const offset = index * 3;
    const colorOffset = index * 4;
    const brightness = (
      pixels[colorOffset] * 0.299
      + pixels[colorOffset + 1] * 0.587
      + pixels[colorOffset + 2] * 0.114
    ) / 255;
    const column = index % columns;
    const row = Math.floor(index / columns);
    const targetX = (column / Math.max(columns - 1, 1) - 0.5) * worldWidth;
    const targetY = (0.5 - row / Math.max(rows - 1, 1)) * worldHeight;
    const seed = Math.random();
    const radius = 0.55 + Math.random() * 1.9;
    const angle = Math.random() * Math.PI * 2;
    targets[offset] = targetX;
    targets[offset + 1] = targetY;
    targets[offset + 2] = 0;
    positions[offset] = targetX * 0.15 + Math.cos(angle) * radius;
    positions[offset + 1] = targetY * 0.15 + Math.sin(angle) * radius;
    positions[offset + 2] = (Math.random() - 0.5) * 4.2;
    colors[offset] = pixels[colorOffset] / 255;
    colors[offset + 1] = pixels[colorOffset + 1] / 255;
    colors[offset + 2] = pixels[colorOffset + 2] / 255;
    seeds[index] = seed;
    if (brightness < 0.015) colors[offset] *= 0.12;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aTarget", new THREE.BufferAttribute(targets, 3));
  geometry.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  const material = new THREE.ShaderMaterial({
    vertexShader: pointVertexShader,
    fragmentShader: pointFragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uMorph: { value: 0 },
      uTime: { value: 0 },
      uPixelRatio: { value: renderer.getPixelRatio() },
    },
  });
  const points = new THREE.Points(geometry, material);
  group.add(points);
  renderer.compile(scene, camera);

  let frameId;
  let elapsed = 0;
  let lastTime = 0;
  let parallaxX = 0;
  let parallaxY = 0;
  let targetX = 0;
  let targetY = 0;
  const setPointer = (x, y) => {
    targetX = x;
    targetY = y;
  };
  const onPointerMove = (event) => {
    setPointer((event.clientX / window.innerWidth - 0.5) * 2, (event.clientY / window.innerHeight - 0.5) * 2);
  };
  const onOrientation = (event) => {
    if (typeof event.gamma === "number" && typeof event.beta === "number") {
      setPointer(THREE.MathUtils.clamp(event.gamma / 40, -1, 1), THREE.MathUtils.clamp((event.beta - 35) / 45, -1, 1));
    }
  };
  let active = true;
  const syncLoop = () => {
    if (!active || document.hidden) {
      if (frameId !== null) cancelAnimationFrame(frameId);
      frameId = null;
    } else if (frameId === null) {
      frameId = requestAnimationFrame(render);
    }
  };
  const onVisibilityChange = () => syncLoop();
  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(ratio);
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    const bounds = frame.getBoundingClientRect();
    const scale = (
      2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
    ) / window.innerHeight;
    points.scale.set(bounds.width * scale / worldWidth, bounds.height * scale / worldHeight, 1);
  };
  const render = (time) => {
    frameId = null;
    if (!active || document.hidden) return;
    const delta = Math.min((time - lastTime) / 1000, 0.05);
    lastTime = time;
    elapsed += delta;
    parallaxX += (targetX - parallaxX) * 0.035;
    parallaxY += (targetY - parallaxY) * 0.035;
    group.rotation.y = Math.sin(elapsed * 0.28) * 0.022 + parallaxX * 0.035;
    group.rotation.x = Math.sin(elapsed * 0.22) * 0.014 + parallaxY * 0.025;
    camera.position.x = Math.sin(elapsed * 0.18) * 0.025;
    camera.position.y = Math.cos(elapsed * 0.16) * 0.018;
    material.uniforms.uTime.value = elapsed;
    renderer.render(scene, camera);
    frameId = requestAnimationFrame(render);
  };
  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", resize);
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("deviceorientation", onOrientation, { passive: true });
  document.addEventListener("visibilitychange", onVisibilityChange);
  resize();
  syncLoop();

  return {
    camera,
    setActive(value) {
      active = value;
      syncLoop();
    },
    getStats() {
      const running = active && !document.hidden && frameId !== null;
      return {
        renderLoops: running ? 1 : 0,
        canvases: running && renderer.domElement.isConnected ? 1 : 0,
      };
    },
    dispose: () => {
      active = false;
      if (frameId !== null) cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("orientationchange", resize);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("deviceorientation", onOrientation);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      group.remove(points);
      geometry.dispose();
      material.dispose();
      scene.clear();
      renderer.setAnimationLoop(null);
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.width = 0;
      renderer.domElement.height = 0;
    },
    material,
    renderer,
  };
}

function timeText() {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date());
}

function buildInterface(root, config) {
  const cinema = node("div", "dex-cinema");
  const rain = node("canvas", "dex-rain");
  rain.setAttribute("aria-hidden", "true");
  const grain = node("div", "dex-grain");
  grain.setAttribute("aria-hidden", "true");
  const light = node("div", "dex-volumetric");
  light.setAttribute("aria-hidden", "true");
  const frameLines = node("div", "dex-frame-lines");
  frameLines.setAttribute("aria-hidden", "true");

  const masthead = node("div", "dex-masthead");
  masthead.append(
    node("span", "", "ABBAS.P.A / PORTFOLIO OS"),
    node("span", "dex-masthead__clock", timeText()),
  );
  const muteButton = node("button", "dex-sound", "SOUND · ON");
  muteButton.type = "button";
  muteButton.setAttribute("aria-label", "Toggle intro sound");
  const skipButton = node("button", "dex-skip", "SKIP INTRO ↗");
  skipButton.type = "button";
  skipButton.setAttribute("aria-label", "Skip the intro and enter the portfolio");

  const loader = node("section", "dex-loader");
  loader.setAttribute("aria-label", "Portfolio loading progress");
  const loaderReadout = node("output", "dex-loader__readout", "00%");
  loaderReadout.setAttribute("aria-live", "off");
  const loaderTrack = node("div", "dex-loader__track");
  const loaderFill = node("span", "dex-loader__fill");
  loaderTrack.append(loaderFill);
  const loaderFlash = node("span", "dex-loader__flash");
  loaderFlash.setAttribute("aria-hidden", "true");
  loader.append(loaderReadout, loaderTrack, loaderFlash);

  const hud = node("div", "dex-hud");
  const systemPanel = node("section", "dex-panel dex-panel--system");
  systemPanel.setAttribute("aria-label", "System resources");
  const systemTitle = node("div", "dex-panel__heading", "SYSTEM / LOCAL");
  const makeMeter = (label, value, className = "") => {
    const meter = node("div", `dex-meter ${className}`);
    const row = node("div", "dex-meter__row");
    const fill = node("span", "dex-meter__fill");
    row.append(node("span", "dex-meter__label", label), node("span", "dex-meter__value", value));
    const track = node("div", "dex-meter__track");
    track.append(fill);
    meter.append(row, track);
    return { element: meter, fill };
  };
  const cpuMeter = makeMeter("CPU", "08%");
  const ramMeter = makeMeter("RAM", "1.2 GB", "dex-meter--coral");
  const swapMeter = makeMeter("SWAP", "0.4 GB", "dex-meter--cyan");
  const systemInfo = node("p", "dex-panel__info", "LINUX · KERNEL 6.8.12 · UPTIME 00:00:09");
  systemPanel.append(systemTitle, cpuMeter.element, ramMeter.element, swapMeter.element, systemInfo);

  const networkPanel = node("section", "dex-panel dex-panel--network");
  networkPanel.setAttribute("aria-label", "Network and runtime status");
  const networkHeading = node("div", "dex-panel__heading", "NETWORK / LIVE");
  const networkClock = node("time", "dex-panel__clock", timeText());
  networkHeading.append(networkClock);
  const graph = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  graph.setAttribute("viewBox", "0 0 160 42");
  graph.setAttribute("aria-hidden", "true");
  const graphLine = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  graphLine.setAttribute("points", "0,32 16,27 28,31 42,15 55,22 71,12 86,21 100,9 116,17 130,7 145,13 160,3");
  graphLine.setAttribute("class", "dex-panel__graph-line");
  graph.append(graphLine);
  const ping = node("div", "dex-panel__ping", "PORT 5173 · PING 12ms");
  const systemOnline = node("div", "dex-panel__online");
  systemOnline.append(node("span", "dex-panel__online-dot"), node("span", "dex-panel__online-text", "SYSTEM STARTING"));
  networkPanel.append(networkHeading, graph, ping, systemOnline);
  hud.append(systemPanel, networkPanel);

  const terminal = node("section", "dex-terminal");
  terminal.setAttribute("aria-label", "System boot log");
  const terminalHeader = node("div", "dex-terminal__header");
  terminalHeader.append(node("span", "", "PORTFOLIO CORE / BOOT SEQUENCE"), node("span", "dex-terminal__state", "STANDBY"));
  const terminalBody = node("div", "dex-terminal__body");

  const keyboard = node("div", "dex-keyboard");
  const keys = "QWERTYUIOPASDFGHJKLZXCVBNM".split("").map((key) => {
    const element = node("span", "dex-keyboard__key", key);
    element.dataset.key = key;
    return element;
  });
  keys.forEach((key) => keyboard.append(key));
  terminal.append(terminalHeader, hud, terminalBody, keyboard);

  const accessFlash = node("div", "dex-access-flash", "ACCESS GRANTED");
  accessFlash.setAttribute("aria-hidden", "true");
  const blackout = node("div", "dex-blackout");
  blackout.setAttribute("aria-hidden", "true");

  const photoStage = node("div", "dex-photo-stage");
  photoStage.setAttribute("aria-hidden", "true");
  const photoCanvas = node("canvas", "dex-photo-cloud");
  photoCanvas.setAttribute("aria-hidden", "true");
  const photoFrame = node("figure", "dex-photo-frame");
  const photo = node("img", "dex-photo");
  photo.alt = `Portrait of ${config.name}`;
  photo.decoding = "async";
  const photoRing = node("span", "dex-photo-ring");
  photoRing.setAttribute("aria-hidden", "true");
  const photoScanline = node("span", "dex-photo-scanline");
  photoScanline.setAttribute("aria-hidden", "true");
  const photoCaption = node("figcaption", "dex-photo-caption");
  const photoName = node("span", "dex-photo-caption__name");
  const photoRole = node("span", "dex-photo-caption__role");
  photoCaption.append(photoName, photoRole);
  photoFrame.append(photo, photoCaption);
  photoStage.append(photoFrame, photoRing, photoScanline);
  const photoFlash = node("div", "dex-photo-flash");
  photoFlash.setAttribute("aria-hidden", "true");
  cinema.append(rain, light, loader, terminal, accessFlash, photoStage, blackout, photoFlash);
  root.replaceChildren(cinema, grain, frameLines, masthead, muteButton, skipButton);
  return {
    accessFlash,
    blackout,
    cinema,
    cpuFill: cpuMeter.fill,
    graphLine,
    hud,
    keyboard,
    keys,
    loader,
    loaderFill,
    loaderFlash,
    loaderReadout,
    mastheadClock: masthead.querySelector(".dex-masthead__clock"),
    muteButton,
    networkClock,
    photo,
    photoCanvas,
    photoCaption,
    photoFlash,
    photoFrame,
    photoName,
    photoRing,
    photoRole,
    photoScanline,
    photoStage,
    ramFill: ramMeter.fill,
    root,
    skipButton,
    swapFill: swapMeter.fill,
    systemOnline,
    terminal,
    terminalBody,
    terminalState: terminalHeader.querySelector(".dex-terminal__state"),
  };
}

function addBootLineTimeline(timeline, ui, text, index, audio) {
  const line = node("p", "dex-terminal__line");
  const typed = { value: 0 };
  const scrambled = { value: 0 };
  const glyphs = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$";
  const typingDuration = 0.05 + Math.min(text.length, 70) * 0.001;
  const typedLength = Array.from(text).length;
  const characterAt = (length) => Array.from(text).slice(0, length).join("");

  timeline.call(() => {
    if (ui.terminalBody.childElementCount >= 5) ui.terminalBody.firstElementChild.remove();
    ui.terminalBody.append(line);
    ui.terminalState.textContent = "BOOTING";
    ui.mastheadClock.textContent = timeText();
    ui.networkClock.textContent = timeText();
    ui.keys.forEach((key) => key.classList.remove("is-lit"));
    audio.playKeyBurst(Math.min(4, Math.max(1, Math.ceil(text.length / 18))));
  });
  timeline.fromTo(line, {
    autoAlpha: 0,
    y: 7,
  }, {
    autoAlpha: 1,
    y: 0,
    duration: 0.02,
    ease: "power1.out",
  });
  timeline.to(typed, {
    value: typedLength,
    duration: typingDuration,
    ease: "none",
    onUpdate: () => {
      const length = Math.floor(typed.value);
      line.textContent = `${characterAt(length)}▌`;
      ui.keys.forEach((key) => key.classList.toggle(
        "is-lit",
        key.dataset.key === Array.from(text)[Math.max(0, length - 1)]?.toUpperCase(),
      ));
    },
  });
  timeline.to({}, { duration: index % 5 === 4 ? 0.08 : 0.045 });
  timeline.to(scrambled, {
    value: 1,
    duration: 0.025,
    ease: "none",
    onUpdate: () => {
      const fixed = Math.floor(scrambled.value * typedLength);
      line.textContent = `${Array.from(text, (character, characterIndex) => (
        characterIndex < fixed ? character : glyphs[Math.floor(Math.random() * glyphs.length)]
      )).join("")}▌`;
    },
  });
  timeline.to(line, { autoAlpha: 0, y: -10, duration: 0.035, ease: "power1.in" });
  timeline.call(() => {
    line.remove();
    ui.keys.forEach((key) => key.classList.remove("is-lit"));
  });
  timeline.to(ui.cpuFill, {
    width: `${Math.min(24 + index * 3, 92)}%`,
    duration: 0.08,
    ease: "power1.inOut",
  }, "<-0.08");
  timeline.to(ui.ramFill, {
    width: `${Math.min(31 + index * 2.4, 88)}%`,
    duration: 0.08,
    ease: "power1.inOut",
  }, "<");
  timeline.to(ui.swapFill, {
    width: `${Math.min(17 + index * 2.1, 76)}%`,
    duration: 0.08,
    ease: "power1.inOut",
  }, "<");
  timeline.to(ui.graphLine, {
    strokeDashoffset: -120,
    duration: 0.1,
    ease: "none",
  }, "<");
}

export function createPortfolioIntro({ root, config, gsap, onDone, onPhotoSceneChange }) {
  if (!root || !config?.name || !config?.photoUrl || !gsap || typeof onDone !== "function") {
    throw new Error("The cinematic intro requires its root, configured identity, GSAP, and onDone callback.");
  }
  const existingIntro = introInstances.get(root);
  if (existingIntro) return existingIntro;
  const photoUrl = new URL(config.photoUrl, window.location.href);
  if (!["http:", "https:"].includes(photoUrl.protocol)) {
    throw new Error("The configured profile image must use HTTP or HTTPS.");
  }
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reducedMotion.matches) {
    root.remove();
    onDone();
    const instance = {
      destroy() {
        if (introInstances.get(root) === instance) introInstances.delete(root);
      },
    };
    introInstances.set(root, instance);
    return instance;
  }

  const isMobile = window.matchMedia("(max-width: 600px)").matches;
  document.body.classList.add("portfolio-intro-active");
  root.hidden = false;
  root.classList.add("portfolio-intro");
  root.classList.add("is-blank");
  const ui = buildInterface(root, config);
  const audio = createAudioControls(ui.muteButton);
  const stopRainLoop = createCodeRain(root.querySelector(".dex-rain"), isMobile);
  ui.photo.src = photoUrl.href;
  let photoError;
  const photoReady = new Promise((resolve) => {
    let attempts = 0;
    let settled = false;
    const finishPhotoLoad = (loaded) => {
      if (settled) return;
      settled = true;
      ui.photo.removeEventListener("load", onPhotoLoad);
      ui.photo.removeEventListener("error", onPhotoError);
      resolve(loaded);
    };
    const onPhotoLoad = () => finishPhotoLoad(true);
    const onPhotoError = () => {
      if (attempts === 0) {
        attempts += 1;
        const retryUrl = new URL(photoUrl.href);
        retryUrl.searchParams.set("_retry", String(Date.now()));
        ui.photo.src = retryUrl.href;
        return;
      }
        photoError = new Error(`Could not load the configured profile photo: ${config.photoUrl}`);
      finishPhotoLoad(false);
    };
    ui.photo.addEventListener("load", onPhotoLoad);
    ui.photo.addEventListener("error", onPhotoError);
    if (ui.photo.complete) {
      if (ui.photo.naturalWidth) onPhotoLoad();
      else onPhotoError();
    }
  });
  let photoCloud;
  let timeline;
  let completed = false;
  let disposed = false;
  let instance;
  let waitingForPhoto = false;
  let rainRunning = true;
  let lastPointer = { x: 0, y: 0 };
  const abortController = new AbortController();
  const stopRain = () => {
    if (!rainRunning) return;
    rainRunning = false;
    stopRainLoop();
  };
  const cleanBootNodes = () => {
    stopRain();
    root.querySelector(".dex-rain")?.remove();
    root.querySelector(".dex-volumetric")?.remove();
    ui.loader.remove();
    ui.hud.remove();
    ui.keyboard.remove();
    ui.terminal.remove();
    ui.accessFlash.remove();
    ui.mastheadClock.closest(".dex-masthead")?.remove();
    ui.muteButton.remove();
    ui.skipButton.remove();
    root.querySelector(".dex-frame-lines")?.remove();
  };
  const cleanup = (removeNodes) => {
    if (disposed) return;
    disposed = true;
    timeline?.kill();
    gsap.killTweensOf([
      ui.photoStage,
      ui.photo,
      ui.photoFrame,
      ui.photoCanvas,
      ui.photoRing,
      ui.photoScanline,
      ui.photoCaption,
    ]);
    const photoLoaded = ui.photo.complete && ui.photo.naturalWidth > 0;
    gsap.set(ui.photoStage, { autoAlpha: photoLoaded ? 1 : 0, scale: 1 });
    gsap.set(ui.photo, { autoAlpha: photoLoaded ? 1 : 0, clearProps: "transform" });
    stopRain();
    if (photoCloud) {
      photoCloud.dispose();
      photoCloud = undefined;
      ui.photoCanvas.remove();
      onPhotoSceneChange?.(false);
    }
    audio.dispose();
    window.removeEventListener("pointermove", onParallaxMove);
    window.removeEventListener("deviceorientation", onParallaxOrientation);
    reducedMotion.removeEventListener("change", onReducedMotionChange);
    abortController.abort();
    document.body.classList.remove("portfolio-intro-active");
    if (introInstances.get(root) === instance) introInstances.delete(root);
    if (removeNodes) {
      root.remove();
    }
  };
  const finish = () => {
    if (completed || disposed) return;
    completed = true;
    cleanup(true);
    onDone();
  };
  const skip = () => {
    if (completed) return;
    timeline?.kill();
    finish();
  };
  const onReducedMotionChange = (event) => {
    if (event.matches) skip();
  };
  function onParallaxMove(event) {
    lastPointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
    lastPointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
    ui.cinema.style.setProperty("--parallax-x", `${lastPointer.x * 4}px`);
    ui.cinema.style.setProperty("--parallax-y", `${lastPointer.y * 3}px`);
  }
  function onParallaxOrientation(event) {
    if (typeof event.gamma !== "number" || typeof event.beta !== "number") return;
    lastPointer.x = THREE.MathUtils.clamp(event.gamma / 45, -1, 1);
    lastPointer.y = THREE.MathUtils.clamp((event.beta - 35) / 45, -1, 1);
    ui.cinema.style.setProperty("--parallax-x", `${lastPointer.x * 4}px`);
    ui.cinema.style.setProperty("--parallax-y", `${lastPointer.y * 3}px`);
  }
  window.addEventListener("pointermove", onParallaxMove, { passive: true });
  window.addEventListener("deviceorientation", onParallaxOrientation, { passive: true });
  reducedMotion.addEventListener("change", onReducedMotionChange);
  timeline = gsap.timeline({ paused: true, onComplete: finish });
  const bootPanels = [
    ui.hud,
    ui.terminal,
    ui.keyboard,
    ui.mastheadClock.closest(".dex-masthead"),
    ui.muteButton,
    ui.skipButton,
  ];
  const bootLines = makeBootLines(config);
  const roleCaption = "developer · trader · ethical hacker";
  const grain = root.querySelector(".dex-grain");
  const rain = root.querySelector(".dex-rain");
  gsap.set([ui.loader, ...bootPanels], { autoAlpha: 0 });
  gsap.killTweensOf([
    ui.photoStage,
    ui.photo,
    ui.photoFrame,
    ui.photoCanvas,
    ui.photoRing,
    ui.photoScanline,
    ui.photoCaption,
  ]);
  gsap.set(ui.loaderFill, { width: "0%" });
  gsap.set(ui.loaderFlash, { autoAlpha: 0 });
  gsap.set(ui.accessFlash, { autoAlpha: 0, scale: 0.96 });
  gsap.set(ui.blackout, { autoAlpha: 0 });
  gsap.set(ui.photoStage, { autoAlpha: 0 });
  gsap.set(ui.photo, { autoAlpha: 0 });
  gsap.set(ui.photoRing, { autoAlpha: 0, scale: 0.65 });
  gsap.set(ui.photoScanline, { autoAlpha: 0, yPercent: -100 });
  gsap.set(ui.photoCaption, { autoAlpha: 1 });
  gsap.set([ui.photoName, ui.photoRole], { autoAlpha: 1 });
  gsap.set(ui.photoFlash, { autoAlpha: 0 });
  gsap.set(grain, { autoAlpha: 0 });
  gsap.set(rain, { autoAlpha: 0 });
  gsap.set([ui.photoName, ui.photoRole], { clearProps: "transform" });
  ui.photoName.textContent = "";
  ui.photoRole.textContent = "";

  timeline.to({}, { duration: 1 });
  timeline.call(() => {
    root.classList.remove("is-blank");
    audio.whoosh();
  });
  timeline.to(grain, { autoAlpha: 0.11, duration: 0.18, ease: "power1.out" });
  timeline.to(rain, { autoAlpha: 0.34, duration: 0.24, ease: "power1.out" }, "<");
  timeline.fromTo(ui.loader, {
    autoAlpha: 0,
    y: 8,
  }, {
    autoAlpha: 1,
    y: 0,
    duration: 0.16,
    ease: "power2.out",
  }, "<");
  timeline.fromTo([ui.muteButton, ui.skipButton], {
    autoAlpha: 0,
    y: -4,
  }, {
    autoAlpha: 1,
    y: 0,
    duration: 0.15,
    ease: "power2.out",
  }, "<");
  const loading = { progress: 0 };
  timeline.to(loading, {
    progress: 100,
    duration: 1.55,
    ease: "power2.inOut",
    onUpdate: () => {
      const progress = Math.round(loading.progress);
      ui.loaderReadout.textContent = `${String(progress).padStart(2, "0")}%`;
      ui.loaderFill.style.width = `${progress}%`;
    },
  });
  timeline.to({}, { duration: 0.22 });
  timeline.to(ui.loaderFlash, { autoAlpha: 0.92, duration: 0.06, ease: "steps(1)" });
  timeline.to(ui.loaderFlash, { autoAlpha: 0, duration: 0.08, ease: "power1.out" });
  timeline.to(ui.loader, { autoAlpha: 0, y: -5, duration: 0.14, ease: "power2.in" });
  timeline.call(() => ui.loader.remove());

  timeline.fromTo(ui.mastheadClock.closest(".dex-masthead"), {
    autoAlpha: 0,
    x: -18,
    clipPath: "inset(0 100% 0 0)",
  }, {
    autoAlpha: 1,
    x: 0,
    clipPath: "inset(0)",
    duration: 0.24,
    ease: "power2.out",
  });
  timeline.fromTo(ui.hud, {
    autoAlpha: 0,
    clipPath: "inset(0 0 0 100%)",
  }, {
    autoAlpha: 1,
    clipPath: "inset(0)",
    duration: 0.3,
    ease: "power2.out",
  }, "<+0.06");
  timeline.fromTo(ui.terminal, {
    autoAlpha: 0,
    xPercent: -50,
    yPercent: -50,
    y: 10,
    clipPath: "inset(0 0 100% 0)",
  }, {
    autoAlpha: 1,
    xPercent: -50,
    yPercent: -50,
    y: 0,
    clipPath: "inset(0)",
    duration: 0.28,
    ease: "power2.out",
  }, "<+0.04");
  timeline.fromTo(ui.keyboard, {
    autoAlpha: 0,
    y: 9,
    clipPath: "inset(100% 0 0 0)",
  }, {
    autoAlpha: 1,
    y: 0,
    clipPath: "inset(0)",
    duration: 0.22,
    ease: "power2.out",
  }, "<+0.06");
  timeline.to({}, { duration: 0.18 });
  timeline.call(() => {
    ui.terminalState.textContent = "INITIALIZING";
    audio.playKeyBurst(4);
  });
  timeline.addLabel("boot-lines");
  bootLines.forEach((line, index) => addBootLineTimeline(timeline, ui, line, index, audio));
  timeline.to(ui.graphLine, {
    strokeDashoffset: -120,
    duration: 3.35,
    ease: "none",
  }, "boot-lines");
  timeline.call(() => {
    ui.systemOnline.classList.add("is-online");
    ui.systemOnline.querySelector(".dex-panel__online-text").textContent = "SYSTEM ONLINE";
    ui.terminalState.textContent = "READY";
    ui.cinema.classList.add("is-access-shaken");
    ui.accessFlash.classList.add("is-visible");
    audio.click();
  });
  timeline.to(ui.accessFlash, {
    autoAlpha: 1,
    scale: 1,
    duration: 0.09,
    ease: "steps(1)",
  });
  timeline.to(ui.accessFlash, { autoAlpha: 0, scale: 1.04, duration: 0.16, ease: "power1.out" });
  timeline.call(() => {
    ui.cinema.classList.remove("is-access-shaken");
    ui.accessFlash.classList.remove("is-visible");
  });
  timeline.to(bootPanels, { autoAlpha: 0, duration: 0.16, ease: "power2.in" });
  timeline.to(ui.blackout, { autoAlpha: 1, duration: 0.3, ease: "power2.inOut" }, "<");
  timeline.call(cleanBootNodes);

  const cameraFlight = { z: 8 };
  timeline.call(() => {
    if (waitingForPhoto || disposed) return;
    waitingForPhoto = true;
    timeline.pause();
    photoReady.then((loaded) => {
      if (disposed) return;
      if (!loaded) {
        console.error("The configured profile photo could not be loaded.", photoError);
        finish();
        return;
      }
      try {
        ui.photoStage.prepend(ui.photoCanvas);
        photoCloud = createPointCloud(ui.photoCanvas, ui.photo, ui.photo, isMobile);
        onPhotoSceneChange?.(true, photoCloud);
        cameraFlight.z = photoCloud.camera.position.z;
        timeline.play();
      } catch (error) {
        console.error("Could not create the intro photo point cloud.", error);
        finish();
      }
    });
  });
  timeline.call(() => {
    ui.photoStage.setAttribute("aria-hidden", "false");
    audio.whoosh();
  });
  timeline.to(ui.photoStage, { autoAlpha: 1, duration: 0.22, ease: "power2.out" });
  timeline.to(ui.blackout, { autoAlpha: 0, duration: 0.32, ease: "power2.out" }, "<");
  timeline.call(() => ui.blackout.remove());
  const morph = { value: 0 };
  timeline.to(morph, {
    value: 1,
    duration: 0.72,
    ease: "power2.inOut",
    onUpdate: () => {
      if (photoCloud) photoCloud.material.uniforms.uMorph.value = morph.value;
    },
  });
  timeline.to(ui.photoRing, { autoAlpha: 0.82, scale: 1.04, duration: 0.4, ease: "power2.out" }, "<+0.12");
  timeline.to(ui.photoScanline, { autoAlpha: 1, yPercent: 100, duration: 0.44, ease: "power2.inOut" }, "<");
  timeline.to(ui.photoFlash, { autoAlpha: 0.72, duration: 0.07, yoyo: true, repeat: 1, ease: "steps(1)" }, "<+0.15");
  timeline.to(ui.photo, { autoAlpha: 1, duration: 0.3, ease: "power2.inOut" }, "<+0.08");
  const nameTyping = { value: 0 };
  const roleTyping = { value: 0 };
  timeline.to(nameTyping, {
    value: config.name.length,
    duration: 0.42,
    ease: "none",
    onUpdate: () => {
      ui.photoName.textContent = config.name.slice(0, Math.floor(nameTyping.value));
    },
  }, "<+0.08");
  timeline.to(roleTyping, {
    value: roleCaption.length,
    duration: 0.52,
    ease: "none",
    onUpdate: () => {
      ui.photoRole.textContent = roleCaption.slice(0, Math.floor(roleTyping.value));
    },
  }, "<+0.12");
  timeline.to(ui.photoCanvas, { autoAlpha: 0, duration: 0.2, ease: "power1.out" }, "<+0.12");
  timeline.to(ui.photoRing, { scale: 1.3, autoAlpha: 0, duration: 0.38, ease: "power2.out" }, ">-0.08");
  timeline.to(ui.photoFrame, { scale: 1.018, duration: 0.5, ease: "sine.inOut", yoyo: true, repeat: 1 }, ">");
  timeline.call(() => audio.click());
  timeline.to(ui.photoStage, { scale: 1.14, autoAlpha: 0, duration: 0.62, ease: "power3.in" });
  timeline.to(cameraFlight, {
    z: 2.8,
    duration: 0.62,
    ease: "power3.in",
    onUpdate: () => {
      if (photoCloud) photoCloud.camera.position.z = cameraFlight.z;
    },
  }, "<");
  timeline.call(finish);

  timeline.to(ui.cinema, { "--camera-zoom": 1.025, duration: 8, ease: "none" }, 0);
  ui.skipButton.addEventListener("click", skip, { signal: abortController.signal });
  window.addEventListener("pagehide", () => cleanup(false), { once: true, signal: abortController.signal });
  timeline.play(0);

  instance = {
    destroy: () => cleanup(false),
  };
  introInstances.set(root, instance);
  return instance;
}
