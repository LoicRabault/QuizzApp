// app/admin/QuizFormScreen.js
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  addDoc,
  collection,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../../services/firebase";

const PRIMARY = "#6C63FF";
const SUCCESS = "#10B981";
const DANGER = "#EF4444";
const SURFACE = "#FFFFFF";
const BACKGROUND = "#F8FAFC";
const BORDER = "#E2E8F0";
const TEXT = "#1E293B";
const TEXT_MUTED = "#64748B";
const ACCENT = "#8B5CF6";

export default function QuizFormScreen() {
  const router = useRouter();
  const { quizId } = useLocalSearchParams();
  const isEdit = !!quizId;

  const [loading, setLoading] = useState(isEdit);
  const [title, setTitle] = useState("");
  const [subthemes, setSubthemes] = useState([
    { name: "", open: true, questions: [] },
  ]);
  const [expandedSubtheme, setExpandedSubtheme] = useState(0);

  // --------- Pré-remplissage si édition ---------
  useEffect(() => {
    const load = async () => {
      if (!isEdit) return;
      try {
        const snap = await getDoc(doc(db, "quizzes", String(quizId)));
        if (!snap.exists()) {
          Alert.alert("Introuvable", "Ce quiz n'existe plus.");
          router.back();
          return;
        }
        const data = snap.data() || {};
        setTitle(data.title || "");
        const subs = Array.isArray(data.subthemes) ? data.subthemes : [];
        const hydrated = subs.length
          ? subs.map((s) => ({
              name: s.name || "",
              open: true,
              questions: Array.isArray(s.questions) ? s.questions : [],
            }))
          : [{ name: "", open: true, questions: [] }];
        setSubthemes(hydrated);
        setExpandedSubtheme(0);
      } catch (e) {
        Alert.alert("Erreur", "Impossible de charger le quiz.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isEdit, quizId, router]);

  const totalQuestions = useMemo(
    () => subthemes.reduce((acc, s) => acc + (s?.questions?.length || 0), 0),
    [subthemes]
  );

  const setSub = (idx, patch) =>
    setSubthemes((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], ...patch };
      return copy;
    });

  const addSubtheme = () => {
    setSubthemes((prev) => [...prev, { name: "", open: true, questions: [] }]);
    setExpandedSubtheme(subthemes.length);
  };

  const removeSubtheme = (idx) => {
    if (subthemes.length === 1) {
      Alert.alert("Attention", "Il faut au moins un sous-thème.");
      return;
    }
    setSubthemes((prev) => prev.filter((_, i) => i !== idx));
    // réajuste l'onglet ouvert
    setExpandedSubtheme((cur) => {
      if (cur === idx) return Math.max(0, idx - 1);
      if (cur > idx) return cur - 1;
      return cur;
    });
  };

  const toggleSubtheme = (idx) => {
    setExpandedSubtheme(expandedSubtheme === idx ? -1 : idx);
  };

  const addQuestion = (subIndex) => {
    setSubthemes((prev) => {
      const copy = [...prev];
      copy[subIndex].questions.push({
        question: "",
        type: "multiple_choice",
        options: ["", ""],
        answer: "",
      });
      return copy;
    });
  };

  const updateQuestion = (subIndex, qIndex, key, value) => {
    setSubthemes((prev) => {
      const copy = [...prev];
      // si on change de type, on réinitialise answer et options min pour QCM
      if (key === "type") {
        copy[subIndex].questions[qIndex].type = value;
        copy[subIndex].questions[qIndex].answer = "";
        if (value === "multiple_choice") {
          const opts = copy[subIndex].questions[qIndex].options || [];
          if (opts.length < 2) {
            copy[subIndex].questions[qIndex].options = ["", ""];
          }
        } else if (value === "true_false") {
          copy[subIndex].questions[qIndex].options = [];
        }
        return copy;
      }
      copy[subIndex].questions[qIndex][key] = value;
      return copy;
    });
  };

  const removeQuestion = (subIndex, qIndex) => {
    setSubthemes((prev) => {
      const copy = [...prev];
      copy[subIndex].questions = copy[subIndex].questions.filter(
        (_, i) => i !== qIndex
      );
      return copy;
    });
  };

  const duplicateQuestion = (subIndex, qIndex) => {
    setSubthemes((prev) => {
      const copy = [...prev];
      const q = copy[subIndex].questions[qIndex];
      copy[subIndex].questions.splice(qIndex + 1, 0, {
        ...q,
        options: [...(q.options || [])],
      });
      return copy;
    });
  };

  const addOption = (subIndex, qIndex) => {
    setSubthemes((prev) => {
      const copy = [...prev];
      const q = copy[subIndex].questions[qIndex];
      q.options = [...(q.options || []), ""];
      return copy;
    });
  };

  const updateOption = (subIndex, qIndex, optIndex, value) => {
    setSubthemes((prev) => {
      const copy = [...prev];
      copy[subIndex].questions[qIndex].options[optIndex] = value;
      return copy;
    });
  };

  const removeOption = (subIndex, qIndex, optIndex) => {
    setSubthemes((prev) => {
      const copy = [...prev];
      const q = copy[subIndex].questions[qIndex];
      if ((q.options || []).length <= 2) return copy; // garde min 2
      q.options = q.options.filter((_, i) => i !== optIndex);
      if (!q.options.includes(q.answer)) q.answer = "";
      return copy;
    });
  };

  const selectCorrectOption = (subIndex, qIndex, value) =>
    updateQuestion(subIndex, qIndex, "answer", value);

  // --------- Validation ---------
  const validate = () => {
    if (!title.trim()) return "Donne un nom au quiz 😉";
    const visibleSubs = subthemes.filter(
      (s) => s.name.trim() || s.questions.length > 0
    );
    if (!visibleSubs.length)
      return "Ajoute au moins un sous-thème avec une question.";

    for (let i = 0; i < visibleSubs.length; i++) {
      const s = visibleSubs[i];
      if (!s.name.trim()) return `Le sous-thème ${i + 1} n'a pas de nom.`;
      if (!s.questions.length)
        return `Le sous-thème "${s.name}" n'a pas de question.`;
      for (let j = 0; j < s.questions.length; j++) {
        const q = s.questions[j];
        if (!q.question.trim())
          return `Question ${j + 1} de "${s.name}" : texte manquant.`;
        if (q.type === "multiple_choice") {
          const opts = (q.options || []).filter((o) => o.trim());
          if (opts.length < 2)
            return `QCM ( ${s.name} / Q${j + 1} ) : mets au moins 2 options.`;
          if (!opts.includes(q.answer))
            return `QCM ( ${s.name} / Q${j + 1} ) : sélectionne la bonne réponse.`;
        }
        if (
          q.type === "true_false" &&
          !["true", "false"].includes(q.answer)
        )
          return `Vrai/Faux ( ${s.name} / Q${j + 1} ) : choisis Vrai ou Faux.`;
      }
    }
    return null;
  };

  // --------- Save (create / update) ---------
  const saveQuiz = async () => {
    const err = validate();
    if (err) return Alert.alert("Petit rappel", err);

    const cleaned = subthemes
      .filter((s) => s.name.trim() || s.questions.length)
      .map(({ name, questions }) => ({
        name: name.trim(),
        questions: questions.map((q) => ({
          question: q.question.trim(),
          type: q.type,
          options: (q.options || []).filter((o) => o.trim()),
          answer: q.answer,
        })),
      }));

    try {
      if (isEdit) {
        await updateDoc(doc(db, "quizzes", String(quizId)), {
          title: title.trim(),
          subthemes: cleaned,
          updatedAt: serverTimestamp(),
        });
        Alert.alert("Succès", "Quiz mis à jour.");
        router.back();
        return;
      }

      const docRef = await addDoc(collection(db, "quizzes"), {
        creatorId: auth.currentUser?.uid || null,
        title: title.trim(),
        subthemes: cleaned,
        createdAt: serverTimestamp(),
      });

      router.push({
        pathname: "/quizz/QuizCreatedScreen",
        params: { quizId: docRef.id, quizTitle: title.trim() },
      });

      setTitle("");
      setSubthemes([{ name: "", open: true, questions: [] }]);
      setExpandedSubtheme(0);
    } catch (error) {
      Alert.alert("Erreur", error?.message || "Impossible d'enregistrer.");
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header fixe avec progression */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>
              {isEdit ? "Modifier un quiz" : "Créer un quiz"}
            </Text>
            <Text style={styles.headerSubtitle}>
              {isEdit
                ? "Mettez à jour le thème et les questions"
                : "Remplissez les informations ci-dessous"}
            </Text>
          </View>
          <View style={styles.stats}>
            <StatBadge icon="layers-outline" value={subthemes.length} label="thèmes" />
            <StatBadge icon="help-circle-outline" value={totalQuestions} label="questions" />
          </View>
        </View>

        {/* Titre du quiz */}
        <View style={styles.titleSection}>
          <Text style={styles.sectionLabel}>Titre du quiz</Text>
          <TextInput
            style={styles.titleInput}
            placeholder="Ex : Physique Médicale, Histoire de France..."
            placeholderTextColor="#94A3B8"
            value={title}
            onChangeText={setTitle}
          />
        </View>
      </View>

      {/* Liste des sous-thèmes */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Sous-thèmes & Questions</Text>

        {subthemes.map((sub, sIndex) => (
          <SubthemeCard
            key={sIndex}
            sub={sub}
            sIndex={sIndex}
            isExpanded={expandedSubtheme === sIndex}
            onToggle={() => toggleSubtheme(sIndex)}
            onUpdateName={(text) => setSub(sIndex, { name: text })}
            onRemove={() =>
              Alert.alert(
                "Supprimer ce sous-thème ?",
                "Toutes les questions de ce sous-thème seront supprimées.",
                [
                  { text: "Annuler", style: "cancel" },
                  { text: "Supprimer", style: "destructive", onPress: () => removeSubtheme(sIndex) },
                ]
              )
            }
            onAddQuestion={() => addQuestion(sIndex)}
            canDelete={subthemes.length > 1}
            updateQuestion={updateQuestion}
            removeQuestion={removeQuestion}
            duplicateQuestion={duplicateQuestion}
            addOption={addOption}
            updateOption={updateOption}
            removeOption={removeOption}
            selectCorrectOption={selectCorrectOption}
          />
        ))}

        <TouchableOpacity style={styles.addSubthemeBtn} onPress={addSubtheme}>
          <View style={styles.addSubthemeIcon}>
            <Ionicons name="add" size={20} color={PRIMARY} />
          </View>
          <Text style={styles.addSubthemeText}>Ajouter un sous-thème</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer avec bouton d'enregistrement */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} onPress={saveQuiz}>
          <Ionicons name="checkmark-circle" size={22} color="#fff" />
          <Text style={styles.saveBtnText}>
            {isEdit ? "Mettre à jour le quiz" : "Enregistrer le quiz"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

/* ---------- COMPOSANTS ---------- */

function StatBadge({ icon, value, label }) {
  return (
    <View style={statStyles.container}>
      <Ionicons name={icon} size={18} color={PRIMARY} />
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

function SubthemeCard({
  sub,
  sIndex,
  isExpanded,
  onToggle,
  onUpdateName,
  onRemove,
  onAddQuestion,
  canDelete,
  updateQuestion,
  removeQuestion,
  duplicateQuestion,
  addOption,
  updateOption,
  removeOption,
  selectCorrectOption,
}) {
  return (
    <View style={subStyles.card}>
      {/* En-tête du sous-thème */}
      <TouchableOpacity
        style={[subStyles.header, isExpanded && subStyles.headerExpanded]}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <View style={subStyles.headerLeft}>
          <View style={subStyles.iconCircle}>
            <Ionicons
              name={isExpanded ? "chevron-down" : "chevron-forward"}
              size={18}
              color={PRIMARY}
            />
          </View>
          <View style={subStyles.headerInfo}>
            <TextInput
              style={subStyles.nameInput}
              placeholder={`Sous-thème ${sIndex + 1}`}
              placeholderTextColor="#94A3B8"
              value={sub.name}
              onChangeText={onUpdateName}
              onFocus={(e) => e.stopPropagation()}
            />
            <Text style={subStyles.questionCount}>
              {sub.questions.length} question{sub.questions.length > 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        {canDelete && (
          <TouchableOpacity
            style={subStyles.deleteBtn}
            onPress={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <Ionicons name="trash-outline" size={18} color={DANGER} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {/* Contenu des questions */}
      {isExpanded && (
        <View style={subStyles.content}>
          {sub.questions.length === 0 ? (
            <View style={subStyles.emptyState}>
              <Ionicons name="help-circle-outline" size={40} color="#CBD5E1" />
              <Text style={subStyles.emptyText}>Aucune question</Text>
              <Text style={subStyles.emptyHint}>
                Commencez par ajouter une première question
              </Text>
            </View>
          ) : (
            sub.questions.map((q, qIndex) => (
              <QuestionCard
                key={qIndex}
                q={q}
                sIndex={sIndex}
                qIndex={qIndex}
                updateQuestion={updateQuestion}
                removeQuestion={removeQuestion}
                duplicateQuestion={duplicateQuestion}
                addOption={addOption}
                updateOption={updateOption}
                removeOption={removeOption}
                selectCorrectOption={selectCorrectOption}
              />
            ))
          )}

          <TouchableOpacity style={subStyles.addQuestionBtn} onPress={onAddQuestion}>
            <Ionicons name="add-circle" size={20} color={PRIMARY} />
            <Text style={subStyles.addQuestionText}>Ajouter une question</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function QuestionCard({
  q,
  sIndex,
  qIndex,
  updateQuestion,
  removeQuestion,
  duplicateQuestion,
  addOption,
  updateOption,
  removeOption,
  selectCorrectOption,
}) {
  return (
    <View style={qStyles.card}>
      {/* En-tête de la question */}
      <View style={qStyles.header}>
        <View style={qStyles.headerLeft}>
          <View style={qStyles.numberBadge}>
            <Text style={qStyles.numberText}>{qIndex + 1}</Text>
          </View>
          <Text style={qStyles.title}>Question {qIndex + 1}</Text>
        </View>
        <View style={qStyles.actions}>
          <TouchableOpacity
            style={qStyles.actionBtn}
            onPress={() => duplicateQuestion(sIndex, qIndex)}
          >
            <Ionicons name="copy-outline" size={18} color={TEXT_MUTED} />
          </TouchableOpacity>
          <TouchableOpacity
            style={qStyles.actionBtn}
            onPress={() => removeQuestion(sIndex, qIndex)}
          >
            <Ionicons name="trash-outline" size={18} color={DANGER} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Texte de la question */}
      <TextInput
        style={qStyles.input}
        placeholder="Écrivez votre question ici..."
        placeholderTextColor="#94A3B8"
        value={q.question}
        onChangeText={(text) => updateQuestion(sIndex, qIndex, "question", text)}
        multiline
      />

      {/* Type de question */}
      <View style={qStyles.typeSection}>
        <Text style={qStyles.label}>Type de question</Text>
        <View style={qStyles.typeButtons}>
          <TypeButton
            icon="list"
            label="QCM"
            active={q.type === "multiple_choice"}
            onPress={() => {
              updateQuestion(sIndex, qIndex, "type", "multiple_choice");
            }}
          />
          <TypeButton
            icon="git-commit-outline"
            label="V/F"
            active={q.type === "true_false"}
            onPress={() => {
              updateQuestion(sIndex, qIndex, "type", "true_false");
            }}
          />
          <TypeButton
            icon="create-outline"
            label="Libre"
            active={q.type === "open"}
            onPress={() => updateQuestion(sIndex, qIndex, "type", "open")}
          />
        </View>
      </View>

      {/* Contenu selon le type */}
      {q.type === "true_false" && (
        <View style={qStyles.answersSection}>
          <Text style={qStyles.label}>Réponse correcte</Text>
          <View style={qStyles.tfButtons}>
            <TFButton
              text="Vrai"
              selected={q.answer === "true"}
              onPress={() => updateQuestion(sIndex, qIndex, "answer", "true")}
            />
            <TFButton
              text="Faux"
              selected={q.answer === "false"}
              onPress={() => updateQuestion(sIndex, qIndex, "answer", "false")}
            />
          </View>
        </View>
      )}

      {q.type === "multiple_choice" && (
        <View style={qStyles.answersSection}>
          <Text style={qStyles.label}>Options (cochez la bonne réponse)</Text>
          {(q.options?.length ? q.options : ["", ""]).map((opt, optIndex) => (
            <View key={optIndex} style={qStyles.optionRow}>
              <TouchableOpacity
                style={qStyles.checkbox}
                onPress={() => selectCorrectOption(sIndex, qIndex, opt)}
              >
                <Ionicons
                  name={q.answer === opt ? "checkmark-circle" : "ellipse-outline"}
                  size={24}
                  color={q.answer === opt ? SUCCESS : "#CBD5E1"}
                />
              </TouchableOpacity>
              <TextInput
                style={qStyles.optionInput}
                placeholder={`Option ${optIndex + 1}`}
                placeholderTextColor="#94A3B8"
                value={opt}
                onChangeText={(text) => updateOption(sIndex, qIndex, optIndex, text)}
              />
              {q.options?.length > 2 && (
                <TouchableOpacity
                  style={qStyles.removeOption}
                  onPress={() => removeOption(sIndex, qIndex, optIndex)}
                >
                  <Ionicons name="close-circle" size={20} color="#CBD5E1" />
                </TouchableOpacity>
              )}
            </View>
          ))}
          <TouchableOpacity
            style={qStyles.addOptionBtn}
            onPress={() => addOption(sIndex, qIndex)}
          >
            <Ionicons name="add" size={16} color={PRIMARY} />
            <Text style={qStyles.addOptionText}>Ajouter une option</Text>
          </TouchableOpacity>
        </View>
      )}

      {q.type === "open" && (
        <View style={qStyles.answersSection}>
          <Text style={qStyles.label}>Réponse attendue (optionnel)</Text>
          <TextInput
            style={qStyles.input}
            placeholder="Saisissez la réponse correcte pour correction automatique..."
            placeholderTextColor="#94A3B8"
            value={q.answer}
            onChangeText={(text) => updateQuestion(sIndex, qIndex, "answer", text)}
            multiline
          />
        </View>
      )}
    </View>
  );
}

function TypeButton({ icon, label, active, onPress }) {
  return (
    <TouchableOpacity
      style={[typeStyles.btn, active && typeStyles.btnActive]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={18} color={active ? "#fff" : PRIMARY} />
      <Text style={[typeStyles.text, active && typeStyles.textActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function TFButton({ text, selected, onPress }) {
  return (
    <TouchableOpacity
      style={[tfBtnStyles.btn, selected && tfBtnStyles.btnSelected]}
      onPress={onPress}
    >
      {selected && <Ionicons name="checkmark" size={18} color="#fff" />}
      <Text style={[tfBtnStyles.text, selected && tfBtnStyles.textSelected]}>
        {text}
      </Text>
    </TouchableOpacity>
  );
}

/* ---------- STYLES ---------- */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BACKGROUND },
  header: {
    backgroundColor: SURFACE,
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  headerTitle: { fontSize: 26, fontWeight: "800", color: TEXT, marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: TEXT_MUTED },
  stats: { flexDirection: "row", gap: 12 },
  titleSection: { marginTop: 8 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: TEXT_MUTED,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  titleInput: {
    backgroundColor: BACKGROUND,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontWeight: "600",
    color: TEXT,
    borderWidth: 1,
    borderColor: BORDER,
  },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: TEXT, marginBottom: 16 },
  addSubthemeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: SURFACE,
    borderRadius: 16,
    padding: 18,
    marginTop: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: PRIMARY,
  },
  addSubthemeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  addSubthemeText: { fontSize: 15, fontWeight: "600", color: PRIMARY },
  footer: {
    backgroundColor: SURFACE,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
  saveBtn: {
    backgroundColor: SUCCESS,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
  },
  saveBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});

const statStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  value: { fontSize: 16, fontWeight: "800", color: PRIMARY },
  label: { fontSize: 12, fontWeight: "600", color: PRIMARY },
});

const subStyles = StyleSheet.create({
  card: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: BORDER,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#F8FAFC",
  },
  headerExpanded: {
    backgroundColor: SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerInfo: { flex: 1 },
  nameInput: { fontSize: 16, fontWeight: "700", color: TEXT, paddingVertical: 4 },
  questionCount: { fontSize: 13, color: TEXT_MUTED, marginTop: 2 },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  content: { padding: 16 },
  emptyState: { alignItems: "center", paddingVertical: 32 },
  emptyText: { fontSize: 16, fontWeight: "600", color: TEXT_MUTED, marginTop: 12 },
  emptyHint: { fontSize: 13, color: TEXT_MUTED, marginTop: 4 },
  addQuestionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF2FF",
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 12,
    gap: 8,
  },
  addQuestionText: { fontSize: 14, fontWeight: "600", color: PRIMARY },
});

const qStyles = StyleSheet.create({
  card: {
    backgroundColor: "#FAFBFC",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  numberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  numberText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  title: { fontSize: 15, fontWeight: "700", color: TEXT },
  actions: { flexDirection: "row", gap: 8 },
  actionBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: SURFACE, alignItems: "center", justifyContent: "center" },
  input: {
    backgroundColor: SURFACE,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: TEXT,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 16,
    minHeight: 44,
  },
  typeSection: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "600", color: TEXT_MUTED, marginBottom: 10 },
  typeButtons: { flexDirection: "row", gap: 8 },
  answersSection: { marginTop: 4 },
  tfButtons: { flexDirection: "row", gap: 12 },
  optionRow: { flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 10 },
  checkbox: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  optionInput: {
    flex: 1,
    backgroundColor: SURFACE,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: TEXT,
    borderWidth: 1,
    borderColor: BORDER,
  },
  removeOption: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  addOptionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: SURFACE,
    borderRadius: 8,
    paddingVertical: 10,
    marginTop: 4,
    gap: 6,
    borderWidth: 1,
    borderColor: BORDER,
  },
  addOptionText: { fontSize: 13, fontWeight: "600", color: PRIMARY },
});

const typeStyles = StyleSheet.create({
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: SURFACE,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 6,
    borderWidth: 2,
    borderColor: BORDER,
  },
  btnActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  text: { fontSize: 13, fontWeight: "600", color: PRIMARY },
  textActive: { color: "#fff" },
});

const tfBtnStyles = StyleSheet.create({
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: SURFACE,
    borderRadius: 10,
    paddingVertical: 12,
    gap: 6,
    borderWidth: 2,
    borderColor: BORDER,
  },
  btnSelected: { backgroundColor: SUCCESS, borderColor: SUCCESS },
  text: { fontSize: 14, fontWeight: "600", color: TEXT },
  textSelected: { color: "#fff" },
});
