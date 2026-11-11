"""Generate the demo score: a 42s dark-ambient bed in the Nous blue palette.

Pure Python (no numpy): four chords, detuned sines, a sub, filtered air,
a soft pulse every 8s, a short stereo delay. 48 kHz / 16-bit.
"""

from __future__ import annotations

import math
import random
import struct
import wave
from pathlib import Path

SR = 48000
DUR = 45.0
N = int(SR * DUR)
random.seed(7)

CHORDS = [
    # Am
    [110.00, 130.81, 164.81, 220.00],
    # F
    [87.31, 110.00, 130.81, 174.61],
    # C
    [130.81, 164.81, 196.00, 261.63],
    # G
    [98.00, 123.47, 146.83, 196.00],
]
SEG = DUR / len(CHORDS)
ATTACK, RELEASE = 2.2, 2.6

left = [0.0] * N
right = [0.0] * N


def env(t_in_seg: float) -> float:
    a = min(1.0, t_in_seg / ATTACK)
    r = min(1.0, (SEG - t_in_seg) / RELEASE)
    return max(0.0, min(a, r)) ** 1.6


for i in range(N):
    t = i / SR
    seg = min(len(CHORDS) - 1, int(t / SEG))
    local = t - seg * SEG
    e = env(local)
    if e <= 0:
        continue
    chord = CHORDS[seg]
    root = chord[0] / 2
    # pad: each note gets two detuned sines, panned
    for n, f in enumerate(chord):
        vib = 1.0 + 0.0016 * math.sin(2 * math.pi * (0.07 + n * 0.013) * t)
        v = (math.sin(2 * math.pi * f * vib * t) + 0.7 * math.sin(2 * math.pi * f * 1.0025 * t + n)) * 0.028
        pan = 0.32 + 0.12 * n
        left[i] += v * (1 - pan) * e
        right[i] += v * pan * e
    # sub
    sub = math.sin(2 * math.pi * root * t) * 0.07 * e
    left[i] += sub
    right[i] += sub
    # air
    if i % 2 == 0:
        noise = (random.random() * 2 - 1) * 0.012 * e
        left[i] += noise
        right[i] += noise * 0.8
    # pulse every 8s: a soft fifth above the root, decaying
    pulse_t = t % 8.0
    if pulse_t < 2.4 and e > 0.2:
        decay = math.exp(-pulse_t * 2.6)
        bell = math.sin(2 * math.pi * root * 3 * t) * 0.05 * decay * e
        left[i] += bell * 0.7
        right[i] += bell

# simple stereo delay for width
dL, dR = int(0.19 * SR), int(0.23 * SR)
for i in range(N - 1, max(dL, dR), -1):
    left[i] += 0.22 * right[i - dL]
    right[i] += 0.22 * left[i - dR]

# fade in/out and peak normalize
peak = max(1e-9, max(max(abs(v) for v in left), max(abs(v) for v in right)))
gain = 0.72 / peak
fade_in, fade_out = int(2.0 * SR), int(4.0 * SR)
for i in range(N):
    g = gain
    if i < fade_in:
        g *= i / fade_in
    if i > N - fade_out:
        g *= (N - i) / fade_out
    left[i] *= g
    right[i] *= g

out = Path("video/music.wav")
with wave.open(str(out), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    frames = bytearray()
    for i in range(N):
        frames += struct.pack("<hh", int(max(-1, min(1, left[i])) * 32767), int(max(-1, min(1, right[i])) * 32767))
    w.writeframes(bytes(frames))
print(out, out.stat().st_size // 1024, "KB", f"{DUR:.0f}s")
