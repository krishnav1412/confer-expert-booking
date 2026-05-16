import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─────────────────────────────────────────────
   Confer Cinematic Preloader
   ─────────────────────────────────────────────
   Lightweight canvas particle system + sequenced
   reveal animation. Unmounts cleanly after the
   transition completes. No GSAP dependency — uses
   framer-motion for orchestration.
   ───────────────────────────────────────────── */

// ── Particle System (Canvas) ──────────────────
const PARTICLE_COUNT = 60;
const CONNECTION_DISTANCE = 120;

function initParticles(w, h) {
  const particles = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5,
      opacity: Math.random() * 0.4 + 0.1,
    });
  }
  return particles;
}

function drawParticles(ctx, particles, w, h, globalAlpha) {
  ctx.clearRect(0, 0, w, h);
  ctx.globalAlpha = globalAlpha;

  // Connections
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < CONNECTION_DISTANCE) {
        const alpha = (1 - dist / CONNECTION_DISTANCE) * 0.12;
        ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.stroke();
      }
    }
  }

  // Nodes
  for (const p of particles) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * 0.6})`;
    ctx.fill();

    // Subtle glow
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(99, 102, 241, ${p.opacity * 0.08})`;
    ctx.fill();
  }

  // Update positions
  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0 || p.x > w) p.vx *= -1;
    if (p.y < 0 || p.y > h) p.vy *= -1;
  }

  ctx.globalAlpha = 1;
}

// ── Floating UI Fragments ──────────────────────
const FRAGMENTS = [
  { label: 'Sessions', x: '15%', y: '22%', delay: 1.2 },
  { label: 'Programs', x: '78%', y: '18%', delay: 1.4 },
  { label: 'Momentum', x: '82%', y: '72%', delay: 1.6 },
  { label: 'Acceleration', x: '12%', y: '75%', delay: 1.8 },
  { label: 'Subscriptions', x: '65%', y: '85%', delay: 2.0 },
];

const Fragment = ({ label, x, y, delay }) => (
  <motion.div
    className="absolute pointer-events-none select-none"
    style={{ left: x, top: y }}
    initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }}
    animate={{ opacity: 0.25, y: 0, filter: 'blur(0px)' }}
    exit={{ opacity: 0, filter: 'blur(4px)' }}
    transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
  >
    <span className="text-[10px] font-medium tracking-[0.2em] uppercase"
      style={{ color: 'rgba(138, 143, 152, 0.5)' }}>
      {label}
    </span>
  </motion.div>
);

// ── Progress Bar ───────────────────────────────
const ProgressBar = ({ progress }) => (
  <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-48">
    <div className="h-[1px] w-full rounded-full overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.06)' }}>
      <motion.div
        className="h-full rounded-full"
        style={{
          background: 'linear-gradient(90deg, rgba(99,102,241,0.5), rgba(34,211,238,0.3))',
        }}
        initial={{ width: '0%' }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />
    </div>
  </div>
);

// ── Scan Line Effect ───────────────────────────
const ScanLine = () => (
  <motion.div
    className="absolute left-0 right-0 h-[1px] pointer-events-none"
    style={{
      background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.15), rgba(34,211,238,0.08), transparent)',
    }}
    initial={{ top: '0%', opacity: 0 }}
    animate={{ top: '100%', opacity: [0, 0.6, 0.6, 0] }}
    transition={{ duration: 2.5, delay: 0.5, ease: 'linear' }}
  />
);

// ── Main Preloader Component ───────────────────
const Preloader = ({ onComplete }) => {
  const [phase, setPhase] = useState('loading'); // loading → revealing → done
  const [progress, setProgress] = useState(0);
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animFrameRef = useRef(null);
  const particleAlpha = useRef(1);

  // Canvas particle animation
  useEffect(() => {
    const existingCanvas = document.getElementById('confer-particles');
    const canvas = existingCanvas || canvasRef.current;
    if (!canvas) return;

    // If we're using the preloader-shell canvas, move it into our component
    if (existingCanvas && canvasRef.current && existingCanvas !== canvasRef.current) {
      canvasRef.current = existingCanvas;
    }

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.scale(dpr, dpr);
      particlesRef.current = initParticles(window.innerWidth, window.innerHeight);
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = () => {
      drawParticles(ctx, particlesRef.current, window.innerWidth, window.innerHeight, particleAlpha.current);
      animFrameRef.current = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      window.removeEventListener('resize', resize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Remove the HTML preloader shell once React mounts
  useEffect(() => {
    const shell = document.getElementById('confer-preloader');
    if (shell) shell.remove();
  }, []);

  // Progress simulation
  useEffect(() => {
    const steps = [
      { target: 30, delay: 200 },
      { target: 55, delay: 600 },
      { target: 75, delay: 1000 },
      { target: 90, delay: 1600 },
      { target: 100, delay: 2200 },
    ];

    const timers = steps.map(({ target, delay }) =>
      setTimeout(() => setProgress(target), delay)
    );

    // Begin reveal after progress completes
    const revealTimer = setTimeout(() => {
      setPhase('revealing');
    }, 2800);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(revealTimer);
    };
  }, []);

  // Fade out particles during reveal
  useEffect(() => {
    if (phase === 'revealing') {
      const fadeInterval = setInterval(() => {
        particleAlpha.current = Math.max(0, particleAlpha.current - 0.03);
        if (particleAlpha.current <= 0) clearInterval(fadeInterval);
      }, 16);
      return () => clearInterval(fadeInterval);
    }
  }, [phase]);

  const handleRevealComplete = useCallback(() => {
    setPhase('done');
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    onComplete();
  }, [onComplete]);

  if (phase === 'done') return null;

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          key="preloader"
          className="fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden"
          style={{ background: '#050506' }}
          exit={{
            clipPath: 'inset(0 0 100% 0)',
            transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] },
          }}
          onAnimationComplete={(def) => {
            if (def?.clipPath) handleRevealComplete();
          }}
        >
          {/* Particle canvas */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
          />

          {/* Subtle radial gradient overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 60% 50% at 50% 45%, rgba(99,102,241,0.04) 0%, transparent 70%)',
            }}
          />

          {/* Vignette */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              boxShadow: 'inset 0 0 150px rgba(0,0,0,0.6)',
            }}
          />

          {/* Scan line */}
          <ScanLine />

          {/* Floating fragments */}
          {FRAGMENTS.map((f) => (
            <Fragment key={f.label} {...f} />
          ))}

          {/* Center content */}
          <div className="relative z-10 flex flex-col items-center gap-6">
            {/* Logo mark */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, filter: 'blur(12px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              <div className="grid h-14 w-14 place-items-center rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(34,211,238,0.08) 100%)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 0 40px rgba(99,102,241,0.1), inset 0 1px 0 rgba(255,255,255,0.06)',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" style={{ opacity: 0.9 }}>
                  <path d="M5 7h14M5 12h14M5 17h9" />
                </svg>
              </div>
              {/* Glow behind logo */}
              <div className="absolute -inset-4 rounded-3xl -z-10"
                style={{
                  background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
                  filter: 'blur(20px)',
                }}
              />
            </motion.div>

            {/* Brand name */}
            <motion.h1
              initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.8, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="font-display text-4xl font-bold tracking-tight sm:text-5xl"
              style={{ color: '#f5f5f5' }}
            >
              Confer
            </motion.h1>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 0.5, y: 0 }}
              transition={{ duration: 0.7, delay: 1.0, ease: [0.16, 1, 0.3, 1] }}
              className="text-sm font-medium tracking-[0.15em] uppercase"
              style={{ color: '#8a8f98' }}
            >
              Career acceleration, redesigned.
            </motion.p>
          </div>

          {/* Progress */}
          <ProgressBar progress={progress} />

          {/* Exit trigger: after reveal phase starts, animate out */}
          {phase === 'revealing' && (
            <motion.div
              className="absolute inset-0 z-50 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              onAnimationComplete={handleRevealComplete}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Preloader;
