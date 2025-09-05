// API Route pour uploader des fichiers vers GitHub
export default async function handler(req, res) {
    // Headers CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Méthode non autorisée' });
    }

    try {
        const { filename, content, folder } = req.body;

        if (!filename || !content) {
            return res.status(400).json({ message: 'Nom de fichier et contenu requis' });
        }

        // Configuration GitHub
        const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
        const GITHUB_OWNER = 'RomainVelocitAI';
        const GITHUB_REPO = 'formulaire-onboarding-kap';
        const GITHUB_BRANCH = 'master';

        if (!GITHUB_TOKEN) {
            console.error('GITHUB_TOKEN non configuré');
            return res.status(500).json({ message: 'Configuration GitHub manquante' });
        }

        // Créer un nom de fichier unique avec timestamp
        const timestamp = Date.now();
        const sanitizedFilename = filename.replace(/[^a-z0-9.-]/gi, '_');
        const uploadFolder = folder || 'uploads';
        const filePath = `${uploadFolder}/${timestamp}_${sanitizedFilename}`;

        // Retirer le préfixe data:image/...;base64, si présent
        const base64Data = content.replace(/^data:.*,/, '');

        // Créer le fichier sur GitHub via l'API
        const githubUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}`;
        
        const githubResponse = await fetch(githubUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: `Upload ${sanitizedFilename} via formulaire onboarding`,
                content: base64Data,
                branch: GITHUB_BRANCH
            })
        });

        if (!githubResponse.ok) {
            const error = await githubResponse.json();
            console.error('Erreur GitHub:', error);
            return res.status(githubResponse.status).json({ 
                message: 'Erreur lors de l\'upload vers GitHub',
                details: error.message 
            });
        }

        const githubData = await githubResponse.json();

        // Construire l'URL publique du fichier (raw GitHub)
        const publicUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${filePath}`;

        // Retourner l'URL publique
        return res.status(200).json({
            success: true,
            url: publicUrl,
            filename: sanitizedFilename,
            path: filePath,
            sha: githubData.content.sha
        });

    } catch (error) {
        console.error('Erreur serveur:', error);
        return res.status(500).json({ 
            message: 'Erreur serveur lors de l\'upload',
            error: error.message 
        });
    }
}