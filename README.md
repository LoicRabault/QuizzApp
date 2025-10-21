# 🧠 QuizzApp
Application **React Native + Firebase** permettant de créer, gérer et supprimer des quiz personnalisés depuis une interface admin simple et claire.

## 🚀 Fonctionnalités principales
- 🔐 Authentification admin (Firebase Auth)
- 🧩 Création de quiz complets (titre, thème, sous-thèmes)
- 📝 Ajout de plusieurs questions avec options et réponse correcte
- 📋 Liste des quiz avec édition et suppression
- 🎨 Interface claire, moderne et responsive (Expo + Ionicons)

## 📁 Structure
app/
┣ admin/
┃ ┣ AdminHomeScreen.js
┃ ┣ QuizFormScreen.js
┃ ┗ QuizListScreen.js
┣ auth/
┃ ┣ LoginScreen.js
┃ ┗ RegisterScreen.js
services/
┗ firebase.jsapp/
┣ admin/
┃ ┣ AdminHomeScreen.js
┃ ┣ QuizFormScreen.js
┃ ┗ QuizListScreen.js
┣ auth/
┃ ┣ LoginScreen.js
┃ ┗ RegisterScreen.js
services/
┗ firebase.js


---

## ▶️ Lancer le projet
```bash
npm install
npx expo start
