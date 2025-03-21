const apiRequest = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    const matricule = localStorage.getItem('matricule');

    if (!token || !matricule) {
        throw new Error('Authentification requise. Veuillez vous reconnecter.');
    }

    const defaultHeaders = {
        'Authorization': `Bearer ${token}`,
        'matricule': matricule
    };

    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers
        }
    };

    const response = await fetch(url, config);
    const textResponse = await response.text(); // Récupère la réponse brute en texte
    console.log('Réponse brute du backend:', textResponse);
    console.log('Statut HTTP:', response.status);

    if (!response.ok) {
        try {
            const errorData = JSON.parse(textResponse); // Tente de parser
            if (response.status === 401 || response.status === 403) {
                localStorage.clear();
                window.location.href = '/';
                throw new Error('Session expirée. Veuillez vous reconnecter.');
            }
            throw new Error(`${response.status} - ${errorData.error || 'Erreur inconnue'}`);
        } catch (parseError) {
            throw new Error(`Erreur de parsing JSON: ${parseError.message} - Réponse brute: ${textResponse}`);
        }
    }

    return JSON.parse(textResponse); // Retourne le JSON parsé
};

export default apiRequest;