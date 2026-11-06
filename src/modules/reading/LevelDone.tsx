import { useEffect, useRef } from 'react';
import { IconStar } from '../../shared/icons';
import { LEVELS } from './levels';

interface Props {
  level: number;
  fast: boolean;
  /** The next island waits until tomorrow (daily limit reached). */
  nextTomorrow: boolean;
  onContinue: () => void;
  onStay: () => void;
}

export default function LevelDone({ level, fast, nextTomorrow, onContinue, onStay }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const next = LEVELS[level + 1];

  useEffect(() => {
    ref.current?.animate(
      [{ transform: 'scale(0.7)', opacity: 0 }, { transform: 'scale(1.04)', opacity: 1, offset: 0.6 }, { transform: 'scale(1)', opacity: 1 }],
      { duration: 560, easing: 'cubic-bezier(0.22,0.61,0.36,1)' }
    );
  }, []);

  return (
    <div className="overlay">
      <div ref={ref} className="done-card">
        <div className="done-star">
          <IconStar size={96} />
        </div>
        <div className="done-title">{fast ? 'Lentäen läpi!' : `Taso ${level + 1} valmis!`}</div>
        <div className="done-text">{fast ? 'Viisi oikein putkeen. Tämä taso oli helppo!' : 'Uusi tähti syttyi polullesi.'}</div>
        {next && (
          <div className="done-next">
            <div className="done-badge">{nextTomorrow ? '☾' : next.badge}</div>
            <div>
              <div className="eyebrow">{nextTomorrow ? 'Huomenna' : 'Seuraavaksi'}</div>
              <div className="done-next-title">{next.title}</div>
            </div>
          </div>
        )}
        <div className="done-actions">
          <button className="btn-primary" onClick={onContinue}>
            Jatka matkaa
          </button>
          <button className="btn-text" onClick={onStay}>
            Vielä tätä tasoa
          </button>
        </div>
      </div>
    </div>
  );
}
