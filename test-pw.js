const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(`
    <style>
      .aspect-video { aspect-ratio: 16 / 9; width: 300px; background: #ccc; position: relative; }
      .absolute { position: absolute; }
      .inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
      .overflow-hidden { overflow: hidden; }
      .h-full { height: 100%; }
      .w-full { width: 100%; }
    </style>
    <div class="aspect-video">
      <div class="absolute inset-0 overflow-hidden">
        <img
          src="https://picsum.photos/1000/2000"
          class="h-full w-full"
          style="position: absolute; left: -100%; top: -100%; width: 20000%; height: 20000%; object-fit: fill; max-width: none; max-height: none;"
        />
      </div>
    </div>
  `);
  await page.screenshot({ path: 'test-pw.png' });
  await browser.close();
})();
