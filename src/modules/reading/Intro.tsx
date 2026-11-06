import { IconBack } from '../../shared/icons';
import { typeInfo, labelOf, type Card } from './data';
import { LAST, LEVELS, exampleCard } from './levels';
import { speakCard } from './speak';

interface Props {
  level: number;
  onBack: () => void;
  onBegin: () => void;
}

/* Shown before a level is played the first time: its new letters or new card type. */
export default function Intro({ level, onBack, onBegin }: Props) {
  const L = LEVELS[level], ex = exampleCard(level);
  const letter = (c: string): Card => ({ text: c, type: 'letter', parts: [c] });
  return (
    <div className="screen intro">
      <div className="top-bar">
        <button className="back" onClick={onBack}>
          <IconBack />
          Polku
        </button>
      </div>
      <div className="intro-head">
        <div className="eyebrow">
          Taso {level + 1} / {LAST + 1}
        </div>
        <h1 className="title">{L.title}</h1>
      </div>
      <div className="intro-body">
        {L.add.length > 0 && (
          <>
            <div className="intro-what">Uudet kirjaimet</div>
            <div className="intro-letters">
              {L.add.map(c => (
                <button key={c} className="intro-card letter" onClick={() => speakCard(letter(c))}>
                  {c}
                </button>
              ))}
            </div>
          </>
        )}
        {ex && (
          <>
            <div className="intro-what">Uusi korttityyppi</div>
            <button className="intro-card example" style={{ color: typeInfo(ex.type).color, fontSize: ex.text.length > 4 ? 52 : 88 }} onClick={() => speakCard(ex)}>
              {labelOf(ex)}
            </button>
          </>
        )}
        {L.add.length > 0 || ex ? (
          <div className="intro-hint">Napauta ja kuuntele.</div>
        ) : (
          <div className="intro-what">Kaikki kortit sekaisin. Jokainen opittu kortti on uusi tähti.</div>
        )}
      </div>
      <div className="intro-types">
        <div className="eyebrow">Tällä tasolla</div>
        <div className="chips">
          {L.types.map(t => (
            <span key={t} className="chip">
              {typeInfo(t).label}
            </span>
          ))}
        </div>
      </div>
      <button className="btn-primary" onClick={onBegin}>
        Aloita
      </button>
    </div>
  );
}
