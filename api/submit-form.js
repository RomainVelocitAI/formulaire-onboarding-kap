// API Route pour Vercel - Gestion du formulaire d'onboarding avec uploads
export default async function handler(req, res) {
    // Configuration de la taille maximale (4.5MB pour Vercel)
    const MAX_BODY_SIZE = 4.5 * 1024 * 1024; // 4.5MB
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
        // Utiliser l'ID de table au lieu du nom pour éviter les problèmes d'encodage
        const AIRTABLE_TABLE_ID = 'tblNK7R0o11hfHkCP';
        const AIRTABLE_TABLE_NAME = AIRTABLE_TABLE_ID; // Pour compatibilité avec le reste du code

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

        // Plus de validation de champs obligatoires - tout est optionnel

        // Validation de l'email SI fourni
        const email = data.fields.Email;
        if (email) {
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ 
                    message: 'Adresse email invalide' 
                });
            }
        }

        // Validation des couleurs hexadécimales SI fournies
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

        // Vérifier la taille totale de la requête (limite Vercel ET Airtable)
        const requestSize = JSON.stringify(data).length;
        const MAX_AIRTABLE_SIZE = 10 * 1024 * 1024; // 10MB pour Airtable
        
        // Vérifier d'abord la limite Vercel
        if (requestSize > MAX_BODY_SIZE) {
            console.log(`Requête trop grande: ${(requestSize / 1024 / 1024).toFixed(2)}MB > ${(MAX_BODY_SIZE / 1024 / 1024).toFixed(2)}MB`);
            return res.status(413).json({ 
                message: `Les fichiers sont trop volumineux (${(requestSize / 1024 / 1024).toFixed(1)}MB). Maximum autorisé: 4MB. Veuillez réduire le nombre de fichiers ou leur taille.` 
            });
        }
        
        // Vérifier ensuite la limite Airtable
        if (requestSize > MAX_AIRTABLE_SIZE) {
            return res.status(413).json({ 
                message: 'La taille totale des fichiers dépasse la limite d\'Airtable (10MB). Veuillez réduire le nombre ou la taille des fichiers.' 
            });
        }

        let existingRecordId = null;
        let actionType = 'created';

        // Si un email est fourni, vérifier s'il existe déjà un enregistrement
        if (email) {
            try {
                // Rechercher un enregistrement existant avec cet email
                const searchUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}?filterByFormula=${encodeURIComponent(`{Email}="${email}"`)}`;
                
                const searchResponse = await fetch(searchUrl, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${AIRTABLE_API_KEY}`
                    }
                });

                if (searchResponse.ok) {
                    const searchResult = await searchResponse.json();
                    if (searchResult.records && searchResult.records.length > 0) {
                        // Un enregistrement existe déjà avec cet email
                        existingRecordId = searchResult.records[0].id;
                        actionType = 'updated';
                        console.log(`Record trouvé pour ${email}: ${existingRecordId}`);
                    }
                }
            } catch (searchError) {
                console.error('Erreur lors de la recherche d\'enregistrement existant:', searchError);
                // Continuer avec la création d'un nouvel enregistrement
            }
        }

        let airtableResponse;
        let url;
        let method;

        if (existingRecordId) {
            // UPDATE : Un enregistrement existe, le mettre à jour
            url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}/${existingRecordId}`;
            method = 'PATCH';
            
            // Ajouter la date de dernière mise à jour
            data.fields['Dernière mise à jour'] = new Date().toISOString();
            
            console.log(`Mise à jour de l'enregistrement ${existingRecordId}`);
        } else {
            // CREATE : Pas d'enregistrement existant, créer un nouveau
            url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`;
            method = 'POST';
            
            // Ajouter la date de soumission pour un nouveau record
            data.fields['Date soumission'] = new Date().toISOString();
            data.fields['Statut onboarding'] = 'En cours';
            
            console.log('Création d\'un nouvel enregistrement');
        }

        // Debug: log de la structure des données avant envoi
        console.log('Envoi à Airtable - Méthode:', method);
        console.log('URL:', url);
        console.log('Champs avec attachments:', Object.keys(data.fields).filter(key => 
            Array.isArray(data.fields[key]) && data.fields[key][0]?.url
        ));
        
        // Envoyer à Airtable
        airtableResponse = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        // Gérer la réponse d'Airtable
        if (!airtableResponse.ok) {
            const errorData = await airtableResponse.json();
            console.error('Erreur Airtable - Status:', airtableResponse.status);
            console.error('Erreur Airtable - Détails:', JSON.stringify(errorData, null, 2));
            
            // Parser l'erreur Airtable pour un message plus clair
            let errorMessage = 'Erreur lors de l\'enregistrement des données';
            
            if (errorData.error) {
                if (errorData.error.type === 'INVALID_REQUEST_BODY') {
                    errorMessage = 'Format de données invalide. Vérifiez que tous les fichiers sont correctement formatés.';
                } else if (errorData.error.type === 'INVALID_ATTACHMENT_OBJECT') {
                    errorMessage = 'Erreur avec les fichiers uploadés. Veuillez réessayer avec des fichiers plus petits.';
                } else if (errorData.error.type === 'AUTHENTICATION_REQUIRED') {
                    errorMessage = 'Erreur d\'authentification avec Airtable';
                } else if (errorData.error.type === 'UNKNOWN_FIELD_NAME') {
                    // Si le champ "Dernière mise à jour" n'existe pas, l'ignorer
                    if (existingRecordId && errorData.error.message?.includes('Dernière mise à jour')) {
                        // Réessayer sans le champ "Dernière mise à jour"
                        delete data.fields['Dernière mise à jour'];
                        
                        airtableResponse = await fetch(url, {
                            method: method,
                            headers: {
                                'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify(data)
                        });
                        
                        if (!airtableResponse.ok) {
                            const retryErrorData = await airtableResponse.json();
                            errorMessage = retryErrorData.error?.message || errorMessage;
                        }
                    } else {
                        errorMessage = errorData.error.message;
                    }
                } else if (errorData.error.message) {
                    errorMessage = errorData.error.message;
                }
            }
            
            if (!airtableResponse.ok) {
                return res.status(airtableResponse.status).json({ 
                    message: errorMessage 
                });
            }
        }

        const result = await airtableResponse.json();

        // Message de succès différent selon l'action
        const successMessage = actionType === 'updated' 
            ? 'Vos informations ont été mises à jour avec succès' 
            : 'Vos informations ont été enregistrées avec succès';

        // Envoyer un email de notification (optionnel)
        await sendOnboardingNotification(data.fields, actionType);

        // Réponse de succès
        return res.status(200).json({ 
            success: true,
            message: successMessage,
            action: actionType,
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
async function sendOnboardingNotification(formData, actionType) {
    // Si vous utilisez un service d'email comme SendGrid
    /*
    try {
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        
        const subject = actionType === 'updated' 
            ? `Mise à jour onboarding: ${formData["Nom de l'entreprise"] || 'Client'}` 
            : `Nouvel onboarding client: ${formData["Nom de l'entreprise"] || 'Nouveau'}`;
        
        const msg = {
            to: 'equipe@kapnumerique.com',
            from: 'noreply@kapnumerique.com',
            subject: subject,
            html: `
                <h2>${actionType === 'updated' ? 'Mise à jour' : 'Nouvel'} onboarding client</h2>
                <p><strong>Entreprise:</strong> ${formData["Nom de l'entreprise"] || 'Non renseigné'}</p>
                <p><strong>Contact:</strong> ${formData["Contact principal"] || 'Non renseigné'}</p>
                <p><strong>Email:</strong> ${formData["Email"] || 'Non renseigné'}</p>
                <p><strong>Téléphone:</strong> ${formData["Téléphone"] || 'Non renseigné'}</p>
                <p><strong>Style visuel:</strong> ${formData["Style visuel préféré"] || 'Non renseigné'}</p>
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