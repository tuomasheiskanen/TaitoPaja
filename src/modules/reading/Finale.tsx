import { useEffect, useRef, useState } from 'react';
import { confetti, popIn, reducedMotion, startFireworks } from '../../shared/fx';
import { cheer, fanfare } from '../../shared/sfx';

interface Props {
  stars: number;
  islands: number;
  /** Day the journey was finished (YYYY-MM-DD). */
  date: string;
  onEnter: () => void;
  onClose: () => void;
}

/** Golden medal with ribbons and a star, awarded for finishing the whole path. */
export function Medal({ size = 180 }: { size?: number }) {
  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 100 120" aria-hidden>
      <path d="M30 0 L48 44 L36 50 L18 4Z" fill="#FF8FA3" />
      <path d="M70 0 L52 44 L64 50 L82 4Z" fill="#8FD8FF" />
      <circle cx="50" cy="76" r="40" fill="#C8902A" />
      <circle cx="50" cy="74" r="40" fill="#FFD166" />
      <circle cx="50" cy="74" r="31" fill="none" stroke="#FFF3C4" strokeWidth="2.5" strokeDasharray="3 4" />
      <polygon points="50 50 56.2 62.6 70 64.6 60 74.3 62.4 88 50 81.5 37.6 88 40 74.3 30 64.6 43.8 62.6" fill="#FFF8DC" stroke="#C8902A" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

const finnishDate = (d: string) => {
  const [y, m, day] = d.split('-').map(Number);
  return `${day}.${m}.${y}`;
};

/*
 * The end of the journey: a fanfare, the fairy flies up to the star, which bursts
 * into fireworks and becomes a medal. Replayable from the medal on the path.
 */
export default function Finale({ stars, islands, date, onEnter, onClose }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const fairyRef = useRef<HTMLDivElement>(null);
  const medalRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    fanfare();
    const flight = reducedMotion() ? 0 : 1700;
    fairyRef.current?.animate(
      [
        { transform: 'translate(-120px, 340px) scale(0.6)', opacity: 0 },
        { transform: 'translate(-90px, 220px) scale(0.9)', opacity: 1, offset: 0.2 },
        { transform: 'translate(80px, 120px) scale(1)', offset: 0.55 },
        { transform: 'translate(-30px, 20px) scale(1.1)', offset: 0.8 },
        { transform: 'translate(0, -40px) scale(0.3)', opacity: 0 }
      ],
      { duration: flight, easing: 'ease-in-out', fill: 'forwards' }
    );
    let stop = () => {};
    const t = setTimeout(() => {
      setRevealed(true);
      cheer();
      confetti(box);
      stop = startFireworks(box);
      if (medalRef.current) popIn(medalRef.current);
    }, flight);
    return () => {
      clearTimeout(t);
      stop();
    };
  }, []);

  return (
    <div ref={boxRef} className="finale">
      <div className="finale-rays" aria-hidden />
      <div ref={fairyRef} className="finale-fairy" aria-hidden>
        <span className="wing l" />
        <span className="wing r" />
      </div>
      <div className={'finale-content' + (revealed ? ' shown' : '')}>
        <div ref={medalRef} className="finale-medal">
          <Medal />
          <div className="medal-label">Lukutaituri</div>
        </div>
        <h1 className="finale-title">Perillä Mikä‑Mikä‑maassa!</h1>
        <p className="finale-text">Koko matka on luettu. Upeaa työtä!</p>
        <div className="chips">
          <span className="chip">★ {stars} tähteä</span>
          <span className="chip">{islands} saarta</span>
          <span className="chip">{finnishDate(date)}</span>
        </div>
        <div className="finale-actions">
          <button className="btn-primary" onClick={onEnter}>
            Mikä-Mikä-maahan
          </button>
          <button className="btn-text" onClick={onClose}>
            Takaisin polulle
          </button>
        </div>
      </div>
    </div>
  );
}
