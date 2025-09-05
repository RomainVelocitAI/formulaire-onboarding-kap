# Configuration du GITHUB_TOKEN

Pour que l'upload des images vers GitHub fonctionne, vous devez configurer un GitHub Personal Access Token.

## Étapes :

### 1. Créer un Personal Access Token sur GitHub

1. Allez sur GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Cliquez sur "Generate new token (classic)"
3. Donnez un nom au token (ex: "Formulaire Onboarding Upload")
4. Sélectionnez les permissions suivantes :
   - `repo` (accès complet aux repositories)
   - Ou au minimum : `public_repo` si le repo est public
5. Cliquez sur "Generate token"
6. **IMPORTANT** : Copiez le token immédiatement (il ne sera plus visible après)

### 2. Ajouter le token sur Vercel

1. Allez sur le dashboard Vercel
2. Sélectionnez le projet "formulaire-onboarding-kap"
3. Allez dans Settings → Environment Variables
4. Ajoutez une nouvelle variable :
   - Name: `GITHUB_TOKEN`
   - Value: [Collez votre token GitHub]
   - Environment: Production, Preview, Development
5. Cliquez sur "Save"

### 3. Redéployer le projet

Après avoir ajouté la variable d'environnement, redéployez le projet pour que les changements prennent effet.

## Structure des uploads

Les fichiers seront uploadés dans le repository GitHub avec la structure suivante :
```
/uploads/
  /logos/       - Logos des entreprises
  /equipe/      - Photos de l'équipe
  /produits/    - Photos des produits/services
  /locaux/      - Photos des locaux
  /documents/   - Documents (CGV, docs commerciaux)
```

## Format dans Airtable

Les URLs des fichiers seront stockées dans Airtable au format :
```json
[
  {
    "url": "https://raw.githubusercontent.com/RomainVelocitAI/formulaire-onboarding-kap/master/uploads/...",
    "filename": "nom_du_fichier.jpg"
  }
]
```

Airtable téléchargera automatiquement les images depuis GitHub et les affichera dans l'interface.