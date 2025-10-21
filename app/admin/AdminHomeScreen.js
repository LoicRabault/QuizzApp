import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { auth, db } from "../services/firebase";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";

export default function AdminHomeScreen() {
  const router = useRouter();
  const [recentQuizzes, setRecentQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Déconnexion sécurisée
  const handleLogout = async () => {
    try {
      await signOut(auth);
      Alert.alert("Déconnexion réussie", "À bientôt 👋");
      router.replace("/auth/LoginScreen");
    } catch (error) {
      Alert.alert("Erreur", error.message);
    }
  };

  // ✅ Récupération des 5 derniers quiz
  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const q = query(collection(db, "quizzes"), orderBy("createdAt", "desc"), limit(5));
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ alignItems: "center" }}>
      <Text style={styles.title}>Tableau de bord Administrateur</Text>
      <Text style={styles.subtitle}>Bienvenue 👋 Gérez vos quiz, vos résultats et vos participants ici.</Text>

      {/* === Boutons d’action === */}
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.card, styles.green]} onPress={() => router.push("/admin/QuizFormScreen")}>
          <Text style={styles.cardIcon}>🧩</Text>
          <Text style={styles.cardTitle}>Créer un quiz</Text>
          <Text style={styles.cardText}>Ajoutez facilement un nouveau quiz</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.card, styles.blue]} onPress={() => router.push("/admin/QuizListScreen")}>
          <Text style={styles.cardIcon}>📋</Text>
          <Text style={styles.cardTitle}>Liste des quiz</Text>
          <Text style={styles.cardText}>Gérez vos quiz existants</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.card, styles.orange]} onPress={() => router.push("/admin/ParticipantsScreen")}>
          <Text style={styles.cardIcon}>👥</Text>
          <Text style={styles.cardTitle}>Participants</Text>
          <Text style={styles.cardText}>Consultez qui a répondu</Text>
        </TouchableOpacity>
      </View>

      {/* === Section Quiz récents === */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🕒 Quiz récents</Text>
        {loading ? (
          <Text style={styles.infoText}>Chargement...</Text>
        ) : recentQuizzes.length > 0 ? (
          <FlatList
            data={recentQuizzes}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.quizItem}
                onPress={() => router.push({ pathname: "/admin/QuizDetailsScreen", params: { id: item.id } })}
              >
                <View>
                  <Text style={styles.quizTitle}>{item.title}</Text>
                  <Text style={styles.quizMeta}>{item.theme} • {new Date(item.createdAt?.toDate?.() || item.createdAt).toLocaleDateString()}</Text>
                </View>
                <Text style={styles.quizArrow}>›</Text>
              </TouchableOpacity>
            )}
          />
        ) : (
          <Text style={styles.infoText}>Aucun quiz récent pour le moment.</Text>
        )}
      </View>

      {/* === Bouton déconnexion === */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪 Se déconnecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1e293b",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#475569",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 14,
  },
  card: {
    width: "45%",
    minWidth: 150,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardIcon: {
    fontSize: 30,
    textAlign: "center",
    marginBottom: 8,
  },
  cardTitle: {
    fontWeight: "700",
    fontSize: 16,
    color: "#0f172a",
    textAlign: "center",
  },
  cardText: {
    color: "#475569",
    fontSize: 13,
    textAlign: "center",
    marginTop: 4,
  },
  green: { borderLeftWidth: 4, borderLeftColor: "#22c55e" },
  blue: { borderLeftWidth: 4, borderLeftColor: "#3b82f6" },
  orange: { borderLeftWidth: 4, borderLeftColor: "#f97316" },
  section: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 14,
    marginTop: 30,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 12,
  },
  quizItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  quizTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
  },
  quizMeta: {
    fontSize: 13,
    color: "#64748b",
  },
  quizArrow: {
    fontSize: 22,
    color: "#94a3b8",
  },
  infoText: {
    textAlign: "center",
    color: "#64748b",
    paddingVertical: 8,
  },
  logoutBtn: {
    marginTop: 40,
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ef4444",
  },
  logoutText: {
    color: "#ef4444",
    fontWeight: "600",
    fontSize: 15,
  },
});
