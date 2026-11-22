const EASE = "cubic-bezier(.2,.8,.2,1)";

export function initElitePolish({ config, reducedMotion }) {
  const cleanups = [];
  const reduced = () => reducedMotion?.matches || document.body.classList.contains("reduce-motion");

  initHeadingSerif();
  initHeroTerminal();
  initChangelog(cleanups);
  initStatusBar(cleanups);
  initCursor(cleanups);
  initMagnetic(cleanups);
  initAbilityRadar(config);
  initProjectCases(config);
  initReveals(cleanups);
  initSudoEasterEgg(cleanups);
  initDoorCanvases(cleanups, reduced);

  return () => cleanups.splice(0).forEach((dispose) => {
    try { dispose(); } catch {}
  });
}

function initHeadingSerif() {
  const heading = document.querySelector(".world-section--home .home-hero__copy h2");
  if (!heading) return;
  const preposition = heading.querySelector(".home-hero__preposition");
  if (preposition) preposition.classList.add("elite-serif");
}

function initHeroTerminal() {
  const roleLine = document.querySelector(".hero-role-flip");
  if (!roleLine) return;
  roleLine.setAttribute("aria-label", "$ whoami");
}

function initChangelog(cleanups) {
  const actions = document.querySelector(".home-hero__actions");
  if (!actions || document.querySelector(".hero-changelog")) return;
  const line = document.createElement("p");
  line.className = "hero-changelog";
  line.setAttribute("aria-live", "polite");
  actions.insertAdjacentElement("afterend", line);

  const messages = [
    "shipped: 3D portfolio",
    "audited: web app",
    "traded: XAUUSD",
    "learning: market structure",
  ];
  let messageIndex = 0;
  let timer = null;

  const typeMessage = () => {
    if (document.hidden) return;
    const text = messages[messageIndex];
    line.textContent = "> ";
    let index = 0;
    if (timer) window.clearInterval(timer);
    timer = window.setInterval(() => {
      index += 1;
      line.textContent = `> ${text.slice(0, index)}`;
      if (index >= text.length) {
        window.clearInterval(timer);
        timer = window.setInterval(nextMessage, 2500);
      }
    }, 24);
  };

  const nextMessage = () => {
    window.clearInterval(timer);
    timer = null;
    messageIndex = (messageIndex + 1) % messages.length;
    typeMessage();
  };

  typeMessage();
  const onVisibility = () => {
    if (document.hidden) window.clearInterval(timer);
    else typeMessage();
  };
  document.addEventListener("visibilitychange", onVisibility);
  cleanups.push(() => {
    window.clearInterval(timer);
    document.removeEventListener("visibilitychange", onVisibility);
  });
}

function initStatusBar(cleanups) {
  if (document.querySelector(".elite-status")) return;
  const status = document.createElement("div");
  status.className = "elite-status";
  status.innerHTML =
    '<span class="elite-status__dot"></span>' +
    '<span>BUILD 2.0 · <b data-fps>60 FPS</b> · 12ms · WEBGL2 · ONLINE</span>';
  document.body.append(status);

  const fps = status.querySelector("[data-fps]");
  let frames = 0;
  let sampleStart = performance.now();
  let raf = 0;
  let sampleTimer = 0;
  const loop = (time) => {
    if (document.hidden) {
      raf = requestAnimationFrame(loop);
      return;
    }
    frames += 1;
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  sampleTimer = window.setInterval(() => {
    if (document.hidden) return;
    const now = performance.now();
    const elapsed = Math.max(500, now - sampleStart);
    const measured = Math.max(1, Math.min(99, Math.round(frames * 1000 / elapsed)));
    fps.textContent = `${measured} FPS`;
    frames = 0;
    sampleStart = now;
  }, 500);

  cleanups.push(() => {
    cancelAnimationFrame(raf);
    window.clearInterval(sampleTimer);
    status.remove();
  });
}

function initCursor(cleanups) {
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  const dot = document.createElement("div");
  const ring = document.createElement("div");
  dot.className = "elite-cursor-dot";
  ring.className = "elite-cursor-ring";
  document.body.append(dot, ring);

  let targetX = -100;
  let targetY = -100;
  let dotX = targetX;
  let dotY = targetY;
  let ringX = 0;
  let ringY = 0;
  let raf = 0;
  const onMove = (event) => {
    targetX = event.clientX;
    targetY = event.clientY;
  };
  const loop = () => {
    dotX += (targetX - dotX);
    dotY += (targetY - dotY);
    ringX += (targetX - ringX) * 0.35;
    ringY += (targetY - ringY) * 0.35;
    dot.style.transform = `translate3d(${dotX}px, ${dotY}px, 0) translate(-50%, -50%)`;
    ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
    raf = requestAnimationFrame(loop);
  };
  const onOver = (event) => {
    ring.classList.toggle("is-link", Boolean(event.target.closest("a,button")));
  };
  window.addEventListener("pointermove", onMove, { passive: true });
  document.addEventListener("pointerover", onOver, { passive: true });
  raf = requestAnimationFrame(loop);
  cleanups.push(() => {
    cancelAnimationFrame(raf);
    window.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerover", onOver);
    dot.remove();
    ring.remove();
  });
}

function initMagnetic(cleanups) {
  if (matchMedia("(pointer: coarse)").matches) return;
  const elements = [...document.querySelectorAll(".hero-cta, .world-tool")];
  elements.forEach((element) => {
    const onMove = (event) => {
      const rect = element.getBoundingClientRect();
      const x = event.clientX - (rect.left + rect.width / 2);
      const y = event.clientY - (rect.top + rect.height / 2);
      element.style.transform = `translate(${Math.max(-8, Math.min(8, x * 0.16))}px, ${Math.max(-8, Math.min(8, y * 0.16))}px)`;
    };
    const onLeave = () => { element.style.transform = ""; };
    element.addEventListener("pointermove", onMove);
    element.addEventListener("pointerleave", onLeave);
    cleanups.push(() => {
      element.removeEventListener("pointermove", onMove);
      element.removeEventListener("pointerleave", onLeave);
      element.style.transform = "";
    });
  });
}

function createRadar(matrix) {
  const size = 96;
  const center = size / 2;
  const radius = 36;
  const count = matrix.length;
  const point = (index, scale = 1) => {
    const angle = -Math.PI / 2 + (index * Math.PI * 2) / count;
    return [
      center + Math.cos(angle) * radius * scale,
      center + Math.sin(angle) * radius * scale,
    ];
  };
  const rings = [0.33, 0.66, 1].map((scale) => {
    const points = matrix.map((_, index) => point(index, scale).join(",")).join(" ");
    return `<polygon points="${points}" />`;
  }).join("");
  const axes = matrix.map((_, index) => {
    const [x, y] = point(index, 1);
    return `<line x1="${center}" y1="${center}" x2="${x}" y2="${y}" />`;
  }).join("");
  const values = matrix.map((item, index) => point(index, item.value / 100).join(",")).join(" ");
  return `
    <svg class="elite-radar" viewBox="0 0 ${size} ${size}" aria-label="Self-assessed ability radar, placeholder values">
      ${rings}${axes}<polygon class="elite-radar__value" points="${values}" />
    </svg>
  `;
}

function initAbilityRadar(config) {
  const card = document.querySelector(".ability-card");
  if (!card || card.querySelector(".elite-radar")) return;
  const toggle = card.querySelector(".ability-card__toggle");
  const matrix = config.abilityCard?.matrix || [
    { label: "Hacking", value: 82 },
    { label: "Full-Stack", value: 88 },
    { label: "Forex", value: 72 },
    { label: "Futures", value: 64 },
    { label: "Design", value: 76 },
    { label: "Systems", value: 84 },
  ];
  const wrapper = document.createElement("span");
  wrapper.className = "ability-card__radar";
  wrapper.innerHTML = createRadar(matrix);
  toggle?.append(wrapper);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      entry.target.querySelector(".elite-radar")?.classList.toggle("is-visible", entry.isIntersecting);
    });
  }, { threshold: 0.25 });
  observer.observe(card);
  card._eliteObserver = observer;
}

function initProjectCases(config) {
  const grid = document.querySelector("#project-grid");
  if (!grid) return;
  const decorate = () => {
    grid.querySelectorAll(".project-card").forEach((card) => {
      const index = Number(card.dataset.projectIndex);
      const project = config.projects[index];
      if (!project || card.querySelector(".project-card__case-lines")) return;

      const header = document.createElement("div");
      header.className = "project-card__case-header";
      header.innerHTML = `<span>CASE ${String(index + 1).padStart(2, "0")}</span><span>LOCAL / 2026</span>`;
      const visual = card.querySelector(".project-card__visual");
      if (visual) visual.insertAdjacentElement("beforebegin", header);
      else card.prepend(header);

      const lines = document.createElement("div");
      lines.className = "project-card__case-lines";
      lines.innerHTML = `
        <span><b>PROBLEM</b><em>${escapeHtml(project.problem)}</em></span>
        <span><b>BUILD</b><em>${escapeHtml(project.solution)}</em></span>
        <span><b>RESULT</b><em>${escapeHtml(project.result)}</em></span>
      `;
      const status = card.querySelector(".project-card__status");
      if (status) status.insertAdjacentElement("afterend", lines);
      else card.append(lines);
    });
  };
  decorate();
  const observer = new MutationObserver(decorate);
  observer.observe(grid, { childList: true, subtree: true });
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function initReveals(cleanups) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const targets = [
    ...document.querySelectorAll(".section-heading, .skill-card, .project-card, .timeline-list__entry, .contact-card"),
  ];
  targets.forEach((target) => target.classList.add("elite-reveal"));
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.16 });
  targets.forEach((target) => observer.observe(target));
  cleanups.push(() => observer.disconnect());
}

function initSudoEasterEgg(cleanups) {
  let buffer = "";
  let timer = null;
  const flash = document.createElement("div");
  flash.className = "elite-sudo-flash";
  flash.textContent = "ACCESS GRANTED";
  document.body.append(flash);

  const onKey = (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key.length !== 1) return;
    buffer = (buffer + event.key.toLowerCase()).slice(-16);
    window.clearTimeout(timer);
    timer = window.setTimeout(() => { buffer = ""; }, 900);
    if (buffer.includes("sudo hire abbas")) {
      buffer = "";
      flash.classList.remove("is-visible");
      void flash.offsetWidth;
      flash.classList.add("is-visible");
      document.querySelector("#contact")?.scrollIntoView({
        behavior: document.body.classList.contains("reduce-motion") ? "auto" : "smooth",
      });
    }
  };
  window.addEventListener("keydown", onKey);
  cleanups.push(() => {
    window.clearTimeout(timer);
    window.removeEventListener("keydown", onKey);
    flash.remove();
  });
}

function initDoorCanvases(cleanups, reduced) {
  if (!("IntersectionObserver" in window) || reduced()) return;
  const doors = [...document.querySelectorAll(".door-fallback__item")];
  const canvases = [];
  doors.forEach((door, index) => {
    const upper = door.querySelector(".door-fallback__panel--upper");
    if (!upper) return;
    const canvas = document.createElement("canvas");
    canvas.className = "door-upper-canvas";
    canvas.setAttribute("aria-hidden", "true");
    upper.append(canvas);
    const context = canvas.getContext("2d");
    if (!context) return;
    const state = { canvas, context, visible: false, index, lastCandle: 0 };
    canvases.push(state);
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const canvas = entry.target.querySelector("canvas");
      const state = canvases.find((item) => item.canvas === canvas);
      if (state) state.visible = entry.isIntersecting;
    });
  }, { threshold: 0.12 });
  doors.forEach((door) => observer.observe(door));

  let raf = 0;
  let hidden = document.hidden;
  const onVisibility = () => { hidden = document.hidden; };
  document.addEventListener("visibilitychange", onVisibility);

  const loop = (time) => {
    if (!hidden) {
      canvases.forEach((state) => {
        if (state.visible) drawDoorCanvas(state, time);
      });
    }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  cleanups.push(() => {
    cancelAnimationFrame(raf);
    observer.disconnect();
    document.removeEventListener("visibilitychange", onVisibility);
    canvases.forEach(({ canvas }) => canvas.remove());
  });
}

function drawDoorCanvas(state, time) {
  const { canvas, context, index } = state;
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));
  const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
  if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
  }
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, width, height);

  if (index === 0) drawCodeRain(context, width, height, time);
  else if (index === 1) drawTypingCode(context, width, height, time);
  else if (index === 2) drawCandles(context, width, height, state, time);
  else drawMeGlow(context, width, height, time);
}

function drawCodeRain(context, width, height, time) {
  context.font = '8px "JetBrains Mono", monospace';
  context.fillStyle = "rgba(108,99,255,.55)";
  for (let column = 0; column < 12; column += 1) {
    const x = (column + 0.5) * (width / 12);
    const y = ((time * 0.06 + column * 19) % (height + 20)) - 10;
    context.fillText((column + (Math.floor(time / 900) % 8)).toString(16).toUpperCase(), x, y);
  }
}

function drawTypingCode(context, width, height, time) {
  context.font = '7px "JetBrains Mono", monospace';
  context.fillStyle = "rgba(237,239,246,.42)";
  const lines = ["const build = () =>", "  ship(reliable)", "  test(edgeCases)", "  deploy()"];
  lines.forEach((line, index) => {
    const visible = Math.max(0, Math.floor((time / 80 + index * 3) % (line.length + 8)));
    context.fillText(line.slice(0, visible), 10, 16 + index * 14);
  });
  context.fillStyle = "#7CFFB2";
  context.fillRect(width - 12, 10 + (Math.floor(time / 700) % 3) * 14, 4, 7);
}

function drawCandles(context, width, height, state, time) {
  if (!state.candles) {
    state.candles = Array.from({ length: 12 }, (_, index) => ({
      close: 30 + ((index * 17) % 38),
      open: 30 + (((index * 13) + 9) % 38),
    }));
  }
  if (time - state.lastCandle > 700) {
    state.lastCandle = time;
    const last = state.candles[state.candles.length - 1].close;
    const close = Math.max(16, Math.min(height - 16, last + (Math.random() - 0.5) * 18));
    state.candles.shift();
    state.candles.push({ open: last, close });
  }
  const step = width / state.candles.length;
  state.candles.forEach((candle, index) => {
    const x = index * step + step * 0.5;
    const openY = height - candle.open;
    const closeY = height - candle.close;
    context.strokeStyle = "rgba(255,92,122,.62)";
    context.beginPath();
    context.moveTo(x, Math.min(openY, closeY) - 4);
    context.lineTo(x, Math.max(openY, closeY) + 4);
    context.stroke();
    context.fillStyle = candle.close >= candle.open
      ? "rgba(124,255,178,.72)"
      : "rgba(255,92,122,.72)";
    context.fillRect(x - 3, Math.min(openY, closeY), 6, Math.max(3, Math.abs(closeY - openY)));
  });
}

function drawMeGlow(context, width, height, time) {
  const pulse = 0.5 + Math.sin(time / 700) * 0.12;
  const gradient = context.createRadialGradient(
    width * 0.5,
    height * 0.55,
    2,
    width * 0.5,
    height * 0.55,
    width * 0.65,
  );
  gradient.addColorStop(0, `rgba(108,99,255,${pulse})`);
  gradient.addColorStop(0.48, "rgba(255,92,122,.18)");
  gradient.addColorStop(1, "rgba(5,6,10,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  context.fillStyle = "rgba(237,239,246,.82)";
  context.font = '600 18px "Inter Tight", sans-serif';
  context.textAlign = "center";
  context.fillText("AP", width / 2, height / 2 + 6);
  context.textAlign = "start";
}
