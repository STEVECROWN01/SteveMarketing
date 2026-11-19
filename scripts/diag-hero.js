/** Expérience directe : pourquoi hero-desc ne se peint-il qu'à ~1300 ms ? */
const { chromium } = require("playwright");
const BASE = "http://127.0.0.1:3100";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.addInitScript(`
    window.__evts = [];
    try {
      var obs = new PerformanceObserver(function (l) {
        for (const e of l.getEntries()) {
          window.__evts.push({ t: Math.round(e.startTime), type: e.entryType === 'largest-contentful-paint' ? 'LCP:' + Math.round(e.size) + ':' + (e.element ? e.element.tagName + '.' + (typeof e.element.className === 'string' ? e.element.className.split(' ')[0] : '') : '?') : e.name });
        }
      });
      obs.observe({ type: 'largest-contentful-paint', buffered: true });
      obs.observe({ type: 'paint', buffered: true });
    } catch (e) {}
  `);

  await page.goto(`${BASE}/`, { waitUntil: "load", timeout: 20000 });

  const trace = [];
  for (let t = 0; t < 2400; t += 100) {
    const state = await page.evaluate(() => {
      const p = document.querySelector("p.hero-desc");
      const wrap = p ? p.parentElement : null;
      if (!wrap) return { absent: true };
      const cs = getComputedStyle(wrap);
      const h1 = document.querySelector("#hero h1");
      const h1word = h1 ? h1.querySelectorAll("span")[3] : null;
      return {
        pOpacity: cs.opacity,
        animName: cs.animationName,
        animDelay: cs.animationDelay,
        animDur: cs.animationDuration,
        playState: cs.animationPlayState,
        fontsStatus: document.fonts.status,
        fontsLoaded: document.fonts.size,
        h1wordOpacity: h1word ? getComputedStyle(h1word).animationName : null,
        wrapClass: wrap.className,
      };
    });
    trace.push({ t, ...state });
    if (t === 300 || t === 700 || t === 1500) {
      await page.screenshot({ path: `/tmp/hero-${t}.png` });
    }
    await page.waitForTimeout(t === 0 ? 100 : 100);
  }
  for (const s of trace.filter((x, i) => i < 8 || x.t >= 1100)) {
    console.log(JSON.stringify(s));
  }
  const evts = await page.evaluate(() => window.__evts);
  console.log("événements perf:", JSON.stringify(evts));
  await browser.close();
})();
