import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on("pageerror", err => {
    console.error("PAGE ERROR:", err);
  });
  
  page.on("console", msg => {
    if (msg.type() === "error") console.error("CONSOLE ERROR:", msg.text());
  });

  await page.goto("http://localhost:3000/test-editor");
  await page.waitForTimeout(2000);
  
  console.log("Clicking embed video button...");
  await page.click('button[title="Embed video"]');
  
  await page.waitForTimeout(1000);
  
  await browser.close();
})();
