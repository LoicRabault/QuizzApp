// src/services/quizService.js
import { getDatabase, push, ref, set } from 'firebase/database';

export const createQuiz = async (userId, quizData) => {
  const db = getDatabase();
  const quizzesRef = ref(db, 'quizzes');
  
  // Génère un ID unique
  const newQuizRef = push(quizzesRef);
  const quizId = newQuizRef.key;
  
  const quiz = {
    creatorId: userId,
    title: quizData.title,
    createdAt: new Date().toISOString(),
    subthemes: quizData.subthemes,
    participants: {} // Pour stocker les participants
  };
  
  await set(newQuizRef, quiz);
  
  return quizId;
};