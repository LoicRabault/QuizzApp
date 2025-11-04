// app/services/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBj7jlpZpbryAp-sU9d4GBGAeuUbxZ4IVw",
  authDomain: "quizzapp-8dc69.firebaseapp.com",
  projectId: "quizzapp-8dc69",
  storageBucket: "quizzapp-8dc69.appspot.com", // ✅ corrige ici
  messagingSenderId: "613421109205",
  appId: "1:613421109205:web:8c894b2e8dae095bf0b75c",
};

// ✅ Initialisation Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
