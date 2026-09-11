import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGarden } from '../state/garden';
import { FlowerIllustration } from '../components/Illustrations';
import { sfx, restoreWind } from '../audio/ambience';

type Stage = 'gather' | 'collect' | 'letter';

export default function Bouquet({ onDone }: { onDone: () => void }) {
  const { state } = useGarden();
  const [stage, setStage] = useState<Stage>('gather');

  useEffect(() => {
    sfx.bouquet();
    // gather → all fly into the wrap as one bouquet → letter.
    // Stays mounted: user leaves via the button (onDone).
    const t1 = setTimeout(() => setStage('collect'), 3200);
    const t2 = setTimeout(() => setStage('letter'), 5800);
    // back in the garden the ambience breathes again
    return () => { clearTimeout(t1); clearTimeout(t2); restoreWind(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flowers = state.flowers.length > 0 ? state.flowers : [
    { id: 'd1', kind: 'tulip' as const, x: 30, y: 68, growth: 1, water: 1, plantedAt: 0, wobbleSeed: 1 },
    { id: 'd2', kind: 'chamomile' as const, x: 50, y: 66, growth: 1, water: 1, plantedAt: 0, wobbleSeed: 2 },
    { id: 'd3', kind: 'rose' as const, x: 70, y: 68, growth: 1, water: 1, plantedAt: 0, wobbleSeed: 3 },
  ];

  // one random z per flower for this scene only
  const depths = useMemo(
    () => flowers.map(() => 10 + Math.floor(Math.random() * 30)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // fan above the wrap mouth, computed from the actual flower count —
  // perfectly mirror-symmetric for any number, rotation strictly tied
  // to position (lean outward), so nothing ever looks random or shifted
  const shown = flowers.slice(0, 8);
  const slot = (i: number) => {
    const x = shown.length === 1 ? 0 : -88 + (176 * i) / (shown.length - 1);
    return { x, y: -78 + (Math.abs(x) / 88) * 48, r: x * 0.18 };
  };

  return (
    <div className="stage no-scroll" role="main" aria-label="Букет и поздравление" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: stage === 'letter' ? 0.35 : 1 }}
        transition={{ duration: 1.6 }}
        style={{ position: 'absolute', inset: 0, background: 'radial-gradient(70% 50% at 50% 62%, #efe3cb 0%, transparent 70%)' }}
        aria-hidden
      />

      <div style={{ position: 'relative', width: 320, height: 430, zIndex: 10 }}>
        {/* wrap paper — big enough to actually hold the bunch */}
        <motion.svg
          viewBox="0 0 120 90"
          width={196}
          height={147}
          style={{ position: 'absolute', left: '50%', top: 232, x: '-50%' }}
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.2, duration: 1 }}
          aria-hidden
        >
          <path d="M20,8 C40,26 60,40 60,78 C60,40 80,26 100,8 C86,10 72,12 60,14 C48,12 34,10 20,8 Z" fill="#e9dfc6" stroke="#b9a67f" strokeWidth={1.5} />
          <path d="M60,14 C58,34 58,56 60,78" stroke="#b9a67f" strokeWidth={1} fill="none" />
          <path d="M44,52 C50,56 70,56 76,52" stroke="#b97e79" strokeWidth={2.4} fill="none" strokeLinecap="round" />
          <path d="M60,52 m-4,0 a4,4 0 1,0 8,0 a4,4 0 1,0 -8,0" fill="#b97e79" />
        </motion.svg>

        {shown.map((f, i) => {
          const sl = slot(i);
          const fromX = (i % 2 === 0 ? -1 : 1) * (150 + i * 12);
          const pose =
            stage === 'gather'
              ? { x: sl.x, y: sl.y, rotate: sl.r, scale: 1, opacity: 1 }
              : { x: sl.x * 0.2, y: 62, rotate: sl.x * 0.03, scale: 0.78, opacity: 1 };
          return (
            <motion.div
              key={f.id}
              style={{ position: 'absolute', left: '50%', top: 170, width: 0, height: 0, zIndex: depths[i] }}
              initial={{ x: fromX, y: 190, rotate: 0, opacity: 0 }}
              animate={pose}
              transition={
                stage === 'gather'
                  ? { delay: 0.4 + i * 0.35, duration: 1.5, ease: [0.22, 1, 0.36, 1] }
                  : { duration: 1.4, ease: [0.22, 1, 0.36, 1] }
              }
            >
              <div style={{ transform: 'translate(-50%,-100%)' }}>
                <FlowerIllustration kind={f.kind} />
              </div>
            </motion.div>
          );
        })}

        {/* drifting petals */}
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.span
            key={i}
            style={{ position: 'absolute', left: 160, top: 120, width: 9, height: 12, borderRadius: '70% 30% 60% 40%', background: ['#d9a5a0', '#e8c39a', '#b8a9c9', '#f2d488'][i % 4] }}
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
