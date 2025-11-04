import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { collection, deleteDoc, doc, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../../services/firebase";

export default function QuizListScreen() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState([]);
  const [filter, setFilter] = useState("");
  
  // États pour la modale
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: "",
    message: "",
    type: "confirm", // "confirm" ou "success" ou "error"
    onConfirm: null,
  });

  // 🔄 Récupérer les quiz
  const fetchQuizzes = async () => {
    try {
      const snapshot = await getDocs(collection(db, "quizzes"));
      setQuizzes(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      showModal("Erreur", "Impossible de charger les quiz.", "error");
    }
  };

  // Fonction pour afficher la modale
  const showModal = (title, message, type = "confirm", onConfirm = null) => {
    setModalConfig({ title, message, type, onConfirm });
    setModalVisible(true);
  };

  // 🗑️ Supprimer un quiz
  const handleDelete = async (id) => {
    if (!id) {
      showModal("Erreur", "ID de quiz invalide", "error");
      return;
    }

    showModal(
      "Confirmation",
      "Êtes-vous sûr de vouloir supprimer ce quiz ?",
      "confirm",
      async () => {
        try {
          await deleteDoc(doc(db, "quizzes", id));
          showModal("Succès", "Quiz supprimé avec succès ✅", "success");
          await fetchQuizzes();
        } catch (error) {
          console.error("Erreur lors de la suppression:", error);
          showModal("Erreur", `Impossible de supprimer: ${error.message}`, "error");
        }
      }
    );
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tous les Quiz</Text>
        <View style={{ width: 24 }} />
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
                onPress={() =>
                  router.push({
                    pathname: "/quizz/QuizCreatedScreen",
                    params: {
                      quizId: item.id,
                      quizTitle: item.title,
                    },
                  })
                }
              >
                <Ionicons name="eye-outline" size={22} color="#2563eb" />
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

      {/* === MODALE PERSONNALISÉE === */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Icône selon le type */}
            <View style={[
              styles.modalIcon,
              modalConfig.type === "success" && styles.modalIconSuccess,
              modalConfig.type === "error" && styles.modalIconError,
              modalConfig.type === "confirm" && styles.modalIconConfirm,
            ]}>
              <Ionicons
                name={
                  modalConfig.type === "success"
                    ? "checkmark-circle"
                    : modalConfig.type === "error"
                    ? "alert-circle"
                    : "help-circle"
                }
                size={48}
                color="#fff"
              />
            </View>

            <Text style={styles.modalTitle}>{modalConfig.title}</Text>
            <Text style={styles.modalMessage}>{modalConfig.message}</Text>

            <View style={styles.modalButtons}>
              {modalConfig.type === "confirm" ? (
                <>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonCancel]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.modalButtonTextCancel}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonConfirm]}
                    onPress={() => {
                      setModalVisible(false);
                      if (modalConfig.onConfirm) {
                        modalConfig.onConfirm();
                      }
                    }}
                  >
                    <Text style={styles.modalButtonTextConfirm}>Supprimer</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSingle]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalButtonTextConfirm}>OK</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
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

  // === MODALE ===
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "90%",
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  modalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  modalIconSuccess: {
    backgroundColor: "#22c55e",
  },
  modalIconError: {
    backgroundColor: "#ef4444",
  },
  modalIconConfirm: {
    backgroundColor: "#f97316",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 15,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  modalButtonCancel: {
    backgroundColor: "#f1f5f9",
  },
  modalButtonConfirm: {
    backgroundColor: "#ef4444",
  },
  modalButtonSingle: {
    backgroundColor: "#3b82f6",
  },
  modalButtonTextCancel: {
    color: "#64748b",
    fontSize: 16,
    fontWeight: "600",
  },
  modalButtonTextConfirm: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});