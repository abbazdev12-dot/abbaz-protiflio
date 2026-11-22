import "./hireModal.css";
import { portfolioConfig } from "./config/config.js";

const DEFAULT_HIRE = {
  email: "",
  endpoint: "",
  startingPrice: "",
  replyTime: "one business day",
  services: [
    "Website or web app",
    "Interactive 3D website",
    "Security audit (ethical hacking)",
    "Something else / a question",
  ],
  timelines: ["As soon as possible", "Within a month", "2-3 months", "Flexible"],
  budgets: ["Under $500", "$500-$1,500", "$1,500-$5,000", "$5,000+"],
};

const HIRE_MODAL_PAUSE = { setActive() {} };
let activeModal;

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function normalizeHireConfig(config) {
  const hire = config?.hire || {};
  return {
    ...DEFAULT_HIRE,
    ...hire,
    email: String(hire.email || config?.email || DEFAULT_HIRE.email).trim(),
    endpoint: String(hire.endpoint || "").trim(),
    startingPrice: String(hire.startingPrice || "").trim(),
    replyTime: String(hire.replyTime || DEFAULT_HIRE.replyTime).trim(),
    services: Array.isArray(hire.services) && hire.services.length ? hire.services : DEFAULT_HIRE.services,
    timelines: Array.isArray(hire.timelines) && hire.timelines.length ? hire.timelines : DEFAULT_HIRE.timelines,
    budgets: Array.isArray(hire.budgets) && hire.budgets.length ? hire.budgets : DEFAULT_HIRE.budgets,
  };
}

function getSummary(answers) {
  return [
    `Service: ${answers.service}`,
    `Project: ${answers.description}`,
    `Timeline: ${answers.timeline}`,
    `Budget: ${answers.budget}`,
    `Name: ${answers.name}`,
    `Email: ${answers.email}`,
    answers.contact ? `Instagram / WhatsApp: ${answers.contact}` : "",
  ].filter(Boolean).join("\n");
}

function getMailtoUrl(email, answers) {
  const query = new URLSearchParams({
    subject: `Project inquiry from ${answers.name}`,
    body: getSummary(answers),
  });
  return `mailto:${email}?${query.toString()}`;
}

function getFocusableElements(dialog) {
  return [...dialog.querySelectorAll(
    'button:not(:disabled), input:not(:disabled):not([tabindex="-1"]), textarea:not(:disabled), a[href]',
  )].filter((element) => !element.hidden && element.getClientRects().length > 0);
}

export function openHireModal({ config = portfolioConfig, lenis, sceneManager, opener } = {}) {
  if (activeModal) {
    activeModal.dialog.querySelector(".hire-modal__close")?.focus();
    return;
  }

  const hire = normalizeHireConfig(config);
  const controller = new AbortController();
  const { signal } = controller;
  const dialog = createElement("dialog", "hire-modal");
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-labelledby", "hire-modal-title");

  const header = createElement("header", "hire-modal__header");
  const eyebrow = createElement("p", "hire-modal__eyebrow");
  eyebrow.append(
    createElement("span", "", "HIRE ME"),
    createElement("span", "hire-modal__cursor", ""),
  );
  const closeButton = createElement("button", "hire-modal__close", "✕");
  closeButton.type = "button";
  closeButton.setAttribute("aria-label", "Close hire form");
  const title = createElement("h2", "hire-modal__title", "Tell me what you need built.");
  title.id = "hire-modal-title";
  const subtitle = createElement("p", "hire-modal__subtitle", "Five quick questions.");
  if (hire.startingPrice) {
    subtitle.append(document.createTextNode(` Projects typically start at ${hire.startingPrice}.`));
  }
  header.append(eyebrow, closeButton, title, subtitle);

  const progress = createElement("div", "hire-modal__progress");
  progress.setAttribute("role", "progressbar");
  progress.setAttribute("aria-label", "Form progress");
  progress.setAttribute("aria-valuemin", "1");
  progress.setAttribute("aria-valuemax", "5");
  const progressFill = createElement("span", "hire-modal__progress-fill");
  progress.append(progressFill);
  const progressMeta = createElement("div", "hire-modal__progress-meta");
  const progressLabel = createElement("span", "hire-modal__progress-label", "STEP 1/5");

  const form = createElement("form", "hire-modal__form");
  form.noValidate = true;
  const honeypotWrap = createElement("div", "hire-modal__honeypot");
  honeypotWrap.hidden = true;
  honeypotWrap.setAttribute("aria-hidden", "true");
  const honeypot = createElement("input");
  honeypot.type = "text";
  honeypot.name = "honeypot";
  honeypot.autocomplete = "off";
  honeypot.tabIndex = -1;
  honeypot.setAttribute("aria-hidden", "true");
  honeypotWrap.append(honeypot);
  const stepContent = createElement("div", "hire-modal__step-content");
  const status = createElement("p", "hire-modal__status");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  const messages = createElement("div", "hire-modal__messages");
  const fallbackLink = createElement("a", "hire-modal__fallback-link", "Open the email draft");
  fallbackLink.hidden = true;
  messages.append(status, fallbackLink);
  const footer = createElement("footer", "hire-modal__footer");
  const backButton = createElement("button", "hire-modal__back", "← Back");
  backButton.type = "button";
  const nextButton = createElement("button", "hire-modal__next", "Next ↗");
  nextButton.type = "submit";
  const replyNote = createElement("p", "hire-modal__reply-note", `I reply within ${hire.replyTime}.`);
  progressMeta.append(progressLabel, replyNote);
  footer.append(backButton, nextButton);
  form.append(honeypotWrap, stepContent, footer);
  dialog.append(header, progress, progressMeta, form, messages);

  const state = {
    dialog,
    controller,
    opener: opener instanceof HTMLElement ? opener : document.activeElement,
    lenis,
    sceneManager,
    wasLenisStopped: Boolean(lenis?.isStopped),
    bodyOverflow: document.body.style.overflow,
    htmlOverflow: document.documentElement.style.overflow,
    step: 0,
    answers: {
      service: "",
      description: "",
      timeline: "",
      budget: "",
      name: "",
      email: "",
      contact: "",
    },
    isLoading: false,
    timers: new Set(),
    focusFrame: 0,
  };
  activeModal = state;
  document.body.classList.add("hire-modal-open");
  document.body.style.overflow = "hidden";
  document.documentElement.style.overflow = "hidden";
  lenis?.stop();
  sceneManager?.setOverride(HIRE_MODAL_PAUSE);
  document.body.append(dialog);
  dialog.showModal();

  const setStatus = (message) => {
    status.textContent = message;
    fallbackLink.hidden = true;
    fallbackLink.removeAttribute("href");
  };

  const isStepValid = () => {
    if (state.step === 0) return Boolean(state.answers.service);
    if (state.step === 1) return Boolean(state.answers.description.trim());
    if (state.step === 2) return Boolean(state.answers.timeline);
    if (state.step === 3) return Boolean(state.answers.budget);
    const nameInput = stepContent.querySelector('[name="name"]');
    const emailInput = stepContent.querySelector('[name="email"]');
    return Boolean(state.answers.name.trim() && emailInput?.value.trim() && emailInput.checkValidity() && nameInput?.value.trim());
  };

  const updateProgress = () => {
    const currentStep = state.step + 1;
    progress.setAttribute("aria-valuenow", String(currentStep));
    progressLabel.textContent = `STEP ${currentStep}/5`;
    progressFill.style.transform = `scaleX(${currentStep / 5})`;
    backButton.hidden = state.step === 0;
  };

  const updateNextButton = () => {
    nextButton.disabled = state.isLoading || !isStepValid();
    nextButton.textContent = state.isLoading
      ? "Sending..."
      : state.step === 4 ? "Send request ↗" : "Next ↗";
  };

  const addRadioOptions = (container, key, legendText, values) => {
    const fieldset = createElement("fieldset", "hire-modal__fieldset");
    fieldset.append(createElement("legend", "hire-modal__question", legendText));
    const list = createElement("div", "hire-modal__options");
    values.forEach((value, index) => {
      const id = `hire-${key}-${index}`;
      const option = createElement("label", "hire-modal__option");
      const input = createElement("input");
      input.type = "radio";
      input.name = key;
      input.id = id;
      input.value = value;
      input.checked = state.answers[key] === value;
      input.addEventListener("change", () => {
        state.answers[key] = input.value;
        list.querySelectorAll(".hire-modal__option").forEach((item) => {
          item.classList.toggle("is-selected", item.querySelector("input").checked);
        });
        setStatus("");
        updateNextButton();
      }, { signal });
      option.classList.toggle("is-selected", input.checked);
      option.append(input, createElement("span", "hire-modal__option-dot"), createElement("span", "hire-modal__option-label", value));
      list.append(option);
    });
    fieldset.append(list);
    container.append(fieldset);
  };

  const renderStep = (focus = true) => {
    stepContent.replaceChildren();
    const current = createElement("section", "hire-modal__step hire-modal__step--entering");
    current.setAttribute("aria-label", `Step ${state.step + 1} of 5`);

    if (state.step === 0) {
      addRadioOptions(current, "service", "What do you need?", hire.services);
    } else if (state.step === 1) {
      const descriptionLabel = createElement("label", "hire-modal__question", "What are you building?");
      const textarea = createElement("textarea", "hire-modal__textarea");
      textarea.id = "hire-description";
      textarea.name = "description";
      textarea.maxLength = 600;
      textarea.rows = 5;
      textarea.required = true;
      textarea.placeholder = "A few details about your idea, goals, or problem...";
      textarea.value = state.answers.description;
      descriptionLabel.htmlFor = textarea.id;
      textarea.setAttribute("aria-describedby", "hire-description-count");
      const count = createElement("span", "hire-modal__counter", `${textarea.value.length}/600`);
      count.id = "hire-description-count";
      textarea.addEventListener("input", () => {
        state.answers.description = textarea.value;
        count.textContent = `${textarea.value.length}/600`;
        setStatus("");
        updateNextButton();
      }, { signal });
      current.append(descriptionLabel, textarea, count);
    } else if (state.step === 2) {
      addRadioOptions(current, "timeline", "When do you need it?", hire.timelines);
    } else if (state.step === 3) {
      addRadioOptions(current, "budget", "What is your budget?", hire.budgets);
    } else {
      current.append(createElement("p", "hire-modal__question", "Where can I reach you?"));
      const nameLabel = createElement("label", "hire-modal__field");
      nameLabel.append(createElement("span", "hire-modal__field-label", "NAME"));
      const nameInput = createElement("input", "hire-modal__input");
      nameInput.type = "text";
      nameInput.name = "name";
      nameInput.autocomplete = "name";
      nameInput.required = true;
      nameInput.value = state.answers.name;
      nameInput.placeholder = "Your name";
      nameInput.addEventListener("input", () => {
        state.answers.name = nameInput.value;
        setStatus("");
        updateNextButton();
      }, { signal });
      nameLabel.append(nameInput);

      const emailLabel = createElement("label", "hire-modal__field");
      emailLabel.append(createElement("span", "hire-modal__field-label", "EMAIL"));
      const emailInput = createElement("input", "hire-modal__input");
      emailInput.type = "email";
      emailInput.name = "email";
      emailInput.autocomplete = "email";
      emailInput.required = true;
      emailInput.value = state.answers.email;
      emailInput.placeholder = "you@example.com";
      emailInput.addEventListener("input", () => {
        state.answers.email = emailInput.value;
        setStatus("");
        updateNextButton();
      }, { signal });
      emailLabel.append(emailInput);

      const contactLabel = createElement("label", "hire-modal__field");
      contactLabel.append(createElement("span", "hire-modal__field-label", "INSTAGRAM / WHATSAPP (OPTIONAL)"));
      const contactInput = createElement("input", "hire-modal__input");
      contactInput.type = "text";
      contactInput.name = "contact";
      contactInput.autocomplete = "off";
      contactInput.value = state.answers.contact;
      contactInput.placeholder = "@handle or phone number";
      contactInput.addEventListener("input", () => {
        state.answers.contact = contactInput.value;
      }, { signal });
      contactLabel.append(contactInput);
      current.append(nameLabel, emailLabel, contactLabel);
    }

    stepContent.append(current);
    progress.hidden = state.step > 4;
    progressMeta.hidden = state.step > 4;
    footer.hidden = state.step > 4;
    updateProgress();
    updateNextButton();
    if (focus) {
      cancelAnimationFrame(state.focusFrame);
      state.focusFrame = requestAnimationFrame(() => {
        if (activeModal !== state) return;
        current.querySelector("input:not([type=hidden]), textarea")?.focus({ preventScroll: true });
      });
    }
  };

  const showSuccess = () => {
    setStatus(`Request received. I'll reply within ${hire.replyTime}.`);
    form.setAttribute("hidden", "");
    progress.hidden = true;
    progressMeta.hidden = true;
    const success = createElement("section", "hire-modal__success");
    success.setAttribute("aria-labelledby", "hire-success-title");
    const terminal = createElement("div", "hire-modal__terminal");
    terminal.setAttribute("aria-hidden", "true");
    const lines = [
      "> request received",
      "> encrypting payload... ok",
      "> delivered ✔",
    ];
    const terminalLines = lines.map(() => createElement("p", "hire-modal__terminal-line", ""));
    terminalLines.forEach((line) => terminal.append(line));
    const thankYou = createElement(
      "p",
      "hire-modal__thanks",
      `Thanks ${state.answers.name.trim()}. I'll reply within ${hire.replyTime}.`,
    );
    thankYou.id = "hire-success-title";
    const actions = createElement("div", "hire-modal__success-actions");
    const copyButton = createElement("button", "hire-modal__back", "Copy summary");
    copyButton.type = "button";
    copyButton.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(getSummary(state.answers));
        setStatus("Summary copied to clipboard.");
      } catch (error) {
        console.error("Could not copy the hire request summary.", error);
        setStatus("Could not copy automatically. Select and copy the request details manually.");
      }
    }, { signal });
    const doneButton = createElement("button", "hire-modal__next", "Close");
    doneButton.type = "button";
    doneButton.addEventListener("click", closeHireModal, { signal });
    actions.append(copyButton, doneButton);
    success.append(terminal, thankYou, actions);
    dialog.insertBefore(success, form);
    doneButton.focus({ preventScroll: true });
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      terminalLines.forEach((line, index) => { line.textContent = lines[index]; });
      return;
    }
    let lineIndex = 0;
    let characterIndex = 0;
    const typeNextCharacter = () => {
      if (activeModal !== state) return;
      const line = terminalLines[lineIndex];
      characterIndex += 1;
      line.textContent = lines[lineIndex].slice(0, characterIndex);
      if (characterIndex >= lines[lineIndex].length) {
        lineIndex += 1;
        characterIndex = 0;
      }
      if (lineIndex < lines.length) {
        const timer = window.setTimeout(typeNextCharacter, 22);
        state.timers.add(timer);
      }
    };
    const timer = window.setTimeout(typeNextCharacter, 180);
    state.timers.add(timer);
  };

  const showMailFallback = (message) => {
    state.isLoading = false;
    updateNextButton();
    status.textContent = message;
    fallbackLink.href = getMailtoUrl(hire.email, state.answers);
    fallbackLink.hidden = false;
    if (hire.email) {
      window.location.assign(fallbackLink.href);
    } else {
      setStatus("No email address is configured. Please contact me through the contact section.");
    }
  };

  const submitRequest = async () => {
    if (!isStepValid()) {
      setStatus("Please complete the required fields before sending.");
      return;
    }
    if (honeypot.value.trim()) {
      setStatus("This request could not be submitted.");
      return;
    }
    state.isLoading = true;
    setStatus("");
    updateNextButton();
    const payload = {
      ...state.answers,
      name: state.answers.name.trim(),
      email: state.answers.email.trim(),
      contact: state.answers.contact.trim(),
      honeypot: honeypot.value,
    };
    if (!hire.endpoint) {
      showMailFallback("Online requests are not configured. Opening a prefilled email draft instead.");
      return;
    }
    try {
      const response = await fetch(hire.endpoint, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal,
      });
      if (!response.ok) throw new Error(`Request failed with status ${response.status}.`);
      if (activeModal === state) showSuccess();
    } catch (error) {
      if (activeModal !== state) return;
      console.error("Could not submit the hire request online.", error);
      showMailFallback("The online request could not be sent. Opening a prefilled email draft instead.");
    }
  };

  const goToNextStep = () => {
    if (!isStepValid()) {
      setStatus("Please answer this question to continue.");
      return;
    }
    if (state.step === 4) {
      void submitRequest();
      return;
    }
    state.step += 1;
    setStatus("");
    renderStep();
  };

  const goToPreviousStep = () => {
    if (state.step === 0 || state.isLoading) return;
    state.step -= 1;
    setStatus("");
    renderStep();
  };

  closeButton.addEventListener("click", closeHireModal, { signal });
  backButton.addEventListener("click", goToPreviousStep, { signal });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    goToNextStep();
  }, { signal });
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeHireModal();
  }, { signal });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeHireModal();
  }, { signal });
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeHireModal();
      return;
    }
    if (event.key === "Tab") {
      const focusable = getFocusableElements(dialog);
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
      return;
    }
    if (
      ["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft"].includes(event.key) &&
      event.target.matches('input[type="radio"]')
    ) {
      const radios = [...event.target.closest("fieldset").querySelectorAll('input[type="radio"]')];
      const currentIndex = radios.indexOf(event.target);
      const direction = event.key === "ArrowDown" || event.key === "ArrowRight" ? 1 : -1;
      const nextIndex = (currentIndex + direction + radios.length) % radios.length;
      event.preventDefault();
      radios[nextIndex].checked = true;
      radios[nextIndex].dispatchEvent(new Event("change", { bubbles: true }));
      radios[nextIndex].focus();
      return;
    }
    if (event.key === "Enter" && !event.shiftKey && !event.target.matches("button")) {
      event.preventDefault();
      goToNextStep();
    }
  }, { signal });

  const cleanup = () => {
    if (activeModal !== state) return;
    activeModal = undefined;
    controller.abort();
    cancelAnimationFrame(state.focusFrame);
    state.timers.forEach((timer) => window.clearTimeout(timer));
    state.timers.clear();
    if (dialog.open) dialog.close();
    dialog.remove();
    document.body.classList.remove("hire-modal-open");
    document.body.style.overflow = state.bodyOverflow;
    document.documentElement.style.overflow = state.htmlOverflow;
    sceneManager?.setOverride(null);
    if (!state.wasLenisStopped) lenis?.start();
    if (state.opener instanceof HTMLElement && state.opener.isConnected) {
      state.opener.focus({ preventScroll: true });
    }
  };
  state.cleanup = cleanup;

  renderStep(false);
  if (opener instanceof HTMLElement) {
    state.opener = opener;
  }
  state.focusFrame = requestAnimationFrame(() => {
    if (activeModal === state) {
      stepContent.querySelector("input:not([type=hidden]), textarea")?.focus({ preventScroll: true });
    }
  });

}

export function closeHireModal() {
  activeModal?.cleanup?.();
}
