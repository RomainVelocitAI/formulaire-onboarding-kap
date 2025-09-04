# Configuration Vercel

## Déploiement automatique depuis GitHub

Le code a été poussé sur GitHub : https://github.com/RomainVelocitAI/formulaire-onboarding-kap

### Étapes pour lier le projet à Vercel :

1. **Connectez-vous à Vercel** : https://vercel.com

2. **Importez le projet GitHub** :
   - Cliquez sur "New Project"
   - Sélectionnez "Import Git Repository"
   - Choisissez le repository "formulaire-onboarding-kap"

3. **Configurez les variables d'environnement** :
   Dans les settings du projet Vercel, ajoutez :
   
   - **Nom** : `AIRTABLE_API_KEY`
   - **Valeur** : Votre clé API Airtable (depuis Airtable Account > API)
   - **Environnements** : Production, Preview, Development

4. **Déployez** :
   - Cliquez sur "Deploy"
   - Vercel va automatiquement déployer l'application

## Variables d'environnement requises

| Variable | Description | Où la trouver |
|----------|------------|---------------|
| `AIRTABLE_API_KEY` | Clé API pour accéder à Airtable | Airtable > Account > API > Personal Access Token |

## IDs Airtable (déjà configurés dans le code)

- **Base ID** : `appKQYNANKrIVddKY` (votre base Kapnumerique)
- **Table ID** : `tblNK7R0o11hfHkCP` (table Onboarding_Clients créée)

## URL du projet

Une fois déployé, votre formulaire sera accessible à :
- `https://formulaire-onboarding-kap.vercel.app`

## Test local

Pour tester en local :
```bash
npm install
vercel dev
```

Le projet utilisera automatiquement les variables d'environnement configurées sur Vercel.