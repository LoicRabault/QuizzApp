import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { collection, deleteDoc, doc, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../../services/firebase";

export default function QuizListScreen() {
  const navigation = useNavigation();
  const [quizzes, setQuizzes] = useState([]);
  const [filter, setFilter] = useState("");

  // 🔄 Récupérer les quiz
  const fetchQuizzes = async () => {
    try {
      const snapshot = await getDocs(collection(db, "quizzes"));
      setQuizzes(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      Alert.alert("Erreur", "Impossible de charger les quiz.");
    }
  };

  // 🗑️ Supprimer un quiz
  const handleDelete = async (id) => {
    Alert.alert("Confirmation", "Supprimer ce quiz ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          await deleteDoc(doc(db, "quizzes", id));
          fetchQuizzes();
        },
      },
    ]);
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const filtered = quizzes.filter((q) =>
    q.title.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* === Header avec flèche de retour === */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tous les Quiz</Text>
        <View style={{ width: 24 }} /> {/* pour équilibrer */}
      </View>

      {/* === Barre de recherche === */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#64748b" style={{ marginRight: 6 }} />
        <TextInput
          style={styles.input}
          placeholder="Rechercher un quiz..."
          value={filter}
          onChangeText={setFilter}
          placeholderTextColor="#94a3b8"
        />
      </View>

      {/* === Liste des quiz === */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.quizTitle}>{item.title}</Text>
              <Text style={styles.quizSubtitle}>
                {item.theme || "Thème inconnu"}{" "}
                {item.subthemes?.length ? `• ${item.subthemes.join(", ")}` : ""}
              </Text>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => navigation.navigate("QuizFormScreen", { quiz: item })}
              >
                <Ionicons name="create-outline" size={22} color="#2563eb" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => handleDelete(item.id)}
              >
                <Ionicons name="trash-outline" size={22} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Aucun quiz pour le moment 🤷‍♂️</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },

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

  // === RECHERCHE ===
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 10,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  input: {
    flex: 1,
    color: "#0f172a",
    fontSize: 15,
  },

  // === CARTES ===
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  quizTitle: { fontSize: 17, fontWeight: "600", color: "#0f172a" },
  quizSubtitle: { color: "#64748b", fontSize: 13, marginTop: 2 },
  actions: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconButton: { padding: 4 },

  // === ÉTATS ===
  emptyText: {
    textAlign: "center",
    color: "#94a3b8",
    marginTop: 40,
    fontSize: 15,
  },
});
