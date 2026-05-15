import clsx from 'clsx';

/**
 * Global atmospheric background — mesh gradients, blur orbs, ambient drift.
 * Fixed behind page content; pointer-events-none.
 */
const AmbientBackground = ({ className, intensity = 'subtle' }) => {
  const isSubtle = intensity === 'subtle' || intensity === 'default';

  return (
    <div
      aria-hidden
      className={clsx(
        'pointer-events-none fixed inset-0 -z-10 overflow-hidden ds-mesh-gradient',
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/5 dark:to-black/55" />

      <div
        className={clsx(
          'absolute -left-[20%] -top-[30%] h-[70vmin] w-[70vmin] rounded-full blur-[100px] animate-ds-ambient-drift',
          isSubtle ? 'opacity-25' : 'opacity-40'
        )}
        style={{
          background: 'radial-gradient(circle, rgb(var(--ds-neon-indigo) / 0.08) 0%, transparent 70%)',
        }}
      />
      <div
        className={clsx(
          'absolute -right-[15%] top-[10%] h-[55vmin] w-[55vmin] rounded-full blur-[90px] animate-ds-ambient-pulse',
          isSubtle ? 'opacity-20' : 'opacity-35'
        )}
        style={{
          background: 'radial-gradient(circle, rgb(var(--ds-neon-purple) / 0.06) 0%, transparent 70%)',
        }}
      />
      <div
        className={clsx(
          'absolute bottom-[-20%] left-[30%] h-[60vmin] w-[60vmin] rounded-full blur-[110px] animate-ds-glow-breathe',
          isSubtle ? 'opacity-15' : 'opacity-28'
        )}
        style={{
          background: 'radial-gradient(circle, rgb(var(--ds-neon-cyan) / 0.05) 0%, transparent 70%)',
        }}
      />

      <div
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.025]"
        style={{
          backgroundImage: `
            linear-gradient(rgb(var(--ds-text-primary) / 0.25) 1px, transparent 1px),
            linear-gradient(90deg, rgb(var(--ds-text-primary) / 0.25) 1px, transparent 1px)
          `,
          backgroundSize: '72px 72px',
        }}
      />
    </div>
  );
};

export default AmbientBackground;
