# /// script
# requires-python = ">=3.11,<3.14"
# dependencies = ["numpy", "soundfile", "soxr", "lameenc"]
# ///
"""Turn review decisions into the app's audio files.

For every card in review.json with a chosen clip (a generated variant or an own
recording; or, failing that, the "previous" choice kept as fallback), trim silence, even out loudness, and encode a small mono MP3 to
public/audio/<id>.mp3. Writes the list of available clips to
src/modules/reading/clips.json and removes MP3s that are no longer chosen.

  uv run tools/audio/build.py
"""
import json
import sys
from pathlib import Path

import lameenc
import numpy as np

sys.path.insert(0, str(Path(__file__).parent))
from phonemes import load, trim  # noqa: E402

HERE = Path(__file__).parent
ROOT = HERE.parent.parent
OUT = ROOT / "public" / "audio"
MANIFEST = ROOT / "src" / "modules" / "reading" / "clips.json"
SR = 24000
TARGET_RMS_DB = -20  # speech loudness; peaks are capped at -1 dBFS


def source(card_id, pick):
    if pick == "manual":
        return HERE / "manual" / f"{card_id}.wav"
    return HERE / "work" / "raw" / pick / f"{card_id}.wav"


def process(path):
    audio = trim(load(path, SR), SR, db=-38, pad=0.04)
    # Loudness of the speech itself: RMS over 20 ms frames within 20 dB of the loudest.
    hop = int(0.02 * SR)
    frames = np.array([np.sqrt((audio[i:i + hop] ** 2).mean() + 1e-12) for i in range(0, len(audio) - hop + 1, hop)])
    rms = np.sqrt((frames[frames > frames.max() / 10] ** 2).mean())
    audio = audio * (10 ** (TARGET_RMS_DB / 20) / rms)
    peak = np.abs(audio).max()
    if peak > 0.89:
        audio = audio * (0.89 / peak)
    fade = int(0.01 * SR)
    audio[:fade] *= np.linspace(0, 1, fade)
    audio[-fade:] *= np.linspace(1, 0, fade)
    return audio


def encode(audio):
    enc = lameenc.Encoder()
    enc.set_bit_rate(48)
    enc.set_in_sample_rate(SR)
    enc.set_channels(1)
    enc.set_quality(2)
    pcm = (np.clip(audio, -1, 1) * 32767).astype("<i2").tobytes()
    return enc.encode(pcm) + enc.flush()


def main():
    review = json.loads((HERE / "review.json").read_text())
    OUT.mkdir(parents=True, exist_ok=True)
    built, missing = [], []
    for card_id, decision in sorted(review.items()):
        pick = decision.get("pick")
        if pick in (None, "none"):
            pick = decision.get("previous")  # earlier choice, kept as fallback
        if pick in (None, "none"):
            continue
        src = source(card_id, pick)
        if not src.exists():
            missing.append(f"{card_id} ({pick})")
            continue
        dst = OUT / f"{card_id}.mp3"
        if not dst.exists() or dst.stat().st_mtime < src.stat().st_mtime or dst.stat().st_mtime < (HERE / "review.json").stat().st_mtime:
            dst.write_bytes(encode(process(src)))
        built.append(card_id)
    for stale in OUT.glob("*.mp3"):
        if stale.stem not in built:
            stale.unlink()
    MANIFEST.write_text(json.dumps(built) + "\n")
    size = sum(f.stat().st_size for f in OUT.glob("*.mp3"))
    print(f"{len(built)} clips, {size / 1e6:.1f} MB in {OUT.relative_to(ROOT)}")
    for m in missing:
        print("missing source:", m)


if __name__ == "__main__":
    main()
