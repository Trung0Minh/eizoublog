const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/write'); 
  // Wait for editor to load
  await page.waitForSelector('.prose-editor');
  
  // Type some text
  await page.type('.prose-editor', 'Hello World');
  await page.keyboard.press('Enter');
  
  // See what happens
  await page.screenshot({ path: 'editor-test-2.png' });
  await browser.close();
})();
