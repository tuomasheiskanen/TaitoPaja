# /// script
# requires-python = ">=3.11"
# ///
"""Local review tool: listen to the voice variants of each card, pick the best one,
mark "none is good", or record your own version.

  uv run tools/audio/review.py      # opens http://localhost:8765
  uv run tools/audio/review.py --only open-ka,open-ty --variants marin-chat,coral-chat \
      --review tools/audio/work/experiment.json   # review a subset into a separate file

Choices are saved to tools/audio/review.json and own recordings to
tools/audio/manual/<id>.wav (both committed: they are hand work).
"""
import argparse
import json
import re
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

HERE = Path(__file__).parent
WORK = HERE / "work"
MANUAL = HERE / "manual"
REVIEW = HERE / "review.json"
PORT = 8765
ONLY: set[str] | None = None  # card ids to show (None = all)
VARIANTS: list[str] | None = None  # raw/<variant> folders to show (None = all)
ID = re.compile(r"^[a-z]+-[a-z_]+$")


def load_review():
    return json.loads(REVIEW.read_text()) if REVIEW.exists() else {}


def save_review(data):
    REVIEW.write_text(json.dumps(dict(sorted(data.items())), indent=1, ensure_ascii=False) + "\n")


class Handler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def send_json(self, obj, status=200):
        body = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path in ("/", "/index.html"):
            return self.send_file(HERE / "review.html", "text/html; charset=utf-8")
        if self.path == "/data":
            cards = json.loads((WORK / "cards.json").read_text())
            raw = WORK / "raw"
            voices = sorted(p.name for p in raw.iterdir() if p.is_dir()) if raw.exists() else []
            if VARIANTS:
                voices = [v for v in VARIANTS if v in voices]
            scores = json.loads((WORK / "scores.json").read_text()) if (WORK / "scores.json").exists() else {}
            out = []
            for c in cards:
                if ONLY and c["id"] not in ONLY:
                    continue
                have = [v for v in voices if (raw / v / f"{c['id']}.wav").exists()]
                manual = (MANUAL / f"{c['id']}.wav").exists()
                if have or manual:
                    c["voices"] = have
                    c["manual"] = manual
                    c["scores"] = {v: scores.get(f"{v}/{c['id']}") for v in have}
                    out.append(c)
            decided = {k: v for k, v in load_review().items() if "pick" in v}
            return self.send_json({"cards": out, "voices": voices, "review": decided})
        m = re.match(r"^/(raw/[a-z0-9-]+|manual)/([a-z_-]+)\.wav(\?.*)?$", self.path)
        if m:
            base = WORK / m.group(1) if m.group(1).startswith("raw") else MANUAL
            return self.send_file(base / f"{m.group(2)}.wav", "audio/wav")
        self.send_error(404)

    def send_file(self, path, ctype):
        if not path.exists():
            return self.send_error(404)
        data = path.read_bytes()
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):
        body = self.rfile.read(int(self.headers.get("Content-Length", 0)))
        if self.path == "/review":
            req = json.loads(body)
            if not ID.match(req.get("id", "")):
                return self.send_error(400)
            data = load_review()
            entry = data.get(req["id"], {})
            entry.pop("pick", None)
            if req.get("pick") is not None:
                entry["pick"] = req["pick"]
            if entry:
                data[req["id"]] = entry
            else:
                data.pop(req["id"], None)
            save_review(data)
            return self.send_json({"ok": True})
        m = re.match(r"^/manual/([a-z_-]+)$", self.path)
        if m and ID.match(m.group(1)) and body[:4] == b"RIFF":
            MANUAL.mkdir(exist_ok=True)
            (MANUAL / f"{m.group(1)}.wav").write_bytes(body)
            data = load_review()
            data[m.group(1)] = {**data.get(m.group(1), {}), "pick": "manual"}
            save_review(data)
            return self.send_json({"ok": True})
        self.send_error(400)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="comma-separated card ids")
    ap.add_argument("--variants", help="comma-separated raw/<variant> folders, in display order")
    ap.add_argument("--review", help="review file to read/write (default tools/audio/review.json)")
    args = ap.parse_args()
    ONLY = set(args.only.split(",")) if args.only else None
    VARIANTS = args.variants.split(",") if args.variants else None
    if args.review:
        REVIEW = Path(args.review)
    url = f"http://localhost:{PORT}/"
    print(f"Review tool at {url}  (Ctrl+C to stop)")
    webbrowser.open(url)
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
