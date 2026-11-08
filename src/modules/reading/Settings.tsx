import { useState } from 'react';
import { IconBack } from '../../shared/icons';
import { LEVELS } from './levels';
import { reach } from './progress';
import type { Mode, PathState } from './progress';

interface Props {
  state: PathState;
  setMode: (m: Mode) => void;
  onBack: () => void;
  onStartFrom: (level: number) => void;
  onReset: () => void;
}

const MODES: { id: Mode; label: string; text: string }[] = [
  { id: 'parent', label: 'Aikuinen näyttää', text: 'Näytä kortti lapselle. Hän lukee ääneen, sinä merkitset: ↑ osasi, ← harjoitellaan.' },
  { id: 'child', label: 'Lapsi valitsee', text: 'Puhelin sanoo kortin. Lapsi valitsee oikean vaihtoehdoista.' }
];

/* Parent settings: how cards are played, where the path starts, and resetting progress. */
export default function Settings({ state, setMode, onBack, onStartFrom, onReset }: Props) {
  const [level, setLevel] = useState(() => reach(state));
  const [confirm, setConfirm] = useState<'start' | 'reset' | null>(null);

  return (
    <div className="screen settings">
      <div className="top-bar">
        <button className="back" onClick={onBack}>
          <IconBack />
          Polku
        </button>
      </div>
      <h1 className="title">Asetukset</h1>

      <section className="settings-group">
        <div className="eyebrow">Pelitapa</div>
        <div className="panel settings-panel">
          <div className="segmented" role="radiogroup">
            {MODES.map(m => (
              <button key={m.id} role="radio" aria-checked={state.mode === m.id} className={state.mode === m.id ? 'on' : ''} onClick={() => setMode(m.id)}>
                {m.label}
              </button>
            ))}
          </div>
          <p className="settings-text">{MODES.find(m => m.id === state.mode)!.text}</p>
        </div>
      </section>

      <section className="settings-group">
        <div className="eyebrow">Aloituskohta</div>
        <div className="panel settings-panel">
          <p className="settings-text">Jos lapsi osaa jo alun, aloita myöhemmältä tasolta. Aiemmat tasot merkitään tehdyiksi, valitusta tasosta eteenpäin aloitetaan alusta. Tähdet säilyvät.</p>
          <select
            className="settings-select"
            value={level}
            onChange={e => {
              setLevel(Number(e.target.value));
              setConfirm(null);
            }}
          >
            {LEVELS.map((l, i) => (
              <option key={i} value={i}>
                {i + 1}. {l.title}
              </option>
            ))}
          </select>
          <button
            className={'btn-secondary' + (confirm === 'start' ? ' confirm' : '')}
            onClick={() => {
              if (confirm !== 'start') return setConfirm('start');
              onStartFrom(level);
            }}
          >
            {confirm === 'start' ? `Vahvista: aloita tasolta ${level + 1}` : `Aloita tasolta ${level + 1}`}
          </button>
        </div>
      </section>

      <section className="settings-group">
        <div className="eyebrow">Nollaa edistyminen</div>
        <div className="panel settings-panel">
          <p className="settings-text">Poistaa tähdet, tasot ja muistetut virheet. Matka alkaa ensimmäiseltä saarelta.</p>
          <button
            className={'btn-secondary danger' + (confirm === 'reset' ? ' confirm' : '')}
            onClick={() => {
              if (confirm !== 'reset') return setConfirm('reset');
              onReset();
            }}
          >
            {confirm === 'reset' ? 'Vahvista: nollaa kaikki' : 'Nollaa edistyminen'}
          </button>
        </div>
      </section>
    </div>
  );
}
