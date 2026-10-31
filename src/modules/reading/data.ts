// Finnish letters, syllables and words for the reading module.
export const VOWELS = ['A', 'E', 'I', 'O', 'U', 'Y', 'Ä', 'Ö'];
export const CONSONANTS = ['H', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T', 'V', 'D'];
export const RARE = ['B', 'C', 'F', 'G', 'Q', 'W', 'X', 'Z', 'Å'];
/** Consonants that may end a closed syllable (KAT, KAS, ...). */
const FINALS = ['N', 'S', 'T', 'L', 'R', 'K'];
/** Two-syllable words of open syllables; the dash marks the syllable break. */
const WORDS = ['KA-LA', 'TA-LO', 'LU-MI', 'KU-MI', 'SI-KA', 'NE-NÄ', 'MA-TO', 'VE-SI', 'KO-TI', 'MÄ-KI', 'SA-TA', 'MU-NA', 'KI-SA', 'TU-PA', 'SU-SI', 'KI-VI', 'PE-SÄ', 'LA-VA', 'RA-HA', 'JO-KI', 'PI-PO', 'MA-MA', 'PA-PA', 'TÄ-TI', 'MÖ-KI', 'KY-LÄ', 'HY-VÄ', 'PU-SU', 'HE-PO', 'TU-LI', 'MU-TA', 'PA-LA', 'KA-SA', 'SA-KO', 'LO-KA', 'NA-MI'];
/** Two-syllable words with a closed, long or diphthong syllable. */
const MIX_WORDS = ['KIS-SA', 'AU-TO', 'TUU-LI', 'PAL-LO', 'MAI-TO', 'PUU-RO', 'KOI-RA', 'HII-RI', 'LEI-PÄ', 'SAU-NA', 'KUK-KA', 'NAL-LE', 'KAK-KU', 'PUL-LA', 'MUM-MO', 'VAA-RI', 'ÄI-TI', 'LIN-TU', 'KAR-HU', 'SUK-KA', 'HAT-TU', 'KEN-KÄ', 'TÄH-TI', 'POI-KA', 'TYT-TÖ', 'VAU-VA', 'PÖY-TÄ', 'TUO-LI', 'PIE-NI', 'SUO-MI', 'KUU-SI', 'KUU-MA', 'HEI-NÄ', 'LAI-VA', 'REP-PU', 'PUK-KI', 'MET-SÄ'];
/** Words of three or more syllables. */
const LONG_WORDS = ['PE-RU-NA', 'KA-NA-LA', 'MA-KA-RA', 'SA-TA-MA', 'KA-ME-LI', 'HA-RA-VA', 'KI-PI-NÄ', 'SA-LA-MA', 'PA-PE-RI', 'PI-PA-RI', 'MA-TA-LA', 'MU-KA-VA', 'SI-PU-LI', 'HE-LI-NÄ', 'KO-ME-RO', 'KO-TI-LO', 'MA-KE-A', 'HE-VO-NEN', 'PU-HE-LIN', 'AU-RIN-KO', 'OM-ME-NA', 'MAN-SIK-KA', 'MUS-TIK-KA', 'PA-LA-PE-LI', 'LU-MI-UK-KO'];
/** Short sentences; spaces separate words and dashes syllables. */
const SENTENCES = ['SE ON KA-LA', 'TÄ-MÄ ON TA-LO', 'KIS-SA JA KOI-RA', 'ÄI-TI JA I-SÄ', 'LU-MI ON KYL-MÄ', 'KA-LA UI', 'LIN-TU LEN-TÄÄ', 'I-SO TA-LO', 'PIE-NI HII-RI', 'SI-KA SYÖ', 'MUM-MO JA PAP-PA', 'SA-TAA LUN-TA', 'KO-TI ON KI-VA', 'TU-LI ON KUU-MA', 'MI-NÄ LU-EN', 'SI-NÄ O-LET KI-VA', 'KUU PAIS-TAA', 'KOI-RA HAUK-KUU', 'NAL-LE NUK-KUU', 'SAU-NA ON KUU-MA'];
/** Finnish diphthongs: two different vowels in one syllable. */
const DIPHTHONGS = ['AI', 'EI', 'OI', 'UI', 'YI', 'ÄI', 'ÖI', 'AU', 'EU', 'IU', 'OU', 'EY', 'IY', 'ÄY', 'ÖY', 'IE', 'UO', 'YÖ'];
/**
 * Finnish letter names, spelled so the speech engine says them as one word.
 * Speech engines can't produce bare consonant sounds ("sss" is read as "äs äs äs").
 * Å is given its sound since its name ("ruotsalainen oo") is long for a child.
 */
const LETTER_NAMES: Record<string, string> = {
  A: 'aa', B: 'bee', C: 'see', D: 'dee', E: 'ee', F: 'äf', G: 'gee', H: 'hoo', I: 'ii', J: 'jii', K: 'koo', L: 'äl', M: 'äm', N: 'än', O: 'oo',
  P: 'pee', Q: 'kuu', R: 'är', S: 'äs', T: 'tee', U: 'uu', V: 'vee', W: 'kaksoisvee', X: 'äks', Y: 'yy', Z: 'tseta', Å: 'oo', Ä: 'ää', Ö: 'öö'
};

export type CardType = 'letter' | 'open' | 'long' | 'closed' | 'diph' | 'word' | 'mixword' | 'longword' | 'sentence';

export interface Card {
  text: string;
  type: CardType;
  /** Letters/syllables of a card; for a sentence, its words with dashes between syllables. */
  parts: string[];
}

export const CARD_TYPES: { id: CardType; label: string; single: string; ex: string; size: string; optSize: string; color: string }[] = [
  { id: 'letter', label: 'Kirjaimet', single: 'Kirjain', ex: 'A', size: '200px', optSize: '48px', color: '#FFD166' },
  { id: 'open', label: 'Tavut', single: 'Tavu', ex: 'KA', size: '150px', optSize: '44px', color: '#8FD8FF' },
  { id: 'long', label: 'Pitkät tavut', single: 'Pitkä tavu', ex: 'KAA', size: '120px', optSize: '40px', color: '#C9B8FF' },
  { id: 'closed', label: 'Umpitavut', single: 'Umpitavu', ex: 'KAT', size: '120px', optSize: '40px', color: '#86E3B0' },
  { id: 'diph', label: 'Diftongit', single: 'Diftongi', ex: 'KAI', size: '120px', optSize: '40px', color: '#7FE0D6' },
  { id: 'word', label: 'Sanat', single: 'Sana', ex: 'KA·LA', size: '96px', optSize: '36px', color: '#FFAFCB' },
  { id: 'mixword', label: 'Vaikeammat sanat', single: 'Sana', ex: 'KIS·SA', size: '64px', optSize: '34px', color: '#FFB38A' },
  { id: 'longword', label: 'Pitkät sanat', single: 'Pitkä sana', ex: 'KA·NA·LA', size: '44px', optSize: '30px', color: '#F7A8FF' },
  { id: 'sentence', label: 'Lauseet', single: 'Lause', ex: 'KALA UI', size: '52px', optSize: '24px', color: '#FFE9A8' }
];

/** Types whose card is one word read syllable by syllable. */
export const isWord = (t: CardType) => t === 'word' || t === 'mixword' || t === 'longword';

const WORD_LISTS = { word: WORDS, mixword: MIX_WORDS, longword: LONG_WORDS };

export const typeInfo = (t: CardType) => CARD_TYPES.find(c => c.id === t)!;

export const isVowel = (c: string) => VOWELS.includes(c) || c === 'Å';

export function buildPool(type: CardType, focus: string[]): Card[] {
  const V = focus.filter(isVowel), C = focus.filter(c => !isVowel(c));
  const fits = (s: string) => [...s.replace(/[- ]/g, '')].every(ch => focus.includes(ch));
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
    case 'diph':
      return C.flatMap(c => DIPHTHONGS.filter(fits).map(d => ({ text: c + d, type, parts: [c, d] })));
    case 'word':
    case 'mixword':
    case 'longword':
      return WORD_LISTS[type].filter(fits).map(w => ({ text: w.replace(/-/g, ''), type, parts: w.split('-') }));
    case 'sentence':
      return SENTENCES.filter(fits).map(s => ({ text: s.replace(/-/g, ''), type, parts: s.split(' ') }));
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
