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
