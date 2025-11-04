import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { collection, deleteDoc, doc, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
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
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: "",
    message: "",
    type: "confirm",
    onConfirm: null,
  });

  const fetchQuizzes = async () => {
    try {
      const snapshot = await getDocs(collection(db, "quizzes"));
      setQuizzes(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      showModal("Erreur", "Impossible de charger les quiz.", "error");
    }
  };

  const showModal = (title, message, type = "confirm", onConfirm = null) => {
    setModalConfig({ title, message, type, onConfirm });
    setModalVisible(true);
  };

  const handleDelete = (id) => {
    showModal(
      "Supprimer le quiz",
      "Voulez-vous vraiment supprimer ce quiz ? Cette action est irréversible.",
      "confirm",
      async () => {
        try {
          await deleteDoc(doc(db, "quizzes", id));
          showModal("Succès", "Quiz supprimé avec succès ✅", "success");
          await fetchQuizzes();
        } catch (error) {
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
      {/* === HEADER === */}
      <LinearGradient
        colors={["#6366f1", "#3b82f6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tous les Quiz</Text>
        <View style={{ width: 32 }} />
      </LinearGradient>

      {/* === BARRE DE RECHERCHE === */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={20}
          color="#64748b"
          style={{ marginRight: 8 }}
        />
        <TextInput
          style={styles.input}
          placeholder="Rechercher un quiz..."
          value={filter}
          onChangeText={setFilter}
          placeholderTextColor="#94a3b8"
        />
      </View>

      {/* === LISTE === */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 60 }}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [
              styles.card,
              pressed && styles.cardPressed,
            ]}
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
            <View style={styles.quizInfo}>
              <Text style={styles.quizTitle}>{item.title}</Text>
  <Text style={styles.quizSubtitle}>
  {item.createdAt
    ? new Date(item.createdAt.seconds * 1000).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Date inconnue"}
</Text>


            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => handleDelete(item.id)}
              >
                <Ionicons name="trash-outline" size={22} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>Aucun quiz trouvé</Text>
            <Text style={styles.emptyText}>
              Créez ou importez un quiz pour le voir ici
            </Text>
          </View>
        }
      />

      {/* === MODALE === */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View
              style={[
                styles.modalIcon,
                modalConfig.type === "success" && { backgroundColor: "#22c55e" },
                modalConfig.type === "error" && { backgroundColor: "#ef4444" },
                modalConfig.type === "confirm" && { backgroundColor: "#f97316" },
              ]}
            >
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
                  <Pressable
                    style={[styles.modalButton, styles.modalButtonCancel]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.modalButtonTextCancel}>Annuler</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.modalButton, styles.modalButtonConfirm]}
                    onPress={() => {
                      setModalVisible(false);
                      modalConfig.onConfirm && modalConfig.onConfirm();
                    }}
                  >
                    <Text style={styles.modalButtonTextConfirm}>Supprimer</Text>
                  </Pressable>
                </>
              ) : (
                <Pressable
                  style={[styles.modalButton, styles.modalButtonConfirm]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.modalButtonTextConfirm}>OK</Text>
                </Pressable>
              )}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },

  // HEADER
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 5,
  },
  backButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 8,
    borderRadius: 12,
    marginBottom: 24
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.5,
  },

  // SEARCH
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: -20,
    marginBottom: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  input: { flex: 1, fontSize: 15, color: "#0f172a" },

  // CARD
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 18,
    marginHorizontal: 20,
    marginVertical: 8,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.15,
  },
  quizInfo: { flex: 1, marginRight: 10 },
  quizTitle: { fontSize: 17, fontWeight: "700", color: "#0f172a" },
  quizSubtitle: { fontSize: 13, color: "#64748b", marginTop: 4 },
  actions: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#fee2e2",
  },

  // EMPTY
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 80,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#475569",
    marginTop: 16,
  },
  emptyText: { color: "#94a3b8", fontSize: 14, marginTop: 6 },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 28,
    width: "90%",
    maxWidth: 380,
    alignItems: "center",
    elevation: 8,
  },
  modalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
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
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  modalButtonCancel: { backgroundColor: "#f1f5f9" },
  modalButtonConfirm: { backgroundColor: "#ef4444" },
  modalButtonTextCancel: {
    color: "#64748b",
    fontSize: 16,
    fontWeight: "600",
  },
  modalButtonTextConfirm: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
