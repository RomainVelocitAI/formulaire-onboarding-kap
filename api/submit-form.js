// API Route pour Vercel - Gestion du formulaire d'onboarding avec uploads
export default async function handler(req, res) {
    // Vérifier la méthode HTTP
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Méthode non autorisée' });
    }

    // Headers CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // Récupérer les variables d'environnement
        const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
        const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appKQYNANKrIVddKY';
        const AIRTABLE_TABLE_NAME = 'Onboarding_Clients';

        // Vérifier que la clé API est configurée
        if (!AIRTABLE_API_KEY) {
            console.error('AIRTABLE_API_KEY non configurée');
            return res.status(500).json({ 
                message: 'Configuration du serveur incomplète. Contactez l\'administrateur.' 
            });
        }

        // Valider les données reçues
        const data = req.body;
        if (!data || !data.fields) {
            return res.status(400).json({ 
                message: 'Données du formulaire invalides' 
            });
        }

        // Validation des champs obligatoires
        const requiredFields = [
            "Nom de l'entreprise",
            "Contact principal",
            "Email",
            "Téléphone",
            "Couleur principale",
            "Style visuel préféré",
            "Description entreprise",
            "Services/Produits",
            "Adresse complète",
            "Mentions légales"
        ];

        for (const field of requiredFields) {
            if (!data.fields[field]) {
                return res.status(400).json({ 
                    message: `Le champ "${field}" est obligatoire` 
                });
            }
        }

        // Validation de l'email
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(data.fields.Email)) {
            return res.status(400).json({ 
                message: 'Adresse email invalide' 
            });
        }

        // Validation des couleurs hexadécimales
        const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
        if (data.fields["Couleur principale"] && !hexColorRegex.test(data.fields["Couleur principale"])) {
            return res.status(400).json({ 
                message: 'Format de couleur principale invalide (utilisez #RRGGBB)' 
            });
        }

        // Nettoyer les champs undefined pour Airtable
        Object.keys(data.fields).forEach(key => {
            if (data.fields[key] === undefined || data.fields[key] === '') {
                delete data.fields[key];
            }
        });

        // Traiter les fichiers uploadés
        // Airtable accepte les fichiers en base64 dans le format:
        // [{url: "data:image/png;base64,...", filename: "file.png"}]
        // Mais la taille totale de la requête ne doit pas dépasser 10MB

        // Vérifier la taille totale de la requête
        const requestSize = JSON.stringify(data).length;
        if (requestSize > 10 * 1024 * 1024) { // 10MB
            return res.status(413).json({ 
                message: 'La taille totale des fichiers dépasse la limite de 10MB. Veuillez réduire le nombre ou la taille des fichiers.' 
            });
        }

        // Envoyer à Airtable
        const airtableResponse = await fetch(
            `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            }
        );

        // Gérer la réponse d'Airtable
        if (!airtableResponse.ok) {
            const errorData = await airtableResponse.json();
            console.error('Erreur Airtable:', errorData);
            
            // Parser l'erreur Airtable pour un message plus clair
            let errorMessage = 'Erreur lors de l\'enregistrement des données';
            
            if (errorData.error) {
                if (errorData.error.type === 'INVALID_REQUEST_BODY') {
                    errorMessage = 'Format de données invalide. Vérifiez que tous les fichiers sont correctement formatés.';
                } else if (errorData.error.type === 'INVALID_ATTACHMENT_OBJECT') {
                    errorMessage = 'Erreur avec les fichiers uploadés. Veuillez réessayer avec des fichiers plus petits.';
                } else if (errorData.error.type === 'AUTHENTICATION_REQUIRED') {
                    errorMessage = 'Erreur d\'authentification avec Airtable';
                } else if (errorData.error.message) {
                    errorMessage = errorData.error.message;
                }
            }
            
            return res.status(airtableResponse.status).json({ 
                message: errorMessage 
            });
        }

        const result = await airtableResponse.json();

        // Envoyer un email de notification (optionnel)
        await sendOnboardingNotification(data.fields);

        // Réponse de succès
        return res.status(200).json({ 
            success: true,
            message: 'Formulaire d\'onboarding envoyé avec succès',
            id: result.id
        });

    } catch (error) {
        console.error('Erreur serveur:', error);
        
        // Gérer les erreurs de taille de requête
        if (error.message && error.message.includes('payload too large')) {
            return res.status(413).json({ 
                message: 'Les fichiers sont trop volumineux. Veuillez réduire leur taille ou leur nombre.' 
            });
        }
        
        return res.status(500).json({ 
            message: 'Une erreur serveur s\'est produite. Veuillez réessayer plus tard.' 
        });
    }
}

// Fonction pour envoyer une notification email
async function sendOnboardingNotification(formData) {
    // Si vous utilisez un service d'email comme SendGrid
    /*
    try {
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        
        const msg = {
            to: 'equipe@kapnumerique.com',
            from: 'noreply@kapnumerique.com',
            subject: `Nouvel onboarding client: ${formData["Nom de l'entreprise"]}`,
            html: `
                <h2>Nouvel onboarding client reçu</h2>
                <p><strong>Entreprise:</strong> ${formData["Nom de l'entreprise"]}</p>
                <p><strong>Contact:</strong> ${formData["Contact principal"]}</p>
                <p><strong>Email:</strong> ${formData["Email"]}</p>
                <p><strong>Téléphone:</strong> ${formData["Téléphone"]}</p>
                <p><strong>Style visuel:</strong> ${formData["Style visuel préféré"]}</p>
                <hr>
                <p>Connectez-vous à Airtable pour voir tous les détails et fichiers uploadés.</p>
            `
        };
        
        await sgMail.send(msg);
    } catch (error) {
        console.error('Erreur envoi email:', error);
        // Ne pas faire échouer la requête si l'email ne part pas
    }
    */
}