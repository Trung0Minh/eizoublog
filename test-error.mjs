import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });
  
  page.on('console', msg => {
    console.log('CONSOLE:', msg.type(), msg.text());
  });

  await page.goto('http://127.0.0.1:3001', { waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);
  await browser.close();
})();
