// ── TOUCH DETECTION ──────────────────────────────────────────
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
if (isTouchDevice) document.body.classList.add('touch');

// ── PRELOADER ────────────────────────────────────────────────
window.addEventListener('load', () => {
  const preloader = document.getElementById('preloader');
  if (preloader) {
    preloader.classList.add('hidden');
    setTimeout(() => { preloader.style.display = 'none'; }, 600);
  }
});

// ── REDUCED MOTION CHECK ─────────────────────────────────────
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── PARTICLE SYSTEM ──────────────────────────────────────────
const canvas = document.getElementById('particle-canvas');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let W, H, particles = [], mouse = { x: -9999, y: -9999 };
  const GOLD = [201, 168, 76];
  const BLUE = [59, 130, 246];
  const PURPLE = [139, 92, 246];

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', () => { resize(); init(); });

  class Particle {
    constructor() { this.reset(true); }
    reset(initial) {
      this.x = Math.random() * W;
      this.y = initial ? Math.random() * H : (Math.random() > 0.5 ? -5 : H + 5);
      this.size = Math.random() * 1.8 + 0.3;
      this.baseX = this.x;
      this.baseY = this.y;
      this.vx = (Math.random() - 0.5) * 0.3;
      this.vy = (Math.random() - 0.5) * 0.3;
      const roll = Math.random();
      this.color = roll < 0.55 ? GOLD : roll < 0.8 ? BLUE : PURPLE;
      this.alpha = Math.random() * 0.5 + 0.15;
      this.baseAlpha = this.alpha;
      this.life = 1;
      this.connected = [];
    }
    update() {
      const dx = mouse.x - this.x;
      const dy = mouse.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const repelRadius = 140;
      const attractRadius = 300;

      if (dist < repelRadius) {
        const force = (repelRadius - dist) / repelRadius;
        const angle = Math.atan2(dy, dx);
        this.vx -= Math.cos(angle) * force * 2.2;
        this.vy -= Math.sin(angle) * force * 2.2;
        this.alpha = Math.min(1, this.baseAlpha + force * 0.7);
      } else if (dist < attractRadius) {
        const force = (dist - repelRadius) / (attractRadius - repelRadius) * 0.06;
        const angle = Math.atan2(dy, dx);
        this.vx += Math.cos(angle) * force;
        this.vy += Math.sin(angle) * force;
        this.alpha = this.baseAlpha + (1 - dist / attractRadius) * 0.25;
      } else {
        this.alpha += (this.baseAlpha - this.alpha) * 0.04;
      }

      this.vx *= 0.96;
      this.vy *= 0.96;
      this.vx += (Math.random() - 0.5) * 0.04;
      this.vy += (Math.random() - 0.5) * 0.04;

      this.x += this.vx;
      this.y += this.vy;

      if (this.x < -20) this.x = W + 20;
      if (this.x > W + 20) this.x = -20;
      if (this.y < -20) this.y = H + 20;
      if (this.y > H + 20) this.y = -20;
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.color[0]},${this.color[1]},${this.color[2]},${this.alpha})`;
      ctx.fill();
    }
  }

  function drawConnections() {
    const maxDist = 120;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxDist) {
          const alpha = (1 - dist / maxDist) * 0.18;
          const c = particles[i].color;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  function drawMouseGlow() {
    if (mouse.x < 0 || mouse.x > W) return;
    const grd = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 180);
    grd.addColorStop(0, 'rgba(201,168,76,0.06)');
    grd.addColorStop(0.5, 'rgba(201,168,76,0.02)');
    grd.addColorStop(1, 'rgba(201,168,76,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);
  }

  function init() {
    particles = [];
    const density = isTouchDevice ? 14000 : 9000;
    const count = Math.min(Math.floor((W * H) / density), isTouchDevice ? 80 : 160);
    for (let i = 0; i < count; i++) particles.push(new Particle());
  }

  function animate() {
    ctx.clearRect(0, 0, W, H);
    drawMouseGlow();
    drawConnections();
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animate);
  }

  if (!prefersReducedMotion) {
    init();
    animate();
  }
}

// ── CURSOR TRACKING ──────────────────────────────────────────
const cursor = document.getElementById('cursor');
const ring = document.getElementById('cursor-ring');
let rx = 0, ry = 0;

if (!isTouchDevice && cursor && ring) {
  document.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
  });

  function lerpCursor() {
    rx += (mouse.x - rx) * 0.13;
    ry += (mouse.y - ry) * 0.13;
    ring.style.left = rx + 'px';
    ring.style.top = ry + 'px';
    requestAnimationFrame(lerpCursor);
  }
  lerpCursor();

  document.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });
}

// ── HAMBURGER MENU ───────────────────────────────────────────
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
const navLinkItems = document.querySelectorAll('.nav-link');

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navLinks.classList.toggle('open');
    document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
  });

  navLinkItems.forEach(link => {
    link.addEventListener('click', () => {
      navToggle.classList.remove('active');
      navLinks.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

// ── CARD MOUSE-TRACKING GLOW ─────────────────────────────────
document.querySelectorAll('.skill-card, .project-card, .cert-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width * 100).toFixed(1);
    const y = ((e.clientY - r.top) / r.height * 100).toFixed(1);
    card.style.setProperty('--mx', x + '%');
    card.style.setProperty('--my', y + '%');
  });
});

// ── NAVBAR SCROLL ────────────────────────────────────────────
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
});

// ── BACK TO TOP ──────────────────────────────────────────────
const backToTop = document.getElementById('backToTop');
if (backToTop) {
  window.addEventListener('scroll', () => {
    backToTop.classList.toggle('visible', window.scrollY > 500);
  });
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ── SCROLL FADE IN ───────────────────────────────────────────
const observer = new IntersectionObserver(entries => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add('visible'), i * 90);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

// ── COUNT-UP ANIMATION ───────────────────────────────────────
const counters = document.querySelectorAll('[data-count]');
const countObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target = +el.dataset.count;
      let current = 0;
      const step = Math.ceil(target / 30);
      const timer = setInterval(() => {
        current = Math.min(current + step, target);
        el.textContent = current + '+';
        if (current >= target) clearInterval(timer);
      }, 40);
      countObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });
counters.forEach(c => countObserver.observe(c));

// ── CONTACT FORM ─────────────────────────────────────────────
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', e => {
    e.preventDefault();
    const btn = contactForm.querySelector('.form-btn');
    const originalText = btn.textContent;
    btn.textContent = 'Sending...';
    btn.disabled = true;

    const formData = new FormData(contactForm);
    const data = {};
    formData.forEach((val, key) => { data[key] = val; });

    fetch('https://formsubmit.co/ajax/danieltbg145@gmail.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
      if (result.success) {
        btn.textContent = 'Sent! Thank you';
        btn.style.background = 'linear-gradient(135deg, #2d8a4e, #3cb371)';
        contactForm.reset();
        setTimeout(() => {
          btn.textContent = originalText;
          btn.disabled = false;
          btn.style.background = '';
        }, 3000);
      } else {
        throw new Error('Failed to send');
      }
    })
    .catch(() => {
      btn.textContent = 'Failed - try again';
      btn.style.background = 'linear-gradient(135deg, #8a2d2d, #b33c3c)';
      setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
        btn.style.background = '';
      }, 3000);
    });
  });
}