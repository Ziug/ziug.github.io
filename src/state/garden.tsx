import { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import type { FlowerInstance, FlowerKind, GardenState, Phase } from '../types';

const KEY = 'garden-for-you-v1';

const initial: GardenState = {
  phase: 'arrival',
  rubProgress: 1, // soil-rub step removed: garden is ready right after arrival
  flowers: [],
  droppedSeed: null,
  firefly: { x: 72, y: 30, tamed: false, shown: false },
  bouquetDone: false,
  muted: false,
  version: 1,
};

function load(): GardenState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initial;
    const p = JSON.parse(raw) as Partial<GardenState>;
    if (!Array.isArray(p.flowers)) return initial;
    // returning visitors land straight in the living garden
    // migrate saves from before `y` existed
    const flowers = (p.flowers as FlowerInstance[]).map((f) => ({
      ...f,
      y: typeof f.y === 'number' ? f.y : 68,
    }));
    return {
      ...initial,
      ...p,
      flowers,
      phase: (flowers?.length ?? 0) > 0 ? 'after' : 'arrival',
      firefly: { x: 72, y: 30, tamed: false, shown: (p.flowers?.length ?? 0) >= 2 },
      version: 1,
    };
  } catch {
    return initial;
  }
}

type Action =
  | { type: 'swipe-arrival' }
  | { type: 'rub'; amount: number }
  | { type: 'drop-seed'; seed: { kind: FlowerKind; px: number; py: number } }
  | { type: 'plant'; x: number; y: number; kind: FlowerKind }
  | { type: 'water'; id: string; amount: number }
  | { type: 'grow-tick'; dt: number }
  | { type: 'poke'; id: string }
  | { type: 'firefly-move'; x: number; y: number }
  | { type: 'firefly-show' }
  | { type: 'firefly-tame' }
  | { type: 'to-bouquet' }
  | { type: 'bouquet-done' }
  | { type: 'back-to-garden' }
  | { type: 'toggle-mute' }
  | { type: 'reset' };

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function reducer(s: GardenState, a: Action): GardenState {
  switch (a.type) {
    case 'swipe-arrival':
      return s.phase === 'arrival' ? { ...s, phase: 'garden' } : s;
    case 'rub': {
      // soil-rub step removed — keep progress full
      return { ...s, rubProgress: 1 };
    }
    case 'drop-seed':
      return { ...s, droppedSeed: a.seed };
    case 'plant': {
      const f: FlowerInstance = {
        id: uid(),
        kind: a.kind,
        x: Math.max(12, Math.min(88, a.x)),
        y: Math.max(47, Math.min(82, a.y)),
        growth: 0.02,
        water: 0.25,
        plantedAt: Date.now(),
        wobbleSeed: Math.random() * 10,
      };
      return { ...s, flowers: [...s.flowers, f], droppedSeed: null };
    }
    case 'water': {
      const flowers = s.flowers.map((f) =>
        f.id === a.id ? { ...f, water: Math.min(1, f.water + a.amount) } : f,
      );
      return { ...s, flowers };
    }
    case 'grow-tick': {
      let changed = false;
      const flowers = s.flowers.map((f) => {
        if (f.growth >= 1) return f;
        // growth needs water; water slowly evaporates
        const rate = 0.06 * (0.25 + f.water) * a.dt;
        const water = Math.max(0.08, f.water - 0.008 * a.dt);
        const growth = Math.min(1, f.growth + rate);
        if (growth !== f.growth) changed = true;
        return { ...f, growth, water };
      });
      if (!changed) return s;
      // firefly is shown by the scene with a delay ("let the garden live"),
      // never immediately here
      return { ...s, flowers };
    }
    case 'poke':
      return s;
    case 'firefly-move':
      return { ...s, firefly: { ...s.firefly, x: a.x, y: a.y } };
    case 'firefly-show':
      return { ...s, firefly: { ...s.firefly, shown: true } };
    case 'firefly-tame':
      return { ...s, firefly: { ...s.firefly, tamed: true } };
    case 'to-bouquet':
      return { ...s, phase: 'bouquet' };
    case 'bouquet-done':
      return { ...s, bouquetDone: true, phase: 'after' };
    case 'back-to-garden':
      return { ...s, phase: 'after' };
    case 'toggle-mute':
      return { ...s, muted: !s.muted };
    case 'reset':
      return { ...initial, phase: 'garden' };
  }
}

const Ctx = createContext<{ state: GardenState; dispatch: React.Dispatch<Action> } | null>(null);

export function GardenProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ flowers: state.flowers, muted: state.muted, bouquetDone: state.bouquetDone }));
    } catch { /* ignore */ }
  }, [state.flowers, state.muted, state.bouquetDone]);

  // growth loop — cheap interval, transform-only animations elsewhere
  useEffect(() => {
    if (state.phase !== 'garden' && state.phase !== 'after') return;
    const id = window.setInterval(() => dispatch({ type: 'grow-tick', dt: 1 }), 700);
    return () => window.clearInterval(id);
  }, [state.phase]);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGarden() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useGarden outside provider');
  return v;
}

export function grownCount(s: GardenState) {
  return s.flowers.filter((f) => f.growth > 0.6).length;
}

export type { Phase };
