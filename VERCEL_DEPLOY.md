# Guide de déploiement sur Vercel

## Variables d'environnement requises

Dans les paramètres de votre projet Vercel (Settings → Environment Variables), configurez les variables d'environnement suivantes :

### DATABASE_URL
**Important** : SQLite ne fonctionne pas sur Vercel. Vous devez utiliser PostgreSQL.

Pour configurer PostgreSQL sur Vercel :
1. Allez dans votre projet Vercel
2. Onglet "Storage" → Créez une base de données PostgreSQL
3. Copiez la connection string et ajoutez-la comme variable d'environnement `DATABASE_URL`

Format : `postgresql://user:password@host:5432/database?schema=public`

### NODE_ENV
Définissez `NODE_ENV=production` pour la production.

### PUPPETEER_SKIP_CHROMIUM_DOWNLOAD (Optionnel mais recommandé)
Définissez `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true` pour éviter le téléchargement de Chromium pendant le build (réduit le temps de build).

**Note** : Sur Vercel, Puppeteer nécessitera Chromium au runtime. Vous devrez peut-être utiliser `@sparticuz/chromium` pour les fonctions serverless.

## Migration de la base de données

Après avoir configuré PostgreSQL, vous devez exécuter les migrations Prisma :

```bash
npx prisma migrate deploy
```

Ou configurez cette commande dans les "Build Settings" de Vercel.

## Notes importantes

### Puppeteer sur Vercel
L'application utilise Puppeteer pour le scraping. Sur Vercel, cela peut nécessiter :
- Une configuration spéciale avec `@sparticuz/chromium`
- Ou l'utilisation de fonctions serverless avec un timeout plus long (déjà configuré dans vercel.json)

### Build
Le script de build inclut automatiquement `prisma generate` pour générer le client Prisma.

## Commandes de déploiement

1. Installez Vercel CLI : `npm i -g vercel`
2. Connectez-vous : `vercel login`
3. Déployez : `vercel --prod`

Ou connectez votre repository GitHub à Vercel pour un déploiement automatique.
