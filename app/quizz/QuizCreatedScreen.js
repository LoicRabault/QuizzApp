// app/quizz/QuizCreatedScreen.js
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import QRCodeDisplay from '../../components/qrCode/QRCodeDisplay';

const PRIMARY = "#6C63FF";
const SUCCESS = "#10B981";
const SURFACE = "#FFFFFF";
const BACKGROUND = "#F8FAFC";
const TEXT = "#1E293B";
const TEXT_MUTED = "#64748B";

export default function QuizCreatedScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { quizId, quizTitle } = params;

  // Animation pour l'entrée
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Header simplifié */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => router.replace('/admin/AdminHomeScreen')}
        >
          <Ionicons name="close-circle-outline" size={28} color={TEXT_MUTED} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section succès */}
        <Animated.View 
          style={[
            styles.successSection,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={64} color={SUCCESS} />
          </View>
          <Text style={styles.successTitle}>Quiz créé avec succès ! 🎉</Text>
          <Text style={styles.successSubtitle}>
            Votre quiz est prêt à être partagé
          </Text>
        </Animated.View>

        {/* Info du quiz */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoIconCircle}>
              <Ionicons name="document-text" size={20} color={PRIMARY} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Titre du quiz</Text>
              <Text style={styles.infoValue}>{quizTitle}</Text>
            </View>
          </View>
          <View style={[styles.infoRow, { marginTop: 16 }]}>
            <View style={styles.infoIconCircle}>
              <Ionicons name="key" size={20} color={PRIMARY} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>ID du quiz</Text>
              <Text style={styles.infoValueMono}>{quizId}</Text>
            </View>
          </View>
        </View>

        {/* Section QR Code */}
        <View style={styles.qrSection}>
          <View style={styles.qrHeader}>
            <Ionicons name="qr-code" size={24} color={PRIMARY} />
            <Text style={styles.qrTitle}>Partager avec un QR Code</Text>
          </View>
          <Text style={styles.qrDescription}>
            Scannez ce code pour accéder directement au quiz
          </Text>
          <QRCodeDisplay quizId={quizId} quizTitle={quizTitle} />
        </View>

        {/* Actions rapides */}
        <View style={styles.actionsSection}>
          <Text style={styles.actionsTitle}>Actions rapides</Text>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => {
              router.push({
                pathname: '/admin/QuizResultsManagement',
                params: {
                  quizId: quizId,
                  quizTitle: quizTitle
                }
              });
            }}
          >
            <View style={styles.actionLeft}>
              <View style={[styles.actionIcon, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="bar-chart" size={24} color={SUCCESS} />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Résultats en temps réel</Text>
                <Text style={styles.actionDescription}>
                  Suivez les participants et leurs scores
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={TEXT_MUTED} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.replace('/admin/AdminHomeScreen')}
          >
            <View style={styles.actionLeft}>
              <View style={[styles.actionIcon, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="home" size={24} color={PRIMARY} />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>Retour à l'accueil</Text>
                <Text style={styles.actionDescription}>
                  Créer un nouveau quiz ou gérer les existants
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={TEXT_MUTED} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Footer avec CTA principal */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => {
            router.push({
              pathname: '/admin/QuizResultsManagement',
              params: {
                quizId: quizId,
                quizTitle: quizTitle
              }
            });
          }}
        >
          <Ionicons name="bar-chart" size={20} color="#fff" />
          <Text style={styles.primaryButtonText}>Voir les résultats</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => router.replace('/admin/AdminHomeScreen')}
        >
          <Text style={styles.secondaryButtonText}>Terminer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: BACKGROUND,
    alignItems: 'flex-end',
  },
  closeButton: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  successSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: SUCCESS,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: TEXT,
    textAlign: 'center',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: TEXT_MUTED,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_MUTED,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT,
  },
  infoValueMono: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT_MUTED,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  qrSection: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  qrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT,
    marginLeft: 10,
  },
  qrDescription: {
    fontSize: 14,
    color: TEXT_MUTED,
    marginBottom: 20,
  },
  actionsSection: {
    marginTop: 24,
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT,
    marginBottom: 12,
  },
  actionCard: {
    backgroundColor: SURFACE,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT,
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 13,
    color: TEXT_MUTED,
    lineHeight: 18,
  },
  footer: {
    backgroundColor: SURFACE,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButton: {
    backgroundColor: SUCCESS,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
    marginBottom: 10,
    shadowColor: SUCCESS,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: BACKGROUND,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  secondaryButtonText: {
    color: TEXT,
    fontSize: 15,
    fontWeight: '600',
  },
});