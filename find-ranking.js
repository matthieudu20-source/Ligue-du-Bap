const puppeteer = require('puppeteer');

async function findRanking() {
  console.log('🔍 Recherche du classement 2413 sur la page...\n');
  
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  const url = 'https://www.myffbad.fr/joueur/06835632';
  console.log('📍 URL:', url);
  
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  
  // Attendre que le contenu se charge
  for (let i = 0; i < 15; i++) {
    await page.waitForTimeout(2000);
    const text = await page.evaluate(() => document.body?.innerText || '');
    if (text.length > 1000) {
      console.log(`✅ Contenu chargé (${text.length} caractères) après ${(i+1)*2} secondes\n`);
      break;
    }
  }
  
  // Chercher où se trouve "2413"
  const result = await page.evaluate(() => {
    const bodyText = document.body?.innerText || '';
    const bodyHTML = document.body?.innerHTML || '';
    
    // Chercher "2413" dans le texte
    const textIndex = bodyText.indexOf('2413');
    const htmlIndex = bodyHTML.indexOf('2413');
    
    // Trouver le contexte autour de "2413"
    let textContext = '';
    let htmlContext = '';
    
    if (textIndex > -1) {
      textContext = bodyText.substring(Math.max(0, textIndex - 200), textIndex + 200);
    }
    
    if (htmlIndex > -1) {
      htmlContext = bodyHTML.substring(Math.max(0, htmlIndex - 500), htmlIndex + 500);
    }
    
    // Chercher tous les éléments qui contiennent "2413"
    const elementsWith2413 = [];
    const allElements = Array.from(document.querySelectorAll('*'));
    
    for (const el of allElements) {
      const text = el.textContent || '';
      const html = el.innerHTML || '';
      if (text.includes('2413') || html.includes('2413')) {
        elementsWith2413.push({
          tag: el.tagName,
          className: el.className,
          id: el.id,
          text: text.substring(0, 200),
          html: html.substring(0, 300),
        });
      }
    }
    
    // Chercher "Simple" ou "N3" près de "2413"
    const simpleNear2413 = [];
    const simpleIndex = bodyText.toLowerCase().indexOf('simple');
    if (simpleIndex > -1) {
      const simpleContext = bodyText.substring(Math.max(0, simpleIndex - 300), simpleIndex + 300);
      if (simpleContext.includes('2413')) {
        simpleNear2413.push(simpleContext);
      }
    }
    
    const n3Index = bodyText.indexOf('N3');
    if (n3Index > -1) {
      const n3Context = bodyText.substring(Math.max(0, n3Index - 300), n3Index + 300);
      if (n3Context.includes('2413')) {
        simpleNear2413.push(n3Context);
      }
    }
    
    return {
      textIndex,
      htmlIndex,
      textContext,
      htmlContext,
      elementsWith2413: elementsWith2413.slice(0, 10),
      simpleNear2413,
      bodyTextPreview: bodyText.substring(0, 5000),
      bodyHTMLPreview: bodyHTML.substring(0, 10000),
    };
  });
  
  console.log('📊 RÉSULTATS:\n');
  console.log('Position dans le texte:', result.textIndex > -1 ? `Trouvé à l'index ${result.textIndex}` : 'Non trouvé');
  console.log('Position dans le HTML:', result.htmlIndex > -1 ? `Trouvé à l'index ${result.htmlIndex}` : 'Non trouvé');
  
  if (result.textContext) {
    console.log('\n=== CONTEXTE TEXTE AUTOUR DE 2413 ===');
    console.log(result.textContext);
  }
  
  if (result.htmlContext) {
    console.log('\n=== CONTEXTE HTML AUTOUR DE 2413 ===');
    console.log(result.htmlContext);
  }
  
  if (result.simpleNear2413.length > 0) {
    console.log('\n=== "Simple" OU "N3" PRÈS DE 2413 ===');
    result.simpleNear2413.forEach((ctx, i) => {
      console.log(`\n--- Contexte ${i+1} ---`);
      console.log(ctx);
    });
  }
  
  if (result.elementsWith2413.length > 0) {
    console.log('\n=== ÉLÉMENTS CONTENANT 2413 ===');
    result.elementsWith2413.forEach((el, i) => {
      console.log(`\n--- Élément ${i+1} ---`);
      console.log('Tag:', el.tag);
      console.log('Class:', el.className);
      console.log('ID:', el.id);
      console.log('Texte:', el.text);
      console.log('HTML:', el.html.substring(0, 200));
    });
  }
  
  await browser.close();
}

findRanking().catch(console.error);
