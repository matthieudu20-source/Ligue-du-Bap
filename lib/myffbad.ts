/**
 * Utilitaires pour interagir avec myffbad.fr
 */

/**
 * Extrait le numéro de licence depuis l'URL d'un joueur myffbad.fr
 * 
 * @param playerUrl - URL complète du joueur (ex: https://www.myffbad.fr/joueur/00398522)
 * @returns Le numéro de licence ou null si non trouvé
 * 
 * @example
 * extractLicenseNumber("https://www.myffbad.fr/joueur/00398522") // "00398522"
 * extractLicenseNumber("https://www.myffbad.fr/joueur/123456") // "123456"
 */
export function extractLicenseNumber(playerUrl: string): string | null {
  // Pattern pour extraire le numéro de licence à la fin de l'URL
  const match = playerUrl.match(/\/joueur\/(\d+)(?:\/|$|\?)/);
  return match ? match[1] : null;
}

/**
 * Construit l'URL complète d'un joueur sur myffbad.fr à partir de son numéro de licence
 * 
 * @param licenseNumber - Numéro de licence du joueur
 * @returns URL complète du joueur
 * 
 * @example
 * buildPlayerUrl("00398522") // "https://www.myffbad.fr/joueur/00398522"
 */
export function buildPlayerUrl(licenseNumber: string): string {
  // Normaliser le numéro de licence : ajouter des zéros devant pour avoir 8 chiffres
  // Les numéros de licence FFBaD font généralement 8 chiffres
  const normalized = licenseNumber.padStart(8, '0');
  return `https://www.myffbad.fr/joueur/${normalized}`;
}

/**
 * Construit l'URL de recherche de joueurs sur myffbad.fr
 * 
 * @param params - Paramètres de recherche
 * @returns URL complète de recherche
 */
export function buildSearchUrl(params: {
  q?: string;
  nom?: string;
  prenom?: string;
  licence?: string;
}): string {
  const baseUrl = "https://www.myffbad.fr/recherche/joueur";
  const url = new URL(baseUrl);

  if (params.q) url.searchParams.append("q", params.q);
  if (params.nom) url.searchParams.append("nom", params.nom);
  if (params.prenom) url.searchParams.append("prenom", params.prenom);
  if (params.licence) url.searchParams.append("licence", params.licence);

  return url.toString();
}

/**
 * Interface pour les informations d'un joueur récupérées depuis myffbad.fr
 */
export interface PlayerInfo {
  licenseNumber: string;
  isValid: boolean;
  singleRankingPoints: number | null;
  name?: string;
  club?: string;
}

/**
 * Récupère les informations d'un joueur depuis myffbad.fr à partir de son numéro de licence
 * Utilise Puppeteer pour exécuter le JavaScript et récupérer le contenu rendu
 * 
 * @param licenseNumber - Numéro de licence du joueur
 * @returns Informations du joueur incluant le classement de simple
 */
export async function getPlayerInfo(licenseNumber: string): Promise<PlayerInfo> {
  const playerUrl = buildPlayerUrl(licenseNumber);

  try {
    // Utiliser Puppeteer pour charger la page React/SPA
    const puppeteer = await import("puppeteer");
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      
      // Définir un user agent pour éviter d'être bloqué
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );

      // Naviguer vers la page du joueur
      await page.goto(playerUrl, {
        waitUntil: "networkidle2",
        timeout: 30000,
      });

      // Attendre que le contenu React se charge
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Vérifier si la page contient une erreur
      const hasError = await page.evaluate(() => {
        const bodyText = document.body?.innerText?.toLowerCase() || "";
        const errorIndicators = [
          "joueur introuvable",
          "joueur non trouvé",
          "aucun joueur trouvé",
          "ce joueur n'existe pas",
          "404",
          "page introuvable",
        ];
        return errorIndicators.some(indicator => bodyText.includes(indicator));
      });

      if (hasError) {
        await browser.close();
        return {
          licenseNumber,
          isValid: false,
          singleRankingPoints: null,
        };
      }

      // Extraire le classement de simple depuis le DOM
      let singleRankingPoints: number | null = null;
      let name: string | undefined;

      // Extraire le classement directement depuis le DOM
      const rankingData = await page.evaluate(() => {
        const bodyText = document.body?.innerText || "";
        
        // Pattern pour trouver "Simple" suivi d'un nombre de points
        const simpleMatch = bodyText.match(/simple\s*\n\s*\n\s*(\d{3,5})\s*\n\s*\n\s*points/i);
        
        // Si pas trouvé, essayer d'autres patterns
        let foundRanking: number | null = null;
        
        if (simpleMatch && simpleMatch[1]) {
          foundRanking = parseInt(simpleMatch[1], 10);
        } else {
          // Chercher dans les éléments de la page
          const elements = Array.from(document.querySelectorAll('*'));
          for (const el of elements) {
            const text = el.textContent || "";
            if (text.toLowerCase().includes("simple")) {
              // Chercher un nombre dans cet élément
              const numberMatch = text.match(/simple[\s\n]+(\d{3,5})/i);
              if (numberMatch && numberMatch[1]) {
                const num = parseInt(numberMatch[1], 10);
                if (num > 100 && num < 100000) {
                  foundRanking = num;
                  break;
                }
              }
            }
          }
        }
        
        return {
          fromPattern: simpleMatch ? parseInt(simpleMatch[1], 10) : null,
          fromElements: foundRanking,
        };
      });

      // Utiliser le classement trouvé
      singleRankingPoints = rankingData.fromPattern || rankingData.fromElements;
      
      // Extraire le nom si possible
      try {
        const nameElement = await page.$('h1, h2, .player-name, [data-testid*="name"], [class*="name"]');
        if (nameElement) {
          name = await page.evaluate((el) => el.textContent?.trim() || undefined, nameElement);
        }
      } catch (e) {
        // Ignorer l'erreur d'extraction du nom
      }

      await browser.close();

      if (singleRankingPoints) {
        console.log(`✅ Classement Simple trouvé pour ${licenseNumber}: ${singleRankingPoints} points`);
      } else {
        console.log(`⚠️ Classement Simple non trouvé pour ${licenseNumber}`);
      }

      return {
        licenseNumber,
        isValid: true,
        singleRankingPoints,
        name,
      };
    } catch (pageError) {
      await browser.close();
      throw pageError;
    }
  } catch (error) {
    console.error(`Erreur lors de la récupération des infos du joueur ${licenseNumber}:`, error);
    
    // En cas d'erreur avec Puppeteer, on essaie une approche plus simple
    // On considère le joueur comme valide si l'URL répond (fallback)
    console.log(`⚠️ Fallback: tentative de vérification simple pour ${licenseNumber}`);
    
    try {
      const response = await fetch(playerUrl, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });
      
      // Si la page répond avec un 200, on considère le joueur comme valide
      // même si on ne peut pas extraire le classement
      if (response.ok) {
        console.log(`✅ Fallback: joueur ${licenseNumber} considéré comme valide (page répond)`);
        return {
          licenseNumber,
          isValid: true,
          singleRankingPoints: null, // On ne peut pas extraire sans Puppeteer
        };
      }
    } catch (fallbackError) {
      console.error(`Erreur fallback:`, fallbackError);
    }
    
    return {
      licenseNumber,
      isValid: false,
      singleRankingPoints: null,
    };
  }
}
