import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));

  // Test 1: Homepage loads
  console.log('=== TEST 1: Homepage ===');
  await page.goto('http://localhost:8080/', { waitUntil: 'networkidle0', timeout: 15000 });
  console.log('Homepage loaded:', page.url());

  // Test 2: Signup flow
  console.log('\n=== TEST 2: Signup ===');
  const ts = Date.now();
  await page.goto('http://localhost:8080/signup', { waitUntil: 'networkidle0', timeout: 15000 });
  await page.type('input[placeholder="Username"]', `user_${ts}`);
  await page.type('input[placeholder="E-mail address"]', `u${ts}@t.com`);
  await page.type('input[placeholder="Password"]', 'password123');
  await page.type('input[placeholder="Confirm password"]', 'password123');
  
  await Promise.all([
    page.click('button[type="submit"]'),
    page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }).catch(() => null),
  ]);
  await new Promise(r => setTimeout(r, 2000));
  console.log('After signup URL:', page.url());

  // Test 3: Should land on onboarding (NOT verify-email)
  console.log('\n=== TEST 3: No verify-email wall ===');
  const url = page.url();
  if (url.includes('verify-email')) {
    console.log('FAIL: Still stuck on verify-email!');
  } else if (url.includes('onboarding')) {
    console.log('PASS: Went straight to onboarding!');
  } else if (url.includes('dashboard')) {
    console.log('PASS: Went to dashboard (already onboarded)');
  } else {
    console.log('URL:', url);
  }

  // Test 4: Compare page loads
  console.log('\n=== TEST 4: Compare page ===');
  await page.goto('http://localhost:8080/compare', { waitUntil: 'networkidle0', timeout: 15000 });
  const compareTitle = await page.evaluate(() => document.querySelector('h1')?.textContent);
  console.log('Compare page title:', compareTitle);

  // Check for errors
  console.log('\n=== Console Errors ===');
  const roleErrors = errors.filter(e => e.includes('role'));
  if (roleErrors.length > 0) {
    console.log('FAIL: Still has role errors:', roleErrors[0]);
  } else {
    console.log('PASS: No role-related errors!');
  }
  
  const sessionErrors = errors.filter(e => e.includes('Failed to get session'));
  if (sessionErrors.length > 0) {
    console.log('FAIL: Session errors:', sessionErrors[0]);
  } else {
    console.log('PASS: No session errors!');
  }

  console.log('\n=== ALL TESTS COMPLETE ===');
  await browser.close();
})();
