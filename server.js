const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Şık, karanlık temalı PvP Chat Arayüzü
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="tr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>PvPChats - Canlı Sohbet</title>
            <script src="/socket.io/socket.io.js"></script>
            <style>
                body { background-color: #0f172a; color: #f8fafc; font-family: Arial, sans-serif; margin: 0; display: flex; flex-direction: column; height: 100vh; }
                header { background: #1e293b; padding: 15px; text-align: center; font-size: 20px; font-weight: bold; border-bottom: 1px solid #334155; color: #38bdf8; }
                #chat-box { flex: 1; padding: 15px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; }
                .message { background: #1e293b; padding: 10px 15px; border-radius: 8px; max-width: 75%; word-break: break-word; border: 1px solid #334155; }
                .message span { font-weight: bold; color: #38bdf8; display: block; font-size: 12px; margin-bottom: 4px; }
                #form { background: #1e293b; padding: 15px; display: flex; gap: 10px; border-top: 1px solid #334155; }
                #input { flex: 1; background: #0f172a; border: 1px solid #475569; color: #fff; padding: 12px; border-radius: 6px; outline: none; font-size: 16px; }
                #input:focus { border-color: #38bdf8; }
                button { background: #2563eb; color: #white; border: none; padding: 0 20px; border-radius: 6px; font-weight: bold; cursor: pointer; color: #fff; font-size: 16px; }
                button:hover { background: #1d4ed8; }
            </style>
        </head>
        <body>
            <header>⚔️ PvPChats Canlı Sohbet ⚔️</header>
            <div id="chat-box"></div>
            <form id="form">
                <input id="input" autocomplete="off" placeholder="Mesajınızı yazın..." required />
                <button>Gönder</button>
            </form>
            <script>
                const socket = io();
                const form = document.getElementById('form');
                const input = document.getElementById('input');
                const chatBox = document.getElementById('chat-box');

                const username = "Oyuncu_" + Math.floor(Math.random() * 1000);

                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    if (input.value) {
                        socket.emit('send_message', { room: 'general', user: username, text: input.value });
                        input.value = '';
                    }
                });

                socket.emit('join_room', 'general');

                socket.on('receive_message', (data) => {
                    const item = document.createElement('div');
                    item.classList.add('message');
                    item.innerHTML = '<span>' + data.user + '</span>' + data.text;
                    chatBox.appendChild(item);
                    chatBox.scrollTop = chatBox.scrollHeight;
                });
            </script>
        </body>
        </html>
    `);
});

// Socket.io bağlantı yönetimi
io.on('connection', (socket) => {
    console.log('Bir kullanıcı bağlandı.');

    socket.on('join_room', (room) => {
        socket.join(room);
    });

    socket.on('send_message', (data) => {
        io.to(data.room).emit('receive_message', data);
    });

    socket.on('disconnect', () => {
        console.log('Kullanıcı ayrıldı.');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor.`);
});
