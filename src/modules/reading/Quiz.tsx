import { useEffect, useRef, type Dispatch, type PointerEvent, type SetStateAction } from 'react';
import { IconClose, IconSpeaker } from '../../shared/icons';
import { boing, cheer } from '../../shared/sfx';
import { pop, startDust, wobble } from '../../shared/fx';
import { isWord, typeInfo, type Card } from './data';
import { speakCard } from './speak';
import type { Mode } from './settings';

/** Show a dot between the syllables of a word (KA·LA). */
const SYLLABLE_DOTS = true;

export interface Round {
  item: Card;
  options: Card[];
  solved: boolean;
  /** Wrong options tapped so far in child mode. */
  wrong: string[];
}

interface Props {
  mode: Mode;
  round: Round;
  setRound: Dispatch<SetStateAction<Round | null>>;
  record: (text: string, right: boolean) => void;
  next: () => void;
  stop: () => void;
  celebrate: () => void;
}

export default function Quiz({ mode, round, setRound, record, next, stop, celebrate }: Props) {
  const { item } = round;
  return (
    <div className="screen quiz">
      <div className="top-bar">
        <button className="round-btn" aria-label="Lopeta" onClick={stop}>
          <IconClose />
        </button>
        <div className="type-label-top">{typeInfo(item.type).single}</div>
        <div style={{ width: 44 }} />
      </div>
      {mode === 'parent' ? (
        <ParentCard item={item} record={record} next={next} celebrate={celebrate} />
      ) : (
        <ChildChoice round={round} setRound={setRound} record={record} next={next} celebrate={celebrate} />
      )}
    </div>
  );
}

/** A card's words, each split into syllables; everything but a sentence is one word. */
const wordsOf = (c: Card): string[][] =>
  c.type === 'sentence' ? c.parts.map(w => w.split('-')) : isWord(c.type) ? [c.parts] : [[c.text]];

const label = (c: Card) => wordsOf(c).map(w => w.join(SYLLABLE_DOTS ? '·' : '')).join(' ');

/* Adult shows the card; swipe up = read it, left = needs practice, down = skip. */
function ParentCard({ item, record, next, celebrate }: Pick<Props, 'record' | 'next' | 'celebrate'> & { item: Card }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const sparkRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; dx: number; dy: number } | null>(null);
  const busy = useRef(false);
  const itemRef = useRef(item);
  itemRef.current = item;

  useEffect(() => (sparkRef.current ? startDust(sparkRef.current) : undefined), []);

  const swipe = (dir: 'left' | 'up' | 'down') => {
    const el = cardRef.current;
    if (!el || busy.current) return;
    busy.current = true;
    const from = el.style.transform || 'none';
    el.style.transition = 'none';
    let a: Animation;
    if (dir === 'left') {
      boing();
      a = el.animate([
        { transform: from },
        { transform: 'translateX(-20px) rotate(-14deg) scale(1.08,0.88)', offset: 0.15 },
        { transform: 'translateX(18px) rotate(12deg) scale(0.9,1.1)', offset: 0.3 },
        { transform: 'translateX(-12px) rotate(-8deg) scale(1.1,0.9)', offset: 0.45 },
        { transform: 'translateY(-70px) rotate(0deg) scale(1.05)', offset: 0.65 },
        { transform: 'translate(-560px,160px) rotate(-720deg) scale(0.2)' }
      ], { duration: 1100, easing: 'ease-in-out', fill: 'forwards' });
    } else if (dir === 'up') {
      cheer();
      celebrate();
      a = el.animate([{ transform: from }, { transform: 'translateY(-900px) rotate(-6deg)' }], { duration: 380, easing: 'cubic-bezier(0.22,0.61,0.36,1)', fill: 'forwards' });
    } else {
      a = el.animate([{ transform: from }, { transform: 'translateY(900px)' }], { duration: 300, easing: 'cubic-bezier(0.22,0.61,0.36,1)', fill: 'forwards' });
    }
    a.onfinish = () => {
      if (dir !== 'down') record(itemRef.current.text, dir === 'up');
      next();
      el.getAnimations().forEach(x => x.cancel());
      el.style.transform = '';
      const e = el.animate([{ transform: 'scale(0.85)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 280, easing: 'cubic-bezier(0.22,0.61,0.36,1)' });
      e.onfinish = () => (busy.current = false);
    };
  };

  const swipeRef = useRef(swipe);
  swipeRef.current = swipe;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const d = ({ ArrowLeft: 'left', ArrowUp: 'up', ArrowDown: 'down' } as const)[e.key as 'ArrowLeft'];
      if (d) {
        e.preventDefault();
        swipeRef.current(d);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if (busy.current) return;
    const el = e.currentTarget;
    drag.current = { x: e.clientX, y: e.clientY, dx: 0, dy: 0 };
    el.setPointerCapture?.(e.pointerId);
    el.style.transition = 'none';
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const dx = Math.min(0, e.clientX - drag.current.x), dy = e.clientY - drag.current.y;
    drag.current.dx = dx;
    drag.current.dy = dy;
    e.currentTarget.style.transform = `translate(${dx}px,${dy}px) rotate(${dx / 18}deg)`;
  };
  const onUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const { dx, dy } = drag.current, el = e.currentTarget;
    drag.current = null;
    const horiz = Math.abs(dx) > Math.abs(dy);
    if (horiz && dx < -80) swipe('left');
    else if (!horiz && dy < -80) swipe('up');
    else if (!horiz && dy > 80) swipe('down');
    else {
      el.style.transition = 'transform 280ms cubic-bezier(0.22,0.61,0.36,1)';
      el.style.transform = '';
    }
  };

  const info = typeInfo(item.type);
  return (
    <>
      <div ref={cardRef} className="flash-card" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
        <div ref={sparkRef} className="spark-layer" />
        <div className="card-text" style={{ fontSize: `min(${info.size}, ${parseInt(info.size) / 3.9}vw)`, color: info.color }}>
          {wordsOf(item).map((w, j) => (
            <span key={j} className="card-word">
              {w.map((p, i) => (
                <span key={i}>
                  {SYLLABLE_DOTS && i > 0 && <span className="dot">·</span>}
                  {p}
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>
      <div className="swipe-hint">↑ osasi · ← harjoitellaan · ↓ ohita</div>
      <button className="btn-primary with-icon" onClick={() => speakCard(item)}>
        <IconSpeaker />
        Kuuntele
      </button>
    </>
  );
}

/* Phone says the card; the child taps the matching option. */
function ChildChoice({ round, setRound, record, next, celebrate }: Pick<Props, 'round' | 'setRound' | 'record' | 'next' | 'celebrate'>) {
  const { item, options, solved, wrong } = round;

  const choose = (o: Card, el: HTMLElement) => {
    if (solved) return;
    const firstTry = !wrong.length;
    if (o.text === item.text) {
      if (firstTry) record(item.text, true);
      setRound(r => r && { ...r, solved: true });
      cheer();
      celebrate();
      pop(el);
    } else {
      if (firstTry) record(item.text, false);
      setRound(r => r && { ...r, wrong: r.wrong.includes(o.text) ? r.wrong : [...r.wrong, o.text] });
      boing();
      wobble(el);
    }
  };

  return (
    <>
      <div className="listen">
        <button className="listen-btn" aria-label="Kuuntele" onClick={() => speakCard(item)}>
          <IconSpeaker size={48} />
        </button>
        <div>Kuuntele ja valitse</div>
      </div>
      <div className="options">
        {options.map(o => {
          const isRight = o.text === item.text;
          const cls = ['option', wrong.includes(o.text) && 'wrong', solved && (isRight ? 'right' : 'faded')].filter(Boolean).join(' ');
          return (
            <button key={o.text} className={cls} style={{ fontSize: typeInfo(o.type).optSize }} onClick={e => choose(o, e.currentTarget)}>
              {label(o)}
            </button>
          );
        })}
      </div>
      {solved && (
        <button className="btn-primary" onClick={next}>
          Seuraava
        </button>
      )}
    </>
  );
}
