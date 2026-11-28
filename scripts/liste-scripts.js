const { chromium } = require("playwright");
const URL = process.argv[2] || "http://127.0.0.1:3100/";
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const scripts = [];
  page.on("response", async (res) => {
    if (res.request().resourceType() === "script") {
      let octets = 0;
      try { octets = (await res.body()).length; } catch {}
      scripts.push({ url: res.url(), ko: Math.round(octets / 1024) });
    }
  });
  await page.goto(URL, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(15000);
  const total = scripts.reduce((s, x) => s + x.ko, 0);
  console.log(`${scripts.length} scripts, ${total} Ko :`);
  for (const s of scripts.sort((a, b) => b.ko - a.ko)) console.log(`  ${String(s.ko).padStart(5)} Ko  ${s.url.replace(/^https?:\/\/[^/]+/, "")}`);
  await browser.close();
})();
