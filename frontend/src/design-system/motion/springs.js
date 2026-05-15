/** Shared spring configs — Framer Motion */

export const springSnappy = { type: 'spring', stiffness: 400, damping: 30 };

export const springSmooth = { type: 'spring', stiffness: 260, damping: 28 };

export const springSoft = { type: 'spring', stiffness: 180, damping: 24 };

export const springBouncy = { type: 'spring', stiffness: 320, damping: 22, mass: 0.8 };

export const springGentle = { type: 'spring', stiffness: 120, damping: 20, mass: 1 };

export default {
  snappy: springSnappy,
  smooth: springSmooth,
  soft: springSoft,
  bouncy: springBouncy,
  gentle: springGentle,
};
