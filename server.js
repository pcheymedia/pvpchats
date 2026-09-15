const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Statik dosyaları sunmak için ana sayfa
app.get('/', (req, res) => {
  res.send('PvPChats.com Aktif ve Çalışıyor! 🚀');
});

// Socket.io bağlantı yönetimi
io.on('connection', (socket) => {
  console.log('Bir kullanıcı bağlandı:', socket.id);

  // Odaya katılma
  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`Kullanıcı ${room} odasına katıldı.`);
  });

  // Mesajlaşma
  socket.on('send_message', (data) => {
    io.to(data.room).emit('receive_message', data);
  });

  socket.on('disconnect', () => {
    console.log('Kullanıcı ayrıldı:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor.`);
});
