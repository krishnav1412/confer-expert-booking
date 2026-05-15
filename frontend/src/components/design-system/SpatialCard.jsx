import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { hoverLift } from '../../design-system/motion/presets';

const SpatialCard = forwardRef(
  (
    {
      children,
      className,
      glow = false,
      float = false,
      edgeLight = false,
      hover = true,
      padding = true,
      as = 'div',
      ...props
    },
    ref
  ) => {
    const classes = clsx(
      'ds-spatial-card',
      glow && 'ds-spatial-glow',
      float && 'ds-spatial-float',
      edgeLight && 'ds-edge-light',
      padding && 'p-6',
      className
    );

    if (as === motion.div || hover) {
      return (
        <motion.div
          ref={ref}
          className={classes}
          variants={hover ? hoverLift : undefined}
          initial={hover ? 'rest' : undefined}
          whileHover={hover ? 'hover' : undefined}
          whileTap={hover ? 'tap' : undefined}
          {...props}
        >
          {children}
        </motion.div>
      );
    }

    return (
      <motion.div ref={ref} className={classes} {...props}>
        {children}
      </motion.div>
    );
  }
);

SpatialCard.displayName = 'SpatialCard';

export default SpatialCard;
