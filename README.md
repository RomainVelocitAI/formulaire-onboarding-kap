# Formulaire d'Onboarding Kap Numérique

Formulaire complet d'onboarding pour collecter tous les éléments nécessaires à la création d'un site web après signature du devis.

## 🚀 Fonctionnalités
- ✅ Upload de fichiers multiples (logo, photos, vidéos, documents)
- ✅ Color picker intégré pour la charte graphique
- ✅ Barre de progression dynamique
- ✅ Drag & drop pour les fichiers
- ✅ Validation et aperçu des fichiers
- ✅ Sections organisées par thème
- ✅ Conversion base64 pour Airtable

## 📋 Structure de la base Airtable

### Table `Onboarding_Clients`
- **Identité** : Logo, couleurs (principale, secondaire, complémentaires), typographies
- **Contenu** : Description entreprise, services/produits, valeurs, témoignages, FAQ
- **Médias** : Photos équipe, produits, locaux, vidéos
- **Informations** : Adresse, horaires, réseaux sociaux
- **Technique** : Nom de domaine, accès existants, sites références
- **Légal** : Mentions légales, CGV/CGU, documents commerciaux
- **Tracking** : Date de soumission, statut onboarding

## 📚 Utilisation

### Workflow recommandé
1. **Signature** → Le client signe le devis/contrat
2. **Client** → Remplit le formulaire d'onboarding avec tous les éléments
3. **Vous** → Recevez tout dans la table `Onboarding_Clients` sur Airtable
4. **Création** → Vous avez tout pour créer le site sans revenir vers le client

### URL du formulaire
- `votresite.vercel.app/` ou `votresite.vercel.app/index.html`

## 🛠️ Installation

### 1. Cloner le projet
```bash
git clone [votre-repo]
cd formulaire-kap-numerique
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configuration Airtable

#### Pour le développement local :
1. Créez un fichier `.env.local` à partir de `.env.example`
2. Ajoutez votre clé API Airtable :
```
AIRTABLE_API_KEY=votre_cle_api_airtable
```

#### Pour obtenir votre clé API Airtable :
1. Connectez-vous à [Airtable](https://airtable.com)
2. Allez dans Account > API
3. Générez ou copiez votre Personal Access Token

### 4. Lancer en développement
```bash
npm run dev
```
Le site sera disponible sur `http://localhost:3000`

## 📦 Déploiement sur Vercel

### 1. Installer Vercel CLI (si pas déjà fait)
```bash
npm i -g vercel
```

### 2. Se connecter à Vercel
```bash
vercel login
```

### 3. Déployer
```bash
vercel
```
Suivez les instructions pour lier à votre compte Vercel.

### 4. Configurer les variables d'environnement sur Vercel

1. Allez dans votre [Dashboard Vercel](https://vercel.com/dashboard)
2. Sélectionnez votre projet
3. Allez dans Settings > Environment Variables
4. Ajoutez :
   - `AIRTABLE_API_KEY` : Votre clé API Airtable
   - `AIRTABLE_BASE_ID` : appKQYNANKrIVddKY (déjà configuré)

### 5. Déployer en production
```bash
npm run deploy
```

## 🔒 Sécurité

- Les clés API ne sont jamais exposées côté client
- Toutes les requêtes Airtable passent par l'API Vercel
- Validation des données côté serveur
- Headers de sécurité configurés
- Protection CORS

## 📝 Personnalisation

### Modifier les champs du formulaire
1. Éditez `index.html` pour ajouter/supprimer des champs
2. Mettez à jour `script.js` dans la fonction `formatDataForAirtable()`
3. Ajoutez les champs correspondants dans Airtable
4. Mettez à jour `api/submit-form.js` pour la validation

### Modifier le style
- Éditez `styles.css` pour personnaliser l'apparence
- Les couleurs principales sont dans les variables CSS en haut du fichier

## ⚠️ Limitations importantes

### Taille des fichiers
- **Maximum par fichier** : 10MB (100MB pour vidéos)
- **Maximum total par soumission** : 10MB pour Airtable
- **Recommandation** : Compresser les images avant upload
- **Alternative pour gros fichiers** : Utiliser des liens externes (YouTube, Vimeo, Google Drive)

### Types de fichiers acceptés
- **Images** : JPG, PNG, SVG
- **Vidéos** : MP4, MOV, AVI
- **Documents** : PDF, DOC, DOCX

## 🐛 Dépannage

### Erreur "Configuration Airtable manquante"
- Vérifiez que vous avez bien créé le fichier `.env.local` en local
- Vérifiez que les variables d'environnement sont configurées sur Vercel

### Erreur 401 "Unauthorized"
- Votre clé API Airtable est invalide ou expirée
- Générez une nouvelle clé dans votre compte Airtable

### Le formulaire ne s'envoie pas
- Vérifiez la console du navigateur pour les erreurs
- Vérifiez que tous les champs obligatoires sont remplis
- Vérifiez les logs dans le dashboard Vercel

## 📧 Support

Pour toute question ou problème, contactez l'équipe Kap Numérique.

## 📄 Licence

© 2024 Kap Numérique. Tous droits réservés.