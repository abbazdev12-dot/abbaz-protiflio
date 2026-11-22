/**
 * Cinematic hero entrance: mounts loader, 3D scene, DOM content, and animations.
 * Tunable via config.hero. Returns a controller with destroy().
 */
import "./hero.css";
import { createHeroLoader } from "./loader.js";
import { createHeroScene } from "./scene.js";
import { createHeroAnimations } from "./animations.js";

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function mountHero(root, config = {}, options = {}) {
  const heroCfg = config.hero || {};
  const colors = heroCfg.colors || {};
  const accent = colors.accent || "#00D9FF";
  const name = heroCfg.name || config.site?.name || "ABBAS.P.A";
  const rolePrefix = heroCfg.rolePrefix || "I am a";
  const roles = heroCfg.roles || [];
  const firstRole = roles[0]?.label || (typeof roles[0] === "string" ? roles[0] : "Full-Stack Dev");
  const tagline = heroCfg.tagline || "I break systems, build them, and trade the markets.";
  const photo = heroCfg.photo || config.site?.photo || { src: "/photo/abbas.jpg", alt: `Portrait of ${name}` };
  const ctas = heroCfg.ctas || {
    primary: { label: "More about me", href: "#doors" },
    secondary: { label: "Ability card", href: "#page" }
  };

  root.classList.add("hero-page");
  root.style.setProperty("--hero-accent", accent);

  // Loader first (overlays everything, reveals into hero)
  const loader = createHeroLoader(root, config);

  // DOM structure: hero section + next section for scroll destination
  const wrapper = document.createElement("div");
  wrapper.className = "hero-root";
  wrapper.innerHTML = `
    <section class="hero-section" data-hero-section aria-label="Introduction">
      <div class="hero-content" data-hero-content>
        <div class="hero-copy">
          <h1 class="hero-name" data-hero-name></h1>
          <p class="hero-role-line" data-hero-role-line>
            <span class="hero-role-prefix">${escapeHtml(rolePrefix)}</span>
            <span class="hero-role" data-hero-role aria-live="polite">${escapeHtml(firstRole)}</span>
          </p>
          <p class="hero-tagline" data-hero-tagline>${escapeHtml(tagline)}</p>
          <div class="hero-actions">
            <a class="hero-cta hero-cta--primary" data-hero-cta data-magnetic href="${escapeHtml(ctas.primary?.href || "#doors")}">${escapeHtml(ctas.primary?.label || "More about me")}</a>
            <a class="hero-cta hero-cta--secondary" data-hero-cta data-magnetic href="${escapeHtml(ctas.secondary?.href || "#page")}">${escapeHtml(ctas.secondary?.label || "Ability card")}</a>
          </div>
        </div>
        <div class="hero-visual">
          <figure class="hero-photo-card" data-hero-photo-card>
            <div class="hero-photo-frame">
              <img class="hero-photo" src="${escapeHtml(photo.src)}" srcset="${escapeHtml(photo.srcSet || photo.src)}" alt="${escapeHtml(photo.alt || `Portrait of ${name}`)}" loading="eager" decoding="async" />
              <div class="hero-photo-glare" data-hero-glare aria-hidden="true"></div>
            </div>
            <div class="hero-photo-ring" aria-hidden="true"></div>
          </figure>
        </div>
      </div>
      <div class="hero-scroll-hint" data-hero-scroll aria-hidden="true">
        <span>Scroll</span>
        <span class="hero-scroll-line"></span>
      </div>
    </section>
    <section class="hero-next" data-hero-next aria-label="Explore">
      <div class="hero-next__inner">
        <p class="hero-next__eyebrow">${escapeHtml(config.site?.tagline || "PORTFOLIO")}</p>
        <h2 class="hero-next__title">${escapeHtml(config.site?.heroLine || "Exploring systems, building ideas, and learning by doing.")}</h2>
        <p class="hero-next__text">${escapeHtml(config.site?.supportingLine || "Step inside to explore the worlds behind the work.")}</p>
        <div class="hero-next__actions">
          <a class="hero-cta hero-cta--primary" data-magnetic href="#doors">Enter worlds</a>
        </div>
      </div>
    </section>
  `;
  // Insert wrapper after loader (loader is fixed overlay)
  root.appendChild(wrapper);

  // 3D scene (fixed canvas behind text)
  const scene = createHeroScene(root, config, {
    reducedMotion: options.reducedMotion,
    isMobile: options.isMobile || options.weak,
    weak: options.weak
  });

  // Register scene update with app ticker (single RAF loop)
  let sceneTick = null;
  if (options.ticker && options.ticker.register) {
    sceneTick = (dt) => scene.update(dt);
    options.ticker.register(sceneTick);
  } else {
    // Fallback internal loop only if no ticker provided (shouldn't happen in app)
    let last = performance.now(), raf;
    const loop = (now) => { scene.update(Math.min((now - last) / 1000, 0.1)); last = now; raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    sceneTick = () => cancelAnimationFrame(raf);
  }

  // Pause rendering when tab hidden
  const onVis = () => { scene.setPaused(document.hidden); };
  document.addEventListener("visibilitychange", onVis);

  // Resize
  const onResize = () => scene.resize();
  window.addEventListener("resize", onResize);

  // Animations (text, role rotator/morph, photo, magnetic, scroll/Lenis)
  const animations = createHeroAnimations(wrapper, scene, config, {
    reducedMotion: options.reducedMotion,
    ticker: options.ticker
  });

  // After loader wipe reveals hero, run intro animations
  loader.done.then(() => {
    try { animations.init(); } catch (e) { /* keep hero usable */ }
  });

  function destroy() {
    try { document.removeEventListener("visibilitychange", onVis); } catch (_) {}
    try { window.removeEventListener("resize", onResize); } catch (_) {}
    try { animations.destroy(); } catch (_) {}
    try {
      if (options.ticker && options.ticker.unregister && sceneTick) options.ticker.unregister(sceneTick);
      else if (typeof sceneTick === "function" && !options.ticker) sceneTick();
    } catch (_) {}
    try { scene.dispose(); } catch (_) {}
    try { loader.destroy(); } catch (_) {}
    try { wrapper.remove(); } catch (_) {}
    root.classList.remove("hero-page");
    root.style.removeProperty("--hero-accent");
  }

  return { destroy, scene, animations };
}
