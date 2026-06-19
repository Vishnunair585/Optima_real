import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  console.log('Navigating to login...');
  await page.goto('http://localhost:8080/login', { waitUntil: 'networkidle0' });

  console.log('Filling login form...');
  await page.type('input[placeholder="Username or E-mail"]', 'testuser2@example.com');
  await page.type('input[placeholder="Password"]', 'password123');

  console.log('Submitting...');
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForResponse(res => res.url().includes('_server') || res.url().includes('login'), { timeout: 10000 }).catch(() => null)
  ]);

  await new Promise(r => setTimeout(r, 2000));

  const errorText = await page.evaluate(() => {
    const errorBox = document.querySelector('.bg-red-50, .text-red-600, .bg-destructive\\/15, .text-destructive, [role="alert"]');
    return errorBox ? errorBox.textContent : null;
  });

  if (errorText) {
    console.error('UI ERROR FOUND:', errorText);
  } else {
    console.log('No UI error detected. Current URL:', page.url());
  }

  console.log('Testing logout...');
  await Promise.all([
    page.evaluate(() => {
      const logoutBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Sign out') || b.textContent.includes('Log out'));
      if (logoutBtn) logoutBtn.click();
    }),
    new Promise(r => setTimeout(r, 2000))
  ]);
  
  console.log('Logged out URL:', page.url());

  await browser.close();
})();
