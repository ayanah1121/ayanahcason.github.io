const header = document.querySelector(".site-header");
const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".site-nav");
const navLinks = [...document.querySelectorAll(".site-nav a")];
const sections = [...document.querySelectorAll("main section[id]")];
const reduceMotion = window.matchMedia
  ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
  : false;
const binaryOrbit = document.querySelector(".binary-orbit");
const primaryStar = document.querySelector(".binary-primary");
const secondaryStar = document.querySelector(".binary-secondary");
const solarSystem = document.querySelector(".solar-system");
const planets = [...document.querySelectorAll(".planet")];

document.getElementById("year").textContent = new Date().getFullYear();

menuToggle.addEventListener("click", () => {
  const open = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!open));
  nav.classList.toggle("is-open", !open);
});

const easeInOutQuart = (t) =>
  t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;

let scrollRaf = null;
const smoothScrollTo = (targetY) => {
  if (scrollRaf) cancelAnimationFrame(scrollRaf);
  const startY = window.scrollY;
  const dist = targetY - startY;
  const duration = Math.min(Math.max(Math.abs(dist) * 0.55, 380), 860);
  let startTime = null;
  const step = (ts) => {
    if (!startTime) startTime = ts;
    const p = Math.min((ts - startTime) / duration, 1);
    window.scrollTo(0, startY + dist * easeInOutQuart(p));
    if (p < 1) scrollRaf = requestAnimationFrame(step);
  };
  scrollRaf = requestAnimationFrame(step);
};

navLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    const href = link.getAttribute("href");
    const target = href && document.querySelector(href);
    nav.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    if (!target) return;
    e.preventDefault();
    const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - 72);
    if (reduceMotion) { window.scrollTo({ top, behavior: "instant" }); return; }
    smoothScrollTo(top);
  });
});

const activatePanel = (planet) => {
  const selected = planet.dataset.panel;
  planets.forEach((item) => {
    item.classList.toggle("is-active", item === planet);
  });
  document.querySelectorAll(".orbit-panel").forEach((panel) => {
    const active = panel.dataset.panelContent === selected;
    panel.hidden = !active;
    panel.classList.toggle("is-active", active);
  });
};

planets.forEach((planet) => {
  planet.addEventListener("click", () => activatePanel(planet));
});

if (solarSystem && planets.length) {
  const orbitalModels = {
    story: { a: 130, e: 0.2, angle: -12, period: 10500, phase: 0.4 },
    research: { a: 205, e: 0.24, angle: 18, period: 16500, phase: 2.45 },
    life: { a: 245, e: 0.18, angle: -24, period: 24000, phase: 4.5 },
  };
  let orbitElapsed = 0;
  let lastOrbitFrame = performance.now();
  let orbitPaused = false;
  const hoveredPlanets = new Set();
  const keyboardFocusedPlanets = new Set();
  let keyboardNavigation = false;

  const solvePlanetAnomaly = (meanAnomaly, eccentricity) => {
    let eccentricAnomaly = meanAnomaly;
    for (let i = 0; i < 5; i += 1) {
      eccentricAnomaly -=
        (eccentricAnomaly - eccentricity * Math.sin(eccentricAnomaly) - meanAnomaly) /
        (1 - eccentricity * Math.cos(eccentricAnomaly));
    }
    return eccentricAnomaly;
  };

  const setOrbitPaused = (paused) => {
    orbitPaused = paused;
    solarSystem.classList.toggle("is-paused", paused);
  };

  const syncOrbitPause = () => {
    setOrbitPaused(hoveredPlanets.size > 0 || keyboardFocusedPlanets.size > 0);
  };

  document.addEventListener("pointerdown", () => {
    keyboardNavigation = false;
    keyboardFocusedPlanets.clear();
    syncOrbitPause();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Tab" || event.key.startsWith("Arrow")) keyboardNavigation = true;
  });

  planets.forEach((planet) => {
    planet.addEventListener("pointerenter", () => {
      hoveredPlanets.add(planet);
      syncOrbitPause();
      activatePanel(planet);
    });
    planet.addEventListener("pointerleave", () => {
      hoveredPlanets.delete(planet);
      syncOrbitPause();
    });
    planet.addEventListener("focus", () => {
      if (keyboardNavigation) {
        keyboardFocusedPlanets.add(planet);
        syncOrbitPause();
      }
    });
    planet.addEventListener("blur", () => {
      keyboardFocusedPlanets.delete(planet);
      syncOrbitPause();
    });
  });

  const placePlanets = (time) => {
    const delta = Math.min(time - lastOrbitFrame, 50);
    if (!orbitPaused && !reduceMotion) orbitElapsed += delta;
    lastOrbitFrame = time;

    planets.forEach((planet) => {
      const model = orbitalModels[planet.dataset.orbit];
      const meanAnomaly =
        model.phase + ((reduceMotion ? model.period * 0.16 : orbitElapsed) / model.period) * Math.PI * 2;
      const eccentricAnomaly = solvePlanetAnomaly(meanAnomaly, model.e);
      const b = model.a * Math.sqrt(1 - model.e ** 2);
      const x = model.a * (Math.cos(eccentricAnomaly) - model.e);
      const y = b * Math.sin(eccentricAnomaly);
      const rotation = (model.angle * Math.PI) / 180;
      const rotatedX = x * Math.cos(rotation) - y * Math.sin(rotation);
      const rotatedY = x * Math.sin(rotation) + y * Math.cos(rotation);
      planet.classList.toggle("label-left", rotatedX > 95);
      planet.style.transform =
        `translate3d(calc(-50% + ${rotatedX}px), calc(-50% + ${rotatedY}px), 0)`;
    });

    if (!reduceMotion) requestAnimationFrame(placePlanets);
  };

  requestAnimationFrame(placePlanets);
}

const revealElements = [...document.querySelectorAll(".reveal")];
if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.13 }
  );
  revealElements.forEach((element) => revealObserver.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("is-visible"));
}

const publicationEndpoint =
  "https://api.semanticscholar.org/graph/v1/author/2280667155/papers" +
  "?limit=20&fields=title,authors,venue,journal,publicationDate,year,url";

const formatPublicationDate = (value, year) => {
  if (!value) return year ? `${year} Published` : "Publication date unavailable";
  const parts = value.split("-");
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]} Published` : value;
};

const renderPublications = (papers) => {
  const list = document.getElementById("publication-list");
  const status = document.getElementById("publication-status");
  if (!list || !papers.length) return;

  const sorted = papers.slice().sort((a, b) => {
    const dateA = a.publicationDate || `${a.year || 0}-01-01`;
    const dateB = b.publicationDate || `${b.year || 0}-01-01`;
    return dateB.localeCompare(dateA);
  });
  const fragment = document.createDocumentFragment();

  sorted.forEach((paper) => {
    const link = document.createElement("a");
    link.className = "paper-tile";
    link.href = paper.url;
    link.target = "_blank";
    link.rel = "noreferrer";

    const journal = document.createElement("span");
    journal.className = "paper-journal";
    const journalName = document.createElement("em");
    journalName.textContent =
      (paper.journal && paper.journal.name) || paper.venue || "Technical report";
    journal.appendChild(journalName);

    const title = document.createElement("strong");
    title.textContent = paper.title;

    const authors = document.createElement("span");
    authors.className = "paper-authors";
    authors.textContent = paper.authors.map((author) => author.name).join(" · ");

    const date = document.createElement("time");
    if (paper.publicationDate) date.dateTime = paper.publicationDate;
    date.textContent = formatPublicationDate(paper.publicationDate, paper.year);

    link.appendChild(journal);
    link.appendChild(title);
    link.appendChild(authors);
    link.appendChild(date);
    fragment.appendChild(link);
  });

  while (list.firstChild) list.removeChild(list.firstChild);
  list.appendChild(fragment);
  if (status) status.textContent = "Live publication records from Semantic Scholar.";
};

if ("fetch" in window) {
  fetch(publicationEndpoint)
    .then((response) => {
      if (!response.ok) throw new Error(`Semantic Scholar returned ${response.status}`);
      return response.json();
    })
    .then((payload) => renderPublications(payload.data || []))
    .catch(() => {
      const status = document.getElementById("publication-status");
      if (status) status.textContent = "Publication records from Semantic Scholar.";
    });
}

// Simplified two-body solution: both stars share one barycenter and orbital period.
// Their distances are inversely proportional to their masses.
if (binaryOrbit && primaryStar && secondaryStar) {
  const eccentricity = 0.12;
  const semiMajorAxis = 470;
  const semiMinorAxis = semiMajorAxis * Math.sqrt(1 - eccentricity ** 2);
  const primaryMass = 1.3;
  const secondaryMass = 1;
  const totalMass = primaryMass + secondaryMass;
  const primaryScale = secondaryMass / totalMass;
  const secondaryScale = primaryMass / totalMass;
  const period = 18000;
  const startTime = performance.now();

  const solveEccentricAnomaly = (meanAnomaly) => {
    let eccentricAnomaly = meanAnomaly;
    for (let i = 0; i < 5; i += 1) {
      eccentricAnomaly -=
        (eccentricAnomaly - eccentricity * Math.sin(eccentricAnomaly) - meanAnomaly) /
        (1 - eccentricity * Math.cos(eccentricAnomaly));
    }
    return eccentricAnomaly;
  };

  const placeBinaryStars = (time) => {
    const elapsed = reduceMotion ? period * 0.12 : time - startTime;
    const meanAnomaly = ((elapsed % period) / period) * Math.PI * 2;
    const eccentricAnomaly = solveEccentricAnomaly(meanAnomaly);
    const relativeX = semiMajorAxis * (Math.cos(eccentricAnomaly) - eccentricity);
    const relativeY = semiMinorAxis * Math.sin(eccentricAnomaly);

    primaryStar.style.transform =
      `translate(calc(-50% + ${-relativeX * primaryScale}px), calc(-50% + ${-relativeY * primaryScale}px))`;
    secondaryStar.style.transform =
      `translate(calc(-50% + ${relativeX * secondaryScale}px), calc(-50% + ${relativeY * secondaryScale}px))`;

    if (!reduceMotion) requestAnimationFrame(placeBinaryStars);
  };

  requestAnimationFrame(placeBinaryStars);
}

const nebula = document.querySelector(".nebula");
const starsLarge = document.querySelector(".stars-large");

const updateScrollEffects = () => {
  const y = window.scrollY;
  header.classList.toggle("is-scrolled", y > 28);

  if (!reduceMotion) {
    if (nebula) nebula.style.transform = `scale(1.08) translateY(${y * 0.032}px)`;
    if (starsLarge) starsLarge.style.transform = `translateY(${y * 0.016}px)`;
  }


  let current = "";
  sections.forEach((section) => {
    if (y >= section.offsetTop - 220) current = section.id;
  });
  navLinks.forEach((link) => {
    link.classList.toggle("is-active", link.getAttribute("href") === `#${current}`);
  });

  const timeline = document.querySelector(".timeline");
  if (timeline) {
    const rect = timeline.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, (window.innerHeight * 0.55 - rect.top) / rect.height));
    timeline.style.setProperty("--timeline-progress", `${progress * 100}%`);
  }
};

let ticking = false;
window.addEventListener(
  "scroll",
  () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        updateScrollEffects();
        ticking = false;
      });
      ticking = true;
    }
  },
  { passive: true }
);

updateScrollEffects();
