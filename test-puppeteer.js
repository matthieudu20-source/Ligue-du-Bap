const puppeteer = require('puppeteer');

async function test() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  const url = 'https://www.myffbad.fr/joueur/06835632';
  console.log('Navigating to:', url);
  
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  
  console.log('Waiting 10 seconds for content to load...');
  await page.waitForTimeout(10000);
  
  const content = await page.evaluate(() => {
    return {
      title: document.title,
      url: window.location.href,
      bodyText: document.body?.innerText || '',
      bodyTextLength: (document.body?.innerText || '').length,
      html: document.body?.innerHTML?.substring(0, 5000) || '',
    };
  });
  
  console.log('\n=== PAGE INFO ===');
  console.log('Title:', content.title);
  console.log('URL:', content.url);
  console.log('Body text length:', content.bodyTextLength);
  console.log('\n=== BODY TEXT (first 2000 chars) ===');
  console.log(content.bodyText.substring(0, 2000));
  
  // Chercher "simple" dans le texte
  const simpleMatches = content.bodyText.match(/simple[^]{0,100}/gi);
  if (simpleMatches) {
    console.log('\n=== SIMPLE MATCHES ===');
    console.log(simpleMatches.slice(0, 10));
  }
  
  // Chercher tous les nombres de 3-5 chiffres
  const numbers = content.bodyText.match(/\d{3,5}/g);
  if (numbers) {
    console.log('\n=== NUMBERS FOUND ===');
    console.log([...new Set(numbers)].slice(0, 20));
  }
  
  await browser.close();
}

test().catch(console.error);
