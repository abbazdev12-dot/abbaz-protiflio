/**
 * config.js – Portfolio Content Configuration
 *
 * Single source of truth for portfolio identity, contact links,
 * abilities, skills, projects, and learning timeline.
 * Edit fields marked "EDIT HERE" before publishing.
 */

import helvetikerBoldUrl from "three/examples/fonts/helvetiker_bold.typeface.json?url";

const videoAssetUrls = {
  ...import.meta.glob("../../hacking/*.mp4", {
    eager: true,
    import: "default",
    query: "?url",
  }),
  ...import.meta.glob("../../trading/*.mp4", {
    eager: true,
    import: "default",
    query: "?url",
  }),
};
const videoAssetByFilename = new Map(
  Object.entries(videoAssetUrls).map(([path, url]) => [path.split("/").at(-1), url]),
);

function archiveVideo(folder, filename, title, category, description, duration, date) {
  const id = filename.replace(/\.mp4$/i, "");
  const src = videoAssetByFilename.get(filename);
  if (!src) throw new Error(`Missing video asset "${filename}" in hacking/ or trading/.`);
  return {
    id,
    title,
    originalFilename: filename,
    src,
    archiveFolder: folder,
    category,
    description,
    duration,
    ...(date ? { date } : {}),
  };
}

const sharedTechArchive = [
  archiveVideo("tech", "VID_20261116_182749_791.mp4", "Late-night laptop lock screen", "workstation", "A laptop lock screen and keyboard appear in a late-night desk clip.", 22.832),
  archiveVideo("tech", "VID_20261116_182757_610.mp4", "Circuit board project in progress", "hardware-experiment", "Hand-assembled circuit boards with lit components appear under an “Under Construction” caption.", 20),
  archiveVideo("tech", "VID_20261116_183011_808.mp4", "Code and terminal windows", "software", "Several code or command windows are visible across screens; the exact work is not legible.", 20.155),
  archiveVideo("tech", "VID_20261116_182923_791.mp4", "Laptop with terminal window", "software", "A laptop display shows a text interface beside a keyboard.", 20.155),
  archiveVideo("tech", "VID_20261117_031221_906.mp4", "Desktop and laptop workstation", "hardware", "A workstation scene shows computer displays and input devices.", 20.155),
  archiveVideo("tech", "VID20261116200220.mp4", "AI-assisted code session", "software", "A code editor displays assistant messages and project-file edits.", 12.109),
  archiveVideo("tech", "VID_20261116_182932_335.mp4", "Browser on laptop", "software", "A laptop browser displays a YouTube page and search interface.", 45.047),
  archiveVideo("tech", "VID_20261116_182714_906.mp4", "Dart code editor", "software", "A source file in a Dart project is open in a code editor.", 8.173),
  archiveVideo("tech", "VID_20261116_183015_423.mp4", "Multi-screen software session", "software", "Several screens show application windows and text in a dark workstation.", 20.155),
  archiveVideo("tech", "18140487877622952.mp4", "Block-based coding on laptop", "software", "A laptop displays a block-based programming interface.", 13.141),
  archiveVideo("tech", "VID_20261116_182919_008.mp4", "Multi-device code setup", "software", "Multiple illuminated displays show software and text interfaces.", 20.155),
  archiveVideo("tech", "VID_20261116_182912_698.mp4", "Laptop command window", "software", "A laptop and external keyboard are shown beside a blue command window.", 20.155),
  archiveVideo("tech", "VID_20261116_182720_660.mp4", "Intel Core i7 processor", "hardware", "An Intel Core i7 processor package is shown in a desk scene.", 20.155),
  archiveVideo("tech", "VID_20261116_182726_961.mp4", "System information screen", "operating-systems", "A blue system interface with configuration text is visible; the exact tool is unclear.", 23.174),
  archiveVideo("unsorted", "VID_20261116_183002_134.mp4", "Home-lab PC setup", "operating-systems", "Windows setup and installer screens appear alongside a caption about a PC home lab.", 20.155),
  archiveVideo("unsorted", "VID_20261116_182815_739.mp4", "Terminal session", "software", "A terminal window shows scrolling command output; the specific task is not identifiable.", 22.245),
  archiveVideo("unsorted", "VID_20261116_183019_289.mp4", "VS Code development session", "software", "VS Code shows project files and coding-assistant work; the task is only partly legible.", 10.403),
  archiveVideo("unsorted", "VID_20261116_182957_469.mp4", "PC build from salvage", "hardware", "RAM modules and a laptop appear beneath a caption about building a PC and home lab.", 20.155),
];

export const videoArchive = {
  hacking: sharedTechArchive,
  tech: sharedTechArchive,
  trading: [
    archiveVideo("trading", "18135566914741063.mp4", "XAUUSD chart reference", "market-analysis", "A chart and XAUUSD reference appear in a trading-related screen capture.", 20.016),
    archiveVideo("trading", "18080380661392454.mp4", "Market chart and notes", "market-analysis", "A market chart appears alongside on-screen notes.", 13.952),
    archiveVideo("trading", "VID_20261116_073154_626.mp4", "XAUUSD analysis screen", "market-analysis", "A trading-related screen with XAUUSD text and chart imagery.", 34.458),
    archiveVideo("trading", "VID_20261116_183156_951.mp4", "Trading platform view", "trading-platform", "A recorded view of a trading platform; no return or outcome is asserted.", 31.167),
    archiveVideo("trading", "VID_20261116_073206_982.mp4", "Market chart post", "market-analysis", "A chart is shown with a caption and messaging overlays.", 13.978),
    archiveVideo("trading", "VID_20261113_183114_524.mp4", "Trading platform view", "trading-platform", "A recorded view of a trading platform; no return or outcome is asserted.", 31.167),
    archiveVideo("trading", "18109344038209880.mp4", "Gold chart reference", "market-analysis", "A chart appears with a caption referring to gold.", 20.13),
    archiveVideo("trading", "VID_20261116_183206_939.mp4", "Chart screenshot", "market-analysis", "A phone screen capture with market chart imagery.", 14.116),
    archiveVideo("trading", "18029545016883475.mp4", "Break-even chart note", "journal-review", "A chart is shown with a note mentioning a break-even decision.", 20.13),
    archiveVideo("trading", "VID_20261116_073202_438.mp4", "Chart and message collage", "market-analysis", "A chart and messaging overlays appear in a trading-related screen capture.", 20.155),
    archiveVideo("trading", "18179313193453354.mp4", "Market chart video", "market-analysis", "A chart interface and trading-related text are visible.", 38.103),
    archiveVideo("unsorted", "18047265038824837.mp4", "XAUUSD chart and trade log", "market-analysis", "An XAUUSD chart appears alongside a trade record; no performance result is asserted.", 20.13),
    archiveVideo("unsorted", "VID_20261116_183149_891.mp4", "MetaTrader 5 order screen", "trading-platform", "A MetaTrader 5 screen shows account and EUR/USD order details; no result is inferred.", 19.933),
  ],
  me: [
    archiveVideo("unsorted", "VID_20261116_182741_334.mp4", "NASA STEM registration process", "learning-journey", "A captured email shows a NASA STEM registration and consent process; no acceptance is shown.", 17.09),
    archiveVideo("unsorted", "VID_20261116_182928_322.mp4", "STEM parent-consent email", "learning-journey", "An email screen explains parent consent for a STEM activity; no acceptance is shown.", 20.155),
    archiveVideo("tech", "VID_20261116_183127_225.mp4", "Late-night desk moment", "behind-the-scenes", "A laptop, keyboard, and book appear with a “Finally” caption.", 7.694),
  ],
  unsorted: [
    archiveVideo("unsorted", "VID_20261116_182803_495.mp4", "Mobile shooter gameplay edit", "unclassified", "A mobile shooter game appears with an on-screen caption and music; no personal context is visible.", 17.322),
    archiveVideo("unsorted", "VID_20261116_183006_125.mp4", "PC clip with Tor and Kraken text", "unclassified", "A computer-hardware clip includes Tor and Kraken references, but no security or technical activity is identifiable.", 24.381),
    archiveVideo("unsorted", "VID-20261116-WA0064.mp4", "Dark story clip", "unclassified", "The available preview is too dark to identify the subject.", 4.104),
    archiveVideo("unsorted", "VID_20261116_182706_654.mp4", "Small infographic on dark background", "unclassified", "A small bar graphic appears in a mostly black frame; its topic cannot be established.", 60.14),
    archiveVideo("unsorted", "VID_20261116_182951_945.mp4", "Captioned room clip", "unclassified", "A blurry room scene shows only the partial caption “I HAVE”; its context is unclear.", 12.288),
    archiveVideo("tech", "VID_20261116_182832_852.mp4", "YouTube screen capture", "unclassified", "A YouTube page appears on a laptop, without enough context to identify a specific technology project or personal story.", 11.424),
  ],
};

const allArchiveVideos = Object.values(videoArchive).flat();
const archiveVideoByFilename = new Map(
  allArchiveVideos.map((item) => [item.originalFilename, item]),
);
const wallSizes = ["wide", "square", "tall", "square", "tall", "wide", "square", "tall"];

function createDoorVideo(filename, index, archiveItem = archiveVideoByFilename.get(filename)) {
  if (!archiveItem?.src) throw new Error(`Missing video archive entry for "${filename}".`);
  return {
    title: archiveItem?.title || `Recording ${String(index + 1).padStart(2, "0")}`,
    src: archiveItem.src,
    ...(archiveItem?.thumbnail ? { poster: archiveItem.thumbnail } : {}),
    size: wallSizes[index % wallSizes.length],
    description: archiveItem?.description || "",
    category: archiveItem.category || archiveItem.archiveFolder,
    originalFilename: filename,
  };
}

const archiveFilenames = [...new Set(allArchiveVideos.map((item) => item.originalFilename))];

// These larger originals remain unchanged; compress VID20261116200220.mp4 (30.4 MB),
// VID_20261116_182932_335.mp4 (6.8 MB), and other multi-megabyte clips for previews later.
const wallDoors = [
  {
    id: "hacking",
    title: "HACKING",
    videos: videoArchive.hacking.map((item, index) =>
      createDoorVideo(item.originalFilename, index, item)),
  },
  {
    id: "tech",
    title: "TECH",
    videos: archiveFilenames
      .filter((filename) => allArchiveVideos.some(
        (item) => item.originalFilename === filename && item.archiveFolder === "tech",
      ))
      .map((filename, index) => createDoorVideo(filename, index)),
  },
  {
    id: "trading",
    title: "TRADING",
    videos: archiveFilenames
      .filter((filename) => allArchiveVideos.some(
        (item) => item.originalFilename === filename && item.archiveFolder === "trading",
      ))
      .map((filename, index) => createDoorVideo(filename, index)),
  },
  {
    id: "me",
    title: "ME",
    videos: videoArchive.me.map((item, index) =>
      createDoorVideo(item.originalFilename, index, item)),
  },
];

export const portfolioConfig = {
  doors: wallDoors,
  // ── Identity & Hero ─────────────────────────────────────────────
  name: "ABBAS.P.A",
  age: 25,
  experienceLevel: "Intermediate",
  heroRoles: ["Full Stack Developer", "Forex Trader", "Ethical Hacker", "Futures Trader"],
  tagline: "I break systems, build them, and trade the markets.",
  heroExperience: {
    colors: {
      background: "#070b14",
      foreground: "#e9f4ff",
      cyan: "#5de1ff",
      blue: "#4b91f1",
      violet: "#8b5cf6",
    },
    shapeColors: {
      chart: "#5de1ff",
      shield: "#a68aff",
      network: "#66a9ff",
    },
    particleCount: { desktop: 1800, mobile: 520 },
    roleShapes: {
      "Forex Trader": "chart",
      "Futures Trader": "chart",
      "Ethical Hacker": "shield",
      "Full Stack Developer": "network",
    },
    timing: {
      loader: 1.6,
      characterReveal: 0.48,
      characterStagger: 0.028,
      roleInterval: 2100,
      roleMorph: 0.7,
      portraitFloat: 3.2,
    },
    speed: {
      drift: 0.22,
      parallax: 0.16,
      magnetic: 0.14,
    },
    cameraDistance: 8,
    scrollDepth: 2.5,
  },
  photoUrl: "/photo/abbas.jpg",
  avatarFallback: "robot",
  fontUrl: helvetikerBoldUrl,

  // ── Contact & Socials ───────────────────────────────────────────
  email: "4bbazpa@gmail.com",
  hire: {
    email: "4bbazpa@gmail.com",
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
  },
  resumeUrl: "", // EDIT HERE: Add a public resume PDF URL or local path.
  socials: {
    github: "", // EDIT HERE: Add the GitHub profile URL.
    linkedin: "", // EDIT HERE: Add the LinkedIn profile URL.
    x: "", // EDIT HERE: Add the X profile URL.
    instagram: "https://www.instagram.com/xyr,q7/",
  },

  // ── Availability Status ─────────────────────────────────────────
  status: {
    availability: "Available for new work",
    workMode: "Remote-first, worldwide",
    heading: "Available for work",
  },

  // ── Navigation ──────────────────────────────────────────────────
  footerLinks: [
    { label: "Projects", href: "#projects" },
    { label: "Home", href: "#home" },
    { label: "Contact", href: "#contact" },
  ],

  // ── Ability Card ────────────────────────────────────────────────
  abilityCard: {
    title: "My ability card",
    description: "A work in progress across four areas.",
    matrix: [
      { label: "Hacking", value: 82, placeholder: true },
      { label: "Full-Stack", value: 88, placeholder: true },
      { label: "Forex", value: 72, placeholder: true },
      { label: "Futures", value: 64, placeholder: true },
      { label: "Design", value: 76, placeholder: true },
      { label: "Systems", value: 84, placeholder: true },
    ],
    items: [
      { title: "Forex Trading", detail: "Market structure, risk rules, and journaling." },
      {
        title: "Web Developer",
        skillTitle: "Full Stack Development",
        detail: "Responsive interfaces, APIs, and databases.",
      },
      { title: "Ethical Hacking", detail: "Authorized labs, CTFs, and responsible disclosure." },
      {
        title: "Vibe Coder",
        detail: "Exploring fast, idea-led coding and small creative prototypes.",
      },
    ],
  },

  // ── Skills & Collections ────────────────────────────────────────
  skills: [
    {
      title: "Ethical Hacking",
      icon: "⌘",
      description:
        "Authorized web application testing, security research in personal labs and CTFs, and responsible disclosure.",
      tags: ["OWASP Top 10", "Recon", "Burp Suite", "Nmap", "Wireshark"],
      color: "#22c55e",
      doorDetail: ["Authorized labs and CTFs", "Recon, findings and fixes", "Responsible disclosure"],
      world: {
        title: "ETHICAL HACKING",
        subtitle: "Security learning grounded in authorized labs, careful evidence, and responsible fixes.",
        accent: "#22c55e",
        process: [
          "Define an authorized scope",
          "Practice in local labs and CTFs",
          "Document findings and evidence",
          "Apply and verify defensive fixes",
          "Share responsible learning notes",
        ],
        showcase: {
          type: "network",
          title: "Authorized lab map",
          caption: "A conceptual view of a controlled learning workflow.",
          status: "AUTHORIZED LAB",
          items: ["Local lab", "Defined scope", "Finding", "Remediation"],
        },
      },
      collection: {
        title: "Security learning archive",
        description: "Videos are included only when their security-learning subject is identifiable.",
        media: videoArchive.hacking,
      },
    },
    {
      title: "Full Stack Development",
      icon: "</>",
      description:
        "Building and shipping accessible web experiences, APIs, and dependable data-backed applications.",
      tags: ["HTML/CSS/JS", "React", "Node.js", "REST APIs", "Databases"],
      color: "#3b82f6",
      doorDetail: ["Accessible interfaces", "REST API integration", "Database-backed features"],
      world: {
        title: "FULL STACK",
        subtitle: "Interfaces, services, and data designed as one connected experience.",
        accent: "#3b82f6",
        process: [
          "Shape the user experience",
          "Build reusable interface components",
          "Connect APIs and data",
          "Test responsive states",
          "Refine and document decisions",
        ],
        showcase: {
          type: "architecture",
          title: "Application architecture",
          caption: "A project structure to build toward, not a claim of shipped work.",
          status: "SYSTEM LAYERS",
          items: ["Interface", "API", "Database", "Deploy"],
        },
      },
      collection: {
        title: "Technology archive",
        description: "Computer hardware, operating systems, software, and experiments.",
        media: videoArchive.tech,
      },
    },
    {
      title: "Forex Trading",
      icon: "↗",
      description:
        "A process-first approach to currency markets built on structure, risk planning, backtesting, and careful journaling.",
      tags: ["Price Action", "Market Structure", "Risk Management", "Trade Journal"],
      color: "#8b5cf6",
      doorDetail: ["Trade journal", "Risk rules and review", "Process, never promises"],
      world: {
        title: "FOREX",
        subtitle: "A measured study of market structure, risk planning, and trade review.",
        accent: "#a7b0bd",
        process: [
          "Mark market structure",
          "Plan risk before a setup",
          "Wait for defined conditions",
          "Record the decision",
          "Review execution without outcome bias",
        ],
        showcase: {
          type: "candlesticks",
          title: "Market journal",
          caption: "Illustrative — fictional sample data, not live market information.",
          status: "ILLUSTRATIVE — NOT LIVE DATA",
          items: ["Structure", "Risk plan", "Journal review"],
        },
      },
      collection: {
        title: "Market study archive",
        description: "Screens and notes related to chart study and trading-platform use.",
        media: videoArchive.trading,
      },
    },
    {
      title: "Futures Trading",
      icon: "⌁",
      description:
        "Studying index and commodity futures with attention to order flow, position sizing, and discipline.",
      tags: ["Index Futures", "Commodities", "Order Flow", "Position Sizing"],
      color: "#ff3b00",
      doorDetail: ["Market structure", "Position sizing practice", "Discipline and review"],
      world: {
        title: "FUTURES",
        subtitle: "Studying structured futures markets with attention to risk and repeatable process.",
        accent: "#f59e0b",
        process: [
          "Study contract structure",
          "Map the session context",
          "Define risk and invalidation",
          "Journal decisions",
          "Review process and discipline",
        ],
        showcase: {
          type: "session",
          title: "Research workspace",
          caption: "Illustrative study view — no live prices or performance claims.",
          status: "ILLUSTRATIVE — RESEARCH ONLY",
          items: ["Session context", "Levels", "Risk plan", "Review"],
        },
      },
      collection: { title: "Futures collection", description: "Futures study and process material.", media: [] },
    },
  ],
  // ── Featured Projects ──────────────────────────────────────────
  projects: [
    {
      category: "Full Stack",
      filterCategories: ["web-development", "creative-work"],
      title: "Personal portfolio website",
      status: "Personal build · verify before publishing",
      problem: "A conventional portfolio does not reflect an interest in interactive 3D and motion design.",
      solution: "Build a responsive Three.js experience with GSAP choreography, Lenis scrolling, and an accessible 2D fallback.",
      result: "Current build includes a 3D intro, interactive scenes, config-driven content, and keyboard-accessible navigation.",
      stack: ["Three.js", "GSAP", "Lenis", "Vite"],
      previewStyle: "architecture",
      link: "", // EDIT HERE: Add the deployed project URL.
      screenshot: "", // EDIT HERE: Add a public screenshot URL or local image path.
    },
    {
      category: "Full Stack",
      filterCategories: ["web-development", "trading"],
      title: "Trade journal web app",
      status: "Placeholder · personal learning project",
      problem: "Trade notes and post-session reflections can be difficult to review consistently.",
      solution: "Plan a journal for logging trades, tagging setups, and recording mistakes with a React and Node.js stack.",
      result: "EDIT HERE: Replace with verified features and learning outcomes after building the app.",
      stack: ["React", "Node.js", "Database"],
      previewStyle: "journal",
      link: "", // EDIT HERE: Add the project URL when available.
      screenshot: "", // EDIT HERE: Add a screenshot when available.
    },
    {
      category: "Forex / Futures",
      filterCategories: ["web-development", "trading"],
      title: "Position-size and risk calculator",
      status: "Placeholder · personal learning project",
      problem: "Manual position-size calculations are easy to repeat inconsistently.",
      solution: "Plan a calculator using risk percentage, stop distance, and instrument inputs for XAUUSD and EURUSD.",
      result: "EDIT HERE: Add tested input coverage and learning outcomes; this is a calculation aid, not trading advice.",
      stack: ["JavaScript", "HTML", "CSS"],
      previewStyle: "formula",
      link: "", // EDIT HERE: Add the project URL when available.
      screenshot: "", // EDIT HERE: Add a screenshot when available.
    },
    {
      category: "Ethical Hacking",
      filterCategories: ["cybersecurity"],
      title: "Home lab pentest write-up",
      status: "Placeholder · authorized labs and CTFs only",
      problem: "Lab findings are more useful when scope, evidence, and remediation are documented clearly.",
      solution: "Plan a write-up for an intentionally vulnerable local target such as DVWA, covering recon, findings, and fixes.",
      result: "EDIT HERE: Add verified lab observations and remediation notes. Authorized labs and CTFs only.",
      stack: ["DVWA", "OWASP Top 10", "Burp Suite"],
      previewStyle: "field-notes",
      link: "", // EDIT HERE: Add the write-up URL when available.
      screenshot: "", // EDIT HERE: Add a sanitized lab screenshot when available.
    },
    {
      category: "Ethical Hacking",
      filterCategories: ["cybersecurity"],
      title: "CTF write-ups",
      status: "Placeholder · authorized labs and CTFs only",
      problem: "Challenge notes can preserve the reasoning and lessons from practice.",
      solution: "Plan three write-ups for web and basic cryptography challenges, explaining the method and mitigations where relevant.",
      result: "EDIT HERE: Replace with three challenges you solved and your own verified explanations. CTFs only.",
      stack: ["Web Security", "Basic Cryptography", "CTFs"],
      previewStyle: "cipher-notes",
      link: "", // EDIT HERE: Add the write-up collection URL when available.
      screenshot: "", // EDIT HERE: Add a sanitized challenge screenshot when available.
    },
    {
      category: "Mixed",
      filterCategories: ["web-development", "cybersecurity"],
      title: "Password strength and web-header checker",
      status: "Placeholder · personal learning project",
      problem: "Basic security checks are easier to learn from when results and limitations are clear.",
      solution: "Plan a JavaScript tool to give local password-strength feedback and inspect response headers for a supplied URL.",
      result: "EDIT HERE: Add tested checks, limitations, and learning outcomes after implementation.",
      stack: ["JavaScript", "Web APIs", "HTML", "CSS"],
      previewStyle: "signal",
      link: "", // EDIT HERE: Add the project URL when available.
      screenshot: "", // EDIT HERE: Add a screenshot when available.
    },
  ],
  // ── Journey & Milestones Timeline ─────────────────────────────
  timeline: [
    {
      year: 2026,
      title: "Building and exploring",
      bullets: [
        "Building a 3D portfolio and a trade journal.",
        "Learning futures trading through study and practice.",
      ],
    }, // EDIT HERE: Verify or replace this personal timeline entry.
    {
      year: 2025,
      title: "Full-stack projects and security labs",
      bullets: [
        "Worked on full-stack projects with React and Node.js.",
        "Practiced ethical hacking in authorized labs.",
      ],
    }, // EDIT HERE: Verify or replace this personal timeline entry.
    {
      year: 2024,
      title: "CTFs and market practice",
      bullets: [
        "Started CTFs and OWASP Top 10 practice.",
        "Practiced retail forex with a small account and explicit risk rules.",
      ],
    }, // EDIT HERE: Verify or replace this personal timeline entry.
    {
      year: 2023,
      title: "Price action and journaling",
      bullets: [
        "Learned price action and market structure.",
        "Began journaling trades and reviewing decisions.",
      ],
    }, // EDIT HERE: Verify or replace this personal timeline entry.
    {
      year: 2022,
      title: "First web projects",
      bullets: [
        "Learned JavaScript, HTML, and CSS.",
        "Built small web apps while learning the basics.",
      ],
    }, // EDIT HERE: Verify or replace this personal timeline entry.
    {
      year: 2021,
      title: "Starting with code and security",
      bullets: [
        "Started learning to code.",
        "Explored cybersecurity fundamentals.",
      ],
    }, // EDIT HERE: Verify or replace this personal timeline entry.
    {
      year: 2020,
      title: "First steps",
      bullets: [
        "Became interested in markets and computers.",
        "Started learning independently.",
      ],
    }, // EDIT HERE: Verify or replace this personal timeline entry.
  ],
};
