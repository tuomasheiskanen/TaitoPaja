// Path progress and the rules for moving along it. Stored only on this device.
import { loadJSON, saveJSON } from '../../shared/storage';
import { buildPool, weighted, type Card } from './data';
import { LAST, LEVELS, focusAt, goalOf, levelPools, reviewCards } from './levels';

const KEY = 'taitopaja.path.v1';
const OLD_KEY = 'taitopaja.reading.v1';

/** Share of first-try corrects in the last answers needed to finish a level. */
const ACCURACY = 0.7;
const RECENT = 10;
/** Share of cards drawn from earlier levels. */
const REVIEW_SHARE = 0.3;
/** New islands that can be finished per day; the next one waits for tomorrow. */
export const DAILY_NEW = 5;
/** First-try corrects after which a card counts as known (for the last island). */
const KNOWN_AT = 2;

export type Mode = 'parent' | 'child';

export interface LevelProgress {
  /** First-try corrects; never goes down. */
  credits: number;
  /** Last answers, true = first-try correct. */
  recent: boolean[];
  /** Day the level was finished (YYYY-MM-DD). */
  done?: string;
}

export interface PathState {
  mode: Mode;
  stars: number;
  /** Per-card miss counter; higher means the card comes up more often. */
  misses: Record<string, number>;
  /** Per-card first-try corrects. */
  known: Record<string, number>;
  levels: Record<number, LevelProgress>;
  sel: number | null;
}

export function loadPath(): PathState {
  const s = loadJSON<PathState>(KEY);
  const old = s ? null : loadJSON<{ mode: Mode; misses: Record<string, number> }>(OLD_KEY);
  return { mode: 'parent', stars: 0, misses: {}, known: {}, levels: {}, sel: null, ...old, ...s };
}
export const savePath = (s: PathState) => saveJSON(KEY, s);

export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const lp = (s: PathState, i: number): LevelProgress => s.levels[i] ?? { credits: 0, recent: [] };
export const isDone = (s: PathState, i: number) => !!s.levels[i]?.done;

/** First level not finished yet. */
export function reach(s: PathState) {
  for (let i = 0; i < LAST; i++) if (!isDone(s, i)) return i;
  return LAST;
}

/** The next island is resting when today's quota of new islands is used and it hasn't been started. */
export function resting(s: PathState) {
  const r = reach(s), t = today();
  const doneToday = Object.values(s.levels).filter(l => l.done === t).length;
  return doneToday >= DAILY_NEW && !lp(s, r).recent.length;
}

export const unlocked = (s: PathState, i: number) => i < reach(s) || (i === reach(s) && !resting(s));

export function selIdx(s: PathState) {
  if (s.sel != null && unlocked(s, s.sel)) return s.sel;
  const r = reach(s);
  return unlocked(s, r) ? r : Math.max(0, r - 1);
}

/** Filled goal dots. The last one fills only when the level is really finished. */
export function dots(s: PathState, i: number) {
  const g = goalOf(i);
  return isDone(s, i) ? g : Math.min(lp(s, i).credits, g - 1);
}

/** Journey progress over all islands before the last one, 0–1. */
export function journey(s: PathState) {
  let have = 0, need = 0;
  for (let i = 0; i < LAST; i++) {
    have += dots(s, i);
    need += goalOf(i);
  }
  return have / need;
}

const isKnown = (s: PathState, c: Card) => (s.known[c.text] || 0) >= KNOWN_AT && !s.misses[c.text];

/** Cards the child knows; counts up on the last island (a total of 1000+ would only discourage). */
export const knownCount = (s: PathState) => Object.keys(s.known).filter(t => (s.known[t] || 0) >= KNOWN_AT && !s.misses[t]).length;

/**
 * Record an answer on level i. Right means first-try correct.
 * Returns the new state and whether the answer finished the level.
 */
export function answer(s: PathState, i: number, card: Card, right: boolean) {
  const p = lp(s, i), n = s.misses[card.text] || 0;
  const recent = [...p.recent, right].slice(-RECENT);
  const next: LevelProgress = { ...p, recent, credits: p.credits + (right ? 1 : 0) };
  let finished = false;
  if (!p.done && i < LAST) {
    const accurate = recent.filter(Boolean).length >= ACCURACY * recent.length;
    if (next.credits >= goalOf(i) && accurate) {
      next.done = today();
      finished = true;
    }
  }
  const state: PathState = {
    ...s,
    stars: s.stars + (right ? 1 : 0),
    misses: { ...s.misses, [card.text]: right ? Math.max(0, n - 1) : n + 1 },
    known: right ? { ...s.known, [card.text]: (s.known[card.text] || 0) + 1 } : s.known,
    levels: { ...s.levels, [i]: next }
  };
  return { state, finished };
}

/**
 * Next card for level i. After two misses in a row an already known card comes up,
 * so a run of failures is broken by a success. Otherwise about a third of the cards
 * review earlier levels; the rest favour the level's new type and new letters.
 */
export function nextCard(s: PathState, i: number, last: string | null, missRun: number): Card | null {
  const pools = levelPools(i);
  if (!pools.length) return null;
  const fresh = (cs: Card[]) => cs.filter(c => c.text !== last);
  const own = pools.flatMap(p => p.pool);

  if (missRun >= 2) {
    const easy = fresh([...reviewCards(i), ...own]).filter(c => (s.known[c.text] || 0) > 0 && !s.misses[c.text]);
    if (easy.length) return easy[Math.floor(Math.random() * easy.length)];
  }
  if (i > 0 && i < LAST && Math.random() < REVIEW_SHARE) {
    // Pick an earlier level and one of its types first, so big pools (closed syllables) don't drown the rest.
    const earlier = levelPools(Math.floor(Math.random() * i));
    const r = fresh(earlier[Math.floor(Math.random() * earlier.length)].pool);
    if (r.length) return weighted(r, c => 1 + 2 * (s.misses[c.text] || 0));
  }

  const L = LEVELS[i];
  const { pool } = weighted(pools, p => (p.t === L.nt ? 3 : 1));
  const cands = pool.length > 1 ? fresh(pool) : pool;
  return weighted(cands, c => {
    const isNew = L.add.some(ch => c.text.includes(ch)) ? 3 : 0;
    const unknown = i === LAST && !isKnown(s, c) ? 2 : 0;
    return 1 + isNew + unknown + 2 * (s.misses[c.text] || 0);
  });
}

/** Pools to draw wrong options from: the level's own cards plus the card's own type. */
export const optionPools = (i: number, card: Card) => [...levelPools(i).map(p => p.pool), buildPool(card.type, focusAt(i))];

/** Everything back to the first island. Only the parent/child mode is kept. */
export const resetProgress = (s: PathState): PathState => ({ mode: s.mode, stars: 0, misses: {}, known: {}, levels: {}, sel: null });

/** Day marker for levels skipped by choosing a starting point; they don't count toward the daily limit. */
const SKIPPED = 'skipped';

/**
 * Start the path from level k: earlier levels count as done, k and later start fresh.
 * Stars and per-card memory are kept.
 */
export function startFrom(s: PathState, k: number): PathState {
  const levels: Record<number, LevelProgress> = {};
  for (let i = 0; i < k && i < LAST; i++) levels[i] = { credits: goalOf(i), recent: [], done: SKIPPED };
  return { ...s, levels, sel: k };
}

/** Day the whole path was finished by playing (not by choosing a later starting point). */
export function finishedOn(s: PathState): string | null {
  const d = s.levels[LAST - 1]?.done;
  return d && d !== SKIPPED ? d : null;
}
