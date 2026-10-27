# TaitoPaja – notes for agents

A private learning PWA for the owner's kids (Finnish). No accounts, no backend:
everything runs and is stored on the phone. See README.md for deploy and install.

## Stack

Vite + React 19 + TypeScript, `vite-plugin-pwa` (Workbox `generateSW`, `autoUpdate`).
Fonts (Fredoka for UI, Andika for letters) are bundled via `@fontsource` so the app
works offline. Icons are generated from `public/favicon.svg` with `npm run icons`.

## Layout

- `src/App.tsx` – app shell (night-sky background, moon/star decoration). Renders the
  reading module directly; when a second skill is added, add a module menu here.
- `src/shared/` – reusable across modules: `speech.ts` (Finnish TTS, `say`, `sayParts`),
  `sfx.ts` (synthesized boing/cheer via Web Audio, no audio files), `fx.ts` (confetti,
  star dust, wobble/pop animations via Web Animations API), `storage.ts`, `icons.tsx`.
- `src/modules/reading/` – letters/syllables/words module:
  - `data.ts` – letter sets, word list, card generation (`buildPool`), weighted
    card picking (`pickCard`), distractor options (`buildOptions`), `soundOf`.
  - `speak.ts` – plays a card's clips (or falls back to device speech).
  - `settings.ts` – persisted settings in localStorage key `taitopaja.reading.v1`
    (`mode`, `focus` letters, card `types`, per-card `misses`).
  - `ReadingModule.tsx` – screen state (picker / letters / quiz) and round state.
  - `Picker.tsx`, `Letters.tsx`, `Quiz.tsx` – the three screens.
- `src/styles.css` – all styles; colors are CSS variables on `:root`. The app is a
  phone-width column (max 480px) using `100dvh` and safe-area insets.
- `docs/` – ideas not yet implemented.

UI text is Finnish; code and comments are English.

## Design and deliberate deviations

Source of truth for look and behaviour is the Claude Design file `TaitoPaja.dc.html`
(link in README). Differences from the design, all intentional:

- Parent mode swipes record results: up = "osasi" (miss count −1), left =
  "harjoitellaan" (miss count +1), down = skip. The design only animated them.
  A hint line "↑ osasi · ← harjoitellaan · ↓ ohita" was added under the card.
- The design's unused feedback panel ("Tämä on KA", syllable breakdown) was dropped.
- Child mode does not speak the card again after a correct pick (owner's request).
- Single letters are spoken by their Finnish letter name ("äs", "koo"), not the sound.
  TTS can't produce bare consonant sounds ("sss" is read "äs äs äs").
  Recording real sounds is planned: see `docs/idea-recorded-sounds.md`.

## Audio clips

Card speech comes from pre-generated, human-reviewed MP3s in `public/audio/`
(listed in `src/modules/reading/clips.json`), falling back to the phone's
text-to-speech when a card has no clip. The pipeline that makes them (OpenAI
generation, local review tool, build) lives in `tools/audio/`; read
`tools/audio/README.md` before touching it.
- The design's fake phone frame and status bar were removed.

Card weighting: probability ∝ 1 + 2 × misses; the previous card is avoided.

## Checking changes

- `npx tsc -b` for types, `npm run build` for a full build (also regenerates the SW).
- There are no automated tests. To check the UI, run `npm run build && npx vite preview`
  and drive it in a headless browser at 390×844 (e.g. playwright-core with the
  installed Microsoft Edge as `executablePath`); check both modes and the console.
- Speech and sound can't be verified headlessly; ask the owner to try on a phone.

## Deploy

Pushing to `main` deploys to production on Vercel (https://taitopaja.sluiba.com).
Only commit and push when the owner asks. Commit messages end with a
`Co-Authored-By` trailer.
