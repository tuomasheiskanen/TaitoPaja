import { preloadClips, playClips, stopClips } from '../../shared/clips';
import { say, sayParts, stopSpeech } from '../../shared/speech';
import { soundOf, type Card } from './data';
import clipIds from './clips.json';

const available = new Set<string>(clipIds);

/** Same id scheme as tools/audio/inventory.ts. */
const clipId = (type: string, text: string) =>
  `${type}-${text.toLowerCase().replace(/ä/g, 'a_').replace(/ö/g, 'o_').replace(/å/g, 'aa_')}`;

const url = (id: string) => `${import.meta.env.BASE_URL}audio/${id}.mp3`;

/** Clips for a card: a word is read syllable by syllable, then as a whole. */
function clipsFor(card: Card): string[] | null {
  const own = clipId(card.type, card.text);
  if (card.type !== 'word') return available.has(own) ? [url(own)] : null;
  const syllables = card.parts.map(p => clipId('open', p));
  if (!available.has(own) || !syllables.every(id => available.has(id))) return null;
  return [...syllables.map(url), url(own)];
}

export function preloadCard(card: Card) {
  const urls = clipsFor(card);
  if (urls) preloadClips(urls);
}

/** Recorded clips when we have them; the phone's voice otherwise. */
export async function speakCard(card: Card) {
  stopSpeech();
  const urls = clipsFor(card);
  if (urls && (await playClips(urls))) return;
  if (card.type === 'word') sayParts(card.parts);
  else say(card.type === 'letter' ? soundOf(card.text) : card.text.toLowerCase());
}

export function stopAll() {
  stopClips();
  stopSpeech();
}
