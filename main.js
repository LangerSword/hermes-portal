// Pilot — Nous-styled launch page.
const nav = document.getElementById("nav");
const copyBtn = document.getElementById("copy-cmd");
const installCmd = document.getElementById("install-cmd");
const heroVisual = document.querySelector(".hero-visual");

addEventListener("scroll", () => nav.classList.toggle("is-stuck", scrollY > 20), { passive: true });

copyBtn?.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(installCmd.textContent.trim());
    const label = copyBtn.querySelector(".cmd-copy");
    label.textContent = "COPIED";
    setTimeout(() => (label.textContent = "COPY"), 1500);
  } catch {
    /* clipboard blocked; the command remains selectable */
  }
});

// ── three: the core ─────────────────────────────────────────────────────────
let heroProgress = 0;

async function core() {
  const canvas = document.getElementById("core-canvas");
  if (!canvas || !heroVisual) return;
  if (!(canvas.getContext("webgl2") || canvas.getContext("webgl"))) {
    heroVisual.classList.add("no-webgl");
    return;
  }
  let THREE;
  try {
    THREE = await import("./assets/three.module.js");
  } catch {
    heroVisual.classList.add("no-webgl");
    return;
  }

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camera.position.set(0, 0, 6.4);

  const group = new THREE.Group();
  scene.add(group);

  const wire = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.9, 1)),
    new THREE.LineBasicMaterial({ color: 0xdadaf6, transparent: true, opacity: 0.34 })
  );
  group.add(wire);

  const coreMesh = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.52, 1),
    new THREE.MeshBasicMaterial({ color: 0xf2f200 })
  );
  group.add(coreMesh);

  const cursor = new THREE.Mesh(
    new THREE.BoxGeometry(0.17, 1.25, 0.17),
    new THREE.MeshBasicMaterial({ color: 0xf2f200 })
  );
  cursor.position.set(1.05, 0.05, 0.4);
  group.add(cursor);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.55, 0.006, 8, 180),
    new THREE.MeshBasicMaterial({ color: 0x6effd6, transparent: true, opacity: 0.7 })
  );
  ring.rotation.x = Math.PI / 2.15;
  ring.rotation.z = 0.35;
  group.add(ring);

  const count = 220;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 2.2 + Math.random() * 1.2;
    const t = Math.random() * Math.PI * 2;
    const p = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(p) * Math.cos(t);
    positions[i * 3 + 1] = r * Math.cos(p);
    positions[i * 3 + 2] = r * Math.sin(p) * Math.sin(t);
  }
  const pgeo = new THREE.BufferGeometry();
  pgeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const points = new THREE.Points(
    pgeo,
    new THREE.PointsMaterial({ color: 0x6effd6, size: 0.022, transparent: true, opacity: 0.55 })
  );
  group.add(points);

  let targetX = 0, targetY = 0;
  addEventListener("pointermove", (e) => {
    targetX = (e.clientX / innerWidth - 0.5) * 0.5;
    targetY = (e.clientY / innerHeight - 0.5) * 0.35;
  }, { passive: true });

  function size() {
    const r = heroVisual.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / Math.max(1, r.height);
    camera.updateProjectionMatrix();
  }
  size();
  addEventListener("resize", size, { passive: true });

  const clock = new THREE.Clock();
  function frame() {
    const t = clock.getElapsedTime();
    group.rotation.y += 0.0022 + heroProgress * 0.012;
    group.rotation.x = 0.22 + heroProgress * 0.55 + Math.sin(t * 0.25) * 0.04;
    group.position.x += (targetX - group.position.x) * 0.05;
    group.position.y += (-targetY - group.position.y) * 0.05;
    camera.position.z = 6.4 - heroProgress * 1.5;
    points.rotation.y = t * 0.04;
    ring.rotation.z = 0.35 + t * 0.05;
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  frame();
}

// ── motion ──────────────────────────────────────────────────────────────────
function motion() {
  if (!window.gsap || !window.ScrollTrigger) return;
  const { gsap } = window;
  const ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);

  const lines = document.querySelectorAll(".hero-title .hl > span");
  gsap.set(lines, { yPercent: 112 });
  gsap.to(lines, { yPercent: 0, duration: 1.15, ease: "expo.out", stagger: 0.085, delay: 0.15 });
  gsap.from(".hero-lede, .hero-actions, .hero-meta, .eyebrow", { opacity: 0, y: 18, duration: 0.9, ease: "power2.out", delay: 0.55, stagger: 0.06 });

  // hero hold, then release
  gsap.timeline({
    scrollTrigger: {
      trigger: ".hero", start: "top top", end: "+=85%", pin: true, scrub: 1,
      onUpdate: (self) => { heroProgress = self.progress; },
    },
  })
    .to(".hero-copy", { y: -46, opacity: 0.35, ease: "none" }, 0)
    .to(".hero-visual", { scale: 0.9, y: -30, ease: "none" }, 0)
    .to(".hero-ticker", { opacity: 0.2, ease: "none" }, 0);

  // section headline reveals
  document.querySelectorAll(".reveal-lines").forEach((block) => {
    const spans = block.querySelectorAll(".rl > span");
    gsap.set(spans, { yPercent: 108 });
    gsap.to(spans, {
      yPercent: 0, duration: 1.1, ease: "expo.out", stagger: 0.08,
      scrollTrigger: { trigger: block, start: "top 82%", once: true },
    });
  });

  // wall evidence
  gsap.from(".evidence-card", {
    y: 90, opacity: 0, rotateX: 7, transformPerspective: 900, duration: 1.1, ease: "power3.out", stagger: 0.16,
    scrollTrigger: { trigger: ".evidence", start: "top 85%", once: true },
  });
  gsap.to(".evidence-card.pipe", { y: -28, scrollTrigger: { trigger: ".evidence", start: "top bottom", end: "bottom top", scrub: 1 } });
  gsap.to(".evidence-card.pilot", { y: 24, scrollTrigger: { trigger: ".evidence", start: "top bottom", end: "bottom top", scrub: 1 } });

  // horizontal loop rail
  const mm = gsap.matchMedia();
  mm.add("(min-width: 761px)", () => {
    const track = document.querySelector(".loop-track");
    if (!track) return;
    const distance = () => track.scrollWidth - innerWidth + 128;
    gsap.to(track, {
      x: () => -distance(), ease: "none",
      scrollTrigger: {
        trigger: ".loop", start: "top top", end: "+=230%", pin: true, scrub: 1,
        invalidateOnRefresh: true, anticipatePin: 1,
      },
    });
  });

  // backend terminal: reveal lines on scroll
  const termLines = document.querySelectorAll("#backend-term .tl");
  gsap.set(termLines, { opacity: 0.08 });
  gsap.to(termLines, {
    opacity: 1, stagger: 0.12, ease: "none",
    scrollTrigger: { trigger: "#backend-term", start: "top 72%", end: "bottom 60%", scrub: 1 },
  });
  gsap.from(".term-frame", { y: 70, opacity: 0, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: ".backend-visual", start: "top 85%", once: true } });

  // install card
  gsap.from(".install-card", { y: 50, opacity: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: ".install-card", start: "top 88%", once: true } });

  // portal product shot
  gsap.from(".portal-shell", { y: 80, opacity: 0, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger: ".portal-shell", start: "top 86%", once: true } });
  gsap.to(".ps-art img", { scale: 1.08, y: -24, ease: "none", scrollTrigger: { trigger: ".portal-shell", start: "top bottom", end: "bottom top", scrub: 1 } });

  addEventListener("load", () => ScrollTrigger.refresh());
}

// ── pretext manifesto: text measured around a draggable core ────────────────
const PROSE =
  "A pipe is a one-way street. A terminal is a conversation: you type, it answers, you look, you type again. " +
  "Pilot keeps that conversation alive — across calls, across tools, across machines — and hands you the keyboard " +
  "whenever you want it. The model reads the screen, not a stream of bytes. You can attach to the same pane and " +
  "take over mid-task. The agent stays the same size; the surface becomes a machine.";
const FONT = "26px 'EB Garamond'";
const LH = 38;
const PADX = 96;

async function manifesto() {
  const section = document.getElementById("manifesto");
  const stage = document.querySelector(".pretext-stage");
  const canvas = document.getElementById("pretext-canvas");
  let pretext;
  try {
    pretext = await import("./assets/pretext/layout.js");
  } catch {
    section.classList.add("no-canvas");
    return;
  }
  await document.fonts.load(FONT).catch(() => {});
  await document.fonts.ready;

  const ctx = canvas.getContext("2d");
  const prepared = pretext.prepareWithSegments(PROSE, FONT);
  const orb = { x: 0, y: 0, r: 98, drag: false, auto: true };
  let W = 0, H = 0, DPR = 1;

  function size() {
    const r = stage.getBoundingClientRect();
    DPR = Math.min(devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    if (!orb.x) orb.x = W * 0.7;
    if (!orb.y) orb.y = H * 0.5;
  }

  function geom(y) {
    const left = PADX, right = W - PADX;
    const dy = y - orb.y;
    const half = Math.abs(dy) < orb.r ? Math.sqrt(orb.r * orb.r - dy * dy) : 0;
    if (half > 0) {
      if (orb.x > W / 2) return { left, width: orb.x - half - 28 - left };
      const start = orb.x + half + 28;
      return { left: start, width: right - start };
    }
    return { left, width: right - left };
  }

  function draw(now) {
    ctx.clearRect(0, 0, W, H);
    if (orb.auto && !orb.drag) {
      orb.x = W * 0.7 + Math.sin(now / 4800) * 24;
      orb.y = H * 0.5 + Math.cos(now / 6200) * 16;
    }
    const aura = ctx.createRadialGradient(orb.x, orb.y, 6, orb.x, orb.y, orb.r * 2.6);
    aura.addColorStop(0, "rgba(242,242,0,.20)");
    aura.addColorStop(0.4, "rgba(110,255,214,.08)");
    aura.addColorStop(1, "rgba(110,255,214,0)");
    ctx.fillStyle = aura;
    ctx.beginPath(); ctx.arc(orb.x, orb.y, orb.r * 2.6, 0, Math.PI * 2); ctx.fill();

    const core = ctx.createRadialGradient(orb.x - orb.r * 0.3, orb.y - orb.r * 0.35, 4, orb.x, orb.y, orb.r);
    core.addColorStop(0, "#fffcd1");
    core.addColorStop(0.45, "#f2f200");
    core.addColorStop(1, "#b9b900");
    ctx.fillStyle = core;
    ctx.beginPath(); ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(218,218,246,.45)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(orb.x, orb.y, orb.r + 11, 0, Math.PI * 2); ctx.stroke();

    ctx.font = FONT;
    ctx.fillStyle = "#dadaf6";
    let cursor = { segmentIndex: 0, graphemeIndex: 0 };
    let y = Math.max(52, (H - 12 * LH) / 2);
    while (y < H - 36) {
      const row = geom(y);
      if (row.width < 140) { y += LH; continue; }
      const range = pretext.layoutNextLineRange(prepared, cursor, row.width);
      if (!range) break;
      const line = pretext.materializeLineRange(prepared, range);
      ctx.fillText(line.text, row.left, y);
      cursor = range.end;
      y += LH;
    }

    ctx.font = "10px 'Aeonik Fono', monospace";
    ctx.fillStyle = "rgba(218,218,246,.6)";
    ctx.fillText("CORE", orb.x - 16, orb.y + orb.r + 34);
    requestAnimationFrame(draw);
  }

  size();
  addEventListener("resize", size, { passive: true });
  const near = (x, y) => Math.hypot(x - orb.x, y - orb.y) < orb.r + 24;
  canvas.addEventListener("pointerdown", (e) => {
    const r = canvas.getBoundingClientRect();
    if (!near(e.clientX - r.left, e.clientY - r.top)) return;
    orb.drag = true; orb.auto = false;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!orb.drag) return;
    const r = canvas.getBoundingClientRect();
    orb.x = Math.max(PADX + orb.r, Math.min(W - PADX - orb.r, e.clientX - r.left));
    orb.y = Math.max(orb.r + 26, Math.min(H - orb.r - 30, e.clientY - r.top));
  });
  const stop = () => { orb.drag = false; };
  canvas.addEventListener("pointerup", stop);
  canvas.addEventListener("pointercancel", stop);

  requestAnimationFrame(draw);
}

// ── demo tour (?demo=1): auto-scroll for a clean screen recording ───────────
function demoTour() {
  if (!new URLSearchParams(location.search).has("demo")) return;
  if (!window.ScrollTrigger) return;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const glideTo = (to, ms) =>
    new Promise((resolve) => {
      const from = scrollY;
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - t0) / ms);
        scrollTo(0, from + (to - from) * ease(p));
        if (p < 1) requestAnimationFrame(tick);
        else resolve();
      };
      requestAnimationFrame(tick);
    });

  setTimeout(async () => {
    scrollTo(0, 0);
    await wait(500);
    const st = [...ScrollTrigger.getAll()];
    const startOf = (id) => (st.find((t) => t.trigger?.id === id)?.start ?? 0);
    const off = (sel) => document.querySelector(sel).getBoundingClientRect().top + scrollY;
    const steps = [
      { to: 0, hold: 2600 },
      { to: off("#wall") + 40, ms: 1400, hold: 3800 },
      { to: startOf("loop") + 80, ms: 1200, hold: 2200 },
      { to: startOf("loop") + 1200, ms: 3200, hold: 1800 },
      { to: off("#backend") + 40, ms: 1800, hold: 3600 },
      { to: off("#plates") + 40, ms: 1400, hold: 2400 },
      { to: off("#portal") + 40, ms: 1600, hold: 3600 },
      { to: off("#manifesto"), ms: 1400, hold: 3000 },
      { to: off("#install") + 40, ms: 1400, hold: 3400 },
    ];
    for (const s of steps) {
      if (s.ms) await glideTo(s.to, s.ms);
      await wait(s.hold);
    }
  }, 900);
}

const motionOK = !matchMedia("(prefers-reduced-motion: reduce)").matches;
const wideEnough = !matchMedia("(max-width: 760px)").matches;
if (motionOK && wideEnough) {
  if ("requestIdleCallback" in window) requestIdleCallback(core, { timeout: 1800 });
  else setTimeout(core, 900);
}
motion();
manifesto();
demoTour();
