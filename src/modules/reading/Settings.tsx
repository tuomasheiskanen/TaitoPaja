import { useState } from 'react';
import { IconBack } from '../../shared/icons';
import { LEVELS } from './levels';
import { reach } from './progress';
import type { PathState } from './progress';

interface Props {
  state: PathState;
  onBack: () => void;
  onStartFrom: (level: number) => void;
  onReset: () => void;
}

/* Parent settings: where the path starts, and resetting progress. */
export default function Settings({ state, onBack, onStartFrom, onReset }: Props) {
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
