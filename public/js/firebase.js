import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-firestore.js";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-auth.js";

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCrfdtC5F5YHXN9EsDJsbI98kRQWcgrnLI",
  authDomain: "real-time-chat-c14c1.firebaseapp.com",
  projectId: "real-time-chat-c14c1",
  storageBucket: "real-time-chat-c14c1.appspot.com",
  messagingSenderId: "162204123268",
  appId: "1:162204123268:web:1c3ea90aa8c369ab2102d1",
  measurementId: "G-M79NDCMQP0",
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Initialiser Firestore et Auth
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Exporter Firestore, Auth et Provider Google
export { db, auth, provider, signInWithPopup };
