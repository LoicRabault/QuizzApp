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
const SUCCESS = "#10B981";
const DANGER = "#EF4444";
const SURFACE = "#FFFFFF";
const CARD = "#F5F7FB";
const BORDER = "#E6E8EF";
const TEXT_MUTED = "#6B7280";
const TEXT = "#1F2937";

export default function ParticipateQuizScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { quizId, participantName } = params;

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentSubthemeIndex, setCurrentSubthemeIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showFinishModal, setShowFinishModal] = useState(false);

  // --- Charger le quiz ---
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

  // --- Données actuelles ---
  const currentSubtheme = quiz?.subthemes?.[currentSubthemeIndex];
  const currentQuestion = currentSubtheme?.questions?.[currentQuestionIndex];
  const totalQuestions = quiz?.subthemes?.reduce((acc, s) => acc + s.questions.length, 0) || 0;

  // Numéro global de la question
  let globalQuestionNumber = 0;
  for (let i = 0; i < currentSubthemeIndex; i++) {
    globalQuestionNumber += quiz.subthemes[i].questions.length;
  }
  globalQuestionNumber += currentQuestionIndex + 1;

  const currentAnswerKey = `${currentSubthemeIndex}-${currentQuestionIndex}`;
  const currentAnswer = answers[currentAnswerKey] || '';

  const saveAnswer = (value) => {
    setAnswers((prev) => ({ ...prev, [currentAnswerKey]: value }));
  };

  // --- Navigation ---
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
      const prevSub = quiz.subthemes[currentSubthemeIndex - 1];
      setCurrentQuestionIndex(prevSub.questions.length - 1);
    }
  };

  const handleFinishQuiz = () => setShowFinishModal(true);

  const submitQuiz = async () => {
    try {
      const resultRef = await addDoc(collection(db, 'quizzes', quizId, 'results'), {
        participantName,
        answers,
        completedAt: serverTimestamp(),
        totalQuestions,
        answeredCount: Object.keys(answers).filter(k => answers[k]?.toString().trim()).length,
      });

      router.replace({
        pathname: '/quizz/waiting',
        params: { quizId, participantName, resultId: resultRef.id },
      });
    } catch (error) {
      alert("Erreur d'enregistrement : " + error.message);
    }
  };

  // --- Rendu des types de question ---
  const renderQuestionInput = () => {
    if (!currentQuestion) return null;

    switch (currentQuestion.type) {
      case 'true_false':
        return (
          <View style={styles.answersContainer}>
            <TouchableOpacity
              style={[styles.tfButton, currentAnswer === 'true' && styles.tfButtonSelected]}
              onPress={() => saveAnswer('true')}
            >
              <Ionicons
                name="checkmark-circle"
                size={26}
                color={currentAnswer === 'true' ? SUCCESS : TEXT_MUTED}
              />
              <Text
                style={[
                  styles.tfButtonText,
                  currentAnswer === 'true' && styles.tfButtonTextSelected,
                ]}
              >
                Vrai
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tfButton, currentAnswer === 'false' && styles.tfButtonSelected]}
              onPress={() => saveAnswer('false')}
            >
              <Ionicons
                name="close-circle"
                size={26}
                color={currentAnswer === 'false' ? DANGER : TEXT_MUTED}
              />
              <Text
                style={[
                  styles.tfButtonText,
                  currentAnswer === 'false' && styles.tfButtonTextSelected,
                ]}
              >
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
                  currentAnswer === option && styles.optionButtonSelected,
                ]}
                onPress={() => saveAnswer(option)}
              >
                <Ionicons
                  name={
                    currentAnswer === option
                      ? 'radio-button-on'
                      : 'radio-button-off'
                  }
                  size={24}
                  color={currentAnswer === option ? PRIMARY : TEXT_MUTED}
                />
                <Text
                  style={[
                    styles.optionText,
                    currentAnswer === option && styles.optionTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );

      case 'open':
        return (
          <TextInput
            style={styles.openInput}
            placeholder="Ta réponse..."
            placeholderTextColor={TEXT_MUTED}
            value={currentAnswer}
            onChangeText={saveAnswer}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        );

      // ✅ NOUVEAU TYPE “D’accord / Pas d’accord”
      case 'agree_disagree':
        return (
          <View style={styles.agreeContainer}>
            <TouchableOpacity
              style={[
                styles.agreeButton,
                currentAnswer === '1' && styles.agreeSelected,
              ]}
              onPress={() => saveAnswer('1')}
            >
              <Ionicons
                name="thumbs-up"
                size={28}
                color={currentAnswer === '1' ? '#fff' : SUCCESS}
              />
              <Text
                style={[
                  styles.agreeText,
                  currentAnswer === '1' && styles.agreeTextSelected,
                ]}
              >
                D’accord
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.agreeButton,
                currentAnswer === '0' && styles.disagreeSelected,
              ]}
              onPress={() => saveAnswer('0')}
            >
              <Ionicons
                name="thumbs-down"
                size={28}
                color={currentAnswer === '0' ? '#fff' : DANGER}
              />
              <Text
                style={[
                  styles.agreeText,
                  currentAnswer === '0' && styles.agreeTextSelected,
                ]}
              >
                Pas d’accord
              </Text>
            </TouchableOpacity>
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

  const isFirst = currentSubthemeIndex === 0 && currentQuestionIndex === 0;
  const isLast =
    currentSubthemeIndex === quiz.subthemes.length - 1 &&
    currentQuestionIndex === currentSubtheme.questions.length - 1;
  const answeredCount = Object.keys(answers).filter(k => answers[k]).length;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              if (confirm('Quitter le quiz ?')) router.back();
            }}
          >
            <Ionicons name="close" size={24} color={TEXT} />
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
                { width: `${(globalQuestionNumber / totalQuestions) * 100}%` },
              ]}
            />
          </View>
        </View>
      </View>

      {/* CORPS */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.questionCard}>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
        </View>

        {renderQuestionInput()}
      </ScrollView>

      {/* FOOTER */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.navButton, styles.prevButton, isFirst && styles.disabled]}
          onPress={goToPreviousQuestion}
          disabled={isFirst}
        >
          <Ionicons name="chevron-back" size={22} color={isFirst ? TEXT_MUTED : PRIMARY} />
          <Text style={[styles.navText, isFirst && styles.navDisabledText]}>Précédent</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, styles.nextButton, isLast && styles.finishButton]}
          onPress={isLast ? handleFinishQuiz : goToNextQuestion}
        >
          <Text style={styles.nextText}>{isLast ? 'Terminer' : 'Suivant'}</Text>
          <Ionicons name={isLast ? 'checkmark' : 'chevron-forward'} size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* MODAL FIN */}
      <Modal visible={showFinishModal} transparent animationType="fade">
        <View style={modalStyles.overlay}>
          <View style={modalStyles.modal}>
            <Ionicons name="help-circle-outline" size={50} color={PRIMARY} />
            <Text style={modalStyles.title}>Terminer le quiz ?</Text>
            <Text style={modalStyles.message}>
              Tu as répondu à {answeredCount}/{totalQuestions} questions.
            </Text>

            <View style={modalStyles.buttons}>
              <TouchableOpacity
                style={modalStyles.cancelButton}
                onPress={() => setShowFinishModal(false)}
              >
                <Text style={modalStyles.cancelText}>Continuer</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={modalStyles.confirmButton}
                onPress={() => {
                  setShowFinishModal(false);
                  submitQuiz();
                }}
              >
                <Text style={modalStyles.confirmText}>Terminer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F4F8' },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, color: TEXT_MUTED },
  header: {
    backgroundColor: SURFACE,
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  closeButton: { padding: 8 },
  participantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  participantName: { fontSize: 14, fontWeight: '600', color: PRIMARY },
  progressSection: { marginTop: 12 },
  progressText: { fontSize: 13, color: TEXT_MUTED, marginBottom: 6 },
  progressBar: {
    height: 6,
    backgroundColor: CARD,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: PRIMARY, borderRadius: 3 },
  content: { flex: 1 },
  contentContainer: { padding: 20 },
  questionCard: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 20,
  },
  questionText: { fontSize: 18, fontWeight: '600', color: TEXT, lineHeight: 26 },
  answersContainer: { gap: 14 },

  // ✅ D'accord / Pas d'accord
  agreeContainer: {
    flexDirection: 'column',
    gap: 14,
    marginTop: 6,
  },
  agreeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 18,
    backgroundColor: SURFACE,
    borderWidth: 2,
    borderColor: BORDER,
    gap: 12,
  },
  agreeSelected: { backgroundColor: SUCCESS, borderColor: SUCCESS },
  disagreeSelected: { backgroundColor: DANGER, borderColor: DANGER },
  agreeText: { fontSize: 18, fontWeight: '600', color: TEXT },
  agreeTextSelected: { color: '#fff' },

  // Footer
  footer: {
    flexDirection: 'row',
    backgroundColor: SURFACE,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    padding: 16,
    gap: 12,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 14,
  },
  prevButton: {
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
  },
  nextButton: { backgroundColor: PRIMARY },
  finishButton: { backgroundColor: SUCCESS },
  disabled: { opacity: 0.4 },
  navText: { fontSize: 16, fontWeight: '600', color: PRIMARY },
  navDisabledText: { color: TEXT_MUTED },
  nextText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Input libre
  openInput: {
    backgroundColor: SURFACE,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: BORDER,
    padding: 16,
    fontSize: 16,
    color: TEXT,
    minHeight: 120,
  },

  // True/False et QCM
  tfButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 18,
    borderWidth: 2,
    borderColor: BORDER,
    backgroundColor: SURFACE,
    justifyContent: 'center',
    gap: 12,
  },
  tfButtonSelected: {
    borderColor: PRIMARY,
    backgroundColor: `${PRIMARY}10`,
  },
  tfButtonText: { fontSize: 17, fontWeight: '600', color: TEXT },
  tfButtonTextSelected: { color: PRIMARY },
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
    backgroundColor: `${PRIMARY}10`,
  },
  optionText: { fontSize: 16, color: TEXT },
  optionTextSelected: { fontWeight: '600', color: PRIMARY },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: SURFACE,
    borderRadius: 18,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  title: { fontSize: 20, fontWeight: '700', color: TEXT, marginVertical: 10 },
  message: {
    textAlign: 'center',
    fontSize: 16,
    color: TEXT_MUTED,
    marginBottom: 20,
  },
  buttons: { flexDirection: 'row', gap: 12, width: '100%' },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CARD,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelText: { fontWeight: '600', color: PRIMARY },
  confirmButton: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: SUCCESS,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmText: { color: '#fff', fontWeight: '700' },
});
