import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Twig } from '../components/Illustrations';
import { sfx } from '../audio/ambience';

/* Arrival with the original project's visuals and behaviour:
   the swipe only triggers the transition — content never follows the finger. */
export default function Arrival({ onEnter }: { onEnter: () => void }) {
  const [line2, setLine2] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const startY = useRef<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setLine2(true), 1300);
    return () => clearTimeout(t);
  }, []);

  function go() {
    if (leaving) return;
    setLeaving(true);
    sfx.unlock();
    setTimeout(onEnter, 700);
  }

  return (
    <motion.div
      className="stage no-scroll"
      role="main"
      aria-label="Приветственный экран сада"
      animate={leaving ? { scale: 1.08, opacity: 0.4 } : { scale: 1, opacity: 1 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      onPointerDown={(e) => { startY.current = e.clientY; }}
      onPointerUp={(e) => {
        const dy = startY.current == null ? 0 : startY.current - e.clientY;
        startY.current = null;
        if (dy > 48) go();
      }}
      style={{ touchAction: 'none' }}
    >
      <div className="paper-grain" />
      <section className="arrival">
        <Twig />
        <div className="arrival-copy">
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            Сегодня особенный день.
          </motion.p>
          <AnimatePresence>
            {line2 && (
              <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                Поэтому мы приготовили<br />для вас маленький сад.
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        {line2 && !leaving && (
          <motion.button
            className="swipe-prompt"
            onPointerUp={go}
            animate={{ y: [0, -7, 0] }}
            transition={{ duration: 2.2, repeat: Infinity }}
            aria-label="Войти в сад"
          >
            Проведите вверх <span>↑</span>
          </motion.button>
        )}
      </section>
    </motion.div>
  );
}
