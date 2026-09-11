import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGarden } from '../state/garden';
import { FlowerIllustration } from '../components/Illustrations';
import { sfx, restoreWind } from '../audio/ambience';

export default function Bouquet({ onDone }: { onDone: () => void }) {
  const { state } = useGarden();
  const [stage, setStage] = useState<'gather' | 'letter'>('gather');

  useEffect(() => {
    sfx.bouquet();
    // show the letter, but stay mounted: user leaves via the button (onDone)
    const t = setTimeout(() => setStage('letter'), 5200);
    // back in the garden the ambience breathes again
    return () => { clearTimeout(t); restoreWind(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flowers = state.flowers.length > 0 ? state.flowers : [
    { id: 'd1', kind: 'tulip' as const, x: 30, y: 68, growth: 1, water: 1, plantedAt: 0, wobbleSeed: 1 },
    { id: 'd2', kind: 'chamomile' as const, x: 50, y: 66, growth: 1, water: 1, plantedAt: 0, wobbleSeed: 2 },
    { id: 'd3', kind: 'rose' as const, x: 70, y: 68, growth: 1, water: 1, plantedAt: 0, wobbleSeed: 3 },
  ];

  // bouquet slots along a soft arc
  const slots = [
    { x: -72, y: 26, r: -14, s: 0.92 },
    { x: -36, y: -6, r: -6, s: 1.05 },
    { x: 0, y: -18, r: 0, s: 1.12 },
    { x: 36, y: -6, r: 7, s: 1.05 },
    { x: 72, y: 26, r: 14, s: 0.92 },
    { x: -54, y: 44, r: -9, s: 0.9 },
    { x: 54, y: 44, r: 9, s: 0.9 },
    { x: 0, y: 40, r: 0, s: 0.95 },
  ];

  return (
    <div className="stage no-scroll" role="main" aria-label="Букет и поздравление" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* dimmed living backdrop */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: stage === 'letter' ? 0.35 : 1 }}
        transition={{ duration: 1.6 }}
        style={{ position: 'absolute', inset: 0, background: 'radial-gradient(70% 50% at 50% 62%, #efe3cb 0%, transparent 70%)' }}
        aria-hidden
      />

      <div style={{ position: 'relative', width: 300, height: 380, zIndex: 10 }}>
        {/* wrap */}
        <motion.svg
          viewBox="0 0 120 90"
          width={150}
          height={112}
          style={{ position: 'absolute', left: 75, top: 240 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.6, duration: 1 }}
          aria-hidden
        >
          <path d="M20,8 C40,26 60,40 60,78 C60,40 80,26 100,8 C86,10 72,12 60,14 C48,12 34,10 20,8 Z" fill="#e9dfc6" stroke="#b9a67f" strokeWidth={1.5} />
          <path d="M60,14 C58,34 58,56 60,78" stroke="#b9a67f" strokeWidth={1} fill="none" />
          <path d="M44,52 C50,56 70,56 76,52" stroke="#b97e79" strokeWidth={2.4} fill="none" strokeLinecap="round" />
          <path d="M60,52 m-4,0 a4,4 0 1,0 8,0 a4,4 0 1,0 -8,0" fill="#b97e79" />
        </motion.svg>

        {flowers.slice(0, 8).map((f, i) => {
          const sl = slots[i % slots.length];
          const fromX = ((f.x - 50) / 50) * 160;
          return (
            <motion.div
              key={f.id}
              style={{ position: 'absolute', left: 150, top: 210, width: 0, height: 0 }}
              initial={{ x: fromX, y: 140, rotate: 0, opacity: 0 }}
              animate={{ x: sl.x, y: sl.y, rotate: sl.r, opacity: 1 }}
              transition={{ delay: 0.4 + i * 0.42, duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <div style={{ transform: `translate(-50%,-100%) scale(${sl.s})` }}>
                <FlowerIllustration kind={f.kind} />
              </div>
            </motion.div>
          );
        })}

        {/* drifting petals */}
        {!flowers.length ? null : [0, 1, 2, 3, 4].map((i) => (
          <motion.span
            key={i}
            style={{ position: 'absolute', left: 150, top: 160, width: 9, height: 12, borderRadius: '70% 30% 60% 40%', background: ['#d9a5a0', '#e8c39a', '#b8a9c9', '#f2d488'][i % 4] }}
            initial={{ opacity: 0, x: 0, y: 0 }}
            animate={{ opacity: [0, 0.9, 0], x: [-30 + i * 16, -50 + i * 22], y: [-40, 90], rotate: 120 }}
            transition={{ delay: 1 + i * 0.7, duration: 3.4 }}
          />
        ))}
      </div>

      <AnimatePresence>
        {stage === 'letter' && (
          <motion.div
            className="bouquet-letter"
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
          >
            <div className="letter-card">
              <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                С Днём рождения!
              </motion.h2>
              <p>
                Пусть в жизни всегда будет место
                для красивых вещей,
                которые растут благодаря
                теплу, заботе и любви.
              </p>
              <p style={{ marginTop: 14 }}>Этот сад теперь ваш.</p>
              <p className="sign">От Антона ❤️</p>
              <button
                className="hint-pill"
                style={{ marginTop: 16, cursor: 'pointer', pointerEvents: 'auto' }}
                onClick={onDone}
                aria-label="Вернуться в сад"
              >
                Вернуться в сад →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
