# /// script
# requires-python = ">=3.11"
# dependencies = ["httpx", "numpy", "soundfile"]
# ///
"""Generate speech clips with OpenAI into work/raw/<variant>/<id>.wav.

A variant is a voice plus a tactic (the variant name is "<voice>" for the plain
tactic, "<voice>-<tactic>" otherwise). Existing clips are skipped, so re-running
only fills gaps.

Tactics:
  plain    TTS reads the bare text ("ka").
  carrier  TTS reads "Seuraava tavu on: ka." and the last spoken segment is cut out.
  punct    TTS reads the text as a short sentence ("Ka.").
  chat     gpt-audio (conversational audio model) is asked to say only the text.

  uv run tools/audio/generate.py --pilot --voices coral,sage
  uv run tools/audio/generate.py --ids open-ka,open-ty --voices marin --tactics carrier,chat
  uv run tools/audio/generate.py --ids-from ids.txt --voices marin --tactics carrier --attempt 2
"""
import argparse
import json
import os
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor
import base64
import io
from pathlib import Path

import httpx
import numpy as np
import soundfile as sf

HERE = Path(__file__).parent
WORK = HERE / "work"
MODEL = "gpt-4o-mini-tts"
RARE = set("BCFGQWXZÅ")  # letters whose syllables are left to device speech (--core)
CHAT_MODEL = "gpt-audio"
CARRIER = {"letter": "Seuraava kirjain on:", "word": "Seuraava sana on:"}
CARRIER_DEFAULT = "Seuraava tavu on:"

PILOT = [
    "letter-a", "letter-s", "letter-k", "letter-a_", "letter-r",
    "open-ka", "open-si", "open-mo_", "open-ty", "open-la_",
    "long-kaa", "long-sii", "long-tuu",
    "closed-kat", "closed-sun", "closed-mo_k",
    "word-kala", "word-nena_", "word-kyla_",
]

BASE = (
    "Language: Finnish, native Helsinki pronunciation. "
    "Voice: a warm, clear early-reading teacher speaking to a five-year-old. "
    "Pace: slow and distinct, but natural. "
    "Say exactly the given text once, nothing before or after it."
)
STYLE = {
    "letter": "The text is the Finnish name of a letter. Say it as one short word.",
    "open": "The text is a single Finnish syllable, not a word. Do not spell it letter by letter. Keep the vowel short.",
    "long": "The text is a single Finnish syllable with a long vowel. Do not spell it. Make the double vowel clearly long.",
    "closed": "The text is a single Finnish syllable, not a word. Do not spell it. Keep the vowel short and pronounce the final consonant clearly.",
    "word": "The text is a Finnish word. Say it naturally and clearly.",
}


def load_key():
    key = os.environ.get("OPENAI_API_KEY")
    env = HERE.parent.parent / ".env"
    if not key and env.exists():
        for line in env.read_text().splitlines():
            if line.startswith("OPENAI_API_KEY="):
                key = line.split("=", 1)[1].strip()
    if not key:
        sys.exit("OPENAI_API_KEY missing (set it in .env)")
    return key


def last_segment(wav: bytes, min_pause=0.15, db=-35):
    """Keep only the part after the last pause (the target in a carrier sentence)."""
    audio, sr = sf.read(io.BytesIO(wav), dtype="float32")
    hop = int(sr * 0.01)
    rms = np.array([np.sqrt((audio[i:i + hop] ** 2).mean() + 1e-12) for i in range(0, len(audio) - hop, hop)])
    loud = 20 * np.log10(rms / rms.max()) > db
    idx = np.nonzero(loud)[0]
    if not len(idx):
        return None
    # Walk back from the end to the start of the last loud run that follows a long enough pause.
    end, start, quiet = idx[-1], idx[-1], 0
    for i in range(idx[-1], -1, -1):
        if loud[i]:
            start, quiet = i, 0
        else:
            quiet += 1
            if quiet * 0.01 >= min_pause:
                break
    if start <= idx[0]:
        return None  # no pause found: the carrier wasn't separated
    pad = int(0.05 * sr)
    out = io.BytesIO()
    sf.write(out, audio[max(0, start * hop - pad):min(len(audio), (end + 1) * hop + pad)], sr, format="WAV")
    return out.getvalue()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--voices", default="coral")
    ap.add_argument("--pilot", action="store_true", help="only a small sample of cards")
    ap.add_argument("--ids", help="comma-separated card ids")
    ap.add_argument("--core", action="store_true", help="skip syllables that contain rare letters")
    ap.add_argument("--skip-reviewed", action="store_true", help="skip cards already decided in review.json")
    ap.add_argument("--tactics", default="plain")
    ap.add_argument("--attempt", type=int, default=1, help="extra independent take, stored as <variant><N>")
    ap.add_argument("--ids-from", help="file with comma-separated card ids")
    ap.add_argument("--force", action="store_true", help="regenerate existing clips")
    args = ap.parse_args()

    cards = json.loads((WORK / "cards.json").read_text())
    if args.pilot:
        cards = [c for c in cards if c["id"] in PILOT]
    if args.ids_from:
        args.ids = Path(args.ids_from).read_text().strip()
    if args.ids:
        wanted = set(args.ids.split(","))
        cards = [c for c in cards if c["id"] in wanted]
    if args.core:
        cards = [c for c in cards if c["type"] in ("letter", "word") or not RARE & set(c["text"])]
    if args.skip_reviewed and (HERE / "review.json").exists():
        decided = json.loads((HERE / "review.json").read_text())
        cards = [c for c in cards if c["id"] not in decided]

    client = httpx.Client(
        base_url="https://api.openai.com/v1",
        headers={"Authorization": f"Bearer {load_key()}"},
        timeout=180,
    )
    jobs = []
    for voice in args.voices.split(","):
        for tactic in args.tactics.split(","):
            variant = voice if tactic == "plain" else f"{voice}-{tactic}"
            if args.attempt > 1:
                variant += str(args.attempt)
            out = WORK / "raw" / variant
            out.mkdir(parents=True, exist_ok=True)
            for c in cards:
                path = out / f"{c['id']}.wav"
                if args.force or not path.exists():
                    jobs.append((voice, tactic, c, path))

    def request(voice, tactic, c):
        if tactic == "chat":
            return client.post("/chat/completions", json={
                "model": CHAT_MODEL,
                "modalities": ["text", "audio"],
                "audio": {"voice": voice, "format": "wav"},
                "messages": [
                    {"role": "system", "content": f"{BASE} {STYLE[c['type']]} You only ever speak the requested text, in Finnish."},
                    {"role": "user", "content": f'Sano ääneen tasan tämä, ei mitään muuta: "{c["say"]}"'},
                ],
            })
        text = c["say"]
        if tactic == "carrier":
            text = f"{CARRIER.get(c['type'], CARRIER_DEFAULT)} {text}."
        elif tactic == "punct":
            text = text.capitalize() + "."
        return client.post("/audio/speech", json={
            "model": MODEL,
            "voice": voice,
            "input": text,
            "instructions": f"{BASE} {STYLE[c['type']]}" + (" Pause briefly after the colon." if tactic == "carrier" else ""),
            "response_format": "wav",
        })

    def run(job):
        voice, tactic, c, path = job
        for attempt in range(3):
            try:
                r = request(voice, tactic, c)
            except httpx.TransportError as e:
                err = f"{path.parent.name}/{c['id']}: {type(e).__name__}"
                continue
            err = f"{path.parent.name}/{c['id']}: {r.status_code} {r.text[:200]}"
            if r.status_code == 200:
                wav = base64.b64decode(r.json()["choices"][0]["message"]["audio"]["data"]) if tactic == "chat" else r.content
                if tactic == "carrier":
                    path.with_suffix(".full.wav").write_bytes(wav)
                    wav = last_segment(wav)
                    if wav is None:
                        err = f"{path.parent.name}/{c['id']}: carrier not separated (see .full.wav)"
                        continue
                path.write_bytes(wav)
                return None
            if r.status_code not in (429, 500, 502, 503):
                break
            time.sleep(2 ** (attempt + 1))  # rate limited or server hiccup: back off
        return err

    print(f"generating {len(jobs)} clips for {len(cards)} cards", flush=True)
    done, lock = [0], threading.Lock()

    def tracked(job):
        result = run(job)
        with lock:
            done[0] += 1
            if done[0] % 100 == 0:
                print(f"  {done[0]}/{len(jobs)}", flush=True)
        return result

    with ThreadPoolExecutor(8) as pool:
        errors = [e for e in pool.map(tracked, jobs) if e]
    for e in errors:
        print(e)
    print(f"done, {len(errors)} errors")


if __name__ == "__main__":
    main()
