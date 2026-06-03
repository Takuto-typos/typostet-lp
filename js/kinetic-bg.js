/*
 * TYP0stet kinetic background
 * 0 ロゴが画面背景でぐにゃぐにゃ浮遊する Canvas animation.
 * - 30 instances (desktop) / 12 (mobile)
 * - Pseudo-noise (sin-based) で浮遊 + 形状歪み
 * - opacity ~0.06 (subtle、content 邪魔しない)
 * - 30 fps cap、scroll 中 + non-visible tab で render pause
 * - prefers-reduced-motion で完全停止
 */
(function () {
  'use strict';

  const canvas = document.getElementById('kinetic-bg');
  if (!canvas || !canvas.getContext) return;

  const ctx = canvas.getContext('2d');

  let W = 0;
  let H = 0;
  let dpr = 1;
  let particles = [];
  let prefersReducedMotion = false;
  let isPausedByScroll = false;
  let isPausedByVisibility = false;
  let scrollTimer = null;
  let lastFrameTime = 0;
  const FPS_CAP = 30;
  const FRAME_MS = 1000 / FPS_CAP;

  // Tunables
  const COLOR = 'rgba(146, 229, 189, 0.065)'; // mint #92E5BD with subtle alpha
  const ZERO_SKEW = 0.18; // italic lean

  function isMobile() {
    return window.innerWidth < 768;
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2); // cap at 2x for perf
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  }

  function initParticles() {
    const count = isMobile() ? 12 : 30;
    particles = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        baseX: Math.random() * W,
        baseY: Math.random() * H,
        size: 50 + Math.random() * 130, // 50-180px
        offset: Math.random() * 1000,
        speed: 0.00025 + Math.random() * 0.0005,
        drift: 60 + Math.random() * 60, // px drift range
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  // Lightweight pseudo-noise (sin-based)
  function noise(x, y, t) {
    return (Math.sin(x * 1.3 + t * 0.7) + Math.sin(y * 1.7 + t * 0.5) + Math.sin((x + y) * 0.5 + t * 0.9)) / 3;
  }

  // Draw an italic "0" with subtle shape distortion at given center
  function drawZero(cx, cy, size, distortion) {
    const w = size * 0.5;
    const h = size * 0.9;
    const steps = 28;

    ctx.beginPath();
    // outer contour
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * Math.PI * 2;
      let dx = Math.cos(t) * w + Math.sin(t * 3 + distortion) * 2.2;
      let dy = Math.sin(t) * h + Math.cos(t * 2.5 + distortion * 1.3) * 2.0;
      // italic skew
      const sx = dx + dy * ZERO_SKEW;
      const px = cx + sx;
      const py = cy + dy;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();

    // inner counter (hole)
    const iw = w * 0.5;
    const ih = h * 0.62;
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * Math.PI * 2;
      let dx = Math.cos(-t) * iw + Math.sin(-t * 3 + distortion) * 1.4;
      let dy = Math.sin(-t) * ih + Math.cos(-t * 2.5 + distortion * 1.3) * 1.2;
      const sx = dx + dy * ZERO_SKEW;
      const px = cx + sx;
      const py = cy + dy;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();

    ctx.fill('evenodd');
  }

  function frame(timestamp) {
    requestAnimationFrame(frame);

    if (prefersReducedMotion || isPausedByVisibility) return;
    if (timestamp - lastFrameTime < FRAME_MS) return;
    lastFrameTime = timestamp;

    // Even when scroll-paused, draw 1 static frame after scroll stops
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = COLOR;

    for (const p of particles) {
      const t = timestamp * p.speed + p.offset;
      const nx = noise(p.baseX * 0.001, p.baseY * 0.001, t);
      const ny = noise(p.baseX * 0.001 + 100, p.baseY * 0.001 + 100, t);
      const cx = p.baseX + nx * p.drift;
      const cy = p.baseY + ny * p.drift;
      const distortion = t * 1.6 + p.phase;
      drawZero(cx, cy, p.size, distortion);
    }
  }

  function setupListeners() {
    window.addEventListener('resize', () => {
      resize();
      initParticles();
    });

    document.addEventListener('visibilitychange', () => {
      isPausedByVisibility = document.hidden;
    });

    // Pause render during active scroll to save battery
    window.addEventListener('scroll', () => {
      isPausedByScroll = true;
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        isPausedByScroll = false;
      }, 180);
    }, { passive: true });

    // Honor reduced motion preference
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    prefersReducedMotion = mq.matches;
    mq.addEventListener('change', (e) => {
      prefersReducedMotion = e.matches;
      if (prefersReducedMotion) {
        ctx.clearRect(0, 0, W, H);
      }
    });
  }

  function setup() {
    resize();
    initParticles();
    setupListeners();
    requestAnimationFrame(frame);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();
