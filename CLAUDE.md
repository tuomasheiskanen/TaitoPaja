# TaitoPaja – notes for agents

A private learning PWA for the owner's kids (Finnish). No accounts, no backend:
everything runs and is stored on the phone. See README.md for deploy and install.

## Stack

Vite + React 19 + TypeScript, `vite-plugin-pwa` (Workbox `generateSW`, `autoUpdate`).
Fonts (Fredoka for UI, Andika for letters) are bundled via `@fontsource` so the app
works offline. Icons are generated from `public/favicon.svg` with `npm run icons`.

## Layout

- `src/App.tsx` – app shell (night-sky background, moon decoration). Renders the
  reading module directly; when a second skill is added, add a module menu here.
- `src/shared/` – reusable across modules: `speech.ts` (Finnish TTS, `say`, `sayParts`),
  `sfx.ts` (synthesized boing/cheer/chime/fanfare via Web Audio, no audio files; `unlockAudio`
  (called in `main.tsx`) restarts the shared AudioContext on every tap, resumes it after
  iOS interruptions and sets the iOS "playback" audio session so the silent switch doesn't mute it), `fx.ts` (confetti,
  star dust, wobble/pop/shake, flying star, halo, star burst, pop-in, fireworks via Web Animations API), `storage.ts`, `icons.tsx`.
- `src/modules/reading/` – letters/syllables/words module, played as a path of islands:
  - `data.ts` – letter sets, word lists, card types, card generation (`buildPool`),
    distractor options (`buildOptions`), `weighted` pick, `labelOf`, `soundOf`.
  - `levels.ts` – the level path (`LEVELS`: new letters and card types per island),
    level card pools, goal per level (`goalOf`).
  - `progress.ts` – persisted progress in localStorage key `taitopaja.path.v1`
    (`mode`, `stars`, per-card `misses` and `known`, per-level progress) and the
    advancement rules (`answer`, `nextCard`, daily limit). Migrates `mode` and
    `misses` from the old `taitopaja.reading.v1`.
  - `speak.ts` – plays a card's clips (or falls back to device speech).
  - `ReadingModule.tsx` – screen state (path / intro / quiz / settings / level done) and round state.
  - `Path.tsx`, `Intro.tsx`, `Quiz.tsx`, `LevelDone.tsx`, `Settings.tsx` – the screens.
    Settings (gear on the path) lets the parent choose the mode (parent shows / child picks),
    pick a starting level (`startFrom`:
    earlier levels marked done as "skipped", not counted toward the daily limit)
    or reset all progress (`resetProgress`); both need a second tap to confirm.
- `src/styles.css` – all styles; colors are CSS variables on `:root`. The app is a
  phone-width column (max 480px) using `100dvh` and safe-area insets.
- `docs/` – ideas not yet implemented.

UI text is Finnish; code and comments are English.

## Design and deliberate deviations

Source of truth for look and behaviour is the Claude Design file `TaitoPaja v2.dc.html`
in the TaitoPaja project (link in README). Differences from the design, all intentional:

- Level advancement (owner-approved, to keep a feeling of progress without boredom):
  goal = 2 × level's card count, clamped to 5–12; a level finishes only when the goal
  is reached with ≥ 70 % first-try corrects in the last 10 answers (the last goal dot
  waits for that, dots never go down). An early-finish "fast track" (5 in a row) was
  tried and removed: the owner found levels ending with dots still empty confusing; after two misses in a row an already known card comes up;
  ~30 % of cards review an earlier level; at most 5 new islands per day (the next
  one shows ☾ "huomenna"); stars only for first-try corrects.
- Every level that adds letters also has single-letter cards (the design skipped
  them for K, P V and D).
- Islands for diftongit, vaikeammat sanat, pitkät sanat and lauseet were added after
  the design's levels; the last island ("Mikä-Mikä-maa") never ends and counts known
  cards instead of a goal.
- The design's "unlock all" and level-goal tweak props are not exposed.
- A level starts by tapping its island (the design's start button and bottom bar were
  removed). The parent/child mode switch lives in Settings ("Pelitapa"), not on the
  path; the path only shows a "☾ Uusi saari aukeaa huomenna" note when the daily limit is hit. The intro screen adds
  a chime, confetti, spinning rays, cards that spin in and float, and star bursts on tap.
- Finishing the last regular island opens a finale (`Finale.tsx`, instead of the
  level-done overlay): fanfare, the fairy flies up, fireworks, and a "Lukutaituri"
  medal that then replaces the star at the top of the path (tap it to replay). Only
  earned by playing: levels skipped via a starting point don't count (`finishedOn`).

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
