import { useEffect, useMemo, useRef, useState } from 'react';
import { stopSpeech, warmUpVoices } from '../../shared/speech';
import { confetti } from '../../shared/fx';
import { buildOptions, buildPool, pickCard } from './data';
import { speakCard } from './speak';
import { loadSettings, saveSettings, type ReadingSettings } from './settings';
import Picker from './Picker';
import Letters from './Letters';
import Quiz, { type Round } from './Quiz';

/** In child mode, say the card out loud as soon as it appears. */
const AUTO_PLAY = true;

const poolsOf = (s: ReadingSettings) => s.types.map(t => buildPool(t, s.focus)).filter(p => p.length);

export default function ReadingModule() {
  const [settings, setSettings] = useState(loadSettings);
  const [screen, setScreen] = useState<'picker' | 'letters' | 'quiz'>('picker');
  const [round, setRound] = useState<Round | null>(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const lastRef = useRef<string | null>(null);
  const fxRef = useRef<HTMLDivElement>(null);

  useEffect(() => saveSettings(settings), [settings]);
  useEffect(() => warmUpVoices(), []);

  const update = (patch: Partial<ReadingSettings>) => setSettings(s => ({ ...s, ...patch }));
  const pools = useMemo(() => poolsOf(settings), [settings]);

  const next = () => {
    const s = settingsRef.current, pools = poolsOf(s);
    const item = pickCard(pools, s.misses, lastRef.current);
    if (!item) return;
    lastRef.current = item.text;
    setRound({ item, options: s.mode === 'child' ? buildOptions(item, pools) : [], solved: false, wrong: [] });
    setScreen('quiz');
    if (s.mode === 'child' && AUTO_PLAY) setTimeout(() => speakCard(item), 350);
  };

  const record = (text: string, right: boolean) =>
    setSettings(s => {
      const n = s.misses[text] || 0;
      return { ...s, misses: { ...s.misses, [text]: right ? Math.max(0, n - 1) : n + 1 } };
    });

  const stop = () => {
    stopSpeech();
    setScreen('picker');
  };

  return (
    <>
      <div ref={fxRef} className="fx-layer" />
      {screen === 'picker' && <Picker settings={settings} update={update} hasCards={pools.length > 0} onStart={next} onLetters={() => setScreen('letters')} />}
      {screen === 'letters' && <Letters focus={settings.focus} update={update} onBack={() => setScreen('picker')} />}
      {screen === 'quiz' && round && (
        <Quiz
          mode={settings.mode}
          round={round}
          setRound={setRound}
          record={record}
          next={next}
          stop={stop}
          celebrate={() => fxRef.current && confetti(fxRef.current)}
        />
      )}
    </>
  );
}
