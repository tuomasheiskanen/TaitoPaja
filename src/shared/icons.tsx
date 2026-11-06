// Line icons (Lucide-style) used across the app.
type P = { size?: number };
const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

export const IconSpeaker = ({ size = 22 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden>
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </svg>
);

export const IconClose = ({ size = 22 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const IconBack = ({ size = 22 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden>
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

export const IconChevron = ({ size = 20 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export const IconCheck = ({ size = 16 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth={3} aria-hidden>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const IconSettings = ({ size = 22 }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const IconStar = ({ size = 16, fill = '#FFD166' }: P & { fill?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" fill={fill} />
  </svg>
);
