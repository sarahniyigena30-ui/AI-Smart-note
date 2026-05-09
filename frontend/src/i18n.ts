export type Language = 'en' | 'fr'

export const translations = {
  en: {
    // Header
    appTitle: 'AI Web-Based Smart Note System',
    appSubtitle: 'Conversation recording, transcription support, and internal structured summarization.',
    
    // Authentication
    register: 'Register',
    login: 'Login',
    username: 'Username',
    password: 'Password',
    signInAs: 'Signed in as',
    logout: 'Logout',
    loading: 'Loading...',
    passwordHint: 'Your password is hashed on the server before it is saved.',
    passwordMinLength: 'Use at least 6 characters for the password.',
    createAccount: 'Create an account, then log into the system with your username and password.',
    
    // Recording Section
    recordConversation: 'Record Conversation',
    recordingProcessed: 'Recording processed successfully',
    startRecording: 'Start Recording',
    stopRecording: 'Stop Recording',
    currentSpeaker: 'Current speaker',
    typeNameOfPerson: 'Type the name of the person speaking',
    liveTranscript: 'Live Transcript',
    addManualTranscript: 'Add Manual Transcript',
    transcriptPlaceholder: 'Paste or type the conversation transcript here...',
    uploadAudio: 'Upload Audio',
    uploadAudioFile: 'Upload an audio file and optionally add a transcript',
    selectFile: 'Select File',
    addTranscript: 'Add Transcript',
    uploadAndProcess: 'Upload and Process',
    processingAudio: 'Processing audio...',
    
    // Recording History
    recordingHistory: 'Recording History',
    searchPlaceholder: 'Search by title, transcript, or summary...',
    noRecordings: 'No recordings found',
    title: 'Title',
    createdAt: 'Created',
    duration: 'Duration',
    summary: 'Summary',
    transcript: 'Transcript',
    keyPoints: 'Key Points',
    decisions: 'Decisions',
    actionItems: 'Action Items',
    topics: 'Topics',
    keywords: 'Keywords',
    insights: 'Insights',
    qaItems: 'Q&A',
    download: 'Download',
    delete: 'Delete',
    play: 'Play',
    
    // Model Dashboard
    voiceClassificationModel: 'Voice Classification Model',
    dataset: 'Dataset',
    accuracy: 'Accuracy',
    femaleVoice: 'Female Voice',
    maleVoice: 'Male Voice',
    precision: 'Precision',
    recall: 'Recall',
    f1Score: 'F1 Score',
    support: 'Support',
    confusionMatrix: 'Confusion Matrix',
    modelEvaluation: 'Model Evaluation Metrics',
    notAvailable: 'Model metrics are not available yet',
    
    // Messages and Errors
    recordingSuccess: 'Recording saved successfully',
    uploadSuccess: 'Audio uploaded and processed successfully',
    deleteSuccess: 'Recording deleted successfully',
    error: 'Error',
    errorMessage: 'An error occurred. Please try again.',
    language: 'Language',
    
    // Pagination
    previous: 'Previous',
    next: 'Next',
    page: 'Page',
    of: 'of',
  },
  
  fr: {
    // Header
    appTitle: 'Système de Prise de Notes Intelligent Basé sur le Web',
    appSubtitle: 'Enregistrement de conversations, support de transcription et résumé structuré interne.',
    
    // Authentication
    register: "S'inscrire",
    login: 'Se connecter',
    username: "Nom d'utilisateur",
    password: 'Mot de passe',
    signInAs: 'Connecté en tant que',
    logout: 'Se déconnecter',
    loading: 'Chargement...',
    passwordHint: 'Votre mot de passe est haché sur le serveur avant d\'être enregistré.',
    passwordMinLength: 'Utilisez au moins 6 caractères pour le mot de passe.',
    createAccount: 'Créez un compte, puis connectez-vous au système avec votre nom d\'utilisateur et votre mot de passe.',
    
    // Recording Section
    recordConversation: 'Enregistrer une Conversation',
    recordingProcessed: 'Enregistrement traité avec succès',
    startRecording: 'Commencer l\'enregistrement',
    stopRecording: 'Arrêter l\'enregistrement',
    currentSpeaker: 'Orateur actuel',
    typeNameOfPerson: 'Tapez le nom de la personne qui parle',
    liveTranscript: 'Transcription en Direct',
    addManualTranscript: 'Ajouter une Transcription Manuelle',
    transcriptPlaceholder: 'Collez ou tapez la transcription de la conversation ici...',
    uploadAudio: 'Télécharger l\'Audio',
    uploadAudioFile: 'Téléchargez un fichier audio et ajoutez éventuellement une transcription',
    selectFile: 'Sélectionner le Fichier',
    addTranscript: 'Ajouter une Transcription',
    uploadAndProcess: 'Télécharger et Traiter',
    processingAudio: 'Traitement de l\'audio...',
    
    // Recording History
    recordingHistory: 'Historique des Enregistrements',
    searchPlaceholder: 'Rechercher par titre, transcription ou résumé...',
    noRecordings: 'Aucun enregistrement trouvé',
    title: 'Titre',
    createdAt: 'Créé',
    duration: 'Durée',
    summary: 'Résumé',
    transcript: 'Transcription',
    keyPoints: 'Points Clés',
    decisions: 'Décisions',
    actionItems: 'Éléments d\'Action',
    topics: 'Sujets',
    keywords: 'Mots-clés',
    insights: 'Perspectives',
    qaItems: 'Q&R',
    download: 'Télécharger',
    delete: 'Supprimer',
    play: 'Lire',
    
    // Model Dashboard
    voiceClassificationModel: 'Modèle de Classification Vocale',
    dataset: 'Ensemble de Données',
    accuracy: 'Précision',
    femaleVoice: 'Voix Féminine',
    maleVoice: 'Voix Masculine',
    precision: 'Précision',
    recall: 'Rappel',
    f1Score: 'Score F1',
    support: 'Support',
    confusionMatrix: 'Matrice de Confusion',
    modelEvaluation: 'Métriques d\'Évaluation du Modèle',
    notAvailable: 'Les métriques du modèle ne sont pas encore disponibles',
    
    // Messages and Errors
    recordingSuccess: 'Enregistrement enregistré avec succès',
    uploadSuccess: 'Audio téléchargé et traité avec succès',
    deleteSuccess: 'Enregistrement supprimé avec succès',
    error: 'Erreur',
    errorMessage: 'Une erreur s\'est produite. Veuillez réessayer.',
    language: 'Langue',
    
    // Pagination
    previous: 'Précédent',
    next: 'Suivant',
    page: 'Page',
    of: 'de',
  },
}
