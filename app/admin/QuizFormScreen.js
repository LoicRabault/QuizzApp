// app/admin/QuizFormScreen.js
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useMemo, useState } from "react";
import {
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
const SUCCESS = "#28A745";
const DANGER = "#EF4444";
const SURFACE = "#FFFFFF";
const CARD = "#F5F7FB";
const BORDER = "#E6E8EF";
const TEXT_MUTED = "#6B7280";

export default function QuizFormScreen() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [subthemes, setSubthemes] = useState([{ name: "", open: true, questions: [] }]);

  const totalQuestions = useMemo(() => subthemes.reduce((acc, s) => acc + (s?.questions?.length || 0), 0), [subthemes]);

  const setSub = (idx, patch) => setSubthemes(prev => {
    const copy = [...prev];
    copy[idx] = { ...copy[idx], ...patch };
    return copy;
  });

  const addSubtheme = () => setSubthemes(prev => [...prev, { name: "", open: true, questions: [] }]);
  const removeSubtheme = idx => setSubthemes(prev => prev.filter((_, i) => i !== idx));
  const toggleOpen = idx => setSub(idx, { open: !subthemes[idx].open });

  const addQuestion = subIndex => {
    setSubthemes(prev => {
      const copy = [...prev];
      copy[subIndex].questions.push({ question: "", type: "true_false", options: [], answer: "" });
      return copy;
    });
  };

  const updateQuestion = (subIndex, qIndex, key, value) => {
    setSubthemes(prev => {
      const copy = [...prev];
      copy[subIndex].questions[qIndex][key] = value;
      return copy;
    });
  };

  const removeQuestion = (subIndex, qIndex) => {
    setSubthemes(prev => {
      const copy = [...prev];
      copy[subIndex].questions = copy[subIndex].questions.filter((_, i) => i !== qIndex);
      return copy;
    });
  };

  const duplicateQuestion = (subIndex, qIndex) => {
    setSubthemes(prev => {
      const copy = [...prev];
      const q = copy[subIndex].questions[qIndex];
      copy[subIndex].questions.splice(qIndex + 1, 0, { ...q });
      return copy;
    });
  };

  const addOption = (subIndex, qIndex) => {
    setSubthemes(prev => {
      const copy = [...prev];
      copy[subIndex].questions[qIndex].options = [...(copy[subIndex].questions[qIndex].options || []), ""];
      return copy;
    });
  };

  const updateOption = (subIndex, qIndex, optIndex, value) => {
    setSubthemes(prev => {
      const copy = [...prev];
      copy[subIndex].questions[qIndex].options[optIndex] = value;
      return copy;
    });
  };

  const removeOption = (subIndex, qIndex, optIndex) => {
    setSubthemes(prev => {
      const copy = [...prev];
      const q = copy[subIndex].questions[qIndex];
      q.options = q.options.filter((_, i) => i !== optIndex);
      if (!q.options.includes(q.answer)) q.answer = "";
      return copy;
    });
  };

  const selectCorrectOption = (subIndex, qIndex, value) => updateQuestion(subIndex, qIndex, "answer", value);

  // Validation
  const validate = () => {
    if (!title.trim()) return "Donne un nom au quiz 😉";
    const visibleSubs = subthemes.filter(s => s.name.trim() || s.questions.length > 0);
    if (!visibleSubs.length) return "Ajoute au moins un sous-thème avec une question.";

    for (let i = 0; i < visibleSubs.length; i++) {
      const s = visibleSubs[i];
      if (!s.name.trim()) return `Le sous-thème ${i + 1} n'a pas de nom.`;
      if (!s.questions.length) return `Le sous-thème "${s.name}" n'a pas de question.`;
      for (let j = 0; j < s.questions.length; j++) {
        const q = s.questions[j];
        if (!q.question.trim()) return `Question ${j + 1} de "${s.name}" : texte manquant.`;
        if (q.type === "multiple_choice") {
          const opts = q.options.filter(o => o.trim());
          if (opts.length < 2) return `QCM ( ${s.name} / Q${j + 1} ) : mets au moins 2 options.`;
          if (!opts.includes(q.answer)) return `QCM ( ${s.name} / Q${j + 1} ) : sélectionne la bonne réponse.`;
        }
        if (q.type === "true_false" && !["true", "false"].includes(q.answer))
          return `Vrai/Faux ( ${s.name} / Q${j + 1} ) : choisis Vrai ou Faux.`;
      }
    }
    return null;
  };

  const saveQuiz = async () => {
    const err = validate();
    if (err) return Alert.alert("Petit rappel", err);

    const cleaned = subthemes
      .filter(s => s.name.trim() || s.questions.length)
      .map(({ name, questions }) => ({
        name: name.trim(),
        questions: questions.map(q => ({
          question: q.question.trim(),
          type: q.type,
          options: (q.options || []).filter(o => o.trim()),
          answer: q.answer,
        })),
      }));

    try {
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
    } catch (error) {
      Alert.alert("Erreur", error?.message || "Impossible d'enregistrer.");
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Créer un quiz</Text>
        <View style={styles.counters}>
          <Badge icon="albums-outline" value={`${subthemes.length} sous-thèmes`} />
          <Badge icon="help-circle-outline" value={`${totalQuestions} questions`} />
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 150 }} keyboardShouldPersistTaps="handled">
        {/* Thème global */}
        <View style={styles.card}>
          <Text style={styles.label}>Thème global</Text>
          <TextInput style={styles.input} placeholder="Ex : Physique Médicale" value={title} onChangeText={setTitle} />
        </View>

        {subthemes.map((sub, sIndex) => (
          <SubthemeBlock
            key={sIndex}
            sub={sub}
            sIndex={sIndex}
            setSub={setSub}
            toggleOpen={toggleOpen}
            removeSubtheme={removeSubtheme}
            addQuestion={addQuestion}
            updateQuestion={updateQuestion}
            removeQuestion={removeQuestion}
            duplicateQuestion={duplicateQuestion}
            addOption={addOption}
            updateOption={updateOption}
            removeOption={removeOption}
            selectCorrectOption={selectCorrectOption}
          />
        ))}

        <TouchableOpacity style={styles.addSubtheme} onPress={addSubtheme}>
          <Ionicons name="add-circle-outline" size={22} color={PRIMARY} />
          <Text style={{ color: PRIMARY, marginLeft: 8 }}>Ajouter un sous-thème</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Badge icon="albums-outline" value={`${subthemes.length}`} />
          <Badge icon="help-circle-outline" value={`${totalQuestions}`} />
        </View>
        <TouchableOpacity style={styles.saveButton} onPress={saveQuiz}>
          <Ionicons name="save-outline" size={18} color="#fff" />
          <Text style={styles.saveButtonText}>Enregistrer</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

/* ---------- Composants atomiques ---------- */
function Badge({ value, icon, small }) {
  return (
    <View style={[badgeStyles.badge, small && badgeStyles.small]}>
      {icon && <Ionicons name={icon} size={small ? 12 : 14} color={PRIMARY} style={{ marginRight: 4 }} />}
      <Text style={[badgeStyles.text, small && { fontSize: 11 }]}>{value}</Text>
    </View>
  );
}

function Chip({ active, onPress, text, icon }) {
  return (
    <TouchableOpacity onPress={onPress} style={[chipStyles.chip, active && chipStyles.active]}>
      {icon && <Ionicons name={icon} size={14} color={active ? "#fff" : PRIMARY} style={{ marginRight: 6 }} />}
      <Text style={[chipStyles.text, active && { color: "#fff" }]}>{text}</Text>
    </TouchableOpacity>
  );
}

function TFButton({ text, selected, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={[tfStyles.btn, selected && tfStyles.selected]}>
      <Text style={[tfStyles.text, selected && { color: "#fff" }]}>{text}</Text>
    </TouchableOpacity>
  );
}

function IconPill({ icon, onPress, label, color = TEXT_MUTED }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ flexDirection: "row", alignItems: "center", marginLeft: 4 }}>
      <Ionicons name={icon} size={18} color={color} />
      {!!label && <Text style={{ color, marginLeft: 4, fontWeight: "600" }}>{label}</Text>}
    </TouchableOpacity>
  );
}

/* ---------- Bloc sous-thème ---------- */
function SubthemeBlock({
  sub, sIndex, setSub, toggleOpen, removeSubtheme, addQuestion, updateQuestion, removeQuestion,
  duplicateQuestion, addOption, updateOption, removeOption, selectCorrectOption
}) {
  return (
    <View style={styles.subthemeCard}>
      <View style={styles.subHeader}>
        <TouchableOpacity onPress={() => toggleOpen(sIndex)} style={styles.subHeaderLeft}>
          <Ionicons name={sub.open ? "chevron-down" : "chevron-forward"} size={18} color={PRIMARY} />
          <TextInput
            style={styles.subNameInput}
            placeholder={`Sous-thème ${sIndex + 1}`}
            value={sub.name}
            onChangeText={text => setSub(sIndex, { name: text })}
          />
        </TouchableOpacity>
        <View style={styles.subHeaderRight}>
          <Badge small value={`${sub.questions.length}`} />
          {sub.length > 1 && <TouchableOpacity onPress={() => removeSubtheme(sIndex)} style={styles.iconBtn}><Ionicons name="trash-outline" size={18} color={DANGER} /></TouchableOpacity>}
        </View>
      </View>

      {sub.open && (
        <View style={{ marginTop: 8 }}>
          {sub.questions.map((q, qIndex) => (
            <QuestionBlock
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
          ))}

          <TouchableOpacity style={styles.addQuestion} onPress={() => addQuestion(sIndex)}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.addQuestionText}>Ajouter une question</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

/* ---------- Bloc question ---------- */
function QuestionBlock({
  q, sIndex, qIndex, updateQuestion, removeQuestion, duplicateQuestion,
  addOption, updateOption, removeOption, selectCorrectOption
}) {
  return (
    <View style={styles.questionCard}>
      <View style={styles.questionTop}>
        <Text style={styles.questionTitle}>Question {qIndex + 1}</Text>
        <View style={{ flexDirection: "row" }}>
          <IconPill icon="copy-outline" onPress={() => duplicateQuestion(sIndex, qIndex)} label="Dupliquer" />
          <IconPill icon="trash-outline" color={DANGER} onPress={() => removeQuestion(sIndex, qIndex)} label="Supprimer" />
        </View>
      </View>

      <TextInput style={styles.input} placeholder="Texte de la question" value={q.question} onChangeText={text => updateQuestion(sIndex, qIndex, "question", text)} />

      <Text style={styles.label}>Type</Text>
      <View style={styles.chipsRow}>
        <Chip active={q.type === "true_false"} onPress={() => updateQuestion(sIndex, qIndex, "type", "true_false") || updateQuestion(sIndex, qIndex, "answer", "")} text="Vrai / Faux" icon="git-commit-outline" />
        <Chip active={q.type === "multiple_choice"} onPress={() => updateQuestion(sIndex, qIndex, "type", "multiple_choice") || updateQuestion(sIndex, qIndex, "answer", "")} text="QCM" icon="list-outline" />
        <Chip active={q.type === "open"} onPress={() => updateQuestion(sIndex, qIndex, "type", "open")} text="Réponse libre" icon="create-outline" />
      </View>

      {q.type === "true_false" && (
        <View style={styles.tfRow}>
          <TFButton text="Vrai" selected={q.answer === "true"} onPress={() => updateQuestion(sIndex, qIndex, "answer", "true")} />
          <TFButton text="Faux" selected={q.answer === "false"} onPress={() => updateQuestion(sIndex, qIndex, "answer", "false")} />
        </View>
      )}

      {q.type === "multiple_choice" && (
        <View>
          {(q.options.length ? q.options : ["", ""]).map((opt, optIndex) => (
            <View key={optIndex} style={styles.optionRow}>
              <TouchableOpacity style={styles.radio} onPress={() => selectCorrectOption(sIndex, qIndex, opt)}>
                <Ionicons name={q.answer === opt ? "checkmark-circle" : "ellipse-outline"} size={20} color={q.answer === opt ? PRIMARY : TEXT_MUTED} />
              </TouchableOpacity>
              <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} placeholder={`Option ${optIndex + 1}`} value={opt} onChangeText={text => updateOption(sIndex, qIndex, optIndex, text)} />
              <TouchableOpacity style={[styles.iconBtn, { marginLeft: 8 }]} onPress={() => removeOption(sIndex, qIndex, optIndex)}>
                <Ionicons name="close-circle-outline" size={18} color={TEXT_MUTED} />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.addInline} onPress={() => addOption(sIndex, qIndex)}>
            <Ionicons name="add-circle-outline" size={18} color={PRIMARY} />
            <Text style={{ color: PRIMARY, marginLeft: 6 }}>Ajouter une option</Text>
          </TouchableOpacity>
        </View>
      )}

      {q.type === "open" && (
        <View>
          <Text style={styles.muted}>(Facultatif) Saisis une réponse attendue pour correction auto.</Text>
          <TextInput style={styles.input} placeholder="Réponse correcte (optionnelle)" value={q.answer} onChangeText={text => updateQuestion(sIndex, qIndex, "answer", text)} />
        </View>
      )}
    </View>
  );
}

/* ---------- Styles modernisés ---------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7F8FA" },
  header: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 12, backgroundColor: SURFACE, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 3 },
  headerTitle: { fontSize: 24, fontWeight: "900", color: "#1F2937", marginBottom: 8 },
  counters: { flexDirection: "row", gap: 10, marginBottom: 6 },
  card: { backgroundColor: SURFACE, borderRadius: 16, padding: 14, marginHorizontal: 16, marginVertical: 8, borderWidth: 1, borderColor: "#E5E7EB", shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  label: { color: TEXT_MUTED, fontSize: 13, marginBottom: 6, fontWeight: "600" },
  input: { backgroundColor: CARD, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#E5E7EB", marginBottom: 12, fontSize: 15, color: "#111827" },
  muted: { color: TEXT_MUTED, fontSize: 12, marginBottom: 6 },
  subthemeCard: { backgroundColor: SURFACE, borderRadius: 20, borderWidth: 1, borderColor: "#E5E7EB", marginHorizontal: 16, marginBottom: 16, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  subHeader: { padding: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#F3F4F6" },
  subHeaderLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  subNameInput: { flex: 1, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: SURFACE, borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB", marginLeft: 10, fontWeight: "700", fontSize: 15, color: "#1F2937" },
  subHeaderRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconBtn: { padding: 6, borderRadius: 10, backgroundColor: "#F9F9FB", borderWidth: 1, borderColor: "#E5E7EB" },
  questionCard: { backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: "#E5E7EB", marginHorizontal: 12, marginBottom: 12, padding: 14, shadowColor: "#000", shadowOpacity: 0.02, shadowRadius: 6, elevation: 1 },
  questionTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  questionTitle: { fontWeight: "800", fontSize: 15, color: "#1F2937" },
  chipsRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  tfRow: { flexDirection: "row", gap: 10, marginTop: 6 },
  optionRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  radio: { marginRight: 8 },
  addInline: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  addQuestion: { flexDirection: "row", backgroundColor: PRIMARY, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, alignItems: "center", justifyContent: "center", marginVertical: 12, marginHorizontal: 12 },
  addQuestionText: { color: "#fff", fontWeight: "700", marginLeft: 6 },
  addSubtheme: { marginHorizontal: 16, marginTop: 8, marginBottom: 140, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: PRIMARY, backgroundColor: "#F8F9FF", alignItems: "center", flexDirection: "row", justifyContent: "center" },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, borderTopWidth: 1, borderTopColor: "#E5E7EB", backgroundColor: SURFACE, padding: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  saveButton: { backgroundColor: SUCCESS, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 16, flexDirection: "row", alignItems: "center", gap: 8 },
  saveButtonText: { color: "#fff", fontWeight: "800", fontSize: 15 },
});

const badgeStyles = StyleSheet.create({
  badge: { borderWidth: 1, borderColor: PRIMARY, backgroundColor: "#F1F0FF", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, flexDirection: "row", alignItems: "center" },
  text: { color: PRIMARY, fontWeight: "700", fontSize: 12 },
  small: { paddingHorizontal: 6, paddingVertical: 2 },
});

const chipStyles = StyleSheet.create({
  chip: { borderWidth: 1, borderColor: PRIMARY, backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, flexDirection: "row", alignItems: "center" },
  active: { backgroundColor: PRIMARY },
  text: { color: PRIMARY, fontWeight: "700", fontSize: 13 },
});

const tfStyles = StyleSheet.create({
  btn: { flex: 1, borderWidth: 1, borderColor: PRIMARY, borderRadius: 14, paddingVertical: 10, alignItems: "center", backgroundColor: "#fff" },
  selected: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  text: { color: PRIMARY, fontWeight: "700" },
});
