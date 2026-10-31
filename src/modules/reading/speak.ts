import { preloadClips, playClips, stopClips } from '../../shared/clips';
import { say, sayParts, stopSpeech } from '../../shared/speech';
import { isWord, soundOf, type Card } from './data';
import clipIds from './clips.json';

const available = new Set<string>(clipIds);

/** Same id scheme as tools/audio/inventory.ts. */
const clipId = (type: string, text: string) =>
  `${type}-${text.toLowerCase().replace(/ä/g, 'a_').replace(/ö/g, 'o_').replace(/å/g, 'aa_').replace(/ /g, '-')}`;

const url = (id: string) => `${import.meta.env.BASE_URL}audio/${id}.mp3`;

const SYLLABLE_TYPES = ['open', 'long', 'closed', 'diph'];
const syllableClip = (part: string) => SYLLABLE_TYPES.map(t => clipId(t, part)).find(id => available.has(id));

/** Clips for a card: a word is read syllable by syllable, then as a whole. */
function clipsFor(card: Card): string[] | null {
  const own = clipId(card.type, card.text);
  if (!available.has(own)) return null;
  if (!isWord(card.type)) return [url(own)];
  const syllables = card.parts.map(syllableClip);
  if (!syllables.every(id => id)) return null;
  return [...syllables.map(id => url(id!)), url(own)];
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
  if (isWord(card.type)) sayParts(card.parts);
  else if (card.type === 'sentence') sayParts(card.parts.map(w => w.replace(/-/g, '')));
  else say(card.type === 'letter' ? soundOf(card.text) : card.text.toLowerCase());
}

export function stopAll() {
  stopClips();
  stopSpeech();
}
