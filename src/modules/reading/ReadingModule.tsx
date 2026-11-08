import { useEffect, useRef, useState } from 'react';
import { warmUpVoices } from '../../shared/speech';
import { confetti, flyStar } from '../../shared/fx';
import { buildOptions } from './data';
import { LAST, LEVELS, goalOf } from './levels';
import { answer, dots, finishedOn, knownCount, loadPath, nextCard, optionPools, resetProgress, today, resting, savePath, selIdx, startFrom, type PathState } from './progress';
import { preloadCard, speakCard, stopAll } from './speak';
import Path from './Path';
import Intro from './Intro';
import Quiz, { type Round } from './Quiz';
import LevelDone from './LevelDone';
import Settings from './Settings';
import Finale from './Finale';

/** In child mode, say the card out loud as soon as it appears. */
const AUTO_PLAY = true;

export default function ReadingModule() {
  const [state, setState] = useState(loadPath);
  const [screen, setScreen] = useState<'path' | 'intro' | 'quiz' | 'settings'>('path');
  const [round, setRound] = useState<Round | null>(null);
  const [done, setDone] = useState<number | null>(null);
  const [justDone, setJustDone] = useState<number | null>(null);
  const [finale, setFinale] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;
  const levelRef = useRef(0);
  const lastRef = useRef<string | null>(null);
  /** Misses in a row; two in a row bring an easy card. */
  const missRun = useRef(0);
  const fxRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLDivElement>(null);

  useEffect(() => savePath(state), [state]);
  useEffect(() => warmUpVoices(), []);

  const update = (patch: Partial<PathState>) => setState(s => ({ ...s, ...patch }));
  const celebrate = () => fxRef.current && confetti(fxRef.current);

  const next = () => {
    const s = stateRef.current, i = levelRef.current;
    const item = nextCard(s, i, lastRef.current, missRun.current);
    if (!item) return;
    lastRef.current = item.text;
    preloadCard(item);
    setRound({ item, options: s.mode === 'child' ? buildOptions(item, optionPools(i, item)) : [], solved: false, wrong: [] });
    setScreen('quiz');
    if (s.mode === 'child' && AUTO_PLAY) setTimeout(() => speakCard(item), 350);
  };

  const start = (i: number) => {
    levelRef.current = i;
    missRun.current = 0;
    setJustDone(null);
    update({ sel: i });
    if (!state.levels[i]?.recent.length) setScreen('intro');
    else next();
  };

  const record = (right: boolean) => {
    if (!round) return;
    const i = levelRef.current, { state: s, finished } = answer(stateRef.current, i, round.item, right);
    stateRef.current = s;
    setState(s);
    missRun.current = right ? 0 : missRun.current + 1;
    if (right && fxRef.current && counterRef.current) flyStar(fxRef.current, counterRef.current);
    if (finished) setTimeout(() => (i === LAST - 1 ? setFinale(true) : setDone(i)), 1300);
  };

  const toPath = () => {
    stopAll();
    setScreen('path');
  };

  const i = levelRef.current;
  const known = i === LAST ? knownCount(state) : null;

  return (
    <>
      <div ref={fxRef} className="fx-layer" />
      {screen === 'path' && (
        <Path
          state={state}
          justDone={justDone}
          counterRef={counterRef}
          setMode={mode => update({ mode })}
          start={start}
          celebrate={celebrate}
          openSettings={() => setScreen('settings')}
          openFinale={() => setFinale(true)}
        />
      )}
      {screen === 'settings' && (
        <Settings
          state={state}
          onBack={toPath}
          onStartFrom={k => {
            setState(s => startFrom(s, k));
            setJustDone(null);
            setScreen('path');
          }}
          onReset={() => {
            setState(resetProgress);
            setJustDone(null);
            setScreen('path');
          }}
        />
      )}
      {screen === 'intro' && <Intro level={i} onBack={toPath} onBegin={next} celebrate={celebrate} />}
      {screen === 'quiz' && round && (
        <Quiz
          mode={state.mode}
          round={round}
          setRound={setRound}
          record={record}
          next={next}
          stop={toPath}
          celebrate={celebrate}
          levelLabel={i === LAST ? LEVELS[LAST].title : 'Taso ' + (i + 1)}
          goal={i === LAST ? null : { filled: dots(state, i), total: goalOf(i) }}
          knownText={known == null ? null : `Osattu ${known} korttia`}
          stars={state.stars}
          counterRef={counterRef}
        />
      )}
      {done != null && (
        <LevelDone
          level={done}
          nextTomorrow={resting(state)}
          onContinue={() => {
            stopAll();
            setJustDone(done);
            setDone(null);
            setState(s => ({ ...s, sel: selIdx({ ...s, sel: null }) }));
            setScreen('path');
          }}
          onStay={() => setDone(null)}
        />
      )}
      {finale && (
        <Finale
          stars={state.stars}
          islands={LAST}
          date={finishedOn(state) ?? today()}
          onEnter={() => {
            setFinale(false);
            start(LAST);
          }}
          onClose={() => {
            stopAll();
            setFinale(false);
            setScreen('path');
          }}
        />
      )}
    </>
  );
}
