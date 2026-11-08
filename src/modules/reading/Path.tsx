import { useEffect, useLayoutEffect, useRef, type MouseEvent, type ReactNode } from 'react';
import { IconSettings, IconStar } from '../../shared/icons';
import { halo, pop, shake } from '../../shared/fx';
import { typeInfo } from './data';
import { Medal } from './Finale';
import { LAST, LEVELS, goalOf } from './levels';
import { dots, finishedOn, isDone, journey, reach, resting, selIdx, unlocked, type PathState } from './progress';

interface Props {
  state: PathState;
  /** Level just finished; the path scrolls from it to the next one. */
  justDone: number | null;
  counterRef: React.RefObject<HTMLDivElement | null>;
  start: (i: number) => void;
  celebrate: () => void;
  openSettings: () => void;
  openFinale: () => void;
}

// Geometry of the winding path; level 0 is at the bottom.
const N = LEVELS.length;
const STEP = 132, TOP = 200, BOT = 96, CX = 185, W = 370;
const PH = TOP + (N - 1) * STEP + BOT;
const pt = (i: number): [number, number] => [CX + Math.round(Math.sin(i * 1.15) * 100), PH - BOT - i * STEP];
const DEST: [number, number] = [CX, 56];
const oppX = (i: number) => Math.max(44, Math.min(326, CX - Math.sin(i * 1.15) * 125));
const SHIP_AT = 7;

const badgeSize = (b: string) => (b.length <= 1 ? 28 : b.length <= 3 ? 22 : b.length <= 5 ? 15 : 11);

const curve = (a: [number, number][]) =>
  a.map((p, k) => {
    if (!k) return `M${p[0]} ${p[1]}`;
    const [x0, y0] = a[k - 1], my = (y0 + p[1]) / 2;
    return ` C${x0} ${my} ${p[0]} ${my} ${p[0]} ${p[1]}`;
  }).join('');

type IslandState = 'done' | 'cur' | 'open' | 'rest' | 'lock';

export default function Path({ state, justDone, counterRef, start, celebrate, openSettings, openFinale }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const haloRef = useRef<HTMLDivElement>(null);
  const r = reach(state), rest = resting(state), sel = selIdx(state);
  const allDone = r === LAST;

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const tgt = (i: number) => Math.max(0, pt(i)[1] - el.clientHeight * 0.6);
    if (justDone == null) {
      el.scrollTop = tgt(sel);
      return;
    }
    el.scrollTop = tgt(justDone);
    const a = setTimeout(() => el.scrollTo({ top: tgt(sel), behavior: 'smooth' }), 600);
    const b = setTimeout(celebrate, 1300);
    return () => (clearTimeout(a), clearTimeout(b));
    // Only when the screen opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const a = haloRef.current && halo(haloRef.current);
    return () => a?.cancel();
  }, [r]);

  const stOf = (i: number): IslandState =>
    isDone(state, i) ? 'done' : i === r ? (rest ? 'rest' : 'cur') : unlocked(state, i) ? 'open' : 'lock';
  const pts = LEVELS.map((_, i) => pt(i));
  const lit = allDone ? [...pts, DEST] : pts.slice(0, r + 1);
  const pct = Math.round(journey(state) * 100);

  const starting = useRef(false);
  /* Tapping an open island starts it, after a short pop so the tap is felt. */
  const onNode = (i: number, ev: MouseEvent<HTMLButtonElement>) => {
    if (!unlocked(state, i)) {
      shake(ev.currentTarget);
      return;
    }
    if (starting.current) return;
    starting.current = true;
    pop(ev.currentTarget);
    setTimeout(() => start(i), 260);
  };

  return (
    <div className="screen path-screen">
      <div className="path-head">
        <div className="path-title-row">
          <h1 className="path-title">TaitoPaja</h1>
          <div className="path-head-actions">
            <div ref={counterRef} className="star-count">
              <IconStar />
              {state.stars}
            </div>
            <button className="round-btn settings-btn" aria-label="Asetukset" onClick={openSettings}>
              <IconSettings size={20} />
            </button>
          </div>
        </div>
        <div className="journey">
          <div className="journey-row">
            <span>Matka Mikä-Mikä-maahan</span>
            <span className="journey-pct">{pct} %</span>
          </div>
          <div className="journey-bar">
            <div style={{ width: Math.max(2, pct) + '%' }} />
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="path-scroll">
        <div className="path-canvas" style={{ height: PH }}>
          <Scenery lit={lit} allDone={allDone} states={LEVELS.map((_, i) => stOf(i))} />
          {finishedOn(state) ? (
            <button className="path-dest medal" aria-label="Lukutaituri-mitali" onClick={openFinale}>
              <Medal size={64} />
            </button>
          ) : (
            <div className="path-dest" style={{ opacity: allDone ? 1 : 0.75 }}>
              <IconStar size={56} fill="#FFF3C4" />
            </div>
          )}
          {!allDone && !rest && <div ref={haloRef} className="halo" style={{ left: pts[r][0] - 36, top: pts[r][1] - 50 }} />}
          {LEVELS.map((l, i) => {
            const st = stOf(i), size = st === 'cur' ? 72 : st === 'done' ? 60 : 54;
            const p = Math.round((dots(state, i) / goalOf(i)) * 100);
            const badge = st === 'rest' ? '☾' : l.badge;
            return (
              <button
                key={i}
                className={'node ' + st}
                aria-label={st === 'rest' ? 'Uusi saari aukeaa huomenna' : l.title}
                onClick={e => onNode(i, e)}
                style={{
                  left: pts[i][0] - size / 2,
                  top: pts[i][1] - 14 - size / 2,
                  width: size,
                  height: size,
                  background: st === 'cur' ? `conic-gradient(var(--gold) ${p}%, rgba(255,255,255,0.18) 0)` : undefined
                }}
              >
                <span style={{ fontSize: badgeSize(badge) }}>{badge}</span>
              </button>
            );
          })}
          <Foreground states={LEVELS.map((_, i) => stOf(i))} fairyAt={allDone ? null : r} />
        </div>
      </div>

      {rest && <div className="path-rest-note">☾ Uusi saari aukeaa huomenna</div>}
    </div>
  );
}

/* ---- Scenery (decoration only) ---- */

const ISLAND_COLORS: Record<IslandState, [string, string, string]> = {
  done: ['#62D69C', '#46357A', '#36296A'],
  cur: ['#7BE3AE', '#4C3B8A', '#3A2C70'],
  open: ['#4FA986', '#3D3070', '#2E245A'],
  rest: ['#4FA986', '#3D3070', '#2E245A'],
  lock: ['#2C3C78', '#22306A', '#1A2558']
};

const cloud = (x: number, y: number, s: number, k: string | number, op: number, fill: string) => (
  <g key={'cl' + k} opacity={op}>
    <animateTransform attributeName="transform" type="translate" values={`0 0;${6 * s} -2;0 0`} dur={8 + (Number(k) || 0) % 4 + 's'} repeatCount="indefinite" />
    <ellipse cx={x} cy={y} rx={40 * s} ry={13 * s} fill={fill} />
    <circle cx={x - 14 * s} cy={y - 7 * s} r={14 * s} fill={fill} />
    <circle cx={x + 10 * s} cy={y - 11 * s} r={19 * s} fill={fill} />
  </g>
);

const sparkle = (x: number, y: number, r: number, k: number) => (
  <path key={'tw' + k} d={`M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z`} fill="#FFF3C4">
    <animate attributeName="opacity" values="0.1;1;0.1" dur={2 + (k % 5) * 0.7 + 's'} begin={((k * 0.37) % 3).toFixed(2) + 's'} repeatCount="indefinite" />
  </path>
);

const flag = (x: number, y: number, col: string, k: number) => (
  <g key={'fl' + k}>
    <line x1={x} y1={y} x2={x} y2={y - 30} stroke="#F4F1FF" strokeWidth={2} strokeLinecap="round" />
    <path d={`M${x} ${y - 30} l17 5 l-17 5Z`} fill={col}>
      <animate attributeName="d" values={`M${x} ${y - 30} l17 5 l-17 5Z;M${x} ${y - 30} l15 7 l-15 3Z;M${x} ${y - 30} l17 5 l-17 5Z`} dur="1.4s" repeatCount="indefinite" />
    </path>
  </g>
);

function island(k: number, x: number, y: number, st: IslandState, big: boolean, col: string) {
  const R = big ? 54 : 44, gy = y + 14, P = ISLAND_COLORS[st];
  return (
    <g key={'is' + k}>
      {st === 'done' && <ellipse cx={x} cy={gy + 18} rx={R + 18} ry={34} fill="#FFD166" opacity={0.1} />}
      <path d={`M${x - R} ${gy} Q${x - R * 0.7} ${gy + R * 0.7} ${x - 6} ${gy + R * 1.15} Q${x} ${gy + R * 1.25} ${x + 8} ${gy + R * 1.1} Q${x + R * 0.7} ${gy + R * 0.6} ${x + R} ${gy}Z`} fill={P[1]} />
      <path d={`M${x + 4} ${gy + 4} Q${x + R * 0.5} ${gy + R * 0.5} ${x + 8} ${gy + R * 1.1} Q${x + R * 0.7} ${gy + R * 0.6} ${x + R} ${gy}Z`} fill={P[2]} />
      {st !== 'lock' && <path d={`M${x - R * 0.55} ${gy + 6} q-4 14 2 26 M${x + R * 0.45} ${gy + 8} q3 10 -1 18`} stroke={P[0]} strokeWidth={2} fill="none" strokeLinecap="round" opacity={0.6} />}
      <ellipse cx={x} cy={gy} rx={R} ry={12} fill={P[0]} />
      <ellipse cx={x - R * 0.25} cy={gy - 3} rx={R * 0.5} ry={4} fill="#FFFFFF" opacity={st === 'lock' ? 0.04 : 0.2} />
      {(st === 'done' || (big && st !== 'lock')) && flag(x + R - 12, gy - 2, st === 'done' ? '#FFD166' : col, k)}
    </g>
  );
}

function ship(x: number, y: number) {
  return (
    <g key="ship" opacity={0.6}>
      <animateTransform attributeName="transform" type="rotate" values={`-4 ${x} ${y};4 ${x} ${y};-4 ${x} ${y}`} dur="5s" repeatCount="indefinite" />
      <path d={`M${x - 34} ${y} L${x + 34} ${y} L${x + 24} ${y + 14} L${x - 26} ${y + 14}Z`} fill="#0B1438" />
      <line x1={x} y1={y} x2={x} y2={y - 46} stroke="#0B1438" strokeWidth={2.5} />
      <path d={`M${x + 2} ${y - 42} Q${x + 26} ${y - 28} ${x + 2} ${y - 8}Z`} fill="#C9D2F5" />
      <path d={`M${x - 2} ${y - 36} Q${x - 22} ${y - 24} ${x - 2} ${y - 10}Z`} fill="#AEB9E8" />
      <path d={`M${x} ${y - 46} l12 4 l-12 4Z`} fill="#FF8FA3" />
    </g>
  );
}

const shooter = (k: number, path: string, begin: string) => (
  <line key={'ss' + k} x1={0} y1={0} x2={44} y2={-18} stroke="#FFF3C4" strokeWidth={2} strokeLinecap="round" opacity={0}>
    <animateMotion path={path} dur="7s" begin={begin} repeatCount="indefinite" keyPoints="0;1;1" keyTimes="0;0.1;1" calcMode="linear" />
    <animate attributeName="opacity" values="0;1;0;0" keyTimes="0;0.03;0.1;1" dur="7s" begin={begin} repeatCount="indefinite" />
  </line>
);

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg width={W} height={PH} className="path-svg" aria-hidden>
      {children}
    </svg>
  );
}

function Scenery({ lit, allDone, states }: { lit: [number, number][]; allDone: boolean; states: IslandState[] }) {
  return (
    <Svg>
      {Array.from({ length: 40 }, (_, k) => sparkle(((k * 97) % 350) + 10, (k * 173 + 40) % PH, 2 + (k % 3), k))}
      {shooter(1, `M360 ${PH * 0.3} L140 ${PH * 0.3 + 90}`, '1s')}
      {shooter(2, `M380 ${PH * 0.7} L160 ${PH * 0.7 + 90}`, '4.5s')}
      <g opacity={allDone ? 0.9 : 0.5}>
        <animateTransform attributeName="transform" type="rotate" values={`0 ${DEST[0]} ${DEST[1]};360 ${DEST[0]} ${DEST[1]}`} dur="40s" repeatCount="indefinite" />
        {Array.from({ length: 12 }, (_, k) => (
          <path key={k} d={`M${DEST[0]} ${DEST[1]} L${DEST[0] - 6} ${DEST[1] - 70} L${DEST[0] + 6} ${DEST[1] - 70}Z`} fill="#FFD166" opacity={0.25} transform={`rotate(${k * 30} ${DEST[0]} ${DEST[1]})`} />
        ))}
      </g>
      {LEVELS.map((_, i) => (i % 3 === 1 && i !== SHIP_AT ? cloud(oppX(i), pt(i)[1] - 40, 0.9, i, 0.1, '#FFFFFF') : null))}
      {ship(oppX(SHIP_AT), pt(SHIP_AT)[1] - 30)}
      {cloud(oppX(SHIP_AT), pt(SHIP_AT)[1] - 12, 1.1, 99, 0.14, '#FFFFFF')}
      {lit.length > 1 && <path d={curve(lit)} fill="none" stroke="#FFD166" strokeWidth={12} strokeOpacity={0.14} strokeLinecap="round" />}
      {lit.length > 1 && <path d={curve(lit)} fill="none" stroke="#FFD166" strokeWidth={3.5} strokeLinecap="round" />}
      {LEVELS.map((l, i) => island(i, pt(i)[0], pt(i)[1], states[i], !!l.nt || i === LAST, l.nt ? typeInfo(l.nt).color : '#FFD166'))}
    </Svg>
  );
}

function Foreground({ states, fairyAt }: { states: IslandState[]; fairyAt: number | null }) {
  const f = fairyAt == null ? null : pt(fairyAt);
  return (
    <Svg>
      {states.map((st, i) => (st === 'lock' ? cloud(pt(i)[0], pt(i)[1] - 6, 1.3, 'L' + i, 0.95, '#34457F') : null))}
      {f && fairy(f[0] + 44, f[1] - 62)}
    </Svg>
  );
}

function fairy(x: number, y: number) {
  return (
    <g key="fairy">
      <animateTransform attributeName="transform" type="translate" values="0 0;5 -10;0 -2;-4 -7;0 0" dur="3.2s" repeatCount="indefinite" />
      {[0, 1, 2].map(j => (
        <circle key={j} cx={x - 10 - j * 9} cy={y + 8 + j * 7} r={2.4 - j * 0.6} fill="#FFD166">
          <animate attributeName="opacity" values="0;1;0" dur="1.2s" begin={j * 0.2 + 's'} repeatCount="indefinite" />
        </circle>
      ))}
      <circle cx={x} cy={y} r={16} fill="#FFD166" opacity={0.22}>
        <animate attributeName="r" values="12;20;12" dur="1.6s" repeatCount="indefinite" />
      </circle>
      <ellipse cx={x - 7} cy={y - 6} rx={6} ry={10} fill="#BDE6FF" opacity={0.75} transform={`rotate(-35 ${x - 7} ${y - 6})`}>
        <animate attributeName="ry" values="10;3;10" dur="0.28s" repeatCount="indefinite" />
      </ellipse>
      <ellipse cx={x + 7} cy={y - 6} rx={6} ry={10} fill="#BDE6FF" opacity={0.75} transform={`rotate(35 ${x + 7} ${y - 6})`}>
        <animate attributeName="ry" values="10;3;10" dur="0.28s" repeatCount="indefinite" />
      </ellipse>
      <circle cx={x} cy={y} r={6} fill="#FFF8DC" />
    </g>
  );
}
