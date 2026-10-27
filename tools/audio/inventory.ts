// Lists every card the app can show (all letters, all types) into work/cards.json.
// Run: node tools/audio/inventory.ts
import { mkdirSync, writeFileSync } from 'node:fs';
import { CARD_TYPES, CONSONANTS, RARE, VOWELS, buildPool, soundOf } from '../../src/modules/reading/data.ts';

const ALL = [...VOWELS, ...CONSONANTS, ...RARE];

/** ASCII-safe id for file names: ä → a_, ö → o_, å → aa_ (underscore never appears otherwise). */
export const clipId = (type: string, text: string) =>
  `${type}-${text.toLowerCase().replace(/ä/g, 'a_').replace(/ö/g, 'o_').replace(/å/g, 'aa_')}`;

const cards = CARD_TYPES.flatMap(t =>
  buildPool(t.id, ALL).map(c => ({
    id: clipId(c.type, c.text),
    type: c.type,
    text: c.text,
    parts: c.parts,
    // What the voice should say: letter name for letters, the text itself otherwise.
    say: c.type === 'letter' ? soundOf(c.text) : c.text.toLowerCase()
  }))
);

mkdirSync(new URL('./work/', import.meta.url), { recursive: true });
writeFileSync(new URL('./work/cards.json', import.meta.url), JSON.stringify(cards, null, 1));
const counts = Object.fromEntries(CARD_TYPES.map(t => [t.id, cards.filter(c => c.type === t.id).length]));
console.log(`${cards.length} cards`, counts);
