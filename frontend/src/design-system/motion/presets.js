/** Framer Motion variant presets */

import { springSmooth, springSnappy, springSoft } from './springs';

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

export const fadeInUp = {
  hidden: { opacity: 0, y: 16, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { ...springSmooth },
  },
  exit: { opacity: 0, y: 8, filter: 'blur(4px)', transition: { duration: 0.2 } },
};

export const fadeInDown = {
  hidden: { opacity: 0, y: -12 },
  visible: { opacity: 1, y: 0, transition: springSmooth },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: springSnappy },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.15 } },
};

export const slideInRight = {
  hidden: { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0, transition: springSmooth },
  exit: { opacity: 0, x: 16, transition: { duration: 0.2 } },
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.06 },
  },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 20, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: springSoft,
  },
};

export const hoverLift = {
  rest: { y: 0, scale: 1 },
  hover: { y: -4, scale: 1.02, transition: springSnappy },
  tap: { y: 0, scale: 0.98, transition: { duration: 0.1 } },
};

export const hoverGlow = {
  rest: { boxShadow: '0 0 0 rgba(99, 102, 241, 0)' },
  hover: {
    boxShadow: '0 0 24px rgba(99, 102, 241, 0.35)',
    transition: { duration: 0.3 },
  },
};

export const float = {
  animate: {
    y: [0, -8, 0],
    transition: { duration: 5, repeat: Infinity, ease: 'easeInOut' },
  },
};

export const layoutSpring = {
  type: 'spring',
  stiffness: 350,
  damping: 32,
};

export default {
  fadeIn,
  fadeInUp,
  fadeInDown,
  scaleIn,
  slideInRight,
  staggerContainer,
  staggerItem,
  hoverLift,
  hoverGlow,
  float,
  layoutSpring,
};
