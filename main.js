/* ============================================================
   NEXUS TECH — main.js
   ============================================================ */

// ── Header scroll ───────────────────────────────────────────
const header = document.getElementById('header');
if (header) {
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });
}

// ── Hamburger ───────────────────────────────────────────────
const hamburger = document.getElementById('hamburger');
const navMenu   = document.getElementById('nav-menu');
if (hamburger && navMenu) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('open');
  });
  navMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      hamburger.classList.remove('active');
      navMenu.classList.remove('open');
    });
  });
}

// ── Typewriter / Rotator ────────────────────────────────────
const words     = ['Proyectos', 'Marketing Digital', 'Inteligencia Artificial', 'Diseño Web', 'Business Intelligence'];
const twEl      = document.getElementById('typewriter');
let   wordIndex = 0;
let   charIndex = 0;
let   deleting  = false;

function type() {
  if (!twEl) return;
  const current = words[wordIndex];
  if (deleting) {
    twEl.textContent = current.substring(0, charIndex--);
    if (charIndex < 0) {
      deleting = false;
      wordIndex = (wordIndex + 1) % words.length;
      setTimeout(type, 400);
      return;
    }
  } else {
    twEl.textContent = current.substring(0, charIndex++);
    if (charIndex > current.length) {
      setTimeout(() => { deleting = true; type(); }, 2800);
      return;
    }
  }
  setTimeout(type, deleting ? 55 : 85);
}
type();

// ── Atomic Canvas Animation ─────────────────────────────────
const canvas = document.getElementById('atomicCanvas');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let W, H, scrollY = 0;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });
  window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

  const ORBITS = [
    { radius: 140, speed: 0.008, angle: 0,       tilt: 15,  color: '#0066FF', particles: 1 },
    { radius: 200, speed: -0.005, angle: Math.PI/3, tilt: 55,  color: '#00C6FF', particles: 1 },
    { radius: 260, speed: 0.004, angle: Math.PI,   tilt: 100, color: '#CC5500', particles: 1 },
    { radius: 310, speed: -0.003, angle: Math.PI/1.5, tilt: 135, color: '#0066FF', particles: 1 },
  ];

  function drawOrbit(orbit) {
    const cx = W / 2, cy = H / 2;
    const influence = Math.min(scrollY / 400, 1);
    const dynamic   = orbit.radius + influence * 40;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(orbit.tilt * Math.PI / 180);

    // Orbit path
    ctx.beginPath();
    ctx.ellipse(0, 0, dynamic, dynamic * 0.35, 0, 0, Math.PI * 2);
    ctx.strokeStyle = orbit.color + '30';
    ctx.lineWidth   = 1;
    ctx.stroke();

    // Electron
    orbit.angle += orbit.speed;
    const ex = Math.cos(orbit.angle) * dynamic;
    const ey = Math.sin(orbit.angle) * dynamic * 0.35;

    // Glow
    const grd = ctx.createRadialGradient(ex, ey, 0, ex, ey, 14);
    grd.addColorStop(0, orbit.color + 'CC');
    grd.addColorStop(1, orbit.color + '00');
    ctx.beginPath();
    ctx.arc(ex, ey, 14, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();

    // Core
    ctx.beginPath();
    ctx.arc(ex, ey, 4, 0, Math.PI * 2);
    ctx.fillStyle = orbit.color;
    ctx.shadowBlur  = 12;
    ctx.shadowColor = orbit.color;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  function drawNucleus() {
    const cx = W / 2, cy = H / 2;
    const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 28);
    grd.addColorStop(0, 'rgba(0,198,255,.95)');
    grd.addColorStop(0.5, 'rgba(0,102,255,.5)');
    grd.addColorStop(1,   'rgba(0,102,255,0)');
    ctx.beginPath();
    ctx.arc(cx, cy, 28, 0, Math.PI * 2);
    ctx.fillStyle  = grd;
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#0066FF';
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    drawNucleus();
    ORBITS.forEach(drawOrbit);
    requestAnimationFrame(loop);
  }
  loop();
}

// ── Blog Likes ──────────────────────────────────────────────
document.querySelectorAll('.blog-likes').forEach(btn => {
  btn.addEventListener('click', function () {
    const isLiked = this.classList.toggle('liked');
    const span    = this.querySelector('.like-count');
    if (span) span.textContent = parseInt(span.textContent) + (isLiked ? 1 : -1);
  });
});

// ── FAQ Accordion ───────────────────────────────────────────
document.querySelectorAll('.faq-question').forEach(btn => {
  btn.addEventListener('click', function () {
    const item   = this.closest('.faq-item');
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(el => el.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
});

// ── Scroll Reveal ───────────────────────────────────────────
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// ── Contact Form ────────────────────────────────────────────
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  const inputs = contactForm.querySelectorAll('input, textarea');

  // Live uppercase for nombres/apellidos
  ['nombres','apellidos'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => { el.value = el.value.toUpperCase(); });
  });

  function validate() {
    let valid = true;
    inputs.forEach(el => el.classList.remove('error'));

    const nombres   = document.getElementById('nombres');
    const apellidos = document.getElementById('apellidos');
    const correo    = document.getElementById('correo');
    const telefono  = document.getElementById('telefono');
    const mensaje   = document.getElementById('mensaje');

    if (nombres   && !nombres.value.trim())    { nombres.classList.add('error');   valid = false; }
    if (apellidos && !apellidos.value.trim())  { apellidos.classList.add('error'); valid = false; }
    if (correo    && !/\S+@\S+/.test(correo.value)) { correo.classList.add('error'); valid = false; }
    if (telefono  && !telefono.value.trim())   { telefono.classList.add('error');  valid = false; }
    if (mensaje   && !mensaje.value.trim())    { mensaje.classList.add('error');   valid = false; }
    return valid;
  }

  contactForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!validate()) return;

    const btn = contactForm.querySelector('button[type="submit"]');
    const successEl = document.getElementById('formSuccess');
    const errorEl   = document.getElementById('formError');
    if (successEl) successEl.style.display = 'none';
    if (errorEl)   errorEl.style.display   = 'none';

    btn.textContent = 'Enviando…';
    btn.disabled    = true;

    try {
      // Enviar como JSON a la API de Vercel
      const formData = new FormData(contactForm);
      const payload  = Object.fromEntries(formData.entries());
      const res      = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data     = await res.json();

      if (data.success) {
        if (successEl) successEl.style.display = 'block';
        contactForm.reset();
      } else {
        if (errorEl) { errorEl.textContent = data.message || 'Error al enviar.'; errorEl.style.display = 'block'; }
      }
    } catch {
      if (errorEl) { errorEl.textContent = 'Error de conexión. Inténtalo de nuevo.'; errorEl.style.display = 'block'; }
    } finally {
      btn.textContent = 'Enviar Mensaje';
      btn.disabled    = false;
    }
  });
}

// ── Newsletter ───────────────────────────────────────────────
document.querySelectorAll('.newsletter-form').forEach(form => {
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const input = form.querySelector('input');
    if (input && input.value.includes('@')) {
      form.innerHTML = '<p style="color:#5CFFB0;font-size:.88rem;padding:10px 0">✔ ¡Suscrito exitosamente!</p>';
    }
  });
});
