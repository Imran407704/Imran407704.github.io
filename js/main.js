/* ============================================================
   Interface behaviour
   ============================================================ */

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return map[character];
  });
}

let animate = null;

import("https://esm.sh/animejs@4.5.0")
  .then((anime) => {
    animate = anime.animate;
  })
  .catch(() => {
    console.warn("anime.js unavailable, motion falls back to CSS.");
  });

let lenis = null;

if (!reduceMotion.matches) {
  import("https://esm.sh/lenis@1.3.27")
    .then((module) => {
      lenis = new module.default({
        duration: 1.05,
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.5,
      });
      const raf = (time) => {
        lenis.raf(time);
        requestAnimationFrame(raf);
      };
      requestAnimationFrame(raf);
      if (document.body.style.overflow === "hidden") lenis.stop();
    })
    .catch(() => {
      console.warn("Lenis unavailable, native scrolling stays on.");
    });
}

/* ---------- anchors ---------- */

const scrollToTarget = (hash) => {
  if (!hash || hash === "#") return false;
  const element = document.querySelector(hash);
  if (!element) return false;
  if (lenis) {
    lenis.scrollTo(element, { offset: -96, duration: 1.2 });
  } else {
    const top = element.getBoundingClientRect().top + window.scrollY - 88;
    window.scrollTo({ top, behavior: reduceMotion.matches ? "auto" : "smooth" });
  }
  return true;
};

document.addEventListener("click", (event) => {
  const link = event.target.closest('a[href^="#"]');
  if (!link) return;
  const hash = link.getAttribute("href");
  if (scrollToTarget(hash)) {
    event.preventDefault();
    closeMobileMenu();
    if (dialog && dialog.open) dialog.close();
  }
});

/* ---------- nav state ---------- */

const navLinks = [...document.querySelectorAll("[data-nav]")];
const sections = ["work", "arsenal", "about", "broadcast", "contact"]
  .map((id) => document.getElementById(id))
  .filter(Boolean);

if ("IntersectionObserver" in window && sections.length) {
  const navObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        navLinks.forEach((link) => {
          link.classList.toggle("is-active", link.dataset.nav === id);
        });
      });
    },
    { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
  );
  sections.forEach((section) => navObserver.observe(section));
}

/* ---------- mobile menu ---------- */

const navToggle = document.getElementById("nav-toggle");
const mobileMenu = document.getElementById("mobile-menu");

function openMobileMenu() {
  if (!mobileMenu || !navToggle) return;
  mobileMenu.classList.add("is-open");
  mobileMenu.setAttribute("aria-hidden", "false");
  navToggle.setAttribute("aria-expanded", "true");
  navToggle.setAttribute("aria-label", "Close menu");
  document.body.style.overflow = "hidden";
  if (lenis) lenis.stop();
}

function closeMobileMenu() {
  if (!mobileMenu || !navToggle) return;
  if (!mobileMenu.classList.contains("is-open")) return;
  mobileMenu.classList.remove("is-open");
  mobileMenu.setAttribute("aria-hidden", "true");
  navToggle.setAttribute("aria-expanded", "false");
  navToggle.setAttribute("aria-label", "Open menu");
  document.body.style.overflow = "";
  if (lenis) lenis.start();
}

if (navToggle) {
  navToggle.addEventListener("click", () => {
    if (mobileMenu.classList.contains("is-open")) closeMobileMenu();
    else openMobileMenu();
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMobileMenu();
});

/* ---------- scroll progress ---------- */

const progressBar = document.getElementById("scroll-progress-bar");
let progressFrame = 0;

const updateProgress = () => {
  progressFrame = 0;
  if (!progressBar) return;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const value = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
  progressBar.style.transform = `scaleX(${value})`;
};

window.addEventListener(
  "scroll",
  () => {
    if (progressFrame) return;
    progressFrame = requestAnimationFrame(updateProgress);
  },
  { passive: true }
);
updateProgress();

/* ---------- reveal on scroll ---------- */

const revealItems = [...document.querySelectorAll(".reveal")];

if ("IntersectionObserver" in window && !reduceMotion.matches) {
  revealItems.forEach((item, index) => {
    const group = item.parentElement;
    const siblings = group ? [...group.querySelectorAll(":scope > .reveal")] : [item];
    const order = Math.max(siblings.indexOf(item), 0);
    item.style.setProperty("--delay", `${Math.min(order, 4) * 70}ms`);
    if (index > 60) item.style.setProperty("--delay", "0ms");
  });

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-in"));
}

/* ---------- tagline word reveal ---------- */

const tagline = document.getElementById("tagline");

if (tagline) {
  const words = tagline.textContent.trim().split(/\s+/);
  tagline.innerHTML = words
    .map((word) => `<span class="word">${escapeHtml(word)}</span>`)
    .join(" ");

  if (reduceMotion.matches) {
    [...tagline.querySelectorAll(".word")].forEach((word) => word.classList.add("is-lit"));
  } else if ("IntersectionObserver" in window) {
    const taglineObserver = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        [...tagline.querySelectorAll(".word")].forEach((word, index) => {
          window.setTimeout(() => word.classList.add("is-lit"), index * 42);
        });
        taglineObserver.disconnect();
      },
      { threshold: 0.35 }
    );
    taglineObserver.observe(tagline);
  }
}

/* ---------- counters ---------- */

const counters = [...document.querySelectorAll("[data-stat]")];

function runCounters() {
  counters.forEach((element) => {
    const end = Number.parseInt(element.textContent.replace(/[^\d]/g, ""), 10);
    if (!Number.isFinite(end)) return;
    if (!animate || reduceMotion.matches) {
      element.textContent = String(end);
      return;
    }
    const state = { value: 0 };
    animate(state, {
      value: end,
      duration: 1500,
      ease: "out(3)",
      onUpdate: () => {
        element.textContent = String(Math.round(state.value));
      },
    });
  });
}

if ("IntersectionObserver" in window) {
  const stats = document.querySelector(".hero-stats");
  if (stats) {
    const counterObserver = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        runCounters();
        counterObserver.disconnect();
      },
      { threshold: 0.4 }
    );
    counterObserver.observe(stats);
  }
} else {
  runCounters();
}

/* ---------- live GitHub telemetry ---------- */

async function loadGithubStats() {
  const cacheKey = "gh-stats-v2";
  let data = null;

  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) data = JSON.parse(cached);
  } catch (error) {
    data = null;
  }

  if (!data) {
    try {
      const [user, repos] = await Promise.all([
        fetch("https://api.github.com/users/Imran407704").then((response) => {
          if (!response.ok) throw new Error("user request failed");
          return response.json();
        }),
        fetch("https://api.github.com/users/Imran407704/repos?per_page=100").then((response) => {
          if (!response.ok) throw new Error("repo request failed");
          return response.json();
        }),
      ]);

      const stars = repos
        .filter((repo) => !repo.fork)
        .reduce((total, repo) => total + repo.stargazers_count, 0);

      data = {
        repos: user.public_repos,
        stars,
        followers: user.followers,
      };
      sessionStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (error) {
      return;
    }
  }

  const set = (key, value) => {
    if (!Number.isFinite(value)) return;
    const element = document.querySelector(`[data-stat="${key}"]`);
    if (!element) return;
    element.textContent = String(value);
  };

  set("repos", data.repos);
  set("stars", data.stars);
  set("followers", data.followers);

  counters.forEach((element) => {
    const end = Number.parseInt(element.textContent.replace(/[^\d]/g, ""), 10);
    if (Number.isFinite(end)) element.dataset.target = String(end);
  });
}

loadGithubStats();

/* ---------- glass spotlight and tilt ---------- */

const glassItems = [...document.querySelectorAll(".glass")];
const tiltItems = [...document.querySelectorAll(".tilt")];

if (finePointer.matches && !reduceMotion.matches) {
  glassItems.forEach((item) => {
    item.addEventListener("pointermove", (event) => {
      const rect = item.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      item.style.setProperty("--mx", `${x}%`);
      item.style.setProperty("--my", `${y}%`);
    });
  });

  tiltItems.forEach((item) => {
    item.addEventListener("pointermove", (event) => {
      const rect = item.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      item.style.setProperty("--rx", `${((0.5 - y) * 4).toFixed(2)}deg`);
      item.style.setProperty("--ry", `${((x - 0.5) * 5).toFixed(2)}deg`);
    });

    item.addEventListener("pointerleave", () => {
      item.style.setProperty("--rx", "0deg");
      item.style.setProperty("--ry", "0deg");
    });
  });
}

/* ---------- cursor ring ---------- */

const cursorRing = document.getElementById("cursor-ring");

if (cursorRing && finePointer.matches && !reduceMotion.matches) {
  const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const ring = { x: pointer.x, y: pointer.y };

  window.addEventListener(
    "pointermove",
    (event) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      cursorRing.classList.add("is-visible");
      const interactive = event.target.closest("a, button, input, .tilt, .glass");
      cursorRing.classList.toggle("is-active", Boolean(interactive));
    },
    { passive: true }
  );

  document.addEventListener("pointerleave", () => cursorRing.classList.remove("is-visible"));

  const tick = () => {
    ring.x += (pointer.x - ring.x) * 0.16;
    ring.y += (pointer.y - ring.y) * 0.16;
    cursorRing.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0)`;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* ---------- command palette ---------- */

const dialog = document.getElementById("command-menu");
const cmdInput = document.getElementById("cmd-input");
const cmdList = document.getElementById("cmd-list");
const cmdEmpty = document.getElementById("cmd-empty");
const cmdItems = cmdList ? [...cmdList.children] : [];
let cmdSelected = 0;

if (dialog && cmdInput && cmdList) {
  const visibleItems = () => cmdItems.filter((item) => !item.hidden);

  const paintSelection = () => {
    cmdItems.forEach((item) => item.querySelector("a").classList.remove("is-selected"));
    const items = visibleItems();
    if (!items.length) return;
    cmdSelected = Math.max(0, Math.min(cmdSelected, items.length - 1));
    items[cmdSelected].querySelector("a").classList.add("is-selected");
    const link = items[cmdSelected].querySelector("a");
    if (link) link.scrollIntoView({ block: "nearest" });
  };

  const filter = (query) => {
    const value = query.trim().toLowerCase();
    let shown = 0;
    cmdItems.forEach((item) => {
      const text = `${item.textContent} ${item.querySelector("a").dataset.keywords || ""}`.toLowerCase();
      const match = !value || text.includes(value);
      item.hidden = !match;
      if (match) shown += 1;
    });
    cmdEmpty.hidden = shown > 0;
    cmdSelected = 0;
    paintSelection();
  };

  const openPalette = () => {
    if (!dialog.open) dialog.showModal();
    cmdInput.value = "";
    filter("");
    window.setTimeout(() => cmdInput.focus(), 40);
  };

  document.querySelectorAll("[data-cmd-open]").forEach((button) => {
    button.addEventListener("click", openPalette);
  });

  document.querySelectorAll("[data-cmd-close]").forEach((button) => {
    button.addEventListener("click", () => dialog.close());
  });

  cmdInput.addEventListener("input", () => filter(cmdInput.value));

  cmdInput.addEventListener("keydown", (event) => {
    const items = visibleItems();
    if (event.key === "ArrowDown") {
      event.preventDefault();
      cmdSelected = (cmdSelected + 1) % items.length;
      paintSelection();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      cmdSelected = (cmdSelected - 1 + items.length) % items.length;
      paintSelection();
    } else if (event.key === "Enter") {
      event.preventDefault();
      const active = items[cmdSelected];
      if (active) {
        const link = active.querySelector("a");
        dialog.close();
        if (link.getAttribute("href").startsWith("#")) {
          scrollToTarget(link.getAttribute("href"));
        } else {
          link.click();
        }
      }
    }
  });

  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    const inside =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;
    if (!inside) dialog.close();
  });

  dialog.addEventListener("close", () => {
    cmdItems.forEach((item) => item.querySelector("a").classList.remove("is-selected"));
  });

  document.addEventListener("keydown", (event) => {
    const target = event.target;
    const typing =
      target instanceof HTMLElement &&
      (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);

    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      if (dialog.open) dialog.close();
      else openPalette();
      return;
    }

    if (typing) return;

    if (event.key === "/" && !dialog.open) {
      event.preventDefault();
      openPalette();
    }
  });
}

/* ---------- terminal typewriter ---------- */

const terminalBody = document.getElementById("terminal-body");

const terminalScript = [
  { prompt: "imran@kali:~$", command: "whoami", output: "Imran Shaikh" },
  {
    prompt: "imran@kali:~$",
    command: "cat focus.txt",
    output: "web  api  android  network  red team  osint",
  },
  {
    prompt: "imran@kali:~$",
    command: "ls ~/tools",
    output: "HostInjection  passive-subd  multi-urls  archive  list-target",
  },
  { prompt: "imran@kali:~$", command: "echo $ETHICS", output: "authorized targets only" },
];

const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

async function typeTerminal() {
  if (!terminalBody) return;
  terminalBody.textContent = "";

  for (const line of terminalScript) {
    const promptNode = document.createElement("span");
    promptNode.className = "term-prompt";
    promptNode.textContent = line.prompt;
    terminalBody.appendChild(promptNode);
    terminalBody.appendChild(document.createTextNode(" "));

    for (let index = 0; index < line.command.length; index += 1) {
      terminalBody.appendChild(document.createTextNode(line.command[index]));
      await sleep(34 + Math.random() * 34);
    }

    terminalBody.appendChild(document.createTextNode("\n"));
    await sleep(180);
    terminalBody.appendChild(document.createTextNode(`${line.output}\n`));
    await sleep(420);
  }

  const promptNode = document.createElement("span");
  promptNode.className = "term-prompt";
  promptNode.textContent = "imran@kali:~$";
  terminalBody.appendChild(promptNode);
}

if (terminalBody) {
  if (reduceMotion.matches) {
    // static content already in the markup stays visible
  } else if ("IntersectionObserver" in window) {
    const terminalObserver = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        typeTerminal();
        terminalObserver.disconnect();
      },
      { threshold: 0.35 }
    );
    terminalObserver.observe(terminalBody);
  } else {
    typeTerminal();
  }
}

/* ---------- footer year ---------- */

const year = document.getElementById("year");
if (year) year.textContent = String(new Date().getFullYear());

window.__portfolioReady = true;
