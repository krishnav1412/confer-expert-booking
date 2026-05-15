import { useRef } from 'react';
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion';
import clsx from 'clsx';
import { CalendarIcon, CheckCircleIcon, AwardIcon, ClockIcon, TrendingIcon } from '../Icons';
import { formatPrice } from '../../utils/format';

const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: `${8 + (i * 5.2) % 88}%`,
  top: `${12 + (i * 7.3) % 76}%`,
  size: 1 + (i % 3),
  delay: i * 0.35,
  duration: 6 + (i % 5),
}));

const HeroScene = ({ className }) => {
  const ref = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 80, damping: 20 });
  const smoothY = useSpring(mouseY, { stiffness: 80, damping: 20 });
  const spotlight = useMotionTemplate`radial-gradient(480px circle at ${smoothX}px ${smoothY}px, rgba(255,255,255,0.05), rgba(99,102,241,0.04) 35%, transparent 68%)`;
  const orbX = useTransform(smoothX, (v) => v - 64);
  const orbY = useTransform(smoothY, (v) => v - 64);
  const parallaxX = useTransform(smoothX, (v) => (v - 200) * 0.02);
  const parallaxY = useTransform(smoothY, (v) => (v - 200) * 0.02);

  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    mouseX.set(e.clientX - r.left);
    mouseY.set(e.clientY - r.top);
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      className={clsx('ds-film-grain relative hidden h-[540px] w-full lg:block', className)}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 z-0 rounded-3xl"
        style={{ background: spotlight }}
      />

      {PARTICLES.map((p) => (
        <motion.span
          key={p.id}
          aria-hidden
          className="pointer-events-none absolute rounded-full bg-white/30"
          style={{ left: p.left, top: p.top, width: p.size, height: p.size }}
          animate={{ y: [0, -14, 0], opacity: [0.15, 0.5, 0.15] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
        />
      ))}

      <motion.div
        style={{ x: parallaxX, y: parallaxY }}
        initial={{ opacity: 0, y: 48, rotateX: 8 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 1, delay: 0.12, type: 'spring', stiffness: 70 }}
        className="absolute right-0 top-6 w-[90%] max-w-md perspective-[1200px]"
      >
        <div className="ds-spatial-card ds-edge-light ds-light-sweep p-5 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl border border-white/10 bg-white/[0.04] p-px">
                <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#0a0a0e] text-xs font-bold text-white">
                  SC
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold text-white">Sarah Chen</div>
                <div className="text-xs text-white/45">Product · ex-Stripe</div>
              </div>
            </div>
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-400/90">
              Live
            </span>
          </div>

          <div className="mt-4 space-y-2">
            {[
              { icon: CalendarIcon, label: 'Strategy Session', price: 249, active: false },
              { icon: AwardIcon, label: '4-Week Program', price: 899, active: true },
            ].map((row) => (
              <div
                key={row.label}
                className={clsx(
                  'flex items-center justify-between rounded-xl border px-3 py-2.5 transition-colors',
                  row.active
                    ? 'border-white/12 bg-white/[0.06] shadow-[0_0_16px_rgba(255,255,255,0.04)]'
                    : 'border-white/[0.04] bg-white/[0.02]'
                )}
              >
                <div className="flex items-center gap-2">
                  <row.icon className={clsx('h-4 w-4', row.active ? 'text-white/70' : 'text-white/35')} />
                  <span className={clsx('text-sm', row.active ? 'font-medium text-white' : 'text-white/65')}>
                    {row.label}
                  </span>
                </div>
                <span className="text-xs font-semibold text-white/50">{formatPrice(row.price)}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <div className="h-10 rounded-lg border border-white/[0.06] bg-white/[0.03]" />
            <div className="h-10 rounded-lg border border-white/10 bg-white/15" />
          </div>
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute left-2 top-14 z-20 w-44"
      >
        <div className="ds-spatial-card p-4">
          <div className="flex items-center gap-2 text-white/45">
            <TrendingIcon className="h-4 w-4 text-cyan-400/70" />
            <span className="text-[10px] font-semibold uppercase tracking-widest">This week</span>
          </div>
          <div className="mt-2 font-display text-2xl font-bold text-white">+24%</div>
          <div className="text-xs text-white/40">Booking velocity</div>
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, 14, 0] }}
        transition={{ duration: 6.2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        className="absolute -bottom-2 left-10 z-30 w-56"
      >
        <div className="ds-spatial-card flex items-center gap-3 p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/25">
            <CheckCircleIcon className="h-4 w-4 text-emerald-400/90" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Session confirmed</div>
            <div className="flex items-center gap-1 text-xs text-white/45">
              <ClockIcon className="h-3 w-3" /> Tomorrow · 10:00 AM
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, type: 'spring' }}
        className="absolute -right-1 bottom-28 z-10 w-48"
      >
        <div className="ds-glass-subtle p-3">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-white/35">May</div>
          <div className="mt-2 grid grid-cols-4 gap-1">
            {[14, 15, 16, 17].map((d, i) => (
              <motion.div
                key={d}
                className={clsx(
                  'rounded-md py-1 text-center text-xs font-medium',
                  i === 2 ? 'bg-white/12 text-white ring-1 ring-white/15' : 'text-white/35'
                )}
              >
                {d}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div
        className="pointer-events-none absolute z-0 h-28 w-28 rounded-full blur-3xl"
        style={{
          x: orbX,
          y: orbY,
          background: 'radial-gradient(circle, rgba(255,255,255,0.08), transparent 70%)',
        }}
      />
    </div>
  );
};

export default HeroScene;
