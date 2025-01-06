import { getFirestore } from "firebase/firestore";
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyDnAWJ1JMybH-GYgZatbIsf9YlVIk4JMSE",
  authDomain: "stocklist-69594.firebaseapp.com",
  projectId: "stocklist-69594",
  storageBucket: "stocklist-69594.firebasestorage.app",
  messagingSenderId: "66199633577",
  appId: "1:66199633577:web:3bd6af45d31e49db8033b8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
