import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import admin from 'firebase-admin';
import path from 'path';
import { fileURLToPath } from 'url';
import serviceAccount from './key.json' assert { type: 'json' };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://real-time-chat-c14c1.firebaseio.com'
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  socket.on('userConnected', async (userData) => {
    socket.userId = userData.userId;
    const ref = admin.firestore().collection('onlineUsers').doc(userData.userId);
    await ref.set({
      displayName: userData.displayName,
      status: 'online',
      lastSeen: admin.firestore.FieldValue.serverTimestamp()
    });
    io.emit('updateUserStatus', {
      userId: userData.userId,
      displayName: userData.displayName,
      status: 'online'
    });
  });
  socket.on('userDisconnected', async () => {
    if (socket.userId) {
      const ref = admin.firestore().collection('onlineUsers').doc(socket.userId);
      await ref.update({
        status: 'offline',
        lastSeen: admin.firestore.FieldValue.serverTimestamp()
      });
      io.emit('updateUserStatus', {
        userId: socket.userId,
        status: 'offline'
      });
    }
  });
  socket.on('disconnect', async () => {
    if (socket.userId) {
      const ref = admin.firestore().collection('onlineUsers').doc(socket.userId);
      await ref.update({
        status: 'offline',
        lastSeen: admin.firestore.FieldValue.serverTimestamp()
      });
      io.emit('updateUserStatus', {
        userId: socket.userId,
        status: 'offline'
      });
    }
  });
});

setInterval(async () => {
  const now = new Date();
  const tenMinutesAgo = new Date(now.getTime() - 600000);
  try {
    const snap = await admin.firestore().collection('onlineUsers').where('status', '==', 'online').get();
    snap.forEach(async (doc) => {
      const data = doc.data();
      const lastSeen = data.lastSeen ? data.lastSeen.toDate() : null;
      if (!lastSeen || lastSeen < tenMinutesAgo) {
        await doc.ref.update({ status: 'offline' });
        io.emit('updateUserStatus', { userId: doc.id, status: 'offline' });
      }
    });
  } catch (err) {
    console.error(err);
  }
}, 3000);

server.listen(3000, () => {
  console.log('Serveur démarré sur http://localhost:3000');
});
