const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(`
    <style>
      .aspect-video { aspect-ratio: 16 / 9; width: 300px; background: #ccc; position: relative; }
      .relative { position: relative; }
      .h-full { height: 100%; }
      .w-full { width: 100%; }
      .overflow-hidden { overflow: hidden; }
    </style>
    <div class="aspect-video">
      <div class="relative h-full w-full overflow-hidden">
        <img
          src="https://picsum.photos/1000/2000"
          class="h-full w-full"
          style="position: absolute; left: 0%; top: -127.777%; width: 100%; height: 355.555%; object-fit: fill; max-width: none; max-height: none;"
        />
      </div>
    </div>
  `);
  await page.screenshot({ path: 'test-pw.png' });
  await browser.close();
})();
