import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import clsx from 'clsx';

import { useAuth } from '../context/AuthContext';
import {
  ArrowRightIcon, AwardIcon, TrendingIcon, CalendarIcon,
  PlayCircleIcon, CheckCircleIcon, SearchIcon, ShieldIcon, StarIcon,
} from '../components/Icons';
import { HeroScene, PremiumButton, SpatialCard, GlowOrb } from '../components/design-system';
import { Reveal, Stagger, StaggerItem, Float } from '../components/design-system/Motion';

const HOW_STEPS = [
  { title: 'Discover', description: 'Access a curated network of operators inside your workspace.', icon: SearchIcon },
  { title: 'Select service', description: '1:1 sessions, multi-week programs, or recurring subscriptions.', icon: AwardIcon },
  { title: 'Book instantly', description: 'Real availability. No scheduling threads. No friction.', icon: CalendarIcon },
  { title: 'Accelerate', description: 'Show up prepared. Leave with clarity you can execute.', icon: PlayCircleIcon },
];

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 28, filter: 'blur(6px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring', stiffness: 200, damping: 26 } },
};

const HomePage = () => {
  const { isAuthenticated, isExpert } = useAuth();
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.35], [0, 80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0.4]);

  const enterCta = isAuthenticated ? '/discover' : '/signup';
  const enterLabel = isAuthenticated ? 'Discover mentors' : 'Enter Confer';

  return (
    <div className="relative min-h-screen ds-film-grain">
      {/* HERO */}
      <section className="ds-cinematic-section relative overflow-hidden pt-16 pb-32 md:pt-24 md:pb-40">
        <GlowOrb color="purple" size="xl" className="absolute -left-32 top-0 opacity-20" />
        <GlowOrb color="cyan" size="lg" className="absolute right-0 top-1/4 opacity-15" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[rgb(var(--ds-bg-base))]" />

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="container-app relative z-10">
          <motion.div
            initial="hidden"
            animate="show"
            variants={staggerContainer}
            className="grid items-center gap-14 lg:grid-cols-[1.05fr_1fr] lg:gap-10"
          >
            <div className="max-w-2xl">
              <motion.div variants={fadeUp} className="ds-glass-subtle mb-8 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-ink-500 dark:text-ink-400">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/30 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-white/60" />
                </span>
                Confer — premium mentorship OS
              </motion.div>

              <motion.h1 variants={fadeUp} className="ds-display-xl !text-5xl sm:!text-6xl lg:!text-[4.5rem] !leading-[1.02] !tracking-[-0.04em]">
                The operating system
                <br />
                <span className="text-white">for career acceleration.</span>
              </motion.h1>

              <motion.p variants={fadeUp} className="mt-8 max-w-lg text-lg leading-relaxed text-ink-500 dark:text-ink-400">
                Sessions, programs, and subscriptions with operators who ship — in a workspace engineered to feel as premium as the guidance.
              </motion.p>

              <motion.div variants={fadeUp} className="mt-11 flex flex-wrap items-center gap-4">
                <PremiumButton to={enterCta} variant="glow" rounded="full" magnetic className="!px-8 !py-3.5 !text-base">
                  {enterLabel}
                </PremiumButton>
                <PremiumButton href="#how-it-works" variant="secondary" rounded="full" className="!px-8 !py-3.5 !text-base group">
                  How it works
                  <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </PremiumButton>
              </motion.div>
            </div>

            <HeroScene />
          </motion.div>
        </motion.div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="relative border-y border-white/[0.04] py-16">
        <div className="container-app">
          <Stagger className="flex flex-wrap items-center justify-center gap-x-16 gap-y-10 text-center sm:justify-between">
            <StaggerItem><Stat number="4,500+" label="Sessions booked" /></StaggerItem>
            <StaggerItem><Stat number="99%" label="Five-star ratings" /></StaggerItem>
            <StaggerItem><Stat number="50+" label="Top companies" /></StaggerItem>
            <StaggerItem><Stat number="24/7" label="Instant booking" /></StaggerItem>
          </Stagger>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="container-app py-28">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="ds-caption">How it works</p>
          <h2 className="ds-headline mt-4">Designed for velocity.</h2>
          <p className="ds-subtitle mt-5">
            A frictionless path from discovery to deep mentorship — built like premium productivity software, not a marketplace.
          </p>
        </Reveal>
        <Stagger className="mt-20 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {HOW_STEPS.map((step, i) => (
            <StaggerItem key={step.title}>
              <SpatialCard
                className={clsx('flex flex-col p-8', i % 2 === 1 && 'lg:translate-y-4')}
                padding={false}
              >
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03]">
                  <step.icon className="h-5 w-5 text-white/70" />
                </div>
                <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-400">{step.description}</p>
              </SpatialCard>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* PROGRAMS */}
      <section className="ds-cinematic-section border-y border-white/[0.04] bg-[#050506] py-28">
        <div className="container-app">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ type: 'spring', stiffness: 100, damping: 22 }}
            className="grid items-center gap-16 lg:grid-cols-2"
          >
            <div>
              <p className="ds-caption">Programs &amp; subscriptions</p>
              <h2 className="ds-display-lg mt-4">Beyond single sessions.</h2>
              <p className="mt-5 text-lg leading-relaxed text-ink-400">
                Structured <span className="text-white/90">programs</span> and recurring{' '}
                <span className="text-white/90">subscriptions</span> for interview prep, pivots, and long-horizon mentorship — with progress you can track.
              </p>
              <ul className="mt-10 space-y-4">
                <ListItem>Session progress in your dashboard</ListItem>
                <ListItem>Automated scheduling for future sessions</ListItem>
                <ListItem>Pause or cancel subscriptions anytime</ListItem>
              </ul>
            </div>
            <Float duration={6}>
              <SpatialCard className="ds-edge-light p-6" padding={false}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">Interview Prep Masterclass</span>
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
                    4 weeks
                  </span>
                </div>
                <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full rounded-full bg-white/40"
                    initial={{ width: 0 }}
                    whileInView={{ width: '50%' }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
                <div className="mt-3 flex justify-between text-xs text-ink-500">
                  <span>Session 2 of 4</span>
                  <span>50% complete</span>
                </div>
              </SpatialCard>
            </Float>
          </motion.div>
        </div>
      </section>

      {/* ABOUT CONFER */}
      <section id="about-confer" className="relative overflow-hidden py-28">
        <GlowOrb color="brand" size="lg" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10" />
        <div className="container-app relative z-10">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="ds-caption">Why Confer exists</p>
            <h2 className="ds-headline mt-4">Mentorship, engineered like software.</h2>
            <p className="ds-subtitle mt-5">
              Generic platforms treat guidance like listings. Confer treats it like an operating system — structured, premium, built for serious acceleration.
            </p>
          </Reveal>
          <Stagger className="mt-20 grid gap-5 md:grid-cols-3">
            {[
              { icon: CalendarIcon, title: '1:1 sessions', description: 'Focused calls with operators who ship. No scheduling ping-pong.' },
              { icon: AwardIcon, title: 'Programs', description: 'Multi-week arcs with measurable progress and momentum.' },
              { icon: TrendingIcon, title: 'Subscriptions', description: 'Recurring access that compounds as your goals evolve.' },
            ].map((item, i) => (
              <StaggerItem key={item.title}>
                <SpatialCard className={clsx('flex h-full flex-col p-8', i === 1 && 'lg:-translate-y-3')} padding={false}>
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03]">
                    <item.icon className="h-5 w-5 text-white/70" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-400">{item.description}</p>
                </SpatialCard>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* FOUNDER — editorial, no image */}
      <section id="founder" className="border-t border-white/[0.04] py-32">
        <div className="container-app">
          <Reveal className="mx-auto max-w-3xl">
            <p className="ds-caption text-center">Meet the builder</p>
            <blockquote className="mt-8 text-center font-display text-3xl font-semibold leading-snug tracking-tight text-white sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
              &ldquo;I wanted mentorship to feel like premium software — intentional, cinematic, worth showing up for.&rdquo;
            </blockquote>
            <div className="mt-12 space-y-5 text-center text-base leading-relaxed text-ink-400">
              <p>
                Confer started as frustration with generic mentorship platforms — classified ads disguised as guidance.
              </p>
              <p>
                <span className="text-white/90">Built for people who are serious about acceleration.</span>{' '}
                Every surface is designed to match the caliber of advice you deserve.
              </p>
            </div>
            <div className="mt-14 flex flex-col items-center border-t border-white/[0.06] pt-10">
              <p className="font-display text-xl font-semibold text-white">Krishnav Agarwal</p>
              <p className="mt-1 text-sm text-ink-500">Chief Designer &amp; Builder of Confer</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* VISION */}
      <section id="vision" className="ds-cinematic-section relative overflow-hidden py-32">
        <div className="pointer-events-none absolute inset-0 bg-ds-cinematic" />
        <div className="container-app relative z-10">
          <Reveal className="mx-auto max-w-3xl text-center">
            <p className="ds-caption">Our vision</p>
            <h2 className="ds-display-lg mt-4 !leading-[1.1]">
              Operator knowledge — shared like{' '}
              <span className="text-white">premium software.</span>
            </h2>
            <p className="ds-subtitle mx-auto mt-6 max-w-2xl">
              Career acceleration should not depend on who you already know. Confer opens access to experts who have done the work.
            </p>
          </Reveal>
          <Stagger className="mt-20 grid gap-5 sm:grid-cols-3">
            {[
              { label: 'Velocity', text: 'Move faster with guidance from people who have shipped at scale.', icon: TrendingIcon },
              { label: 'Depth', text: 'Build real capability through structured programs, not scattered tips.', icon: ShieldIcon },
              { label: 'Access', text: 'Open doors to operator knowledge behind closed networks.', icon: StarIcon },
            ].map((card, i) => (
              <StaggerItem key={card.label}>
                <SpatialCard className={clsx('p-8', i === 1 && 'sm:-translate-y-2')} padding={false}>
                  <card.icon className="h-5 w-5 text-white/40" />
                  <div className="mt-4 font-display text-sm font-semibold uppercase tracking-widest text-white/50">{card.label}</div>
                  <p className="mt-3 text-sm leading-relaxed text-ink-400">{card.text}</p>
                </SpatialCard>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* FINAL CTA */}
      {!isExpert && (
        <section className="relative overflow-hidden border-t border-white/[0.04] py-28">
          <div className="absolute inset-0 bg-[#040405]" />
          <GlowOrb color="purple" size="lg" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-15" />
          <Reveal className="container-app relative z-10 mx-auto max-w-3xl text-center">
            <h2 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
              {isAuthenticated ? 'Ready to book your next session?' : 'Enter the mentorship OS.'}
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-ink-400">
              {isAuthenticated
                ? 'Discover vetted operators and accelerate inside your workspace.'
                : 'Create your account and access curated experts, programs, and subscriptions.'}
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <PremiumButton to={enterCta} variant="glow" rounded="full" magnetic className="!px-10 !py-3.5">
                {enterLabel}
              </PremiumButton>
              {!isExpert && (
                <PremiumButton to="/become-expert" variant="secondary" rounded="full" className="!px-8 !py-3.5">
                  Apply to mentor
                </PremiumButton>
              )}
            </div>
          </Reveal>
        </section>
      )}

      {!isExpert && isAuthenticated === false && (
        <section className="border-t border-white/[0.04] py-20">
          <Reveal className="container-app text-center">
            <p className="ds-caption">For experts</p>
            <h3 className="mt-3 font-display text-2xl font-bold text-white">Share your expertise.</h3>
            <p className="ds-subtitle mx-auto mt-3 max-w-lg">
              Set your services, pricing, and availability. Keep up to 90% of session revenue.
            </p>
            <Link
              to="/become-expert"
              className="btn-secondary mt-8 inline-flex !rounded-full !px-8 !py-3"
            >
              Apply to mentor
            </Link>
          </Reveal>
        </section>
      )}
    </div>
  );
};

const Stat = ({ number, label }) => (
  <motion.div whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 400, damping: 28 }} className="flex flex-col items-center">
    <div className="font-display text-4xl font-bold tracking-tight text-ink-900 dark:text-white">{number}</div>
    <div className="mt-2 text-xs font-medium uppercase tracking-[0.2em] text-ink-500 dark:text-ink-500">{label}</div>
  </motion.div>
);

const ListItem = ({ children }) => (
  <li className="flex items-start gap-3">
    <div className="mt-0.5 rounded-full bg-emerald-500/10 p-1">
      <CheckCircleIcon className="h-4 w-4 text-emerald-500/80" />
    </div>
    <span className="text-ink-600 dark:text-ink-300">{children}</span>
  </li>
);

export default HomePage;
