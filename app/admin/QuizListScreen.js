import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useFocusEffect } from "expo-router";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  addDoc,
  serverTimestamp,
  getDoc,
  getCountFromServer,
  writeBatch,              // 🆕
} from "firebase/firestore";
import { useEffect, useState, useCallback } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
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
  const [duplicateModal, setDuplicateModal] = useState({
    visible: false,
    quizId: null,
    newTitle: "",
  });

  const showModal = (title, message, type = "confirm", onConfirm = null) => {
    setModalConfig({ title, message, type, onConfirm });
    setModalVisible(true);
  };

  // === Charger les quiz + compter les participants depuis /results ===
  const fetchQuizzes = useCallback(async () => {
    try {
      const snapshot = await getDocs(collection(db, "quizzes"));
      const quizzesWithCount = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data() || {};
          let participantsCount = 0;
          try {
            const countSnap = await getCountFromServer(
              collection(db, "quizzes", docSnap.id, "results")
            );
            participantsCount = countSnap.data().count || 0;
          } catch {
            participantsCount = 0;
          }
          return { id: docSnap.id, ...data, participantsCount };
        })
      );
      setQuizzes(quizzesWithCount);
    } catch (error) {
      showModal("Erreur", "Impossible de charger les quiz.", "error");
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchQuizzes(); }, [fetchQuizzes]));
  useEffect(() => { fetchQuizzes(); }, [fetchQuizzes]);

  // === Supprimer un quiz ===
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

  // === 🆕 Vider les participants (supprime tous les docs de /results) ===
  const handleClearParticipants = (quizId) => {
    showModal(
      "Réinitialiser les participants",
      "Supprimer tous les participants et leurs résultats pour ce quiz ?",
      "confirm",
      async () => {
        try {
          const resultsCol = collection(db, "quizzes", quizId, "results");
          const resultsSnap = await getDocs(resultsCol);
          if (resultsSnap.empty) {
            showModal("Info", "Aucun participant à supprimer.", "success");
            return;
          }
          const batch = writeBatch(db);
          resultsSnap.forEach((d) => batch.delete(d.ref));
          await batch.commit();

          showModal("Succès", "Tous les participants ont été supprimés ✅", "success");
          await fetchQuizzes(); // met à jour le compteur
        } catch (e) {
          showModal("Erreur", `Impossible de supprimer les participants : ${e.message}`, "error");
        }
      }
    );
  };

  // === Dupliquer un quiz (copie doc & subthemes, sans results) ===
  const handleDuplicate = async (quizId, newTitle) => {
    try {
      const quizRef = doc(db, "quizzes", quizId);
      const quizSnap = await getDoc(quizRef);
      if (!quizSnap.exists()) throw new Error("Quiz introuvable");

      const original = quizSnap.data() || {};
      const { createdAt, participantsCount, ...rest } = original;

      await addDoc(collection(db, "quizzes"), {
        ...rest,
        title: newTitle,
        createdAt: serverTimestamp(),
      });

      showModal("Succès", "Quiz dupliqué avec succès ✅", "success");
      setDuplicateModal({ visible: false, quizId: null, newTitle: "" });
      await fetchQuizzes();
    } catch (error) {
      showModal("Erreur", `Impossible de dupliquer: ${error.message}`, "error");
    }
  };

  const filtered = quizzes.filter((q) =>
    (q.title || "").toLowerCase().includes(filter.toLowerCase())
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
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tous les Quiz</Text>
        <View style={{ width: 32 }} />
      </LinearGradient>

      {/* === RECHERCHE === */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#64748b" style={{ marginRight: 8 }} />
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
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() =>
              router.push({
                pathname: "/quizz/QuizCreatedScreen",
                params: { quizId: item.id, quizTitle: item.title },
              })
            }
          >
            <View style={styles.quizInfo}>
              <Text style={styles.quizTitle}>{item.title}</Text>
              <Text style={styles.quizSubtitle}>
                {item.createdAt && item.createdAt.seconds
                  ? new Date(item.createdAt.seconds * 1000).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "Date inconnue"}
              </Text>
              <Text style={styles.quizParticipants}>
                👥 {item.participantsCount ?? 0} participant(s)
              </Text>
            </View>

            <View style={styles.actions}>
              {/* 🆕 Vider participants */}
              <TouchableOpacity
                style={[styles.iconButton, { backgroundColor: "#fef6e0ff" }]}
                onPress={() => handleClearParticipants(item.id)}
              >
                <Ionicons name="people-outline" size={20} color="#c74402ff" />
              </TouchableOpacity>

              {/* Modifier */}
              <TouchableOpacity
                style={[styles.iconButton, { backgroundColor: "#dbeafe" }]}
                onPress={() =>
                  router.push({
                    pathname: "/admin/QuizFormScreen",
                    params: { quizId: item.id },
                  })
                }
              >
                <Ionicons name="create-outline" size={20} color="#2563eb" />
              </TouchableOpacity>

              {/* Dupliquer */}
              <TouchableOpacity
                style={[styles.iconButton, { backgroundColor: "#fef3c7" }]}
                onPress={() =>
                  setDuplicateModal({ visible: true, quizId: item.id, newTitle: "" })
                }
              >
                <Ionicons name="copy-outline" size={20} color="#f59e0b" />
              </TouchableOpacity>

              {/* Supprimer quiz */}
              <TouchableOpacity
                style={[styles.iconButton, { backgroundColor: "#fee2e2" }]}
                onPress={() => handleDelete(item.id)}
              >
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
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

      {/* === MODALE CONFIRMATION / SUCCÈS === */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
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
                    <Text style={styles.modalButtonTextConfirm}>Confirmer</Text>
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

      {/* === MODALE DUPLICATION === */}
      <Modal
        animationType="fade"
        transparent
        visible={duplicateModal.visible}
        onRequestClose={() =>
          setDuplicateModal({ visible: false, quizId: null, newTitle: "" })
        }
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() =>
            setDuplicateModal({ visible: false, quizId: null, newTitle: "" })
          }
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Dupliquer le quiz</Text>
            <Text style={styles.modalMessage}>Saisissez le nouveau thème :</Text>
            <TextInput
              style={styles.input}
              placeholder="Nouveau thème du quiz..."
              value={duplicateModal.newTitle}
              onChangeText={(text) =>
                setDuplicateModal((prev) => ({ ...prev, newTitle: text }))
              }
            />
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() =>
                  setDuplicateModal({ visible: false, quizId: null, newTitle: "" })
                }
              >
                <Text style={styles.modalButtonTextCancel}>Annuler</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={() => {
                  if (!duplicateModal.newTitle.trim()) {
                    Alert.alert("Erreur", "Veuillez saisir un titre.");
                    return;
                  }
                  handleDuplicate(duplicateModal.quizId, duplicateModal.newTitle);
                }}
              >
                <Text style={styles.modalButtonTextConfirm}>Dupliquer</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
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
    marginBottom: 24,
  },
  headerTitle: { fontSize: 26, fontWeight: "900", color: "#fff", letterSpacing: -0.5 },
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
  cardPressed: { transform: [{ scale: 0.98 }], shadowOpacity: 0.15 },
  quizInfo: { flex: 1, marginRight: 10 },
  quizTitle: { fontSize: 17, fontWeight: "700", color: "#0f172a" },
  quizSubtitle: { fontSize: 13, color: "#64748b", marginTop: 4 },
  quizParticipants: { fontSize: 13, color: "#475569", marginTop: 4 },
  actions: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconButton: { padding: 6, borderRadius: 8 },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 80,
    paddingHorizontal: 24,
  },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#475569", marginTop: 16 },
  emptyText: { color: "#94a3b8", fontSize: 14, marginTop: 6 },
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
  modalTitle: { fontSize: 22, fontWeight: "800", color: "#0f172a", marginBottom: 8, textAlign: "center" },
  modalMessage: { fontSize: 15, color: "#64748b", textAlign: "center", marginBottom: 24, lineHeight: 22 },
  modalButtons: { flexDirection: "row", gap: 12, width: "100%" },
  modalButton: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  modalButtonCancel: { backgroundColor: "#f1f5v9".replace("v","9") },
  modalButtonConfirm: { backgroundColor: "#2563eb" },
  modalButtonTextCancel: { color: "#64748b", fontSize: 16, fontWeight: "600" },
  modalButtonTextConfirm: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
