const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/write'); // Assuming there is a write route or similar
  await page.screenshot({ path: 'editor-test.png' });
  await browser.close();
})();
