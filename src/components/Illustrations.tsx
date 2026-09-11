import type { FlowerKind } from '../types';

/* Artwork ported from the original `birthday_site` project visuals,
   with one addition: `FlowerIllustration` accepts `growth` (0..1) so the
   new project's gradual growth / sapling stages keep working. */

export function Twig() { return <svg className="twig" viewBox="0 0 140 200" aria-hidden="true"><path d="M71 205C67 147 67 91 48 35M67 143c21-18 36-37 41-62M58 110C40 96 27 80 19 59" fill="none" stroke="#71856b" strokeWidth="2" strokeLinecap="round" /><path d="M47 36C33 28 27 18 30 7c15 3 23 12 17 29ZM107 82c13-8 22-20 20-33-15 4-23 14-20 33ZM20 60C7 56 1 45 4 33c13 4 19 13 16 27Z" fill="#a6b49a" /><path d="M71 171c-18-8-29-17-30-30 15-1 27 8 30 30Z" fill="#d9a4a0" /></svg>; }

export function Seed({ kind = 'wildflower' }: { kind?: FlowerKind }) { return <svg className="seed-svg" viewBox="0 0 60 52" aria-hidden="true"><path d="M12 33c3-15 18-25 34-22 6 2 8 7 3 12-10 12-24 17-37 10Z" fill={kind === 'sunflower' ? '#bd9360' : '#806a55'} stroke="#594b3c" strokeWidth="1.5" /><path d="M19 30c9-7 17-11 27-13" stroke="#d8b481" strokeWidth="2" strokeLinecap="round" opacity=".7" /><path d="M9 38c8 5 25 7 41 0" fill="none" stroke="#9b8267" strokeWidth="1" strokeDasharray="2 4" /></svg>; }

const palette: Record<FlowerKind, { petal: string; inner: string; leaf: string }> = {
  chamomile: { petal: '#f9f1dc', inner: '#d9a94d', leaf: '#718b68' },
  tulip: { petal: '#d78f8e', inner: '#b86f73', leaf: '#718b68' },
  wildflower: { petal: '#b5a1c5', inner: '#d6a56f', leaf: '#778b69' },
  sunflower: { petal: '#e3b768', inner: '#8c654c', leaf: '#6d8968' },
  rose: { petal: '#c98c91', inner: '#a96b72', leaf: '#71856a' },
};

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export function FlowerIllustration({ kind, className = '', growth = 1 }: { kind: FlowerKind; className?: string; growth?: number }) {
  const c = palette[kind];
  const g = clamp01(growth);
  // staged growth: sprout -> stem -> head opens
  const stemS = 0.25 + 0.75 * clamp01(g / 0.45);
  const headO = clamp01((g - 0.45) / 0.4);
  const headS = 0.45 + 0.55 * headO;
  const leafO = clamp01((g - 0.3) / 0.3);

  if (g < 0.32) {
    // sapling: two tiny leaves on a short shoot
    return (
      <svg className={`flower-svg ${className}`} viewBox="0 0 140 220" aria-hidden="true">
        <path d="M70 218c0-16 0-26 1-34" fill="none" stroke={c.leaf} strokeWidth="4" strokeLinecap="round" />
        <path d="M70 190c-12-7-19-15-19-25 10 1 17 8 19 25ZM71 186c11-5 19-12 21-21-10 0-17 6-21 21Z" fill={c.leaf} stroke="#5c745a" strokeWidth="1.5" opacity={0.4 + 0.6 * (g / 0.32)} />
      </svg>
    );
  }

  return (
    <svg className={`flower-svg ${className}`} viewBox="0 0 140 220" aria-hidden="true">
      <g style={{ transformBox: 'fill-box', transformOrigin: '50% 100%', transform: `scaleY(${stemS})`, opacity: 0.4 + 0.6 * clamp01(g / 0.45) }}>
        <path className="stem" d="M70 218c1-52 4-97 1-145" fill="none" stroke={c.leaf} strokeWidth="4" strokeLinecap="round" />
      </g>
      <g opacity={leafO}>
        <path d="M70 167c-22-13-34-28-33-45 17 2 30 15 33 45ZM71 139c20-10 34-23 37-38-17-1-30 10-37 38Z" fill={c.leaf} stroke="#5c745a" strokeWidth="1.5" />
      </g>
      <g style={{ transformBox: 'fill-box', transformOrigin: '50% 85%', transform: `scale(${headS})`, opacity: headO }}>
        {kind === 'tulip' ? <><path d="M39 76c5-26 18-37 29-19 14-25 30-17 34 10 1 17-16 38-32 40C54 105 36 94 39 76Z" fill={c.petal} stroke="#a96b6d" strokeWidth="2" /><path d="M52 59c3 16 11 27 18 32 6-8 12-21 14-36" fill="none" stroke="#e8b1aa" strokeWidth="2" /></> : kind === 'sunflower' ? <><path d="M69 71C41 93 31 74 48 60 25 57 30 36 54 42 44 18 65 11 73 34 82 11 101 19 91 43 115 34 121 56 96 61 111 78 91 94 69 71Z" fill={c.petal} stroke="#bf8c49" strokeWidth="2" /><path d="M58 52c2-15 23-20 33-7 7 10-3 27-19 28-14 1-21-10-14-21Z" fill={c.inner} stroke="#725441" strokeWidth="2" /><path d="m64 51 20 12m-15-19 14 21m-4-23 2 24" stroke="#c79658" strokeWidth="1.5" /></> : kind === 'rose' ? <><path d="M71 84C50 80 43 67 51 55c5-8 13-9 21-4 1-16 17-22 26-12 10 11-1 33-15 43-4 3-8 3-12 2Z" fill={c.petal} stroke="#a96d76" strokeWidth="2" /><path d="M57 59c11-9 22 9 34-16M56 70c17-8 23 2 34-14M67 51c-2 10 2 20 13 27" fill="none" stroke="#e6afb0" strokeWidth="2" strokeLinecap="round" /></> : <><path d="M70 78C52 78 42 68 45 54c2-13 12-18 24-10 5-14 18-20 27-11 9 10 3 26-8 37-6 6-11 9-18 8Z" fill={c.petal} stroke="#a98ea5" strokeWidth="2" />{kind === 'chamomile' && <path d="M58 40c-8-15-22-13-23-3 0 10 11 17 22 19M82 40c8-16 22-14 23-4 1 10-10 18-21 20M49 58c-17-3-23 9-16 15 9 7 20 1 28-9M91 58c16-4 24 8 17 15-9 8-20 1-28-8" fill={c.petal} stroke="#d4c39d" strokeWidth="2" />}<path d="M58 58c3-10 14-15 23-8 9 7 4 22-7 26-12 4-20-7-16-18Z" fill={c.inner} /></>}
      </g>
      <path d="M70 151c-13 0-21-8-24-18M72 121c13 2 20-5 26-14" fill="none" stroke="#aac09a" strokeWidth="2" strokeLinecap="round" opacity={leafO} />
    </svg>
  );
}

export function WateringCan() { return <svg viewBox="0 0 150 130" className="can-svg" aria-label="Лейка"><path d="M33 55c4-30 62-38 76-5l4 41c-15 19-59 19-76 0Z" fill="#b5bda5" stroke="#596954" strokeWidth="3" /><path d="M49 51c-6-27 22-42 48-28 10 5 15 15 15 28" fill="none" stroke="#71836a" strokeWidth="7" strokeLinecap="round" /><path d="m112 66 28-18 5 10-27 22" fill="#d9a08f" stroke="#7f655b" strokeWidth="2" /><path d="M43 81c13 8 37 9 58 0" fill="none" stroke="#dce1c7" strokeWidth="3" opacity=".7" /></svg>; }

export function Firefly() { return <svg viewBox="0 0 60 60" className="firefly-svg" aria-label="Светлячок"><path d="M28 34c-8-10-2-22 9-20 10 2 10 14 2 21-4 4-8 4-11-1Z" fill="#e8c772" /><path d="M31 27c-14-11-20 2-7 9M38 25c15-9 20 5 5 12" fill="#f4ead1" opacity=".8" /><circle cx="37" cy="29" r="4" fill="#fff0a8" /></svg>; }
