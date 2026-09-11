import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useGarden, grownCount } from '../state/garden';
import type { FlowerKind } from '../types';
import { FLOWER_META, SEED_KINDS } from '../types';
import { FlowerIllustration, Seed, WateringCan, Firefly } from '../components/Illustrations';
import { sfx, setMuted, duckWind } from '../audio/ambience';

interface Drop { id: string; x: number; y: number; dist: number }

let n = 0;
const nid = () => `n${Date.now().toString(36)}${(n++).toString(36)}`;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/* Spiral flight: the firefly loops around its anchor point, radius slowly
   breathing in/out — a spiral-like hover. Runs on rAF, touches the DOM node
   directly (no react state churn). Nested between drag-position and pulse so
   neither motion transform is disturbed. */
function Spiral({ children, active }: { children: ReactNode; active: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!active || reduce) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const el = ref.current;
      if (el) {
        const s = (t - t0) / 1000;
        const R = 17 + 9 * Math.sin(s * 0.45);
        const x = R * Math.cos(s * 1.15);
        const y = R * 0.62 * Math.sin(s * 1.15);
        el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, reduce]);
  return (
    <span ref={ref} style={{ display: 'block', willChange: active && !reduce ? 'transform' : undefined }}>
      {children}
    </span>
  );
}

export default function Garden({ onToBouquet }: { onToBouquet: () => void }) {
  const { state, dispatch } = useGarden();
  const reduce = useReducedMotion();
  const boxRef = useRef<HTMLDivElement>(null);
  const canRef = useRef<HTMLDivElement>(null);

  // seed mechanics ported from the original visuals project:
  // chosen kind + seed that follows the finger, planted on release
  const [selected, setSelected] = useState<FlowerKind>('chamomile');
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const [raked, setRaked] = useState(false);
  const [message, setMessage] = useState('');

  const [drops, setDrops] = useState<Drop[]>([]);
  const [ripples, setRipples] = useState<{ id: string; x: number }[]>([]);
  const [poked, setPoked] = useState<string | null>(null);

  // firefly per script: appears in the grass after the garden lived a little,
  // flies on its own, reacts to a nearby finger, must be herded to the center
  const [fly, setFly] = useState<{ x: number; y: number }>({ x: 78, y: 62 });
  const [pulse, setPulse] = useState(0);
  const lastReact = useRef(0);
  const flyDragging = useRef(false);
  const taming = useRef(false);
  const flyShown = state.firefly.shown && !state.firefly.tamed;
  // finale mood (zoom + calm + quiet) lasts only until the bouquet;
  // after "вернуться в сад" the garden is alive again
  const finale = state.firefly.tamed && !state.bouquetDone;

  const grown = grownCount(state);
  const showCan = state.flowers.some((f) => f.growth < 1 && f.growth > 0.03);
  const inGardenPhase = state.phase === 'garden' || state.phase === 'after';

  // let the garden live a few seconds before the firefly appears
  useEffect(() => {
    if (!inGardenPhase || state.firefly.shown || grown < 2) return;
    const t = setTimeout(() => dispatch({ type: 'firefly-show' }), 4000);
    return () => clearTimeout(t);
  }, [inGardenPhase, state.firefly.shown, grown, dispatch]);

  // autonomous flight: slow wandering, never drifting into the ring by itself
  useEffect(() => {
    if (!flyShown || reduce || !inGardenPhase) return;
    const id = window.setInterval(() => {
      if (flyDragging.current) return;
      const r = boxRef.current?.getBoundingClientRect();
      let nx = 8 + Math.random() * 84;
      let ny = 12 + Math.random() * 46;
      if (r) {
        const dx = ((nx - 50) / 100) * r.width;
        const dy = ((ny - 46) / 100) * r.height;
        if (Math.hypot(dx, dy) < 130) {
          // push away from the center so only the user can bring it home
          nx = clamp(50 + (nx - 50) * 1.9, 5, 95);
          ny = clamp(46 + (ny - 46) * 1.9, 8, 70);
        }
      }
      setFly({ x: nx, y: ny });
    }, 3200);
    return () => window.clearInterval(id);
  }, [flyShown, reduce, inGardenPhase]);

  function tame() {
    if (taming.current) return;
    taming.current = true;
    dispatch({ type: 'firefly-tame' });
    duckWind();
    sfx.firefly();
    // camera gently approaches, then the bouquet
    setTimeout(onToBouquet, 2000);
  }

  // entering the ring — however it got there — tames the firefly
  useEffect(() => {
    if (!flyShown) return;
    const r = boxRef.current?.getBoundingClientRect();
    if (!r) return;
    const dx = ((fly.x - 50) / 100) * r.width;
    const dy = ((fly.y - 46) / 100) * r.height;
    if (Math.hypot(dx, dy) < 70) tame();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fly, flyShown]);

  const instruction =
    state.bouquetDone
      ? 'Этот сад теперь ваш.'
      : state.flowers.length === 0
        ? 'Посадите его там, где захотите.'
        : state.flowers.length === 1 && state.flowers[0].growth < 0.55
          ? 'Кажется, ему немного не хватает заботы.'
          : grown < 3
            ? 'Один цветок — уже красиво.'
            : !state.firefly.shown
              ? 'Но давайте сделаем целый сад.'
              : !state.firefly.tamed
                ? 'Кто-то светится в траве…'
                : 'Тихо… сад замирает.';

  function pct(e: { clientX: number; clientY: number }) {
    const r = boxRef.current?.getBoundingClientRect();
    if (!r) return { x: 50, y: 70 };
    return {
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
    };
  }

  // tapping bare soil hints where to plant (original behaviour)
  function soilHint(e: React.PointerEvent) {
    if (state.flowers.length !== 0 || drag) return;
    const { y } = pct(e);
    if (y > 54) {
      setRaked(true);
      setMessage('Вот сюда можно посадить семя');
    }
  }

  function plantAt(x: number, y: number) {
    dispatch({
      type: 'plant',
      x: clamp(x, 12, 88),
      y: clamp(y, 47, 82),
      kind: selected,
    });
    sfx.plant();
    setTimeout(() => sfx.sprout(), 500);
    setDrag(null);
    setMessage('');
  }

  // --- watering (kept from new project: live proximity, droplets, ripples) ---
  // Water flows from the spout tip, not from the finger/body:
  // tip sits at SVG coords ~(143, 55) of a 150x130 viewBox shown 115px wide.
  function canDrag(_: unknown, info: { point: { x: number; y: number } }) {
    const r = boxRef.current?.getBoundingClientRect();
    if (!r) return;
    const canEl = canRef.current?.getBoundingClientRect();
    const s = canEl ? canEl.width / 115 : 1;
    const tipPx = (canEl ? canEl.left - r.left + 143 * s * (115 / 150) : info.point.x - r.left)-10;
    const tipPy = (canEl ? canEl.top - r.top + 55 * s * (115 / 150) : info.point.y - r.top)+20;
    let best: { id: string; d: number; x: number; by: number } | null = null;
    for (const f of state.flowers) {
      const fx = (f.x / 100) * r.width;
      const fy = (f.y / 100) * r.height;
      const d = Math.hypot(fx - tipPx, fy - tipPy);
      if (!best || d < best.d) best = { id: f.id, d, x: fx, by: fy };
    }
    if (best && best.d < 130) {
      dispatch({ type: 'water', id: best.id, amount: 0.12 });
      if (Math.random() < 0.6) {
        const id = nid();
        // base hitbox: only the very bottom of a stem counts.
        // the drop lives until it physically touches one —
        // otherwise it soaks into the soil below.
        let landY: number | null = null;
        for (const f of state.flowers) {
          const fx = (f.x / 100) * r.width;
          const fy = (f.y / 100) * r.height;
          if (fy >= tipPy - 4 && Math.abs(fx - tipPx) <= 24) {
            if (landY == null || fy < landY) landY = fy;
          }
        }
        if (landY == null) landY = r.height * 0.96;
        const dist = Math.max(24, landY - tipPy - 12);
        setDrops((dd) => [...dd.slice(-16), { id, x: tipPx - 2, y: tipPy, dist }]);
        setTimeout(() => setDrops((dd) => dd.filter((q) => q.id !== id)), 950);
        if (Math.random() < 0.35) {
          const rid = nid();
          setRipples((rr) => [...rr.slice(-6), { id: rid, x: best!.x }]);
          setTimeout(() => setRipples((rr) => rr.filter((q) => q.id !== rid)), 1100);
        }
      }
      if (Math.random() < 0.06) sfx.water();
      if (state.flowers.length === 1) setMessage('Смотрите, оно растёт');
    }
  }

  function poke(id: string) {
    sfx.touch();
    dispatch({ type: 'poke', id });
    setPoked(id);
    setMessage('Какой живой цветок');
    setTimeout(() => {
      setPoked((p) => (p === id ? null : p));
      setMessage((m) => (m === 'Какой живой цветок' ? '' : m));
    }, 1300);
  }

  function fireflyDragEnd(_: unknown, info: { point: { x: number; y: number } }) {
    flyDragging.current = false;
    const r = boxRef.current?.getBoundingClientRect();
    if (!r) return;
    const px = info.point.x - r.left;
    const py = info.point.y - r.top;
    setFly({ x: clamp((px / r.width) * 100, 5, 95), y: clamp((py / r.height) * 100, 8, 72) });
  }

  // finger near the firefly: it reacts — repelled close up, curious at mid range
  function fingerNearFly(e: { clientX: number; clientY: number }) {
    if (!flyShown || reduce || drag) return;
    const now = Date.now();
    if (now - lastReact.current < 700) return;
    const r = boxRef.current?.getBoundingClientRect();
    if (!r) return;
    const fx = e.clientX - r.left;
    const fy = e.clientY - r.top;
    const px = (fly.x / 100) * r.width;
    const py = (fly.y / 100) * r.height;
    const d = Math.hypot(fx - px, fy - py);
    if (d < 130) {
      lastReact.current = now;
      let vx = px - fx;
      let vy = py - fy;
      const m = Math.hypot(vx, vy) || 1;
      vx /= m; vy /= m;
      const step = 26;
      setFly((f) => ({
        x: clamp(f.x + ((vx * step) / r.width) * 100, 5, 95),
        y: clamp(f.y + ((vy * step) / r.height) * 100, 8, 70),
      }));
      setPulse((p) => p + 1);
    } else if (d < 250) {
      lastReact.current = now;
      setFly((f) => ({
        x: clamp(f.x + (((fx - px) / r.width) * 100) * 0.18, 5, 95),
        y: clamp(f.y + (((fy - py) / r.height) * 100) * 0.18, 8, 70),
      }));
    }
  }

  const trayKinds = state.flowers.length === 0 ? SEED_KINDS.slice(0, 4) : SEED_KINDS;

  return (
    <motion.div
      ref={boxRef}
      className="stage"
      role="main"
      aria-label="Живой сад"
      onPointerDown={soilHint}
      onPointerMove={(e) => {
        if (drag) {
          const { x, y } = pct(e);
          setDrag({ x: clamp(x, 5, 95), y: clamp(y, 40, 90) });
          return;
        }
        fingerNearFly(e);
      }}
      onPointerUp={(e) => {
        if (!drag) return;
        const { x, y } = pct(e);
        plantAt(x, y);
      }}
      // camera gently approaches for the finale
      animate={{ scale: finale ? 1.07 : 1 }}
      transition={{ duration: 2.2, ease: 'easeInOut' }}
    >
      <div className="paper-grain" />
      <section className={`garden-stage${finale ? ' calm' : ''}`} aria-label="Сад">
        <div className="sky"><div className="sun" /><div className="haze haze-one" /><div className="haze haze-two" /></div>
        <div className="hill hill-back" /><div className="hill hill-front" /><div className="ground" />
        <div className="grass grass-left" aria-hidden>⌁⌁⌁</div>
        <div className="grass grass-right" aria-hidden>⌁⌁⌁</div>
        {raked && <div className="furrow" aria-hidden />}

        {state.flowers.map((f, i) => (
          <motion.div
            key={f.id}
            className={`planted flower-${f.kind}`}
            style={{ left: `${f.x}%`, top: `${f.y}%`, zIndex: Math.round(f.y) + 10 }}
            // centering lives in motion (x/y), NOT css: motion's inline
            // transform would otherwise override the stylesheet translate
            // and the sapling would land far below the drop spot
            initial={{ opacity: 0, scale: 0.4, x: '-50%', y: '-92%' }}
            animate={{
              opacity: 1,
              scale: poked === f.id ? 1.07 : 1,
              x: '-50%',
              y: '-92%',
              rotate: poked === f.id ? (i % 2 === 0 ? 4 : -4) : 0,
            }}
            transition={{ delay: f.growth > 0.1 ? 0 : i * 0.12, type: 'spring', stiffness: 170, damping: 13 }}
            onPointerDown={(e) => { e.stopPropagation(); poke(f.id); }}
            role="button"
            tabIndex={0}
            aria-label={`${FLOWER_META[f.kind].name}. ${FLOWER_META[f.kind].hint}. Нажмите, чтобы потрогать.`}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') poke(f.id); }}
          >
            <FlowerIllustration kind={f.kind} growth={f.growth} />
            {ripples
              .filter((rp) => Math.abs(rp.x - ((f.x / 100) * (boxRef.current?.clientWidth ?? 300))) < 60)
              .map((rp) => (
                <motion.span
                  key={rp.id}
                  style={{ position: 'absolute', left: '50%', bottom: 6, width: 44, height: 10, borderRadius: '50%', border: '1.5px solid rgba(255,244,223,.7)' }}
                  initial={{ scale: 0.4, opacity: 0.8, x: '-50%' }}
                  animate={{ scale: 1.6, opacity: 0, x: '-50%' }}
                  transition={{ duration: 1 }}
                />
              ))}
          </motion.div>
        ))}

        {state.flowers.length === 0 && !drag && (
          <div className="buried-seed" aria-hidden><Seed /></div>
        )}

        {drag && (
          <motion.div
            className="drag-seed"
            style={{ left: `${drag.x}%`, top: `${drag.y}%`, x: '-50%', y: '-50%' }}
            animate={reduce ? undefined : { rotate: [0, 12, -8, 0], scale: 1.18 }}
          >
            <Seed kind={selected} />
          </motion.div>
        )}

        {showCan && (
          <>
            <motion.div
              className="watering-can"
              ref={canRef}
              drag
              dragConstraints={boxRef}
              dragElastic={0.18}
              whileDrag={{ scale: 1.1, rotate: 14 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              onDrag={canDrag}
              onPointerDown={(e) => e.stopPropagation()}
              role="button"
              aria-label="Лейка. Перетащите её к ростку."
              tabIndex={0}
            >
              <WateringCan />
            </motion.div>
            <div className="helper">потяните лейку к ростку</div>
          </>
        )}

        {drops.map((d) => (
          <motion.span
            key={d.id}
            // above the flowers (their z is 59-92): a drop falling along the
            // stem used to slide UNDER the wide head/leaves and looked like
            // it vanished on touching the flower
            style={{ position: 'absolute', left: d.x, top: d.y, width: 4, height: 14, borderRadius: '50%', background: '#c6dedb', zIndex: 95, pointerEvents: 'none' }}
            initial={{ y: -4, opacity: 0 }}
            animate={{ y: reduce ? 0 : d.dist, opacity: [0, 1, 1, 0] }}
            transition={{ duration: 0.8, times: [0, 0.12, 0.8, 1] }}
          />
        ))}

        {flyShown && (
          <>
            <div className="firefly-ring" aria-hidden />
            <motion.div
              className="flying-firefly"
              drag
              dragConstraints={boxRef}
              whileDrag={{ scale: 1.3 }}
              onDragStart={() => { flyDragging.current = true; }}
              onDragEnd={fireflyDragEnd}
              onPointerDown={(e) => e.stopPropagation()}
              animate={reduce ? undefined : { left: `${fly.x}%`, top: `${fly.y}%` }}
              transition={
                reduce
                  ? undefined
                  : {
                      left: { duration: 2.6, ease: 'easeInOut' },
                      top: { duration: 2.6, ease: 'easeInOut' },
                    }
              }
              style={{ left: `${fly.x}%`, top: `${fly.y}%`, touchAction: 'none' }}
              role="button"
              aria-label="Светлячок. Подгоните его к кругу в центре сада."
              tabIndex={0}
            >
              <motion.span
                key={pulse}
                style={{ display: 'block' }}
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.45, 1] }}
                transition={{ duration: 0.5 }}
              >
                <Spiral active={flyShown}>
                  <Firefly />
                </Spiral>
              </motion.span>
            </motion.div>
          </>
        )}
        {finale && (
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ position: 'absolute', left: 0, right: 0, top: '60%', textAlign: 'center', zIndex: 40, color: '#fff4df', fontSize: 14 }}
          >
            Светлячок дома…
          </motion.p>
        )}

        <header className="topbar">
          <span>Сад для вас</span>
          <span style={{ display: 'flex', gap: 4 }}>
            <button onPointerDown={(e) => { e.stopPropagation(); dispatch({ type: 'toggle-mute' }); setMuted(!state.muted); }} aria-label={state.muted ? 'Включить звук' : 'Выключить звук'}>
              {state.muted ? '◌̸' : '◌'}
            </button>
            <button onPointerDown={(e) => { e.stopPropagation(); if (confirm('Начать сад заново?')) dispatch({ type: 'reset' }); }} aria-label="Начать заново">↺</button>
          </span>
        </header>

        <div className="scene-copy">
          <AnimatePresence mode="wait">
            <motion.p key={instruction} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              {instruction}
            </motion.p>
          </AnimatePresence>
          {message && <motion.small initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{message}</motion.small>}
          {flyShown && <small>Он пугливый — подгоните его к кругу в центре сада</small>}
          {state.bouquetDone && !message && <small>Трогайте цветы, сажайте новые семена</small>}
        </div>

        <div className={`seed-tray${state.flowers.length > 0 ? ' garden-tray' : ''}`} role="toolbar" aria-label="Семена для посадки">
          <button
            className="seed-choice"
            onPointerDown={(e) => { e.stopPropagation(); sfx.unlock(); setDrag({ x: 50, y: 86 }); setMessage(''); }}
            aria-label="Взять семя и потянуть в сад"
          >
            <Seed kind={selected} />
            <span>{state.flowers.length === 0 ? 'потяните семя' : 'посадить ещё'}</span>
          </button>
          <div className="kind-row">
            {trayKinds.map((k) => (
              <button
                key={k}
                className={selected === k ? 'chosen' : ''}
                onPointerDown={(e) => { e.stopPropagation(); setSelected(k); }}
                aria-label={`Выбрать: ${FLOWER_META[k].name}`}
              >
                {FLOWER_META[k].name.toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </section>
    </motion.div>
  );
}
