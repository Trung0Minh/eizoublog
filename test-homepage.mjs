import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    }
  });

  page.on('pageerror', error => {
    console.log('PAGE EXCEPTION:', error.message);
  });

  console.log('Navigating to http://localhost:3001/');
  await page.goto('http://localhost:3001/');
  
  await page.waitForTimeout(3000);
  console.log('Done waiting');
  
  // check if error boundary is visible
  const errorText = await page.locator('text="Lỗi"').count();
  console.log('Error Boundary count:', errorText);

  await browser.close();
}

main().catch(console.error);
