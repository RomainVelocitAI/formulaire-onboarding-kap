// Gestion du formulaire d'onboarding
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('onboardingForm');
    const submitBtn = document.getElementById('submitBtn');
    const successMessage = document.getElementById('successMessage');
    const errorMessage = document.getElementById('errorMessage');
    const progressBar = document.getElementById('progressBar');
    
    // Stockage des fichiers uploadés
    const uploadedFiles = {
        logo: [],
        photosEquipe: [],
        photosProduits: [],
        photosLocaux: [],
        videos: [],
        cgv: [],
        docsCommerciaux: []
    };

    // Mise à jour de la barre de progression
    function updateProgress() {
        // Compter tous les champs du formulaire (pas seulement les obligatoires)
        const allFields = form.querySelectorAll('input:not([type="file"]), textarea, select');
        const filledFields = Array.from(allFields).filter(field => {
            if (field.type === 'checkbox') return field.checked;
            return field.value.trim() !== '';
        });
        
        // Ajouter les fichiers uploadés au comptage
        let uploadedFilesCount = 0;
        Object.values(uploadedFiles).forEach(files => {
            if (files.length > 0) uploadedFilesCount++;
        });
        
        const totalFields = allFields.length + Object.keys(uploadedFiles).length;
        const totalFilled = filledFields.length + uploadedFilesCount;
        
        const progress = totalFields > 0 ? (totalFilled / totalFields) * 100 : 0;
        progressBar.style.width = `${progress}%`;
    }

    // Écouter les changements sur tous les champs
    form.addEventListener('input', updateProgress);
    form.addEventListener('change', updateProgress);

    // Synchronisation des color pickers
    setupColorPicker('couleur-principale', 'couleur-principale-picker');
    setupColorPicker('couleur-secondaire', 'couleur-secondaire-picker');

    function setupColorPicker(inputId, pickerId) {
        const input = document.getElementById(inputId);
        const picker = document.getElementById(pickerId);
        
        if (input && picker) {
            // Quand on change le color picker, mettre à jour le champ texte
            picker.addEventListener('input', (e) => {
                input.value = e.target.value;
            });
            
            // Quand on clique sur le color picker (pour les changements via la palette)
            picker.addEventListener('change', (e) => {
                input.value = e.target.value;
            });
            
            // Quand on tape dans le champ texte, mettre à jour le color picker
            input.addEventListener('input', (e) => {
                if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                    picker.value = e.target.value;
                }
            });
            
            // Synchronisation initiale
            input.value = picker.value;
        }
    }

    // Configuration des zones d'upload
    setupUploadZone('logoUpload', 'logo', 'logo', ['image/png', 'image/jpeg', 'image/svg+xml'], 'logoFiles');
    setupUploadZone('photosEquipeUpload', 'photos-equipe', 'photosEquipe', ['image/png', 'image/jpeg'], 'photosEquipeFiles');
    setupUploadZone('photosProduitsUpload', 'photos-produits', 'photosProduits', ['image/png', 'image/jpeg'], 'photosProduitsFiles');
    setupUploadZone('photosLocauxUpload', 'photos-locaux', 'photosLocaux', ['image/png', 'image/jpeg'], 'photosLocauxFiles');
    // Désactiver l'upload de vidéos (trop volumineux)
    // setupUploadZone('videosUpload', 'videos', 'videos', ['video/mp4', 'video/quicktime', 'video/x-msvideo'], 'videosFiles');
    setupUploadZone('cgvUpload', 'cgv', 'cgv', ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'], 'cgvFiles');
    setupUploadZone('docsCommerciaux', 'docs-commerciaux', 'docsCommerciaux', ['application/pdf', 'image/png', 'image/jpeg'], 'docsCommerciauxFiles');

    function setupUploadZone(zoneId, inputId, storageKey, acceptedTypes, containerId) {
        const zone = document.getElementById(zoneId);
        const input = document.getElementById(inputId);
        const filesContainer = document.getElementById(containerId);
        
        if (!zone || !input) {
            console.error(`Zone d'upload non trouvée: zone=${zoneId}, input=${inputId}`);
            return;
        }
        
        if (!filesContainer) {
            console.error(`Conteneur de fichiers non trouvé: ${containerId}`);
            return;
        }

        // Click pour ouvrir le sélecteur de fichiers
        zone.addEventListener('click', () => input.click());

        // Gestion du drag & drop
        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('dragover');
        });

        zone.addEventListener('dragleave', () => {
            zone.classList.remove('dragover');
        });

        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('dragover');
            handleFiles(e.dataTransfer.files, storageKey, acceptedTypes, filesContainer);
        });

        // Gestion de la sélection de fichiers
        input.addEventListener('change', (e) => {
            handleFiles(e.target.files, storageKey, acceptedTypes, filesContainer);
        });
    }

    function handleFiles(files, storageKey, acceptedTypes, container) {
        Array.from(files).forEach(file => {
            // Vérifier le type de fichier
            if (!acceptedTypes.includes(file.type)) {
                showError(`Le fichier ${file.name} n'est pas au bon format`);
                return;
            }

            // Vérifier la taille (10MB max, 100MB pour vidéos)
            const maxSize = storageKey === 'videos' ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
            if (file.size > maxSize) {
                showError(`Le fichier ${file.name} est trop volumineux`);
                return;
            }

            // Ajouter le fichier à la liste
            uploadedFiles[storageKey].push(file);
            displayFile(file, storageKey, container);
        });
    }

    function displayFile(file, storageKey, container) {
        // Vérifier que le conteneur existe
        if (!container) {
            console.error(`Conteneur non fourni pour afficher le fichier ${file.name}`);
            return;
        }
        
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
            <span>${file.name}</span>
            <svg class="remove-file" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        `;

        // Supprimer le fichier
        fileItem.querySelector('.remove-file').addEventListener('click', (e) => {
            e.stopPropagation();
            const index = uploadedFiles[storageKey].indexOf(file);
            if (index > -1) {
                uploadedFiles[storageKey].splice(index, 1);
            }
            fileItem.remove();
            updateProgress(); // Mettre à jour la progression après suppression
        });

        container.appendChild(fileItem);
        updateProgress(); // Mettre à jour la progression après ajout
    }

    function showError(message, type = 'error') {
        // Créer une notification temporaire
        const notification = document.createElement('div');
        const bgColor = type === 'info' ? '#3B82F6' : '#EF4444';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${bgColor};
            color: white;
            padding: 1rem;
            border-radius: 0.5rem;
            z-index: 9999;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        const timeout = type === 'info' ? 5000 : 3000;
        setTimeout(() => notification.remove(), timeout);
    }

    // Compresser une image si nécessaire
    async function compressImage(file, maxWidth = 1920, maxHeight = 1080, quality = 0.8) {
        // Si le fichier est déjà petit, ne pas compresser
        if (file.size < 500000) { // Moins de 500KB
            return file;
        }

        // Seulement compresser les images
        if (!file.type.startsWith('image/')) {
            return file;
        }

        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // Calculer les nouvelles dimensions
                    if (width > maxWidth || height > maxHeight) {
                        const ratio = Math.min(maxWidth / width, maxHeight / height);
                        width *= ratio;
                        height *= ratio;
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        // Créer un nouveau fichier avec le blob compressé
                        const compressedFile = new File([blob], file.name, {
                            type: file.type,
                            lastModified: Date.now()
                        });
                        resolve(compressedFile);
                    }, file.type, quality);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    // Uploader un fichier vers GitHub et obtenir l'URL publique
    async function uploadToGitHub(file, folder) {
        // Compresser l'image si nécessaire
        const fileToUpload = await compressImage(file);
        
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async () => {
                try {
                    const response = await fetch('/api/upload-to-github', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            filename: fileToUpload.name || file.name,
                            content: reader.result.split(',')[1], // Enlever le préfixe data:...
                            folder: folder
                        })
                    });

                    if (!response.ok) {
                        const error = await response.json();
                        throw new Error(error.message || 'Erreur lors de l\'upload vers GitHub');
                    }

                    const data = await response.json();
                    
                    // Retourner au format attendu par Airtable
                    resolve({
                        url: data.url,
                        filename: data.filename
                    });
                } catch (error) {
                    console.error('Erreur upload GitHub:', error);
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsDataURL(fileToUpload);
        });
    }

    // Préparer les données pour Airtable
    async function prepareFormData() {
        const formData = new FormData(form);
        
        // Limiter le nombre de fichiers par catégorie pour éviter de dépasser la limite
        const MAX_FILES_PER_CATEGORY = 3;
        
        // Afficher un message de progression
        showError('Upload des fichiers vers GitHub en cours...', 'info');
        
        // Uploader les fichiers vers GitHub et obtenir les URLs publiques
        const logoFiles = await Promise.all(
            uploadedFiles.logo.slice(0, 1).map(f => uploadToGitHub(f, 'uploads/logos')) // Un seul logo
        );
        const photosEquipeFiles = await Promise.all(
            uploadedFiles.photosEquipe.slice(0, MAX_FILES_PER_CATEGORY).map(f => uploadToGitHub(f, 'uploads/equipe'))
        );
        const photosProduitsFiles = await Promise.all(
            uploadedFiles.photosProduits.slice(0, MAX_FILES_PER_CATEGORY).map(f => uploadToGitHub(f, 'uploads/produits'))
        );
        const photosLocauxFiles = await Promise.all(
            uploadedFiles.photosLocaux.slice(0, MAX_FILES_PER_CATEGORY).map(f => uploadToGitHub(f, 'uploads/locaux'))
        );
        // Pas de vidéos car trop volumineuses
        const videosFiles = [];
        const cgvFiles = await Promise.all(
            uploadedFiles.cgv.slice(0, 2).map(f => uploadToGitHub(f, 'uploads/documents')) // Max 2 documents
        );
        const docsCommerciauxFiles = await Promise.all(
            uploadedFiles.docsCommerciaux.slice(0, 2).map(f => uploadToGitHub(f, 'uploads/documents')) // Max 2 documents
        );
        
        // Avertir l'utilisateur si des fichiers ont été ignorés
        if (uploadedFiles.videos.length > 0) {
            showError('Les vidéos sont trop volumineuses pour être envoyées directement. Veuillez les partager via un lien (YouTube, Vimeo, Drive).');
        }
        if (uploadedFiles.photosEquipe.length > MAX_FILES_PER_CATEGORY ||
            uploadedFiles.photosProduits.length > MAX_FILES_PER_CATEGORY ||
            uploadedFiles.photosLocaux.length > MAX_FILES_PER_CATEGORY) {
            showError(`Seules les ${MAX_FILES_PER_CATEGORY} premières photos de chaque catégorie ont été envoyées.`);
        }

        return {
            fields: {
                "Nom de l'entreprise": formData.get('entreprise'),
                "Contact principal": formData.get('contact'),
                "Email": formData.get('email'),
                "Téléphone": formData.get('telephone'),
                "Slogan/Tagline": formData.get('slogan') || undefined,
                "Logo": logoFiles.length > 0 ? logoFiles : undefined,
                "Couleur principale": formData.get('couleur-principale'),
                "Couleur secondaire": formData.get('couleur-secondaire') || undefined,
                "Couleurs complémentaires": formData.get('couleurs-complementaires') || undefined,
                "Typographies souhaitées": formData.get('typographies') || undefined,
                "Style visuel préféré": formData.get('style-visuel'),
                "Description entreprise": formData.get('description-entreprise'),
                "Services/Produits": formData.get('services-produits'),
                "Valeurs entreprise": formData.get('valeurs') || undefined,
                "Témoignages clients": formData.get('temoignages') || undefined,
                "FAQ": formData.get('faq') || undefined,
                "Photos équipe": photosEquipeFiles.length > 0 ? photosEquipeFiles : undefined,
                "Photos produits/services": photosProduitsFiles.length > 0 ? photosProduitsFiles : undefined,
                "Photos locaux/ambiance": photosLocauxFiles.length > 0 ? photosLocauxFiles : undefined,
                "Vidéos": formData.get('videos-links') || undefined,
                "Adresse complète": formData.get('adresse'),
                "Horaires d'ouverture": formData.get('horaires') || undefined,
                "Réseaux sociaux": formData.get('reseaux-sociaux') || undefined,
                "Nom de domaine souhaité": formData.get('nom-domaine') || undefined,
                "Accès existants": formData.get('acces-existants') || undefined,
                "Sites références": formData.get('sites-references') || undefined,
                "Mentions légales": formData.get('mentions-legales'),
                "CGV/CGU": cgvFiles.length > 0 ? cgvFiles : undefined,
                "Documents commerciaux": docsCommerciauxFiles.length > 0 ? docsCommerciauxFiles : undefined,
                "Date soumission": new Date().toISOString(),
                "Statut onboarding": "En cours"
            }
        };
    }

    // Envoi vers Airtable
    async function submitToAirtable(data) {
        try {
            // Log pour debug (sans les données base64 complètes)
            console.log('Envoi des données à Airtable...');
            const debugData = {
                ...data,
                fields: Object.entries(data.fields).reduce((acc, [key, value]) => {
                    if (Array.isArray(value) && value[0]?.url?.startsWith('data:')) {
                        acc[key] = `[${value.length} fichier(s) attaché(s)]`;
                    } else {
                        acc[key] = value;
                    }
                    return acc;
                }, {})
            };
            console.log('Structure des données:', debugData);
            
            const response = await fetch('/api/submit-form', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            
            if (!response.ok) {
                console.error('Erreur API:', response.status, result);
                throw new Error(result.message || 'Erreur lors de l\'envoi du formulaire');
            }

            return result;
        } catch (error) {
            console.error('Erreur lors de l\'envoi:', error);
            throw error;
        }
    }

    // Validation du formulaire (plus de champs obligatoires)
    function validateForm() {
        // Plus de validation obligatoire, tous les champs sont optionnels
        // On peut soumettre même un formulaire vide pour sauvegarder l'avancement
        return true;
    }

    // Gestion de la soumission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Reset messages
        successMessage.classList.remove('show');
        errorMessage.classList.remove('show');

        // Validation
        if (!validateForm()) {
            showError('Veuillez remplir tous les champs obligatoires');
            return;
        }

        // Loading state
        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        try {
            // Préparer les données
            const data = await prepareFormData();

            // Envoyer à Airtable
            await submitToAirtable(data);

            // Success
            successMessage.classList.add('show');
            successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // Reset form après 3 secondes
            setTimeout(() => {
                form.reset();
                Object.keys(uploadedFiles).forEach(key => {
                    uploadedFiles[key] = [];
                });
                document.querySelectorAll('.uploaded-files').forEach(container => {
                    container.innerHTML = '';
                });
                updateProgress();
            }, 3000);

        } catch (error) {
            console.error('Erreur:', error);
            errorMessage.classList.add('show');
            
            // Message d'erreur plus clair selon le type d'erreur
            let userMessage = error.message;
            if (error.message.includes('413') || error.message.includes('too large') || error.message.includes('Entity Too Large')) {
                userMessage = 'Les fichiers sont trop volumineux. Veuillez réduire leur taille ou leur nombre. Maximum 3 photos par catégorie.';
            } else if (error.message.includes('SyntaxError')) {
                userMessage = 'Erreur de communication avec le serveur. Les fichiers sont peut-être trop volumineux.';
            }
            
            errorMessage.querySelector('p').textContent = userMessage;
            errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } finally {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    });
});