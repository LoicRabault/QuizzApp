import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { auth, db } from "../../services/firebase";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleRegister = async () => {
    if (!email || !password) return Alert.alert("Erreur", "Merci de remplir tous les champs");

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        role: "admin",
        createdAt: new Date(),
      });

      Alert.alert("✅ Compte créé avec succès !");
      router.replace("/admin/AdminHomeScreen");
    } catch (error) {
      Alert.alert("Erreur", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.icon}>🎓</Text>
        <Text style={styles.title}>Créer un compte Admin</Text>

        <TextInput
          placeholder="Adresse e-mail"
          placeholderTextColor="#666"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />

        <TextInput
          placeholder="Mot de passe"
          placeholderTextColor="#666"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />

        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Créer le compte</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/auth/LoginScreen")}>
          <Text style={styles.link}>
            Déjà un compte ? <Text style={styles.linkHighlight}>Se connecter</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    width: "90%",
    maxWidth: 400,
    borderRadius: 16,
    padding: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  icon: {
    fontSize: 40,
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 26,
  },
  input: {
    width: "100%",
    backgroundColor: "#f1f5f9",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    color: "#111",
    marginBottom: 16,
  },
  button: {
    width: "100%",
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#2563eb",
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  link: {
    color: "#64748b",
    fontSize: 14,
  },
  linkHighlight: {
    color: "#2563eb",
    fontWeight: "600",
  },
});
