# Configuration Vercel - Guide Complet

## ✅ Configuration Actuelle

Le projet est maintenant configuré pour fonctionner sur Vercel avec les optimisations suivantes :

### Fichiers de Configuration

1. **`next.config.js`** : Configuration Next.js optimisée
   - Ignore les erreurs TypeScript pendant le build
   - Exclut Puppeteer du bundling (chargé dynamiquement)
   
2. **`vercel.json`** : Configuration Vercel
   - Script de build : `npm run vercel-build`
   - Timeout de 30s pour les routes API
   - Région : CDG1 (Paris)

3. **`package.json`** : Scripts optimisés
   - `vercel-build` : Génère Prisma Client puis build Next.js
   - `postinstall` : Génère Prisma Client automatiquement

## 🔧 Variables d'Environnement Requises

Dans **Vercel Dashboard → Settings → Environment Variables**, ajoutez :

### Obligatoires

1. **`DATABASE_URL`**
   - ⚠️ **IMPORTANT** : SQLite ne fonctionne pas sur Vercel
   - Vous devez créer une base PostgreSQL sur Vercel
   - Format : `postgresql://user:password@host:5432/database?schema=public`
   - Comment créer :
     1. Vercel Dashboard → Storage → Create Database → PostgreSQL
     2. Copiez la connection string
     3. Ajoutez-la comme variable d'environnement `DATABASE_URL`

### Optionnelles (mais recommandées)

2. **`NODE_ENV`** = `production`
3. **`PUPPETEER_SKIP_CHROMIUM_DOWNLOAD`** = `true` (réduit le temps de build)

## 📦 Migration de la Base de Données

Après avoir configuré PostgreSQL, vous devez exécuter les migrations :

### Option 1 : Via Vercel CLI (recommandé)

```bash
# Connectez-vous à Vercel
vercel login

# Exécutez les migrations
vercel env pull .env.local
npx prisma migrate deploy
```

### Option 2 : Via Vercel Dashboard

1. Allez dans **Settings → Build & Development Settings**
2. Ajoutez dans **Build Command** : `npm run vercel-build && npx prisma migrate deploy`

### Option 3 : Via Script de Build

Modifiez `package.json` :
```json
"vercel-build": "prisma generate && npx prisma migrate deploy && next build"
```

## 🚀 Déploiement

### Méthode 1 : Via GitHub (Recommandé)

1. Poussez votre code sur GitHub
2. Allez sur [vercel.com](https://vercel.com)
3. **Add New Project** → Importez votre repository
4. Vercel détectera automatiquement Next.js
5. Configurez les variables d'environnement
6. Cliquez sur **Deploy**

### Méthode 2 : Via Vercel CLI

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Déployer
vercel --prod
```

## ⚠️ Notes Importantes

### Puppeteer sur Vercel

L'application utilise Puppeteer pour le scraping. Sur Vercel :

- **Problème** : Puppeteer nécessite Chromium qui est lourd
- **Solution actuelle** : Puppeteer est configuré pour être chargé dynamiquement
- **Si erreurs au runtime** : Vous devrez peut-être utiliser `@sparticuz/chromium` :

```bash
npm install @sparticuz/chromium
```

Puis modifier les fichiers qui utilisent Puppeteer pour utiliser Chromium de Vercel.

### Build Timeout

Les routes API ont un timeout de 30 secondes (configuré dans `vercel.json`). Si vous avez besoin de plus de temps, modifiez `maxDuration` dans `vercel.json`.

## 🔍 Vérification du Déploiement

Après le déploiement, vérifiez :

1. ✅ Le build passe sans erreur
2. ✅ Les pages statiques se chargent
3. ✅ Les routes API répondent
4. ✅ La connexion à la base de données fonctionne
5. ✅ L'authentification fonctionne

## 🐛 Dépannage

### Erreur : "Build Failed"

- Vérifiez que `DATABASE_URL` est configuré (même si vide, Prisma doit pouvoir générer le client)
- Vérifiez les logs de build dans Vercel Dashboard

### Erreur : "Cannot connect to database"

- Vérifiez que `DATABASE_URL` pointe vers PostgreSQL (pas SQLite)
- Vérifiez que les migrations ont été exécutées
- Vérifiez les permissions de la base de données

### Erreur : "Puppeteer failed"

- Puppeteer peut ne pas fonctionner sur Vercel sans configuration spéciale
- Considérez utiliser `@sparticuz/chromium` pour les fonctions serverless

## 📝 Checklist de Déploiement

- [ ] Variables d'environnement configurées (DATABASE_URL, NODE_ENV)
- [ ] Base de données PostgreSQL créée sur Vercel
- [ ] Migrations Prisma exécutées
- [ ] Build local fonctionne (`npm run build`)
- [ ] Code poussé sur GitHub (si méthode 1)
- [ ] Déploiement lancé sur Vercel
- [ ] Application testée après déploiement
