# /// script
# requires-python = ">=3.11,<3.14"
# dependencies = ["torch", "transformers", "soundfile", "soxr", "numpy"]
# ///
"""Score generated clips against the expected Finnish pronunciation.

Writes work/scores.json and work/report.html (open it in a browser to listen).

  uv run tools/audio/check.py                 # every voice under work/raw/
  uv run tools/audio/check.py --only-flagged  # report lists only clips that need ears
"""
import argparse
import html
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from phonemes import SR, load, recognize, trim  # noqa: E402

WORK = Path(__file__).parent / "work"

# Recognizer output (espeak IPA) is mapped to coarse Finnish sound classes, so that
# harmless variation (k/kʰ/g, t/d, ɑ/a) doesn't count as an error.
CLASSES = {
    "K": "k kh kʰ ɡ g q", "T": "t th tʰ d ð tɕ", "P": "p ph pʰ b", "S": "s z ɕ ʃ", "M": "m",
    "N": "n ŋ ɲ", "L": "l ɫ", "R": "r ɾ ɹ", "V": "v ʋ w β", "H": "h x ɦ", "J": "j", "F": "f",
    "a": "ɑ ʌ ɒ", "ä": "æ a ɛ", "e": "e ɛ eɪ", "i": "i ɪ", "o": "o ɔ oʊ", "u": "u ʊ",
    "y": "y ʏ ʉ", "ö": "ø œ ɵ",
}
TO_CLASS = {sym: cls for cls, syms in CLASSES.items() for sym in syms.split()}
LETTER_CLASS = {"k": "K", "g": "K", "t": "T", "d": "T", "p": "P", "b": "P", "s": "S", "m": "M", "n": "N", "l": "L",
                "r": "R", "v": "V", "w": "V", "h": "H", "j": "J", "f": "F", "c": "S", "z": "T", "x": "K",
                "q": "K", "å": "o"}
VOWELS = set("aeiouyäö")


def expected(say: str):
    """Spelling → sound classes. Finnish is (almost) written as pronounced."""
    out = []
    for ch in say.lower():
        cls = ch if ch in VOWELS else LETTER_CLASS.get(ch)
        if cls and not (out and out[-1] == cls):  # double letters → one sound (length checked separately)
            out.append(cls)
    return out


def heard(phonemes):
    out = []
    for p in phonemes:
        p = re.sub(r"[0-9.ː]", "", p)
        cls = TO_CLASS.get(p)
        if cls and not (out and out[-1] == cls):
            out.append(cls)
    return out


def distance(a, b):
    """Edit distance; a/ä confusions count half (the recognizer often blurs them)."""
    d = [[i + j if not i * j else 0 for j in range(len(b) + 1)] for i in range(len(a) + 1)]
    for i in range(1, len(a) + 1):
        for j in range(1, len(b) + 1):
            sub = 0 if a[i - 1] == b[j - 1] else 0.5 if {a[i - 1], b[j - 1]} == {"a", "ä"} else 1
            d[i][j] = min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + sub)
    return d[-1][-1]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only-flagged", action="store_true")
    args = ap.parse_args()

    cards = {c["id"]: c for c in json.loads((WORK / "cards.json").read_text())}
    cache_path = WORK / "scores.json"
    cache = json.loads(cache_path.read_text()) if cache_path.exists() else {}
    rows = []
    for voice_dir in sorted((WORK / "raw").iterdir()):
        for f in sorted(voice_dir.glob("*.wav")):
            card = cards.get(f.stem)
            if not card:
                continue
            key = f"{voice_dir.name}/{f.stem}"
            mtime = f.stat().st_mtime
            r = cache.get(key)
            if not r or r["mtime"] != mtime:
                audio = trim(load(f))
                ph = recognize(audio)
                r = {"mtime": mtime, "phonemes": " ".join(ph), "duration": round(len(audio) / SR, 2)}
            exp, got = expected(card["say"]), heard(r["phonemes"].split())
            r["expected"], r["heard"] = " ".join(exp), " ".join(got)
            r["error"] = round(distance(exp, got) / max(len(exp), 1), 2)
            cache[key] = r
            rows.append({"voice": voice_dir.name, "card": card, **r})
    cache_path.write_text(json.dumps(cache, indent=1))

    # Duration outliers per voice and type: anything far over the median likely has extra words.
    for row in rows:
        peers = sorted(x["duration"] for x in rows if x["voice"] == row["voice"] and x["card"]["type"] == row["card"]["type"])
        median = peers[len(peers) // 2]
        row["long"] = row["duration"] > max(1.6 * median, median + 0.5)
        row["flag"] = row["error"] > 0.34 or row["long"] or not row["heard"]

    voices = sorted({r["voice"] for r in rows})
    print("voice   clips  flagged  mean-error")
    for v in voices:
        vr = [r for r in rows if r["voice"] == v]
        print(f"{v:7} {len(vr):5}  {sum(r['flag'] for r in vr):7}  {sum(r['error'] for r in vr) / len(vr):10.2f}")
    write_report(rows, voices, args.only_flagged)
    print(f"report: {WORK / 'report.html'}")


def write_report(rows, voices, only_flagged):
    by_card = {}
    for r in rows:
        by_card.setdefault(r["card"]["id"], {})[r["voice"]] = r
    out = []
    for cid, per_voice in by_card.items():
        if only_flagged and not any(r["flag"] for r in per_voice.values()):
            continue
        card = next(iter(per_voice.values()))["card"]
        cells = []
        for v in voices:
            r = per_voice.get(v)
            if not r:
                cells.append("<td></td>")
                continue
            cls = "flag" if r["flag"] else ""
            note = f"{html.escape(r['phonemes']) or '–'}<br><small>{r['duration']}s · err {r['error']}{' · long' if r['long'] else ''}</small>"
            cells.append(f'<td class="{cls}"><audio controls preload="none" src="raw/{v}/{cid}.wav"></audio><div>{note}</div></td>')
        out.append(f"<tr><th>{html.escape(card['text'])}<br><small>{card['type']} · “{html.escape(card['say'])}”</small></th>{''.join(cells)}</tr>")
    head = "".join(f"<th>{v}</th>" for v in voices)
    (WORK / "report.html").write_text(f"""<!doctype html><meta charset="utf-8"><title>TaitoPaja audio report</title>
<style>body{{font:14px system-ui;margin:16px}}table{{border-collapse:collapse}}td,th{{border:1px solid #ccc;padding:6px;vertical-align:top;text-align:left}}
th small,td small{{color:#666}}td.flag{{background:#ffe3e3}}audio{{width:180px;height:32px}}</style>
<h1>Audio report</h1><p>Red = flagged by the automatic check (wrong sounds, too long, or nothing recognized). Listen to judge.</p>
<table><tr><th>Card</th>{head}</tr>{''.join(out)}</table>""")


if __name__ == "__main__":
    main()
