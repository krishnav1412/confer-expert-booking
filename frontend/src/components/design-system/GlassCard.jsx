import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { hoverLift } from '../../design-system/motion/presets';

const GlassCard = forwardRef(
  ({ children, className, hover = true, glow = false, padding = true, asMotion = true, ...props }, ref) => {
    const classes = clsx('ds-glass-card', glow && 'ds-glow-ring', padding && 'p-6', className);

    if (!asMotion || !hover) {
      return (
        <div ref={ref} className={classes} {...props}>
          {children}
        </div>
      );
    }

    return (
      <motion.div
        ref={ref}
        className={classes}
        variants={hoverLift}
        initial="rest"
        whileHover="hover"
        whileTap="tap"
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

GlassCard.displayName = 'GlassCard';

export default GlassCard;
