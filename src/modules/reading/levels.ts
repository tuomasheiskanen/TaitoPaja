// The level path: which letters and card types each island practises.
import { buildPool, type Card, type CardType } from './data';

export interface Level {
  /** Letters introduced on this level (added to all earlier ones). */
  add: string[];
  types: CardType[];
  /** Card type introduced on this level; it comes up more often. */
  nt?: CardType;
  title: string;
  badge: string;
  /** Example card shown on the intro of a new card type. */
  ex?: string;
}

const lvl = (add: string[], types: CardType[], extra: Partial<Level> = {}): Level => ({
  add,
  types,
  title: 'Uudet kirjaimet: ' + add.join(' '),
  badge: add.join(' '),
  ...extra
});

// Every level that adds letters also practises them as single letters.
export const LEVELS: Level[] = [
  lvl(['A', 'I'], ['letter'], { title: 'Ensimmäiset kirjaimet' }),
  lvl(['U', 'S'], ['letter']),
  lvl([], ['letter', 'open'], { nt: 'open', title: 'Ensimmäiset tavut', badge: 'SA', ex: 'SA' }),
  lvl(['O', 'E'], ['letter', 'open']),
  lvl(['T'], ['letter', 'open']),
  lvl([], ['open', 'long'], { nt: 'long', title: 'Pitkät tavut', badge: 'SAA', ex: 'SAA' }),
  lvl(['L', 'N'], ['letter', 'open', 'long']),
  lvl(['Ä'], ['letter', 'open', 'long']),
  lvl([], ['open', 'word'], { nt: 'word', title: 'Ensimmäiset sanat', badge: 'TA·LO', ex: 'TALO' }),
  lvl(['M', 'Y'], ['letter', 'open', 'word']),
  lvl(['K'], ['letter', 'open', 'long', 'word']),
  lvl([], ['open', 'closed'], { nt: 'closed', title: 'Umpitavut', badge: 'SAT', ex: 'SAT' }),
  lvl(['Ö', 'R'], ['letter', 'open', 'word']),
  lvl(['P', 'V'], ['letter', 'open', 'long', 'word']),
  lvl(['J', 'H'], ['letter', 'open', 'word']),
  lvl(['D'], ['letter', 'open', 'closed', 'word']),
  lvl([], ['open', 'diph'], { nt: 'diph', title: 'Diftongit', badge: 'KAI', ex: 'KAI' }),
  lvl([], ['word', 'mixword'], { nt: 'mixword', title: 'Vaikeammat sanat', badge: 'KIS·SA', ex: 'KISSA' }),
  lvl([], ['mixword', 'longword'], { nt: 'longword', title: 'Pitkät sanat', badge: 'KA·NA·LA', ex: 'KANALA' }),
  lvl([], ['word', 'sentence'], { nt: 'sentence', title: 'Lauseet', badge: 'KALA UI', ex: 'KALA UI' }),
  // The last island never ends: it is the place for endless mixed practice.
  lvl([], ['letter', 'open', 'long', 'closed', 'diph', 'word', 'mixword', 'longword', 'sentence'], { title: 'Mikä-Mikä-maa', badge: '★' })
];

export const LAST = LEVELS.length - 1;

export const focusAt = (i: number) => LEVELS.slice(0, i + 1).flatMap(l => l.add);

const poolCache = new Map<number, { t: CardType; pool: Card[] }[]>();
/** The level's own cards, by type. */
export function levelPools(i: number) {
  let p = poolCache.get(i);
  if (!p) {
    const f = focusAt(i);
    p = LEVELS[i].types.map(t => ({ t, pool: buildPool(t, f) })).filter(x => x.pool.length);
    poolCache.set(i, p);
  }
  return p;
}

const reviewCache = new Map<number, Card[]>();
/** Every card of the earlier levels, for mixing in review. */
export function reviewCards(i: number) {
  let r = reviewCache.get(i);
  if (!r) {
    const seen = new Map<string, Card>();
    for (let j = 0; j < i; j++) for (const { pool } of levelPools(j)) for (const c of pool) seen.set(c.text, c);
    r = [...seen.values()];
    reviewCache.set(i, r);
  }
  return r;
}

export const levelSize = (i: number) => levelPools(i).reduce((a, p) => a + p.pool.length, 0);

/** Correct cards needed: short for tiny early levels, longer for big ones. */
export const goalOf = (i: number) => Math.max(5, Math.min(12, 2 * levelSize(i)));

export function exampleCard(i: number): Card | null {
  const l = LEVELS[i];
  if (!l.nt) return null;
  const pool = buildPool(l.nt, focusAt(i));
  return pool.find(c => c.text === l.ex) ?? pool[0] ?? null;
}
