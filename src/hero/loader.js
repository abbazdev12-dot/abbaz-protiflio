import "./hero.css";
import { initHeroAnimations } from "./animations.js";
import { createHeroScene } from "./scene.js";

const heroExperiences = new WeakMap();

function createLoader(hero, gsap, duration, onComplete) {
  const overlay = document.createElement("div");
  overlay.className = "hero-entrance-loader";
  overlay.setAttribute("aria-hidden", "true");

  const panel = document.createElement("div");
  panel.className = "hero-entrance-loader__panel";
  const label = document.createElement("span");
  label.className = "hero-entrance-loader__label";
  label.textContent = "INITIALIZING / PORTFOLIO";
  const readout = document.createElement("output");
  readout.className = "hero-entrance-loader__readout";
  readout.textContent = "00";
  const track = document.createElement("span");
  track.className = "hero-entrance-loader__track";
  const fill = document.createElement("span");
  fill.className = "hero-entrance-loader__fill";
  track.append(fill);
  panel.append(label, readout, track);
  overlay.append(panel);
  hero.append(overlay);

  const progress = { value: 0 };
  const timeline = gsap.timeline({
    onComplete: () => {
      overlay.remove();
      onComplete();
    },
  });
  timeline.to(progress, {
    value: 100,
    duration,
    ease: "power2.inOut",
    onUpdate: () => {
      const value = Math.round(progress.value);
      readout.textContent = String(value).padStart(2, "0");
      fill.style.transform = `scaleX(${value / 100})`;
    },
  });
  timeline.to(overlay, {
    clipPath: "inset(0 0 100% 0)",
    duration: 0.38,
    ease: "power3.inOut",
  });

  return () => {
    timeline.kill();
    overlay.remove();
  };
}

export function initHeroExperience({ hero, config, gsap, ScrollTrigger, reducedMotion = false }) {
  const settings = config?.heroExperience;
  if (!hero || !settings || !gsap) {
    throw new Error("The hero experience requires the home section, hero settings, and GSAP.");
  }
  const existingExperience = heroExperiences.get(hero);
  if (existingExperience) return existingExperience;

  hero.classList.add("hero-cinematic");
  Object.entries(settings.colors).forEach(([name, value]) => {
    hero.style.setProperty(`--hero-${name}`, value);
  });

  const canvas = document.createElement("canvas");
  canvas.className = "hero-scene-canvas";
  canvas.setAttribute("aria-hidden", "true");
  hero.prepend(canvas);

  let scene;
  try {
    scene = createHeroScene(canvas, hero, settings, reducedMotion);
  } catch (error) {
    canvas.remove();
    console.error("Could not initialize the hero particle scene; using the static hero background.", error);
  }

  const animations = initHeroAnimations({
    hero,
    config,
    gsap,
    ScrollTrigger,
    scene,
    reducedMotion,
  });
  const disposeLoader = reducedMotion
    ? () => {}
    : createLoader(hero, gsap, settings.timing.loader, animations.playEntrance);
  if (reducedMotion) animations.playEntrance();

  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    dispose.setActive(false);
    disposed = true;
    disposeLoader();
    animations.dispose();
    scene?.dispose();
    canvas.remove();
    hero.classList.remove("hero-cinematic");
    Object.keys(settings.colors).forEach((name) => hero.style.removeProperty(`--hero-${name}`));
    if (heroExperiences.get(hero) === dispose) heroExperiences.delete(hero);
  };
  dispose.setActive = (active) => {
    if (disposed) return;
    if (active && !canvas.isConnected) hero.prepend(canvas);
    else if (!active && canvas.isConnected) canvas.remove();
    canvas.style.display = active ? "block" : "none";
    canvas.style.visibility = active ? "visible" : "hidden";
    scene?.setActive(active);
    animations.setActive(active);
  };
  dispose.getStats = () => {
    if (disposed || canvas.style.display === "none") {
      return { renderLoops: 0, canvases: 0 };
    }
    return scene?.getStats() || { renderLoops: 0, canvases: 0 };
  };
  heroExperiences.set(hero, dispose);
  return dispose;
}
