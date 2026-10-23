import { loadJSON, saveJSON } from '../../shared/storage';
import type { CardType } from './data';

const KEY = 'taitopaja.reading.v1';

export type Mode = 'parent' | 'child';

export interface ReadingSettings {
  mode: Mode;
  focus: string[];
  types: CardType[];
  /** Per-card miss counter; higher means the card comes up more often. */
  misses: Record<string, number>;
}

const DEFAULTS: ReadingSettings = { mode: 'parent', focus: ['A', 'I', 'O', 'K', 'S', 'T'], types: ['letter', 'open'], misses: {} };

export const loadSettings = (): ReadingSettings => ({ ...DEFAULTS, ...loadJSON<ReadingSettings>(KEY) });
export const saveSettings = (s: ReadingSettings) => saveJSON(KEY, s);
