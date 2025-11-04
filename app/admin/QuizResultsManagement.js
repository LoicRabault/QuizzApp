// app/admin/QuizResultsManagement.js
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
const SURFACE = "#FFFFFF";
const CARD = "#F5F7FB";
const BORDER = "#E6E8EF";
const TEXT_MUTED = "#6B7280";

export default function QuizResultsManagement() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const { quizId, quizTitle } = params;
  
  const [quiz, setQuiz] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

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
const handleExportCSV = async () => {
  if (results.length === 0) {
    Alert.alert('Aucune donnée', 'Il n\'y a pas de résultats à exporter');
    return;
  }

  Alert.alert(
    'Exporter les résultats',
    'Quel type d\'export souhaitez-vous ?',
    [
      {
        text: 'Annuler',
        style: 'cancel'
      },
      {
        text: 'Export simple',
        onPress: async () => {
          const result = await exportResultsToCSV(quiz, results, quizTitle);
          if (result.success) {
            Alert.alert('Succès', result.message);
          } else {
            Alert.alert('Erreur', result.message);
          }
        }
      },
      {
        text: 'Export détaillé',
        onPress: async () => {
          const result = await exportDetailedResultsToCSV(quiz, results, quizTitle);
          if (result.success) {
            Alert.alert('Succès', result.message);
          } else {
            Alert.alert('Erreur', result.message);
          }
        }
      }
    ]
  );
};
  const calculateScore = (result, quizData) => {
    if (!result.answers || !quizData.subthemes) return 0;

    let correctAnswers = 0;
    let totalQuestions = 0;

    quizData.subthemes.forEach((subtheme, subIndex) => {
      subtheme.questions.forEach((question, qIndex) => {
        totalQuestions++;
        const answerKey = `${subIndex}-${qIndex}`;
        const userAnswer = result.answers[answerKey];
        
        if (question.type === 'open') {
          if (question.answer && userAnswer) {
            if (userAnswer.toLowerCase().trim() === question.answer.toLowerCase().trim()) {
              correctAnswers++;
            }
          }
        } else {
          if (userAnswer === question.answer) {
            correctAnswers++;
          }
        }
      });
    });

    return totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  };

  // Statistiques
  const totalParticipants = results.length;
  const finishedParticipants = results.filter(r => r.isFinished).length;
  const averageScore = results.length > 0 
    ? Math.round(results.reduce((acc, r) => acc + r.score, 0) / results.length) 
    : 0;

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

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
          <Text style={styles.headerTitle}>Résultats du quiz</Text>
          <Text style={styles.headerSubtitle}>{quizTitle}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Statistiques globales */}
        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>📊 Vue d'ensemble</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Ionicons name="people" size={28} color={PRIMARY} />
              <Text style={styles.statNumber}>{totalParticipants}</Text>
              <Text style={styles.statLabel}>Participants</Text>
            </View>

            <View style={styles.statBox}>
              <Ionicons name="checkmark-done" size={28} color={SUCCESS} />
              <Text style={styles.statNumber}>{finishedParticipants}</Text>
              <Text style={styles.statLabel}>Terminés</Text>
            </View>

            <View style={styles.statBox}>
              <Ionicons name="analytics" size={28} color={WARNING} />
              <Text style={styles.statNumber}>{averageScore}%</Text>
              <Text style={styles.statLabel}>Moyenne</Text>
            </View>
          </View>
        </View>

        {/* Liste des participants */}
        <View style={styles.participantsCard}>
          <Text style={styles.sectionTitle}>👥 Participants</Text>

          {results.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color={TEXT_MUTED} />
              <Text style={styles.emptyTitle}>Aucun participant</Text>
              <Text style={styles.emptyText}>
                Les résultats apparaîtront ici quand des participants auront terminé le quiz
              </Text>
            </View>
          ) : (
            results.map((result, index) => (
              <TouchableOpacity
                key={result.id}
                style={styles.participantCard}
                onPress={() => {
                  router.push({
                    pathname: '/admin/ParticipantDetails',
                    params: {
                      quizId: quizId,
                      quizTitle: quizTitle,
                      resultId: result.id,
                      participantName: result.participantName
                    }
                  });
                }}
              >
                {/* Header du participant */}
                <View style={styles.participantHeader}>
                  <View style={styles.participantLeft}>
                    {/* Rang */}
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankText}>#{index + 1}</Text>
                    </View>

                    {/* Avatar */}
                    <View style={[
                      styles.avatar,
                      result.score >= 80 && styles.avatarSuccess,
                      result.score < 50 && styles.avatarDanger
                    ]}>
                      <Text style={styles.avatarText}>
                        {result.participantName?.charAt(0).toUpperCase() || '?'}
                      </Text>
                    </View>

                    {/* Info */}
                    <View style={styles.participantInfo}>
                      <Text style={styles.participantName}>{result.participantName}</Text>
                      <Text style={styles.participantDate}>
                        {result.completedAt?.toDate?.()?.toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) || 'En cours...'}
                      </Text>
                    </View>
                  </View>

                  {/* Score */}
                  <View style={styles.participantRight}>
                    <Text style={[
                      styles.scoreText,
                      result.score >= 80 && styles.scoreSuccess,
                      result.score < 50 && styles.scoreDanger
                    ]}>
                      {result.score}%
                    </Text>
                    <Ionicons name="chevron-forward" size={20} color={TEXT_MUTED} />
                  </View>
                </View>

                {/* Détails rapides */}
                <View style={styles.participantDetails}>
                  <View style={styles.detailItem}>
                    <Ionicons name="checkbox-outline" size={16} color={TEXT_MUTED} />
                    <Text style={styles.detailText}>
                      {result.answeredCount}/{result.totalQuestions} réponses
                    </Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Ionicons 
                      name={result.isFinished ? "checkmark-circle" : "time-outline"} 
                      size={16} 
                      color={result.isFinished ? SUCCESS : WARNING} 
                    />
                    <Text style={styles.detailText}>
                      {result.isFinished ? 'Terminé' : 'En cours'}
                    </Text>
                  </View>
                </View>

                {/* Barre de progression */}
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      { 
                        width: `${result.score}%`,
                        backgroundColor: result.score >= 80 ? SUCCESS : result.score >= 50 ? WARNING : DANGER
                      }
                    ]} 
                  />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Bouton export (futur) */}
        <View style={styles.actionsCard}>
    <TouchableOpacity 
  style={styles.actionButton}
  onPress={handleExportCSV} // ✅ Ajoute l'action
>
  <Ionicons name="download-outline" size={20} color={PRIMARY} />
  <Text style={styles.actionButtonText}>Exporter en CSV</Text>
</TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.actionButtonSecondary]}
            onPress={() => {
              router.push({
                pathname: '/quizz/results',
                params: { 
                  quizId, 
                  participantName: 'Admin',
                  resultId: 'admin' 
                }
              });
            }}
          >
            <Ionicons name="trophy-outline" size={20} color={WARNING} />
            <Text style={styles.actionButtonText}>Voir le classement</Text>
          </TouchableOpacity>
        </View>
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

  // Section title
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
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
    fontSize: 28,
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

  // Participants Card
  participantsCard: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: BORDER,
  },
  participantCard: {
    backgroundColor: CARD,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  participantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  participantLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: TEXT_MUTED,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarSuccess: {
    backgroundColor: SUCCESS,
  },
  avatarDanger: {
    backgroundColor: DANGER,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  participantDate: {
    fontSize: 13,
    color: TEXT_MUTED,
  },
  participantRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
  },
  scoreSuccess: {
    color: SUCCESS,
  },
  scoreDanger: {
    color: DANGER,
  },
  participantDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: TEXT_MUTED,
  },
  progressBar: {
    height: 6,
    backgroundColor: BORDER,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: TEXT_MUTED,
    textAlign: 'center',
    maxWidth: 280,
  },

  // Actions
  actionsCard: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: BORDER,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: `${PRIMARY}15`,
    borderWidth: 1,
    borderColor: PRIMARY,
  },
  actionButtonSecondary: {
    backgroundColor: `${WARNING}15`,
    borderColor: WARNING,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
});