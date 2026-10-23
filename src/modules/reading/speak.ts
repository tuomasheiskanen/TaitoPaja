import { say, sayParts } from '../../shared/speech';
import { soundOf, type Card } from './data';

/** Letters are spoken as their sound, words syllable by syllable. */
export function speakCard(card: Card) {
  if (card.type === 'word') sayParts(card.parts);
  else say(card.type === 'letter' ? soundOf(card.text) : card.text.toLowerCase());
}
