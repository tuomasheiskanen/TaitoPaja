# Idea: record letter sounds on the phone

Status: not started. Letters are currently spoken by their Finnish name ("äs", "koo")
via `soundOf()` in `src/modules/reading/data.ts`.

## Why

Finnish reading is taught with letter *sounds* ("sss", "mmm"), not names. The phone's
text-to-speech can't make bare consonant sounds: `"sss"` is read as "äs äs äs", `"k"` as "koo".
So the speech engine can only give letter names reliably.

## Idea

Let an adult record each sound once with the phone's microphone, and play the recording
instead of text-to-speech. Everything stays on the phone; no server needed.

- A small adult-only screen (e.g. long-press on the title, or a link at the bottom of the
  Kirjaimet screen) listing every letter with ● record / ▶ play / ✕ delete.
- Record with `getUserMedia` + `MediaRecorder` (works in Safari and Chrome; iOS Safari
  produces `audio/mp4`, Chrome `audio/webm`, so store the blob with its MIME type).
- Store the blobs in IndexedDB (localStorage is too small for audio and can't hold blobs).
- Trim silence at the start/end, or at least cap recording length to ~2 s with an
  auto-stop, so playback feels instant.
- Play with an `<audio>` element or decode into the existing `AudioContext` in
  `src/shared/sfx.ts`.

## How it plugs in

- `speakCard()` in `src/modules/reading/speak.ts`: for a letter card, play the recording
  if one exists, otherwise fall back to `say(soundOf(letter))` (the letter name).
- Could later extend to syllables, e.g. for word cards play recorded syllables in sequence
  (same shape as `sayParts()`), but text-to-speech handles syllables fine already.
- Could add a setting "Äänne / Kirjaimen nimi" if both are wanted.

## Caveats

- Microphone permission needs HTTPS (already required for the PWA).
- iOS may evict IndexedDB data for web apps that haven't been opened in weeks if storage
  is tight; call `navigator.storage.persist()` and consider an export/import of the
  recordings as a backup.
- Recordings are per device; each phone needs its own set (or a shared export file).
