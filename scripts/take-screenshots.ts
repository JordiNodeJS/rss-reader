
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function run() {
  console.log('Launching browser...');
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  const screenshotsDir = path.join(process.cwd(), 'public', 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('Navigating to app...');
  try {
    await page.goto('http://localhost:3000', { timeout: 60000 });
  } catch (e) {
    console.error('Failed to load page. Is the server running?');
    process.exit(1);
  }
  
  await page.waitForLoadState('networkidle');

  // Initial screenshot (Empty State)
  console.log('Taking home-empty.png...');
  await page.screenshot({ path: path.join(screenshotsDir, 'home-empty.png') });

  // Add Feed
  console.log('Adding feed...');
  const addFeedBtn = page.getByRole('button', { name: 'Add Feed' }).first();
  if (await addFeedBtn.isVisible()) {
    await addFeedBtn.click();
    await page.waitForSelector('[role="dialog"]');
    
    // Select preset
    await page.click('text=Select a popular feed');
    await page.click('text=El Diario'); // Select one
    
    // Click Add in dialog
    await page.locator('[role="dialog"] button:has-text("Add Feed")').click();
    
    // Wait for feed to appear
    console.log('Waiting for feed to appear...');
    await page.waitForSelector('text=El Diario', { timeout: 30000 });
    
    // Wait for articles to load
    await page.waitForTimeout(5000);
  }

  // Screenshot Main View (Light)
  console.log('Taking home-populated-light.png...');
  await page.screenshot({ path: path.join(screenshotsDir, 'home-populated-light.png') });

  // Click "Read" on the first article
  console.log('Selecting an article...');
  const readBtn = page.getByRole('button', { name: 'Read' }).first();
  if (await readBtn.count() > 0) {
      await readBtn.click();
      await page.waitForTimeout(3000); // Wait for render
      console.log('Taking article-view-light.png...');
      await page.screenshot({ path: path.join(screenshotsDir, 'article-view-light.png') });
  } else {
      console.log('No "Read" button found.');
  }

  // Toggle Dark Mode
  console.log('Toggling dark mode...');
  // Try multiple selectors
  const themeBtn = page.locator('button').filter({ has: page.locator('.lucide-sun') }).first();
  
  if (await themeBtn.count() > 0) {
      await themeBtn.click();
      await page.waitForTimeout(1000);
      
      console.log('Taking article-view-dark.png...');
      await page.screenshot({ path: path.join(screenshotsDir, 'article-view-dark.png') });
      
      // Go back home
      await page.goto('http://localhost:3000');
      await page.waitForTimeout(3000);
      
      console.log('Taking home-populated-dark.png...');
      await page.screenshot({ path: path.join(screenshotsDir, 'home-populated-dark.png') });
  } else {
      console.log('Theme toggle button not found via selector.');
  }

  await browser.close();
  console.log('Done!');
}

run().catch(console.error);
