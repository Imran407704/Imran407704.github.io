/* ============================================================
   Imran Shaikh — portfolio (Spider-Man edition)
   Vanilla JS. No build step, no framework, no trackers.
   ============================================================ */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

/* ---------- footer year ---------- */
const year = $('#year');
if (year) year.textContent = String(new Date().getFullYear());

/* ============================================================
   Preloader — rotating quotes + percent counter + skip
   ============================================================ */
(function preloader() {
  const root = document.documentElement;
  if (!root.classList.contains('pl-on')) return;

  const quotes = $$('.pl-t');
  const bar = $('#plBar');
  const pct = $('#plPct');
  const skip = $('#plSkip');
  const DURATION = 3600;
  const QUOTE_STEP = 880;

  let start = 0;
  let qi = -1;
  let done = false;
  let raf = 0;

  function showQuote(i) {
    if (i === qi) return;
    qi = i;
    quotes.forEach((q, idx) => q.classList.toggle('is-in', idx === i));
  }

  function finish() {
    if (done) return;
    done = true;
    window.cancelAnimationFrame(raf);
    if (bar) bar.style.transform = 'scaleX(1)';
    if (pct) pct.textContent = '100%';
    root.classList.add('pl-done');
    root.classList.remove('pl-on');
    document.dispatchEvent(new CustomEvent('pl:done'));
    window.setTimeout(() => {
      const pl = $('#preloader');
      if (pl) pl.remove();
    }, 750);
  }

  function tick(now) {
    if (done) return;
    if (!start) start = now;
    const t = clamp((now - start) / DURATION, 0, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    const p = Math.round(eased * 100);
    if (bar) bar.style.transform = `scaleX(${eased})`;
    if (pct) pct.textContent = p + '%';
    const idx = Math.min(quotes.length - 1, Math.floor((now - start) / QUOTE_STEP));
    showQuote(idx);
    if (t < 1) raf = window.requestAnimationFrame(tick);
    else window.setTimeout(finish, 320);
  }

  if (skip) skip.addEventListener('click', finish);
  if (quotes.length) showQuote(0);
  raf = window.requestAnimationFrame(tick);
  // hard safety net
  window.setTimeout(finish, DURATION + 1200);
})();

function whenIntroDone(fn) {
  if (document.documentElement.classList.contains('pl-done') ||
      !document.documentElement.classList.contains('pl-on')) {
    window.requestAnimationFrame(fn);
    return;
  }
  document.addEventListener('pl:done', fn, { once: true });
  window.setTimeout(fn, 5600);
}

/* ============================================================
   Custom cursor — dot with big labelled mode (Mask / View)
   ============================================================ */
(function customCursor() {
  if (reduced || !finePointer) return;

  let el = $('#cursor');
  let label = $('#cursorLabel');
  if (!el) {
    el = document.createElement('div');
    el.className = 'cursor';
    el.id = 'cursor';
    el.setAttribute('aria-hidden', 'true');
    label = document.createElement('span');
    label.className = 'cursor-label';
    el.appendChild(label);
    document.body.appendChild(el);
  }

  let tx = -100;
  let ty = -100;
  let x = tx;
  let y = ty;
  let raf = 0;
  let running = false;

  function loop() {
    x += (tx - x) * 0.2;
    y += (ty - y) * 0.2;
    el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
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
    const t = e.target.closest && e.target.closest('[data-cursor]');
    if (t) {
      el.classList.add('is-big');
      if (label) label.textContent = t.getAttribute('data-cursor') || '';
    } else {
      el.classList.remove('is-big');
      if (label) label.textContent = '';
    }
  });

  window.addEventListener('pointerdown', () => el.classList.add('is-down'));
  window.addEventListener('pointerup', () => el.classList.remove('is-down'));
  document.documentElement.addEventListener('mouseleave', () => {
    el.classList.remove('is-on');
    running = false;
    window.cancelAnimationFrame(raf);
  });
})();

/* ============================================================
   Header — hide on scroll down, active section nav
   ============================================================ */
const header = $('.site-header');
const navLinks = $$('.nav a[href^="#"]');
const sections = navLinks
  .map((a) => document.getElementById((a.getAttribute('href') || '').slice(1)))
  .filter(Boolean);

let lastY = window.scrollY;

function updateHeader(y) {
  if (!header) return;
  const goingDown = y > lastY + 4;
  const goingUp = y < lastY - 4;
  if (goingDown && y > 160) header.classList.add('hide');
  else if (goingUp || y <= 160) header.classList.remove('hide');
  lastY = y;
}

function updateNav() {
  let current = '';
  for (const section of sections) {
    if (section.getBoundingClientRect().top <= 140) current = section.id;
  }
  navLinks.forEach((a) => {
    const active = (a.getAttribute('href') || '').slice(1) === current;
    a.classList.toggle('is-active', active);
  });
}

/* ============================================================
   Mobile menu
   ============================================================ */
const menuBtn = $('#menuBtn');
const mobileMenu = $('#mobileMenu');

function setMenu(open) {
  if (!menuBtn || !mobileMenu) return;
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  mobileMenu.hidden = !open;
  document.body.classList.toggle('is-locked', open);
}

if (menuBtn && mobileMenu) {
  menuBtn.addEventListener('click', () => {
    setMenu(menuBtn.getAttribute('aria-expanded') !== 'true');
  });

  $$('a', mobileMenu).forEach((link) => {
    link.addEventListener('click', () => setMenu(false));
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !mobileMenu.hidden) {
      setMenu(false);
      menuBtn.focus();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 760) setMenu(false);
  });
}

/* ============================================================
   Split text — words and characters
   ============================================================ */
function splitWords(el) {
  if (!el || el.dataset.split === '1') return null;
  el.dataset.split = '1';
  const text = el.textContent.trim();
  el.textContent = '';
  const frag = document.createDocumentFragment();
  const spans = [];

  text.split(/\s+/).forEach((word, wi, arr) => {
    const s = document.createElement('span');
    s.className = 'wd';
    s.textContent = word;
    s.style.setProperty('--wd', String(wi));
    frag.appendChild(s);
    spans.push(s);
    if (wi < arr.length - 1) frag.appendChild(document.createTextNode(' '));
  });

  el.appendChild(frag);
  el.classList.add('is-split');
  return spans;
}

function splitChars(el) {
  if (!el || el.dataset.split === '1') return null;
  el.dataset.split = '1';
  const text = el.textContent.trim();
  el.textContent = '';
  const frag = document.createDocumentFragment();
  const spans = [];
  let i = 0;

  text.split(/\s+/).forEach((word, wi, arr) => {
    const w = document.createElement('span');
    w.style.display = 'inline-block';
    w.style.whiteSpace = 'pre';
    for (const ch of word) {
      const s = document.createElement('span');
      s.className = 'ch';
      s.textContent = ch;
      s.style.setProperty('--wd', String(i));
      i += 1;
      w.appendChild(s);
      spans.push(s);
    }
    frag.appendChild(w);
    if (wi < arr.length - 1) frag.appendChild(document.createTextNode(' '));
  });

  el.appendChild(frag);
  el.classList.add('is-split');
  return spans;
}

/* split all word/char targets up front */
const wordSplitEls = $$('.split-words');
wordSplitEls.forEach(splitWords);

const heroName = $('.hero-name .split-chars');
if (heroName) {
  if (reduced) splitChars(heroName);
  else {
    splitChars(heroName);
    whenIntroDone(() => heroName.classList.add('is-in'));
  }
}

const wordmark = $('.wordmark .split-chars');
if (wordmark) {
  if (reduced || !('IntersectionObserver' in window)) {
    splitChars(wordmark);
    wordmark.classList.add('is-in');
  } else {
    splitChars(wordmark);
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        wordmark.classList.add('is-in');
        io.disconnect();
      });
    }, { threshold: 0.2 });
    io.observe(wordmark);
  }
}

/* word-level reveal for .split-words headings */
if (wordSplitEls.length && 'IntersectionObserver' in window && !reduced) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
  wordSplitEls.forEach((el) => io.observe(el));
} else {
  wordSplitEls.forEach((el) => el.classList.add('is-in'));
}

/* ============================================================
   [data-anim] reveal on scroll
   ============================================================ */
const animEls = $$('[data-anim]');
if (animEls.length && 'IntersectionObserver' in window && !reduced) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in');
      io.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  animEls.forEach((n) => io.observe(n));
} else {
  animEls.forEach((n) => n.classList.add('is-in'));
}

/* ============================================================
   scrub-text — words light up as you scroll through
   ============================================================ */
const scrubEls = $$('.scrub-text').map((el) => {
  const spans = reduced ? null : splitWords(el);
  return { el, spans: spans || [] };
});

function updateScrub() {
  const winH = window.innerHeight;
  for (const item of scrubEls) {
    const rect = item.el.getBoundingClientRect();
    if (rect.top > winH || rect.bottom < 0) continue;
    const p = clamp((winH * 0.78 - rect.top) / Math.max(1, rect.height * 0.95), 0, 1);
    const lit = Math.round(p * item.spans.length);
    item.spans.forEach((s, i) => s.classList.toggle('is-lit', i < lit));
  }
}

if (reduced) {
  scrubEls.forEach((item) => item.spans.forEach((s) => s.classList.add('is-lit')));
}

/* ============================================================
   Marquee tracks — duplicate content for a seamless loop
   ============================================================ */
$$('[data-fill], #logoTrack, #toolsTrack').forEach((track) => {
  if (!track || track.dataset.filled === '1') return;
  track.dataset.filled = '1';
  // two identical halves make the -50% keyframe seamless
  track.innerHTML = track.innerHTML + track.innerHTML;
});

/* ============================================================
   Counters [data-count]
   ============================================================ */
function animateCount(el, target, decimals = 0) {
  if (reduced) {
    el.textContent = target.toFixed(decimals);
    return;
  }
  const start = performance.now();
  const duration = 1200;

  function frame(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = (target * eased).toFixed(decimals);
    if (t < 1) requestAnimationFrame(frame);
    else el.textContent = target.toFixed(decimals);
  }

  requestAnimationFrame(frame);
}

$$('[data-count]').forEach((el) => {
  const target = parseFloat(el.dataset.count);
  if (Number.isNaN(target)) return;
  const decimals = parseInt(el.dataset.decimals || '0', 10);

  if (!('IntersectionObserver' in window) || reduced) {
    el.textContent = target.toFixed(decimals);
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      animateCount(el, target, decimals);
      io.unobserve(el);
    });
  }, { threshold: 0.6 });
  io.observe(el);
});

/* ============================================================
   Pinned experience timeline
   ============================================================ */
const xp2 = $('.xp2');
const xpPin = $('.xp-pin');
const xpTrack = $('#xpTrack');
const xpRail = $('.xp-rail');
const xpFill = $('#xpFill');
const xpMark = $('#xpMark');
const xpBar = $('#xpBar');
const xpYear = $('#xpYear');
const xpDate = $('#xpDate');
const xpCo = $('#xpCo');
const xpIdx = $('#xpIdx');
const xpEntries = $$('.xt');

let xpActive = -1;

function setXpEntry(i) {
  if (i === xpActive) return;
  xpActive = i;
  xpEntries.forEach((li, idx) => li.classList.toggle('is-on', idx <= i));
  const entry = xpEntries[i];
  if (!entry) return;
  if (xpYear) xpYear.textContent = entry.dataset.year || '';
  if (xpDate) xpDate.textContent = entry.dataset.date || '';
  if (xpCo) xpCo.textContent = entry.dataset.co || '';
  if (xpIdx) xpIdx.textContent = String(i + 1).padStart(2, '0');
  if (xpBar) xpBar.style.transform = `scaleX(${(i + 1) / xpEntries.length})`;
}

function updateXp() {
  if (!xp2 || !xpPin || !xpTrack || reduced) return;
  if (window.innerWidth <= 760) return;

  const rect = xp2.getBoundingClientRect();
  const scrollable = xp2.offsetHeight - window.innerHeight;
  if (scrollable <= 0) return;
  const p = clamp(-rect.top / scrollable, 0, 1);

  // translate the entry list through the masked rail
  const railH = xpRail ? xpRail.clientHeight : 0;
  const total = Math.max(0, xpTrack.scrollHeight - railH + 120);
  if (xpTrack) xpTrack.style.transform = `translateY(${(-p * total).toFixed(1)}px)`;

  if (xpFill) xpFill.style.height = (p * 100).toFixed(2) + '%';
  if (xpMark) xpMark.style.top = (p * 100).toFixed(2) + '%';

  const idx = clamp(Math.floor(p * xpEntries.length * 0.999), 0, xpEntries.length - 1);
  setXpEntry(idx);
}

/* ============================================================
   Single rAF-throttled scroll handler
   ============================================================ */
let ticking = false;

function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    const y = window.scrollY;
    updateHeader(y);
    updateNav();
    updateScrub();
    updateXp();
    ticking = false;
  });
}

window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll, { passive: true });
onScroll();

/* ============================================================
   Mask on / off — hero portrait suit swap
   ============================================================ */
(function maskToggle() {
  const photo = $('#heroPhoto');
  const btn = $('#maskBtn');
  const tag = $('[data-hp-tag]');
  if (!photo || !btn) return;

  function setMask(on) {
    photo.classList.toggle('is-mask', on);
    btn.setAttribute('aria-pressed', String(on));
    btn.textContent = on ? 'MASK OFF' : 'MASK ON';
    if (tag) tag.textContent = on ? 'MASK ON' : 'MASK OFF';
  }

  btn.addEventListener('click', () => {
    setMask(!photo.classList.contains('is-mask'));
  });
})();

/* ============================================================
   Magnetic buttons
   ============================================================ */
(function magnetic() {
  if (reduced || !finePointer) return;

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

/* ============================================================
   Live GitHub stars on project cards
   ============================================================ */
(async function githubStars() {
  const user = 'Imran407704';
  try {
    const res = await fetch(`https://api.github.com/users/${user}/repos?per_page=100&sort=updated`, {
      headers: { Accept: 'application/vnd.github+json' },
    });
    if (!res.ok) return;
    const repos = await res.json();
    if (!Array.isArray(repos)) return;

    const byName = new Map(repos.map((r) => [(r.name || '').toLowerCase(), r]));
    $$('[data-stars]').forEach((el) => {
      const repo = byName.get((el.dataset.stars || '').toLowerCase());
      if (repo && typeof repo.stargazers_count === 'number') {
        el.textContent = String(repo.stargazers_count);
      }
    });
  } catch {
    /* offline or rate limited: the static markup stays in place */
  }
})();

/* ============================================================
   KAREN / JARVIS — scripted local assistant
   ============================================================ */
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
  name: 'KAREN',
  greeting:
    'Hey there. I am KAREN, a local brief on Imran Shaikh. Ask about his experience, certifications, tools, projects or how to reach him.',
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
    keys: ['tool', 'arsenal', 'stack', 'nmap', 'metasploit', 'frida', 'zap', 'sqlmap', 'technology'],
    answer:
      '<strong>Working toolchain.</strong> Web and API: Burp Suite, OWASP ZAP, SQLmap, ffuf, Nuclei, Nessus, Nmap. Mobile: Frida, Objection, MobSF. Red team: Metasploit, Shodan, privilege escalation, BadUSB and physical entry exercises. Build: Python, Bash, JavaScript, Docker, Git, Linux.',
  },
  {
    keys: ['project', 'github', 'open source', 'hostinjection', 'learn365', 'repo', 'star'],
    answer:
      '<strong>Open source.</strong> HostInjection (host header injection and cache poisoning scanner), Learn365 (365 days of public security research), passive-subd (passive subdomain enumeration), multi-urls (passive URL harvesting), archive (URL aggregation) and list-target.<br>' +
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
      'Based in <strong>Mumbai, Maharashtra, India</strong>. Client work has covered BFSI and telecom engagements.',
  },
  {
    keys: ['spider', 'spiderman', 'spidey', 'mask', 'suit', 'karen', 'jarvis', 'superhero', 'power', 'web'],
    answer:
      'Spider-Man, obviously. This folio wears the classic red and blue — hover the portrait or press <strong>MASK ON</strong> to web up. With great power comes great responsibility.',
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

  if (bestScore >= 3) return best.answer;
  return assistant.fallback;
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
  body.innerHTML = html;
  jarvisLog.scrollTop = jarvisLog.scrollHeight;
}

function ask(question) {
  const text = question.trim();
  if (!text) return;
  const userBody = addMessage('user', '');
  if (userBody) {
    userBody.textContent = text;
    jarvisLog.scrollTop = jarvisLog.scrollHeight;
  }

  const answer = findAnswer(text);
  window.setTimeout(() => typeMessage(answer), reduced ? 0 : 260);
}

function openJarvis() {
  if (!jarvis) return;
  lastFocus = document.activeElement;
  jarvis.hidden = false;
  jarvis.classList.add('is-open');

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
      const toJarvis = assistant.name === 'KAREN';
      assistant.name = toJarvis ? 'JARVIS' : 'KAREN';
      if (jarvisName) jarvisName.textContent = assistant.name;
      jarvisPersona.textContent = toJarvis ? 'KAREN' : 'JARVIS';
      jarvisPersona.setAttribute(
        'aria-label',
        `Switch assistant to ${toJarvis ? 'KAREN' : 'JARVIS'}`
      );

      const body = addMessage('jarvis', '');
      if (body) {
        body.textContent = toJarvis
          ? 'JARVIS online. Sir is on patrol, so you get me. Ask away — experience, certs, tools, projects, contact.'
          : 'KAREN back online. Sorry about him. What do you need?';
      }
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
   Hero 3D — web-corp rings in spider red and blue
   ============================================================ */
(async function initHero3D() {
  const canvas = $('#heroFx');
  const hero = $('.hero');
  if (!canvas || !hero) return;
  if (reduced) return;

  async function loadThree() {
    const urls = [
      'https://esm.sh/three@0.169.0',
      'https://cdn.jsdelivr.net/npm/three@0.169.0/+esm',
    ];
    for (const url of urls) {
      try {
        const mod = await import(/* @vite-ignore */ url);
        if (mod && mod.WebGLRenderer) return mod;
      } catch {
        /* try the next CDN */
      }
    }
    return null;
  }

  const T = await loadThree();
  if (!T) { canvas.remove(); return; }

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

  /* web-corp rings */
  const redRing = new T.Mesh(
    new T.TorusGeometry(3.3, 0.045, 10, 140),
    new T.MeshBasicMaterial({ color: 0xe02a30, transparent: true, opacity: 0.55 })
  );
  const deepRing = new T.Mesh(
    new T.TorusGeometry(3.9, 0.035, 10, 150),
    new T.MeshBasicMaterial({ color: 0xc90207, transparent: true, opacity: 0.4 })
  );
  deepRing.rotation.x = Math.PI / 2.6;
  deepRing.rotation.y = 0.4;

  const blueRingA = new T.Mesh(
    new T.TorusGeometry(2.75, 0.02, 8, 120),
    new T.MeshBasicMaterial({ color: 0x4a7bff, transparent: true, opacity: 0.4 })
  );
  blueRingA.rotation.x = -0.5;
  const blueRingB = new T.Mesh(
    new T.TorusGeometry(4.5, 0.018, 8, 160),
    new T.MeshBasicMaterial({ color: 0x3a5fe0, transparent: true, opacity: 0.22 })
  );
  blueRingB.rotation.x = 1.1;
  blueRingB.rotation.z = -0.35;

  group.add(redRing, deepRing, blueRingA, blueRingB);

  /* core */
  const coreGroup = new T.Group();
  const core = new T.Mesh(
    new T.SphereGeometry(0.85, 32, 32),
    new T.MeshBasicMaterial({ color: 0xffe9ea })
  );
  const cage = new T.Mesh(
    new T.IcosahedronGeometry(1.7, 1),
    new T.MeshBasicMaterial({ color: 0x4a7bff, wireframe: true, transparent: true, opacity: 0.3 })
  );
  const octa = new T.Mesh(
    new T.OctahedronGeometry(2.35, 0),
    new T.MeshBasicMaterial({ color: 0xe02a30, wireframe: true, transparent: true, opacity: 0.4 })
  );
  coreGroup.add(core, cage, octa);
  group.add(coreGroup);

  /* glow sprite */
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = glowCanvas.height = 128;
  const gctx = glowCanvas.getContext('2d');
  const grad = gctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255, 150, 150, 0.55)');
  grad.addColorStop(0.35, 'rgba(224, 42, 48, 0.18)');
  grad.addColorStop(1, 'rgba(224, 42, 48, 0)');
  gctx.fillStyle = grad;
  gctx.fillRect(0, 0, 128, 128);
  const glowTex = new T.CanvasTexture(glowCanvas);
  const glow = new T.Sprite(new T.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, opacity: 0.75 }));
  glow.scale.set(7.5, 7.5, 1);
  group.add(glow);

  /* orbiting plates */
  const plates = new T.Group();
  const plateGeo = new T.BoxGeometry(0.5, 0.3, 0.05);
  for (let i = 0; i < 10; i += 1) {
    const a = (i / 10) * Math.PI * 2;
    const plate = new T.Mesh(
      plateGeo,
      new T.MeshBasicMaterial({ color: 0xc90207, transparent: true, opacity: 0.16 })
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
    new T.PointsMaterial({ color: 0x4a7bff, size: 0.045, transparent: true, opacity: 0.5, depthWrite: false })
  );
  scene.add(dust);

  /* click pulse rings */
  const pulses = [];
  const pulseGeo = new T.RingGeometry(0.96, 1, 64);
  function firePulse() {
    if (pulses.length > 4) return;
    const mesh = new T.Mesh(
      pulseGeo,
      new T.MeshBasicMaterial({ color: 0xff8a8f, transparent: true, opacity: 0.75, side: T.DoubleSide, depthWrite: false })
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
      /* rings sit behind the centered portrait card */
      group.position.x = 0;
      group.position.y = -1.5;
      group.scale.setScalar(0.85);
      glow.scale.set(6.5, 6.5, 1);
    } else {
      group.position.x = 0;
      group.position.y = -2.4;
      group.scale.setScalar(0.55);
      glow.scale.set(5, 5, 1);
    }
  }
  layout();

  /* interaction state */
  let mx = 0;
  let my = 0;
  let dragging = false;
  let moved = 0;
  let lastX = 0;
  let lastY = 0;
  let velX = 0;
  let velY = 0;

  if (finePointer) {
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      mx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      my = ((e.clientY - r.top) / r.height - 0.5) * 2;
    }, { passive: true });
  }

  hero.addEventListener('pointerdown', (e) => {
    if (e.target.closest && e.target.closest('a, button, input, .hero-copy, .hero-photo, .jarvis')) return;
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

  /* start after the intro finishes */
  let clock = performance.now();
  let t = 0;

  canvas.classList.add('is-live');
  whenIntroDone(() => {
    if (!raf && inView && visible) {
      clock = performance.now();
      raf = window.requestAnimationFrame(animate);
    }
  });
  if (document.documentElement.classList.contains('pl-done') ||
      !document.documentElement.classList.contains('pl-on')) {
    clock = performance.now();
    raf = window.requestAnimationFrame(animate);
  }

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

    /* scroll parallax */
    const heroH = hero.offsetHeight || 1;
    const prog = Math.min(1, Math.max(0, window.scrollY / heroH));
    dust.position.y = prog * 2.4;
    camera.position.y = -my * 0.5 - prog * 0.6;
    camera.position.x = mx * 0.75;
    camera.lookAt(group.position.x, group.position.y * 0.4, 0);

    coreGroup.rotation.y += dt * 0.5;
    coreGroup.rotation.x += dt * 0.22;
    octa.rotation.y -= dt * 0.35;
    cage.rotation.z += dt * 0.18;
    const cs = 1 + Math.sin(t * 2.4) * 0.04;
    core.scale.set(cs, cs, cs);
    glow.material.opacity = 0.65 + Math.sin(t * 2.4) * 0.1;

    deepRing.rotation.z += dt * 0.16;
    blueRingA.rotation.z += dt * 0.3;
    blueRingB.rotation.z -= dt * 0.2;
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
