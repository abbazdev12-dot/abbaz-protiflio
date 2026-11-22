import "./infinite-wall.css";

const PATTERN = [
  { column: 0, row: 0, columns: 2, rows: 1, size: "wide" },
  { column: 2, row: 0, columns: 1, rows: 1, size: "square" },
  { column: 3, row: 0, columns: 1, rows: 2, size: "tall" },
  { column: 0, row: 1, columns: 1, rows: 1, size: "square" },
  { column: 1, row: 1, columns: 1, rows: 1, size: "square" },
  { column: 2, row: 1, columns: 1, rows: 2, size: "tall" },
  { column: 0, row: 2, columns: 2, rows: 1, size: "wide" },
  { column: 3, row: 2, columns: 1, rows: 1, size: "square" },
  { column: 0, row: 3, columns: 1, rows: 1, size: "square" },
  { column: 1, row: 3, columns: 1, rows: 1, size: "square" },
  { column: 2, row: 3, columns: 1, rows: 1, size: "square" },
  { column: 3, row: 3, columns: 1, rows: 1, size: "square" },
];
const ACTIVE_VIDEO_LIMIT = 6;
const mountedWalls = new WeakMap();

function shuffle(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swap]] = [shuffled[swap], shuffled[index]];
  }
  return shuffled;
}

function createText(tag, className, text) {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = text;
  return element;
}

function hasSameNeighbor(placement, cycleX, cycleY, video, occupied) {
  for (let row = 0; row < placement.rows; row += 1) {
    for (let column = 0; column < placement.columns; column += 1) {
      const cellX = cycleX * 4 + placement.column + column;
      const cellY = cycleY * 4 + placement.row + row;
      if (
        occupied.get(`${cellX - 1},${cellY}`) === video.src
        || occupied.get(`${cellX},${cellY - 1}`) === video.src
      ) return true;
    }
  }
  return false;
}

function setOccupiedCells(placement, cycleX, cycleY, video, occupied) {
  for (let row = 0; row < placement.rows; row += 1) {
    for (let column = 0; column < placement.columns; column += 1) {
      const cellX = cycleX * 4 + placement.column + column;
      const cellY = cycleY * 4 + placement.row + row;
      occupied.set(`${cellX},${cellY}`, video.src);
    }
  }
}

export function initInfiniteWall({
  root,
  door,
  gsap,
  reducedMotion,
  onBack,
  onOpenVideo,
  playerDialog,
}) {
  if (!root || !door?.videos?.length || !gsap || typeof onBack !== "function" || typeof onOpenVideo !== "function") {
    throw new Error("An infinite video wall requires a configured door, GSAP, and navigation callbacks.");
  }
  const existingWall = mountedWalls.get(root);
  if (existingWall) return existingWall;

  const abortController = new AbortController();
  const { signal } = abortController;
  const previousLabel = root.getAttribute("aria-labelledby");
  const wall = document.createElement("section");
  wall.className = "video-wall";
  wall.dataset.door = door.id;
  wall.setAttribute("aria-labelledby", "video-wall-title");

  const toolbar = document.createElement("header");
  toolbar.className = "video-wall__toolbar";
  const backButton = createText("button", "video-wall__back", "← Back to the doors");
  backButton.type = "button";
  backButton.addEventListener("click", onBack, { signal });
  const title = createText("h1", "video-wall__title", door.title);
  title.id = "video-wall-title";
  toolbar.append(backButton, title);

  const viewport = document.createElement("div");
  viewport.className = "video-wall__viewport";
  viewport.tabIndex = 0;
  viewport.setAttribute("role", "region");
  viewport.setAttribute("aria-label", `${door.title} video wall. Drag in any direction or use the arrow keys.`);
  const surface = document.createElement("div");
  surface.className = "video-wall__surface";
  const track = document.createElement("div");
  track.className = "video-wall__track";
  surface.append(track);
  viewport.append(surface);
  const hint = createText("p", "video-wall__hint", "Drag in any direction");
  hint.setAttribute("aria-hidden", "true");
  wall.append(toolbar, viewport, hint);
  root.append(wall);
  root.classList.add("is-video-wall");
  root.setAttribute("aria-labelledby", "video-wall-title");

  const videoTiles = [];
  const occupiedCells = new Map();
  const deck = shuffle(door.videos);
  const position = { x: 0, y: 0 };
  const drag = { active: false, moved: false, pointerId: null, x: 0, y: 0, time: 0, velocityX: 0, velocityY: 0 };
  const tileListeners = [];
  const mediaCanvas = document.createElement("canvas");
  mediaCanvas.width = 160;
  mediaCanvas.height = 90;
  const mediaContext = mediaCanvas.getContext("2d", { alpha: false });
  let deckIndex = 0;
  let columnsWidth = 0;
  let rowsHeight = 0;
  let periodX = 0;
  let periodY = 0;
  let wrappedX = 0;
  let wrappedY = 0;
  let inertiaTween;
  let wheelTween;
  let clickResetTimer;
  let resizeFrame;
  let ignoreClick = false;
  let resizeObserver;
  let disposed = false;
  let active = true;
  let visibleTiles = new Set();
  let preloadTiles = new Set();

  const pickVideo = (placement, cycleX, cycleY) => {
    let attempts = 0;
    let video = deck[deckIndex % deck.length];
    while (
      deck.length > 1
      && hasSameNeighbor(placement, cycleX, cycleY, video, occupiedCells)
      && attempts < deck.length
    ) {
      deckIndex += 1;
      video = deck[deckIndex % deck.length];
      attempts += 1;
    }
    deckIndex += 1;
    setOccupiedCells(placement, cycleX, cycleY, video, occupiedCells);
    return video;
  };
  const onTilePointerOver = (event) => {
    const element = event.target.closest(".video-wall__tile");
    const tile = tileByElement.get(element);
    if (tile && !tile.hovered) {
      tile.hovered = true;
      renderDepth();
    }
  };
  const onTilePointerOut = (event) => {
    const element = event.target.closest(".video-wall__tile");
    const tile = tileByElement.get(element);
    if (tile && !element.contains(event.relatedTarget)) {
      tile.hovered = false;
      renderDepth();
    }
  };

  const loadVideo = (tile) => {
    if (tile.loaded || !tile.inRange || disposed) return;
    tile.loaded = true;
    tile.video.src = tile.item.src;
    tile.video.load();
  };

  const unloadVideo = (tile) => {
    if (!tile.loaded || tile.active) return;
    tile.video.pause();
    tile.video.removeAttribute("src");
    tile.video.load();
    tile.loaded = false;
  };

  const capturePoster = (tile) => {
    if (tile.item.poster || !mediaContext || tile.generatedPoster || !tile.video.videoWidth) return;
    try {
      mediaContext.drawImage(tile.video, 0, 0, mediaCanvas.width, mediaCanvas.height);
      tile.video.poster = mediaCanvas.toDataURL("image/webp", 0.72);
      tile.generatedPoster = true;
    } catch (error) {
      console.error(`Could not generate a preview poster for "${tile.item.title}".`, error);
    }
  };

  const updatePlayingTiles = () => {
    if (disposed) return;
    if (!active || document.hidden) {
      videoTiles.forEach((tile) => tile.video.pause());
      return;
    }
    const viewportBounds = viewport.getBoundingClientRect();
    const centerX = viewportBounds.left + viewportBounds.width / 2;
    const centerY = viewportBounds.top + viewportBounds.height / 2;
    const nearest = [...visibleTiles]
      .filter((tile) => tile.element.isConnected)
      .map((tile) => {
        const bounds = tile.element.getBoundingClientRect();
        const distanceX = bounds.left + bounds.width / 2 - centerX;
        const distanceY = bounds.top + bounds.height / 2 - centerY;
        return { distance: distanceX * distanceX + distanceY * distanceY, tile };
      })
      .sort((first, second) => first.distance - second.distance)
      .slice(0, ACTIVE_VIDEO_LIMIT);
    const activeTiles = new Set(nearest.map(({ tile }) => tile));

    videoTiles.forEach((tile) => {
      tile.active = activeTiles.has(tile);
      if (tile.active) {
        if (!tile.inRange) return;
        loadVideo(tile);
        tile.video.muted = true;
        const playback = tile.video.play();
        if (playback?.catch) {
          playback.catch((error) => {
            if (error.name !== "AbortError" && error.name !== "NotAllowedError") {
              console.error(`Could not play the muted preview "${tile.item.title}".`, error);
            }
          });
        }
      } else {
        tile.video.pause();
        unloadVideo(tile);
      }
    });
  };

  const renderDepth = () => {
    const bounds = viewport.getBoundingClientRect();
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;
    videoTiles.forEach((tile) => {
      const left = tile.baseX + wrappedX;
      const top = tile.baseY + wrappedY;
      const x = left + tile.width / 2 - centerX;
      const y = top + tile.height / 2 - centerY;
      const distance = Math.min(1, Math.hypot(x / (bounds.width * 0.76), y / (bounds.height * 0.76)));
      const depth = tile.depth;
      const scale = (reducedMotion ? 1 : 1 - distance * 0.065) * (tile.hovered ? 1.035 : 1);
      const curveX = reducedMotion ? 0 : (x / Math.max(bounds.width, 1)) * distance * 13;
      const curveY = reducedMotion ? 0 : (y / Math.max(bounds.height, 1)) * distance * -13;
      const parallaxX = reducedMotion ? 0 : -wrappedX * depth * 0.018;
      const parallaxY = reducedMotion ? 0 : -wrappedY * depth * 0.018;
      tile.element.style.transform = [
        `translate3d(${(curveX + parallaxX).toFixed(1)}px, ${(curveY + parallaxY).toFixed(1)}px, ${(depth * 24).toFixed(1)}px)`,
        `rotateX(${reducedMotion ? 0 : (y / Math.max(bounds.height, 1) * -2).toFixed(2)}deg)`,
        `rotateY(${reducedMotion ? 0 : (x / Math.max(bounds.width, 1) * 2).toFixed(2)}deg)`,
        `scale(${scale.toFixed(3)})`,
      ].join(" ");
    });
  };

  const wrapValue = (value, period) => {
    if (!period) return value;
    return ((value + period / 2) % period + period) % period - period / 2;
  };

  const renderPosition = () => {
    if (disposed) return;
    wrappedX = wrapValue(position.x, periodX);
    wrappedY = wrapValue(position.y, periodY);
    gsap.set(track, { x: wrappedX, y: wrappedY });
    renderDepth();
  };

  const resize = () => {
    if (disposed || !active) return;
    const bounds = viewport.getBoundingClientRect();
    if (Math.abs(bounds.width - lastViewportWidth) < 1 && Math.abs(bounds.height - lastViewportHeight) < 1) {
      renderPosition();
      return;
    }
    playObserver?.disconnect();
    preloadObserver?.disconnect();
    lastViewportWidth = bounds.width;
    lastViewportHeight = bounds.height;
    const cellWidth = Math.max(168, Math.min(292, bounds.width * 0.22));
    const cellHeight = Math.max(132, Math.min(220, bounds.height * 0.23));
    const gap = Math.max(9, Math.min(15, bounds.width * 0.012));
    const stepX = cellWidth + gap;
    const stepY = cellHeight + gap;
    columnsWidth = cellWidth * 4 + gap * 3;
    rowsHeight = cellHeight * 4 + gap * 3;
    periodX = stepX * 4;
    periodY = stepY * 4;
    tileListeners.splice(0).forEach((removeListeners) => removeListeners());
    videoTiles.forEach((tile) => {
      tile.video.pause();
      tile.video.removeAttribute("src");
      tile.video.load();
    });
    visibleTiles.clear();
    preloadTiles.clear();
    track.replaceChildren();
    videoTiles.length = 0;
    occupiedCells.clear();

    for (let cycleY = -1; cycleY <= 1; cycleY += 1) {
      for (let cycleX = -1; cycleX <= 1; cycleX += 1) {
        PATTERN.forEach((placement, placementIndex) => {
          const item = pickVideo(placement, cycleX, cycleY);
          const width = placement.columns * cellWidth + (placement.columns - 1) * gap;
          const height = placement.rows * cellHeight + (placement.rows - 1) * gap;
          const baseX = bounds.width / 2 - columnsWidth / 2 + cycleX * periodX
            + placement.column * stepX;
          const baseY = bounds.height / 2 - rowsHeight / 2 + cycleY * periodY
            + placement.row * stepY;
          const button = document.createElement("button");
          button.className = "video-wall__tile";
          button.type = "button";
          button.dataset.size = placement.size;
          button.dataset.videoIndex = String(door.videos.indexOf(item));
          button.setAttribute("aria-label", `Open video: ${item.title}`);
          button.style.left = `${baseX}px`;
          button.style.top = `${baseY}px`;
          button.style.width = `${width}px`;
          button.style.height = `${height}px`;
          button.style.setProperty("--tile-depth", String(((cycleX + cycleY + placementIndex) % 4) + 1));

          const video = document.createElement("video");
          video.className = "video-wall__preview";
          video.muted = true;
          video.loop = true;
          video.playsInline = true;
          video.autoplay = true;
          video.preload = "none";
          video.setAttribute("aria-hidden", "true");
          if (item.poster) video.poster = item.poster;

          const titleOverlay = createText("span", "video-wall__tile-title", item.title);
          const category = createText("span", "video-wall__tile-category", item.category || door.title);
          const shade = document.createElement("span");
          shade.className = "video-wall__tile-shade";
          shade.setAttribute("aria-hidden", "true");
          button.append(video, shade, titleOverlay, category);
          track.append(button);

          const tile = {
            active: false,
            baseX,
            baseY,
            depth: Number(button.style.getPropertyValue("--tile-depth")),
            element: button,
            generatedPoster: false,
            height,
            inRange: false,
            item,
            loaded: false,
            video,
            width,
          };
          const onLoadedData = () => capturePoster(tile);
          const onVideoError = () => {
            console.error(`Could not load wall preview "${item.title}" from ${item.src}.`);
          };
          video.addEventListener("loadeddata", onLoadedData);
          video.addEventListener("error", onVideoError);
          tileListeners.push(() => {
            video.removeEventListener("loadeddata", onLoadedData);
            video.removeEventListener("error", onVideoError);
          });
          videoTiles.push(tile);
        });
      }
    }

    renderPosition();
    playObserver?.disconnect();
    preloadObserver?.disconnect();
    playObserver = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        const tile = tileByElement.get(target);
        if (tile) {
          if (isIntersecting) visibleTiles.add(tile);
          else visibleTiles.delete(tile);
        }
      });
      updatePlayingTiles();
    }, { root: viewport, threshold: 0.01 });
    preloadObserver = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        const tile = tileByElement.get(target);
        if (!tile) return;
        tile.inRange = isIntersecting;
        if (isIntersecting) {
          preloadTiles.add(tile);
        } else {
          preloadTiles.delete(tile);
          if (!tile.active) unloadVideo(tile);
        }
      });
      updatePlayingTiles();
    }, { root: viewport, rootMargin: "110% 110% 110% 110%", threshold: 0.001 });
    videoTiles.forEach((tile) => {
      playObserver.observe(tile.element);
      preloadObserver.observe(tile.element);
    });
    updatePlayingTiles();
  };

  const tileByElement = new Map();
  let lastViewportWidth = -1;
  let lastViewportHeight = -1;
  let playObserver;
  let preloadObserver;
  const createTiles = resize;

  const moveTo = (x, y, duration = 0.24, ease = "power2.out") => {
    inertiaTween?.kill();
    wheelTween?.kill();
    wheelTween = gsap.to(position, {
      x,
      y,
      duration,
      ease,
      overwrite: true,
      onUpdate: renderPosition,
    });
  };

  const onPointerDown = (event) => {
    if (event.button !== 0 || event.target.closest(".video-wall__back")) return;
    inertiaTween?.kill();
    wheelTween?.kill();
    drag.active = true;
    drag.moved = false;
    drag.pointerId = event.pointerId;
    drag.x = event.clientX;
    drag.y = event.clientY;
    drag.time = performance.now();
    drag.velocityX = 0;
    drag.velocityY = 0;
    ignoreClick = false;
    viewport.classList.add("is-dragging");
  };

  const onPointerMove = (event) => {
    if (!drag.active || event.pointerId !== drag.pointerId) return;
    const now = performance.now();
    const deltaX = event.clientX - drag.x;
    const deltaY = event.clientY - drag.y;
    const deltaTime = Math.max(1, now - drag.time);
    drag.velocityX = deltaX / deltaTime;
    drag.velocityY = deltaY / deltaTime;
    drag.x = event.clientX;
    drag.y = event.clientY;
    drag.time = now;
    if (Math.abs(deltaX) + Math.abs(deltaY) > 2) drag.moved = true;
    position.x += deltaX;
    position.y += deltaY;
    renderPosition();
  };

  const onPointerUp = (event) => {
    if (!drag.active || event.pointerId !== drag.pointerId) return;
    drag.active = false;
    viewport.classList.remove("is-dragging");
    if (drag.moved) {
      ignoreClick = true;
      window.clearTimeout(clickResetTimer);
      clickResetTimer = window.setTimeout(() => {
        ignoreClick = false;
      }, 120);
    }
    if (!reducedMotion && drag.moved) {
      inertiaTween = gsap.to(position, {
        x: position.x + drag.velocityX * 430,
        y: position.y + drag.velocityY * 430,
        duration: 1.05,
        ease: "power2.out",
        overwrite: true,
        onUpdate: renderPosition,
      });
    }
  };

  const onWheel = (event) => {
    event.preventDefault();
    moveTo(
      position.x - event.deltaX,
      position.y - event.deltaY,
      reducedMotion ? 0 : 0.34,
    );
  };

  const onKeyDown = (event) => {
    const movement = event.shiftKey ? 120 : 70;
    const directions = {
      ArrowDown: [0, -movement],
      ArrowLeft: [movement, 0],
      ArrowRight: [-movement, 0],
      ArrowUp: [0, movement],
    };
    const direction = directions[event.key];
    if (!direction) return;
    event.preventDefault();
    moveTo(position.x + direction[0], position.y + direction[1], reducedMotion ? 0 : 0.3);
  };

  const onClick = (event) => {
    if (ignoreClick) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    const button = event.target.closest(".video-wall__tile");
    if (!button) return;
    const index = Number(button.dataset.videoIndex);
    const item = door.videos[index];
    if (!item) return;
    const selectedTile = tileByElement.get(button);
    onOpenVideo(door.videos.map((video, videoIndex) => ({
      ...video,
      thumbnail: video.poster || (videoIndex === index ? selectedTile?.video.poster : "") || "",
      duration: 0,
    })), index, button);
  };

  const onDialogPointerDown = (event) => {
    playerDragStart = { x: event.clientX, y: event.clientY };
  };
  const onDialogPointerUp = (event) => {
    if (!playerDragStart) return;
    const deltaX = event.clientX - playerDragStart.x;
    const deltaY = event.clientY - playerDragStart.y;
    playerDragStart = null;
    if (deltaY > 110 && Math.abs(deltaX) < 70 && playerDialog.open) playerDialog.close();
  };
  const onVisibilityChange = () => {
    if (document.hidden) {
      videoTiles.forEach((tile) => tile.video.pause());
    } else {
      updatePlayingTiles();
    }
  };

  let playerDragStart = null;
  viewport.addEventListener("pointerdown", onPointerDown, { signal });
  viewport.addEventListener("click", onClick, { signal });
  viewport.addEventListener("pointerover", onTilePointerOver, { signal });
  viewport.addEventListener("pointerout", onTilePointerOut, { signal });
  viewport.addEventListener("wheel", onWheel, { passive: false, signal });
  viewport.addEventListener("keydown", onKeyDown, { signal });
  window.addEventListener("pointermove", onPointerMove, { passive: true, signal });
  window.addEventListener("pointerup", onPointerUp, { signal });
  window.addEventListener("pointercancel", onPointerUp, { signal });
  playerDialog?.addEventListener("pointerdown", onDialogPointerDown, { signal });
  playerDialog?.addEventListener("pointerup", onDialogPointerUp, { signal });
  document.addEventListener("visibilitychange", onVisibilityChange, { signal });

  if ("ResizeObserver" in window) {
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(viewport);
  } else {
    window.addEventListener("resize", resize, { signal });
    window.addEventListener("orientationchange", resize, { signal });
  }

  const tileObserverTargets = new MutationObserver(() => {
    tileByElement.clear();
    videoTiles.forEach((tile) => tileByElement.set(tile.element, tile));
  });
  tileObserverTargets.observe(track, { childList: true });

  createTiles();
  tileByElement.clear();
  videoTiles.forEach((tile) => tileByElement.set(tile.element, tile));
  resizeFrame = requestAnimationFrame(() => {
    resizeFrame = null;
    resize();
  });

  const destroy = () => {
    if (disposed) return;
    disposed = true;
    abortController.abort();
    inertiaTween?.kill();
    wheelTween?.kill();
    resizeObserver?.disconnect();
    cancelAnimationFrame(resizeFrame);
    tileObserverTargets.disconnect();
    playObserver?.disconnect();
    preloadObserver?.disconnect();
    window.clearTimeout(clickResetTimer);
    tileListeners.splice(0).forEach((removeListeners) => removeListeners());
    videoTiles.forEach((tile) => {
      tile.video.pause();
      tile.video.removeAttribute("src");
      tile.video.removeAttribute("poster");
      tile.video.load();
    });
    visibleTiles.clear();
    preloadTiles.clear();
    wall.remove();
    root.classList.remove("is-video-wall");
    if (previousLabel) root.setAttribute("aria-labelledby", previousLabel);
    else root.removeAttribute("aria-labelledby");
    playerDialog?.removeEventListener("pointerdown", onDialogPointerDown);
    playerDialog?.removeEventListener("pointerup", onDialogPointerUp);
    if (mountedWalls.get(root) === wallController) mountedWalls.delete(root);
  };

  const wallController = {
    backButton,
    setActive(value) {
      if (disposed || active === value) return;
      active = value;
      if (active) {
        resize();
        updatePlayingTiles();
      } else {
        inertiaTween?.kill();
        wheelTween?.kill();
        videoTiles.forEach((tile) => tile.video.pause());
      }
    },
    getStats() {
      return { renderLoops: 0, canvases: 0 };
    },
    destroy,
    dispose: destroy,
    resize,
  };
  mountedWalls.set(root, wallController);
  return wallController;
}
