import clsx from 'clsx';

/**
 * Positioned ambient glow blob for局部 emphasis (cards, heroes).
 */
const GlowOrb = ({
  color = 'brand',
  size = 'md',
  className,
  animate = true,
}) => {
  const colorMap = {
    brand: 'rgb(var(--ds-neon-indigo) / 0.14)',
    cyan: 'rgb(var(--ds-neon-cyan) / 0.1)',
    purple: 'rgb(var(--ds-neon-purple) / 0.12)',
  };

  const sizeMap = {
    sm: 'h-32 w-32 blur-[48px]',
    md: 'h-48 w-48 blur-[64px]',
    lg: 'h-72 w-72 blur-[90px]',
    xl: 'h-96 w-96 blur-[110px]',
  };

  return (
    <div
      aria-hidden
      className={clsx(
        'pointer-events-none absolute rounded-full',
        sizeMap[size],
        animate && 'animate-ds-glow-breathe',
        className
      )}
      style={{ background: `radial-gradient(circle, ${colorMap[color] || colorMap.brand} 0%, transparent 70%)` }}
    />
  );
};

export default GlowOrb;
