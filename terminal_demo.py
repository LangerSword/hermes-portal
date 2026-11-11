"""A paced, screen-recordable Pilot demo. Drives real panes; prints real screens."""

from __future__ import annotations

import importlib.util
import json
import shutil
import sys
import time
from pathlib import Path

ROOT = Path("/home/lakshaya/projects/hermes-pilot")
spec = importlib.util.spec_from_file_location("hermes_pilot", ROOT / "__init__.py", submodule_search_locations=[str(ROOT)])
pkg = importlib.util.module_from_spec(spec)
sys.modules["hermes_pilot"] = pkg
spec.loader.exec_module(pkg)
from hermes_pilot import pilot_tmux as t  # noqa: E402

B = "\033[1m"; D = "\033[2m"; Y = "\033[38;5;226m"; C = "\033[38;5;51m"
G = "\033[38;5;121m"; R = "\033[0m"; CLR = "\033[2J\033[H"
T0 = time.time(); MARKS = []


def mark(name: str):
    MARKS.append({"name": name, "t": round(time.time() - T0, 2)})


def clear():
    print(CLR, end="", flush=True)


def head(kind: str, detail: str):
    print(f"{C}▶ pilot {kind}{R}  {B}{detail}{R}", flush=True)
    time.sleep(0.5)


def screen(name: str, lines: int = 30):
    print(f"{D}── screen {name} ─────────────────────────────────────────{R}")
    out = t.screen(name, lines=lines)
    print(out, flush=True)
    print(f"{D}─────────────────────────────────────────────────────────{R}\n", flush=True)


def type_text(name: str, text: str, delay: float = 0.045, enter: bool = False):
    for ch in text:
        t.send(name, text=ch, enter=False)
        time.sleep(delay)
    if enter:
        t.send(name, keys=["Enter"], enter=False)
        time.sleep(0.3)


def main() -> int:
    if not t.available():
        print("tmux required")
        return 1
    t.close_all()

    clear()
    mark("title")
    print(f"{Y}{B}PILOT{R}  {D}a real terminal for hermes agent{R}\n", flush=True)
    print(f"{D}private tmux · the screen read as text · keys as a tool{R}\n", flush=True)
    time.sleep(2.2)

    # 1 — stdin
    clear()
    mark("bash")
    head("open", "bash · a program that asks a question")
    t.open_session("printf 'Name? '; read n; echo \"hello $n, this is a real TTY\"", name="ask", wait_ms=700)
    screen("ask")
    head("type", '"Lakshaya"')
    type_text("ask", "Lakshaya", 0.05, enter=True)
    time.sleep(0.6)
    screen("ask")
    t.close("ask")
    time.sleep(0.8)

    # 2 — REPL
    clear()
    mark("repl")
    head("open", "python3 -q · state that survives the call")
    t.open_session("python3 -q", name="repl", wait_ms=900)
    head("type", "square = lambda n: n * n")
    type_text("repl", "square = lambda n: n * n", 0.03, enter=True)
    time.sleep(0.5)
    head("type", "square(12)")
    type_text("repl", "square(12)", 0.03, enter=True)
    time.sleep(0.7)
    screen("repl", 24)
    t.close("repl")
    time.sleep(0.8)

    # 3 — vim by keystrokes
    clear()
    mark("vim")
    path = "/tmp/pilot-film.txt"
    Path(path).unlink(missing_ok=True)
    head("open", "vim /tmp/pilot-film.txt")
    t.open_session(f"vim -Nu NONE -n {path}", name="vim", wait_ms=900)
    head("type", "i · the sentence · Esc · :wq")
    t.send("vim", keys=["i"], enter=False)
    time.sleep(0.4)
    type_text("vim", "written by an agent, one keystroke at a time", 0.035)
    time.sleep(0.6)
    screen("vim", 26)
    t.send("vim", keys=["Escape"], enter=False)
    time.sleep(0.3)
    type_text("vim", ":wq", 0.12, enter=True)
    time.sleep(1.0)
    head("verify", f"cat {path}")
    print(Path(path).read_text() if Path(path).exists() else "<missing>", flush=True)
    time.sleep(1.8)
    t.close("vim")
    time.sleep(0.8)

    # 4 — fzf
    clear()
    mark("fzf")
    head("open", "fzf · a full-screen picker")
    t.open_session("printf 'alpha\\nbeta\\ngamma\\ndelta\\n' | fzf --height 8", name="fzf", wait_ms=900)
    head("type", '"gam" · Enter')
    type_text("fzf", "gam", 0.12)
    time.sleep(0.6)
    t.send("fzf", keys=["Enter"], enter=False)
    time.sleep(0.7)
    screen("fzf", 20)
    t.close("fzf")
    time.sleep(0.8)

    # 5 — htop
    clear()
    mark("htop")
    head("open", "htop · read a curses dashboard")
    if shutil.which("htop"):
        t.open_session("htop", name="htop", cols=100, rows=30, wait_ms=1600)
        time.sleep(0.8)
        screen("htop", 30)
        t.send("htop", keys=["q"], enter=False)
        time.sleep(0.4)
        t.close("htop")
    else:
        print("htop not installed — skipped", flush=True)
    time.sleep(0.8)

    # footer
    clear()
    mark("footer")
    print(f"{Y}{B}PILOT{R}  {D}·{R}  {B}one pane. one tool. real keystrokes.{R}\n", flush=True)
    print(f"{D}33 tests · tmux 3.x · MIT · no api key{R}\n", flush=True)
    print(f"{G}github.com/LangerSword/hermes-pilot{R}", flush=True)
    time.sleep(3.0)
    t.close_all()
    Path("/home/lakshaya/projects/hermes-portal/video/term-marks.json").write_text(json.dumps(MARKS))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
