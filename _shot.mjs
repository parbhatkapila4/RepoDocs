import { chromium } from "playwright-core";

const url = process.argv[2];
const out = process.argv[3] || "shot";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});
await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
await page.waitForTimeout(2500);
const h = await page.evaluate(async () => {
  await new Promise((r) => {
    let y = 0;
    const t = setInterval(() => {
      y += 700;
      window.scrollTo(0, y);
      if (y > document.body.scrollHeight) {
        clearInterval(t);
        r();
      }
    }, 120);
  });
  window.scrollTo(0, 0);
  return document.body.scrollHeight;
});
await page.waitForTimeout(2000);
console.log("page height", h);
// sectioned screenshots
const vh = 900;
const n = Math.min(Math.ceil(h / vh), 14);
for (let i = 0; i < n; i++) {
  await page.evaluate((y) => window.scrollTo(0, y), i * vh);
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${out}-${String(i).padStart(2, "0")}.png` });
}
await browser.close();
console.log("done", n);
