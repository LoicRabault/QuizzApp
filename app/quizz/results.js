// app/quizz/results.js
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, doc, getDoc, onSnapshot } from 'firebase/firestore';
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
const WARNING = "#FFA500";
const DANGER = "#EF4444";
const GOLD = "#FFD700";
const SILVER = "#C0C0C0";
const BRONZE = "#CD7F32";
const SURFACE = "#FFFFFF";
const CARD = "#F5F7FB";
const BORDER = "#E6E8EF";
const TEXT_MUTED = "#6B7280";

export default function ResultsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const { quizId, participantName, resultId } = params;
  
  const [quiz, setQuiz] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  // Charger le quiz et les résultats
  useEffect(() => {
    loadQuizAndResults();
  }, [quizId]);

  const loadQuizAndResults = async () => {
    try {
      // Charger le quiz
      const quizDoc = await getDoc(doc(db, 'quizzes', quizId));
      if (quizDoc.exists()) {
        setQuiz({ id: quizDoc.id, ...quizDoc.data() });
      }

      // Écouter les résultats en temps réel
      const unsubscribe = onSnapshot(
        collection(db, 'quizzes', quizId, 'results'),
        (snapshot) => {
          const resultsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // Calculer les scores
          const resultsWithScores = resultsData.map(result => {
            const score = calculateScore(result, quizDoc.data());
            return { ...result, score };
          });

          // Trier par score décroissant
          resultsWithScores.sort((a, b) => b.score - a.score);

          setResults(resultsWithScores);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error('Erreur chargement:', error);
      setLoading(false);
    }
  };

  // Calculer le score d'un participant
 const calculateScore = (result, quizData) => {
  if (!result.answers || !quizData.subthemes) return 0;

  let correctAnswers = 0;
  let totalQuestions = 0;

  quizData.subthemes.forEach((subtheme, subIndex) => {
    subtheme.questions.forEach((question, qIndex) => {
      totalQuestions++;
      const answerKey = `${subIndex}-${qIndex}`;
      const userAnswer = result.answers[answerKey];
      
      if (question.type === 'agree_disagree') {
        // Pour agree_disagree, on compte comme répondu si "agree" ou "disagree"
        if (userAnswer === 'agree' || userAnswer === 'disagree') {
          correctAnswers++; // Toute réponse = 1 point (pas de bonne/mauvaise réponse)
        }
      } else if (question.type === 'open') {
        if (question.answer && userAnswer) {
          if (userAnswer.toLowerCase().trim() === question.answer.toLowerCase().trim()) {
            correctAnswers++;
          }
        }
      } else {
        // QCM et Vrai/Faux
        if (userAnswer === question.answer) {
          correctAnswers++;
        }
      }
    });
  });

  return totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
};

  // Trouver le résultat de l'utilisateur actuel
  const myResult = results.find(r => r.participantName === participantName);
  const myRank = results.findIndex(r => r.participantName === participantName) + 1;

  // Statistiques globales
  const averageScore = results.length > 0 
    ? Math.round(results.reduce((acc, r) => acc + r.score, 0) / results.length) 
    : 0;
  const highestScore = results.length > 0 ? Math.max(...results.map(r => r.score)) : 0;

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={styles.loadingText}>Chargement des résultats...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
    <View style={styles.header}>
  <TouchableOpacity 
    style={styles.closeButton}
    onPress={() => router.back()}  // 👈 retour à la page précédente
  >
    <Ionicons name="arrow-back" size={24} color="#333" /> 
  </TouchableOpacity>
  <Text style={styles.headerTitle}>Résultats</Text>
  <View style={{ width: 40 }} />
</View>


      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Hero Section - Mon résultat */}
        {myResult && (
          <View style={styles.heroCard}>
            <View style={styles.trophyCircle}>
              <Ionicons 
                name="trophy" 
                size={48} 
                color={myRank === 1 ? GOLD : myRank === 2 ? SILVER : myRank === 3 ? BRONZE : PRIMARY} 
              />
            </View>
            
            <Text style={styles.heroTitle}>Ton score</Text>
            <Text style={styles.heroScore}>{myResult.score}%</Text>
            
            <View style={styles.heroStats}>
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>#{myRank}</Text>
                <Text style={styles.heroStatLabel}>Classement</Text>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>{myResult.answeredCount}/{myResult.totalQuestions}</Text>
                <Text style={styles.heroStatLabel}>Réponses</Text>
              </View>
            </View>

            {/* Message de félicitations */}
            <View style={[
              styles.messageCard,
              myResult.score >= 80 && styles.messageCardSuccess,
              myResult.score < 50 && styles.messageCardWarning
            ]}>
              <Text style={styles.messageText}>
                {myResult.score >= 90 && '🎉 Excellent ! Tu maîtrises parfaitement le sujet !'}
                {myResult.score >= 80 && myResult.score < 90 && '👏 Très bon score ! Continue comme ça !'}
                {myResult.score >= 60 && myResult.score < 80 && '👍 Bon travail ! Encore quelques efforts.'}
                {myResult.score >= 50 && myResult.score < 60 && '📚 Pas mal, mais tu peux t\'améliorer.'}
                {myResult.score < 50 && '💪 Continue à réviser, tu vas progresser !'}
              </Text>
            </View>
          </View>
        )}

        {/* Statistiques globales */}
        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>📊 Statistiques</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Ionicons name="people" size={24} color={PRIMARY} />
              <Text style={styles.statNumber}>{results.length}</Text>
              <Text style={styles.statLabel}>Participants</Text>
            </View>

            <View style={styles.statBox}>
              <Ionicons name="analytics" size={24} color={WARNING} />
              <Text style={styles.statNumber}>{averageScore}%</Text>
              <Text style={styles.statLabel}>Moyenne</Text>
            </View>

            <View style={styles.statBox}>
              <Ionicons name="trending-up" size={24} color={SUCCESS} />
              <Text style={styles.statNumber}>{highestScore}%</Text>
              <Text style={styles.statLabel}>Meilleur score</Text>
            </View>
          </View>
        </View>

        {/* Classement */}
        <View style={styles.rankingCard}>
          <Text style={styles.sectionTitle}>🏆 Classement</Text>

          {results.map((result, index) => {
            const isMe = result.participantName === participantName;
            const rank = index + 1;
            
            // Couleur de la médaille
            let medalColor = TEXT_MUTED;
            let medalIcon = 'ribbon-outline';
            if (rank === 1) {
              medalColor = GOLD;
              medalIcon = 'trophy';
            } else if (rank === 2) {
              medalColor = SILVER;
              medalIcon = 'medal-outline';
            } else if (rank === 3) {
              medalColor = BRONZE;
              medalIcon = 'medal-outline';
            }

            return (
              <View 
                key={result.id}
                style={[
                  styles.rankingItem,
                  isMe && styles.rankingItemMe,
                  rank <= 3 && styles.rankingItemPodium
                ]}
              >
                {/* Rank */}
                <View style={styles.rankingRank}>
                  {rank <= 3 ? (
                    <Ionicons name={medalIcon} size={24} color={medalColor} />
                  ) : (
                    <Text style={styles.rankingRankText}>#{rank}</Text>
                  )}
                </View>

                {/* Info participant */}
                <View style={styles.rankingInfo}>
                  <View style={styles.rankingNameRow}>
                    <Text style={[
                      styles.rankingName,
                      isMe && styles.rankingNameMe
                    ]}>
                      {result.participantName}
                    </Text>
                    {isMe && (
                      <View style={styles.meBadge}>
                        <Text style={styles.meBadgeText}>Toi</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.rankingDetails}>
                    {result.answeredCount}/{result.totalQuestions} réponses
                  </Text>
                </View>

                {/* Score */}
                <View style={styles.rankingScore}>
                  <Text style={[
                    styles.rankingScoreText,
                    result.score >= 80 && styles.rankingScoreGood,
                    result.score < 50 && styles.rankingScoreBad
                  ]}>
                    {result.score}%
                  </Text>
                </View>

                {/* Barre de progression */}
                <View style={styles.progressBarSmall}>
                  <View 
                    style={[
                      styles.progressFillSmall,
                      { 
                        width: `${result.score}%`,
                        backgroundColor: result.score >= 80 ? SUCCESS : result.score >= 50 ? WARNING : DANGER
                      }
                    ]} 
                  />
                </View>
              </View>
            );
          })}
        </View>

        {/* Info quiz */}
        {quiz && (
          <View style={styles.quizInfoCard}>
            <Ionicons name="information-circle-outline" size={20} color={PRIMARY} />
            <View style={styles.quizInfoText}>
              <Text style={styles.quizInfoTitle}>{quiz.title}</Text>
              <Text style={styles.quizInfoDetails}>
                {quiz.subthemes?.length || 0} sous-thèmes · {' '}
                {quiz.subthemes?.reduce((acc, s) => acc + (s.questions?.length || 0), 0) || 0} questions
              </Text>
            </View>
          </View>
        )}
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
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },

  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
  },

  // Hero Card (Mon score)
  heroCard: {
    backgroundColor: SURFACE,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  trophyCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: `${PRIMARY}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 16,
    color: TEXT_MUTED,
    marginBottom: 8,
  },
  heroScore: {
    fontSize: 56,
    fontWeight: '800',
    color: PRIMARY,
    marginBottom: 20,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroStatItem: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  heroStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  heroStatLabel: {
    fontSize: 13,
    color: TEXT_MUTED,
    marginTop: 4,
  },
  heroDivider: {
    width: 1,
    height: 40,
    backgroundColor: BORDER,
  },
  messageCard: {
    backgroundColor: `${PRIMARY}15`,
    borderRadius: 12,
    padding: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: PRIMARY,
  },
  messageCardSuccess: {
    backgroundColor: `${SUCCESS}15`,
    borderColor: SUCCESS,
  },
  messageCardWarning: {
    backgroundColor: `${WARNING}15`,
    borderColor: WARNING,
  },
  messageText: {
    fontSize: 14,
    color: '#1F2937',
    textAlign: 'center',
    fontWeight: '600',
  },

  // Stats Card
  statsCard: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: BORDER,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: CARD,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: TEXT_MUTED,
    textAlign: 'center',
  },

  // Ranking Card
  rankingCard: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: BORDER,
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  rankingItemMe: {
    backgroundColor: `${PRIMARY}08`,
    borderColor: PRIMARY,
    borderWidth: 2,
  },
  rankingItemPodium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  rankingRank: {
    width: 40,
    alignItems: 'center',
  },
  rankingRankText: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT_MUTED,
  },
  rankingInfo: {
    flex: 1,
    marginLeft: 12,
  },
  rankingNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  rankingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  rankingNameMe: {
    color: PRIMARY,
    fontWeight: '700',
  },
  meBadge: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  meBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  rankingDetails: {
    fontSize: 13,
    color: TEXT_MUTED,
  },
  rankingScore: {
    marginLeft: 12,
  },
  rankingScoreText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  rankingScoreGood: {
    color: SUCCESS,
  },
  rankingScoreBad: {
    color: DANGER,
  },
  progressBarSmall: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: CARD,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  progressFillSmall: {
    height: '100%',
    borderBottomLeftRadius: 12,
  },

  // Quiz Info
  quizInfoCard: {
    flexDirection: 'row',
    backgroundColor: `${PRIMARY}08`,
    borderWidth: 1,
    borderColor: PRIMARY,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 20,
  },
  quizInfoText: {
    flex: 1,
  },
  quizInfoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  quizInfoDetails: {
    fontSize: 13,
    color: TEXT_MUTED,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: SURFACE,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  homeButton: {
    backgroundColor: PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  homeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});