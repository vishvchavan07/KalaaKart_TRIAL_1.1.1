/**
 * KalaaKart Smart Rentals — Frontend JS (Premium Edition)
 *
 * Features:
 *  - Typewriter heading animation
 *  - Floating particle canvas (requestAnimationFrame)
 *  - Top progress bar with smooth fill
 *  - Spring-physics card stagger entry
 *  - Button ripple on click
 *  - Count-up animation on badge
 *  - Copy-to-clipboard for plain-text summary
 *  - Real-time field validation
 */

'use strict';

// ── Config ────────────────────────────────────────────────────────────────────

const API_BASE = 'http://localhost:3001';

const BRANCHES = [
  'Computer Engineering',
  'Electronics Engineering',
  'Electrical Engineering',
  'IT',
  'Mechanical Engineering',
  'Civil Engineering',
];

const TYPE_META = {
  lab:       { icon: '🔬', label: 'Lab',       cls: 'lab' },
  exam:      { icon: '📝', label: 'Exam',      cls: 'exam' },
  hackathon: { icon: '💡', label: 'Hackathon', cls: 'hackathon' },
};

// ── DOM refs ──────────────────────────────────────────────────────────────────

const progressBar    = document.getElementById('progress-bar');
const form           = document.getElementById('rec-form');
const branchSel      = document.getElementById('branch-select');
const semesterIn     = document.getElementById('semester-input');
const dateIn         = document.getElementById('date-input');
const submitBtn      = document.getElementById('submit-btn');
const btnText        = document.getElementById('btn-text');
const btnIcon        = document.getElementById('btn-icon');
const btnRipple      = document.getElementById('btn-ripple');

const resultsSection = document.getElementById('results-section');
const resultsProfile = document.getElementById('results-profile');
const recList        = document.getElementById('rec-list');
const countNumber    = document.getElementById('count-number');
const copyBtn        = document.getElementById('copy-btn');
const copyIcon       = document.getElementById('copy-icon');

const errorPanel     = document.getElementById('error-panel');
const errorPanelMsg  = document.getElementById('error-panel-msg');

const errBranch   = document.getElementById('err-branch');
const errSemester = document.getElementById('err-semester');
const errDate     = document.getElementById('err-date');

// ── Stored text for copy ──────────────────────────────────────────────────────
let lastPlainText = '';

// ══════════════════════════════════════════════════════════════════════════════
// 1. PARTICLE CANVAS
// ══════════════════════════════════════════════════════════════════════════════

(function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  const ctx    = canvas.getContext('2d');
  let W, H, particles;

  const PARTICLE_COUNT  = 55;
  const PALETTE = ['#845aff','#6c3eff','#38bdf8','#e879f9','#4ade80'];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function mkParticle() {
    return {
      x    : Math.random() * W,
      y    : Math.random() * H,
      r    : Math.random() * 1.8 + 0.4,
      vx   : (Math.random() - 0.5) * 0.35,
      vy   : (Math.random() - 0.5) * 0.35,
      alpha: Math.random() * 0.5 + 0.15,
      color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
    };
  }

  function init() {
    resize();
    particles = Array.from({ length: PARTICLE_COUNT }, mkParticle);
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fill();

      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -5)    p.x = W + 5;
      if (p.x > W + 5) p.x = -5;
      if (p.y < -5)    p.y = H + 5;
      if (p.y > H + 5) p.y = -5;
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  init();
  draw();
})();

// ══════════════════════════════════════════════════════════════════════════════
// 2. TYPEWRITER
// ══════════════════════════════════════════════════════════════════════════════

(function initTypewriter() {
  const target  = document.getElementById('typewriter-target');
  const PHRASES = [
    'Rent smarter this semester.',
    'Know before you go to class.',
    'Your semester, predicted.',
  ];
  let pi = 0, ci = 0, deleting = false, pauseTick = 0;
  const SPEED_TYPE = 55, SPEED_DEL = 28, PAUSE = 42;

  function tick() {
    const phrase = PHRASES[pi];
    if (!deleting) {
      target.textContent = phrase.slice(0, ++ci);
      if (ci === phrase.length) { deleting = true; pauseTick = 0; setTimeout(tick, 1600); return; }
    } else {
      if (pauseTick < PAUSE) { pauseTick++; setTimeout(tick, SPEED_DEL); return; }
      target.textContent = phrase.slice(0, --ci);
      if (ci === 0) { deleting = false; pi = (pi + 1) % PHRASES.length; }
    }
    setTimeout(tick, deleting ? SPEED_DEL : SPEED_TYPE);
  }
  setTimeout(tick, 500);
})();

// ══════════════════════════════════════════════════════════════════════════════
// 3. PROGRESS BAR
// ══════════════════════════════════════════════════════════════════════════════

let progressInterval = null;
let progressValue    = 0;

function progressStart() {
  progressValue = 0;
  progressBar.style.width = '0%';
  progressBar.classList.add('loading');
  progressInterval = setInterval(() => {
    // logarithmic crawl — never reaches 100 on its own
    const remaining = 92 - progressValue;
    progressValue  += remaining * 0.07;
    progressBar.style.width = progressValue + '%';
  }, 80);
}

function progressFinish() {
  clearInterval(progressInterval);
  progressBar.style.width = '100%';
  setTimeout(() => {
    progressBar.style.opacity = '0';
    progressBar.style.width   = '0%';
    setTimeout(() => {
      progressBar.style.opacity = '';
      progressBar.classList.remove('loading');
    }, 400);
  }, 350);
}

// ══════════════════════════════════════════════════════════════════════════════
// 4. BUTTON RIPPLE
// ══════════════════════════════════════════════════════════════════════════════

submitBtn.addEventListener('pointerdown', (e) => {
  const rect = submitBtn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 2;
  const x    = e.clientX - rect.left - size / 2;
  const y    = e.clientY - rect.top  - size / 2;

  btnRipple.style.cssText = `
    width:${size}px;height:${size}px;
    left:${x}px;top:${y}px;
  `;
  btnRipple.classList.remove('active');
  void btnRipple.offsetWidth;
  btnRipple.classList.add('active');
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. BRANCH DROPDOWN
// ══════════════════════════════════════════════════════════════════════════════

BRANCHES.forEach((b) => {
  const opt      = document.createElement('option');
  opt.value      = b;
  opt.textContent = b;
  branchSel.appendChild(opt);
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. VALIDATION
// ══════════════════════════════════════════════════════════════════════════════

function setErr(el, input, msg) {
  el.textContent = msg || '';
  el.classList.toggle('visible', !!msg);
  input.classList.toggle('invalid', !!msg);
}

function clearAllErrors() {
  setErr(errBranch,   branchSel,   '');
  setErr(errSemester, semesterIn,  '');
  setErr(errDate,     dateIn,      '');
}

function validate() {
  let ok = true;

  if (!branchSel.value) {
    setErr(errBranch, branchSel, 'Please choose your branch.');
    ok = false;
  }

  const sem = parseInt(semesterIn.value, 10);
  if (!semesterIn.value || isNaN(sem) || sem < 1 || sem > 8) {
    setErr(errSemester, semesterIn, 'Enter a semester between 1 and 8.');
    ok = false;
  }

  if (!dateIn.value) {
    setErr(errDate, dateIn, 'Please pick a semester start date.');
    ok = false;
  }

  return ok;
}

// Live clear on correction
branchSel.addEventListener('change', () => { if (branchSel.value) setErr(errBranch, branchSel, ''); });
semesterIn.addEventListener('input', () => {
  const v = parseInt(semesterIn.value, 10);
  if (semesterIn.value && !isNaN(v) && v >= 1 && v <= 8) setErr(errSemester, semesterIn, '');
});
dateIn.addEventListener('change', () => { if (dateIn.value) setErr(errDate, dateIn, ''); });

// ══════════════════════════════════════════════════════════════════════════════
// 7. LOADING STATE
// ══════════════════════════════════════════════════════════════════════════════

function setLoading(on) {
  submitBtn.disabled = on;
  submitBtn.classList.toggle('loading', on);
  btnIcon.textContent = on ? '⏳' : '✦';
  btnText.textContent = on ? 'Finding your rentals…' : 'Get Recommendations';
}

// ══════════════════════════════════════════════════════════════════════════════
// 8. COUNT-UP ANIMATION
// ══════════════════════════════════════════════════════════════════════════════

function countUp(target, duration = 600) {
  const start = performance.now();
  function step(now) {
    const t = Math.min((now - start) / duration, 1);
    const val = Math.round(t * target);
    countNumber.textContent = val;
    if (t < 1) requestAnimationFrame(step);
    else countNumber.textContent = target;
  }
  requestAnimationFrame(step);
}

// ══════════════════════════════════════════════════════════════════════════════
// 9. RENDER RECOMMENDATIONS
// ══════════════════════════════════════════════════════════════════════════════

function esc(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function renderResults(data, profile) {
  const { recommendations, text } = data;
  lastPlainText = text;

  const count = recommendations.length;

  resultsProfile.textContent = `${profile.branch} · Semester ${profile.semester} · from ${profile.semesterStartDate}`;
  recList.innerHTML = '';

  if (count === 0) {
    recList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📭</div>
        <p class="empty-title">No active recommendations right now</p>
        <p class="empty-msg">${esc(text)}</p>
      </div>`;
  } else {
    recommendations.forEach((rec, i) => {
      const meta   = TYPE_META[rec.type] || { icon:'📦', label: rec.type, cls: rec.type };
      const chips  = (rec.items || []).map(it => `<span class="chip">${esc(it)}</span>`).join('');
      const card   = document.createElement('div');
      card.className = `rec-card ${meta.cls}`;
      card.style.animationDelay = `${i * 70}ms`;
      card.innerHTML = `
        <div class="rec-badge ${meta.cls}">
          <span aria-hidden="true">${meta.icon}</span>
          <span>${meta.label}</span>
        </div>
        <p class="rec-title">${esc(rec.title)}</p>
        <p class="rec-msg">${esc(rec.message)}</p>
        ${chips ? `<p class="items-label">Suggested rentals</p><div class="chips">${chips}</div>` : ''}
      `;
      recList.appendChild(card);
    });
  }

  // Show section
  resultsSection.classList.remove('hidden');
  countUp(count);
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ══════════════════════════════════════════════════════════════════════════════
// 10. COPY TO CLIPBOARD
// ══════════════════════════════════════════════════════════════════════════════

copyBtn.addEventListener('click', async () => {
  if (!lastPlainText) return;
  try {
    await navigator.clipboard.writeText(lastPlainText);
    copyIcon.textContent = '✅';
    copyBtn.title = 'Copied!';
    setTimeout(() => { copyIcon.textContent = '📋'; copyBtn.title = 'Copy plain-text summary'; }, 2000);
  } catch {
    copyIcon.textContent = '❌';
    setTimeout(() => { copyIcon.textContent = '📋'; }, 2000);
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// 11. FORM SUBMIT
// ══════════════════════════════════════════════════════════════════════════════

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearAllErrors();

  // Hide previous results / errors
  resultsSection.classList.add('hidden');
  errorPanel.classList.add('hidden');

  if (!validate()) return;

  const profile = {
    branch           : branchSel.value,
    semester         : parseInt(semesterIn.value, 10),
    semesterStartDate: dateIn.value,
  };

  const params = new URLSearchParams({
    branch           : profile.branch,
    semester         : String(profile.semester),
    semesterStartDate: profile.semesterStartDate,
  });

  setLoading(true);
  progressStart();

  try {
    const res  = await fetch(`${API_BASE}/api/recommendations?${params}`);
    const data = await res.json();
    progressFinish();

    if (!res.ok) {
      errorPanelMsg.textContent = data.error || `Server error (${res.status}).`;
      errorPanel.classList.remove('hidden');
      return;
    }

    renderResults(data, profile);
  } catch (err) {
    progressFinish();
    const offline = err instanceof TypeError && err.message.toLowerCase().includes('fetch');
    errorPanelMsg.textContent = offline
      ? 'Cannot reach the backend. Make sure the server is running on http://localhost:3001.'
      : 'Unexpected error — check the console.';
    errorPanel.classList.remove('hidden');
    console.error(err);
  } finally {
    setLoading(false);
  }
});
