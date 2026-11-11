"""Edit the demo: intro/outro cards, chapter captions, score."""
from __future__ import annotations

import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent
V = ROOT / "video"
MARKS = json.loads((V / "marks.json").read_text())["marks"]
m = {x["name"]: x["t"] for x in MARKS}

RAW_CUT = 1.2          # video seconds skipped at the head (load)
XFADE_IN = 0.6
INTRO = 2.4
OUTRO = 4.0
RAW_DUR = 41.32 - RAW_CUT
PRE_OUTRO = INTRO + RAW_DUR - XFADE_IN
OUTRO_OFF = PRE_OUTRO - 0.8
TOTAL = PRE_OUTRO + OUTRO - 0.8

# caption windows: final seconds (raw mark - 1.15 + 0.6)
def f(name: str) -> float:
    return round(m[name] - 0.55, 2)

CAPS = [
    ("cap-wall", f("wall"), f("loop")),
    ("cap-loop", f("loop"), f("backend")),
    ("cap-backend", f("backend"), f("portal")),
    ("cap-portal", f("portal"), f("manifesto")),
    ("cap-manifesto", f("manifesto"), f("install")),
    ("cap-install", f("install"), f("end") - 0.4),
]

inputs = [
    ["-loop", "1", "-t", str(INTRO), "-i", str(V / "cards" / "intro.png")],
    ["-ss", str(RAW_CUT), "-i", str(V / "raw.webm")],
    ["-loop", "1", "-t", str(OUTRO), "-i", str(V / "cards" / "outro.png")],
    ["-i", str(V / "music.wav")],
]
for name, _a, _b in CAPS:
    inputs.append(["-loop", "1", "-t", str(TOTAL), "-i", str(V / "cards" / f"{name}.png")])

filters = [
    "[0:v]fps=30,scale=1600:900,setsar=1,format=yuv420p,settb=AVTB[a]",
    "[1:v]fps=30,scale=1600:900,setsar=1,format=yuv420p,settb=AVTB[b]",
    "[2:v]fps=30,scale=1600:900,setsar=1,format=yuv420p,settb=AVTB[c]",
    f"[a][b]xfade=transition=fade:duration={XFADE_IN}:offset={INTRO - XFADE_IN}[v1]",
    f"[v1][c]xfade=transition=fade:duration=0.8:offset={OUTRO_OFF}[v2]",
]
last = "v2"
for i, (name, start, end) in enumerate(CAPS, start=4):
    nxt = f"v{i}"
    filters.append(
        f"[{last}][{i}:v]overlay=0:0:enable='between(t,{start},{end})'[{nxt}]"
    )
    last = nxt
filters.append("[3:a]afade=t=in:st=0:d=1.6,afade=t=out:st=42.6:d=2.4,volume=0.85[aout]")

cmd = ["ffmpeg", "-y", "-loglevel", "error"]
for block in inputs:
    cmd += block
cmd += [
    "-filter_complex", ";".join(filters),
    "-map", f"[{last}]", "-map", "[aout]",
    "-t", f"{TOTAL:.2f}",
    "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart",
    str(V / "pilot-demo.mp4"),
]
print("total", round(TOTAL, 2), "pre-outro", round(PRE_OUTRO, 2), "caps", CAPS)
with open(V / "edit.log", "w") as log:
    proc = subprocess.run(cmd, stdout=log, stderr=subprocess.STDOUT)
if proc.returncode != 0:
    print((V / "edit.log").read_text()[-3000:])
    raise SystemExit(proc.returncode)
print("wrote", V / "pilot-demo.mp4")
