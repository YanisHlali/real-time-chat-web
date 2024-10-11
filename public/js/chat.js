import { db, auth, provider, signInWithPopup } from './firebase.js';
import { collection, addDoc, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-firestore.js";

const socket = io();

let isAnonymous = false;
let userDisplayName = "";
let typingTimeout;

const typingIndicator = document.createElement("p");
typingIndicator.setAttribute("id", "typing-indicator");
typingIndicator.textContent = "";
document.getElementById("chat").appendChild(typingIndicator);

// Connexion via Google
document.getElementById('google-login-btn').addEventListener('click', async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    userDisplayName = result.user.displayName;

    // Mettre à jour l'interface après la connexion
    updateUIAfterLogin(userDisplayName);
    console.log("Connecté en tant que :", userDisplayName);
  } catch (error) {
    console.error("Erreur lors de la connexion Google:", error.message);
  }
});

// Mise à jour de l'interface après connexion
function updateUIAfterLogin(displayName) {
  document.getElementById("username").textContent = displayName;
  document.getElementById("welcome-message").style.display = "block";
  document.getElementById("google-login-btn").style.display = "none";
  document.getElementById("logout-btn").style.display = "block";
}

// Déconnexion
document.getElementById("logout-btn").addEventListener("click", () => {
  auth.signOut().then(() => {
    console.log("Déconnecté");
    updateUIAfterLogout();
  });
});

function updateUIAfterLogout() {
  document.getElementById("welcome-message").style.display = "none";
  document.getElementById("google-login-btn").style.display = "block";
  document.getElementById("logout-btn").style.display = "none";
}

// Gestion de l'indicateur "en train d'écrire"
const messageInput = document.getElementById("message");
messageInput.addEventListener("input", () => {
  socket.emit("typing", { user: userDisplayName || "Anonyme" });

  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit("stopTyping", { user: userDisplayName || "Anonyme" });
  }, 3000);
});

// Gestion de la soumission du formulaire
document.getElementById("chat-form").addEventListener("submit", function (e) {
  e.preventDefault();
  sendMessage();
});

async function sendMessage() {
  const message = document.getElementById("message").value;
  let idToken = null;

  if (!isAnonymous) {
    const user = auth.currentUser;
    if (user) {
      idToken = await user.getIdToken();
      userDisplayName = user.displayName || "Utilisateur Google";
    }
  }

  try {
    const messagesRef = collection(db, "messages");
    await addDoc(messagesRef, {
      user: userDisplayName || "Anonyme",
      message: message,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Erreur lors de l'enregistrement dans Firestore :", error);
  }

  socket.emit("chatMessage", {
    message,
    token: idToken || null,
    user: userDisplayName || "Anonyme",
  });

  document.getElementById("message").value = ""; // Vider le champ
}

// Récupérer les messages en temps réel
const messagesRef = collection(db, "messages");
const q = query(messagesRef, orderBy("timestamp"));
onSnapshot(q, (snapshot) => {
  const messages = document.getElementById("messages");
  messages.innerHTML = ""; // Effacer les anciens messages

  snapshot.forEach((doc) => {
    const messageData = doc.data();
    const li = document.createElement("li");
    li.textContent = `${messageData.user}: ${messageData.message}`;
    messages.appendChild(li);
  });
});

// Écouter les événements de saisie de texte
socket.on("typing", (data) => {
  document.getElementById("typing-indicator").textContent = `${data.user} est en train d'écrire...`;
});

socket.on("stopTyping", () => {
  document.getElementById("typing-indicator").textContent = "";
});
