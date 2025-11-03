// src/screens/QuizCreatedScreen.js
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import QRCodeDisplay from '../components/QRCodeDisplay';

const QuizCreatedScreen = ({ route, navigation }) => {
  const { quizId, quizTitle } = route.params;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.successText}>✅ Quiz créé avec succès !</Text>
      <Text style={styles.quizTitle}>{quizTitle}</Text>

      <QRCodeDisplay quizId={quizId} quizTitle={quizTitle} />

      <TouchableOpacity 
        style={styles.doneButton}
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.doneButtonText}>Terminer</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  successText: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#4CAF50',
  },
  quizTitle: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  doneButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    marginTop: 30,
    alignItems: 'center',
  },
  doneButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default QuizCreatedScreen;