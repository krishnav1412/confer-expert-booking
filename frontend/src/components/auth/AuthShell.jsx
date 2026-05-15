import { motion } from 'framer-motion';
import { HeroScene, GlowOrb } from '../design-system';
import { Reveal, Stagger, StaggerItem } from '../design-system/Motion';
import { CheckCircleIcon } from '../Icons';

const fadePanel = {
  hidden: { opacity: 0, x: -20, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    x: 0,
    filter: 'blur(0px)',
    transition: { type: 'spring', stiffness: 120, damping: 22 },
  },
};

const AuthShell = ({ children, title, subtitle, features = [], visualTitle, visualSubtitle }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.45 }}
    className="relative min-h-[calc(100vh-4rem)] overflow-hidden"
  >
    <GlowOrb color="purple" size="xl" className="absolute -left-40 top-0 opacity-20" />
    <GlowOrb color="cyan" size="lg" className="absolute bottom-0 right-0 opacity-15" />

    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-[1fr_1.05fr]">
      <motion.div
        variants={fadePanel}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex items-center justify-center px-6 py-14 lg:py-20"
      >
        <motion.div className="ds-spatial-card ds-edge-light w-full max-w-md p-8 sm:p-10">
          <div className="mb-8">
            <p className="ds-caption">Confer</p>
            <h1 className="ds-display-lg mt-2 !text-3xl">{title}</h1>
            {subtitle && <p className="ds-subtitle mt-3 !text-sm">{subtitle}</p>}
          </div>
          {children}
        </motion.div>
      </motion.div>

      <div className="relative hidden overflow-hidden border-l border-white/[0.04] bg-[#050506] lg:block">
        <motion.div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/[0.04] via-transparent to-cyan-500/[0.03]"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="ds-film-grain ds-vignette absolute inset-0" />

        <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-14">
          <Reveal>
            <span className="ds-glass-subtle inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-white/50">
              Mentorship OS
            </span>
            <h2 className="mt-6 max-w-md font-display text-3xl font-bold leading-[1.15] tracking-tight text-white xl:text-4xl">
              {visualTitle}
            </h2>
            {visualSubtitle && (
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-400">{visualSubtitle}</p>
            )}
          </Reveal>

          <div className="relative mx-auto w-full max-w-lg py-8">
            <HeroScene className="!block !h-[420px]" />
          </div>

          {features.length > 0 && (
            <Stagger className="space-y-3 border-t border-white/[0.06] pt-8">
              {features.map((f) => (
                <StaggerItem key={f} className="flex items-center gap-2.5 text-sm text-ink-300">
                  <CheckCircleIcon className="h-4 w-4 shrink-0 text-emerald-400/80" />
                  {f}
                </StaggerItem>
              ))}
            </Stagger>
          )}
        </div>
      </div>
    </div>
  </motion.div>
);

export default AuthShell;
