// app/quiz/waiting.js
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
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
const SURFACE = "#FFFFFF";
const CARD = "#F5F7FB";
const BORDER = "#E6E8EF";
const TEXT_MUTED = "#6B7280";

export default function WaitingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const { quizId, participantName, resultId } = params;
  
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pulseAnim] = useState(new Animated.Value(1));

  // Animation du point qui pulse
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Écouter les participants en temps réel
  useEffect(() => {
    if (!quizId) return;

    const unsubscribe = onSnapshot(
      collection(db, 'quizzes', quizId, 'results'),
      (snapshot) => {
        const parts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setParticipants(parts);
        setLoading(false);
      },
      (error) => {
        console.error('Erreur écoute participants:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [quizId]);

  // Calculer les stats
  const totalParticipants = participants.length;
  const finishedParticipants = participants.filter(p => p.isFinished).length;
  const allFinished = totalParticipants > 0 && finishedParticipants === totalParticipants;

  // Si tout le monde a fini, afficher un message spécial
  useEffect(() => {
    if (allFinished && totalParticipants > 1) {
      setTimeout(() => {
        Alert.alert(
          '🎉 Tout le monde a terminé !',
          'Le quiz est terminé. Les résultats vont être affichés.',
          [
            {
              text: 'Voir les résultats',
              onPress: () => {
                // TODO: Naviguer vers l'écran des résultats
                router.replace({
                  pathname: '/quizz/results',
                  params: { quizId, participantName, resultId }
                });
              }
            }
          ]
        );
      }, 1000);
    }
  }, [allFinished, totalParticipants]);

  const handleBackToQuiz = () => {
    Alert.alert(
      'Retourner au quiz ?',
      'Tu pourras modifier tes réponses.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retourner',
          onPress: () => {
            router.back();
          }
        }
      ]
    );
  };

  const handleLeaveQuiz = () => {
    Alert.alert(
      'Quitter ?',
      'Es-tu sûr de vouloir quitter ? Tes réponses sont enregistrées.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Quitter',
          style: 'destructive',
          onPress: () => {
            router.replace('/');
          }
        }
      ]
    );
  };

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
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={handleLeaveQuiz}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          
          <View style={styles.participantBadge}>
            <Ionicons name="person" size={14} color={PRIMARY} />
            <Text style={styles.participantText}>{participantName}</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Icône principale avec animation */}
        <View style={styles.heroSection}>
          <Animated.View 
            style={[
              styles.heroIconContainer,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            <Ionicons name="checkmark-circle" size={80} color={SUCCESS} />
          </Animated.View>
          
          <Text style={styles.heroTitle}>Quiz terminé !</Text>
          <Text style={styles.heroSubtitle}>
            Tes réponses ont bien été enregistrées
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <View style={[styles.statIconCircle, { backgroundColor: `${SUCCESS}20` }]}>
                <Ionicons name="checkmark-done" size={24} color={SUCCESS} />
              </View>
              <Text style={styles.statNumber}>{finishedParticipants}</Text>
              <Text style={styles.statLabel}>Ont terminé</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <View style={[styles.statIconCircle, { backgroundColor: `${WARNING}20` }]}>
                <Ionicons name="hourglass-outline" size={24} color={WARNING} />
              </View>
              <Text style={styles.statNumber}>{totalParticipants - finishedParticipants}</Text>
              <Text style={styles.statLabel}>En cours</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <View style={[styles.statIconCircle, { backgroundColor: `${PRIMARY}20` }]}>
                <Ionicons name="people" size={24} color={PRIMARY} />
              </View>
              <Text style={styles.statNumber}>{totalParticipants}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>

          {/* Barre de progression */}
          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { 
                    width: `${totalParticipants > 0 ? (finishedParticipants / totalParticipants) * 100 : 0}%` 
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {finishedParticipants}/{totalParticipants} participants ont terminé
            </Text>
          </View>
        </View>

        {/* Liste des participants */}
        <View style={styles.participantsCard}>
          <View style={styles.participantsHeader}>
            <Ionicons name="people-outline" size={20} color={PRIMARY} />
            <Text style={styles.participantsTitle}>Participants</Text>
          </View>

          {participants.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color={TEXT_MUTED} />
              <Text style={styles.emptyText}>Aucun participant pour le moment</Text>
            </View>
          ) : (
            <View style={styles.participantsList}>
              {participants
                .sort((a, b) => {
                  // Mettre l'utilisateur actuel en premier
                  if (a.participantName === participantName) return -1;
                  if (b.participantName === participantName) return 1;
                  // Puis trier par statut (terminé en premier)
                  if (a.isFinished && !b.isFinished) return -1;
                  if (!a.isFinished && b.isFinished) return 1;
                  return 0;
                })
                .map((participant, index) => {
                  const isMe = participant.participantName === participantName;
                  const isFinished = participant.isFinished;

                  return (
                    <View 
                      key={participant.id} 
                      style={[
                        styles.participantItem,
                        isMe && styles.participantItemMe
                      ]}
                    >
                      <View style={styles.participantLeft}>
                        <View style={[
                          styles.participantAvatar,
                          isFinished && styles.participantAvatarFinished
                        ]}>
                          <Text style={styles.participantInitial}>
                            {participant.participantName?.charAt(0).toUpperCase() || '?'}
                          </Text>
                        </View>
                        
                        <View style={styles.participantInfo}>
                          <View style={styles.participantNameRow}>
                            <Text style={[
                              styles.participantName,
                              isMe && styles.participantNameMe
                            ]}>
                              {participant.participantName}
                            </Text>
                            {isMe && (
                              <View style={styles.meBadge}>
                                <Text style={styles.meBadgeText}>Toi</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.participantTime}>
                            {participant.completedAt?.toDate?.()?.toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            }) || 'En cours...'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.participantRight}>
                        {isFinished ? (
                          <View style={styles.statusBadgeFinished}>
                            <Ionicons name="checkmark-circle" size={20} color={SUCCESS} />
                          </View>
                        ) : (
                          <View style={styles.statusBadgePending}>
                            <View style={styles.pendingDot} />
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
            </View>
          )}
        </View>

        {/* Message d'attente */}
        {!allFinished && (
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={24} color={PRIMARY} />
            <Text style={styles.infoText}>
              Les résultats seront affichés quand tous les participants auront terminé.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Footer avec actions */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={handleBackToQuiz}
        >
          <Ionicons name="arrow-back-outline" size={20} color={PRIMARY} />
          <Text style={styles.secondaryButtonText}>Modifier mes réponses</Text>
        </TouchableOpacity>

        {allFinished && (
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => {
              // TODO: Naviguer vers les résultats
              router.push({
                pathname: '/quizz/results',
                params: { quizId, participantName, resultId }
              });
            }}
          >
            <Ionicons name="trophy-outline" size={20} color="#fff" />
            <Text style={styles.primaryButtonText}>Voir les résultats</Text>
          </TouchableOpacity>
        )}
      </View>
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
  },
  backButton: {
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
  participantText: {
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

  // Hero section
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  heroIconContainer: {
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: TEXT_MUTED,
    textAlign: 'center',
  },

  // Stats card
  statsCard: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: BORDER,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: TEXT_MUTED,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: BORDER,
    marginHorizontal: 8,
  },
  progressSection: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: CARD,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: SUCCESS,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: TEXT_MUTED,
    textAlign: 'center',
  },

  // Participants card
  participantsCard: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: BORDER,
  },
  participantsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  participantsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  participantsList: {
    gap: 12,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: CARD,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  participantItemMe: {
    backgroundColor: `${PRIMARY}08`,
    borderColor: PRIMARY,
  },
  participantLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  participantAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: TEXT_MUTED,
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantAvatarFinished: {
    backgroundColor: SUCCESS,
  },
  participantInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  participantInfo: {
    flex: 1,
  },
  participantNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  participantNameMe: {
    color: PRIMARY,
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
  participantTime: {
    fontSize: 13,
    color: TEXT_MUTED,
  },
  participantRight: {
    marginLeft: 12,
  },
  statusBadgeFinished: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadgePending: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pendingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: WARNING,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: TEXT_MUTED,
  },

  // Info card
  infoCard: {
    flexDirection: 'row',
    backgroundColor: `${PRIMARY}15`,
    borderWidth: 1,
    borderColor: PRIMARY,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: TEXT_MUTED,
    lineHeight: 20,
  },

  // Footer
  footer: {
    backgroundColor: SURFACE,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    gap: 12,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: PRIMARY,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: SUCCESS,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});