export type FlowerKind = 'chamomile' | 'tulip' | 'wildflower' | 'rose' | 'sunflower';

export interface FlowerInstance {
  id: string;
  kind: FlowerKind;
  /** 0..100 horizontal position in garden */
  x: number;
  /** 0..100 vertical position in garden (as in original visuals) */
  y: number;
  /** growth 0..1 */
  growth: number;
  water: number;
  plantedAt: number;
  wobbleSeed: number;
}

export type Phase = 'arrival' | 'garden' | 'bouquet' | 'after';

export interface GardenState {
  phase: Phase;
  rubProgress: number; // 0..1 finger rubbing soil
  flowers: FlowerInstance[];
  droppedSeed: { kind: FlowerKind; px: number; py: number } | null;
  firefly: { x: number; y: number; tamed: boolean; shown: boolean };
  bouquetDone: boolean;
  muted: boolean;
  version: 1;
}

export const FLOWER_META: Record<FlowerKind, { name: string; seedColor: string; hint: string }> = {
  chamomile: { name: 'Ромашка', seedColor: '#c9b48a', hint: 'наклоняется к вам' },
  tulip: { name: 'Тюльпан', seedColor: '#c98f8f', hint: 'закрывается от прикосновения' },
  wildflower: { name: 'Полевой', seedColor: '#9aa88f', hint: 'качается с соседями' },
  rose: { name: 'Роза', seedColor: '#b97e79', hint: 'раскрывается медленно' },
  sunflower: { name: 'Подсолнух', seedColor: '#8a6f3f', hint: 'тянется к свету' },
};

export const SEED_KINDS: FlowerKind[] = ['tulip', 'chamomile', 'wildflower', 'rose', 'sunflower'];
