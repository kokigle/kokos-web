// src/firebase.js
// Centralized Firebase initialization — single source of truth
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCum5WobSVztOyPE5fijSt4Edrig2k00v8",
  authDomain: "kokos-web.firebaseapp.com",
  projectId: "kokos-web",
  storageBucket: "kokos-web.firebasestorage.app",
  messagingSenderId: "714849880120",
  appId: "1:714849880120:web:ce985c1ce79ab668b33ecd",
  measurementId: "G-SX009W4G8Z",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
