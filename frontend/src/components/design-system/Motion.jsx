import { motion } from 'framer-motion';
import clsx from 'clsx';
import {
  fadeInUp,
  staggerContainer,
  staggerItem,
  fadeIn,
  scaleIn,
} from '../../design-system/motion/presets';

/**
 * Fade + blur reveal on mount
 */
export const Reveal = ({ children, className, delay = 0, ...props }) => (
  <motion.div
    className={className}
    variants={fadeInUp}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: '-40px' }}
    transition={{ delay }}
    {...props}
  >
    {children}
  </motion.div>
);

/**
 * Stagger children on mount
 */
export const Stagger = ({ children, className, ...props }) => (
  <motion.div
    className={className}
    variants={staggerContainer}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: '-24px' }}
    {...props}
  >
    {children}
  </motion.div>
);

export const StaggerItem = ({ children, className, ...props }) => (
  <motion.div className={className} variants={staggerItem} {...props}>
    {children}
  </motion.div>
);

/**
 * Subtle floating loop
 */
export const Float = ({ children, className, duration = 5, ...props }) => (
  <motion.div
    className={className}
    animate={{ y: [0, -10, 0] }}
    transition={{ duration, repeat: Infinity, ease: 'easeInOut' }}
    {...props}
  >
    {children}
  </motion.div>
);

/**
 * Scale fade for modals / popovers
 */
export const ScaleReveal = ({ children, className, show = true, ...props }) => (
  <motion.div
    className={className}
    variants={scaleIn}
    initial="hidden"
    animate={show ? 'visible' : 'hidden'}
    {...props}
  >
    {children}
  </motion.div>
);

/**
 * Simple opacity fade wrapper
 */
export const Fade = ({ children, className, show = true, ...props }) => (
  <motion.div
    className={className}
    variants={fadeIn}
    initial="hidden"
    animate={show ? 'visible' : 'exit'}
    {...props}
  >
    {children}
  </motion.div>
);

/**
 * Premium button with spring hover (opt-in; use ds-btn-* classes)
 */
export const MotionButton = ({ children, className, variant = 'primary', ...props }) => {
  const variantClass = {
    primary: 'ds-btn-primary',
    secondary: 'ds-btn-secondary',
    ghost: 'ds-btn-ghost',
    glow: 'ds-btn-glow',
  }[variant] || 'ds-btn-primary';

  return (
    <motion.button
      type="button"
      className={clsx(variantClass, className)}
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ y: 0, scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export default { Reveal, Stagger, StaggerItem, Float, ScaleReveal, Fade, MotionButton };
