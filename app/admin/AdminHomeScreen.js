// app/admin/AdminHomeScreen.js
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
  View,
} from "react-native";

import { auth, db } from "../../services/firebase";

export default function AdminHomeScreen() {
  const router = useRouter();
  const [recentQuizzes, setRecentQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [userName, setUserName] = useState("Admin");
  const [scaleAnim] = useState(new Animated.Value(1));

  // --- Modale de création rapide ---
  const [quickModalVisible, setQuickModalVisible] = useState(false);
  const [quickType, setQuickType] = useState(null); // "agree_disagree" | "multiple_choice" | "true_false" | "open"
  const [subCount, setSubCount] = useState(3);
  const [qCount, setQCount] = useState(5);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setUserName(user.displayName || user.email?.split("@")[0] || "Admin");
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

  const ActionCard = ({ icon, title, description, gradient, onPress, small = false }) => {
    const [pressed, setPressed] = useState(false);
    const iconSize = small ? 22 : 28;

    return (
      <Pressable
        onPress={onPress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        style={[
          styles.actionCard,
          pressed && styles.actionCardPressed,
          small && styles.actionCardSmall,
        ]}
      >
        <View
          style={[
            styles.actionCardGradient,
            gradient,
            small && styles.actionCardGradientSmall,
          ]}
        >
          <View style={[styles.iconContainer, small && styles.iconContainerSmall]}>
            <Ionicons name={icon} size={iconSize} color="#fff" />
          </View>
          <Text style={[styles.actionTitle, small && styles.actionTitleSmall]} numberOfLines={1}>
            {title}
          </Text>
          <Text
            style={[styles.actionDescription, small && styles.actionDescriptionSmall]}
            numberOfLines={1}
          >
            {description}
          </Text>
          <View style={[styles.arrowContainer, small && styles.arrowContainerSmall]}>
            <Ionicons name="arrow-forward" size={small ? 16 : 20} color="#fff" />
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

  // --- Quick create helpers ---
  const openQuickCreate = (type) => {
    setQuickType(type);
    setSubCount(3);
    setQCount(5);
    setQuickModalVisible(true);
  };

  const confirmQuickCreate = () => {
    setQuickModalVisible(false);
    router.push({
      pathname: "/admin/QuizFormScreen",
      params: {
        quickType: quickType,
        subthemesCount: String(subCount),
        questionsCount: String(qCount),
      },
    });
  };

  const Counter = ({ label, value, onDec, onInc, min = 1, max = 50 }) => (
    <View style={styles.counterRow}>
      <Text style={styles.counterLabel}>{label}</Text>
      <View style={styles.counterBox}>
        <Pressable
          style={[styles.counterBtn, value <= min && { opacity: 0.4 }]}
          onPress={() => value > min && onDec(value - 1)}
        >
          <Ionicons name="remove" size={18} color="#0f172a" />
        </Pressable>
        <Text style={styles.counterValue}>{value}</Text>
        <Pressable
          style={[styles.counterBtn, value >= max && { opacity: 0.4 }]}
          onPress={() => value < max && onInc(value + 1)}
        >
          <Ionicons name="add" size={18} color="#0f172a" />
        </Pressable>
      </View>
    </View>
  );

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

      {/* Créations rapides (4 boutons) — RÉDUITS */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Créations rapides</Text>
        <View style={styles.actionsGrid}>
          <ActionCard
            small
            icon="swap-vertical-outline"
            title="D’accord / Pas d’accord"
            description="Binaire sans bonne réponse"
            gradient={styles.gradientBlue}
            onPress={() => openQuickCreate("agree_disagree")}
          />
          <ActionCard
            small
            icon="list"
            title="QCM"
            description="Options + réponse correcte"
            gradient={styles.gradientPurple}
            onPress={() => openQuickCreate("multiple_choice")}
          />
        </View>
        <View style={[styles.actionsGrid, { marginTop: 16 }]}>
          <ActionCard
            small
            icon="git-commit-outline"
            title="Vrai / Faux"
            description="Choix unique"
            gradient={styles.gradientPurple}
            onPress={() => openQuickCreate("true_false")}
          />
          <ActionCard
            small
            icon="create-outline"
            title="Réponse libre"
            description="Texte ouvert"
            gradient={styles.gradientBlue}
            onPress={() => openQuickCreate("open")}
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

      {/* Modale création rapide */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={quickModalVisible}
        onRequestClose={() => setQuickModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setQuickModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.modalIcon, { backgroundColor: "#e0e7ff" }]}>
              <Ionicons name="flash-outline" size={32} color="#6366f1" />
            </View>
            <Text style={styles.modalTitle}>Création rapide</Text>
            <Text style={styles.modalMessage}>
              Choisissez le nombre de sous-thèmes et de questions par sous-thème.
            </Text>

            <Counter
              label="Sous-thèmes"
              value={subCount}
              onDec={(v) => setSubCount(v)}
              onInc={(v) => setSubCount(v)}
              min={1}
              max={20}
            />
            <Counter
              label="Questions / sous-thème"
              value={qCount}
              onDec={(v) => setQCount(v)}
              onInc={(v) => setQCount(v)}
              min={1}
              max={50}
            />

            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setQuickModalVisible(false)}
              >
                <Text style={styles.modalButtonTextCancel}>Annuler</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.quickConfirmBtn]}
                onPress={confirmQuickCreate}
              >
                <Ionicons name="arrow-forward" size={18} color="#fff" />
                <Text style={styles.quickConfirmText}>Continuer</Text>
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
    marginBottom: 24,
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

  // ▼▼ Taille réduite pour les 4 boutons
  actionCardSmall: {
    borderRadius: 16,
  },
  actionCardGradientSmall: {
    padding: 14,
    minHeight: 116,
  },
  iconContainerSmall: {
    width: 42,
    height: 42,
    borderRadius: 12,
  },
  actionTitleSmall: {
    fontSize: 16,
    marginTop: 8,
  },
  actionDescriptionSmall: {
    fontSize: 12,
  },
  arrowContainerSmall: {
    width: 26,
    height: 26,
    borderRadius: 13,
  },
  // ▲▲ Taille réduite

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

  // Modal (déconnexion)
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
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
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

  // Modale création rapide
  counterRow: {
    width: "100%",
    marginTop: 8,
    marginBottom: 8,
  },
  counterLabel: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 6,
    fontWeight: "600",
  },
  counterBox: {
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  counterBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  counterValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0f172a",
  },
  quickConfirmBtn: {
    backgroundColor: "#6366f1",
  },
  quickConfirmText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
