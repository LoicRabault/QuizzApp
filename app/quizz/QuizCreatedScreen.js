// app/quiz/QuizCreatedScreen.js
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import QRCodeDisplay from '../../components/qrCode/QRCodeDisplay';

const PRIMARY = "#6C63FF";
const SURFACE = "#FFFFFF";
const BORDER = "#E6E8EF";

export default function QuizCreatedScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const { quizId, quizTitle } = params;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => router.replace('/admin/AdminHomeScreen')}
        >
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quiz créé</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <QRCodeDisplay quizId={quizId} quizTitle={quizTitle} />
      </ScrollView>

      <View style={styles.footer}>
        {/* 🧪 Bouton de test - pour développement */}
        <TouchableOpacity 
          style={styles.testButton}
          onPress={() => router.push(`/join?quizId=${quizId}`)}
        >
          <Ionicons name="eye-outline" size={18} color="#fff" />
          <Text style={styles.testButtonText}>Tester la page participant</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.doneButton}
          onPress={() => router.replace('/admin/AdminHomeScreen')}
        >
          <Text style={styles.doneButtonText}>Terminer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F4F8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    backgroundColor: SURFACE,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  testButton: {
    backgroundColor: '#FFA500',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  testButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  doneButton: {
    backgroundColor: PRIMARY,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});