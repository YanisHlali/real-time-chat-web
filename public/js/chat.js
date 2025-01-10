import { db, auth } from './firebase.js';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/9.1.0/firebase-auth.js';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot
} from 'https://www.gstatic.com/firebasejs/9.1.0/firebase-firestore.js';

const socket = io();
let userDisplayName = '';

document.getElementById('google-login-btn').addEventListener('click', async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    userDisplayName = result.user.displayName;
    socket.emit('userConnected', {
      userId: result.user.uid,
      displayName: userDisplayName
    });
    updateUIAfterLogin(userDisplayName);
  } catch (err) {
    console.error(err);
  }
});

document.getElementById('logout-btn').addEventListener('click', async () => {
  try {
    await signOut(auth);
    socket.emit('userDisconnected');
    userDisplayName = 'Anonyme';
    updateUIAfterLogout();
  } catch (err) {
    console.error(err);
  }
});

socket.on('updateUserStatus', (data) => {
  const list = document.getElementById('online-users');
  const existing = document.getElementById('user-' + data.userId);
  if (data.status === 'online') {
    if (!existing) {
      const li = document.createElement('li');
      li.id = 'user-' + data.userId;
      li.textContent = (data.displayName || 'Anonyme') + ' est en ligne';
      list.appendChild(li);
    }
  } else if (data.status === 'offline') {
    if (existing) {
      list.removeChild(existing);
    }
  }
});

function updateUIAfterLogin(name) {
  document.getElementById('username').textContent = name;
  document.getElementById('welcome-message').style.display = 'block';
  document.getElementById('google-login-btn').style.display = 'none';
  document.getElementById('logout-btn').style.display = 'block';
}

function updateUIAfterLogout() {
  document.getElementById('welcome-message').style.display = 'none';
  document.getElementById('google-login-btn').style.display = 'block';
  document.getElementById('logout-btn').style.display = 'none';
  userDisplayName = 'Anonyme';
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    userDisplayName = user.displayName || 'Utilisateur Google';
    updateUIAfterLogin(userDisplayName);
  } else {
    updateUIAfterLogout();
  }
});

document.getElementById('chat-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = document.getElementById('message');
  const msg = input.value.trim();
  if (msg) {
    try {
      await addDoc(collection(db, 'messages'), {
        user: userDisplayName || 'Anonyme',
        message: msg,
        timestamp: new Date()
      });
      input.value = '';
    } catch (err) {
      console.error(err);
    }
  }
});

const refMsg = collection(db, 'messages');
const q = query(refMsg, orderBy('timestamp'));
onSnapshot(q, (snap) => {
  const messages = document.getElementById('messages');
  messages.innerHTML = '';
  snap.forEach((doc) => {
    const d = doc.data();
    const li = document.createElement('li');
    li.classList.add('message-container');
    if (d.user === userDisplayName) {
      li.classList.add('user-message');
    }
    const bubble = document.createElement('div');
    bubble.classList.add('message-bubble');
    bubble.textContent = d.user + ': ' + d.message;
    li.appendChild(bubble);
    messages.appendChild(li);
  });
});

const refUsers = collection(db, 'onlineUsers');
const qUsers = query(refUsers);
onSnapshot(qUsers, (snap) => {
  const list = document.getElementById('online-users');
  list.innerHTML = '';
  snap.forEach((doc) => {
    const data = doc.data();
    if (data.status === 'online') {
      const li = document.createElement('li');
      li.id = 'user-' + doc.id;
      li.textContent = (data.displayName || 'Anonyme') + ' est en ligne';
      list.appendChild(li);
    }
  });
});
