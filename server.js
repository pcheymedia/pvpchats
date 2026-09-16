const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// --- SUNUCU ODALARI (Misali2 Eklendi) ---
const sunucular = [
    { id: 'harbi2', ad: 'Harbi2', ikon: '⚔️', aciklama: 'Emek Server Odası' },
    { id: 'misali2', ad: 'Misali2', ikon: '🏹', aciklama: 'Popüler Emek PvP' },
    { id: 'risalemt2', ad: 'RisaleMt2', ikon: '🛡️', aciklama: 'Orta Emek Server' },
    { id: 'lova2', ad: 'Lova2', ikon: '🔥', aciklama: 'VSlik PvP Server' },
    { id: 'rohan2', ad: 'Rohan2', ikon: '🐉', aciklama: 'Global Hard Emek' },
    { id: 'mykomobile', ad: 'MykoMobile', ikon: '📱', aciklama: 'Mobil PvP Deneyimi' }
];

const odaSayilari = { harbi2: 0, misali2: 0, risalemt2: 0, lova2: 0, rohan2: 0, mykomobile: 0 };
const odaGecmisi = { harbi2: [], misali2: [], risalemt2: [], lova2: [], rohan2: [], mykomobile: [] };

// --- ARAYÜZ (HTML / CSS / JS) ---
const chatHtml = `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>PvPChats - Metin2 PvP Sohbet Odaları</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        body { background: #0b0d11; color: #f1f5f9; display: flex; flex-direction: column; height: 100dvh; overflow: hidden; }
        .gm-banner { background: linear-gradient(90deg, #b8860b, #ffd700, #b8860b); color: #000; text-align: center; padding: 10px; font-weight: 900; font-size: 14px; letter-spacing: 0.5px; }
        header { background: #131720; border-bottom: 1px solid #1f2633; padding: 14px 16px; display: flex; justify-content: space-between; align-items: center; }
        .logo { color: #f59e0b; font-weight: 800; font-size: 1.2rem; }
        #room-screen { flex: 1; padding: 20px 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; }
        .room-card { background: #131720; border: 1px solid #1f2633; padding: 16px; border-radius: 12px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; transition: 0.2s; }
        .room-card:active { transform: scale(0.98); background: #181d28; }
        .room-info { display: flex; align-items: center; gap: 14px; }
        .room-icon { font-size: 1.8rem; }
        .room-count { background: #1e2430; color: #38bdf8; padding: 6px 10px; border-radius: 8px; font-size: 0.8rem; font-weight: bold; border: 1px solid #334155; }
        #nickname-modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 1000; justify-content: center; align-items: center; padding: 20px; }
        .modal-content { background: #131720; padding: 24px; border-radius: 12px; width: 100%; max-width: 350px; text-align: center; border: 1px solid #334155; }
        .input-group { margin: 16px 0; }
        .input-group input { width: 100%; background: #0b0d11; border: 1px solid #334155; color: #fff; padding: 12px; border-radius: 8px; text-align: center; font-size: 1rem; outline: none; }
        .btn-join { width: 100%; background: #f59e0b; color: #000; border: none; padding: 12px; border-radius: 8px; font-weight: 800; cursor: pointer; font-size: 1rem; }
        #chat-screen { display: none; flex: 1; flex-direction: column; height: 100dvh; }
        .chat-subhead { background: #181d28; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1f2633; }
        .back-btn { background: none; border: none; color: #94a3b8; font-size: 0.95rem; cursor: pointer; font-weight: bold; }
        #messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
        .msg { background: #131720; padding: 10px 14px; border-radius: 8px; border: 1px solid #1f2633; font-size: 0.95rem; line-height: 1.4; word-break: break-word; }
        .vip-glow { color: #ffd700 !important; font-weight: bold; text-shadow: 0 0 6px rgba(255,215,0,0.4); }
        #form-container { background: #131720; padding: 12px; border-top: 1px solid #1f2633; }
        form { display: flex; gap: 8px; }
        #chat-input { flex: 1; background: #0b0d11; border: 1px solid #334155; color: #fff; padding: 12px 14px; border-radius: 8px; outline: none; font-size: 0.95rem; }
        .btn-send { background: #38bdf8; color: #000; border: none; padding: 0 18px; border-radius: 8px; font-weight: 700; cursor: pointer; }
    </style>
</head>
<body>
    <div class="gm-banner">👑 Admin / Reklam: fazlicaniletisim@gmail.com</div>
    <header><div class="logo">⚔️ PvPChats</div></header>

    <div id="room-screen">
        <div id="room-list"></div>
    </div>

    <div id="nickname-modal">
        <div class="modal-content">
            <h3 style="color:#f59e0b;">Sohbete Katıl</h3>
            <p style="color:#94a3b8; font-size:0.85rem; margin-top:6px;">Bir karakter adı belirleyin:</p>
            <div class="input-group">
                <input type="text" id="nickname-input" placeholder="Örn: Savasci1" maxlength="15" autocomplete="off">
            </div>
            <button class="btn-join" onclick="joinRoom()">Giriş Yap</button>
        </div>
    </div>

    <div id="chat-screen">
        <div class="chat-subhead">
            <button class="back-btn" onclick="location.reload()">◀ Odalar</button>
            <div id="active-room-name" style="color:#f59e0b; font-weight:bold;"></div>
        </div>
        <div id="messages"></div>
        <div id="form-container">
            <form id="chat-form">
                <input id="chat-input" placeholder="Mesaj yaz..." autocomplete="off">
                <button class="btn-send">Gönder</button>
            </form>
        </div>
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io();
        let selectedRoom = null;
        let myNick = '';
        const sunucular = ${JSON.stringify(sunucular)};

        function renderRooms(counts) {
            const list = document.getElementById('room-list');
            list.innerHTML = '';
            sunucular.forEach(s => {
                const c = counts[s.id] || 0;
                list.innerHTML += \`
                    <div class="room-card" onclick="openModal('\${s.id}')">
                        <div class="room-info">
                            <div class="room-icon">\${s.ikon}</div>
                            <div>
                                <h3 style="font-size:1.05rem;">\${s.ad}</h3>
                                <p style="color:#94a3b8; font-size:0.8rem; margin-top:2px;">\${s.aciklama}</p>
                            </div>
                        </div>
                        <div class="room-count">👥 \${c} Çevrimiçi</div>
                    </div>\`;
            });
        }

        socket.on('room_counts', renderRooms);

        function openModal(id) {
            selectedRoom = sunucular.find(s => s.id === id);
            document.getElementById('nickname-modal').style.display = 'flex';
            document.getElementById('nickname-input').focus();
        }

        function joinRoom() {
            myNick = document.getElementById('nickname-input').value.trim() || 'Misafir' + Math.floor(Math.random() * 1000);
            document.getElementById('nickname-modal').style.display = 'none';
            document.getElementById('room-screen').style.display = 'none';
            document.getElementById('chat-screen').style.display = 'flex';
            document.getElementById('active-room-name').innerText = selectedRoom.ad;
            socket.emit('join_room', { room: selectedRoom.id, username: myNick });
        }

        document.getElementById('chat-form').onsubmit = (e) => {
            e.preventDefault();
            const input = document.getElementById('chat-input');
            if (input.value.trim()) {
                socket.emit('send_message', { room: selectedRoom.id, text: input.value });
                input.value = '';
            }
        };

        socket.on('receive_message', (d) => {
            const m = document.getElementById('messages');
            const isVip = d.user.toLowerCase().includes('vip');
            m.innerHTML += \`<div class="msg"><b class="\${isVip ? 'vip-glow' : ''}">\${d.user}:</b> \${d.text}</div>\`;
            m.scrollTop = m.scrollHeight;
        });

        socket.on('room_history', (h) => {
            const m = document.getElementById('messages');
            m.innerHTML = '';
            h.forEach(d => {
                const isVip = d.user.toLowerCase().includes('vip');
                m.innerHTML += \`<div class="msg"><b class="\${isVip ? 'vip-glow' : ''}">\${d.user}:</b> \${d.text}</div>\`;
            });
            m.scrollTop = m.scrollHeight;
        });
    </script>
</body>
</html>
`;

app.get('/', (req, res) => res.send(chatHtml));

// --- REALTIME SOHBET BAĞLANTISI ---
io.on('connection', (socket) => {
    socket.emit('room_counts', odaSayilari);

    socket.on('join_room', (data) => {
        socket.username = data.username;
        socket.room = data.room;
        socket.join(data.room);

        if (odaSayilari[data.room] !== undefined) {
            odaSayilari[data.room]++;
        }
        io.emit('room_counts', odaSayilari);
        socket.emit('room_history', odaGecmisi[data.room]);
    });

    socket.on('send_message', (data) => {
        const msg = { user: socket.username, text: data.text };
        if (odaGecmisi[data.room]) {
            odaGecmisi[data.room].push(msg);
            if (odaGecmisi[data.room].length > 300) odaGecmisi[data.room].shift();
        }
        io.to(data.room).emit('receive_message', msg);
    });

    socket.on('disconnect', () => {
        if (socket.room && odaSayilari[socket.room] > 0) {
            odaSayilari[socket.room]--;
            io.emit('room_counts', odaSayilari);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`PvPChats ${PORT} portunda aktif.`));
