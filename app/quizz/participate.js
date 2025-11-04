// app/quizz/participate.js
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { db } from '../../services/firebase';

const PRIMARY = "#6C63FF";
const SUCCESS = "#28A745";
const DANGER = "#EF4444";
const SURFACE = "#FFFFFF";
const CARD = "#F5F7FB";
const BORDER = "#E6E8EF";
const TEXT_MUTED = "#6B7280";

export default function ParticipateQuizScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const { quizId, participantName } = params;
  
  // États
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentSubthemeIndex, setCurrentSubthemeIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showFinishModal, setShowFinishModal] = useState(false);
  
  // Charger le quiz
  useEffect(() => {
    loadQuiz();
  }, [quizId]);

  const loadQuiz = async () => {
    try {
      const quizDoc = await getDoc(doc(db, 'quizzes', quizId));
      if (quizDoc.exists()) {
        setQuiz({ id: quizDoc.id, ...quizDoc.data() });
      } else {
        alert('Quiz introuvable');
        router.back();
      }
    } catch (error) {
      console.error('Erreur chargement quiz:', error);
      alert('Impossible de charger le quiz');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  // Calculer les totaux
  const currentSubtheme = quiz?.subthemes?.[currentSubthemeIndex];
  const currentQuestion = currentSubtheme?.questions?.[currentQuestionIndex];
  const totalQuestions = quiz?.subthemes?.reduce((acc, s) => acc + s.questions.length, 0) || 0;
  
  // Position globale de la question actuelle
  let globalQuestionNumber = 0;
  for (let i = 0; i < currentSubthemeIndex; i++) {
    globalQuestionNumber += quiz.subthemes[i].questions.length;
  }
  globalQuestionNumber += currentQuestionIndex + 1;

  // Clé unique pour la question actuelle
  const currentAnswerKey = `${currentSubthemeIndex}-${currentQuestionIndex}`;
  const currentAnswer = answers[currentAnswerKey] || '';

  // Sauvegarder une réponse
  const saveAnswer = (value) => {
    setAnswers(prev => ({
      ...prev,
      [currentAnswerKey]: value
    }));
  };

  // Navigation
  const goToNextQuestion = () => {
    const questionsInSubtheme = currentSubtheme.questions.length;
    
    if (currentQuestionIndex < questionsInSubtheme - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (currentSubthemeIndex < quiz.subthemes.length - 1) {
      setCurrentSubthemeIndex(currentSubthemeIndex + 1);
      setCurrentQuestionIndex(0);
    } else {
      handleFinishQuiz();
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else if (currentSubthemeIndex > 0) {
      setCurrentSubthemeIndex(currentSubthemeIndex - 1);
      const prevSubtheme = quiz.subthemes[currentSubthemeIndex - 1];
      setCurrentQuestionIndex(prevSubtheme.questions.length - 1);
    }
  };

  const handleFinishQuiz = () => {
    console.log('🎯 Ouverture du modal de confirmation');
    setShowFinishModal(true);
  };

  const submitQuiz = async () => {
    try {
      console.log('📤 Début de submitQuiz');

      const resultRef = await addDoc(collection(db, 'quizzes', quizId, 'results'), {
        participantName: participantName,
        answers: answers,
        isFinished: true,
        completedAt: serverTimestamp(),
        totalQuestions: totalQuestions,
        answeredCount: Object.keys(answers).filter(key => answers[key]?.toString().trim()).length,
      });

      console.log('✅ Résultat sauvegardé avec ID:', resultRef.id);

      router.replace({
        pathname: '/quizz/waiting',
        params: {
          quizId: quizId,
          participantName: participantName,
          resultId: resultRef.id
        }
      });
      
    } catch (error) {
      console.error('💥 Erreur soumission:', error);
      alert('Impossible d\'enregistrer tes réponses: ' + error.message);
    }
  };

  // Boutons en fonction du type de question
  const renderQuestionInput = () => {
    if (!currentQuestion) return null;

    switch (currentQuestion.type) {
      case 'true_false':
        return (
          <View style={styles.answersContainer}>
            <TouchableOpacity
              style={[
                styles.tfButton,
                currentAnswer === 'true' && styles.tfButtonSelected
              ]}
              onPress={() => saveAnswer('true')}
            >
              <Ionicons 
                name={currentAnswer === 'true' ? 'checkmark-circle' : 'ellipse-outline'} 
                size={24} 
                color={currentAnswer === 'true' ? SUCCESS : TEXT_MUTED} 
              />
              <Text style={[
                styles.tfButtonText,
                currentAnswer === 'true' && styles.tfButtonTextSelected
              ]}>
                Vrai
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tfButton,
                currentAnswer === 'false' && styles.tfButtonSelected
              ]}
              onPress={() => saveAnswer('false')}
            >
              <Ionicons 
                name={currentAnswer === 'false' ? 'close-circle' : 'ellipse-outline'} 
                size={24} 
                color={currentAnswer === 'false' ? DANGER : TEXT_MUTED} 
              />
              <Text style={[
                styles.tfButtonText,
                currentAnswer === 'false' && styles.tfButtonTextSelected
              ]}>
                Faux
              </Text>
            </TouchableOpacity>
          </View>
        );

      case 'multiple_choice':
        return (
          <View style={styles.answersContainer}>
            {currentQuestion.options?.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  currentAnswer === option && styles.optionButtonSelected
                ]}
                onPress={() => saveAnswer(option)}
              >
                <View style={styles.optionRadio}>
                  <Ionicons 
                    name={currentAnswer === option ? 'radio-button-on' : 'radio-button-off'} 
                    size={24} 
                    color={currentAnswer === option ? PRIMARY : TEXT_MUTED} 
                  />
                </View>
                <Text style={[
                  styles.optionText,
                  currentAnswer === option && styles.optionTextSelected
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'open':
        return (
          <View style={styles.answersContainer}>
            <TextInput
              style={styles.openInput}
              placeholder="Ta réponse..."
              value={currentAnswer}
              onChangeText={saveAnswer}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={styles.loadingText}>Chargement du quiz...</Text>
      </View>
    );
  }

  if (!quiz || !currentSubtheme || !currentQuestion) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={TEXT_MUTED} />
        <Text style={styles.errorText}>Erreur de chargement</Text>
      </View>
    );
  }

  const isFirstQuestion = currentSubthemeIndex === 0 && currentQuestionIndex === 0;
  const isLastQuestion = 
    currentSubthemeIndex === quiz.subthemes.length - 1 && 
    currentQuestionIndex === currentSubtheme.questions.length - 1;

  const answeredCount = Object.keys(answers).filter(key => answers[key]?.toString().trim()).length;

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header avec progression */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => {
              if (confirm('Quitter le quiz ? Ta progression sera perdue.')) {
                router.back();
              }
            }}
          >
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          
          <View style={styles.participantBadge}>
            <Ionicons name="person" size={14} color={PRIMARY} />
            <Text style={styles.participantName}>{participantName}</Text>
          </View>
        </View>

        <View style={styles.progressSection}>
          <Text style={styles.progressText}>
            Question {globalQuestionNumber} / {totalQuestions}
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${(globalQuestionNumber / totalQuestions) * 100}%` }
              ]} 
            />
          </View>
        </View>

        <View style={styles.subthemeBadge}>
          <Ionicons name="folder-outline" size={16} color={PRIMARY} />
          <Text style={styles.subthemeText}>{currentSubtheme.name}</Text>
        </View>
      </View>

      {/* Corps de la question */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.questionCard}>
          <View style={styles.questionHeader}>
            <View style={styles.questionNumberBadge}>
              <Text style={styles.questionNumberText}>
                Q{currentQuestionIndex + 1}
              </Text>
            </View>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>
                {currentQuestion.type === 'true_false' && '✓ Vrai/Faux'}
                {currentQuestion.type === 'multiple_choice' && '☰ QCM'}
                {currentQuestion.type === 'open' && '✎ Réponse libre'}
              </Text>
            </View>
          </View>

          <Text style={styles.questionText}>{currentQuestion.question}</Text>
        </View>

        {renderQuestionInput()}
      </ScrollView>

      {/* Footer avec navigation */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.navButton,
            styles.prevButton,
            isFirstQuestion && styles.navButtonDisabled
          ]}
          onPress={goToPreviousQuestion}
          disabled={isFirstQuestion}
        >
          <Ionicons 
            name="chevron-back" 
            size={20} 
            color={isFirstQuestion ? TEXT_MUTED : PRIMARY} 
          />
          <Text style={[
            styles.navButtonText,
            isFirstQuestion && styles.navButtonTextDisabled
          ]}>
            Précédent
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navButton,
            styles.nextButton,
            isLastQuestion && styles.finishButton
          ]}
          onPress={isLastQuestion ? handleFinishQuiz : goToNextQuestion}
        >
          <Text style={styles.nextButtonText}>
            {isLastQuestion ? 'Terminer' : 'Suivant'}
          </Text>
          <Ionicons 
            name={isLastQuestion ? 'checkmark' : 'chevron-forward'} 
            size={20} 
            color="#fff" 
          />
        </TouchableOpacity>
      </View>

      {/* Modal de confirmation */}
      <Modal
        visible={showFinishModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFinishModal(false)}
      >
        <View style={modalStyles.overlay}>
          <View style={modalStyles.modal}>
            <Ionicons name="help-circle-outline" size={48} color={PRIMARY} />
            
            <Text style={modalStyles.title}>Terminer le quiz ?</Text>
            <Text style={modalStyles.message}>
              Tu as répondu à {answeredCount}/{totalQuestions} questions.
              {'\n\n'}
              Veux-tu vraiment terminer ?
            </Text>

            <View style={modalStyles.buttons}>
              <TouchableOpacity
                style={modalStyles.cancelButton}
                onPress={() => {
                  console.log('❌ Utilisateur a annulé');
                  setShowFinishModal(false);
                }}
              >
                <Text style={modalStyles.cancelButtonText}>Continuer</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={modalStyles.confirmButton}
                onPress={() => {
                  console.log('✅ Utilisateur a confirmé');
                  setShowFinishModal(false);
                  submitQuiz();
                }}
              >
                <Text style={modalStyles.confirmButtonText}>Terminer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F4F8',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F4F8',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    color: TEXT_MUTED,
    fontSize: 16,
  },
  errorText: {
    marginTop: 12,
    color: TEXT_MUTED,
    fontSize: 16,
    textAlign: 'center',
  },

  // Header
  header: {
    backgroundColor: SURFACE,
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  closeButton: {
    padding: 8,
  },
  participantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: CARD,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  participantName: {
    fontSize: 14,
    fontWeight: '600',
    color: PRIMARY,
  },
  progressSection: {
    marginBottom: 12,
  },
  progressText: {
    fontSize: 13,
    color: TEXT_MUTED,
    marginBottom: 6,
  },
  progressBar: {
    height: 6,
    backgroundColor: CARD,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: PRIMARY,
    borderRadius: 3,
  },
  subthemeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: `${PRIMARY}15`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  subthemeText: {
    fontSize: 14,
    fontWeight: '600',
    color: PRIMARY,
  },

  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  questionCard: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: BORDER,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  questionNumberBadge: {
    backgroundColor: PRIMARY,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionNumberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  typeBadge: {
    backgroundColor: CARD,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 12,
    color: TEXT_MUTED,
    fontWeight: '600',
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 26,
  },

  // Answers
  answersContainer: {
    gap: 12,
  },

  // True/False
  tfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SURFACE,
    borderWidth: 2,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  tfButtonSelected: {
    borderColor: PRIMARY,
    backgroundColor: `${PRIMARY}08`,
  },
  tfButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  tfButtonTextSelected: {
    color: PRIMARY,
  },

  // Multiple choice
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SURFACE,
    borderWidth: 2,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  optionButtonSelected: {
    borderColor: PRIMARY,
    backgroundColor: `${PRIMARY}08`,
  },
  optionRadio: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  optionTextSelected: {
    fontWeight: '600',
    color: PRIMARY,
  },

  // Open answer
  openInput: {
    backgroundColor: SURFACE,
    borderWidth: 2,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
    minHeight: 120,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    backgroundColor: SURFACE,
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  prevButton: {
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: PRIMARY,
  },
  navButtonTextDisabled: {
    color: TEXT_MUTED,
  },
  nextButton: {
    backgroundColor: PRIMARY,
  },
  finishButton: {
    backgroundColor: SUCCESS,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: SURFACE,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: PRIMARY,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: DANGER,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});