// Visual effects drawn with the Web Animations API.
export const reducedMotion = () => !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Glowing star confetti falling over the whole box. */
export function confetti(box: HTMLElement) {
  const cols = ['#FFD166', '#FFF3C4', '#FFFFFF', '#FFE08A', '#BDE6FF'];
  const W = box.clientWidth, H = box.clientHeight;
  const count = reducedMotion() ? 30 : 130;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div'), w = 3 + Math.random() * 5, c = cols[i % cols.length];
    p.style.cssText = `position:absolute;top:-20px;left:${Math.random() * W}px;width:${w}px;height:${w}px;background:${c};border-radius:50%;box-shadow:0 0 8px 2px ${c};`;
    box.appendChild(p);
    const drift = (Math.random() - 0.5) * 160;
    const a = p.animate([
      { transform: 'translate(0,0) scale(0.6)', opacity: 0 },
      { transform: `translate(${drift * 0.3}px,${H * 0.25}px) scale(1.2)`, opacity: 1, offset: 0.2 },
      { transform: `translate(${drift * 0.6}px,${H * 0.55}px) scale(0.7)`, opacity: 0.5, offset: 0.5 },
      { transform: `translate(${drift * 0.8}px,${H * 0.8}px) scale(1.1)`, opacity: 1, offset: 0.75 },
      { transform: `translate(${drift}px,${H + 40}px) scale(0.4)`, opacity: 0 }
    ], { duration: 1600 + Math.random() * 1400, delay: Math.random() * 400, easing: 'cubic-bezier(0.25,0.4,0.6,1)', fill: 'forwards' });
    a.onfinish = () => p.remove();
  }
}

/** Slowly falling star dust inside the box. Returns a stop function. */
export function startDust(box: HTMLElement) {
  if (reducedMotion()) return () => {};
  let raf = 0, last = 0;
  const loop = (now: number) => {
    raf = requestAnimationFrame(loop);
    if (now - last < 450) return;
    last = now;
    const W = box.clientWidth, H = box.clientHeight;
    const d = document.createElement('div'), s = 1.5 + Math.random() * 2;
    const c = Math.random() < 0.5 ? '#FFD166' : '#FFF3C4';
    const x = 12 + Math.random() * (W - 24), drift = (Math.random() - 0.5) * 40, fall = H * (0.25 + Math.random() * 0.3);
    d.style.cssText = `position:absolute;left:0;top:0;width:${s}px;height:${s}px;border-radius:50%;background:${c};box-shadow:0 0 4px 0 ${c};`;
    box.appendChild(d);
    const a = d.animate([
      { transform: `translate(${x}px,-6px)`, opacity: 0 },
      { transform: `translate(${x + drift * 0.3}px,${fall * 0.15}px)`, opacity: 0.55, offset: 0.15 },
      { transform: `translate(${x + drift * 0.7}px,${fall * 0.6}px)`, opacity: 0.3, offset: 0.6 },
      { transform: `translate(${x + drift}px,${fall}px) scale(0.4)`, opacity: 0 }
    ], { duration: 3500 + Math.random() * 2500, easing: 'linear', fill: 'forwards' });
    a.onfinish = () => d.remove();
  };
  raf = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(raf);
}

const WOBBLE: Keyframe[] = [
  { transform: 'none' },
  { transform: 'translateX(-14px) rotate(-6deg) scale(1.06,0.9)', offset: 0.15 },
  { transform: 'translateX(12px) rotate(5deg) scale(0.92,1.08)', offset: 0.3 },
  { transform: 'translateX(-8px) rotate(-3deg) scale(1.05,0.94)', offset: 0.45 },
  { transform: 'translateY(-18px) rotate(0deg) scale(1.02)', offset: 0.65 },
  { transform: 'translateY(4px) scale(1.04,0.96)', offset: 0.85 },
  { transform: 'none' }
];

export const wobble = (el: Element) => el.animate(WOBBLE, { duration: 1100, easing: 'ease-in-out' });

export const pop = (el: Element) =>
  el.animate(
    [{ transform: 'scale(1)' }, { transform: 'scale(1.08)', offset: 0.4 }, { transform: 'scale(0.97)', offset: 0.7 }, { transform: 'scale(1)' }],
    { duration: 600, easing: 'ease-out' }
  );
