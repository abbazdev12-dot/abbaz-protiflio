const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&";

function appendWord(line, word, characters) {
  const wordElement = document.createElement("span");
  wordElement.className = "hero-title__word";
  for (const character of word) {
    const mask = document.createElement("span");
    const glyph = document.createElement("span");
    mask.className = "hero-title__mask";
    glyph.className = "hero-title__character";
    glyph.textContent = character;
    mask.append(glyph);
    wordElement.append(mask);
    characters.push(glyph);
  }
  line.append(wordElement);
}

function buildAnimatedTitle(title, name) {
  const firstLine = document.createElement("span");
  const secondLine = document.createElement("span");
  const characters = [];
  firstLine.className = "hero-title__line";
  secondLine.className = "hero-title__line home-hero__preposition";
  firstLine.setAttribute("aria-hidden", "true");
  secondLine.setAttribute("aria-hidden", "true");

  [["Hi,", "I'm", `${name}.`]].forEach((words) => {
    words.forEach((word, index) => {
      if (index > 0) firstLine.append(document.createTextNode(" "));
      appendWord(firstLine, word, characters);
    });
  });
  ["I", "am", "a"].forEach((word, index) => {
    if (index > 0) secondLine.append(document.createTextNode(" "));
    appendWord(secondLine, word, characters);
  });

  title.setAttribute("aria-label", `Hi, I'm ${name}. I am a`);
  title.replaceChildren(firstLine, document.createElement("br"), secondLine);
  return characters;
}

function setRole(card, current, counter, roles, index) {
  const role = roles[index];
  current.textContent = role;
  card.setAttribute("aria-label", role);
  card.setAttribute("aria-live", "polite");
  counter.textContent = `${String(index + 1).padStart(2, "0")} / ${String(roles.length).padStart(2, "0")}`;
}

export function initHeroAnimations({
  hero,
  config,
  gsap,
  ScrollTrigger,
  scene,
  reducedMotion,
}) {
  const title = hero.querySelector("#home-title");
  const copy = hero.querySelector(".home-hero__copy");
  const tagline = copy.querySelector("[data-config='tagline']");
  const metadata = copy.querySelector(".profile-meta");
  const roleCard = hero.querySelector("#hero-role-flip");
  const roleCurrent = hero.querySelector("#hero-role-current");
  const roleNext = hero.querySelector("#hero-role-next");
  const roleCounter = hero.querySelector("#hero-role-counter");
  const aside = hero.querySelector(".home-hero__aside");
  const portrait = hero.querySelector("#hero-portrait");
  const portraitImage = hero.querySelector("#hero-portrait-image");
  const actions = hero.querySelector(".home-hero__actions");
  const settings = config.heroExperience;
  const roles = config.heroRoles;

  if (!title || !copy || !tagline || !roleCard || !roleCurrent || !roleCounter || !settings || !roles.length) {
    throw new Error("The hero animation requires the existing identity, role, and config elements.");
  }

  const shapeForRole = (role) => settings.roleShapes[role];
  let roleIndex = 0;
  let roleTimer;
  let roleTween;
  let entranceTimeline;
  let idleTween;
  let scrollFade;
  let sceneScrollTrigger;
  let roleObserver;
  let heroVisible = true;
  let active = true;
  let disposed = false;
  const eventOptions = { passive: true };

  setRole(roleCard, roleCurrent, roleCounter, roles, roleIndex);
  roleNext.textContent = "";
  scene?.setShape(shapeForRole(roles[roleIndex]));

  const characters = reducedMotion ? [] : buildAnimatedTitle(title, config.name);
  const restoreVisibleState = () => {
    gsap.set(characters, {
      autoAlpha: 1,
      yPercent: 0,
      rotateX: 0,
      clearProps: "transform",
    });
    gsap.set([tagline, metadata, aside, actions], {
      autoAlpha: 1,
      clearProps: "transform,filter",
    });
    gsap.set([portrait, portraitImage], {
      autoAlpha: 1,
      clearProps: "transform",
    });
  };
  gsap.killTweensOf([title, tagline, metadata, aside, actions, portrait, portraitImage]);

  if (!reducedMotion) {
    gsap.set(characters, {
      autoAlpha: 0,
      yPercent: 110,
      rotateX: -26,
      transformOrigin: "50% 100%",
      force3D: true,
    });
    gsap.set([tagline, metadata, aside, actions], {
      autoAlpha: 0,
      y: 16,
      filter: "blur(7px)",
    });
  }

  const scheduleRole = () => {
    window.clearTimeout(roleTimer);
    if (disposed || !active || reducedMotion || document.hidden || !heroVisible) return;
    roleTimer = window.setTimeout(() => {
      const nextIndex = (roleIndex + 1) % roles.length;
      const role = roles[nextIndex];
      const roleCharacters = Array.from(role);
      const progress = { value: 0 };
      roleCard.setAttribute("aria-live", "off");
      scene?.beginMorph(shapeForRole(role));
      roleTween?.kill();
      roleTween = gsap.to(progress, {
        value: 1,
        duration: settings.timing.roleMorph,
        ease: "power2.inOut",
        onUpdate: () => {
          const resolved = Math.floor(progress.value * roleCharacters.length);
          roleCurrent.textContent = roleCharacters.map((character, index) => {
            if (character === " " || index < resolved) return character;
            return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          }).join("");
          scene?.setMorphProgress(progress.value);
        },
        onComplete: () => {
          roleIndex = nextIndex;
          setRole(roleCard, roleCurrent, roleCounter, roles, roleIndex);
          scene?.finishMorph();
          scheduleRole();
        },
      });
    }, settings.timing.roleInterval);
  };

  const onVisibilityChange = () => {
    if (document.hidden || !active) {
      window.clearTimeout(roleTimer);
      roleTween?.kill();
      roleTween = undefined;
    } else {
      scheduleRole();
    }
  };

  if (!reducedMotion && "IntersectionObserver" in window) {
    roleObserver = new IntersectionObserver(([entry]) => {
      heroVisible = entry.isIntersecting;
      if (heroVisible) scheduleRole();
      else window.clearTimeout(roleTimer);
    }, { threshold: 0.02 });
    roleObserver.observe(hero);
  }
  document.addEventListener("visibilitychange", onVisibilityChange);

  if (!reducedMotion && ScrollTrigger) {
    sceneScrollTrigger = ScrollTrigger.create({
      trigger: hero,
      start: "top top",
      end: "bottom top",
      onUpdate: (trigger) => scene?.setScrollProgress(trigger.progress),
    });
    scrollFade = gsap.fromTo([copy, aside], {
      y: 0,
      autoAlpha: 1,
    }, {
      y: -64,
      autoAlpha: 0,
      ease: "none",
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: "bottom top",
        scrub: 0.55,
      },
    });
  }

  const attachPortraitEffects = () => {
    if (reducedMotion || !portrait || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    gsap.set(portrait, { transformPerspective: 900, transformOrigin: "center center" });
    idleTween = gsap.to(portrait, {
      y: -6,
      duration: settings.timing.portraitFloat,
      ease: "sine.inOut",
      repeat: -1,
      yoyo: true,
    });
    const onPortraitMove = (event) => {
      const bounds = portrait.getBoundingClientRect();
      const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
      const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
      gsap.to(portrait, {
        rotateX: -y * 5,
        rotateY: x * 7,
        duration: 0.28,
        ease: "power2.out",
        overwrite: "auto",
      });
      portrait.style.setProperty("--glare-x", `${50 + x * 30}%`);
      portrait.style.setProperty("--glare-y", `${50 + y * 30}%`);
      portrait.style.setProperty("--glare-opacity", "0.24");
    };
    const onPortraitLeave = () => {
      gsap.to(portrait, { rotateX: 0, rotateY: 0, duration: 0.5, ease: "power2.out" });
      portrait.style.setProperty("--glare-opacity", "0");
    };
    portrait.addEventListener("pointermove", onPortraitMove, eventOptions);
    portrait.addEventListener("pointerleave", onPortraitLeave);
    disposers.push(() => {
      portrait.removeEventListener("pointermove", onPortraitMove);
      portrait.removeEventListener("pointerleave", onPortraitLeave);
      portrait.style.removeProperty("--glare-x");
      portrait.style.removeProperty("--glare-y");
      portrait.style.removeProperty("--glare-opacity");
    });
  };

  const disposers = [];
  const attachMagneticButtons = () => {
    if (reducedMotion || !window.matchMedia("(min-width: 768px) and (hover: hover) and (pointer: fine)").matches) return;
    hero.querySelectorAll(".hero-cta").forEach((button) => {
      let origin;
      const onMove = (event) => {
        if (!origin) {
          const bounds = button.getBoundingClientRect();
          origin = { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2 };
        }
        gsap.to(button, {
          x: (event.clientX - origin.x) * settings.speed.magnetic,
          y: (event.clientY - origin.y) * settings.speed.magnetic,
          duration: 0.24,
          ease: "power2.out",
          overwrite: "auto",
        });
      };
      const onLeave = () => {
        origin = undefined;
        gsap.to(button, { x: 0, y: 0, duration: 0.42, ease: "elastic.out(1, 0.55)" });
      };
      button.addEventListener("pointermove", onMove, eventOptions);
      button.addEventListener("pointerleave", onLeave);
      button.addEventListener("blur", onLeave);
      disposers.push(() => {
        button.removeEventListener("pointermove", onMove);
        button.removeEventListener("pointerleave", onLeave);
        button.removeEventListener("blur", onLeave);
      });
    });
  };

  attachPortraitEffects();
  attachMagneticButtons();

  return {
    dispose() {
      if (disposed) return;
      disposed = true;
      active = false;
      window.clearTimeout(roleTimer);
      roleTween?.kill();
      entranceTimeline?.kill();
      idleTween?.kill();
      scrollFade?.scrollTrigger?.kill();
      scrollFade?.kill();
      sceneScrollTrigger?.kill();
      roleObserver?.disconnect();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      disposers.splice(0).forEach((dispose) => dispose());
      gsap.killTweensOf([
        title,
        tagline,
        metadata,
        aside,
        actions,
        portrait,
        portraitImage,
        ...hero.querySelectorAll(".hero-cta"),
      ]);
      restoreVisibleState();
    },
    setActive(value) {
      if (disposed || active === value) return;
      active = value;
      if (active) {
        entranceTimeline?.resume();
        idleTween?.resume();
        scheduleRole();
      } else {
        window.clearTimeout(roleTimer);
        roleTween?.kill();
        roleTween = undefined;
        setRole(roleCard, roleCurrent, roleCounter, roles, roleIndex);
        scene?.setShape(shapeForRole(roles[roleIndex]));
        entranceTimeline?.pause();
        idleTween?.pause();
      }
    },
    playEntrance() {
      if (reducedMotion) return;
      entranceTimeline = gsap.timeline({
        onComplete() {
          restoreVisibleState();
          scheduleRole();
        },
        onInterrupt: restoreVisibleState,
      });
      entranceTimeline.to(characters, {
        autoAlpha: 1,
        yPercent: 0,
        rotateX: 0,
        duration: settings.timing.characterReveal,
        stagger: settings.timing.characterStagger,
        ease: "power3.out",
      }, 0);
      entranceTimeline.to(tagline, {
        autoAlpha: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.68,
        ease: "power2.out",
      }, 0.46);
      entranceTimeline.to(metadata, {
        autoAlpha: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.5,
        ease: "power2.out",
      }, 0.63);
      entranceTimeline.to(aside, {
        autoAlpha: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.7,
        ease: "power2.out",
      }, 0.24);
      entranceTimeline.to(actions, {
        autoAlpha: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.55,
        ease: "power2.out",
      }, 0.78);
    },
  };
}
