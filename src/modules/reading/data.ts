// Finnish letters, syllables and words for the reading module.
export const VOWELS = ['A', 'E', 'I', 'O', 'U', 'Y', 'Ä', 'Ö'];
export const CONSONANTS = ['H', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T', 'V', 'D'];
export const RARE = ['B', 'C', 'F', 'G', 'Q', 'W', 'X', 'Z', 'Å'];
/** Consonants that may end a closed syllable (KAT, KAS, ...). */
const FINALS = ['N', 'S', 'T', 'L', 'R', 'K'];
/** Two-syllable words; the dash marks the syllable break. */
const WORDS = ['KA-LA', 'TA-LO', 'LU-MI', 'KU-MI', 'SI-KA', 'NE-NÄ', 'MA-TO', 'VE-SI', 'KO-TI', 'MÄ-KI', 'SA-TA', 'MU-NA', 'KI-SA', 'TU-PA', 'SU-SI', 'KI-VI', 'PE-SÄ', 'LA-VA', 'RA-HA', 'JO-KI', 'PI-PO', 'MA-MA', 'PA-PA', 'TÄ-TI', 'MÖ-KI', 'KY-LÄ', 'HY-VÄ', 'PU-SU', 'HE-PO', 'TU-LI', 'MU-TA', 'PA-LA', 'KA-SA', 'SA-KO', 'LO-KA', 'NA-MI'];
/**
 * Finnish letter names, spelled so the speech engine says them as one word.
 * Speech engines can't produce bare consonant sounds ("sss" is read as "äs äs äs").
 * Å is given its sound since its name ("ruotsalainen oo") is long for a child.
 */
const LETTER_NAMES: Record<string, string> = {
  A: 'aa', B: 'bee', C: 'see', D: 'dee', E: 'ee', F: 'äf', G: 'gee', H: 'hoo', I: 'ii', J: 'jii', K: 'koo', L: 'äl', M: 'äm', N: 'än', O: 'oo',
  P: 'pee', Q: 'kuu', R: 'är', S: 'äs', T: 'tee', U: 'uu', V: 'vee', W: 'kaksoisvee', X: 'äks', Y: 'yy', Z: 'tseta', Å: 'oo', Ä: 'ää', Ö: 'öö'
};

export type CardType = 'letter' | 'open' | 'long' | 'closed' | 'word';

export interface Card {
  text: string;
  type: CardType;
  parts: string[];
}

export const CARD_TYPES: { id: CardType; label: string; single: string; ex: string; size: string; optSize: string; color: string }[] = [
  { id: 'letter', label: 'Kirjaimet', single: 'Kirjain', ex: 'A', size: '200px', optSize: '48px', color: '#FFD166' },
  { id: 'open', label: 'Tavut', single: 'Tavu', ex: 'KA', size: '150px', optSize: '44px', color: '#8FD8FF' },
  { id: 'long', label: 'Pitkät tavut', single: 'Pitkä tavu', ex: 'KAA', size: '120px', optSize: '40px', color: '#C9B8FF' },
  { id: 'closed', label: 'Umpitavut', single: 'Umpitavu', ex: 'KAT', size: '120px', optSize: '40px', color: '#86E3B0' },
  { id: 'word', label: 'Sanat', single: 'Sana', ex: 'KA·LA', size: '96px', optSize: '36px', color: '#FFAFCB' }
];

export const typeInfo = (t: CardType) => CARD_TYPES.find(c => c.id === t)!;

export const isVowel = (c: string) => VOWELS.includes(c) || c === 'Å';

export function buildPool(type: CardType, focus: string[]): Card[] {
  const V = focus.filter(isVowel), C = focus.filter(c => !isVowel(c));
  switch (type) {
    case 'letter':
      return focus.map(c => ({ text: c, type, parts: [c] }));
    case 'open':
      return C.flatMap(c => V.map(v => ({ text: c + v, type, parts: [c, v] })));
    case 'long':
      return C.flatMap(c => V.map(v => ({ text: c + v + v, type, parts: [c, v + v] })));
    case 'closed': {
      const F = C.filter(c => FINALS.includes(c));
      return C.flatMap(c => V.flatMap(v => F.map(f => ({ text: c + v + f, type, parts: [c, v, f] }))));
    }
    case 'word':
      return WORDS.filter(w => [...w.replace('-', '')].every(ch => focus.includes(ch))).map(w => ({ text: w.replace('-', ''), type, parts: w.split('-') }));
  }
}

/** What the speech engine should say for a single letter or syllable. */
export function soundOf(part: string) {
  if (part.length === 1) return LETTER_NAMES[part] || part.toLowerCase();
  return part.toLowerCase();
}

const shuffle = <T,>(a: T[]) => {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};

/**
 * Pick the next card from a random enabled type. Cards that were missed
 * more often are proportionally more likely, and the previous card is avoided.
 */
export function pickCard(pools: Card[][], misses: Record<string, number>, last: string | null): Card | null {
  if (!pools.length) return null;
  const pool = pools[Math.floor(Math.random() * pools.length)];
  const cands = pool.length > 1 ? pool.filter(p => p.text !== last) : pool;
  const w = cands.map(p => 1 + 2 * (misses[p.text] || 0));
  let r = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < cands.length; i++) {
    r -= w[i];
    if (r <= 0) return cands[i];
  }
  return cands[0];
}

/** The right card plus two distractors that look as similar as possible. */
export function buildOptions(item: Card, pools: Card[][]): Card[] {
  const share = (o: Card) => o.parts.filter(x => item.parts.includes(x)).length + (o.type === item.type ? 2 : 0);
  const others = shuffle(pools.flat().filter(o => o.text !== item.text))
    .sort((a, b) => share(b) - share(a))
    .slice(0, 2);
  return shuffle([item, ...others]);
}
