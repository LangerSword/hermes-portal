"""Render intro/outro cards and caption overlays at 1600×900."""
from __future__ import annotations

import base64
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "video" / "cards"
OUT.mkdir(parents=True, exist_ok=True)

NOISE = base64.b64encode(
    b"<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(#n)' opacity='.55'/></svg>"
).decode()

BASE = f"""
*{{box-sizing:border-box;margin:0}}
html,body{{width:1600px;height:900px;overflow:hidden;background:transparent}}
body{{font-family:'Rules Variable',sans-serif;color:#efeff1;-webkit-font-smoothing:antialiased}}
.mono{{font-family:'Aeonik Fono','JetBrains Mono',monospace}}
.disp{{font-family:'Rules Gothic Compressed','Rules Gothic Condensed',sans-serif;font-weight:600;text-transform:uppercase;line-height:.8;letter-spacing:-.01em}}
.y{{color:#f2f200}} .lav{{color:#dadaf6}}
.grain{{position:absolute;inset:0;background-image:url(data:image/svg+xml;base64,{NOISE});background-size:180px 180px;opacity:.06;mix-blend-mode:overlay}}
"""


def page(body: str, w: int = 1600, h: int = 900) -> str:
    return f"<!doctype html><html><head><meta charset='utf-8'><link rel='stylesheet' href='../assets/brand-fonts.css'><style>{BASE}</style></head><body>{body}<div class='grain'></div></body></html>"


def intro() -> str:
    return page(f"""
<div style="position:absolute;inset:0;background:#0d0df1"></div>
<div style="position:absolute;inset:0;background:radial-gradient(900px 600px at 78% 30%,rgba(218,218,246,.14),transparent 60%)"></div>
<div style="position:absolute;left:80px;top:74px" class="mono" style="font-size:10px;letter-spacing:.24em;color:rgba(218,218,246,.7)">A HERMES AGENT PLUGIN / LANGERSWORD</div>
<div style="position:absolute;left:72px;bottom:210px">
  <div class="disp" style="font-size:330px;color:#efeff1">PILOT</div>
  <div class="mono" style="font-size:20px;letter-spacing:.18em;color:#f2f200;margin-top:26px">A REAL TERMINAL FOR THE AGENT.</div>
</div>
<div style="position:absolute;left:80px;bottom:84px;right:80px;display:flex;justify-content:space-between;border-top:1px solid rgba(218,218,246,.3);padding-top:16px" class="mono">
  <span style="font-size:10px;letter-spacing:.2em;color:rgba(218,218,246,.6)">REAL TTY · TMUX · MIT</span>
  <span style="font-size:10px;letter-spacing:.2em;color:rgba(218,218,246,.6)">v0.2.0</span>
</div>""")


def outro() -> str:
    return page(f"""
<div style="position:absolute;inset:0;background:#06063f"></div>
<div style="position:absolute;inset:0;background:radial-gradient(800px 500px at 20% 20%,rgba(13,13,241,.35),transparent 60%)"></div>
<div style="position:absolute;left:80px;top:74px" class="mono" style="font-size:10px;letter-spacing:.24em;color:rgba(218,218,246,.6)">PUT IT ON YOUR MACHINE</div>
<div class="disp" style="position:absolute;left:72px;top:150px;font-size:150px;color:#efeff1">MAKE THE<br>TERMINAL<br><span class="y">REAL.</span></div>
<div style="position:absolute;left:80px;bottom:150px;right:80px;display:flex;justify-content:space-between;align-items:flex-end">
  <div class="mono" style="font-size:18px;line-height:2;color:#dadaf6">
    <div><span style="color:#f2f200">$</span> hermes plugins install pilot</div>
    <div><span style="color:#f2f200">$</span> hermes plugins enable pilot</div>
  </div>
  <div class="mono" style="text-align:right;font-size:11px;letter-spacing:.16em;color:rgba(218,218,246,.65);line-height:2">
    github.com/LangerSword/hermes-pilot<br>33 TESTS · NO API KEY · MIT
  </div>
</div>""")


def caption(num: str, label: str, text: str) -> str:
    return page(f"""
<div style="position:absolute;left:0;top:50%;transform:translateY(-50%);width:46px;background:rgba(6,6,63,.94);border-top:2px solid #f2f200;border-bottom:2px solid #f2f200;padding:18px 0;display:flex;align-items:center;justify-content:center">
  <div style="writing-mode:vertical-rl;transform:rotate(180deg);white-space:nowrap">
    <span class="mono" style="font-size:10px;letter-spacing:.22em;color:#f2f200">{num} / {label}</span>
    <span class="mono" style="font-size:10px;letter-spacing:.16em;color:rgba(218,218,246,.75);margin-right:14px">{text}</span>
  </div>
</div>""")


CARDS = {
    "intro": intro(),
    "outro": outro(),
    "cap-wall": caption("01", "THE WALL", "the pipe returns control codes"),
    "cap-loop": caption("02", "THE LOOP", "open · screen · type · wait"),
    "cap-backend": caption("03", "THE BACKEND", "terminal.backend: pilot"),
    "cap-portal": caption("04", "THE PORTAL", "models · credits · cloud"),
    "cap-manifesto": caption("05", "MANIFESTO", "measured around the core"),
    "cap-install": caption("06", "INSTALL", "hermes plugins install pilot"),
}


def main() -> int:
    for name, html in CARDS.items():
        src = OUT / f"{name}.html"
        src.write_text(html, encoding="utf-8")
        png = OUT / f"{name}.png"
        args = [
            "chromium", "--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars",
            "--force-device-scale-factor=1", "--virtual-time-budget=2000",
            f"--window-size=1600,900", f"--screenshot={png}", f"file://{src}",
        ]
        if name.startswith("cap-"):
            args.insert(6, "--default-background-color=00000000")
        subprocess.run(args, capture_output=True, timeout=120)
        print(png.name, png.stat().st_size // 1024, "KB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
