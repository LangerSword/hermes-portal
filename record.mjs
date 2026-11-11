// Record the Pilot demo with chapter marks for the edit.
import { createRequire } from "module";
import fs from "fs";
const require = createRequire(import.meta.url);
const { chromium } = require("/home/lakshaya/pwtest/node_modules/playwright");

const URL = process.env.PILOT_URL || "http://127.0.0.1:8917/";
const OUT = "video";

const cursor = () => {
  const c = document.createElement("div");
  c.id = "demo-cursor";
  c.style.cssText =
    "position:fixed;z-index:999999;pointer-events:none;width:16px;height:16px;margin:-8px 0 0 -8px;" +
    "border-radius:50%;background:#f2f200;box-shadow:0 0 0 1px rgba(6,6,63,.6),0 0 24px rgba(242,242,0,.55);left:0;top:0";
  document.body.appendChild(c);
  addEventListener("mousemove", (e) => { c.style.left = e.clientX + "px"; c.style.top = e.clientY + "px"; });
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
  });
  const context = await browser.newContext({
    viewport: { width: 1600, height: 900 },
    deviceScaleFactor: 1,
    recordVideo: { dir: OUT, size: { width: 1600, height: 900 } },
  });
  const t0 = Date.now();
  const marks = [];
  const mark = (name) => marks.push({ name, t: +((Date.now() - t0) / 1000).toFixed(2) });

  const page = await context.newPage();
  await page.goto(URL, { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(cursor);
  await page.waitForTimeout(2200);
  mark("hero");

  const pause = (ms) => page.waitForTimeout(ms);
  const move = async (x, y, steps = 22) => { await page.mouse.move(x, y, { steps }); await pause(340); };
  const glide = async (to, ms = 900) => {
    const from = await page.evaluate(() => scrollY);
    const steps = Math.max(10, Math.round(ms / 33));
    for (let i = 1; i <= steps; i++) {
      await page.evaluate((v) => window.scrollTo(0, v), from + ((to - from) * i) / steps);
      await pause(Math.round(ms / steps));
    }
  };

  const targets = await page.evaluate(() => {
    const st = [...ScrollTrigger.getAll()];
    const byId = (id) => { const t = st.find((x) => x.trigger?.id === id); return t ? t.start : 0; };
    const off = (sel) => document.querySelector(sel).getBoundingClientRect().top + scrollY;
    return { wall: off("#wall"), loop: byId("loop"), backend: off("#backend"), portal: off("#portal"), manifesto: off("#manifesto"), install: off("#install") };
  });

  const copy = await page.locator("#copy-cmd").boundingBox();
  if (copy) {
    await move(copy.x + copy.width * 0.84, copy.y + copy.height / 2, 16);
    mark("copy");
    await page.mouse.click(copy.x + copy.width * 0.84, copy.y + copy.height / 2);
  }
  await pause(900);
  await glide(520, 700);
  await pause(450);

  mark("wall");
  await glide(targets.wall + 60, 800);
  await pause(1400);
  await move(430, 560, 18);
  await glide(targets.wall + 520, 700);
  await pause(600);

  mark("loop");
  await glide(targets.loop + 90, 850);
  await pause(1300);
  mark("loopRail");
  await glide(targets.loop + 1250, 1600);
  await pause(800);

  mark("backend");
  await glide(targets.backend - 140, 700);
  await glide(targets.backend + 40, 500);
  await pause(1500);
  await glide(targets.backend + 260, 1100);
  await pause(600);

  mark("portal");
  await glide(targets.portal + 60, 900);
  await pause(1900);
  await move(1180, 620, 18);
  await pause(700);

  mark("manifesto");
  await glide(targets.manifesto, 800);
  await pause(1200);
  const cb = await page.locator("#pretext-canvas").boundingBox();
  if (cb) {
    const ox = cb.x + cb.width * 0.7, oy = cb.y + cb.height * 0.5;
    await move(ox - 20, oy - 10, 20);
    mark("drag");
    await page.mouse.down();
    await pause(220);
    for (let i = 1; i <= 22; i++) {
      await page.mouse.move(ox - (ox - cb.x - 300) * (i / 22), oy + 40 * (i / 22));
      await pause(34);
    }
    await page.mouse.up();
  }
  await pause(1000);

  mark("install");
  await glide(targets.install + 80, 900);
  await pause(1500);
  await move(980, 640, 18);
  await pause(800);
  mark("end");

  await context.close();
  const video = page.video();
  if (video) {
    const src = await video.path();
    fs.copyFileSync(src, `${OUT}/raw.webm`);
  }
  fs.writeFileSync(`${OUT}/marks.json`, JSON.stringify({ marks, targets }, null, 1));
  console.log("saved", marks);
  await browser.close();
})();
