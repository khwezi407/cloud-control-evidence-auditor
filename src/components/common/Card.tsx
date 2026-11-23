import { type ReactNode, useRef, type MouseEvent } from "react";
import { motion, type Variants, type MotionStyle } from "framer-motion";

const rise: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.2, 0.8, 0.2, 1] } },
};

interface CardProps {
  children: ReactNode;
  className?: string;
  style?: MotionStyle;
  animateDelay?: number;
}

/** A glass card with a spotlight that follows the pointer and a gentle
 * rise-in animation. Keeps the premium, alive feel of the original console. */
export function Card({ children, className = "", style, animateDelay = 0 }: CardProps) {
  const ref = useRef<HTMLElement>(null);

  const onMove = (e: MouseEvent<HTMLElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <motion.article
      ref={ref}
      className={`card ${className}`}
      style={style}
      onMouseMove={onMove}
      variants={rise}
      initial="hidden"
      animate="show"
      transition={{ delay: animateDelay }}
    >
      <div className="spotlight" aria-hidden="true" />
      {children}
    </motion.article>
  );
}
