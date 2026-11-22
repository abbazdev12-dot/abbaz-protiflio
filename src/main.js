import "./styles.css";
import "./theme-polish.css";
import { portfolioConfig, videoArchive } from "./config/config.js";
import { initHeroExperience } from "./hero/loader.js";
import { initInfiniteWall } from "./gallery/infinite-wall.js";
import { ActiveSceneManager } from "./core/active-scene-manager.js";
import { initElitePolish } from "./elite-polish.js";
import { closeHireModal, openHireModal } from "./hireModal.js";

/**
 * main.js – Portfolio entry point
 *
 * Boots the Three.js world, coordinates the cinematic entry, and manages the
 * lifecycle from intro → scrollable portfolio. Config-driven content is read
 * from ./config/config.js.
 */

// ── Preloader & canvas ──────────────────────────────────────────
const canvas = document.querySelector("#webgl");
// ── Stage containers ────────────────────────────────────────────
const stageOne = document.querySelector("#stage-one");
const stageTwo = document.querySelector("#stage-two");

// ── World UI & navigation ───────────────────────────────────────
const worldUi = document.querySelector("#world-ui");
const revealFlash = document.querySelector("#reveal-flash");
const depthMeter = document.querySelector("#depth-meter");
const availabilityLabel = document.querySelector("#availability-label");

// ── Hero & identity ─────────────────────────────────────────────
const homeHeroBioToggle = document.querySelector("#home-hero-bio-toggle");
const homeHeroBioToggleLabel = document.querySelector("#home-hero-bio-toggle-label");
const homeHeroBio = document.querySelector("#home-hero-bio");
const homeHeroBioStack = document.querySelector("#home-hero-bio-stack");
const homeHeroBioLinks = document.querySelector("#home-hero-bio-links");
const hireButton = document.querySelector('.home-hero__actions .hero-cta--primary[href="#contact"]');
const heroPortrait = document.querySelector("#hero-portrait");
const heroPortraitImage = document.querySelector("#hero-portrait-image");
const heroPortraitPlaceholder = document.querySelector(".hero-portrait__placeholder");
const profileAge = document.querySelector("#profile-age");
const profileLevel = document.querySelector("#profile-level");
const localTime = document.querySelector("#local-time");

// ── Skill & project grids ───────────────────────────────────────
const skillGrid = document.querySelector("#skill-grid");
const projectGrid = document.querySelector("#project-grid");
const projectFilters = document.querySelector("#project-filters");
const projectFilterStatus = document.querySelector("#project-filter-status");
const timelineList = document.querySelector("#timeline-list");

// ── Contact & socials ───────────────────────────────────────────
const contactEmail = document.querySelector("#contact-email");
const copyEmailButton = document.querySelector("#copy-email");
const contactToast = document.querySelector("#contact-toast");
const contactAvailability = document.querySelector("#contact-availability");
const socialLinks = document.querySelector("#social-links");
const timelineYear = document.querySelector("#timeline-year");

// ── Ability card ────────────────────────────────────────────────
const abilityTitle = document.querySelector("#ability-title");
const abilityCardCount = document.querySelector("#ability-card-count");
const abilityToggle = document.querySelector("#ability-toggle");

// ── Collection view ─────────────────────────────────────────────
const collectionView = document.querySelector("#collection-view");
const collectionBackButton = document.querySelector("#collection-back");
const worldNavigation = document.querySelector(".world-nav");
const collectionKicker = document.querySelector("#collection-kicker");
const collectionTitle = document.querySelector("#collection-title");
const collectionDescription = document.querySelector("#collection-description");
const skillWorldKicker = document.querySelector("#skill-world-kicker");
const skillWorldTitle = document.querySelector("#skill-world-title");
const skillWorldCaption = document.querySelector("#skill-world-caption");
const skillWorldTags = document.querySelector("#skill-world-tags");
const skillWorldVisual = document.querySelector("#skill-world-visual");
const skillWorldProcess = document.querySelector("#skill-world-process");
const collectionMedia = document.querySelector(".collection-view__media");
const collectionCount = document.querySelector("#collection-count");
const collectionFilters = document.querySelector("#collection-filters");
const collectionGrid = document.querySelector("#collection-grid");
const collectionArchiveTotal = document.querySelector("#collection-archive-total");
const collectionArchivePortrait = document.querySelector("#collection-archive-portrait");
const collectionProjects = document.querySelector("#collection-projects");
const collectionProjectList = document.querySelector("#collection-project-list");
const collectionPlayerDialog = document.querySelector("#collection-player");
const collectionPlayerVideo = document.querySelector("#collection-player-video");
const collectionPlayerTitle = document.querySelector("#collection-player-title");
const collectionPlayerDescription = document.querySelector("#collection-player-description");
const collectionPlayerPosition = document.querySelector("#collection-player-position");
const collectionPlayerStatus = document.querySelector("#collection-player-status");
const collectionPlayerToggle = document.querySelector("#collection-player-toggle");
const collectionPlayerPrevious = document.querySelector("#collection-player-previous");
const collectionPlayerNext = document.querySelector("#collection-player-next");
const collectionPlayerClose = document.querySelector("#collection-player-close");
const collectionPlayerFullscreen = document.querySelector("#collection-player-fullscreen");

// ── Dialogs & tools ─────────────────────────────────────────────
const doorFallback = document.querySelector("#door-fallback");
const doorHoverDescription = document.querySelector("#door-hover-description");
const commandButton = document.querySelector("#command-button");
const freeLookButton = document.querySelector("#free-look-button");
const commandDialog = document.querySelector("#command-dialog");
const commandInput = document.querySelector("#command-input");
const commandResults = document.querySelector("#command-results");
const projectDialog = document.querySelector("#project-dialog");
const projectDialogContent = document.querySelector("#project-dialog-content");
const projectDialogBack = document.querySelector("#project-dialog-back");
const projectDialogClose = document.querySelector("#project-dialog-close");
const abilityProfileDialog = document.querySelector("#ability-profile");
const abilityProfileShell = document.querySelector(".ability-profile__shell");
const abilityProfileBack = document.querySelector("#ability-profile-back");
const abilityProfileContent = document.querySelector("#ability-profile-content");
const motionButton = document.querySelector("#motion-button");
const sceneManager = new ActiveSceneManager();

let introScene;
let introSequence;
let LenisConstructor;
let destroyed = false;
let revealComplete = false;
let gsap;
let ScrollTrigger;
let lenis;
let lenisTicker;
let lenisScrollHandler;
let worldScrollTrigger;
let worldScrollHandler;
let heroThemeTransition;
let heroThemeObserver;
let disposeHeroExperience = () => {};
let disposeActiveNavigation = () => {};
let localClockTimer;
let experienceStarted = false;
let portraitLoadPromise = Promise.resolve(false);
let portraitRetryTimer;
let finishPortraitLoad;
let doorsSectionObserver;
let abilityProfileReturnTarget;
let abilityProfileReturnHash = "#home";
let abilityProfilePreviousTitle = document.title;
let abilityProfileActiveIndex = 0;
let abilityProfileStatsFrame;
let collectionHistoryEntry = false;
let collectionPreviousTitle = document.title;
let collectionReturnHash = "#doors";
let collectionTransitionTimeline;
let activeCollectionMedia = [];
let activeCollectionMediaIndex = -1;
let collectionPlayerReturnTarget;
let disposeInfiniteWall = () => {};
let resizeInfiniteWall = () => {};
let disposeWorldVisual = () => {};
let fallbackDoorTransitionTimer;
let fallbackDoorSelectionPending = false;
const preloadedDoorMedia = new Map();
let worldScene;
let commandItems = [];
let commandIndex = 0;
let projectDialogReturnTarget;
let disposeHeadingReveal = () => {};
let disposeCardEffects = () => {};
let disposeTimelineReveal = () => {};
const skillVisualDisposers = [];
const visualMotionControllers = new Set();
const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const uiAbortController = new AbortController();
const uiListenerOptions = { signal: uiAbortController.signal };
let bootStarted = false;
const previousMainDispose = window.__portfolioMainDispose;
if (typeof previousMainDispose === "function") previousMainDispose();

const primarySceneController = {
  setActive(active) {
    if (active && !canvas.isConnected) {
      document.querySelector("#app").insertBefore(canvas, revealFlash);
    } else if (!active && canvas.isConnected) {
      canvas.style.display = "none";
      canvas.style.visibility = "hidden";
      canvas.remove();
    }
    introScene?.setActive(active);
  },
  getStats() {
    return introScene?.getStats() || { renderLoops: 0, canvases: 0 };
  },
};

function setActiveSceneState(state) {
  if (state === "INTRO" || state === "DOORS" || state === "WALL") {
    introScene?.setRenderMode(state);
  }
  sceneManager.setState(state);
}

const skillVisualAccents = {
  "Ethical Hacking": "#6C63FF",
  "Full Stack Development": "#6C63FF",
  "Forex Trading": "#FF5C7A",
  "Futures Trading": "#A9AEBA",
};

const projectFilterOptions = [
  { id: "all", label: "All" },
  { id: "web-development", label: "Web Development" },
  { id: "cybersecurity", label: "Cybersecurity" },
  { id: "trading", label: "Trading" },
  { id: "creative-work", label: "Creative Work" },
];

const doorIdentities = [
  {
    id: "hacking",
    number: "01",
    title: "HACKING",
    subtitle: "Understanding systems. Exploring security.",
    description:
      "Cybersecurity, ethical hacking, security research, networking, Linux and learning how systems work.",
    skillTitle: "Ethical Hacking",
    accent: "#c49a76",
    tags: ["Security research", "Networking", "Linux & operating systems", "Authorized labs", "Systems thinking"],
    showcaseTitle: "A controlled research loop",
    showcaseCaption: "Security learning grounded in defined scope, careful observation, and responsible fixes.",
    showcaseStatus: "AUTHORIZED RESEARCH",
    processTitle: "Research loop",
  },
  {
    id: "tech",
    number: "02",
    title: "TECH",
    subtitle: "Building. Breaking. Experimenting.",
    description:
      "Technology, operating systems, hardware, software, experiments and technical projects.",
    skillTitle: "Full Stack Development",
    accent: "#9baec1",
    tags: ["Operating systems", "Hardware", "Software", "Experiments", "Projects"],
    showcaseTitle: "The digital lab",
    showcaseCaption: "Operating systems, hardware, and software as connected ground for exploration.",
    showcaseStatus: "AREAS OF INTEREST",
    showcaseItems: ["Operating systems", "Hardware", "Software", "Experiments"],
    processTitle: "Build / test / learn",
    process: [
      "Explore operating systems and hardware",
      "Build small technical experiments",
      "Take systems apart to understand them",
      "Test, refine, and record discoveries",
    ],
  },
  {
    id: "trading",
    number: "03",
    title: "TRADING",
    subtitle: "Reading the markets. Mastering the process.",
    description:
      "ICT concepts, market structure, liquidity, chart analysis, trading psychology and market studies.",
    skillTitle: "Forex Trading",
    accent: "#d0a15e",
    tags: ["ICT concepts", "Market structure", "Liquidity", "Chart analysis", "Psychology"],
    showcaseTitle: "The market journal",
    showcaseCaption: "Illustrative chart study — fictional sample data, never live prices or performance.",
    showcaseStatus: "FICTIONAL CHART STUDY",
    showcaseItems: ["Structure", "Liquidity", "Journal review"],
    processTitle: "Study & review",
    process: [
      "Study context and market structure",
      "Mark liquidity and areas of interest",
      "Plan risk before considering a setup",
      "Wait for defined conditions",
      "Journal decisions and review the process",
    ],
  },
  {
    id: "me",
    number: "04",
    title: "ME",
    subtitle: "The mind behind the experiments.",
    description:
      "My personal identity, story, mindset, ambitions and journey.",
    skillTitle: "Me",
    accent: "#bd806b",
    tags: ["Curiosity", "Self-directed learning", "Resilience", "Long-term ambition"],
    showcaseType: "timeline",
    showcaseTitle: "A path still unfolding",
    showcaseCaption: "A personal timeline shaped by curiosity, practice, and continuing ambition.",
    showcaseStatus: "LEARNING IN PUBLIC",
    showcaseItems: ["A personal timeline"],
    processTitle: "The journey",
    directionTitle: "Looking ahead",
    directionItems: [
      "Explore how systems work across security, technology, and markets.",
      "Learn through study, building experiments, and reflecting on the result.",
      "Carry curiosity and resilience into the next chapter.",
    ],
  },
];

function createTextElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  element.textContent = text;
  return element;
}

function safeWebUrl(value, allowRelative = false) {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const url = new URL(value.trim(), allowRelative ? window.location.href : undefined);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : "";
  } catch {
    return "";
  }
}

function createCandlestickVisual(canvas, trackDisposal = true, colors) {
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not create the illustrative candlestick chart.");

  const candles = Array.from({ length: 34 }, (_, index) => ({
    close: 72 + Math.sin(index * 0.62) * 21 + Math.sin(index * 0.19) * 12,
  }));
  let animationTimer;
  let observer;
  let visible = false;
  let reducedMotion = reduceMotionQuery.matches || document.body.classList.contains("reduce-motion");
  let phase = 0;

  const draw = () => {
    const width = canvas.width;
    const height = canvas.height;
    context.clearRect(0, 0, width, height);
    context.fillStyle = "#0b1325";
    context.fillRect(0, 0, width, height);
    context.strokeStyle = "rgba(255,255,255,.09)";
    context.lineWidth = 1;
    for (let y = 24; y < height; y += 30) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }

    candles.forEach(({ close }, index) => {
      const x = 14 + index * 17;
      const open = close - Math.sin((index + phase) * 1.73) * 15;
      const high = Math.min(open, close) - 9;
      const low = Math.max(open, close) + 10;
      const color = close >= open
        ? colors?.up || "#22c55e"
        : colors?.down || "#FF5C7A";
      context.strokeStyle = color;
      context.fillStyle = color;
      context.beginPath();
      context.moveTo(x, high);
      context.lineTo(x, low);
      context.stroke();
      context.fillRect(x - 4, Math.min(open, close), 8, Math.max(4, Math.abs(close - open)));
    });
  };

  const syncAnimation = () => {
    window.clearInterval(animationTimer);
    animationTimer = undefined;
    if (!visible || reducedMotion) return;
    animationTimer = window.setInterval(() => {
      phase += 1;
      candles.shift();
      const lastClose = candles[candles.length - 1].close;
      candles.push({
        close: Math.max(26, Math.min(118, lastClose + Math.sin(phase * 0.67) * 13)),
      });
      draw();
    }, 850);
  };

  draw();
  if ("IntersectionObserver" in window) {
    observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      syncAnimation();
    }, { threshold: 0.1 });
    observer.observe(canvas);
  }
  const setReducedMotion = (value) => {
    reducedMotion = value;
    syncAnimation();
  };
  const dispose = () => {
    window.clearInterval(animationTimer);
    observer?.disconnect();
    visualMotionControllers.delete(setReducedMotion);
  };
  visualMotionControllers.add(setReducedMotion);
  if (trackDisposal) skillVisualDisposers.push(dispose);
  return dispose;
}

function createSkillVisual(skill) {
  const visual = document.createElement("div");
  visual.className = `skill-visual skill-visual--${skill.title.toLowerCase().replaceAll(" ", "-")}`;
  visual.style.setProperty("--visual-accent", skillVisualAccents[skill.title] || "#8b5cf6");

  if (skill.title === "Ethical Hacking") {
    visual.setAttribute("aria-label", "Authorized security lab terminal example");
    const terminal = document.createElement("div");
    terminal.className = "skill-visual__terminal";
    const bar = document.createElement("div");
    bar.className = "skill-visual__terminal-bar";
    ["red", "yellow", "green"].forEach((color) => {
      const dot = document.createElement("span");
      dot.className = `skill-visual__terminal-dot skill-visual__terminal-dot--${color}`;
      dot.setAttribute("aria-hidden", "true");
      bar.append(dot);
    });
    bar.append(createTextElement("span", "skill-visual__terminal-title", "AUTHORIZED LAB"));
    const output = document.createElement("pre");
    output.setAttribute("aria-label", "Scope: authorized only. OWASP Top 10 lab notes. Findings and fixes.");
    output.append(
      createTextElement("span", "skill-visual__typing", "scope: authorized only"),
      document.createTextNode("\n"),
      createTextElement("span", "skill-visual__terminal-muted", "> OWASP Top 10 lab notes\n> findings and fixes"),
    );
    terminal.append(bar, output);
    visual.append(terminal);
  } else if (skill.title === "Full Stack Development") {
    visual.setAttribute("aria-label", "Frontend, API, database, and deployment layers");
    visual.classList.add("skill-visual--stack");
    ["Frontend", "API", "Database", "Deploy"].forEach((label, index) => {
      visual.append(createTextElement("span", `skill-visual__layer skill-visual__layer--${index}`, label));
    });
  } else if (skill.title === "Forex Trading") {
    const canvas = document.createElement("canvas");
    canvas.width = 660;
    canvas.height = 190;
    canvas.className = "skill-visual__chart";
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", "Illustrative, generated candlestick chart; not live market data.");
    createCandlestickVisual(canvas);
    const chartHeader = document.createElement("div");
    chartHeader.className = "skill-visual__chart-header";
    chartHeader.append(
      createTextElement("strong", "", "Market journal"),
      createTextElement("span", "skill-visual__caption", "ILLUSTRATIVE"),
    );
    const riskChips = document.createElement("div");
    riskChips.className = "skill-visual__risk-chips";
    ["Risk per trade", "Journaling", "Process"].forEach((label) => {
      riskChips.append(createTextElement("span", "", label));
    });
    visual.append(chartHeader, canvas, riskChips);
  } else if (skill.title === "Futures Trading") {
    visual.classList.add("skill-visual--ticker");
    const ticker = document.createElement("div");
    ticker.className = "skill-visual__ticker-track";
    ticker.setAttribute("aria-hidden", "true");
    ["ES", "MNQ", "CL", "YM", "ES", "MNQ", "CL", "YM"].forEach((symbol) => {
      ticker.append(createTextElement("span", "", symbol));
    });
    visual.append(
      ticker,
      createTextElement("span", "skill-visual__caption", "ILLUSTRATIVE TICKER"),
    );
  }
  return visual;
}

function selectFallbackDoor(identity, door) {
  if (fallbackDoorSelectionPending) return;
  fallbackDoorSelectionPending = true;
  door.classList.add("is-opening");
  doorFallback.querySelectorAll(".door-fallback__item").forEach((item) => {
    item.disabled = true;
  });
  doorFallback.classList.add("is-transitioning");
  doorFallback.setAttribute("aria-busy", "true");

  const enterWorld = () => {
    window.dispatchEvent(new CustomEvent("portfolio:door-select", {
      detail: { doorId: identity.id },
    }));
  };
  const sceneDoorTitle = identity.id === "me" ? "Futures Trading" : identity.skillTitle;
  if (worldScene?.selectDoor(sceneDoorTitle, { doorId: identity.id })) return;
  if (document.body.classList.contains("reduce-motion") || reduceMotionQuery.matches) {
    enterWorld();
    return;
  }
  fallbackDoorTransitionTimer = window.setTimeout(() => {
    fallbackDoorTransitionTimer = undefined;
    enterWorld();
  }, 350);
}

function prefetchDoorDestination(identity) {
  if (preloadedDoorMedia.has(identity.id)) return;
  const destination = portfolioConfig.doors.find((door) => door.id === identity.id);
  if (!destination) return;

  const mediaPreloaders = destination.videos
    .slice(0, 4)
    .filter((video) => video.src)
    .map(({ src }) => {
      const preloader = document.createElement("video");
      preloader.preload = "metadata";
      preloader.muted = true;
      preloader.src = src;
      preloader.load();
      return preloader;
    });
  preloadedDoorMedia.set(identity.id, mediaPreloaders);
}

function disposePreloadedDoorMedia() {
  preloadedDoorMedia.forEach((preloaders) => {
    preloaders.forEach((preloader) => {
      preloader.pause();
      preloader.removeAttribute("src");
      preloader.load();
    });
  });
  preloadedDoorMedia.clear();
}

function renderDoorContent() {
  doorFallback.replaceChildren();
  const existingCaption = document.querySelector(".door-scene-caption");
  existingCaption?.remove();
  const caption = createTextElement("p", "door-scene-caption", "HOVER TO OPEN · CLICK TO ENTER");
  caption.setAttribute("aria-hidden", "true");
  doorHoverDescription.insertAdjacentElement("afterend", caption);
  doorIdentities.forEach((identity) => {
    const door = document.createElement("button");
    door.className = "door-fallback__item";
    door.type = "button";
    door.dataset.doorId = identity.id;
    door.style.setProperty("--door-accent", identity.accent);
    door.setAttribute("aria-label", `Enter world ${identity.number}: ${identity.title}. ${identity.subtitle}`);
    const reveal = document.createElement("span");
    reveal.className = "door-fallback__reveal";
    reveal.setAttribute("aria-hidden", "true");
    reveal.append(createTextElement("span", "door-fallback__light", ""));
    const leaf = document.createElement("span");
    leaf.className = "door-fallback__leaf";
    leaf.setAttribute("aria-hidden", "true");
    const upperPanel = createTextElement("span", "door-fallback__panel door-fallback__panel--upper", "");
    const lowerPanel = createTextElement("span", "door-fallback__panel door-fallback__panel--lower", "");
    const edge = createTextElement("span", "door-fallback__edge", "");
    const handle = createTextElement("span", "door-fallback__handle", "");
    const hinges = document.createElement("span");
    hinges.className = "door-fallback__hinges";
    hinges.append(
      createTextElement("span", "", ""),
      createTextElement("span", "", ""),
      createTextElement("span", "", ""),
    );
    leaf.append(
      upperPanel,
      lowerPanel,
      edge,
      handle,
      hinges,
    );
    const frame = createTextElement("span", "door-fallback__frame", "");
    frame.setAttribute("aria-hidden", "true");
    door.append(reveal, frame, leaf);
    const setActiveDoor = (activeDoor) => {
      doorFallback.querySelectorAll(".door-fallback__item").forEach((item) => {
        item.classList.toggle("is-active", item === activeDoor);
      });
      doorFallback.classList.toggle("has-active-door", Boolean(activeDoor));
      const activeIdentity = doorIdentities.find((entry) => entry.id === activeDoor?.dataset.doorId);
      doorHoverDescription.textContent = activeIdentity?.subtitle || "Choose a world";
      window.dispatchEvent(new CustomEvent("portfolio:door-hover", {
        detail: { title: activeIdentity?.skillTitle || null },
      }));
    };
    door.addEventListener("pointerenter", () => {
      prefetchDoorDestination(identity);
      setActiveDoor(door);
    }, { signal: uiAbortController.signal });
    door.addEventListener("pointerleave", () => {
      if (!door.matches(":focus-within")) setActiveDoor(null);
    }, { signal: uiAbortController.signal });
    door.addEventListener("focus", () => setActiveDoor(door), { signal: uiAbortController.signal });
    door.addEventListener("blur", (event) => {
      if (event.relatedTarget instanceof Element) {
        const nextDoor = event.relatedTarget.closest(".door-fallback__item");
        if (nextDoor) {
          setActiveDoor(nextDoor);
          return;
        }
      }
      if (!door.matches(":hover")) setActiveDoor(null);
    }, { signal: uiAbortController.signal });
    door.addEventListener("click", () => {
      selectFallbackDoor(identity, door);
    }, { signal: uiAbortController.signal });
    doorFallback.append(door);
  });
}

function renderProjectPreview(project, index) {
  const preview = document.createElement("div");
  preview.className = `project-preview${index === 1 || index === 2 ? " project-preview--phone" : ""}`;
  preview.setAttribute("aria-hidden", "true");
  const frame = document.createElement("div");
  frame.className = "project-preview__frame";
  const chrome = document.createElement("div");
  chrome.className = "project-preview__chrome";
  ["", "", ""].forEach(() => {
    const dot = document.createElement("span");
    chrome.append(dot);
  });
  chrome.append(createTextElement("span", "", "portfolio / preview"));
  const screen = document.createElement("div");
  screen.className = "project-preview__screen";
  screen.append(
    createTextElement("span", "project-preview__eyebrow", "PROJECT PREVIEW"),
    createTextElement("span", "project-preview__headline", project.title),
    createTextElement("span", "project-preview__line", ""),
    createTextElement("span", "project-preview__line project-preview__line--short", ""),
    createTextElement("span", "project-preview__tile", ""),
  );
  const screenshotUrl = safeWebUrl(project.screenshot, true);
  if (screenshotUrl) {
    const image = document.createElement("img");
    image.className = "project-preview__image";
    image.src = screenshotUrl;
    image.alt = "";
    image.addEventListener("error", () => image.remove(), { once: true });
    screen.prepend(image);
  }
  frame.append(chrome, screen);
  preview.append(frame);
  return preview;
}

function renderProjectVisual(project, index) {
  const preview = document.createElement("div");
  preview.className = "project-visual";
  preview.dataset.visual = project.previewStyle || "architecture";
  preview.setAttribute("aria-hidden", "true");

  const header = document.createElement("div");
  header.className = "project-visual__header";
  header.append(
    createTextElement("span", "", "PROJECT VISUAL STUDY"),
    createTextElement("span", "", `${String(index + 1).padStart(2, "0")} / ${String(portfolioConfig.projects.length).padStart(2, "0")}`),
  );

  const stage = document.createElement("div");
  stage.className = "project-visual__stage";
  stage.append(
    createTextElement("span", "project-visual__orbit-label", project.category.toUpperCase()),
    createTextElement("span", "project-visual__geometry project-visual__geometry--back", ""),
    createTextElement("span", "project-visual__geometry project-visual__geometry--front", ""),
  );
  const composition = document.createElement("div");
  composition.className = "project-visual__composition";
  composition.append(
    createTextElement("span", "project-visual__number", String(index + 1).padStart(2, "0")),
    createTextElement("span", "project-visual__wordmark", project.title),
  );
  const stack = document.createElement("ul");
  stack.className = "project-visual__stack";
  (project.stack || []).slice(0, 3).forEach((item) => {
    stack.append(createTextElement("li", "", item));
  });
  composition.append(stack);
  stage.append(composition);

  const footer = document.createElement("div");
  footer.className = "project-visual__footer";
  const screenshotUrl = safeWebUrl(project.screenshot, true);
  footer.append(
    createTextElement("span", "", screenshotUrl ? "PROJECT SCREENSHOT" : "CONCEPT ARTWORK · NOT A PRODUCT SCREEN"),
    createTextElement("span", "", String(project.status || "IN PROGRESS").split("·")[0].trim().toUpperCase()),
  );

  if (screenshotUrl) {
    preview.classList.add("has-screenshot");
    const image = document.createElement("img");
    image.className = "project-visual__image";
    image.src = screenshotUrl;
    image.alt = "";
    image.loading = "lazy";
    image.decoding = "async";
    image.addEventListener("error", () => {
      image.remove();
      preview.classList.remove("has-screenshot");
    }, { once: true });
    stage.append(image);
  }

  preview.append(header, stage, footer);
  return preview;
}

function projectMatchesFilter(project, filterId) {
  return filterId === "all" || project.filterCategories?.includes(filterId) === true;
}

function applyProjectFilter(filterId) {
  const filter = projectFilterOptions.find((option) => option.id === filterId);
  if (!filter) return;

  let visibleCount = 0;
  [...projectGrid.children].forEach((card) => {
    const project = portfolioConfig.projects[Number(card.dataset.projectIndex)];
    if (!project) return;
    card.hidden = !projectMatchesFilter(project, filterId);
    if (!card.hidden) visibleCount += 1;
  });

  projectGrid.dataset.filter = filterId;
  projectGrid.dataset.visibleCount = String(visibleCount);
  projectFilters.querySelectorAll("button").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.projectFilter === filterId));
  });
  projectFilterStatus.textContent = visibleCount
    ? `Showing ${visibleCount} of ${portfolioConfig.projects.length} projects: ${filter.label}.`
    : `No projects are currently tagged ${filter.label}.`;
}

function renderProjectFilters() {
  projectFilters.replaceChildren();
  projectFilterOptions.forEach((filter) => {
    const count = portfolioConfig.projects.filter((project) =>
      projectMatchesFilter(project, filter.id),
    ).length;
    const button = createTextElement("button", "project-filter", filter.label);
    button.type = "button";
    button.dataset.projectFilter = filter.id;
    button.setAttribute("aria-pressed", String(filter.id === "all"));
    button.setAttribute("aria-controls", projectGrid.id);
    button.append(createTextElement("span", "project-filter__count", String(count)));
    button.addEventListener("click", () => applyProjectFilter(filter.id), uiListenerOptions);
    projectFilters.append(button);
  });
  applyProjectFilter("all");
}

function initCardEffects() {
  const cards = [...document.querySelectorAll(".premium-card")];
  if (!cards.length) return () => {};
  const reduceMotion = document.body.classList.contains("reduce-motion");
  const canTilt = window.matchMedia("(min-width: 768px) and (hover: hover) and (pointer: fine)").matches;
  const tiltLeaveHandlers = new Map();
  const observer = !reduceMotion && "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) {
          target.classList.add("is-visible");
          observer.unobserve(target);
        }
      });
    }, { threshold: 0.12 })
    : undefined;
  const resetTilt = (card) => {
    card.style.setProperty("--tilt-x", "0deg");
    card.style.setProperty("--tilt-y", "0deg");
    card.style.setProperty("--pointer-x", "50%");
    card.style.setProperty("--pointer-y", "50%");
    card.classList.remove("is-pointer-active");
  };
  const onPointerMove = (event) => {
    const card = event.currentTarget;
    const bounds = card.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    card.style.setProperty("--tilt-x", `${(0.5 - y) * 5}deg`);
    card.style.setProperty("--tilt-y", `${(x - 0.5) * 6}deg`);
    card.style.setProperty("--pointer-x", `${x * 100}%`);
    card.style.setProperty("--pointer-y", `${y * 100}%`);
    card.classList.add("is-pointer-active");
  };

  cards.forEach((card, index) => {
    card.style.setProperty("--reveal-delay", `${Math.min(index * 70, 420)}ms`);
    if (reduceMotion || !observer) card.classList.add("is-visible");
    else observer.observe(card);
    if (canTilt && !reduceMotion) {
      const onPointerLeave = () => resetTilt(card);
      card.addEventListener("pointermove", onPointerMove);
      card.addEventListener("pointerleave", onPointerLeave);
      tiltLeaveHandlers.set(card, onPointerLeave);
    }
  });

  return () => {
    observer?.disconnect();
    cards.forEach((card) => {
      card.removeEventListener("pointermove", onPointerMove);
      const onPointerLeave = tiltLeaveHandlers.get(card);
      if (onPointerLeave) card.removeEventListener("pointerleave", onPointerLeave);
      card.classList.remove("is-pointer-active");
      card.style.removeProperty("--tilt-x");
      card.style.removeProperty("--tilt-y");
      card.style.removeProperty("--pointer-x");
      card.style.removeProperty("--pointer-y");
      card.style.removeProperty("--reveal-delay");
    });
  };
}

function renderPortfolioContent() {
  const portfolioName = portfolioConfig.name && portfolioConfig.name !== "[NAME]"
    ? portfolioConfig.name
    : "Developer";
  document.title = `${portfolioName} — Interactive Portfolio`;
  document.querySelector('meta[property="og:title"]').content = document.title;
  document.querySelector('meta[name="description"]').content =
    `${portfolioName}'s interactive portfolio in ethical security, software development, and the markets.`;
  document.querySelector('meta[property="og:description"]').content =
    document.querySelector('meta[name="description"]').content;
  skillGrid.replaceChildren();
  projectGrid.replaceChildren();
  timelineList.replaceChildren();
  socialLinks.replaceChildren();
  disposeCardEffects();
  skillVisualDisposers.splice(0).forEach((dispose) => dispose());
  visualMotionControllers.forEach((setReducedMotion) => {
    setReducedMotion(document.body.classList.contains("reduce-motion"));
  });
  document.querySelectorAll("[data-config='name']").forEach((element) => {
    element.textContent = portfolioConfig.name || "[NAME]";
  });
  document.querySelectorAll("[data-config='tagline']").forEach((element) => {
    element.textContent = portfolioConfig.tagline;
  });
  profileAge.textContent = String(portfolioConfig.age);
  profileLevel.textContent = `● ${portfolioConfig.status.heading}`;
  heroPortraitPlaceholder.setAttribute("aria-label", `Portrait placeholder for ${portfolioName}`);
  const portraitUrl = safeWebUrl(portfolioConfig.photoUrl, true);
  if (portraitUrl) {
    heroPortraitImage.alt = `Portrait of ${portfolioName}`;
    heroPortraitImage.loading = "eager";
    portraitLoadPromise = new Promise((resolve) => {
      let attempts = 0;
      let settled = false;
      const finish = (loaded) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(portraitRetryTimer);
        heroPortraitImage.onload = null;
        heroPortraitImage.onerror = null;
        finishPortraitLoad = undefined;
        if (loaded) {
          heroPortrait.classList.add("hero-portrait--loaded");
          heroPortraitImage.hidden = false;
        } else {
          heroPortrait.classList.remove("hero-portrait--loaded");
          heroPortraitImage.hidden = true;
        }
        resolve(loaded);
      };
      finishPortraitLoad = () => finish(false);
      heroPortraitImage.onload = () => finish(true);
      heroPortraitImage.onerror = () => {
        if (attempts === 0) {
          attempts += 1;
          portraitRetryTimer = window.setTimeout(() => {
            const retryUrl = new URL(portraitUrl, window.location.href);
            retryUrl.searchParams.set("_retry", String(Date.now()));
            heroPortraitImage.src = retryUrl.href;
          }, 180);
          return;
        }
        console.error("Could not load the configured hero portrait after a retry; showing the placeholder.");
        finish(false);
      };
      heroPortraitImage.src = portraitUrl;
      if (heroPortraitImage.complete) {
        if (heroPortraitImage.naturalWidth) heroPortraitImage.onload();
        else heroPortraitImage.onerror();
      }
    });
  }
  abilityTitle.textContent = portfolioConfig.abilityCard.title;
  abilityCardCount.textContent = String(portfolioConfig.abilityCard.items?.length || 0).padStart(2, "0");
  contactAvailability.textContent = portfolioConfig.status.availability;
  renderDoorContent();

  if (portfolioConfig.email.trim()) {
    contactEmail.href = `mailto:${portfolioConfig.email.trim()}`;
    contactEmail.textContent = portfolioConfig.email.trim();
    copyEmailButton.hidden = false;
  } else {
    contactEmail.removeAttribute("href");
    contactEmail.textContent = "Add an email address in config/config.js before publishing.";
    copyEmailButton.hidden = true;
  }

  const socialNames = { github: "GitHub", linkedin: "LinkedIn", x: "X", instagram: "Instagram" };
  Object.entries(portfolioConfig.socials).forEach(([key, value]) => {
    const href = safeWebUrl(value);
    if (!href || !socialNames[key]) return;
    const link = createTextElement("a", "social-link", socialNames[key]);
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    socialLinks.append(link);
  });

  const fullStackSkill = portfolioConfig.skills.find((skill) => skill.title === "Full Stack Development");
  const portfolioProject = portfolioConfig.projects.find((project) => project.title === "Personal portfolio website");
  const bioStack = [...new Set([
    ...(fullStackSkill?.tags || []),
    ...(portfolioProject?.stack || []),
  ])];
  homeHeroBioStack.replaceChildren(
    ...bioStack.map((technology) => createTextElement("li", "home-hero__bio-badge", technology)),
  );

  const configuredBioLinks = [
    { label: "Resume PDF", href: safeWebUrl(portfolioConfig.resumeUrl, true) },
    { label: "GitHub", href: safeWebUrl(portfolioConfig.socials.github) },
    { label: "LinkedIn", href: safeWebUrl(portfolioConfig.socials.linkedin) },
  ];
  configuredBioLinks.forEach(({ label, href }) => {
    if (!href) return;
    const link = createTextElement("a", "home-hero__bio-link", `${label} ↗`);
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    homeHeroBioLinks.append(link);
  });

  portfolioConfig.skills.forEach((skill) => {
    const card = document.createElement("article");
    card.className = "skill-card premium-card";
    card.id = `skill-${skill.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
    card.dataset.skillTitle = skill.title;
    card.tabIndex = -1;
    card.style.setProperty("--skill-color", skillVisualAccents[skill.title] || "#8b5cf6");
    const iconTile = document.createElement("span");
    iconTile.className = "skill-card__icon-tile";
    iconTile.setAttribute("aria-hidden", "true");
    iconTile.append(createTextElement("span", "skill-card__icon", skill.icon));
    card.append(
      iconTile,
      createTextElement("h3", "skill-card__title", skill.title),
      createTextElement("p", "skill-card__description", skill.description),
      createSkillVisual(skill),
    );
    const tags = document.createElement("ul");
    tags.className = "skill-card__tags";
    skill.tags.filter(Boolean).forEach((tag) => tags.append(createTextElement("li", "", tag)));
    card.append(tags);
    skillGrid.append(card);
  });

  if (portfolioConfig.projects.length === 0) {
    projectGrid.append(
      createTextElement(
        "p",
        "empty-state",
        "Project case studies are being prepared. Add completed work to the projects list in config/config.js.",
      ),
    );
  } else {
    portfolioConfig.projects.forEach((project, index) => {
      const card = document.createElement("article");
      card.className = "project-card premium-card";
      card.dataset.projectIndex = String(index);
      card.style.setProperty("--card-accent", "#c5a16f");
      card.append(
        renderProjectVisual(project, index),
        createTextElement(
          "p",
          "section-kicker",
          `${project.category} / ${String(index + 1).padStart(2, "0")}`,
        ),
        createTextElement("p", "project-card__status", project.status),
        createTextElement("h3", "", project.title),
        createTextElement("p", "", project.problem),
      );
      const stack = document.createElement("ul");
      stack.className = "project-card__stack";
      (project.stack || []).forEach((item) => {
        stack.append(createTextElement("li", "", item));
      });
      card.append(stack);
      const openButton = createTextElement("button", "project-open", "View project details");
      openButton.type = "button";
      openButton.setAttribute("aria-label", `View details for ${project.title}`);
      openButton.addEventListener("click", () => openProjectDialog(project, openButton), uiListenerOptions);
      card.append(openButton);
      projectGrid.append(card);
    });
  }
  renderProjectFilters();
  disposeCardEffects = initCardEffects();

  const timelineItems = portfolioConfig.timeline.filter(({ title, bullets }) => title && bullets?.length);
  const latestYear = Math.max(...timelineItems.map(({ year }) => Number(year)).filter(Number.isFinite));
  timelineYear.textContent = Number.isFinite(latestYear) ? String(latestYear) : "—";
  if (!timelineItems.length) {
    timelineList.append(createTextElement("li", "empty-state", "Add your milestones in config/config.js."));
  } else {
    timelineItems.forEach(({ year, title, bullets }, index) => {
      const item = document.createElement("li");
      item.className = "timeline-list__entry";
      item.style.setProperty("--timeline-index", String(index));
      item.append(
        createTextElement("span", "timeline-list__year", String(year)),
        createTextElement("h3", "timeline-list__title", title),
      );
      const bulletList = document.createElement("ul");
      bullets.forEach((bullet) => bulletList.append(createTextElement("li", "", bullet)));
      item.append(bulletList);
      timelineList.append(item);
    });
  }
  disposeTimelineReveal();
  disposeTimelineReveal = initTimelineReveal();

  commandItems = [
    ...[...document.querySelectorAll(".world-nav__links a")].map((link) => ({
      label: link.textContent.trim(),
      href: link.getAttribute("href"),
    })),
    { label: "Hire me", href: "#contact" },
    ...portfolioConfig.skills.map((skill) => ({
      label: skill.title,
      href: "#skills",
    })),
    ...portfolioConfig.projects.map((project) => ({
      label: project.title,
      project,
    })),
  ];
  renderCommandResults("");
  disposeHeadingReveal();
  disposeHeadingReveal = initHeadingReveal();
}

function updateLocalTime() {
  const now = new Date();
  localTime.dateTime = now.toISOString();
  const time = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
  }).format(now).replace(/\s/g, "");
  localTime.textContent = `LOCAL // ${time}`;
}

const abilityProfileHash = "#profile/abilities";

function renderAbilityProfile() {
  const items = portfolioConfig.abilityCard.items || [];
  const profile = document.createElement("article");
  profile.className = "ability-profile__page";
  const skillsByTitle = new Map(portfolioConfig.skills.map((skill) => [skill.title, skill]));
  const activeItems = items.map((item, index) => ({
    ...item,
    index,
    skill: skillsByTitle.get(item.skillTitle || item.title),
  }));
  abilityProfileActiveIndex = Math.min(abilityProfileActiveIndex, Math.max(items.length - 1, 0));

  const dashboard = document.createElement("div");
  dashboard.className = "ability-profile__dashboard";

  const identity = document.createElement("aside");
  identity.className = "ability-profile__identity";
  const name = createTextElement("h1", "", portfolioConfig.name);
  name.id = "ability-profile-title";
  identity.append(
    createTextElement("p", "ability-profile__eyebrow", "PLAYER PROFILE / 2026"),
    name,
    createTextElement("p", "ability-profile__tagline", portfolioConfig.tagline),
  );
  const meta = document.createElement("dl");
  meta.className = "ability-profile__meta";
  [
    ["AGE", String(portfolioConfig.age)],
    ["EXPERIENCE", portfolioConfig.experienceLevel],
  ].forEach(([label, value]) => {
    const item = document.createElement("div");
    item.append(createTextElement("dt", "", label), createTextElement("dd", "", value));
    meta.append(item);
  });
  identity.append(meta);

  const focusHeading = document.createElement("header");
  focusHeading.className = "ability-profile__focus-heading";
  focusHeading.append(
    createTextElement("p", "ability-profile__eyebrow", "FOCUS AREAS"),
    createTextElement("span", "", `${String(items.length).padStart(2, "0")} / ACTIVE PRACTICE`),
  );
  identity.append(focusHeading);

  const focusList = document.createElement("div");
  focusList.className = "ability-profile__focus-list";
  activeItems.forEach(({ title, index, skill }) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ability-profile__focus-select";
    button.dataset.abilityIndex = String(index);
    button.setAttribute("aria-pressed", String(index === abilityProfileActiveIndex));
    button.style.setProperty("--profile-accent", skill?.color || "#91e8b3");
    button.append(
      createTextElement("span", "ability-profile__skill-icon", skill?.icon || String(index + 1).padStart(2, "0")),
      createTextElement("span", "ability-profile__focus-name", title),
      createTextElement("span", "ability-profile__focus-index", `0${index + 1}`),
    );
    button.addEventListener("click", () => setAbilityProfileSelection(index), uiListenerOptions);
    focusList.append(button);
  });
  identity.append(focusList);

  const portrait = document.createElement("figure");
  portrait.className = "ability-profile__portrait";
  const portraitUrl = safeWebUrl(portfolioConfig.photoUrl, true);
  if (portraitUrl) {
    const image = document.createElement("img");
    image.src = portraitUrl;
    image.alt = `Portrait of ${portfolioConfig.name}`;
    image.loading = "lazy";
    image.decoding = "async";
    portrait.append(image);
  }
  const portraitGlow = document.createElement("span");
  portraitGlow.className = "ability-profile__portrait-glow";
  portraitGlow.setAttribute("aria-hidden", "true");
  const portraitInfo = document.createElement("figcaption");
  portraitInfo.className = "ability-profile__portrait-info";
  portraitInfo.append(
    createTextElement("span", "ability-profile__portrait-note", "FOUR WORLDS / ONE PRACTICE"),
    createTextElement("strong", "ability-profile__selected-name", ""),
    createTextElement("span", "ability-profile__selected-description", ""),
  );
  portrait.append(
    portraitGlow,
    portraitInfo,
  );

  const practice = document.createElement("section");
  practice.className = "ability-profile__practice";
  practice.setAttribute("aria-labelledby", "ability-profile-capabilities");
  const practiceHeading = document.createElement("header");
  practiceHeading.className = "ability-profile__practice-heading";
  practiceHeading.append(
    createTextElement("p", "ability-profile__eyebrow", "SKILL PROFILE / 04"),
    createTextElement("h2", "", "CAPABILITIES"),
  );
  practiceHeading.querySelector("h2").id = "ability-profile-capabilities";
  practice.append(practiceHeading);

  const entries = document.createElement("div");
  entries.className = "ability-profile__practice-list";
  activeItems.forEach(({ title, detail, index, skill }) => {
    const entry = document.createElement("article");
    entry.className = "ability-profile__practice-entry";
    entry.style.setProperty("--profile-accent", skill?.color || "#91e8b3");
    const entryHeading = document.createElement("header");
    entryHeading.className = "ability-profile__practice-entry-heading";
    const selectButton = document.createElement("button");
    selectButton.type = "button";
    selectButton.className = "ability-profile__practice-select";
    selectButton.dataset.abilityIndex = String(index);
    selectButton.setAttribute("aria-pressed", String(index === abilityProfileActiveIndex));
    selectButton.append(
      createTextElement("span", "ability-profile__entry-index", `0${index + 1}`),
      createTextElement("h3", "", title),
      createTextElement("span", "ability-profile__entry-state", "SELECT"),
    );
    entryHeading.append(selectButton);
    const details = document.createElement("div");
    details.className = "ability-profile__practice-details";
    details.append(createTextElement("p", "ability-profile__entry-description", skill?.description || detail));
    if (skill?.tags?.length) {
      const tags = document.createElement("ul");
      tags.className = "ability-profile__tags";
      skill.tags.forEach((tag) => tags.append(createTextElement("li", "", tag)));
      details.append(tags);
    }
    entry.append(entryHeading, details);
    selectButton.addEventListener("click", () => setAbilityProfileSelection(index), uiListenerOptions);
    entries.append(entry);
  });
  practice.append(entries);
  const skillTagCount = activeItems.reduce((total, item) => total + (item.skill?.tags?.length || 0), 0);
  const stats = document.createElement("dl");
  stats.className = "ability-profile__stats";
  [
    ["AGE", portfolioConfig.age],
    ["FOCUS AREAS", items.length],
    ["SKILL TAGS", skillTagCount],
  ].forEach(([label, count]) => {
    const stat = document.createElement("div");
    const value = createTextElement("dd", "", "0");
    value.dataset.countTarget = String(count);
    value.dataset.countPadding = label === "FOCUS AREAS" ? "2" : "0";
    stat.append(createTextElement("dt", "", label), value);
    stats.append(stat);
  });
  practice.append(stats);

  dashboard.append(identity, portrait, practice);
  profile.append(dashboard);

  abilityProfileContent.replaceChildren(profile);
  setAbilityProfileSelection(abilityProfileActiveIndex);
}

function setAbilityProfileSelection(index) {
  const entries = portfolioConfig.abilityCard.items || [];
  if (!Number.isInteger(index) || index < 0 || index >= entries.length) return;
  abilityProfileActiveIndex = index;
  const item = entries[index];
  const skill = portfolioConfig.skills.find((entry) => entry.title === (item.skillTitle || item.title));
  abilityProfileContent.querySelectorAll("[data-ability-index]").forEach((element) => {
    const selected = Number(element.dataset.abilityIndex) === index;
    element.setAttribute("aria-pressed", String(selected));
    if (element.classList.contains("ability-profile__practice-select")) {
      element.closest(".ability-profile__practice-entry")?.classList.toggle("is-selected", selected);
    } else {
      element.classList.toggle("is-selected", selected);
    }
  });
  const selectedName = abilityProfileContent.querySelector(".ability-profile__selected-name");
  const selectedDescription = abilityProfileContent.querySelector(".ability-profile__selected-description");
  selectedName.textContent = item.title;
  selectedDescription.textContent = skill?.description || item.detail;
  abilityProfileContent.style.setProperty("--profile-active-accent", skill?.color || "#91e8b3");
}

function animateAbilityProfileStats() {
  if (abilityProfileStatsFrame) cancelAnimationFrame(abilityProfileStatsFrame);
  const counters = [...abilityProfileContent.querySelectorAll("[data-count-target]")];
  if (reduceMotionQuery.matches || !counters.length) {
    counters.forEach((counter) => {
      const target = Number(counter.dataset.countTarget);
      counter.textContent = String(target).padStart(Number(counter.dataset.countPadding) || 0, "0");
    });
    return;
  }
  const startedAt = performance.now();
  const duration = 720;
  const update = (now) => {
    const progress = Math.min((now - startedAt) / duration, 1);
    const eased = 1 - ((1 - progress) ** 3);
    counters.forEach((counter) => {
      const target = Number(counter.dataset.countTarget);
      const value = Math.round(target * eased);
      counter.textContent = String(value).padStart(Number(counter.dataset.countPadding) || 0, "0");
    });
    if (progress < 1) abilityProfileStatsFrame = requestAnimationFrame(update);
    else abilityProfileStatsFrame = undefined;
  };
  abilityProfileStatsFrame = requestAnimationFrame(update);
}

function openAbilityProfile({ pushHistory = true, returnTarget = document.activeElement } = {}) {
  if (abilityProfileDialog.open) return;
  abilityProfileReturnTarget = returnTarget instanceof HTMLElement ? returnTarget : abilityToggle;
  abilityProfilePreviousTitle = document.title;
  renderAbilityProfile();
  if (pushHistory && location.hash !== abilityProfileHash) {
    abilityProfileReturnHash = location.hash || "#home";
    const currentState = history.state && typeof history.state === "object" ? history.state : {};
    history.pushState({
      ...currentState,
      abilityProfile: true,
      abilityProfileReturnHash,
    }, "", abilityProfileHash);
  } else {
    abilityProfileReturnHash = history.state?.abilityProfileReturnHash || "#home";
  }
  lenis?.stop();
  abilityProfileDialog.showModal();
  abilityProfileShell.scrollTop = 0;
  animateAbilityProfileStats();
  document.title = `Ability profile — ${portfolioConfig.name}`;
  abilityProfileBack.focus({ preventScroll: true });
}

function closeAbilityProfile({ fromHistory = false } = {}) {
  if (!abilityProfileDialog.open) return;
  if (!fromHistory && location.hash === abilityProfileHash && history.state?.abilityProfile) {
    history.back();
    return;
  }
  if (abilityProfileStatsFrame) {
    cancelAnimationFrame(abilityProfileStatsFrame);
    abilityProfileStatsFrame = undefined;
  }
  if (!fromHistory && location.hash === abilityProfileHash) {
    history.replaceState(history.state, "", abilityProfileReturnHash);
  }
  document.title = abilityProfilePreviousTitle;
  lenis?.start();
  abilityProfileDialog.close();
}

function onAbilityProfileHistoryChange() {
  if (location.hash === abilityProfileHash) {
    if (!abilityProfileDialog.open) {
      openAbilityProfile({ pushHistory: false, returnTarget: abilityToggle });
    }
    return;
  }
  if (abilityProfileDialog.open) closeAbilityProfile({ fromHistory: true });
}

function initActiveNavigation() {
  if (!("IntersectionObserver" in window)) return () => {};
  const links = [...document.querySelectorAll(".world-nav__links a")];
  const targets = links
    .map((link) => ({ link, target: document.querySelector(link.getAttribute("href")) }))
    .filter(({ target }) => target);
  const doorsSection = document.querySelector("#doors");
  const visibleTargets = new Map();
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => visibleTargets.set(entry.target, entry));
    const doorsBounds = doorsSection.getBoundingClientRect();
    const syncHash = (target) => {
      if (
        location.hash === abilityProfileHash ||
        location.hash.startsWith("#collection/") ||
        location.hash.startsWith("#world/")
      ) return;
      const nextHash = `#${target.id}`;
      if (location.hash !== nextHash) history.replaceState(history.state, "", nextHash);
    };
    if (doorsBounds.top < window.innerHeight && doorsBounds.bottom > 0) {
      links.forEach((link) => link.removeAttribute("aria-current"));
      syncHash(doorsSection);
      return;
    }
    const active = targets
      .map(({ link, target }) => ({ link, entry: visibleTargets.get(target) }))
      .filter(({ entry }) => entry?.isIntersecting)
      .sort((a, b) => b.entry.intersectionRatio - a.entry.intersectionRatio)[0];
    if (!active) {
      links.forEach((link) => link.removeAttribute("aria-current"));
      return;
    }
    links.forEach((link) => {
      if (link === active.link) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
    syncHash(active.entry.target);
  }, {
    threshold: [0, 0.15, 0.35, 0.6, 1],
  });
  targets.forEach(({ target }) => observer.observe(target));
  observer.observe(doorsSection);
  return () => observer.disconnect();
}

function startHeroAndNavigation({ animateHero = true } = {}) {
  if (experienceStarted) return;
  experienceStarted = true;
  if (animateHero) {
    disposeHeroExperience = initHeroExperience({
      hero: document.querySelector("#home"),
      config: portfolioConfig,
      gsap,
      ScrollTrigger,
      reducedMotion: reduceMotionQuery.matches || document.body.classList.contains("reduce-motion"),
    });
    sceneManager.register("PORTFOLIO", disposeHeroExperience);
  }
  disposeActiveNavigation = initActiveNavigation();
  updateLocalTime();
  localClockTimer = window.setInterval(updateLocalTime, 1000);
}

function initHeadingReveal() {
  const headings = [...document.querySelectorAll(".section-heading h2:not(#timeline-title)")];
  if (!("IntersectionObserver" in window)) return () => {};
  const timers = new Map();
  headings.forEach((heading) => {
    heading.dataset.originalText ||= heading.textContent;
  });
  const finishHeading = (heading) => {
    const timer = timers.get(heading);
    if (timer) {
      window.clearInterval(timer.interval);
      window.clearTimeout(timer.timeout);
      timers.delete(heading);
    }
    heading.textContent = heading.dataset.originalText;
  };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (!isIntersecting || target.dataset.decoded === "true") return;
      target.dataset.decoded = "true";
      observer.unobserve(target);
      const original = target.dataset.originalText;
      if (document.body.classList.contains("reduce-motion")) {
        finishHeading(target);
        return;
      }
      const glyphs = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      const totalSteps = 12;
      let step = 0;
      const interval = window.setInterval(() => {
        step += 1;
        const resolved = Math.floor((step / totalSteps) * original.length);
        target.textContent = [...original]
          .map((character, index) => {
            if (character === " " || /[^a-z0-9]/i.test(character) || index < resolved) return character;
            return glyphs[Math.floor(Math.random() * glyphs.length)];
          })
          .join("");
        if (step >= totalSteps) finishHeading(target);
      }, 35);
      const timeout = window.setTimeout(() => finishHeading(target), 900);
      timers.set(target, { interval, timeout });
    });
  }, { threshold: 0.4 });
  headings.forEach((heading) => observer.observe(heading));
  return () => {
    observer.disconnect();
    headings.forEach(finishHeading);
  };
}

function initTimelineReveal() {
  const entries = [...timelineList.querySelectorAll(".timeline-list__entry")];
  if (!entries.length) return () => {};

  if (
    document.body.classList.contains("reduce-motion") ||
    !("IntersectionObserver" in window)
  ) {
    entries.forEach((entry) => entry.classList.add("is-visible"));
    return () => entries.forEach((entry) => entry.classList.remove("is-visible"));
  }

  const syncVisibleEntries = () => {
    const revealTop = window.innerHeight * 0.08;
    const revealBottom = window.innerHeight * 0.9;
    entries.forEach((entry) => {
      const bounds = entry.getBoundingClientRect();
      entry.classList.toggle("is-visible", bounds.bottom > revealTop && bounds.top < revealBottom);
    });
  };
  window.addEventListener("scroll", syncVisibleEntries, { passive: true });
  const observer = "IntersectionObserver" in window
    ? new IntersectionObserver(syncVisibleEntries, {
        rootMargin: "-8% 0px -10% 0px",
        threshold: 0.12,
      })
    : undefined;
  observer?.observe(timelineList);
  syncVisibleEntries();
  return () => {
    window.removeEventListener("scroll", syncVisibleEntries);
    observer?.disconnect();
    entries.forEach((entry) => entry.classList.remove("is-visible"));
  };
}

function openProjectDialog(project, returnTarget = document.activeElement) {
  const projectIndex = portfolioConfig.projects.indexOf(project);
  const cardButton = projectGrid.querySelector(`[data-project-index="${projectIndex}"] .project-open`);
  projectDialogReturnTarget = returnTarget instanceof HTMLElement && !commandDialog.contains(returnTarget)
    ? returnTarget
    : cardButton;

  const detail = document.createElement("article");
  detail.className = "project-detail";

  const hero = document.createElement("header");
  hero.className = "project-detail__hero";
  const intro = document.createElement("div");
  intro.className = "project-detail__intro";
  const projectTitle = createTextElement("h2", "", project.title);
  projectTitle.id = "project-dialog-title";
  intro.append(
    createTextElement(
      "p",
      "section-kicker",
      `PROJECT FILE / ${String(Math.max(projectIndex, 0) + 1).padStart(2, "0")}`,
    ),
    createTextElement("p", "project-card__status", project.status),
    projectTitle,
    createTextElement("p", "project-detail__summary", project.problem),
  );
  hero.append(intro, renderProjectVisual(project, Math.max(projectIndex, 0)));
  detail.append(hero);

  const sections = document.createElement("div");
  sections.className = "project-detail__sections";
  [
    ["solution", "Approach"],
    ["result", "Progress & notes"],
  ].forEach(([key, title]) => {
    if (!project[key]) return;
    const section = document.createElement("section");
    section.append(
      createTextElement("h3", "", title),
      createTextElement("p", "", project[key]),
    );
    sections.append(section);
  });
  if (sections.children.length) detail.append(sections);

  const footer = document.createElement("footer");
  footer.className = "project-detail__footer";
  const stack = document.createElement("ul");
  stack.className = "project-detail__stack";
  (project.stack || []).forEach((item) => stack.append(createTextElement("li", "", item)));
  if (stack.children.length) {
    const stackSection = document.createElement("section");
    stackSection.append(createTextElement("h3", "", "Technology"), stack);
    footer.append(stackSection);
  }

  const links = document.createElement("div");
  links.className = "project-detail__links";
  [
    [project.link, "View project"],
    [project.github, "GitHub repository"],
  ].forEach(([url, label]) => {
    const safeUrl = safeWebUrl(url);
    if (!safeUrl) return;
    const link = createTextElement("a", "project-detail__link", `${label} ↗`);
    link.href = safeUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    links.append(link);
  });
  if (links.children.length) footer.append(links);
  else footer.append(createTextElement("p", "project-detail__availability", "No public project link is configured yet."));
  detail.append(footer);

  projectDialogContent.replaceChildren(detail);
  if (!projectDialog.open) {
    projectDialog.showModal();
    projectDialogBack.focus({ preventScroll: true });
  }
}

function renderCommandResults(query) {
  const filtered = commandItems.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()));
  commandResults.replaceChildren();
  commandIndex = Math.min(commandIndex, Math.max(filtered.length - 1, 0));
  filtered.forEach((item, index) => {
    const button = createTextElement("button", "command-result", item.label);
    button.type = "button";
    button.setAttribute("aria-selected", String(index === commandIndex));
    button.addEventListener("click", () => {
      commandDialog.close();
      if (item.project) {
        const projectIndex = portfolioConfig.projects.indexOf(item.project);
        const returnTarget = projectGrid.querySelector(`[data-project-index="${projectIndex}"] .project-open`);
        openProjectDialog(item.project, returnTarget);
      } else {
        navigateTo(item.href);
      }
    });
    commandResults.append(button);
  });
}

function navigateTo(href) {
  const destination = document.querySelector(href);
  if (!destination) return;
  if (lenis) lenis.scrollTo(destination, { duration: 0.9 });
  else destination.scrollIntoView({ behavior: document.body.classList.contains("reduce-motion") ? "auto" : "smooth" });
}

function collectionSlug(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function renderSkillWorld(skill, identity) {
  const { world } = skill;
  const { showcase } = world;
  const showcaseType = identity?.showcaseType || showcase.type;
  const showcaseItems = identity?.showcaseItems || showcase.items;
  disposeWorldVisual();
  disposeWorldVisual = () => {};
  collectionView.style.setProperty("--world-accent", identity?.accent || world.accent);
  collectionView.dataset.worldType = showcaseType;
  if (identity) collectionView.dataset.identity = identity.id;
  else delete collectionView.dataset.identity;
  skillWorldKicker.textContent = identity?.showcaseStatus || showcase.status;
  skillWorldTitle.textContent = identity?.showcaseTitle || showcase.title;
  skillWorldCaption.textContent = identity?.showcaseCaption || showcase.caption;
  skillWorldTags.replaceChildren();
  (identity?.tags || skill.tags).forEach((tag) => skillWorldTags.append(createTextElement("li", "", tag)));
  skillWorldProcess.replaceChildren();
  const isPersonalTimeline = identity?.id === "me";
  skillWorldProcess.classList.toggle("skill-world__steps--timeline", isPersonalTimeline);
  if (isPersonalTimeline) {
    portfolioConfig.timeline.forEach(({ year, title, bullets }) => {
      const entry = document.createElement("li");
      entry.className = "skill-world__timeline-entry";
      entry.append(createTextElement("span", "skill-world__timeline-year", String(year)));
      const milestone = document.createElement("div");
      milestone.append(createTextElement("h3", "skill-world__timeline-title", title));
      const notes = document.createElement("ul");
      notes.className = "skill-world__timeline-notes";
      bullets.forEach((bullet) => notes.append(createTextElement("li", "", bullet)));
      milestone.append(notes);
      entry.append(milestone);
      skillWorldProcess.append(entry);
    });
  } else {
    (identity?.process || world.process).forEach((step) => {
      skillWorldProcess.append(createTextElement("li", "", step));
    });
  }

  skillWorldVisual.className = `skill-world__visual skill-world__visual--${showcaseType}`;
  skillWorldVisual.setAttribute(
    "aria-label",
    `${identity?.showcaseTitle || showcase.title}: ${identity?.showcaseCaption || showcase.caption}`,
  );
  skillWorldVisual.replaceChildren();

  const diagramLabel = document.createElement("div");
  diagramLabel.className = "skill-world__diagram-label";
  diagramLabel.append(
    createTextElement("span", "", showcaseItems[0]),
    createTextElement("span", "", identity?.showcaseStatus || showcase.status),
  );
  skillWorldVisual.append(diagramLabel);

  if (showcaseType === "architecture") {
    const architecture = document.createElement("div");
    architecture.className = "skill-world__architecture";
    showcaseItems.forEach((item, index) => {
      const layer = document.createElement("div");
      layer.className = "skill-world__layer";
      layer.append(
        createTextElement("span", "skill-world__layer-index", String(index + 1).padStart(2, "0")),
        createTextElement("span", "", item),
      );
      architecture.append(layer);
    });
    skillWorldVisual.append(architecture);
  } else if (showcaseType === "candlesticks") {
    const chart = document.createElement("canvas");
    chart.width = 680;
    chart.height = 260;
    chart.className = "skill-world__chart";
    chart.setAttribute("role", "img");
    chart.setAttribute("aria-label", identity?.showcaseCaption || showcase.caption);
    disposeWorldVisual = createCandlestickVisual(chart, false, {
      up: identity?.accent || world.accent,
      down: "#66717d",
    });
    skillWorldVisual.append(chart);
  } else if (showcaseType === "network") {
    const network = document.createElement("div");
    network.className = "skill-world__network";
    network.setAttribute("role", "list");
    showcaseItems.forEach((item) => {
      const node = createTextElement("div", "skill-world__node", item);
      node.setAttribute("role", "listitem");
      network.append(node);
    });
    skillWorldVisual.append(network);
  } else if (showcaseType === "session") {
    const session = document.createElement("div");
    session.className = "skill-world__session";
    session.setAttribute("aria-label", showcase.caption);
    const bars = document.createElement("div");
    bars.className = "skill-world__bars";
    bars.setAttribute("aria-hidden", "true");
    Array.from({ length: 28 }, (_, index) => {
      const bar = document.createElement("span");
      bar.className = "skill-world__bar";
      bar.style.height = `${30 + ((index * 37 + (index % 5) * 11) % 70)}%`;
      bars.append(bar);
    });
    const items = document.createElement("div");
    items.className = "skill-world__session-items";
    showcaseItems.forEach((item) => items.append(createTextElement("span", "", item)));
    session.append(bars, items);
    skillWorldVisual.append(session);
  } else if (showcaseType === "timeline") {
    const timeline = document.createElement("ol");
    timeline.className = "skill-world__timeline-preview";
    portfolioConfig.timeline.slice(0, 4).forEach(({ year, title }) => {
      const milestone = document.createElement("li");
      milestone.append(
        createTextElement("span", "skill-world__timeline-year", String(year)),
        createTextElement("strong", "", title),
      );
      timeline.append(milestone);
    });
    skillWorldVisual.append(timeline);
  } else {
    throw new Error(`Unknown skill world showcase type: ${showcaseType}`);
  }
}

function formatMediaDuration(duration) {
  if (!Number.isFinite(duration) || duration < 0) return "";
  const totalSeconds = Math.round(duration);
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

function syncCollectionPlayerToggle() {
  const isPlaying = !collectionPlayerVideo.paused;
  collectionPlayerToggle.textContent = isPlaying ? "Pause video" : "Play video";
  collectionPlayerToggle.setAttribute("aria-pressed", String(isPlaying));
}

function showCollectionPlayerItem(index) {
  const item = activeCollectionMedia[index];
  if (!item) return;
  const source = safeWebUrl(item.src, true);
  if (!source) {
    console.error(`Invalid media URL in the collection archive for "${item.id}".`, item.src);
    collectionPlayerStatus.textContent = "This video has an invalid source.";
    return;
  }

  activeCollectionMediaIndex = index;
  collectionPlayerVideo.pause();
  collectionPlayerVideo.onerror = () => {
    console.error(`Could not load collection video: ${source}`);
    collectionPlayerStatus.textContent = "This video could not be loaded.";
  };
  collectionPlayerVideo.src = source;
  collectionPlayerVideo.poster = safeWebUrl(item.thumbnail, true) || "";
  collectionPlayerVideo.load();
  collectionPlayerTitle.textContent = item.title || "Archive item";
  collectionPlayerDescription.textContent = item.description || "";
  collectionPlayerPosition.textContent =
    `${String(index + 1).padStart(2, "0")} / ${String(activeCollectionMedia.length).padStart(2, "0")}`;
  collectionPlayerPrevious.disabled = index === 0;
  collectionPlayerNext.disabled = index === activeCollectionMedia.length - 1;
  collectionPlayerStatus.textContent = "";
  syncCollectionPlayerToggle();
}

function openCollectionPlayer(items, index, returnTarget) {
  activeCollectionMedia = items;
  collectionPlayerReturnTarget = returnTarget;
  if (!collectionPlayerDialog.open) collectionPlayerDialog.showModal();
  showCollectionPlayerItem(index);
  collectionPlayerClose.focus({ preventScroll: true });
}

function renderCollectionMediaCard(item, index, items) {
  const card = document.createElement("article");
  card.className = "collection-media-card";
  const preview = document.createElement("div");
  preview.className = "collection-media-card__preview";
  const title = item.title || "Archive item";

  if (item.type === "image") {
    const image = document.createElement("img");
    image.src = safeWebUrl(item.src, true);
    image.alt = item.alt || title;
    image.loading = "lazy";
    image.decoding = "async";
    preview.append(image);
  } else {
    const thumbnailUrl = safeWebUrl(item.thumbnail, true);
    if (thumbnailUrl) {
      const thumbnail = document.createElement("img");
      thumbnail.className = "collection-media-card__thumbnail";
      thumbnail.src = thumbnailUrl;
      thumbnail.alt = `Preview frame for ${title}`;
      thumbnail.loading = "lazy";
      thumbnail.decoding = "async";
      preview.append(thumbnail);
    } else {
      const placeholder = createTextElement("span", "collection-media-card__placeholder", "PLAY TO LOAD FRAME");
      placeholder.setAttribute("aria-hidden", "true");
      preview.append(placeholder);
    }
    const playButton = document.createElement("button");
    playButton.type = "button";
    playButton.className = "collection-media-card__play";
    playButton.setAttribute("aria-label", `Open video ${title}`);
    playButton.append(
      createTextElement("span", "collection-media-card__play-icon", "▶"),
      createTextElement("span", "", "Open video"),
    );
    playButton.addEventListener("click", () => {
      openCollectionPlayer(items, index, playButton);
    }, { signal: uiAbortController.signal });

    preview.append(createTextElement("span", "collection-media-card__index", String(index + 1).padStart(2, "0")), playButton);
  }

  const cardTitle = createTextElement("h3", "collection-media-card__title", title);
  card.append(preview, cardTitle);
  const metadata = document.createElement("p");
  metadata.className = "collection-media-card__meta";
  metadata.append(
    createTextElement("span", "", String(item.category || "archive").replaceAll("-", " ")),
  );
  const duration = formatMediaDuration(item.duration);
  if (duration) metadata.append(createTextElement("span", "", duration));
  if (item.date) metadata.append(createTextElement("time", "", item.date));
  card.append(metadata);
  if (item.description) {
    card.append(createTextElement("p", "collection-media-card__description", item.description));
  }
  if (item.originalFilename) {
    const sourceDetails = document.createElement("details");
    sourceDetails.className = "collection-media-card__source";
    sourceDetails.append(createTextElement("summary", "", "Original filename"));
    sourceDetails.append(createTextElement("code", "", item.originalFilename));
    card.append(sourceDetails);
  }
  return card;
}

function renderCollectionMedia(skill, identity) {
  const media = skill.collection?.media || [];
  const unsorted = videoArchive.unsorted;
  const categories = [...new Set(media.map((item) => item.category).filter(Boolean))];
  const filters = [
    { id: "all", label: `${identity?.title || "COLLECTION"} (${media.length})`, items: media },
  ];
  if (categories.length > 1) {
    categories.forEach((category) => {
      const items = media.filter((item) => item.category === category);
      filters.push({
        id: category,
        label: `${category.replaceAll("-", " ")} (${items.length})`,
        items,
      });
    });
  }
  if (unsorted.length) {
    filters.push({ id: "unsorted", label: `UNSORTED (${unsorted.length})`, items: unsorted });
  }

  collectionFilters.replaceChildren();
  collectionGrid.replaceChildren();
  collectionFilters.hidden = filters.length < 2;
  const renderItems = (items) => {
    collectionGrid.querySelectorAll("video").forEach((video) => video.pause());
    collectionGrid.replaceChildren();
    collectionCount.textContent = `${items.length} ${items.length === 1 ? "item" : "items"}`;
    if (!items.length) {
      const emptyMessage = identity?.id === "me"
        ? "No videos could be confidently identified as personal. Clips with unclear subjects are available in Unsorted."
        : "No videos could be confidently identified for this archive. Clips with unclear subjects are available in Unsorted.";
      collectionGrid.append(createTextElement("p", "collection-grid__empty", emptyMessage));
      return;
    }
    items.forEach((item, index) => {
      collectionGrid.append(renderCollectionMediaCard(item, index, items));
    });
  };

  filters.forEach((filter, index) => {
    const button = createTextElement("button", "collection-view__filter", filter.label);
    button.type = "button";
    button.setAttribute("aria-pressed", String(index === 0));
    button.addEventListener("click", () => {
      collectionFilters.querySelectorAll("button").forEach((filterButton) => {
        filterButton.setAttribute("aria-pressed", String(filterButton === button));
      });
      renderItems(filter.items);
    }, { signal: uiAbortController.signal });
    collectionFilters.append(button);
  });
  renderItems(media);
}

function renderCollection(skill, identity) {
  if (!skill.world) throw new Error(`Missing skill world content for "${skill.title}".`);
  renderSkillWorld(skill, identity);
  document.querySelector("#skill-world-process-title").textContent =
    identity?.processTitle || "Process";
  const processSection = skillWorldProcess.closest(".skill-world__process");
  processSection.querySelector(".skill-world__direction")?.remove();
  if (identity?.directionItems?.length) {
    const direction = document.createElement("aside");
    direction.className = "skill-world__direction";
    direction.setAttribute("aria-labelledby", "skill-world-direction-title");
    const directionTitle = createTextElement("h3", "", identity.directionTitle || "Looking ahead");
    directionTitle.id = "skill-world-direction-title";
    direction.append(directionTitle);
    const items = document.createElement("ul");
    identity.directionItems.forEach((item) => items.append(createTextElement("li", "", item)));
    direction.append(items);
    processSection.append(direction);
  }
  collectionKicker.textContent = identity
    ? `WORLD ${identity.number} / ${identity.title}`
    : `SKILL WORLD / ${skill.title.toUpperCase()}`;
  collectionTitle.textContent = identity?.title || skill.world.title;
  collectionDescription.textContent = identity?.description || skill.world.subtitle;
  collectionArchiveTotal.textContent = String(skill.collection?.media?.length || 0);
  collectionArchivePortrait.hidden = identity?.id !== "me";
  collectionPlayerDialog.style.setProperty(
    "--world-accent",
    identity?.accent || skill.world.accent || "#c3a17f",
  );
  collectionMedia.hidden = false;
  renderCollectionMedia(skill, identity);
  collectionProjectList.replaceChildren();

  const skillCategory = skill.title.startsWith("Full Stack")
    ? "full stack"
    : skill.title.startsWith("Forex")
      ? "forex"
      : skill.title.startsWith("Futures")
        ? "futures"
        : skill.title.startsWith("Ethical Hacking")
          ? "ethical hacking"
          : "";
  const relatedProjects = identity?.id === "me" || !skillCategory
    ? []
    : portfolioConfig.projects.filter(({ category }) => category.toLowerCase().includes(skillCategory));
  collectionProjects.hidden = relatedProjects.length === 0;
  relatedProjects.forEach((project, index) => {
    const card = document.createElement("article");
    card.className = "collection-project-card";
    card.append(renderProjectPreview(project, index));
    card.append(
      createTextElement("p", "collection-project-card__category", project.category),
      createTextElement("h3", "", project.title),
      createTextElement("p", "collection-project-card__description", project.problem),
    );
    const button = createTextElement("button", "collection-project-card__link", "View case study ↗");
    button.type = "button";
    button.addEventListener("click", () => openProjectDialog(project), {
      signal: uiAbortController.signal,
    });
    card.append(button);
    collectionProjectList.append(card);
  });
}

function transitionCollection(entering, onReveal, doorEntry = false) {
  collectionTransitionTimeline?.kill();
  collectionTransitionTimeline = undefined;
  if (!doorEntry) gsap?.set(revealFlash, { visibility: "hidden", opacity: 0 });

  if (
    !gsap ||
    document.hidden ||
    reduceMotionQuery.matches ||
    document.body.classList.contains("reduce-motion")
  ) {
    onReveal();
    return;
  }

  const shell = collectionView.querySelector(".collection-view__shell");
  const revealTargets = [
    ...(collectionView.querySelector(".video-wall")
      ? [collectionView.querySelector(".video-wall")]
      : []),
    collectionView.querySelector(".collection-view__heading"),
    collectionView.querySelector(".collection-archive-intro"),
    collectionView.querySelector(".skill-world"),
    collectionView.querySelector(".skill-world__process"),
    collectionView.querySelector(".collection-view__media"),
    collectionView.querySelector(".collection-view__projects"),
  ].filter((element) => element && !element.hidden);

  if (entering) {
    onReveal();
    if (doorEntry) return;
    gsap.set(revealTargets, { opacity: 0, y: 18, filter: "blur(5px)" });
    collectionTransitionTimeline = gsap.timeline({
      onComplete() {
        gsap.set(revealTargets, { clearProps: "opacity,transform,filter" });
        collectionTransitionTimeline = undefined;
      },
    });
    collectionTransitionTimeline
      .to(
        revealTargets,
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.64,
          stagger: 0.075,
          ease: "power3.out",
        },
        0.1,
      );
    return;
  }

  collectionTransitionTimeline = gsap.to(shell, {
    opacity: 0,
    y: -14,
    filter: "blur(3px)",
    duration: 0.38,
    ease: "power2.in",
    onComplete() {
      gsap.set(shell, { clearProps: "opacity,transform,filter" });
      collectionTransitionTimeline = undefined;
      onReveal();
    },
  });
}

function openCollection(title, { pushHistory = true, identityId } = {}) {
  if (!collectionView.hidden) return;
  const identity = doorIdentities.find((entry) => entry.id === identityId);
  const wallDoor = portfolioConfig.doors?.find((entry) => entry.id === identityId);
  const skillTitle = identity?.skillTitle || title;
  const baseSkill = portfolioConfig.skills.find((entry) => entry.title === skillTitle) ||
    (identity?.id === "me"
      ? portfolioConfig.skills.find((entry) => entry.title === "Full Stack Development")
      : undefined);
  const skill = identity?.id === "me" && baseSkill
    ? {
        ...baseSkill,
        title: "Me",
        tags: identity.tags,
        world: {
          ...baseSkill.world,
          title: identity.title,
          subtitle: identity.description,
          accent: identity.accent,
          showcase: {
            type: "architecture",
            title: "A path still unfolding",
            caption: "Curiosity, practice, perspective, and ambition — one step at a time.",
            status: "IN PROGRESS",
            items: ["Curiosity", "Practice", "Perspective", "Possibility"],
          },
        },
        collection: {
          title: "Personal archive",
          description: "Personal clips are included only when their content can be confidently identified.",
          media: videoArchive.me,
        },
      }
    : baseSkill;
  if (!skill) {
    console.error(`Could not find a configured collection for "${skillTitle}".`);
    return;
  }

  collectionPreviousTitle = document.title;
  collectionReturnHash = location.hash.startsWith("#collection/")
    ? "#doors"
    : location.hash || "#doors";
  if (identity && wallDoor) {
    disposeWorldVisual();
    disposeWorldVisual = () => {};
    collectionView.dataset.identity = identity.id;
    collectionView.style.setProperty("--world-accent", identity.accent);
    collectionKicker.textContent = `WORLD ${identity.number} / ${identity.title}`;
    collectionTitle.textContent = identity.title;
    collectionDescription.textContent = identity.description;
    disposeInfiniteWall();
    disposeInfiniteWall = () => {};
    resizeInfiniteWall = () => {};
    const wall = initInfiniteWall({
      root: collectionView,
      door: wallDoor,
      gsap,
      reducedMotion: reduceMotionQuery.matches || document.body.classList.contains("reduce-motion"),
      onBack: () => closeCollection(),
      onOpenVideo: (items, index, returnTarget) => {
        openCollectionPlayer(items, index, returnTarget);
        collectionPlayerVideo.muted = false;
        collectionPlayerVideo.play().catch((error) => {
          if (error.name === "AbortError") return;
          console.error("Could not start the selected wall video.", error);
          collectionPlayerStatus.textContent = "Playback could not start. Use the play control to try again.";
        });
      },
      playerDialog: collectionPlayerDialog,
    });
    disposeInfiniteWall = wall.dispose;
    resizeInfiniteWall = wall.resize;
  } else {
    collectionView.classList.remove("is-video-wall");
    renderCollection(skill, identity);
  }
  collectionView.scrollTop = 0;
  const navigationBottom = worldNavigation.getBoundingClientRect().bottom;
  collectionView.style.setProperty(
    "--collection-nav-clearance",
    `${Math.ceil(navigationBottom + 20)}px`,
  );
  collectionView.hidden = false;
  resizeInfiniteWall();
  collectionView.setAttribute("inert", "");
  collectionView.style.visibility = "hidden";
  document.body.classList.add("is-collection-open");
  setActiveSceneState("WALL");
  lenis?.stop();
  stageTwo.setAttribute("aria-hidden", "true");
  stageTwo.setAttribute("inert", "");
  worldUi.setAttribute("aria-hidden", "true");
  worldUi.setAttribute("inert", "");
  document.title = `${collectionTitle.textContent} — ${portfolioConfig.name}`;

  if (pushHistory) {
    const slug = identity?.id || collectionSlug(title);
    history.pushState({ collection: slug }, "", `#collection/${slug}`);
    collectionHistoryEntry = true;
  } else {
    collectionHistoryEntry = false;
  }

  transitionCollection(true, () => {
    collectionView.style.removeProperty("visibility");
    collectionView.removeAttribute("inert");
    (collectionView.querySelector(".video-wall__back") || collectionBackButton)
      .focus({ preventScroll: true });
  }, Boolean(identity && fallbackDoorSelectionPending));
}

function closeCollection({ fromHistory = false } = {}) {
  if (collectionView.hidden) return;
  if (collectionPlayerDialog.open) collectionPlayerDialog.close();
  collectionTransitionTimeline?.kill();
  collectionTransitionTimeline = undefined;
  gsap?.set(revealFlash, { visibility: "hidden", opacity: 0 });

  const finishClose = () => {
    disposeInfiniteWall();
    disposeInfiniteWall = () => {};
    resizeInfiniteWall = () => {};
    disposeWorldVisual();
    disposeWorldVisual = () => {};
    collectionGrid.querySelectorAll("video").forEach((video) => video.pause());
    window.clearTimeout(fallbackDoorTransitionTimer);
    fallbackDoorTransitionTimer = undefined;
    fallbackDoorSelectionPending = false;
    doorFallback.classList.remove("is-transitioning");
    doorFallback.removeAttribute("aria-busy");
    doorFallback.querySelectorAll(".door-fallback__item").forEach((door) => {
      door.classList.remove("is-opening");
      door.disabled = false;
    });
    collectionView.hidden = true;
    collectionView.scrollTop = 0;
    collectionView.setAttribute("inert", "");
    collectionView.style.removeProperty("visibility");
    document.body.classList.remove("is-collection-open");
    lenis?.start();
    stageTwo.removeAttribute("aria-hidden");
    stageTwo.removeAttribute("inert");
    worldUi.removeAttribute("aria-hidden");
    worldUi.removeAttribute("inert");
    worldScene?.resetDoorSelection();
    document.title = collectionPreviousTitle;
    collectionHistoryEntry = false;
    if (!fromHistory && location.hash.startsWith("#collection/")) {
      history.replaceState(null, "", collectionReturnHash);
    }
    ScrollTrigger?.refresh();
    document.querySelector("#doors-title").focus({ preventScroll: true });
    navigateTo("#doors");
    setActiveSceneState("DOORS");
  };

  collectionView.setAttribute("inert", "");
  transitionCollection(false, finishClose);
}

function onCollectionHistoryChange() {
  const slug = location.hash.match(/^#collection\/([a-z0-9-]+)$/)?.[1];
  if (slug) {
    const identity = doorIdentities.find((entry) => entry.id === slug);
    if (identity && collectionView.hidden) {
      openCollection(identity.skillTitle, { pushHistory: false, identityId: identity.id });
      return;
    }
    const skill = portfolioConfig.skills.find((entry) => collectionSlug(entry.title) === slug);
    if (skill && collectionView.hidden) openCollection(skill.title, { pushHistory: false });
  } else if (!collectionView.hidden) {
    closeCollection({ fromHistory: true });
  }
}

function onProjectSelect(event) {
  const project = portfolioConfig.projects.find((item) => item.title === event.detail);
  if (project) openProjectDialog(project);
}

function setReducedMotion(enabled) {
  const reduced = enabled || reduceMotionQuery.matches;
  document.body.classList.toggle("reduce-motion", reduced);
  motionButton.setAttribute("aria-pressed", String(reduced));
  introScene?.setMotionReduced(reduced);
  visualMotionControllers.forEach((setVisualMotion) => setVisualMotion(reduced));
  disposeCardEffects();
  disposeCardEffects = initCardEffects();
  disposeHeadingReveal();
  if (!reduced) disposeHeadingReveal = initHeadingReveal();
  disposeTimelineReveal();
  disposeTimelineReveal = initTimelineReveal();
}

function disableFreeLookOnScroll() {
  if (freeLookButton.getAttribute("aria-pressed") !== "true") return;
  freeLookButton.setAttribute("aria-pressed", "false");
  introScene?.setFreeLook(false);
}

// ═══════════════════════════════════════════════════════════════
// BOOT SEQUENCE
// ═══════════════════════════════════════════════════════════════

function showWebGLFallback(error) {
  if (error) console.error("The interactive 3D scene is unavailable; showing the accessible 2D portfolio.", error);
  introSequence?.destroy();
  introSequence = undefined;
  document.body.classList.remove("portfolio-intro-active");
  worldScrollTrigger?.kill();
  worldScrollTrigger = undefined;
  if (worldScrollHandler) window.removeEventListener("scroll", worldScrollHandler);
  if (worldScrollHandler) document.removeEventListener("scroll", worldScrollHandler, true);
  worldScrollHandler = undefined;
  heroThemeObserver?.disconnect();
  heroThemeObserver = undefined;
  if (lenisTicker && gsap) gsap.ticker.remove(lenisTicker);
  lenisTicker = undefined;
  if (lenis) {
    if (lenisScrollHandler) lenis.off("scroll", lenisScrollHandler);
    lenis.destroy();
    lenis = undefined;
  }
  if (ScrollTrigger) ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  gsap?.set(revealFlash, { visibility: "hidden", opacity: 0 });
  document.body.classList.add("webgl-fallback", "has-revealed");
  stageOne.setAttribute("aria-hidden", "true");
  stageOne.setAttribute("inert", "");
  stageOne.hidden = true;
  stageTwo.removeAttribute("aria-hidden");
  stageTwo.removeAttribute("inert");
  worldUi.removeAttribute("aria-hidden");
  worldUi.removeAttribute("inert");
  revealComplete = true;
  freeLookButton.disabled = true;
  startHeroAndNavigation({ animateHero: false });
  sceneManager.setState("PORTFOLIO");
  canvas.removeEventListener("webglcontextlost", onWebGLContextLost);
  disposeHeroExperience();
  disposeActiveNavigation();
  window.clearInterval(localClockTimer);
  experienceStarted = false;
  introScene?.dispose();
  introScene = undefined;
  worldScene = undefined;
}

function onWebGLContextLost(event) {
  event.preventDefault();
  if (!destroyed) {
    showWebGLFallback(new Error("WebGL context lost."));
  }
}

function updateWorldProgress(progress) {
  introScene?.setWorldProgress(progress);
  const doors = document.querySelector("#doors");
  if (collectionView.hidden) {
    const doorsBounds = doors.getBoundingClientRect();
    const doorsInView = doorsBounds.top < window.innerHeight && doorsBounds.bottom > 0;
    setActiveSceneState(doorsInView ? "DOORS" : "PORTFOLIO");
  }
  const scrollRange = Math.max(stageTwo.scrollHeight - window.innerHeight, 1);
  const doorsEnd = (doors.offsetTop + doors.offsetHeight - window.innerHeight) / scrollRange;
  document.body.classList.toggle("is-editorial-world", progress > doorsEnd);
  const heroBottom = document.querySelector("#home").getBoundingClientRect().bottom;
  document.body.classList.toggle("is-dark-world", heroBottom < window.innerHeight * 0.2);
  const depth = Math.round(5 + progress * 113);
  depthMeter.textContent = `DEPTH ${String(depth).padStart(3, "0")}m`;
}

function onSectionNavigation(event) {
  const link = event.target.closest('a[href^="#"]');
  if (!link || !revealComplete) return;
  event.preventDefault();
  navigateTo(link.getAttribute("href"));
}

worldUi.addEventListener("click", onSectionNavigation, uiListenerOptions);
stageTwo.addEventListener("click", onSectionNavigation, uiListenerOptions);
commandButton.addEventListener("click", () => {
  if (!commandDialog.open) commandDialog.showModal();
  commandInput.value = "";
  renderCommandResults("");
  commandInput.focus();
}, uiListenerOptions);
freeLookButton.addEventListener("click", () => {
  if (!introScene) return;
  const enabled = freeLookButton.getAttribute("aria-pressed") !== "true";
  freeLookButton.setAttribute("aria-pressed", String(enabled));
  introScene.setFreeLook(enabled);
}, uiListenerOptions);
commandInput.addEventListener("input", () => {
  commandIndex = 0;
  renderCommandResults(commandInput.value);
}, uiListenerOptions);
commandInput.addEventListener("keydown", (event) => {
  const resultCount = commandResults.children.length;
  if (!resultCount) return;
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    commandIndex = (commandIndex + (event.key === "ArrowDown" ? 1 : -1) + resultCount) % resultCount;
    renderCommandResults(commandInput.value);
  } else if (event.key === "Enter" && resultCount > 0) {
    event.preventDefault();
    commandResults.children[commandIndex].click();
  }
}, uiListenerOptions);
collectionBackButton.addEventListener("click", () => {
  if (collectionHistoryEntry && location.hash.startsWith("#collection/")) history.back();
  else closeCollection();
}, uiListenerOptions);
collectionPlayerToggle.addEventListener("click", async () => {
  if (!collectionPlayerVideo.paused) {
    collectionPlayerVideo.pause();
    return;
  }
  collectionPlayerStatus.textContent = "";
  try {
    await collectionPlayerVideo.play();
  } catch (error) {
    console.error("Could not start archive video playback.", error);
    collectionPlayerStatus.textContent = "Playback could not be started. Use the video controls to try again.";
  }
}, uiListenerOptions);
collectionPlayerVideo.addEventListener("play", syncCollectionPlayerToggle, uiListenerOptions);
collectionPlayerVideo.addEventListener("pause", syncCollectionPlayerToggle, uiListenerOptions);
collectionPlayerVideo.addEventListener("ended", syncCollectionPlayerToggle, uiListenerOptions);
collectionPlayerPrevious.addEventListener("click", () => {
  showCollectionPlayerItem(activeCollectionMediaIndex - 1);
}, uiListenerOptions);
collectionPlayerNext.addEventListener("click", () => {
  showCollectionPlayerItem(activeCollectionMediaIndex + 1);
}, uiListenerOptions);
collectionPlayerFullscreen.addEventListener("click", async () => {
  if (typeof collectionPlayerVideo.requestFullscreen === "function") {
    try {
      await collectionPlayerVideo.requestFullscreen();
      return;
    } catch (error) {
      console.error("Could not open the archive video in full screen.", error);
      collectionPlayerStatus.textContent = "Full-screen playback could not be opened.";
      return;
    }
  }
  if (typeof collectionPlayerVideo.webkitEnterFullscreen === "function") {
    collectionPlayerVideo.webkitEnterFullscreen();
    return;
  }
  collectionPlayerStatus.textContent = "Full-screen playback is not supported in this browser.";
}, uiListenerOptions);
collectionPlayerClose.addEventListener("click", () => collectionPlayerDialog.close(), uiListenerOptions);
collectionPlayerDialog.addEventListener("close", () => {
  if (document.fullscreenElement === collectionPlayerVideo && typeof document.exitFullscreen === "function") {
    document.exitFullscreen().catch((error) => {
      console.error("Could not exit full-screen archive playback.", error);
    });
  }
  if (
    collectionPlayerVideo.webkitDisplayingFullscreen &&
    typeof collectionPlayerVideo.webkitExitFullscreen === "function"
  ) {
    try {
      collectionPlayerVideo.webkitExitFullscreen();
    } catch (error) {
      console.error("Could not exit full-screen archive playback.", error);
    }
  }
  collectionPlayerVideo.pause();
  collectionPlayerVideo.removeAttribute("src");
  collectionPlayerVideo.removeAttribute("poster");
  collectionPlayerVideo.load();
  activeCollectionMedia = [];
  activeCollectionMediaIndex = -1;
  if (collectionPlayerReturnTarget?.isConnected) {
    collectionPlayerReturnTarget.focus({ preventScroll: true });
  }
  collectionPlayerReturnTarget = undefined;
}, uiListenerOptions);
collectionPlayerDialog.addEventListener("click", (event) => {
  if (event.target === collectionPlayerDialog) collectionPlayerDialog.close();
}, uiListenerOptions);
window.addEventListener("popstate", onCollectionHistoryChange, uiListenerOptions);
window.addEventListener("popstate", onAbilityProfileHistoryChange, uiListenerOptions);
window.addEventListener("portfolio:door-select", (event) => {
  if (typeof event.detail === "string") {
    openCollection(event.detail);
    return;
  }
  const identity = doorIdentities.find((entry) => entry.id === event.detail?.doorId);
  if (identity) openCollection(identity.skillTitle, { identityId: identity.id });
}, uiListenerOptions);
projectDialogBack.addEventListener("click", () => projectDialog.close(), uiListenerOptions);
projectDialogClose.addEventListener("click", () => projectDialog.close(), uiListenerOptions);
projectDialog.addEventListener("close", () => {
  if (projectDialogReturnTarget?.isConnected) {
    projectDialogReturnTarget.focus();
  }
  projectDialogReturnTarget = undefined;
}, uiListenerOptions);
projectDialog.addEventListener("click", (event) => {
  if (event.target === projectDialog) projectDialog.close();
}, uiListenerOptions);
abilityProfileBack.addEventListener("click", () => closeAbilityProfile(), uiListenerOptions);
abilityProfileDialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeAbilityProfile();
}, uiListenerOptions);
abilityProfileDialog.addEventListener("close", () => {
  if (abilityProfileReturnTarget?.isConnected) {
    abilityProfileReturnTarget.focus({ preventScroll: true });
  }
  abilityProfileReturnTarget = undefined;
}, uiListenerOptions);
abilityProfileDialog.addEventListener("click", (event) => {
  if (event.target === abilityProfileDialog) closeAbilityProfile();
}, uiListenerOptions);
copyEmailButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(portfolioConfig.email.trim());
    contactToast.textContent = "Email copied to clipboard.";
  } catch (error) {
    console.error("Could not copy the contact email.", error);
    contactToast.textContent = "Could not copy automatically. Select the email address to copy it.";
  }
}, uiListenerOptions);
motionButton.addEventListener("click", () => {
  setReducedMotion(!document.body.classList.contains("reduce-motion"));
}, uiListenerOptions);
hireButton?.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  openHireModal({
    config: portfolioConfig,
    lenis,
    sceneManager,
    opener: hireButton,
  });
}, uiListenerOptions);
abilityToggle.addEventListener("click", () => openAbilityProfile(), uiListenerOptions);
homeHeroBioToggle.addEventListener("click", () => {
  const expanded = homeHeroBioToggle.getAttribute("aria-expanded") !== "true";
  homeHeroBioToggle.setAttribute("aria-expanded", String(expanded));
  homeHeroBioToggleLabel.textContent = expanded ? "Show less" : "More about me";
  homeHeroBio.classList.toggle("is-open", expanded);
  homeHeroBio.setAttribute("aria-hidden", String(!expanded));
  if (expanded) homeHeroBio.removeAttribute("inert");
  else homeHeroBio.setAttribute("inert", "");
}, uiListenerOptions);
function onGlobalKeydown(event) {
  if (event.key === "Escape") {
    if (collectionPlayerDialog.open) {
      event.preventDefault();
      collectionPlayerDialog.close();
      return;
    }
    if (abilityProfileDialog.open) {
      event.preventDefault();
      closeAbilityProfile();
      return;
    }
    if (commandDialog.open) commandDialog.close();
    if (projectDialog.open) projectDialog.close();
  }
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    commandButton.click();
  }
}
window.addEventListener("keydown", onGlobalKeydown, uiListenerOptions);
window.addEventListener("scroll", disableFreeLookOnScroll, { passive: true, signal: uiAbortController.signal });
window.addEventListener("portfolio:project-select", onProjectSelect, uiListenerOptions);
reduceMotionQuery.addEventListener("change", (event) => setReducedMotion(event.matches), uiListenerOptions);
setReducedMotion(reduceMotionQuery.matches);
renderPortfolioContent();
initElitePolish({
  config: portfolioConfig,
  reducedMotion: reduceMotionQuery,
});
if (location.hash === abilityProfileHash) {
  openAbilityProfile({ pushHistory: false, returnTarget: abilityToggle });
}

function unlockWorld() {
  const initialHash = location.hash;
  stageOne.setAttribute("aria-hidden", "true");
  stageOne.setAttribute("inert", "");
  stageOne.hidden = true;
  stageTwo.removeAttribute("aria-hidden");
  stageTwo.removeAttribute("inert");
  worldUi.removeAttribute("aria-hidden");
  worldUi.removeAttribute("inert");
  document.body.classList.add("has-revealed");
  revealComplete = true;
  introScene.setWorldProgress(0);
  introScene.markRevealComplete();
  startHeroAndNavigation();
  setActiveSceneState("PORTFOLIO");

  worldScrollHandler = () => {
    const scrollRange = Math.max(stageTwo.scrollHeight - window.innerHeight, 1);
    updateWorldProgress(window.scrollY / scrollRange);
  };
  window.addEventListener("scroll", worldScrollHandler, { passive: true });
  document.addEventListener("scroll", worldScrollHandler, { passive: true, capture: true });

  try {
    lenis = new LenisConstructor({ duration: 1.05, smoothWheel: true, syncTouch: false });
    lenisScrollHandler = () => {
      disableFreeLookOnScroll();
      worldScrollHandler();
      ScrollTrigger.update();
    };
    lenis.on("scroll", lenisScrollHandler);
    lenisTicker = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(lenisTicker);
    worldScrollTrigger = ScrollTrigger.create({
      trigger: stageTwo,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (trigger) => updateWorldProgress(trigger.progress),
      onRefresh: (trigger) => updateWorldProgress(trigger.progress),
    });
    const home = document.querySelector("#home");
    if ("IntersectionObserver" in window) {
      heroThemeObserver?.disconnect();
      heroThemeObserver = new IntersectionObserver(() => {
        const heroBottom = home.getBoundingClientRect().bottom;
        document.body.classList.toggle("is-dark-world", heroBottom < window.innerHeight * 0.2);
      }, { threshold: [0, 0.2] });
      heroThemeObserver.observe(home);
    }
    if (!document.body.classList.contains("reduce-motion")) {
      heroThemeTransition = gsap.fromTo(
        home,
        { "--hero-darken": 0 },
        {
          "--hero-darken": 1,
          ease: "none",
          scrollTrigger: {
            trigger: "#doors",
            start: "top bottom",
            end: "top top",
            scrub: 0.6,
          },
        },
      );
    }
    updateWorldProgress(worldScrollTrigger.progress);
    ScrollTrigger.refresh();
    window.setTimeout(onCollectionHistoryChange, 0);
    if (initialHash && !initialHash.startsWith("#collection/") && initialHash !== abilityProfileHash) {
      window.setTimeout(() => {
        navigateTo(initialHash);
      }, 0);
    }
  } catch (error) {
    console.error("Could not initialize smooth scrolling; using native scroll.", error);
  }
}

async function boot() {
  if (bootStarted) return;
  bootStarted = true;
  try {
    await document.fonts.ready;
    await portraitLoadPromise;
    if (destroyed) return;
    const { createIntroScene } = await import("./scene/create-intro-scene.js");
    introScene = await createIntroScene(canvas, portfolioConfig);
    if (destroyed) {
      introScene.dispose();
      return;
    }
    sceneManager.register("INTRO", primarySceneController);
    sceneManager.register("DOORS", primarySceneController);
    sceneManager.register("WALL", primarySceneController);
    introScene.setRenderMode("INTRO");
    sceneManager.setState("INTRO");
    const [gsapModule, scrollTriggerModule, lenisModule, introModule] = await Promise.all([
      import("gsap"),
      import("gsap/ScrollTrigger"),
      import("lenis"),
      import("./intro.js"),
    ]);
    if (destroyed) {
      introScene.dispose();
      return;
    }
    gsap = gsapModule.gsap;
    ScrollTrigger = scrollTriggerModule.ScrollTrigger;
    LenisConstructor = lenisModule.default;
    gsap.registerPlugin(ScrollTrigger);
    setReducedMotion(reduceMotionQuery.matches || document.body.classList.contains("reduce-motion"));
    availabilityLabel.textContent = portfolioConfig.status.availability;
    worldScene = introScene.worldScenes;
    introScene.markRevealStarted();
    introSequence = introModule.createPortfolioIntro({
      root: stageOne,
      config: portfolioConfig,
      gsap,
      onDone: unlockWorld,
      onPhotoSceneChange(active, photoScene) {
        sceneManager.setOverride(active ? photoScene : null);
      },
    });
  } catch (error) {
    showWebGLFallback(error);
  }
}

function teardown() {
  if (destroyed) return;
  destroyed = true;
  closeHireModal();
  uiAbortController.abort();
  window.clearTimeout(fallbackDoorTransitionTimer);
  disposePreloadedDoorMedia();
  window.clearTimeout(portraitRetryTimer);
  finishPortraitLoad?.();
  introSequence?.destroy();
  collectionTransitionTimeline?.kill();
  collectionTransitionTimeline = undefined;
  canvas.removeEventListener("webglcontextlost", onWebGLContextLost);
  worldUi.removeEventListener("click", onSectionNavigation);
  worldScrollTrigger?.kill();
  if (worldScrollHandler) window.removeEventListener("scroll", worldScrollHandler);
  if (worldScrollHandler) document.removeEventListener("scroll", worldScrollHandler, true);
  worldScrollHandler = undefined;
  heroThemeObserver?.disconnect();
  heroThemeObserver = undefined;
  heroThemeTransition?.scrollTrigger?.kill();
  heroThemeTransition?.kill();
  heroThemeTransition = undefined;
  if (lenisTicker && gsap) gsap.ticker.remove(lenisTicker);
  if (lenis) {
    if (lenisScrollHandler) lenis.off("scroll", lenisScrollHandler);
    lenis.destroy();
  }
  ScrollTrigger?.getAll().forEach((trigger) => trigger.kill());
  if (abilityProfileStatsFrame) cancelAnimationFrame(abilityProfileStatsFrame);
  doorsSectionObserver?.disconnect();
  sceneManager.destroy();
  disposeHeadingReveal();
  disposeInfiniteWall();
  resizeInfiniteWall = () => {};
  disposeWorldVisual();
  disposeWorldVisual = () => {};
  disposeHeroExperience();
  disposeCardEffects();
  disposeTimelineReveal();
  disposeActiveNavigation();
  window.clearInterval(localClockTimer);
  skillVisualDisposers.splice(0).forEach((dispose) => dispose());
  introScene?.destroy();
  if (!canvas.isConnected) {
    document.querySelector("#app").insertBefore(canvas, revealFlash);
    canvas.style.display = "none";
    canvas.style.visibility = "hidden";
  }
  if (window.__portfolioMainDispose === teardown) delete window.__portfolioMainDispose;
}

window.addEventListener("pagehide", teardown, { once: true });

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    window.removeEventListener("pagehide", teardown);
    window.removeEventListener("keydown", onGlobalKeydown);
    teardown();
  });
}

window.__portfolioMainDispose = teardown;
canvas.addEventListener("webglcontextlost", onWebGLContextLost);
boot();
