# Audio pipeline

Pre-recorded speech for the reading cards, so the app doesn't depend on each
phone's built-in voice. Runs only on the developer's Mac; the app just gets
MP3s in `public/audio/` and their list in `src/modules/reading/clips.json`.

Needs `uv` (`brew install uv`), and `OPENAI_API_KEY` in `.env` at the repo root
(gitignored). The checker downloads a ~1.2 GB phoneme model on first use.

## Steps

```sh
node tools/audio/inventory.ts                       # 1. all cards → work/cards.json
uv run tools/audio/generate.py --core --skip-reviewed \
  --voices marin --tactics carrier,punct            # 2. generate variants → work/raw/<variant>/
uv run tools/audio/review.py                        # 3. listen and choose → review.json, manual/
uv run tools/audio/build.py                         # 4. chosen clips → public/audio/*.mp3 + clips.json
```

Then commit `review.json`, `manual/`, `public/audio/` and `clips.json`, and push to deploy.

## What we learned (Oct 2026 pilots)

- OpenAI `gpt-4o-mini-tts` with a bare syllable ("ka") is unreliable: ~25 % of cards had
  no acceptable clip in any of four voices (coral, marin, nova, sage).
- Best results: voice **marin** with the **carrier** tactic ("Seuraava tavu on: ka." and
  the last segment cut out), with the **punct** tactic ("Ka.") as backup. Together they
  covered 35/40 random cards. Words are reliable; Y and Ö syllables fail most.
- `gpt-audio` (`--tactics chat`) was not better than carrier.
- The phoneme checker (`check.py`) does **not** agree with human listening, so every
  clip is reviewed by ear. `check.py` / `report.html` remain for diagnostics only.

## Files

- `inventory.ts` – card list from the app's own `data.ts`; ids are ASCII (`ä → a_`, `ö → o_`, `å → aa_`).
- `generate.py` – OpenAI generation, tactics `plain | carrier | punct | chat`; skips existing clips.
- `review.py` + `review.html` – local review tool at http://localhost:8765 (play with 1–9,
  choose with Enter / "use this", 0 = none good, R = record own). `--only`, `--variants`
  and `--review` limit it to a subset or write to another file.
- `review.json` – decision per card: a variant name, `manual` (own recording) or `none`.
- `manual/` – own recordings (WAV). Committed: hand work.
- `build.py` – trims silence, evens loudness, encodes 48 kbps mono MP3.
- `work/` – generated and intermediate files (gitignored; regenerating costs money and
  gives different results, so don't delete it casually).

Syllables containing rare letters (B C F G Q W X Z Å) are skipped by `--core` and use the
phone's voice. Words play as syllable clips followed by the whole-word clip, and fall back
to the phone's voice unless all of those clips exist (`src/modules/reading/speak.ts`).
