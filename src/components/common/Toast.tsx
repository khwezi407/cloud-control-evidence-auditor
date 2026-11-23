import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "../../store/useStore";

/** A single, auto-dismissing toast at the bottom of the screen. It reads the
 * store's lastAction and clears it after a few seconds. */
export function Toast() {
  const lastAction = useStore((s) => s.lastAction);
  const setLastAction = useStore((s) => s.setLastAction);

  useEffect(() => {
    if (!lastAction) return;
    const t = setTimeout(() => setLastAction(null), 3600);
    return () => clearTimeout(t);
  }, [lastAction, setLastAction]);

  return (
    <AnimatePresence>
      {lastAction && (
        <motion.div
          className="toast"
          role="status"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.2 }}
        >
          {lastAction}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
