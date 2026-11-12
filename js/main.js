/* ============================================================
   Imran Shaikh — STARK OS
   Vanilla JS. No build step, no framework, no trackers.
   ============================================================ */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- footer year ---------- */
const year = $('#year');
if (year) year.textContent = String(new Date().getFullYear());

/* ---------- header, progress, active nav ---------- */
const header = $('.site-header');
const progressBar = $('#scroll-progress-bar');
const navLinks = $$('.nav-links a[data-nav]');
const sections = navLinks
  .map((a) => document.getElementById(a.dataset.nav))
  .filter(Boolean);

let ticking = false;

function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;

    if (header) header.classList.toggle('is-scrolled', y > 12);
    if (progressBar) {
      const p = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
      progressBar.style.transform = `scaleX(${p})`;
    }

    let current = '';
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= 120) current = section.id;
    }
    navLinks.forEach((a) => {
      const active = a.dataset.nav === current;
      a.classList.toggle('is-active', active);
      if (active) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });

    ticking = false;
  });
}

window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll, { passive: true });
onScroll();

/* ---------- mobile menu ---------- */
const navToggle = $('#nav-toggle');
const mobileMenu = $('#mobile-menu');

function setMenu(open) {
  if (!navToggle || !mobileMenu) return;
  navToggle.setAttribute('aria-expanded', String(open));
  navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  mobileMenu.classList.toggle('is-open', open);
  mobileMenu.setAttribute('aria-hidden', String(!open));
  document.body.classList.toggle('is-locked', open);
}

if (navToggle && mobileMenu) {
  navToggle.addEventListener('click', () => {
    setMenu(navToggle.getAttribute('aria-expanded') !== 'true');
  });

  $$('a', mobileMenu).forEach((link) => {
    link.addEventListener('click', () => setMenu(false));
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu.classList.contains('is-open')) {
      setMenu(false);
      navToggle.focus();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 900) setMenu(false);
  });
}

/* ---------- reveal on scroll ---------- */
const revealNodes = $$('.reveal');

if (revealNodes.length) {
  if (reduced || !('IntersectionObserver' in window)) {
    revealNodes.forEach((n) => n.classList.add('is-visible'));
  } else {
    revealNodes.forEach((n) => {
      n.classList.add('reveal-ready');
      const siblings = Array.from(n.parentElement ? n.parentElement.children : []);
      const index = Math.max(0, siblings.indexOf(n));
      n.style.setProperty('--reveal-delay', `${Math.min(index, 4) * 70}ms`);
    });

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );

    revealNodes.forEach((n) => io.observe(n));
  }
}

/* ---------- tagline word reveal ---------- */
const tagline = $('[data-reveal-words]');

if (tagline) {
  const accentWords = new Set(['authorization', 'evidence', 'fix']);
  const words = tagline.textContent.trim().split(/\s+/);
  tagline.textContent = '';

  const spans = words.map((word) => {
    const span = document.createElement('span');
    span.className = 'word';
    span.textContent = word + ' ';
    const bare = word.toLowerCase().replace(/[^a-z]/g, '');
    if (accentWords.has(bare)) span.classList.add('is-accent');
    tagline.appendChild(span);
    return span;
  });

  if (reduced || !('IntersectionObserver' in window)) {
    spans.forEach((s) => s.classList.add('is-lit'));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          spans.forEach((span, i) => {
            window.setTimeout(() => span.classList.add('is-lit'), i * 65);
          });
          io.disconnect();
        });
      },
      { threshold: 0.35 }
    );
    io.observe(tagline);
  }
}

/* ---------- counters ---------- */
function animateCount(el, target, decimals = 0) {
  if (reduced) {
    el.textContent = target.toFixed(decimals);
    return;
  }
  const start = performance.now();
  const duration = 1100;

  function frame(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = (target * eased).toFixed(decimals);
    if (t < 1) requestAnimationFrame(frame);
    else el.textContent = target.toFixed(decimals);
  }

  requestAnimationFrame(frame);
}

const heroCounters = {
  years: { value: 3.5, decimals: 1 },
  tests: { value: 35, decimals: 0 },
  certin: { value: 15, decimals: 0 },
  certs: { value: 6, decimals: 0 },
};

$$('[data-stat]').forEach((el) => {
  const conf = heroCounters[el.dataset.stat];
  if (!conf) return;
  el.dataset.target = String(conf.value);
  if (!('IntersectionObserver' in window)) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCount(el, conf.value, conf.decimals);
        io.unobserve(el);
      });
    },
    { threshold: 0.6 }
  );
  io.observe(el);
});

/* ---------- portrait deploy ---------- */
const portrait = $('#portrait');
const portraitToggle = $('#portrait-toggle');
const portraitMode = $('[data-portrait-mode]');

if (portrait && portraitToggle) {
  const setDeployed = (on) => {
    portrait.classList.toggle('is-deployed', on);
    portraitToggle.setAttribute('aria-pressed', String(on));
    if (portraitMode) {
      portraitMode.textContent = on ? 'MARK LXXXV / ONLINE' : 'HUMAN / ONLINE';
    }
  };

  portraitToggle.addEventListener('click', () => {
    setDeployed(!portrait.classList.contains('is-deployed'));
  });

  portrait.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setDeployed(!portrait.classList.contains('is-deployed'));
    }
  });
}

/* ---------- live GitHub telemetry ---------- */
(async function githubTelemetry() {
  const user = 'Imran407704';
  const setText = (key, value) => {
    const el = $(`[data-stat="${key}"]`);
    if (!el || value == null) return;
    el.dataset.target = String(value);
    animateCount(el, Number(value), 0);
  };

  try {
    const [profileRes, reposRes] = await Promise.all([
      fetch(`https://api.github.com/users/${user}`, {
        headers: { Accept: 'application/vnd.github+json' },
      }),
      fetch(`https://api.github.com/users/${user}/repos?per_page=100&sort=updated`, {
        headers: { Accept: 'application/vnd.github+json' },
      }),
    ]);

    if (!profileRes.ok || !reposRes.ok) return;

    const profile = await profileRes.json();
    const repos = await reposRes.json();
    if (!Array.isArray(repos)) return;

    const stars = repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);

    setText('repos', profile.public_repos);
    setText('stars', stars);
    setText('followers', profile.followers);

    const byName = new Map(repos.map((r) => [r.name.toLowerCase(), r]));
    $$('[data-stars]').forEach((el) => {
      const repo = byName.get(el.dataset.stars.toLowerCase());
      if (repo && typeof repo.stargazers_count === 'number') {
        el.textContent = String(repo.stargazers_count);
      }
    });
  } catch {
    /* offline or rate limited: the static values stay in place */
  }
})();

/* ---------- JARVIS / FRIDAY ---------- */
const jarvis = $('#jarvis-panel');
const jarvisOpeners = $$('[data-jarvis-open]');
const jarvisClose = $('#jarvis-close');
const jarvisLog = $('#jarvis-log');
const jarvisForm = $('#jarvis-form');
const jarvisInput = $('#jarvis-input');
const jarvisPersona = $('#jarvis-persona');
const jarvisName = $('#jarvis-title');
const jarvisStatus = $('#jarvis-status');
const jarvisChips = $('#jarvis-chips');

const assistant = {
  name: 'JARVIS',
  short: 'J',
  greeting:
    'Good to see you. I am JARVIS, a local brief on Imran Shaikh. Ask about his experience, certifications, tools, projects or how to reach him.',
  fallback:
    'I do not have that in the local brief. Try <strong>experience</strong>, <strong>certifications</strong>, <strong>tools</strong>, <strong>projects</strong> or <strong>contact</strong>. For anything else, email <a href="mailto:imran407704@gmail.com">imran407704@gmail.com</a>.',
};

const knowledge = [
  {
    keys: ['experience', 'work', 'job', 'career', 'company', 'anb', 'cybernx', 'role', 'history'],
    answer:
      '<strong>3.5+ years in offensive security.</strong><br>' +
      'Senior Associate — Cyber Security at <strong>ANB Solutions</strong> (Jan 2025 to present), a CERT-In empanelled firm. 15+ CERT-In compliant VAPT projects, final security gate across web, mobile, API, VA, CR, SIEM, AV and MBSS.<br>' +
      'Associate Security Consultant at <strong>CyberNX Technologies</strong> (Mar 2023 to Dec 2024): 35+ penetration tests, 5+ end-to-end CERT-In engagements.<br>' +
      'Application Security Intern at CyberNX (Nov 2022 to Feb 2023).',
  },
  {
    keys: ['cert', 'crtp', 'crta', 'mcrta', 'cap', 'burp', 'qualification', 'credential', 'training'],
    answer:
      '<strong>Certifications:</strong> CRTP (Certified Red Team Professional), CRTA (Certified Red Team Analyst), MCRTA (Multi-Cloud Red Team Analyst), CAP (Certified AppSec Practitioner), iOS Pentesting, and Burp Suite in Depth.<br>' +
      'Education: BSc Information Technology, Nirmala Memorial Foundation College of Commerce and Science, Mumbai.',
  },
  {
    keys: ['tool', 'arsenal', 'stack', 'burp', 'nmap', 'metasploit', 'frida', 'zap', 'sqlmap', 'technology'],
    answer:
      '<strong>Working toolchain.</strong> Web and API: Burp Suite, OWASP ZAP, SQLmap, ffuf, Nuclei, Nessus, Nmap. Mobile: Frida, Objection, MobSF. Red team: Metasploit, Shodan, privilege escalation, BadUSB and physical entry exercises. Build: Python, Bash, JavaScript, Docker, Git, Linux.',
  },
  {
    keys: ['project', 'github', 'open source', 'tool', 'hostinjection', 'learn365', 'repo', 'star'],
    answer:
      '<strong>Open source.</strong> HostInjection (host header injection and cache poisoning scanner), Learn365 (365 days of public security research, ~99 stars), passive-subd (passive subdomain enumeration), multi-urls (passive URL harvesting), archive (URL aggregation) and list-target.<br>' +
      'Everything lives at <a href="https://github.com/Imran407704" target="_blank" rel="noopener noreferrer">github.com/Imran407704</a>.',
  },
  {
    keys: ['contact', 'email', 'reach', 'hire', 'linkedin', 'phone', 'available', 'connect'],
    answer:
      'Fastest routes:<br>Email <a href="mailto:imran407704@gmail.com">imran407704@gmail.com</a><br>' +
      'LinkedIn <a href="https://www.linkedin.com/in/imran407704/" target="_blank" rel="noopener noreferrer">in/imran407704</a><br>' +
      'Based in Mumbai, Maharashtra, India. Open to senior penetration testing and security consultant roles.',
  },
  {
    keys: ['skill', 'special', 'web', 'android', 'ios', 'api', 'vapt', 'red team', 'security', 'owasp'],
    answer:
      '<strong>Focus areas.</strong> Full VAPT lifecycle across web, Android, iOS and API: scoping, reconnaissance, exploitation, lateral movement simulation and remediation reporting. Mapped to OWASP Top 10, PTES and CERT-In Secure Gating Process, with CVSS-rated findings. Client sectors: BFSI and telecom.',
  },
  {
    keys: ['award', 'honor', 'recognition', 'appreciation'],
    answer:
      'Recognition: <strong>Employee Appreciation Program</strong> at ANB Solutions, awarded for delivery quality and client-facing security work.',
  },
  {
    keys: ['education', 'college', 'degree', 'bsc', 'study', 'university'],
    answer:
      'BSc Information Technology at <strong>Nirmala Memorial Foundation College of Commerce and Science</strong>, Mumbai (2019 to 2020). Learning did not stop there: #Learn365 is a public archive of 365 consecutive days of security research.',
  },
  {
    keys: ['location', 'where', 'mumbai', 'india', 'remote', 'relocate'],
    answer:
      'Based in <strong>Mumbai, Maharashtra, India</strong>. Client work has covered BFSI and telecom engagements, and the current firm operates across six countries.',
  },
  {
    keys: ['ironman', 'stark', 'jarvis', 'friday', 'suit', 'mark'],
    answer:
      'Mark LXXXV, standing by. This portfolio runs on a Stark OS theme: graphite canvas, crimson and gold plating, and an arc reactor at 98.4%. Hover the portrait or press <strong>MARK LXXXV</strong> to deploy the suit.',
  },
  {
    keys: ['who', 'imran', 'about', 'background', 'summary', 'yourself'],
    answer:
      'Imran Shaikh is a penetration tester and red teamer at ANB Solutions, a CERT-In empanelled firm. 3.5+ years across web, Android, iOS and API security, with 35+ penetration tests, 15+ CERT-In projects, and a habit of shipping reproducible proof of concept with every finding.',
  },
  {
    keys: ['blog', 'medium', 'youtube', 'write', 'video', 'content', 'x', 'twitter'],
    answer:
      'He publishes security research on <a href="https://imran407704.medium.com/" target="_blank" rel="noopener noreferrer">Medium</a>, records walkthroughs on <a href="https://www.youtube.com/@cybersecops7146" target="_blank" rel="noopener noreferrer">YouTube</a>, and posts on <a href="https://x.com/imran407704" target="_blank" rel="noopener noreferrer">X</a>.',
  },
];

let lastFocus = null;
let greeted = false;
let typingToken = 0;

function normalize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
}

function findAnswer(question) {
  const q = normalize(question);
  let best = null;
  let bestScore = 0;

  for (const entry of knowledge) {
    let score = 0;
    for (const key of entry.keys) {
      if (q.includes(key)) score += key.length;
    }
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }

  if (bestScore >= 3) return best.answer
    .replace(/JARVIS/g, assistant.name)
    .replace(/I am JARVIS/, `I am ${assistant.name}`);
  return assistant.fallback.replace(/I am JARVIS/g, `I am ${assistant.name}`);
}

function addMessage(kind, html) {
  if (!jarvisLog) return null;
  const wrap = document.createElement('div');
  wrap.className = `msg msg-${kind}`;

  const who = document.createElement('span');
  who.className = 'msg-who';
  who.textContent = kind === 'user' ? 'YOU' : assistant.name;

  const body = document.createElement('p');
  body.className = 'msg-body';

  wrap.append(who, body);
  jarvisLog.appendChild(wrap);
  jarvisLog.scrollTop = jarvisLog.scrollHeight;
  return body;
}

function typeMessage(html) {
  const body = addMessage('jarvis', '');
  if (!body) return;

  if (reduced || !html.includes('<')) {
    if (reduced) {
      body.innerHTML = html;
      jarvisLog.scrollTop = jarvisLog.scrollHeight;
    } else {
      // Plain text still gets a light typewriter pass, HTML is inserted whole.
      body.innerHTML = html;
    }
    return;
  }

  const token = ++typingToken;
  const chunk = html.match(/<[^>]+>|[^<]+/g) || [html];
  let out = '';
  let i = 0;

  function step() {
    if (token !== typingToken) return;
    out += chunk[i];
    body.innerHTML = out;
    jarvisLog.scrollTop = jarvisLog.scrollHeight;
    i += 1;
    if (i < chunk.length) window.setTimeout(step, 60);
  }

  step();
}

function ask(question) {
  const text = question.trim();
  if (!text) return;
  addMessage('user', '');
  const userBody = jarvisLog.lastElementChild.querySelector('.msg-body');
  userBody.textContent = text;
  jarvisLog.scrollTop = jarvisLog.scrollHeight;

  const answer = findAnswer(text);
  window.setTimeout(() => typeMessage(answer), reduced ? 0 : 260);
}

function openJarvis() {
  if (!jarvis) return;
  lastFocus = document.activeElement;
  jarvis.hidden = false;
  jarvis.classList.add('is-open');
  document.body.classList.add('is-locked');

  if (jarvisStatus) jarvisStatus.textContent = 'LISTENING';

  if (!greeted) {
    greeted = true;
    window.setTimeout(() => typeMessage(assistant.greeting), reduced ? 0 : 120);
  }

  window.setTimeout(() => jarvisInput && jarvisInput.focus(), 60);
}

function closeJarvis() {
  if (!jarvis) return;
  jarvis.classList.remove('is-open');
  jarvis.hidden = true;
  document.body.classList.remove('is-locked');
  if (jarvisStatus) jarvisStatus.textContent = 'ONLINE';
  if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
}

if (jarvis) {
  jarvisOpeners.forEach((btn) => btn.addEventListener('click', openJarvis));

  if (jarvisClose) jarvisClose.addEventListener('click', closeJarvis);

  if (jarvisForm) {
    jarvisForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!jarvisInput) return;
      ask(jarvisInput.value);
      jarvisInput.value = '';
    });
  }

  if (jarvisChips) {
    jarvisChips.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-ask]');
      if (!btn) return;
      ask(btn.dataset.ask);
    });
  }

  if (jarvisPersona) {
    jarvisPersona.addEventListener('click', () => {
      const friday = assistant.name === 'JARVIS';
      assistant.name = friday ? 'FRIDAY' : 'JARVIS';
      jarvisName.textContent = assistant.name;
      jarvisPersona.textContent = friday ? 'JARVIS' : 'FRIDAY';
      jarvisPersona.setAttribute(
        'aria-label',
        `Switch assistant to ${friday ? 'JARVIS' : 'FRIDAY'}`
      );
      jarvis.setAttribute('aria-labelledby', 'jarvis-title');

      const body = addMessage('jarvis', '');
      body.textContent = friday
        ? 'FRIDAY online. Boss is out, so you get me. Ask away — experience, certs, tools, projects, contact.'
        : 'JARVIS back online. Apologies for the interruption. What do you need?';
    });
  }

  window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();

    if ((e.ctrlKey || e.metaKey) && key === 'k') {
      e.preventDefault();
      if (jarvis.hidden) openJarvis();
      else closeJarvis();
      return;
    }

    if (e.key === 'Escape' && !jarvis.hidden) {
      e.preventDefault();
      closeJarvis();
    }
  });
}

/* ============================================================
   3D / interactive layer
   ============================================================ */

/* ---------- preloader ---------- */
(function preloader() {
  const root = document.documentElement;
  if (!root.classList.contains('pl-on')) return;

  const line = $('#pl-line');
  const bar = $('#pl-bar');
  const pct = $('#pl-pct');
  const skip = $('#pl-skip');

  const boot = [
    'JARVIS · SYSTEMS ONLINE',
    'CALIBRATING ARC REACTOR',
    'LOADING MARK LXXXV',
    'SECURING PERIMETER',
    'RENDERING HUD LAYER',
    'WELCOME BACK, SIR',
  ];

  let p = 0;
  let li = 0;
  let done = false;

  function finish() {
    if (done) return;
    done = true;
    if (bar) bar.style.width = '100%';
    if (pct) pct.textContent = '100%';
    root.classList.add('pl-done');
    document.dispatchEvent(new CustomEvent('stark:intro-done'));
    window.setTimeout(() => {
      const pl = $('#preloader');
      if (pl) pl.remove();
    }, 700);
  }

  if (skip) skip.addEventListener('click', finish);

  const iv = window.setInterval(() => {
    if (done) { window.clearInterval(iv); return; }
    p = Math.min(96, p + 4 + Math.random() * 12);
    if (bar) bar.style.width = p + '%';
    if (pct) pct.textContent = Math.round(p) + '%';
    li = (li + 1) % boot.length;
    if (line) line.textContent = boot[li];
  }, 260);

  window.addEventListener('load', () => {
    window.setTimeout(() => { window.clearInterval(iv); finish(); }, 480);
  });

  window.setTimeout(() => { window.clearInterval(iv); finish(); }, 4400);
})();

/* ---------- split characters ---------- */
function splitChars(el) {
  if (!el || el.dataset.split === '1') return;
  el.dataset.split = '1';
  const text = el.textContent.trim();
  el.textContent = '';
  const frag = document.createDocumentFragment();
  let i = 0;

  text.split(/\s+/).forEach((word, wi, arr) => {
    const w = document.createElement('span');
    w.className = 'chw';
    for (const ch of word) {
      const s = document.createElement('span');
      s.className = 'ch';
      s.textContent = ch;
      s.style.setProperty('--i', String(i));
      i += 1;
      w.appendChild(s);
    }
    frag.appendChild(w);
    if (wi < arr.length - 1) frag.appendChild(document.createTextNode(' '));
  });

  el.appendChild(frag);
  el.classList.add('is-split');
}

function whenIntroDone(fn) {
  if (document.documentElement.classList.contains('pl-done')) {
    window.requestAnimationFrame(fn);
    return;
  }
  document.addEventListener('stark:intro-done', fn, { once: true });
  window.setTimeout(fn, 5200);
}

const heroTitle = $('#hero-title');
if (heroTitle) {
  const lines = $$('.hero-line', heroTitle);
  if (reduced || !lines.length) {
    heroTitle.classList.add('is-in');
  } else {
    lines.forEach(splitChars);
    whenIntroDone(() => heroTitle.classList.add('is-in'));
  }
}

const wordmark = $('#wordmark');
if (wordmark) {
  if (reduced || !('IntersectionObserver' in window)) {
    wordmark.classList.add('is-in');
  } else {
    splitChars(wordmark);
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          wordmark.classList.add('is-in');
          io.disconnect();
        });
      },
      { threshold: 0.25 }
    );
    io.observe(wordmark);
  }
}

/* ---------- custom cursor ---------- */
(function customCursor() {
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (reduced || !fine) return;

  const el = document.createElement('div');
  el.className = 'cursor';
  el.setAttribute('aria-hidden', 'true');
  const label = document.createElement('span');
  label.className = 'cursor-label';
  el.appendChild(label);
  document.body.appendChild(el);

  let tx = -100;
  let ty = -100;
  let x = tx;
  let y = ty;
  let down = false;
  let raf = 0;
  let running = false;

  function loop() {
    x += (tx - x) * 0.2;
    y += (ty - y) * 0.2;
    el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)${down ? ' scale(0.85)' : ''}`;
    raf = window.requestAnimationFrame(loop);
  }

  window.addEventListener('pointermove', (e) => {
    tx = e.clientX;
    ty = e.clientY;
    if (!running) {
      running = true;
      x = tx;
      y = ty;
      el.classList.add('is-on');
      loop();
    }
  }, { passive: true });

  document.addEventListener('mouseover', (e) => {
    const t = e.target.closest && e.target.closest('[data-cursor], a, button');
    if (t) {
      el.classList.add('is-hover');
      label.textContent = t.getAttribute('data-cursor') || '';
    } else {
      el.classList.remove('is-hover');
      label.textContent = '';
    }
  });

  window.addEventListener('pointerdown', () => { down = true; });
  window.addEventListener('pointerup', () => { down = false; });
  document.documentElement.addEventListener('mouseleave', () => {
    el.classList.remove('is-on');
    running = false;
    window.cancelAnimationFrame(raf);
  });
})();

/* ---------- magnetic buttons ---------- */
(function magnetic() {
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (reduced || !fine) return;

  $$('.btn').forEach((btn) => {
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      const mx = (e.clientX - r.left - r.width / 2) / (r.width / 2);
      const my = (e.clientY - r.top - r.height / 2) / (r.height / 2);
      btn.style.transform = `translate(${(mx * 6).toFixed(1)}px, ${(my * 4).toFixed(1)}px)`;
    });
    btn.addEventListener('pointerleave', () => {
      btn.style.transform = '';
    });
  });
})();

/* ---------- portrait tilt ---------- */
(function tilt() {
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (reduced || !fine) return;
  const media = $('.portrait-media');
  const zone = $('#portrait');
  if (!media || !zone) return;

  zone.addEventListener('pointermove', (e) => {
    const r = media.getBoundingClientRect();
    const mx = (e.clientX - r.left) / r.width - 0.5;
    const my = (e.clientY - r.top) / r.height - 0.5;
    media.style.transform =
      `perspective(900px) rotateX(${(-my * 7).toFixed(2)}deg) rotateY(${(mx * 9).toFixed(2)}deg)`;
  });
  zone.addEventListener('pointerleave', () => {
    media.style.transform = '';
  });
})();

/* ---------- hero 3D scene ---------- */
(async function initHero3D() {
  const canvas = $('#hero-fx');
  const hero = $('.hero');
  if (!canvas || !hero) return;
  if (reduced) return;

  let T;
  try {
    T = await import('https://esm.sh/three@0.169.0');
  } catch {
    canvas.remove();
    return;
  }
  if (!T || !T.WebGLRenderer) { canvas.remove(); return; }

  let renderer;
  try {
    renderer = new T.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  } catch {
    canvas.remove();
    return;
  }
  renderer.setClearColor(0x000000, 0);

  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 0, 9.5);

  const group = new T.Group();
  scene.add(group);

  /* reactor rings */
  const goldRing = new T.Mesh(
    new T.TorusGeometry(3.3, 0.045, 10, 140),
    new T.MeshBasicMaterial({ color: 0xf2c14e, transparent: true, opacity: 0.55 })
  );
  const crimsonRing = new T.Mesh(
    new T.TorusGeometry(3.9, 0.035, 10, 150),
    new T.MeshBasicMaterial({ color: 0xe62429, transparent: true, opacity: 0.4 })
  );
  crimsonRing.rotation.x = Math.PI / 2.6;
  crimsonRing.rotation.y = 0.4;

  const cyanRingA = new T.Mesh(
    new T.TorusGeometry(2.75, 0.02, 8, 120),
    new T.MeshBasicMaterial({ color: 0x6fe3f5, transparent: true, opacity: 0.4 })
  );
  cyanRingA.rotation.x = -0.5;
  const cyanRingB = new T.Mesh(
    new T.TorusGeometry(4.5, 0.018, 8, 160),
    new T.MeshBasicMaterial({ color: 0x6fe3f5, transparent: true, opacity: 0.22 })
  );
  cyanRingB.rotation.x = 1.1;
  cyanRingB.rotation.z = -0.35;

  group.add(goldRing, crimsonRing, cyanRingA, cyanRingB);

  /* core */
  const coreGroup = new T.Group();
  const core = new T.Mesh(
    new T.SphereGeometry(0.85, 32, 32),
    new T.MeshBasicMaterial({ color: 0xe9fdff })
  );
  const cage = new T.Mesh(
    new T.IcosahedronGeometry(1.7, 1),
    new T.MeshBasicMaterial({ color: 0x6fe3f5, wireframe: true, transparent: true, opacity: 0.3 })
  );
  const octa = new T.Mesh(
    new T.OctahedronGeometry(2.35, 0),
    new T.MeshBasicMaterial({ color: 0xf2c14e, wireframe: true, transparent: true, opacity: 0.4 })
  );
  coreGroup.add(core, cage, octa);
  group.add(coreGroup);

  /* glow sprite */
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = glowCanvas.height = 128;
  const gctx = glowCanvas.getContext('2d');
  const grad = gctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(160, 240, 255, 0.55)');
  grad.addColorStop(0.35, 'rgba(111, 227, 245, 0.18)');
  grad.addColorStop(1, 'rgba(111, 227, 245, 0)');
  gctx.fillStyle = grad;
  gctx.fillRect(0, 0, 128, 128);
  const glowTex = new T.CanvasTexture(glowCanvas);
  const glow = new T.Sprite(new T.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, opacity: 0.75 }));
  glow.scale.set(7.5, 7.5, 1);
  group.add(glow);

  /* hex plates */
  const plates = new T.Group();
  const plateGeo = new T.BoxGeometry(0.5, 0.3, 0.05);
  for (let i = 0; i < 10; i += 1) {
    const a = (i / 10) * Math.PI * 2;
    const plate = new T.Mesh(
      plateGeo,
      new T.MeshBasicMaterial({ color: 0xe62429, transparent: true, opacity: 0.16 })
    );
    plate.position.set(Math.cos(a) * 5.15, Math.sin(a) * 5.15 * 0.72, Math.sin(a) * 1.2);
    plate.rotation.z = a + Math.PI / 2;
    plates.add(plate);
  }
  group.add(plates);

  /* particle field */
  const isSmall = window.innerWidth < 820;
  const count = isSmall ? 280 : 560;
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    pos[i * 3] = (Math.random() - 0.5) * 18;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 11;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 9;
  }
  const pGeo = new T.BufferGeometry();
  pGeo.setAttribute('position', new T.BufferAttribute(pos, 3));
  const dust = new T.Points(
    pGeo,
    new T.PointsMaterial({ color: 0x6fe3f5, size: 0.045, transparent: true, opacity: 0.5, depthWrite: false })
  );
  scene.add(dust);

  /* click pulse rings */
  const pulses = [];
  const pulseGeo = new T.RingGeometry(0.96, 1, 64);
  function firePulse() {
    if (pulses.length > 4) return;
    const mesh = new T.Mesh(
      pulseGeo,
      new T.MeshBasicMaterial({ color: 0x8fe8ff, transparent: true, opacity: 0.75, side: T.DoubleSide, depthWrite: false })
    );
    mesh.position.copy(group.position);
    mesh.userData.age = 0;
    scene.add(mesh);
    pulses.push(mesh);
  }

  /* layout */
  function layout() {
    const r = hero.getBoundingClientRect();
    const w = Math.max(1, r.width);
    const h = Math.max(1, r.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const wide = w / h > 1.05;
    if (wide) {
      group.position.x = Math.min(2.4, (w / h) * 1.3);
      group.position.y = 0.15;
      group.scale.setScalar(1);
      glow.scale.set(7.5, 7.5, 1);
    } else {
      /* small screens: park the reactor behind the portrait, out of the copy */
      group.position.x = 0.4;
      group.position.y = -3.1;
      group.scale.setScalar(0.58);
      glow.scale.set(5.5, 5.5, 1);
    }
  }
  layout();

  /* interaction state */
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  let mx = 0;
  let my = 0;
  let dragging = false;
  let moved = 0;
  let lastX = 0;
  let lastY = 0;
  let velX = 0;
  let velY = 0;

  if (fine) {
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      mx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      my = ((e.clientY - r.top) / r.height - 0.5) * 2;
    }, { passive: true });
  }

  hero.addEventListener('pointerdown', (e) => {
    if (e.target.closest && e.target.closest('a, button, input, .hero-copy, .portrait, .jarvis')) return;
    dragging = true;
    moved = 0;
    lastX = e.clientX;
    lastY = e.clientY;
  });

  window.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    moved += Math.abs(dx) + Math.abs(dy);
    velY += dx * 0.0022;
    velX += dy * 0.0016;
  }, { passive: true });

  window.addEventListener('pointerup', () => {
    if (dragging && moved < 7) firePulse();
    dragging = false;
  });

  /* visibility control */
  let inView = true;
  let visible = !document.hidden;
  let raf = 0;

  const io = new IntersectionObserver((entries) => {
    inView = entries[0].isIntersecting;
    sync();
  }, { threshold: 0.02 });
  io.observe(hero);

  document.addEventListener('visibilitychange', () => {
    visible = !document.hidden;
    sync();
  });

  function sync() {
    const shouldRun = inView && visible;
    if (shouldRun && !raf) {
      clock = performance.now();
      raf = window.requestAnimationFrame(animate);
    } else if (!shouldRun && raf) {
      window.cancelAnimationFrame(raf);
      raf = 0;
    }
  }

  window.addEventListener('resize', layout);
  if ('ResizeObserver' in window) new ResizeObserver(layout).observe(hero);

  /* animate */
  let clock = performance.now();
  let t = 0;

  canvas.classList.add('is-live');
  raf = window.requestAnimationFrame(animate);

  function animate(now) {
    const dt = Math.min(0.05, (now - clock) / 1000);
    clock = now;
    t += dt;

    /* inertia */
    velY *= 0.94;
    velX *= 0.94;

    group.rotation.y = t * 0.12 + velY;
    group.rotation.x = -0.14 + Math.sin(t * 0.4) * 0.05 + velX;
    group.rotation.z = Math.sin(t * 0.23) * 0.06;

    group.position.y += Math.sin(t * 0.8) * 0.0025;

    /* scroll parallax */
    const heroH = hero.offsetHeight || 1;
    const prog = Math.min(1, Math.max(0, window.scrollY / heroH));
    dust.position.y = prog * 2.4;
    camera.position.y = -my * 0.5 - prog * 0.6;
    camera.position.x = mx * 0.75;
    camera.lookAt(0, 0, 0);

    coreGroup.rotation.y += dt * 0.5;
    coreGroup.rotation.x += dt * 0.22;
    octa.rotation.y -= dt * 0.35;
    cage.rotation.z += dt * 0.18;
    const cs = 1 + Math.sin(t * 2.4) * 0.04;
    core.scale.set(cs, cs, cs);
    glow.material.opacity = 0.65 + Math.sin(t * 2.4) * 0.1;

    crimsonRing.rotation.z += dt * 0.16;
    cyanRingA.rotation.z += dt * 0.3;
    cyanRingB.rotation.z -= dt * 0.2;
    plates.rotation.z += dt * 0.08;

    dust.rotation.y += dt * 0.02;

    /* pulses */
    for (let i = pulses.length - 1; i >= 0; i -= 1) {
      const p = pulses[i];
      p.userData.age += dt;
      const a = p.userData.age;
      const k = a / 0.9;
      p.scale.setScalar(1 + k * 9);
      p.material.opacity = 0.75 * (1 - k);
      p.quaternion.copy(camera.quaternion);
      if (k >= 1) {
        scene.remove(p);
        p.material.dispose();
        pulses.splice(i, 1);
      }
    }

    renderer.render(scene, camera);
    raf = window.requestAnimationFrame(animate);
  }
})();
