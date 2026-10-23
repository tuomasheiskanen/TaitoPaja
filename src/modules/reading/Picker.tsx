import { IconCheck, IconChevron, IconSettings } from '../../shared/icons';
import { CARD_TYPES, CONSONANTS, RARE, VOWELS, buildPool, isVowel, type CardType } from './data';
import type { Mode, ReadingSettings } from './settings';

interface Props {
  settings: ReadingSettings;
  update: (patch: Partial<ReadingSettings>) => void;
  hasCards: boolean;
  onStart: () => void;
  onLetters: () => void;
}

const MODES: { id: Mode; label: string; text: string }[] = [
  { id: 'parent', label: 'Aikuinen näyttää', text: 'Näytä kortti lapselle. Hän lukee ääneen, sinä merkitset.' },
  { id: 'child', label: 'Lapsi valitsee', text: 'Puhelin sanoo äänteen. Lapsi valitsee oikean kortin.' }
];

export default function Picker({ settings, update, hasCards, onStart, onLetters }: Props) {
  const { mode, focus, types } = settings;
  const toggleType = (t: CardType) => update({ types: types.includes(t) ? types.filter(x => x !== t) : [...types, t] });

  const V = focus.filter(isVowel), C = focus.filter(c => !isVowel(c));
  const emptyText = !focus.length
    ? 'Valitse ainakin yksi kirjain.'
    : !types.length
      ? 'Valitse ainakin yksi korttityyppi.'
      : !V.length || !C.length
        ? 'Tavuihin tarvitaan vokaali ja konsonantti.'
        : 'Valituilla kirjaimilla ei löydy kortteja.';
  const focusSummary = focus.length ? [...VOWELS, ...CONSONANTS, ...RARE].filter(c => focus.includes(c)).join(' ') : 'Ei valittu';

  return (
    <div className="screen">
      <div className="scroll picker">
        <div className="hero">
          <h1 className="title-glow">TaitoPaja</h1>
          <p className="lead">Lennetään tänään näiden kirjainten luo.</p>
        </div>

        <section className="group">
          <div className="eyebrow">Tapa</div>
          <div className="segmented" role="radiogroup">
            {MODES.map(m => (
              <button key={m.id} role="radio" aria-checked={mode === m.id} className={mode === m.id ? 'on' : ''} onClick={() => update({ mode: m.id })}>
                {m.label}
              </button>
            ))}
          </div>
          <p className="hint">{MODES.find(m => m.id === mode)!.text}</p>
        </section>

        <section className="group">
          <div className="eyebrow">Kortit</div>
          <div className="panel">
            {CARD_TYPES.map(t => {
              const on = types.includes(t.id), n = buildPool(t.id, focus).length;
              return (
                <button key={t.id} className="type-row" role="checkbox" aria-checked={on} onClick={() => toggleType(t.id)}>
                  <span className={'check' + (on ? ' on' : '')}>
                    <IconCheck />
                  </span>
                  <span className="type-text">
                    <span className="type-label">{t.label}</span>
                    <span className="type-count">{n ? n + ' korttia' : 'Ei kortteja näillä kirjaimilla'}</span>
                  </span>
                  <span className="type-ex">{t.ex}</span>
                </button>
              );
            })}
          </div>
        </section>

        <button className="nav-row" onClick={onLetters}>
          <span className="gold">
            <IconSettings />
          </span>
          <span className="nav-text">
            <span className="nav-label">Kirjaimet</span>
            <span className="nav-summary">{focusSummary}</span>
          </span>
          <span className="muted">
            <IconChevron />
          </span>
        </button>
      </div>

      <div className="bottom-bar">
        <button className="btn-primary" disabled={!hasCards} onClick={onStart}>
          Näytä kortti
        </button>
        {!hasCards && <div className="empty-text">{emptyText}</div>}
      </div>
    </div>
  );
}
