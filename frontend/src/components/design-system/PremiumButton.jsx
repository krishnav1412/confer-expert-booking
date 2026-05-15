import { forwardRef, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionTemplate, useMotionValue, useSpring } from 'framer-motion';
import clsx from 'clsx';
import { springSnappy } from '../../design-system/motion/springs';

const variantClass = {
  primary: 'ds-btn-primary',
  secondary: 'ds-btn-secondary',
  ghost: 'ds-btn-ghost',
  glow: 'ds-btn-glow',
};

const PremiumButton = forwardRef(
  (
    {
      children,
      className,
      variant = 'primary',
      href,
      to,
      rounded = 'xl',
      magnetic = false,
      ...props
    },
    ref
  ) => {
    const wrapRef = useRef(null);
    const mx = useMotionValue(0);
    const my = useMotionValue(0);
    const sx = useSpring(mx, { stiffness: 280, damping: 22 });
    const sy = useSpring(my, { stiffness: 280, damping: 22 });
    const spotlight = useMotionTemplate`radial-gradient(120px circle at ${sx}px ${sy}px, rgba(255,255,255,0.14), transparent 70%)`;

    const classes = clsx(
      variantClass[variant] || variantClass.primary,
      rounded === 'full' && '!rounded-full',
      'ds-light-sweep relative',
      magnetic && 'overflow-hidden',
      className
    );

    const motionProps = {
      whileHover: { y: -3, scale: 1.02 },
      whileTap: { y: 0, scale: 0.98 },
      transition: springSnappy,
    };

    const onMove = (e) => {
      if (!magnetic || !wrapRef.current) return;
      const r = wrapRef.current.getBoundingClientRect();
      mx.set(e.clientX - r.left);
      my.set(e.clientY - r.top);
    };

    const onLeave = () => {
      mx.set(0);
      my.set(0);
    };

    const wrap = (node) => (
      <motion.div
        ref={wrapRef}
        className="relative inline-block"
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        {...motionProps}
      >
        {magnetic && (
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-0 z-0 rounded-[inherit]"
            style={{ background: spotlight }}
          />
        )}
        <span className="relative z-[1] inline-flex w-full items-center justify-center gap-2">{node}</span>
      </motion.div>
    );

    if (to) {
      return wrap(
        <Link ref={ref} to={to} className={classes} {...props}>
          {children}
        </Link>
      );
    }

    if (href) {
      return wrap(
        <motion.a ref={ref} href={href} className={classes} {...props}>
          {children}
        </motion.a>
      );
    }

    return wrap(
      <motion.button ref={ref} type="button" className={classes} {...props}>
        {children}
      </motion.button>
    );
  }
);

PremiumButton.displayName = 'PremiumButton';

export default PremiumButton;
