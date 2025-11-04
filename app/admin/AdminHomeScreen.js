import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";

import { auth, db } from "../../services/firebase";

export default function AdminHomeScreen() {
  const router = useRouter();
  const [recentQuizzes, setRecentQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [userName, setUserName] = useState("Admin");
  const [scaleAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    // Récupérer le nom de l'utilisateur
    const user = auth.currentUser;
    if (user) {
      setUserName(user.displayName || user.email?.split('@')[0] || "Admin");
    }
  }, []);

  const handleLogout = async () => {
    setModalVisible(true);
  };

  const confirmLogout = async () => {
    try {
      await signOut(auth);
      setModalVisible(false);
      router.replace("/auth/LoginScreen");
    } catch (error) {
      console.error("Erreur déconnexion:", error);
    }
  };

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const q = query(
          collection(db, "quizzes"),
          orderBy("createdAt", "desc"),
          limit(5)
        );
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setRecentQuizzes(list);
      } catch (error) {
        console.error("Erreur chargement quiz:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuizzes();
  }, []);

  const ActionCard = ({ icon, title, description, gradient, onPress }) => {
    const [pressed, setPressed] = useState(false);

    return (
      <Pressable
        onPress={onPress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        style={[styles.actionCard, pressed && styles.actionCardPressed]}
      >
        <View style={[styles.actionCardGradient, gradient]}>
          <View style={styles.iconContainer}>
            <Ionicons name={icon} size={28} color="#fff" />
          </View>
          <Text style={styles.actionTitle}>{title}</Text>
          <Text style={styles.actionDescription}>{description}</Text>
          <View style={styles.arrowContainer}>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </View>
        </View>
      </Pressable>
    );
  };

  const QuizItem = ({ item }) => {
    const [hover, setHover] = useState(false);

    return (
      <Pressable
        onPress={() =>
          router.push({
            pathname: "/quizz/QuizCreatedScreen",
            params: {
              quizId: item.id,
              quizTitle: item.title,
            },
          })
        }
        onPressIn={() => setHover(true)}
        onPressOut={() => setHover(false)}
        style={[styles.quizCard, hover && styles.quizCardHover]}
      >
        <View style={styles.quizCardContent}>
          <View style={styles.quizIconBadge}>
            <Text style={styles.quizEmoji}>📝</Text>
          </View>
          <View style={styles.quizInfo}>
            <Text style={styles.quizTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={styles.quizMetaContainer}>
              <View style={styles.themeBadge}>
                <Text style={styles.themeBadgeText}>{item.theme}</Text>
              </View>
              <Text style={styles.quizDate}>
                {new Date(
                  item.createdAt?.toDate?.() || item.createdAt
                ).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                })}
              </Text>
            </View>
          </View>
          <Ionicons
            name="chevron-forward"
            size={24}
            color={hover ? "#6366f1" : "#cbd5e1"}
          />
        </View>
      </Pressable>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.greeting}>Bonjour, {userName} 👋</Text>
          <Text style={styles.headerTitle}>Tableau de bord</Text>
        </View>
        <Pressable onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="#ef4444" />
        </Pressable>
      </View>

      {/* Actions rapides */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        <View style={styles.actionsGrid}>
          <ActionCard
            icon="add-circle"
            title="Créer un quiz"
            description="Nouveau quiz"
            gradient={styles.gradientPurple}
            onPress={() => router.push("/admin/QuizFormScreen")}
          />
          <ActionCard
            icon="list"
            title="Mes quiz"
            description="Voir tous"
            gradient={styles.gradientBlue}
            onPress={() => router.push("/admin/QuizListScreen")}
          />
        </View>
      </View>

      {/* Quiz récents */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quiz récents</Text>
          {recentQuizzes.length > 0 && (
            <Pressable onPress={() => router.push("/admin/QuizListScreen")}>
              <Text style={styles.seeAllText}>Tout voir</Text>
            </Pressable>
          )}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Chargement...</Text>
          </View>
        ) : recentQuizzes.length > 0 ? (
          <View style={styles.quizList}>
            {recentQuizzes.map((item) => (
              <QuizItem key={item.id} item={item} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>Aucun quiz</Text>
            <Text style={styles.emptyDescription}>
              Créez votre premier quiz pour commencer
            </Text>
          </View>
        )}
      </View>

      {/* Modale de déconnexion */}
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
            <View style={styles.modalIcon}>
              <Ionicons name="log-out-outline" size={32} color="#ef4444" />
            </View>
            <Text style={styles.modalTitle}>Se déconnecter ?</Text>
            <Text style={styles.modalMessage}>
              Êtes-vous sûr de vouloir vous déconnecter ?
            </Text>
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonTextCancel}>Annuler</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={confirmLogout}
              >
                <Text style={styles.modalButtonTextConfirm}>Déconnexion</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
  },
  headerContent: {
    flex: 1,
  },
  greeting: {
    fontSize: 18,
    fontWeight: "500",
    color: "#64748b",
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 36,
    fontWeight: "900",
    color: "#0f172a",
    letterSpacing: -1,
  },
  logoutButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },

  // Section
  section: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
sectionTitle: {
  fontSize: 24,
  fontWeight: "800",
  color: "#0f172a",
  letterSpacing: -0.5,
  marginLeft: 8,
  borderLeftWidth: 4,
  borderLeftColor: "#6366f1",
  paddingLeft: 12,
  marginBottom: 24
},

  seeAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6366f1",
  },

  // Actions Grid
  actionsGrid: {
    flexDirection: "row",
    gap: 16,
  },
  actionCard: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  actionCardPressed: {
    transform: [{ scale: 0.98 }],
  },
  actionCardGradient: {
    padding: 20,
    minHeight: 160,
    justifyContent: "space-between",
  },
  gradientPurple: {
    backgroundColor: "#6366f1",
  },
  gradientBlue: {
    backgroundColor: "#3b82f6",
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginTop: 12,
  },
  actionDescription: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-end",
  },

  // Quiz List
  quizList: {
    gap: 12,
  },
  quizCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quizCardHover: {
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
    transform: [{ translateY: -2 }],
  },
  quizCardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  quizIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  quizEmoji: {
    fontSize: 24,
  },
  quizInfo: {
    flex: 1,
    gap: 6,
  },
  quizTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
  },
  quizMetaContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  themeBadge: {
    backgroundColor: "#e0e7ff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  themeBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6366f1",
  },
  quizDate: {
    fontSize: 13,
    color: "#64748b",
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#64748b",
    marginTop: 16,
  },
  emptyDescription: {
    fontSize: 14,
    color: "#94a3b8",
    marginTop: 8,
  },

  // Loading
  loadingContainer: {
    paddingVertical: 48,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
    color: "#64748b",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 32,
    width: "90%",
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  modalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#fee2e2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
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
  modalButtonCancel: {
    backgroundColor: "#f1f5f9",
  },
  modalButtonConfirm: {
    backgroundColor: "#ef4444",
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