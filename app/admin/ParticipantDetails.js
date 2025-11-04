// app/admin/ParticipantDetails.js
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { db } from '../../services/firebase';

const PRIMARY = "#6C63FF";
const SUCCESS = "#28A745";
const DANGER = "#EF4444";
const WARNING = "#FFA500";
const SURFACE = "#FFFFFF";
const CARD = "#F5F7FB";
const BORDER = "#E6E8EF";
const TEXT_MUTED = "#6B7280";

export default function ParticipantDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const { quizId, quizTitle, resultId, participantName } = params;
  
  const [quiz, setQuiz] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [quizId, resultId]);

  const loadData = async () => {
    try {
      // Charger le quiz
      const quizDoc = await getDoc(doc(db, 'quizzes', quizId));
      if (quizDoc.exists()) {
        setQuiz({ id: quizDoc.id, ...quizDoc.data() });
      }

      // Charger le résultat
      const resultDoc = await getDoc(doc(db, 'quizzes', quizId, 'results', resultId));
      if (resultDoc.exists()) {
        setResult({ id: resultDoc.id, ...resultDoc.data() });
      }

      setLoading(false);
    } catch (error) {
      console.error('Erreur chargement:', error);
      setLoading(false);
    }
  };

  // Calculer le score et les détails
  const calculateDetails = () => {
    if (!result?.answers || !quiz?.subthemes) return { score: 0, correct: 0, wrong: 0, unanswered: 0, details: [] };

    let correct = 0;
    let wrong = 0;
    let unanswered = 0;
    const details = [];

   quiz.subthemes.forEach((subtheme, subIndex) => {
  let correctSub = 0;
  let wrongSub = 0;
  let unansweredSub = 0;

  const subthemeDetails = {
    name: subtheme.name,
    questions: []
  };

  subtheme.questions.forEach((question, qIndex) => {
  const answerKey = `${subIndex}-${qIndex}`;
  const userAnswer = result.answers[answerKey];
  let isCorrect = false;
  let hasAnswer = false;

  if (userAnswer !== undefined && userAnswer !== '') {
    hasAnswer = true;
    
    if (question.type === 'agree_disagree') {
      // Pour agree_disagree, toute réponse est "correcte"
      isCorrect = (userAnswer === 'agree' || userAnswer === 'disagree');
    } else if (question.type === 'open') {
      if (question.answer && userAnswer) {
        isCorrect = userAnswer.toLowerCase().trim() === question.answer.toLowerCase().trim();
      }
    } else {
      isCorrect = userAnswer === question.answer;
    }

    if (isCorrect) {
      correct++;
      correctSub++;
    } else {
      wrong++;
      wrongSub++;
    }
  } else {
    unanswered++;
    unansweredSub++;
  }

    subthemeDetails.questions.push({
      question: question.question,
      type: question.type,
      options: question.options || [],
      correctAnswer: question.answer,
      userAnswer: userAnswer || 'Pas de réponse',
      isCorrect,
      hasAnswer
    });
  });

  const totalSub = correctSub + wrongSub + unansweredSub;
  const scoreSub = totalSub > 0 ? Math.round((correctSub / totalSub) * 100) : 0;

  // ✅ on ajoute les totaux par sous-thème
  subthemeDetails.stats = {
    correct: correctSub,
    wrong: wrongSub,
    unanswered: unansweredSub,
    score: scoreSub,
    total: totalSub
  };

  details.push(subthemeDetails);
});

    const total = correct + wrong + unanswered;
    const score = total > 0 ? Math.round((correct / total) * 100) : 0;

    return { score, correct, wrong, unanswered, details };
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  const analysis = calculateDetails();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{participantName}</Text>
          <Text style={styles.headerSubtitle}>{quizTitle}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Score global */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreNumber}>{analysis.score}%</Text>
          </View>
          
          <View style={styles.scoreStats}>
            <View style={styles.scoreStat}>
              <View style={[styles.scoreStatDot, { backgroundColor: SUCCESS }]} />
              <Text style={styles.scoreStatNumber}>{analysis.correct}</Text>
              <Text style={styles.scoreStatLabel}>Correctes</Text>
            </View>

            <View style={styles.scoreStat}>
              <View style={[styles.scoreStatDot, { backgroundColor: DANGER }]} />
              <Text style={styles.scoreStatNumber}>{analysis.wrong}</Text>
              <Text style={styles.scoreStatLabel}>Incorrectes</Text>
            </View>

            <View style={styles.scoreStat}>
              <View style={[styles.scoreStatDot, { backgroundColor: TEXT_MUTED }]} />
              <Text style={styles.scoreStatNumber}>{analysis.unanswered}</Text>
              <Text style={styles.scoreStatLabel}>Non répondues</Text>
            </View>
          </View>
        </View>

        {/* Détails par sous-thème */}
        {analysis.details.map((subtheme, subIndex) => (
          <View key={subIndex} style={styles.subthemeCard}>
  <View style={styles.subthemeHeader}>
    <Ionicons name="folder-outline" size={20} color={PRIMARY} />
    <Text style={styles.subthemeName}>{subtheme.name}</Text>
  </View>

  {/* ✅ Ajout des stats de sous-thème */}
  <View style={styles.subthemeStats}>
    <Text style={styles.subthemeScore}>Score : {subtheme.stats.score}%</Text>
    <View style={styles.subthemeStatsRow}>
      <Text style={[styles.subthemeStat, { color: SUCCESS }]}>
        ✓ {subtheme.stats.correct}
      </Text>
      <Text style={[styles.subthemeStat, { color: DANGER }]}>
        ✗ {subtheme.stats.wrong}
      </Text>
      <Text style={[styles.subthemeStat, { color: TEXT_MUTED }]}>
        ∅ {subtheme.stats.unanswered}
      </Text>
    </View>
  </View>
            

            {subtheme.questions.map((q, qIndex) => (
              <View key={qIndex} style={styles.questionCard}>
                {/* Header de la question */}
                <View style={styles.questionHeader}>
                  <View style={styles.questionNumber}>
                    <Text style={styles.questionNumberText}>Q{qIndex + 1}</Text>
                  </View>
                  
                <View style={styles.questionType}>
  <Text style={styles.questionTypeText}>
    {q.type === 'true_false' && '✓ Vrai/Faux'}
    {q.type === 'multiple_choice' && '☰ QCM'}
    {q.type === 'open' && '✎ Libre'}
    {q.type === 'agree_disagree' && '⇄ D/P'}  {/* ✅ Juste le label */}
  </Text>
</View>

                  <View style={[
                    styles.resultBadge,
                    !q.hasAnswer && styles.resultBadgeUnanswered,
                    q.hasAnswer && q.isCorrect && styles.resultBadgeCorrect,
                    q.hasAnswer && !q.isCorrect && styles.resultBadgeWrong
                  ]}>
                    <Ionicons 
                      name={
                        !q.hasAnswer ? 'remove-circle' :
                        q.isCorrect ? 'checkmark-circle' : 
                        'close-circle'
                      } 
                      size={20} 
                      color="#fff" 
                    />
                  </View>
                </View>

                {/* Question */}
                <Text style={styles.questionText}>{q.question}</Text>

                {/* Réponses */}
                <View style={styles.answersSection}>
                  {/* Réponse de l'utilisateur */}
                  <View style={styles.answerBlock}>
                    <Text style={styles.answerLabel}>
                      <Ionicons name="person" size={14} color={TEXT_MUTED} /> Réponse du participant
                    </Text>
                    <View style={[
                      styles.answerBox,
                      !q.hasAnswer && styles.answerBoxEmpty,
                      q.hasAnswer && q.isCorrect && styles.answerBoxCorrect,
                      q.hasAnswer && !q.isCorrect && styles.answerBoxWrong
                    ]}>
                      <Text style={styles.answerText}>
                        {q.userAnswer}
                      </Text>
                    </View>
                  </View>

                  {/* Réponse correcte (si différente) */}
                  {q.hasAnswer && !q.isCorrect && q.correctAnswer && (
                    <View style={styles.answerBlock}>
                      <Text style={styles.answerLabel}>
                        <Ionicons name="checkmark-circle" size={14} color={SUCCESS} /> Réponse correcte
                      </Text>
                      <View style={styles.answerBoxCorrect}>
                        <Text style={styles.answerText}>
                          {q.correctAnswer}
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Options pour QCM */}
                  {q.type === 'multiple_choice' && q.options.length > 0 && (
                    <View style={styles.optionsBlock}>
                      <Text style={styles.answerLabel}>
                        <Ionicons name="list" size={14} color={TEXT_MUTED} /> Options disponibles
                      </Text>
                      {q.options.map((option, optIndex) => (
                        <View 
                          key={optIndex} 
                          style={[
                            styles.optionItem,
                            option === q.correctAnswer && styles.optionItemCorrect,
                            option === q.userAnswer && !q.isCorrect && styles.optionItemWrong
                          ]}
                        >
                          <Ionicons 
                            name={
                              option === q.correctAnswer ? 'checkmark-circle' :
                              option === q.userAnswer ? 'close-circle' :
                              'ellipse-outline'
                            }
                            size={16}
                            color={
                              option === q.correctAnswer ? SUCCESS :
                              option === q.userAnswer ? DANGER :
                              TEXT_MUTED
                            }
                          />
                          <Text style={styles.optionText}>{option}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  {q.type === 'agree_disagree' && (
  <View style={styles.answerBlock}>
    <Text style={styles.answerLabel}>
      <Ionicons name="person" size={14} color={TEXT_MUTED} /> Réponse du participant
    </Text>
    <View style={[styles.answerBox, styles.answerBoxCorrect]}>
      <Text style={styles.answerText}>
        {q.userAnswer === 'agree' ? "D'accord ✓" : 
         q.userAnswer === 'disagree' ? "Pas d'accord ✗" : 
         'Pas de réponse'}
      </Text>
    </View>
    <View style={[styles.answerBox, { marginTop: 8, borderColor: PRIMARY }]}>
      <Text style={{ fontSize: 12, color: TEXT_MUTED }}>
        ℹ️ Question sans bonne/mauvaise réponse (opinion personnelle)
      </Text>
    </View>
  </View>
)}
                </View>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </View>
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
  },
  loadingText: {
    marginTop: 12,
    color: TEXT_MUTED,
    fontSize: 16,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: TEXT_MUTED,
    marginTop: 2,
  },

  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },

  // Score Card
  scoreCard: {
    backgroundColor: SURFACE,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: `${PRIMARY}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 4,
    borderColor: PRIMARY,
  },
  scoreNumber: {
    fontSize: 40,
    fontWeight: '800',
    color: PRIMARY,
  },
  scoreStats: {
    flexDirection: 'row',
    gap: 24,
  },
  scoreStat: {
    alignItems: 'center',
  },
  scoreStatDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  scoreStatNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  scoreStatLabel: {
    fontSize: 12,
    color: TEXT_MUTED,
  },

  // Subtheme Card
  subthemeCard: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: BORDER,
  },
  subthemeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  subthemeName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },

  // Question Card
  questionCard: {
    backgroundColor: CARD,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  questionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  questionType: {
    backgroundColor: SURFACE,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    flex: 1,
  },
  questionTypeText: {
    fontSize: 12,
    color: TEXT_MUTED,
    fontWeight: '600',
  },
  resultBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultBadgeCorrect: {
    backgroundColor: SUCCESS,
  },
  resultBadgeWrong: {
    backgroundColor: DANGER,
  },
  resultBadgeUnanswered: {
    backgroundColor: TEXT_MUTED,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 24,
    marginBottom: 16,
  },

  // Answers
  answersSection: {
    gap: 12,
  },
  answerBlock: {
    marginBottom: 8,
  },
  answerLabel: {
    fontSize: 13,
    color: TEXT_MUTED,
    marginBottom: 6,
    fontWeight: '600',
  },
  answerBox: {
    backgroundColor: SURFACE,
    borderWidth: 2,
    borderColor: BORDER,
    borderRadius: 8,
    padding: 12,
  },
  answerBoxCorrect: {
    borderColor: SUCCESS,
    backgroundColor: `${SUCCESS}10`,
  },
  answerBoxWrong: {
    borderColor: DANGER,
    backgroundColor: `${DANGER}10`,
  },
  answerBoxEmpty: {
    borderColor: TEXT_MUTED,
    backgroundColor: `${TEXT_MUTED}10`,
  },
  answerText: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },

  // Options
  optionsBlock: {
    marginTop: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: SURFACE,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: BORDER,
  },
  optionItemCorrect: {
    borderColor: SUCCESS,
    backgroundColor: `${SUCCESS}10`,
  },
  optionItemWrong: {
    borderColor: DANGER,
    backgroundColor: `${DANGER}10`,
  },
  optionText: {
    fontSize: 14,
    color: '#1F2937',
  },
  subthemeStats: {
  marginBottom: 16,
  backgroundColor: CARD,
  borderRadius: 12,
  padding: 12,
  borderWidth: 1,
  borderColor: BORDER,
},
subthemeScore: {
  fontSize: 16,
  fontWeight: '700',
  color: PRIMARY,
  marginBottom: 6,
},
subthemeStatsRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
},
subthemeStat: {
  fontSize: 14,
  fontWeight: '600',
},

});