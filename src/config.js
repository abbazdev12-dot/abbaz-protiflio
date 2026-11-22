export default {
  site: {
    title: "ABBAS.P.A | Developer · Cybersecurity · Markets",
    description: "Personal portfolio of ABBAS.P.A — projects, technical learning, and experiments.",
    name: "ABBAS.P.A",
    tagline: "Developer · Cybersecurity · Markets",
    heroLine: "I build, explore, and learn how complex systems work.",
    supportingLine: "Projects, experiments, technical learning, and market research.",
    photo: {
      src: "/photo/abbas.jpg",
      srcSet: "/photo/abbas.jpg 1365w",
      alt: "Portrait of ABBAS.P.A"
    }
  },
  intro: {
    enabled: true,
    skipAfterFirstVisit: true,
    minimumDurationMs: 4500,
    subtitle: "developer · trader · ethical hacker",
    roles: ["developer", "cybersecurity learner", "market student"]
  },
  hero: {
    greeting: "Hi, I'm",
    name: "ABBAS.P.A",
    roles: [
      { label: "Forex Trader", shape: "chart" },
      { label: "Ethical Hacker", shape: "shield" },
      { label: "Full-Stack Dev", shape: "network" }
    ],
    rolePrefix: "I am a",
    tagline: "I break systems, build them, and trade the markets.",
    photo: {
      src: "/photo/abbas.jpg",
      srcSet: "/photo/abbas.jpg 1365w",
      alt: "Portrait of ABBAS.P.A"
    },
    ctas: {
      primary: { label: "More about me", href: "#doors" },
      secondary: { label: "Ability card", href: "#page" }
    },
    colors: {
      accent: "#00D9FF",
      accentAlt: "#76A9FF",
      violet: "#8177FF",
      coral: "#FF718A",
      cyan: "#73D9F5",
      background: "#05060D",
      fog: "#05060D",
      text: "#F0F0F7",
      muted: "#AAAFC3"
    },
    particles: {
      count: 4200,
      mobileCount: 1600,
      size: 2.2,
      mobileSize: 1.8,
      driftSpeed: 0.12,
      morphSpeed: 2.4,
      rotateSpeed: 0.045,
      parallaxStrength: 0.35,
      cameraDrift: 0.18
    },
    loader: {
      duration: 1700
    },
    scroll: {
      cameraDolly: 6.5,
      parallaxY: 140,
      fadeStart: 0.05,
      fadeEnd: 0.75
    },
    enableBloom: true,
    bloom: {
      strength: 0.55,
      radius: 0.6,
      threshold: 0.15
    }
  },
  doors: [
    {
      id: "cybersecurity",
      title: "Cybersecurity",
      navLabel: "Cybersecurity",
      number: "01",
      accent: "#9EAEA0",
      warmAccent: "#D49A62",
      archProfile: "pointed",
      doorWidth: 2.16,
      doorHeight: 4.12,
      description: "Learning how systems work, where they fail, and how to protect them.",
      shortDescription: "Understanding systems. Exploring security.",
      focusAreas: [
        "Cybersecurity",
        "Ethical hacking",
        "Security research",
        "Networking",
        "Linux"
      ],
      skillTitle: "Security research and learning",
      scopeNote: "Authorized labs, CTFs, defensive practice, and responsible disclosure only.",
      skills: [
        { label: "Networking fundamentals", level: "Learning" },
        { label: "Wireshark", level: "Practising" },
        { label: "Web security fundamentals", level: "Learning" }
      ],
      videos: []
    },
    {
      id: "tech",
      title: "TECH",
      navLabel: "TECH",
      number: "02",
      accent: "#8299A6",
      warmAccent: "#D59B62",
      archProfile: "squared",
      doorWidth: 2.24,
      doorHeight: 3.92,
      description: "Building interfaces, experimenting with tools, and turning ideas into working projects.",
      shortDescription: "Building. Breaking. Experimenting.",
      focusAreas: [
        "Technology",
        "Operating systems",
        "Hardware",
        "Software",
        "Technical experiments"
      ],
      skillTitle: "Development and technology",
      skills: [],
      videos: []
    },
    {
      id: "forex",
      title: "Forex",
      navLabel: "Forex",
      number: "03",
      accent: "#9B8580",
      warmAccent: "#D39A64",
      archProfile: "round",
      doorWidth: 2.4,
      doorHeight: 3.9,
      description: "Studying price action, market structure, execution, and risk discipline.",
      shortDescription: "Reading the markets. Mastering the process.",
      focusAreas: [
        "ICT concepts",
        "Market structure",
        "Liquidity",
        "Chart analysis",
        "Trading psychology",
        "Market studies"
      ],
      skillTitle: "Forex and futures market study",
      skills: [],
      disclaimer: "Educational content only; not financial advice. Illustrative sample data where marked.",
      videos: []
    },
    {
      id: "me",
      title: "ME",
      navLabel: "ME",
      number: "04",
      accent: "#B8865E",
      warmAccent: "#D6A06A",
      archProfile: "ellipse",
      doorWidth: 2.22,
      doorHeight: 4.2,
      description: "The person behind the projects, experiments, and learning process.",
      shortDescription: "The mind behind the experiments.",
      focusAreas: [
        "Personal identity",
        "My story",
        "Mindset",
        "Ambitions",
        "Learning journey",
        "Personal development"
      ],
      skillTitle: "About",
      skills: [],
      videos: []
    }
  ],
  timeline: [],
  projects: [],
  contact: {
    email: "REPLACE_WITH_PUBLIC_CONTACT_EMAIL",
    links: [],
    availability: "Open to learning, collaboration, and suitable opportunities."
  },
  ui: {
    soundDefault: "off",
    accentPrimary: "#8177FF",
    accentSecondary: "#FF718A"
  }
};
