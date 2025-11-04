// app/join.js
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { db } from '../services/firebase';

const PRIMARY = "#6C63FF";
const SUCCESS = "#28A745";
const SURFACE = "#FFFFFF";
const BORDER = "#E6E8EF";
const TEXT_MUTED = "#6B7280";

export default function JoinQuizScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const { quizId } = params;
  
  const [participantName, setParticipantName] = useState('');
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  // Charger les infos du quiz
  useEffect(() => {
    loadQuizInfo();
  }, [quizId]);

  const loadQuizInfo = async () => {
    if (!quizId) {
      Alert.alert('Erreur', 'ID du quiz manquant');
      setLoading(false);
      return;
    }

    try {
      const quizDoc = await getDoc(doc(db, 'quizzes', quizId));
      
      if (quizDoc.exists()) {
        setQuiz({ id: quizDoc.id, ...quizDoc.data() });
      } else {
        Alert.alert('Erreur', 'Quiz introuvable');
      }
    } catch (error) {
      console.error('Erreur chargement quiz:', error);
      Alert.alert('Erreur', 'Impossible de charger le quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinQuiz = async () => {
    if (!participantName.trim()) {
      Alert.alert('Attention', 'Entre ton nom pour continuer 😊');
      return;
    }

    setJoining(true);

    try {
      // TODO: Ajouter le participant à la base de données (optionnel)
      
      // Rediriger vers l'écran de participation
      router.push({
        pathname: '/quizz/participate',
        params: {
          quizId: quizId,
          participantName: participantName.trim()
        }
      });
      
    } catch (error) {
      console.error('Erreur rejoindre quiz:', error);
      Alert.alert('Erreur', 'Impossible de rejoindre le quiz');
    } finally {
      setJoining(false);
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

  if (!quiz) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={TEXT_MUTED} />
        <Text style={styles.errorTitle}>Quiz introuvable</Text>
        <Text style={styles.errorText}>Ce quiz n'existe pas ou a été supprimé</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        {/* Header avec icône */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="school-outline" size={40} color={PRIMARY} />
          </View>
          <Text style={styles.welcomeText}>Rejoindre un quiz</Text>
        </View>

        {/* Card avec infos du quiz */}
        <View style={styles.quizCard}>
          <View style={styles.quizHeader}>
            <Ionicons name="document-text-outline" size={24} color={PRIMARY} />
            <Text style={styles.quizTitle}>{quiz.title}</Text>
          </View>
          
          <View style={styles.quizStats}>
            <View style={styles.statItem}>
              <Ionicons name="albums-outline" size={16} color={TEXT_MUTED} />
              <Text style={styles.statText}>
                {quiz.subthemes?.length || 0} sous-thème{(quiz.subthemes?.length || 0) > 1 ? 's' : ''}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="help-circle-outline" size={16} color={TEXT_MUTED} />
              <Text style={styles.statText}>
                {quiz.subthemes?.reduce((acc, s) => acc + (s.questions?.length || 0), 0) || 0} questions
              </Text>
            </View>
          </View>
        </View>

        {/* Input nom */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>
            Comment tu t'appelles ? <Text style={{ color: PRIMARY }}>*</Text>
          </Text>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color={TEXT_MUTED} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Ton prénom ou pseudo"
              value={participantName}
              onChangeText={setParticipantName}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={handleJoinQuiz}
            />
          </View>
        </View>

        {/* Bouton rejoindre */}
        <TouchableOpacity 
          style={[styles.joinButton, joining && styles.joinButtonDisabled]}
          onPress={handleJoinQuiz}
          disabled={joining}
        >
          {joining ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="log-in-outline" size={20} color="#fff" />
              <Text style={styles.joinButtonText}>Rejoindre le quiz</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Info créateur */}
        <View style={styles.footer}>
          <Ionicons name="information-circle-outline" size={16} color={TEXT_MUTED} />
          <Text style={styles.footerText}>
            Quiz créé le {quiz.createdAt?.toDate?.()?.toLocaleDateString('fr-FR') || 'N/A'}
          </Text>
        </View>
      </View>
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
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  
  // Header
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${PRIMARY}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
  },

  // Quiz card
  quizCard: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 20,
    marginBottom: 24,
  },
  quizHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  quizTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 12,
    flex: 1,
  },
  quizStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    color: TEXT_MUTED,
    fontSize: 14,
  },

  // Input
  inputSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SURFACE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
  },

  // Button
  joinButton: {
    backgroundColor: SUCCESS,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  joinButtonDisabled: {
    opacity: 0.6,
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  footerText: {
    color: TEXT_MUTED,
    fontSize: 13,
  },

  // Loading & Error
  loadingText: {
    marginTop: 12,
    color: TEXT_MUTED,
    fontSize: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    color: TEXT_MUTED,
    fontSize: 14,
    textAlign: 'center',
  },
});