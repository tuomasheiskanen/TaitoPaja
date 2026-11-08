import { useEffect, useRef } from 'react';
import { IconBack, IconStar } from '../../shared/icons';
import { burst, pop, popIn } from '../../shared/fx';
import { chime } from '../../shared/sfx';
import { typeInfo, labelOf, type Card } from './data';
import { LAST, LEVELS, exampleCard } from './levels';
import { speakCard } from './speak';

interface Props {
  level: number;
  onBack: () => void;
  onBegin: () => void;
  celebrate: () => void;
}

/** Delay between the new cards flying in. */
const STAGGER = 220;

/*
 * Shown before a level is played the first time: its new letters or new card type.
 * The cards spin in over glowing rays with a chime, confetti and star bursts.
 */
export default function Intro({ level, onBack, onBegin, celebrate }: Props) {
  const L = LEVELS[level], ex = exampleCard(level);
  const letter = (c: string): Card => ({ text: c, type: 'letter', parts: [c] });
  const cards: { key: string; card: Card | null; label: string; cls: string; style?: React.CSSProperties }[] = [
    ...L.add.map(c => ({ key: c, card: letter(c), label: c, cls: 'letter' })),
    ...(ex ? [{ key: 'ex', card: ex, label: labelOf(ex), cls: 'example', style: { color: typeInfo(ex.type).color, fontSize: ex.text.length > 4 ? 52 : 88 } }] : [])
  ];
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const headRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    chime();
    headRef.current?.animate([{ transform: 'translateY(-16px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 500, easing: 'ease-out', fill: 'backwards' });
    const timers = [setTimeout(celebrate, 350)];
    cardRefs.current.forEach((el, k) => {
      if (!el) return;
      popIn(el, 200 + k * STAGGER);
      timers.push(setTimeout(() => burst(el), 200 + k * STAGGER + 420));
    });
    startRef.current?.animate([{ transform: 'translateY(30px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 450, delay: 500 + cardRefs.current.length * STAGGER, easing: 'ease-out', fill: 'backwards' });
    return () => timers.forEach(clearTimeout);
    // Only when the screen opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tap = (el: HTMLButtonElement, card: Card | null) => {
    pop(el);
    burst(el, 8);
    if (card) speakCard(card);
  };

  return (
    <div className="screen intro">
      <div className="top-bar">
        <button className="back" onClick={onBack}>
          <IconBack />
          Polku
        </button>
      </div>
      <div ref={headRef} className="intro-head">
        <div className="eyebrow">
          Taso {level + 1} / {LAST + 1}
        </div>
        <h1 className="title">{L.title}</h1>
      </div>
      <div className="intro-body">
        <div className="intro-what">{L.add.length ? 'Uudet kirjaimet' : ex ? 'Uusi korttityyppi' : 'Kaikki kortit sekaisin'}</div>
        <div className="intro-stage">
          <div className="intro-rays" aria-hidden />
          <div className="intro-cards">
            {cards.map((c, k) => (
              <div key={c.key} className="intro-float" style={{ animationDelay: `${-k * 0.8}s` }}>
                <button ref={el => void (cardRefs.current[k] = el)} className={'intro-card ' + c.cls} style={c.style} onClick={e => tap(e.currentTarget, c.card)}>
                  {c.label}
                </button>
              </div>
            ))}
            {!cards.length && (
              <div className="intro-float">
                <button ref={el => void (cardRefs.current[0] = el)} className="intro-card star" aria-label="Tähti" onClick={e => tap(e.currentTarget, null)}>
                  <IconStar size={96} />
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="intro-hint">{cards.length ? 'Napauta ja kuuntele.' : 'Jokainen opittu kortti on uusi tähti.'}</div>
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
      <button ref={startRef} className="btn-primary intro-start" onClick={onBegin}>
        Aloita
      </button>
    </div>
  );
}
