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

// ── SVG GRADIENT DEFS FOR PROGRESS RINGS ─────────────────────
(function injectSvgGradient() {
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.style.position = 'absolute';
  svg.style.width = '0';
  svg.style.height = '0';
  const defs = document.createElementNS(svgNS, 'defs');
  const grad = document.createElementNS(svgNS, 'linearGradient');
  grad.id = 'goldGrad';
  grad.setAttribute('x1', '0%');
  grad.setAttribute('y1', '0%');
  grad.setAttribute('x2', '100%');
  grad.setAttribute('y2', '100%');
  const stops = [
    { offset: '0%', color: '#d4af37' },
    { offset: '50%', color: '#f4e4c1' },
    { offset: '100%', color: '#d4af37' },
  ];
  stops.forEach(s => {
    const stop = document.createElementNS(svgNS, 'stop');
    stop.setAttribute('offset', s.offset);
    stop.setAttribute('stop-color', s.color);
    grad.appendChild(stop);
  });
  defs.appendChild(grad);
  svg.appendChild(defs);
  document.body.prepend(svg);
})();

// ── PARTICLE SYSTEM ──────────────────────────────────────────
const canvas = document.getElementById('particle-canvas');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let W, H, particles = [], mouse = { x: -9999, y: -9999 };
  const GOLD = [201, 168, 76], BLUE = [59, 130, 246], PURPLE = [139, 92, 246];

  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', () => { resize(); init(); });

  class Particle {
    constructor() { this.reset(true); }
    reset(initial) {
      this.x = Math.random() * W;
      this.y = initial ? Math.random() * H : (Math.random() > 0.5 ? -5 : H + 5);
      this.size = Math.random() * 1.8 + 0.3;
      this.vx = (Math.random() - 0.5) * 0.3;
      this.vy = (Math.random() - 0.5) * 0.3;
      const roll = Math.random();
      this.color = roll < 0.55 ? GOLD : roll < 0.8 ? BLUE : PURPLE;
      this.alpha = Math.random() * 0.5 + 0.15;
      this.baseAlpha = this.alpha;
    }
    update() {
      const dx = mouse.x - this.x, dy = mouse.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 140) {
        const force = (140 - dist) / 140;
        const angle = Math.atan2(dy, dx);
        this.vx -= Math.cos(angle) * force * 2.2;
        this.vy -= Math.sin(angle) * force * 2.2;
        this.alpha = Math.min(1, this.baseAlpha + force * 0.7);
      } else if (dist < 300) {
        const force = (dist - 140) / 160 * 0.06;
        const angle = Math.atan2(dy, dx);
        this.vx += Math.cos(angle) * force;
        this.vy += Math.sin(angle) * force;
        this.alpha = this.baseAlpha + (1 - dist / 300) * 0.25;
      } else { this.alpha += (this.baseAlpha - this.alpha) * 0.04; }
      this.vx *= 0.96; this.vy *= 0.96;
      this.vx += (Math.random() - 0.5) * 0.04;
      this.vy += (Math.random() - 0.5) * 0.04;
      this.x += this.vx; this.y += this.vy;
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
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          const alpha = (1 - dist / 120) * 0.18;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(${particles[i].color[0]},${particles[i].color[1]},${particles[i].color[2]},${alpha})`;
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

  if (!prefersReducedMotion) { init(); animate(); }
}

// ── CURSOR TRACKING ──────────────────────────────────────────
const cursor = document.getElementById('cursor');
const ring = document.getElementById('cursor-ring');
const spotlight = document.getElementById('spotlight');
let rx = 0, ry = 0;

if (!isTouchDevice && cursor && ring) {
  document.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
    if (spotlight) {
      spotlight.style.left = e.clientX + 'px';
      spotlight.style.top = e.clientY + 'px';
      spotlight.classList.add('visible');
    }
  });

  function lerpCursor() {
    rx += (mouse.x - rx) * 0.13;
    ry += (mouse.y - ry) * 0.13;
    if (ring) { ring.style.left = rx + 'px'; ring.style.top = ry + 'px'; }
    requestAnimationFrame(lerpCursor);
  }
  lerpCursor();

  document.addEventListener('mouseleave', () => {
    mouse.x = -9999; mouse.y = -9999;
    if (spotlight) spotlight.classList.remove('visible');
  });

  // ── MAGNETIC BUTTONS ─────────────────────────────────-------
  document.querySelectorAll('.magnetic-btn').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      const dx = e.clientX - r.left - r.width / 2;
      const dy = e.clientY - r.top - r.height / 2;
      btn.style.transform = `translate(${dx * 0.2}px, ${dy * 0.2}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
}

// ── 3D TILT CARDS ────────────────────────────────────────────
document.querySelectorAll('.tilt-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    if (isTouchDevice) return;
    const r = card.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    const centerX = r.width / 2;
    const centerY = r.height / 2;
    const rotateX = ((y - centerY) / centerY) * -6;
    const rotateY = ((x - centerX) / centerX) * 6;
    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02,1.02,1.02)`;
  });
  card.addEventListener('mouseleave', () => {
    if (isTouchDevice) return;
    card.style.transform = '';
  });
});

// ── HAMBURGER MENU ───────────────────────────────────────────
const navToggle = document.getElementById('navToggle');
const navLinksEl = document.getElementById('navLinks');
const navLinkItems = document.querySelectorAll('.nav-link');

if (navToggle && navLinksEl) {
  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navLinksEl.classList.toggle('open');
    document.body.style.overflow = navLinksEl.classList.contains('open') ? 'hidden' : '';
  });
  navLinkItems.forEach(link => {
    link.addEventListener('click', () => {
      navToggle.classList.remove('active');
      navLinksEl.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

// ── CARD MOUSE-TRACKING GLOW ─────────────────────────────────
document.querySelectorAll('.skill-card, .project-card, .cert-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
    card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
  });
});

// ── ANIMATED BORDER ANGLE ────────────────────────────────────
(function animateBorders() {
  const cards = document.querySelectorAll('.skill-card');
  if (cards.length === 0 || prefersReducedMotion) return;
  let angle = 0;
  function step() {
    angle += 0.3;
    cards.forEach(c => { c.style.setProperty('--angle', angle + 'deg'); });
    requestAnimationFrame(step);
  }
  step();
})();

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

// ── TYPEWRITER HERO SUBTITLE ─────────────────────────────────
(function typewriter() {
  const el = document.getElementById('heroSubtitle');
  if (!el) return;
  const phrases = [
    'Building scalable web & mobile solutions',
    'Full Stack Developer | Del Institute of Technology',
    'React.js &bull; Node.js &bull; Laravel &bull; Golang',
    'Turning ideas into real products'
  ];
  let phraseIdx = 0, charIdx = 0, isDeleting = false;
  const speed = 50, deleteSpeed = 30, pause = 2000;

  function tick() {
    const current = phrases[phraseIdx];
    if (!isDeleting) {
      el.textContent = current.substring(0, charIdx + 1);
      charIdx++;
      if (charIdx === current.length) {
        isDeleting = true;
        setTimeout(tick, pause);
        return;
      }
      setTimeout(tick, speed);
    } else {
      el.textContent = current.substring(0, charIdx - 1);
      charIdx--;
      if (charIdx === 0) {
        isDeleting = false;
        phraseIdx = (phraseIdx + 1) % phrases.length;
        setTimeout(tick, 300);
        return;
      }
      setTimeout(tick, deleteSpeed);
    }
  }
  setTimeout(tick, 1500);
})();

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
        setTimeout(() => { btn.textContent = originalText; btn.disabled = false; btn.style.background = ''; }, 3000);
      } else { throw new Error('Failed'); }
    })
    .catch(() => {
      btn.textContent = 'Failed - try again';
      btn.style.background = 'linear-gradient(135deg, #8a2d2d, #b33c3c)';
      setTimeout(() => { btn.textContent = originalText; btn.disabled = false; btn.style.background = ''; }, 3000);
    });
  });
}