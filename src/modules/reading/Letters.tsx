import { IconBack } from '../../shared/icons';
import { CONSONANTS, RARE, VOWELS } from './data';
import type { ReadingSettings } from './settings';

interface Props {
  focus: string[];
  update: (patch: Partial<ReadingSettings>) => void;
  onBack: () => void;
}

const GROUPS = [
  { title: 'Vokaalit', letters: VOWELS, color: '#FFD166' },
  { title: 'Konsonantit', letters: CONSONANTS, color: '#8FD8FF' },
  { title: 'Harvinaiset', letters: RARE, color: '#86E3B0' }
];

export default function Letters({ focus, update, onBack }: Props) {
  const toggle = (c: string) => update({ focus: focus.includes(c) ? focus.filter(x => x !== c) : [...focus, c] });

  return (
    <div className="screen scroll letters">
      <div className="top-bar">
        <button className="back" onClick={onBack}>
          <IconBack />
          Takaisin
        </button>
      </div>
      <div className="hero">
        <h1 className="title">Kirjaimet</h1>
        <p className="lead">Kortit tehdään vain valituista kirjaimista.</p>
      </div>
      <div className="links">
        <button className="link" onClick={() => update({ focus: VOWELS.slice() })}>
          Vain vokaalit
        </button>
        <button className="link" onClick={() => update({ focus: [] })}>
          Tyhjennä
        </button>
      </div>
      {GROUPS.map(g => (
        <section key={g.title} className="letter-group">
          <div className="group-title">{g.title}</div>
          <div className="tiles">
            {g.letters.map(c => {
              const on = focus.includes(c);
              return (
                <button
                  key={c}
                  className="tile"
                  aria-pressed={on}
                  style={on ? { background: g.color, color: '#1A2350', boxShadow: `0 0 16px ${g.color}88` } : undefined}
                  onClick={() => toggle(c)}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
