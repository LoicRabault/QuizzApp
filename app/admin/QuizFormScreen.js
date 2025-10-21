import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  FlatList,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons"; // ✅ Pour la flèche
import { collection, addDoc } from "firebase/firestore";
import { db } from "../services/firebase";

export default function QuizFormScreen() {
  const navigation = useNavigation();

  // === Quiz global ===
  const [title, setTitle] = useState("");
  const [theme, setTheme] = useState("");
  const [subthemes, setSubthemes] = useState([""]);

  // === Question en cours ===
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [answer, setAnswer] = useState("");

  // === Liste finale des questions ===
  const [questions, setQuestions] = useState([]);

  // 🧩 Ajouter une question
  const handleAddQuestion = () => {
    if (!question || !answer) {
      Alert.alert("Erreur", "Merci de remplir la question et la réponse correcte.");
      return;
    }

    setQuestions([...questions, { question, options, answer }]);
    setQuestion("");
    setOptions(["", "", "", ""]);
    setAnswer("");
  };

  // 💾 Sauvegarder le quiz complet
  const handleSaveQuiz = async () => {
    if (!title || !theme || questions.length === 0) {
      Alert.alert("Erreur", "Merci de compléter le titre, le thème et au moins une question.");
      return;
    }

    try {
      await addDoc(collection(db, "quizzes"), {
        title,
        theme,
        subthemes: subthemes.filter((s) => s.trim() !== ""),
        questions,
        createdAt: new Date(),
      });
      Alert.alert("✅ Quiz enregistré avec succès !");
      navigation.goBack();
    } catch (error) {
      Alert.alert("Erreur", error.message);
    }
  };

  return (
    <View style={styles.container}>
      {/* === Header clair avec flèche de retour === */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Création d’un Quiz</Text>
        <View style={{ width: 24 }} /> {/* espace vide pour équilibrer */}
      </View>

      <ScrollView contentContainerStyle={{ alignItems: "center", paddingBottom: 40 }}>
        <View style={styles.card}>
          <Text style={styles.icon}>🧩</Text>
          <Text style={styles.title}>Configurer votre Quiz</Text>

          {/* === Infos globales du quiz === */}
          <TextInput
            style={styles.input}
            placeholder="Titre du quiz"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor="#666"
          />

          <TextInput
            style={styles.input}
            placeholder="Thème principal"
            value={theme}
            onChangeText={setTheme}
            placeholderTextColor="#666"
          />

          <Text style={styles.subtitle}>Sous-thèmes :</Text>
          {subthemes.map((st, i) => (
            <TextInput
              key={i}
              style={styles.input}
              placeholder={`Sous-thème ${i + 1}`}
              value={st}
              onChangeText={(txt) => {
                const updated = [...subthemes];
                updated[i] = txt;
                setSubthemes(updated);
              }}
              placeholderTextColor="#666"
            />
          ))}

          <TouchableOpacity
            onPress={() => setSubthemes([...subthemes, ""])}
            style={styles.smallButton}
          >
            <Text style={styles.smallButtonText}>➕ Ajouter un sous-thème</Text>
          </TouchableOpacity>

          {/* === Ajout de question === */}
          <Text style={styles.sectionTitle}>Nouvelle question</Text>
          <TextInput
            style={styles.input}
            placeholder="Énoncé de la question"
            value={question}
            onChangeText={setQuestion}
            placeholderTextColor="#666"
          />

          <Text style={styles.subtitle}>Options :</Text>
          {options.map((opt, i) => (
            <TextInput
              key={i}
              style={styles.input}
              placeholder={`Option ${i + 1}`}
              value={opt}
              onChangeText={(txt) => {
                const updated = [...options];
                updated[i] = txt;
                setOptions(updated);
              }}
              placeholderTextColor="#666"
            />
          ))}

          <TextInput
            style={styles.input}
            placeholder="Réponse correcte"
            value={answer}
            onChangeText={setAnswer}
            placeholderTextColor="#666"
          />

          <TouchableOpacity style={styles.addQuestionBtn} onPress={handleAddQuestion}>
            <Text style={styles.addQuestionText}>➕ Ajouter la question</Text>
          </TouchableOpacity>

          {/* === Liste des questions ajoutées === */}
          {questions.length > 0 && (
            <View style={styles.questionsList}>
              <Text style={styles.subtitle}>Questions ajoutées :</Text>
              <FlatList
                data={questions}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item, index }) => (
                  <View style={styles.questionItem}>
                    <Text style={styles.questionTitle}>
                      {index + 1}. {item.question}
                    </Text>
                    <Text style={styles.questionAnswer}>✅ {item.answer}</Text>
                  </View>
                )}
              />
            </View>
          )}

          <TouchableOpacity style={styles.saveBtn} onPress={handleSaveQuiz}>
            <Text style={styles.saveBtnText}>💾 Enregistrer le quiz complet</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  // === HEADER ===
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
  },

  // === CONTENU ===
  card: {
    backgroundColor: "#fff",
    width: "95%",
    maxWidth: 700,
    borderRadius: 16,
    padding: 24,
    marginVertical: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  icon: {
    fontSize: 38,
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 20,
  },
  subtitle: {
    alignSelf: "flex-start",
    fontWeight: "600",
    color: "#334155",
    marginTop: 10,
    marginBottom: 8,
  },
  input: {
    width: "100%",
    backgroundColor: "#f1f5f9",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    color: "#111",
    marginBottom: 10,
  },
  sectionTitle: {
    alignSelf: "flex-start",
    fontWeight: "700",
    color: "#0f172a",
    fontSize: 18,
    marginTop: 20,
    marginBottom: 6,
  },
  smallButton: {
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  smallButtonText: {
    color: "#2563eb",
    fontWeight: "600",
  },
  addQuestionBtn: {
    backgroundColor: "#3b82f6",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 8,
  },
  addQuestionText: {
    color: "#fff",
    fontWeight: "600",
  },
  questionsList: {
    width: "100%",
    marginTop: 20,
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    padding: 10,
  },
  questionItem: {
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 6,
  },
  questionTitle: {
    fontSize: 15,
    color: "#1e293b",
    fontWeight: "500",
  },
  questionAnswer: {
    fontSize: 13,
    color: "#22c55e",
  },
  saveBtn: {
    width: "100%",
    backgroundColor: "#16a34a",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  saveBtnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
