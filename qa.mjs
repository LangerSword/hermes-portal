// QA for the Pilot page: overflow, WebGL, canvas, scroll scenes, stills.
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { chromium } = require("/home/lakshaya/pwtest/node_modules/playwright");

const URL = "http://127.0.0.1:8917/";
const OUT = "shots";

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
  });
  const errors = [];
  const results = {};

  async function open(width, height, tag) {
    const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    page.on("console", (m) => { if (m.type() === "error") errors.push(`${tag}: ${m.text()}`); });
    page.on("pageerror", (e) => errors.push(`${tag}: pageerror ${e.message}`));
    page.on("response", (r) => { if (r.status() >= 400) errors.push(`${tag}: HTTP ${r.status()} ${r.url()}`); });
    await page.goto(URL, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(2600);
    return { context, page };
  }

  // desktop pass
  {
    const { context, page } = await open(1440, 900, "desktop");
    const info = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth,
      scrollHeight: document.documentElement.scrollHeight,
      noWebgl: document.querySelector(".hero-visual").classList.contains("no-webgl"),
      core: (() => { const c = document.getElementById("core-canvas"); return { w: c.width, h: c.height }; })(),
      pretext: (() => {
        const c = document.getElementById("pretext-canvas");
        const d = c.getContext("2d").getImageData(0, 0, Math.min(c.width, 500), Math.min(c.height, 300)).data;
        let lit = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) lit++;
        return { w: c.width, h: c.height, lit };
      })(),
      noCanvas: document.getElementById("manifesto").classList.contains("no-canvas"),
    }));
    await page.screenshot({ path: `${OUT}/hero.png` });

    await page.evaluate(() => window.scrollTo(0, document.querySelector("#wall").offsetTop + 100));
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${OUT}/wall.png` });

    const loopST = await page.evaluate(() => {
      const t = [...ScrollTrigger.getAll()].find((x) => x.trigger?.id === "loop");
      return t ? { start: t.start, end: t.end } : null;
    });
    const loopTop = loopST ? loopST.start : await page.evaluate(() => document.querySelector("#loop").getBoundingClientRect().top + scrollY);
    await page.evaluate((y) => window.scrollTo(0, y + 200), loopTop);
    await page.waitForTimeout(900);
    const x1 = await page.evaluate(() => new DOMMatrix(getComputedStyle(document.querySelector(".loop-track")).transform).m41);
    await page.evaluate((y) => window.scrollTo(0, y + 1100), loopTop);
    await page.waitForTimeout(1000);
    const x2 = await page.evaluate(() => new DOMMatrix(getComputedStyle(document.querySelector(".loop-track")).transform).m41);
    await page.screenshot({ path: `${OUT}/loop.png` });

    await page.evaluate(() => window.scrollTo(0, document.querySelector("#backend").offsetTop + 80));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${OUT}/backend.png` });

    await page.evaluate(() => window.scrollTo(0, document.querySelector("#manifesto").offsetTop - 20));
    await page.waitForTimeout(1100);
    await page.screenshot({ path: `${OUT}/manifesto.png` });

    await page.evaluate(() => window.scrollTo(0, document.querySelector("#install").offsetTop + 40));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${OUT}/install.png` });

    results.desktop = { ...info, loopX: [Math.round(x1), Math.round(x2)], overflow: info.scrollWidth - info.innerWidth };
    await context.close();
  }

  // mobile pass
  {
    const { context, page } = await open(390, 844, "mobile");
    const info = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth,
      scrollHeight: document.documentElement.scrollHeight,
      noWebgl: document.querySelector(".hero-visual").classList.contains("no-webgl"),
    }));
    await page.screenshot({ path: `${OUT}/mobile.png` });
    await page.evaluate(() => window.scrollTo(0, document.querySelector("#install").offsetTop));
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${OUT}/mobile-install.png` });
    results.mobile = { ...info, overflow: info.scrollWidth - info.innerWidth };
    await context.close();
  }

  await browser.close();
  console.log(JSON.stringify({ results, errors }, null, 1));
})();
