// app/components/qrCode/QRCodeDisplay.js
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';


const PRIMARY = "#6C63FF";
const SUCCESS = "#28A745";
const SURFACE = "#FFFFFF";
const CARD = "#F5F7FB";
const BORDER = "#E6E8EF";
const TEXT_MUTED = "#6B7280";

const QRCodeDisplay = ({ quizId, quizTitle }) => {
  // ⭐ CORRECTION ICI - Utiliser l'URL actuelle du navigateur
  const getQuizUrl = () => {
    if (typeof window !== 'undefined') {
      // On est sur le web - utiliser l'URL actuelle
      const baseUrl = window.location.origin; // Ex: http://localhost:8081
      return `${baseUrl}/join?quizId=${quizId}`;
    }
    // Fallback pour mobile
    return `exp://192.168.1.1:8081/--/join?quizId=${quizId}`;
  };

  const quizUrl = getQuizUrl();

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(quizUrl);
    // ⭐ Remplacer Alert.alert par alert pour le web
    if (Platform.OS === 'web') {
      alert('✅ Lien copié !');
    } else {
      Alert.alert('✅ Copié !', 'Le lien a été copié dans le presse-papier');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="checkmark-circle" size={60} color={SUCCESS} />
        <Text style={styles.successTitle}>Quiz créé avec succès !</Text>
        <Text style={styles.quizTitle}>{quizTitle}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Scannez pour rejoindre</Text>
        <Text style={styles.sectionSubtitle}>
          Les participants peuvent scanner ce QR code
        </Text>
        
        <View style={styles.qrContainer}>
          <QRCode
            value={quizUrl}
            size={220}
            backgroundColor="white"
            color={PRIMARY}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ou partagez ce lien</Text>
        <View style={styles.urlContainer}>
          <Text style={styles.url} numberOfLines={1} ellipsizeMode="middle">
            {quizUrl}
          </Text>
        </View>

        <TouchableOpacity style={styles.copyButton} onPress={copyToClipboard}>
          <Ionicons name="copy-outline" size={20} color="#fff" />
          <Text style={styles.copyButtonText}>Copier le lien</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={20} color={PRIMARY} />
        <Text style={styles.infoText}>
          Les participants pourront rejoindre le quiz en utilisant ce lien ou en scannant le QR code
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F4F8',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: SUCCESS,
    marginTop: 12,
    marginBottom: 8,
  },
  quizTitle: {
    fontSize: 18,
    color: TEXT_MUTED,
    textAlign: 'center',
  },
  section: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: TEXT_MUTED,
    marginBottom: 20,
  },
  qrContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  urlContainer: {
    backgroundColor: CARD,
    padding: 12,
    borderRadius: 8,
    width: '100%',
    marginBottom: 16,
  },
  url: {
    fontSize: 12,
    color: PRIMARY,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  copyButton: {
    backgroundColor: PRIMARY,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  copyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  infoBox: {
    backgroundColor: '#F1EFFF',
    borderWidth: 1,
    borderColor: PRIMARY,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: TEXT_MUTED,
    lineHeight: 20,
  },
});

export default QRCodeDisplay;