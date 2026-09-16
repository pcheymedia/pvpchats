const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// --- SOHBET SİSTEMİ VERİLERİ ---
const sunucular = [
    { id: 'harbi2', ad: 'Harbi2', ikon: '⚔️', aciklama: 'Emek Server Odası' },
    { id: 'risalemt2', ad: 'RisaleMt2', ikon: '🛡️', aciklama: 'Orta Emek Server' },
    { id: 'lova2', ad: 'Lova2', ikon: '🔥', aciklama: 'VSlik PvP Server' },
    { id: 'rohan2', ad: 'Rohan2', ikon: '🐉', aciklama: 'Global Hard Emek' },
    { id: 'mykomobile', ad: 'MykoMobile', ikon: '📱', aciklama: 'Mobil PvP Deneyimi' }
];

const odaSayilari = { harbi2: 0, risalemt2: 0, lova2: 0, rohan2: 0, mykomobile: 0 };
const odaGecmisi = { harbi2: [], risalemt2: [], lova2: [], rohan2: [], mykomobile: [] };

// --- 5 KİŞİLİK MİNİ OYUN MOTORU VERİLERİ ---
const OYUNCU_LIMITI = 5;
const MAX_DUVAR_SAYISI = 40;
const oyuncular = {};
let duvarlar = [];

// Canı hiç bitmeyen sabit madenler
const madenler = [
    { id: 1, x: 300, y: 300 },
    { id: 2, x: 750, y: 400 },
    { id: 3, x: 500, y: 650 }
];

// 1. ANA SAYFA (SOHBET)
const chatHtml = `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>PvPChats - Odalar</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        body { background: #0b0d11; color: #f1f5f9; display: flex; flex-direction: column; height: 100dvh; overflow: hidden; }
        .gm-banner { background: linear-gradient(90deg, #b8860b, #ffd700, #b8860b); color: #000; text-align: center; padding: 10px; font-weight: 900; font-size: 14px; }
        .gm-banner a { color: #000; font-weight: bold; margin-left: 10px; background: #fff; padding: 3px 8px; border-radius: 4px; text-decoration: none; }
        header { background: #131720; border-bottom: 1px solid #1f2633; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; }
        .logo { color: #f59e0b; font-weight: 800; font-size: 1.1rem; }
        #room-screen { flex: 1; padding: 20px 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; }
        .room-card { background: #131720; border: 1px solid #1f2633; padding: 16px; border-radius: 12px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; }
        .room-info { display: flex; align-items: center; gap: 14px; }
        .room-icon { font-size: 1.8rem; }
        .room-count { background: #1e2430; color: #38bdf8; padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: bold; border: 1px solid #334155; }
        #nickname-modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 1000; justify-content: center; align-items: center; padding: 20px; }
        .modal-content { background: #131720; padding: 24px; border-radius: 12px; width: 100%; max-width: 350px; text-align: center; }
        .input-group { display: flex; gap: 8px; margin: 16px 0; }
        .input-group input { flex: 1; background: #0b0d11; border: 1px solid #334155; color: #fff; padding: 12px; border-radius: 8px; text-align: center; }
        .btn-join { width: 100%; background: #f59e0b; color: #000; border: none; padding: 12px; border-radius: 8px; font-weight: 700; cursor: pointer; }
        #chat-screen { display: none; flex: 1; flex-direction: column; height: 100dvh; }
        .chat-subhead { background: #181d28; padding: 10px 16px; display: flex; justify-content: space-between; }
        #messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
        .msg { background: #131720; padding: 10px; border-radius: 8px; border: 1px solid #1f2633; color: #fff; }
        .vip-glow { color: #ffd700 !important; font-weight: bold; }
        #form-container { background: #131720; padding: 12px; }
        form { display: flex; gap: 8px; }
        #chat-input { flex: 1; background: #0b0d11; border: 1px solid #334155; color: #fff; padding: 12px; border-radius: 8px; }
        .btn-send { background: #38bdf8; border: none; padding: 0 16px; border-radius: 8px; font-weight: bold; cursor: pointer; }
    </style>
</head>
<body>
    <div class="gm-banner">
        👑 Admin: fazlicaniletisim@gmail.com
        <a href="/oyun">🎮 Mini PvP Oyunu Oyna</a>
    </div>
    <header><div class="logo">⚔️ PvPChats</div></header>
    <div id="room-screen"><div id="room-list"></div></div>
    <div id="nickname-modal">
        <div class="modal-content">
            <h3>Sohbete Katıl</h3>
            <div class="input-group"><input type="text" id="nickname-input" placeholder="Karakter Adı" maxlength="15"></div>
            <button class="btn-join" onclick="joinRoom()">Giriş Yap</button>
        </div>
    </div>
    <div id="chat-screen">
        <div class="chat-subhead">
            <button onclick="location.reload()" style="background:none;border:none;color:#94a3b8;cursor:pointer;">◀ Geri</button>
            <div id="active-room-name" style="color:#f59e0b;font-weight:bold;"></div>
        </div>
        <div id="messages"></div>
        <div id="form-container">
            <form id="chat-form">
                <input id="chat-input" placeholder="Mesaj gönder..." autocomplete="off">
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
                        <div class="room-info"><div class="room-icon">\${s.ikon}</div><div><h3>\${s.ad}</h3><p style="color:#94a3b8;font-size:0.8rem;">\${s.aciklama}</p></div></div>
                        <div class="room-count">👥 \${c}</div>
                    </div>\`;
            });
        }
        socket.on('room_counts', renderRooms);
        function openModal(id) { selectedRoom = sunucular.find(s => s.id === id); document.getElementById('nickname-modal').style.display = 'flex'; }
        function joinRoom() {
            myNick = document.getElementById('nickname-input').value.trim() || 'Misafir' + Math.floor(Math.random()*1000);
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
            m.innerHTML += \`<div class="msg"><b class="\${d.user.toLowerCase().includes('vip')?'vip-glow':''}">\${d.user}:</b> \${d.text}</div>\`;
            m.scrollTop = m.scrollHeight;
        });
        socket.on('room_history', (h) => {
            h.forEach(d => {
                document.getElementById('messages').innerHTML += \`<div class="msg"><b class="\${d.user.toLowerCase().includes('vip')?'vip-glow':''}">\${d.user}:</b> \${d.text}</div>\`;
            });
        });
    </script>
</body>
</html>
`;

// 2. OYUN SAYFASI (MOBİL DOKUNMATİK + MASAÜSTÜ DESTEKLİ)
const gameHtml = `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>PvPChats - Mini Hayatta Kalma</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; touch-action: none; -webkit-user-select: none; user-select: none; }
        body { background: #0f172a; overflow: hidden; color: #fff; font-family: sans-serif; }
        #ui { position: absolute; top: 12px; left: 12px; background: rgba(15,23,42,0.85); padding: 10px 14px; border-radius: 8px; border: 1px solid #334155; pointer-events: none; z-index: 10; }
        #ui h2 { font-size: 0.95rem; color: #f59e0b; margin-bottom: 4px; }
        .stat-badge { font-size: 0.85rem; color: #38bdf8; font-weight: bold; }
        #exit-btn { position: absolute; top: 12px; right: 12px; background: #ef4444; border: none; color: #fff; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: bold; text-decoration: none; font-size: 0.8rem; z-index: 10; }
        canvas { display: block; }
        
        /* MOBİL KONTROLLER */
        #mobile-controls { position: absolute; bottom: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 5; }
        #joystick-area { position: absolute; bottom: 30px; left: 30px; width: 120px; height: 120px; background: rgba(255,255,255,0.08); border-radius: 50%; border: 2px solid rgba(255,255,255,0.2); pointer-events: auto; display: flex; align-items: center; justify-content: center; }
        #joystick-knob { width: 50px; height: 50px; background: rgba(245,158,11,0.6); border-radius: 50%; pointer-events: none; transform: translate(0, 0); }
        .action-btn-group { position: absolute; bottom: 30px; right: 25px; display: flex; flex-direction: column; gap: 15px; pointer-events: auto; }
        .action-btn { width: 68px; height: 68px; border-radius: 50%; border: none; font-weight: bold; font-size: 0.8rem; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.5); }
        #attack-btn { background: #ef4444; }
        #build-btn { background: #3b82f6; }
    </style>
</head>
<body>
    <div id="ui">
        <h2>PvPChats Arena</h2>
        <div>⛏️ Taş: <span id="stone-val" class="stat-badge">0</span></div>
        <div style="font-size:0.7rem; color:#94a3b8; margin-top:3px;">
            Ahşap: 20 Taş | Taş Duvar: 50 Taş | Demir: 100 Taş
        </div>
    </div>
    <a href="/" id="exit-btn">Sohbete Dön</a>

    <div id="mobile-controls">
        <div id="joystick-area"><div id="joystick-knob"></div></div>
        <div class="action-btn-group">
            <button class="action-btn" id="build-btn">DUVAR</button>
            <button class="action-btn" id="attack-btn">VUR</button>
        </div>
    </div>

    <canvas id="gameCanvas"></canvas>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io();
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        window.addEventListener('resize', resize);
        resize();

        let players = {};
        let walls = [];
        let rocks = [];
        let myId = null;

        const keys = { w: false, a: false, s: false, d: false };
        let currentAngle = 0;

        socket.emit('join_game');

        socket.on('game_full', () => {
            alert('Arena şu an dolu (5/5). Lütfen daha sonra tekrar deneyin!');
            window.location.href = '/';
        });

        socket.on('init_game', (data) => {
            myId = data.id;
            players = data.players;
            rocks = data.rocks;
            walls = data.walls;
        });

        socket.on('game_state', (data) => {
            players = data.players;
            rocks = data.rocks;
            walls = data.walls;
            if (players[myId]) {
                document.getElementById('stone-val').innerText = players[myId].score || 0;
            }
        });

        // --- MOBİL SANAL JOYSTICK MANTIĞI ---
        const joyArea = document.getElementById('joystick-area');
        const joyKnob = document.getElementById('joystick-knob');
        let joyTouchId = null;
        let joyCenter = { x: 0, y: 0 };

        joyArea.addEventListener('touchstart', (e) => {
            const touch = e.changedTouches[0];
            joyTouchId = touch.identifier;
            const rect = joyArea.getBoundingClientRect();
            joyCenter = { x: rect.left + rect.width/2, y: rect.top + rect.height/2 };
            handleJoystick(touch.clientX, touch.clientY);
        });

        window.addEventListener('touchmove', (e) => {
            if (joyTouchId === null) return;
            for (let i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === joyTouchId) {
                    handleJoystick(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
                    break;
                }
            }
        });

        const resetJoy = () => {
            joyTouchId = null;
            joyKnob.style.transform = 'translate(0px, 0px)';
            keys.w = keys.a = keys.s = keys.d = false;
            socket.emit('player_input', { keys, angle: currentAngle });
        };
        joyArea.addEventListener('touchend', resetJoy);
        joyArea.addEventListener('touchcancel', resetJoy);

        function handleJoystick(x, y) {
            const dx = x - joyCenter.x;
            const dy = y - joyCenter.y;
            const dist = Math.min(Math.hypot(dx, dy), 40);
            const angle = Math.atan2(dy, dx);

            joyKnob.style.transform = \`translate(\${Math.cos(angle)*dist}px, \${Math.sin(angle)*dist}px)\`;
            currentAngle = angle;

            keys.w = dy < -10;
            keys.s = dy > 10;
            keys.a = dx < -10;
            keys.d = dx > 10;

            socket.emit('player_input', { keys, angle: currentAngle });
        }

        // --- BUTON VE TIKLAMA ETKİLEŞİMLERİ ---
        document.getElementById('attack-btn').addEventListener('touchstart', (e) => {
            e.preventDefault();
            socket.emit('player_attack');
        });
        document.getElementById('build-btn').addEventListener('touchstart', (e) => {
            e.preventDefault();
            socket.emit('player_build_or_upgrade');
        });

        // Masaüstü Klavye Kontrolleri
        window.addEventListener('keydown', (e) => {
            if (['w','a','s','d','W','A','S','D'].includes(e.key)) {
                keys[e.key.toLowerCase()] = true;
                socket.emit('player_input', { keys, angle: currentAngle });
            }
            if (e.key === 'b' || e.key === 'B') {
                socket.emit('player_build_or_upgrade');
            }
        });

        window.addEventListener('keyup', (e) => {
            if (['w','a','s','d','W','A','S','D'].includes(e.key)) {
                keys[e.key.toLowerCase()] = false;
                socket.emit('player_input', { keys, angle: currentAngle });
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (!myId || !players[myId]) return;
            const me = players[myId];
            currentAngle = Math.atan2(e.clientY - me.y, e.clientX - me.x);
            socket.emit('player_input', { keys, angle: currentAngle });
        });

        window.addEventListener('mousedown', (e) => {
            if (e.clientY < 80) return; // Butonlara basarken ateş etmeyi önle
            socket.emit('player_attack');
        });

        // ÇİZİM DÖNGÜSÜ
        function draw() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Zemin Izgarası
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 1;
            for (let x = 0; x < canvas.width; x += 50) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
            for (let y = 0; y < canvas.height; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }

            // Sonsuz Madenler
            rocks.forEach(r => {
                ctx.fillStyle = '#64748b';
                ctx.beginPath();
                ctx.arc(r.x, r.y, 28, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#475569';
                ctx.lineWidth = 5;
                ctx.stroke();

                ctx.fillStyle = '#cbd5e1';
                ctx.font = 'bold 12px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('MADEN', r.x, r.y + 4);
            });

            // Seviyeli Duvarlar
            walls.forEach(w => {
                ctx.save();
                if (w.level === 1) { ctx.fillStyle = '#b45309'; ctx.strokeStyle = '#78350f'; } // Ahşap
                else if (w.level === 2) { ctx.fillStyle = '#94a3b8'; ctx.strokeStyle = '#475569'; } // Taş
                else { ctx.fillStyle = '#38bdf8'; ctx.strokeStyle = '#0284c7'; } // Demir

                ctx.lineWidth = 3;
                ctx.fillRect(w.x - 18, w.y - 18, 36, 36);
                ctx.strokeRect(w.x - 18, w.y - 18, 36, 36);

                ctx.fillStyle = '#fff';
                ctx.font = 'bold 11px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('L' + w.level, w.x, w.y + 4);
                ctx.restore();
            });

            // Oyuncular
            for (let id in players) {
                const p = players[id];
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.angle);

                // Kılıç
                ctx.fillStyle = '#e2e8f0';
                if (p.isAttacking) {
                    ctx.fillRect(16, 8, 28, 8);
                } else {
                    ctx.fillRect(16, 8, 18, 6);
                }

                // Gövde
                ctx.fillStyle = (id === myId) ? '#38bdf8' : '#f59e0b';
                ctx.beginPath();
                ctx.arc(0, 0, 18, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#0f172a';
                ctx.lineWidth = 3;
                ctx.stroke();

                ctx.restore();

                // İsim
                ctx.fillStyle = '#fff';
                ctx.font = '12px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText((id === myId ? 'Sen' : 'Savaşçı'), p.x, p.y - 25);
            }

            requestAnimationFrame(draw);
        }
        draw();
    </script>
</body>
</html>
`;

// HTTP Rotaları
app.get('/', (req, res) => res.send(chatHtml));
app.get('/oyun', (req, res) => res.send(gameHtml));

// --- SOCKET İŞLEMLERİ ---
io.on('connection', (socket) => {
    socket.emit('room_counts', odaSayilari);

    // Sohbet Odasına Katılma
    socket.on('join_room', (data) => {
        socket.username = data.username;
        socket.room = data.room;
        socket.join(data.room);
        if (odaSayilari[data.room] !== undefined) odaSayilari[data.room]++;
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

    // --- MİNİ OYUN (5 KİŞİLİK) ---
    socket.on('join_game', () => {
        if (Object.keys(oyuncular).length >= OYUNCU_LIMITI) {
            socket.emit('game_full');
            return;
        }

        oyuncular[socket.id] = {
            x: 100 + Math.random() * 400,
            y: 100 + Math.random() * 400,
            angle: 0,
            score: 0,
            isAttacking: false
        };

        socket.emit('init_game', { id: socket.id, players: oyuncular, rocks: madenler, walls: duvarlar });
    });

    socket.on('player_input', (data) => {
        const p = oyuncular[socket.id];
        if (!p) return;

        const speed = 4;
        if (data.keys.w) p.y -= speed;
        if (data.keys.s) p.y += speed;
        if (data.keys.a) p.x -= speed;
        if (data.keys.d) p.x += speed;
        p.angle = data.angle;
    });

    // Vuruş (Maden Taş Kazma)
    socket.on('player_attack', () => {
        const p = oyuncular[socket.id];
        if (!p) return;

        p.isAttacking = true;
        setTimeout(() => { if (p) p.isAttacking = false; }, 150);

        // Sonsuz Maden Kontrolü
        madenler.forEach(rock => {
            const mesafe = Math.hypot(p.x - rock.x, p.y - rock.y);
            if (mesafe < 70) {
                p.score += 10; // Her vuruşta sabit taş verir, maden asla yok olmaz
            }
        });
    });

    // Duvar İnşa Etme ve Seviye Yükseltme
    socket.on('player_build_or_upgrade', () => {
        const p = oyuncular[socket.id];
        if (!p) return;

        // Yakında yükseltilebilir duvar var mı kontrol et
        const yakinDuvar = duvarlar.find(w => Math.hypot(p.x - w.x, p.y - w.y) < 70);

        if (yakinDuvar) {
            // Seviye 1 -> Seviye 2 (Maliyet: 50 Taş)
            if (yakinDuvar.level === 1 && p.score >= 50) {
                p.score -= 50;
                yakinDuvar.level = 2;
            }
            // Seviye 2 -> Seviye 3 (Maliyet: 100 Taş)
            else if (yakinDuvar.level === 2 && p.score >= 100) {
                p.score -= 100;
                yakinDuvar.level = 3;
            }
        } else {
            // Yakında duvar yoksa, önüne 1. Seviye Ahşap Duvar kur (Maliyet: 20 Taş)
            if (p.score >= 20 && duvarlar.length < MAX_DUVAR_SAYISI) {
                p.score -= 20;
                const spawnDist = 45;
                duvarlar.push({
                    id: Date.now() + Math.random(),
                    x: p.x + Math.cos(p.angle) * spawnDist,
                    y: p.y + Math.sin(p.angle) * spawnDist,
                    level: 1
                });
            }
        }
    });

    socket.on('disconnect', () => {
        if (socket.room && odaSayilari[socket.room] > 0) {
            odaSayilari[socket.room]--;
            io.emit('room_counts', odaSayilari);
        }
        if (oyuncular[socket.id]) {
            delete oyuncular[socket.id];
        }
    });
});

// Saniyede 20 Paket (Hafif ve Kararlı)
setInterval(() => {
    if (Object.keys(oyuncular).length > 0) {
        io.emit('game_state', { players: oyuncular, rocks: madenler, walls: duvarlar });
    }
}, 50);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Sunucu ${PORT} portunda aktif.`));
