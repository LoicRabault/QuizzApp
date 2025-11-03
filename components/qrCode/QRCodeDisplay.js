// src/components/QRCodeDisplay.js
import * as Clipboard from 'expo-clipboard';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { generateQuizUrl, shareQuizUrl } from '../services/qrCodeService';

const QRCodeDisplay = ({ quizId, quizTitle }) => {
  const quizUrl = generateQuizUrl(quizId);

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(quizUrl);
    Alert.alert('Copié !', 'Le lien a été copié dans le presse-papier');
  };

  const handleShare = async () => {
    await shareQuizUrl(quizId, quizTitle);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scannez pour rejoindre</Text>
      
      <View style={styles.qrContainer}>
        <QRCode
          value={quizUrl}
          size={250}
          backgroundColor="white"
          color="black"
        />
      </View>

      <View style={styles.urlContainer}>
        <Text style={styles.urlLabel}>Ou utilisez ce lien :</Text>
        <Text style={styles.url} numberOfLines={1}>
          {quizUrl}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={copyToClipboard}>
          <Text style={styles.buttonText}>📋 Copier le lien</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleShare}>
          <Text style={styles.buttonText}>📤 Partager</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  qrContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  urlContainer: {
    marginTop: 30,
    alignItems: 'center',
    width: '100%',
  },
  urlLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  url: {
    fontSize: 12,
    color: '#007AFF',
    backgroundColor: '#F0F0F0',
    padding: 10,
    borderRadius: 5,
    width: '100%',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 30,
    gap: 15,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default QRCodeDisplay;