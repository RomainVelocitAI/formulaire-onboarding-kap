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
        const requiredFields = form.querySelectorAll('[required]');
        const filledFields = Array.from(requiredFields).filter(field => {
            if (field.type === 'checkbox') return field.checked;
            return field.value.trim() !== '';
        });
        
        const progress = (filledFields.length / requiredFields.length) * 100;
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
            picker.addEventListener('input', (e) => {
                input.value = e.target.value;
            });
            
            input.addEventListener('input', (e) => {
                if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                    picker.value = e.target.value;
                }
            });
        }
    }

    // Configuration des zones d'upload
    setupUploadZone('logoUpload', 'logo', 'logo', ['image/png', 'image/jpeg', 'image/svg+xml']);
    setupUploadZone('photosEquipeUpload', 'photos-equipe', 'photosEquipe', ['image/png', 'image/jpeg']);
    setupUploadZone('photosProduitsUpload', 'photos-produits', 'photosProduits', ['image/png', 'image/jpeg']);
    setupUploadZone('photosLocauxUpload', 'photos-locaux', 'photosLocaux', ['image/png', 'image/jpeg']);
    setupUploadZone('videosUpload', 'videos', 'videos', ['video/mp4', 'video/quicktime', 'video/x-msvideo']);
    setupUploadZone('cgvUpload', 'cgv', 'cgv', ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']);
    setupUploadZone('docsCommerciaux', 'docs-commerciaux', 'docsCommerciaux', ['application/pdf', 'image/png', 'image/jpeg']);

    function setupUploadZone(zoneId, inputId, storageKey, acceptedTypes) {
        const zone = document.getElementById(zoneId);
        const input = document.getElementById(inputId);
        const filesContainer = document.getElementById(inputId.replace(/-/g, '') + 'Files');
        
        if (!zone || !input) return;

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
        });

        container.appendChild(fileItem);
    }

    function showError(message) {
        // Créer une notification temporaire
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #EF4444;
            color: white;
            padding: 1rem;
            border-radius: 0.5rem;
            z-index: 9999;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 3000);
    }

    // Convertir les fichiers en base64 pour Airtable
    async function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                // Format pour Airtable: [{url: "data:image/png;base64,..."}]
                resolve({
                    filename: file.name,
                    url: reader.result
                });
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // Préparer les données pour Airtable
    async function prepareFormData() {
        const formData = new FormData(form);
        
        // Convertir tous les fichiers en base64
        const logoFiles = await Promise.all(uploadedFiles.logo.map(fileToBase64));
        const photosEquipeFiles = await Promise.all(uploadedFiles.photosEquipe.map(fileToBase64));
        const photosProduitsFiles = await Promise.all(uploadedFiles.photosProduits.map(fileToBase64));
        const photosLocauxFiles = await Promise.all(uploadedFiles.photosLocaux.map(fileToBase64));
        const videosFiles = await Promise.all(uploadedFiles.videos.map(fileToBase64));
        const cgvFiles = await Promise.all(uploadedFiles.cgv.map(fileToBase64));
        const docsCommerciauxFiles = await Promise.all(uploadedFiles.docsCommerciaux.map(fileToBase64));

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
                "Vidéos": videosFiles.length > 0 ? videosFiles : undefined,
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
        const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
        
        if (isProduction) {
            // En production, utiliser l'API route
            const response = await fetch('/api/submit-form', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erreur lors de l\'envoi du formulaire');
            }

            return await response.json();
        } else {
            // En développement
            if (typeof AIRTABLE_CONFIG === 'undefined' || !AIRTABLE_CONFIG.API_KEY || AIRTABLE_CONFIG.API_KEY === 'YOUR_AIRTABLE_API_KEY') {
                throw new Error('Configuration Airtable manquante. Veuillez configurer config.js');
            }

            const response = await fetch(`https://api.airtable.com/v0/${AIRTABLE_CONFIG.BASE_ID}/${AIRTABLE_CONFIG.TABLE_NAME}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${AIRTABLE_CONFIG.API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Erreur lors de l\'envoi du formulaire');
            }

            return await response.json();
        }
    }

    // Validation du formulaire
    function validateForm() {
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (field.type === 'checkbox') {
                if (!field.checked) {
                    isValid = false;
                    field.parentElement.style.borderColor = 'var(--danger)';
                }
            } else if (!field.value.trim()) {
                isValid = false;
                field.style.borderColor = 'var(--danger)';
            }
        });

        // Vérifier qu'au moins un logo est uploadé
        if (uploadedFiles.logo.length === 0) {
            isValid = false;
            showError('Veuillez uploader votre logo');
        }

        return isValid;
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
            errorMessage.querySelector('p').textContent = error.message;
            errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } finally {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        }
    });
});