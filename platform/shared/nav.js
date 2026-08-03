/**
 * KalaaKart Platform — Shared Navbar
 * Call initNav() on every platform page to inject sidebar + mobile topbar
 */

const NAV_LINKS = [
  { section: 'Marketplace' },
  { href: '/KalaaKart_TRIAL_1.1.1/platform/index.html',              icon: '🏠', label: 'Home' },
  { href: '/KalaaKart_TRIAL_1.1.1/platform/listings/index.html',     icon: '📦', label: 'Browse & REUSE' },
  { href: '/KalaaKart_TRIAL_1.1.1/platform/listings/post.html',      icon: '➕', label: 'Sell / Rent Item' },
  { href: '/KalaaKart_TRIAL_1.1.1/platform/rentals/index.html',      icon: '📋', label: 'My Rentals' },
  { href: '/KalaaKart_TRIAL_1.1.1/platform/messages/index.html',     icon: '💬', label: 'Messages' },
  { section: 'Community' },
  { href: '/KalaaKart_TRIAL_1.1.1/platform/profiles/index.html',     icon: '👤', label: 'Profiles' },
  { href: '/KalaaKart_TRIAL_1.1.1/platform/mentor/index.html',       icon: '🎓', label: 'Mentor Booking' },
  { href: '/KalaaKart_TRIAL_1.1.1/platform/clubs/index.html',        icon: '🏛️', label: 'Club Equipment' },
  { section: 'AI Features' },
  { href: '/KalaaKart_TRIAL_1.1.1/platform/recommendations/index.html', icon: '🎯', label: 'Recommendations' },
  { href: '/KalaaKart_TRIAL_1.1.1/platform/pricing/index.html',      icon: '💰', label: 'Smart Pricing' },
  { href: '/KalaaKart_TRIAL_1.1.1/platform/ai-search/index.html',    icon: '🔍', label: 'AI Search' },
  { href: '/KalaaKart_TRIAL_1.1.1/platform/ai-describe/index.html',  icon: '✍️',  label: 'Description AI' },
  { section: 'Settings' },
  { href: '/KalaaKart_TRIAL_1.1.1/platform/admin/index.html',        icon: '⚙️',  label: 'Admin' },
];

function initNav() {
  const user    = getUser();
  const current = window.location.pathname;

  // ── Build sidebar ────────────────────────────────────────────────
  const sidebar = document.createElement('aside');
  sidebar.className = 'sidebar glass-2';
  sidebar.id = 'sidebar';

  let html = `
    <div class="nav-logo">
      <span class="nav-logo-dot"></span>
      <span class="nav-logo-text">KalaaKart</span>
    </div>`;

  NAV_LINKS.forEach(item => {
    if (item.section) {
      html += `<div class="nav-section">${item.section}</div><div class="nav-links" id="nl-${item.section.replace(/\s/g,'-')}">`;
    } else {
      const active = current.includes(item.href.replace('/platform','')) ? ' active' : '';
      html += `<a href="${item.href}" class="nav-link${active}">
        <span class="nav-icon">${item.icon}</span>
        <span>${item.label}</span>
      </a>`;
      // Close nav-links div after last item in each section (handled by next section open)
    }
  });
  html += `</div>`;  // close last section's nav-links

  html += `<div class="nav-spacer"></div>`;

  if (user) {
    html += `
      <div class="nav-user">
        <div class="nav-user-name">${escHTML(user.name)}</div>
        <div class="nav-user-branch">${escHTML(user.branch)} · Sem ${user.semester}</div>
        <button class="nav-logout" onclick="doLogout()">Sign out</button>
      </div>`;
  } else {
    html += `
      <div class="nav-user">
        <a href="/KalaaKart_TRIAL_1.1.1/platform/auth/login.html" class="btn btn-primary btn-sm btn-full">Sign in</a>
      </div>`;
  }

  sidebar.innerHTML = html;

  // Fix nav-links div nesting (close each section before opening next)
  // Rebuild properly
  sidebar.innerHTML = buildNavHTML(user, current);

  // ── Mobile topbar ────────────────────────────────────────────────
  const topbar = document.createElement('div');
  topbar.className = 'mobile-topbar glass-2';
  topbar.innerHTML = `
    <button class="menu-btn" onclick="toggleSidebar()">☰</button>
    <span class="mobile-logo">KalaaKart</span>
    <span style="width:32px"></span>`;

  // Overlay for mobile
  const overlay = document.createElement('div');
  overlay.id = 'nav-overlay';
  overlay.style.cssText = 'display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:99';
  overlay.onclick = () => toggleSidebar();

  document.body.prepend(overlay);
  document.body.prepend(topbar);
  document.body.prepend(sidebar);

  // ── Scroll-to-top ────────────────────────────────────────────────
  const scrollBtn = document.createElement('button');
  scrollBtn.id = 'scroll-top';
  scrollBtn.title = 'Back to top';
  scrollBtn.innerHTML = '↑';
  scrollBtn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  document.body.appendChild(scrollBtn);
  window.addEventListener('scroll', () => {
    scrollBtn.classList.toggle('visible', window.scrollY > 320);
  }, { passive: true });
  scrollBtn.classList.add('glass-2');

  // ── Site Footer ──────────────────────────────────────────────────
  const footer = document.createElement('footer');
  footer.className = 'site-footer';
  footer.innerHTML = `
    <div>
      <div class="footer-logo">● KalaaKart</div>
      <div style="margin-top:4px;font-size:.72rem">Student Rental &amp; Skills Marketplace · Phase 2</div>
    </div>
    <nav class="footer-links" aria-label="Footer links">
      <a href="/KalaaKart_TRIAL_1.1.1/platform/index.html">Home</a>
      <a href="/KalaaKart_TRIAL_1.1.1/platform/listings/index.html">Browse</a>
      <a href="/KalaaKart_TRIAL_1.1.1/platform/profiles/index.html">Profiles</a>
      <a href="/KalaaKart_TRIAL_1.1.1/platform/mentor/index.html">Mentors</a>
      <a href="/KalaaKart_TRIAL_1.1.1/platform/clubs/index.html">Clubs</a>
      <a href="/KalaaKart_TRIAL_1.1.1/platform/admin/index.html">Admin</a>
    </nav>
    <div class="footer-socials">
      <button class="footer-social-btn" title="GitHub" onclick="window.open('https://github.com','_blank')">𝗚</button>
      <button class="footer-social-btn" title="LinkedIn" onclick="window.open('https://linkedin.com','_blank')">in</button>
      <button class="footer-social-btn" title="Instagram" onclick="window.open('https://instagram.com','_blank')">📸</button>
    </div>
  `;
  document.body.appendChild(footer);

  // ── Scroll Reveals (Motion System) ───────────────────────────────
  if (typeof IntersectionObserver !== 'undefined') {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });
    
    // Allow DOM to settle before observing
    setTimeout(() => {
      document.querySelectorAll('[data-reveal]').forEach(el => revealObserver.observe(el));
    }, 100);
  }
}

function buildNavHTML(user, current) {
  let html = `
    <div class="nav-logo">
      <span class="nav-logo-dot"></span>
      <span class="nav-logo-text">KalaaKart</span>
    </div>`;

  let inSection = false;
  NAV_LINKS.forEach(item => {
    if (item.section) {
      if (inSection) html += `</div>`;
      html += `<div class="nav-section">${item.section}</div><div class="nav-links">`;
      inSection = true;
    } else {
      const active = current.endsWith(item.href.split('/').pop()) ? ' active' : '';
      html += `<a href="${item.href}" class="nav-link${active}">
        <span class="nav-icon">${item.icon}</span>
        <span>${item.label}</span>
      </a>`;
    }
  });
  if (inSection) html += `</div>`;

  html += `<div class="nav-spacer"></div>`;

  if (user) {
    html += `
      <div class="nav-user">
        <div class="nav-user-name">${escHTML(user.name)}</div>
        <div class="nav-user-branch">${escHTML(user.branch)} · Sem ${user.semester}</div>
        <button class="nav-logout" onclick="doLogout()">Sign out</button>
      </div>`;
  } else {
    html += `
      <div class="nav-user">
        <a href="/KalaaKart_TRIAL_1.1.1/platform/auth/login.html" class="btn btn-primary btn-sm btn-full" style="text-align:center">Sign in</a>
      </div>`;
  }
  return html;
}

function toggleSidebar() {
  const s = document.getElementById('sidebar');
  const o = document.getElementById('nav-overlay');
  const open = s.classList.toggle('open');
  o.style.display = open ? 'block' : 'none';
}

function doLogout() {
  clearSession();
  window.location.href = '/KalaaKart_TRIAL_1.1.1/platform/auth/login.html';
}

function escHTML(str) {
  return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
