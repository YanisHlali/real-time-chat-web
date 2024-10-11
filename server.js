const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const admin = require('firebase-admin');
const serviceAccount = require('./key.json');
const path = require("path");

// Initialiser Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://real-time-chat-c14c1.firebaseio.com'
});

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

// Connexion des utilisateurs
io.on('connection', (socket) => {
  console.log('Un utilisateur est connecté');

  // Écouter les événements de message
  socket.on('chatMessage', async (msg) => {
    const { token, user, message } = msg;

    if (token) {
      try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        const uid = decodedToken.uid;
        const username = decodedToken.name || user;

        io.emit('chatMessage', { user: username, message: message });
      } catch (error) {
        console.error('Erreur de vérification du token:', error.message);
      }
    } else {
      io.emit('chatMessage', { user: user || 'Anonyme', message: message });
    }
  });

  // Écouter les événements de saisie de texte
  socket.on('typing', (data) => {
    socket.broadcast.emit('typing', data); // Diffuser à tous les autres utilisateurs
  });

  socket.on('stopTyping', (data) => {
    socket.broadcast.emit('stopTyping'); // Indiquer que l'utilisateur a cessé de taper
  });

  socket.on('disconnect', () => {
    console.log('Un utilisateur s\'est déconnecté');
  });
});

// Démarrer le serveur
server.listen(3000, () => {
  console.log('Serveur démarré sur http://localhost:3000');
});
