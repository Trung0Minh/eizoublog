const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/write'); 
  await page.waitForSelector('.prose-editor');
  
  // get the bounding boxes of a floated image and the following paragraph
  const result = await page.evaluate(() => {
    const editor = document.querySelector('.prose-editor');
    editor.innerHTML = `
      <div class="react-renderer node-customImage">
        <div data-node-view-wrapper="" class="relative group float-left mr-6 mb-4 mt-2 clear-left" style="width: 50%; max-width: 100%;">
          <figure class="relative flex flex-col items-center w-full !m-0" style="width: 100%; max-width: 100%;">
            <img src="test.jpg" style="height: 100px; width: 100px; display: block;" />
          </figure>
        </div>
      </div>
      <p id="test-p">This is a test paragraph that should wrap around the image if the float is working correctly. It needs to be long enough to wrap or at least sit next to the image. Let's make it sit next to it.</p>
    `;
    const img = editor.querySelector('img');
    const p = editor.querySelector('#test-p');
    return {
      imgRect: img.getBoundingClientRect(),
      pRect: p.getBoundingClientRect(),
      pTextTop: p.firstChild ? p.childNodes[0].parentElement.getBoundingClientRect().top : 0
    };
  });
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
})();
