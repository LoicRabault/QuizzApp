// src/services/qrCodeService.js
import * as Sharing from 'expo-sharing';

export const generateQuizUrl = (quizId) => {
  // URL de votre app (à remplacer par votre domaine)
  const baseUrl = 'http://localhost:8081/join';
  return `${baseUrl}?quizId=${quizId}`;
};

export const generateDeepLink = (quizId) => {
  // Deep link pour ouvrir directement l'app
  return `yourapp://join?quizId=${quizId}`;
};

export const shareQuizUrl = async (quizId, quizTitle) => {
  const url = generateQuizUrl(quizId);
  const message = `Rejoignez le quiz "${quizTitle}" !\n${url}`;
  
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(url, {
      dialogTitle: `Partager le quiz ${quizTitle}`,
      mimeType: 'text/plain',
    });
  } else {
    alert('Le partage n\'est pas disponible sur cet appareil');
  }
};