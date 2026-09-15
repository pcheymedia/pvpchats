const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" }, maxHttpBufferSize: 1e7 });

const sunucular = [
    { id: 'harbi2', ad: 'Harbi2', ikon: '⚔️', aciklama: 'Emek Server Odası' },
    { id: 'risalemt2', ad: 'RisaleMt2', ikon: '🛡️', aciklama: 'Orta Emek Server' },
    { id: 'lova2', ad: 'Lova2', ikon: '🔥', aciklama: 'VSlik PvP Server' },
    { id: 'rohan2', ad: 'Rohan2', ikon: '🐉', aciklama: 'Global Hard Emek' },
    { id: 'mykomobile', ad: 'MykoMobile', ikon: '📱', aciklama: 'Mobil PvP Deneyimi' }
];

const odaSayilari = { harbi2: 0, risalemt2: 0, lova2: 0, rohan2: 0, mykomobile: 0 };
const odaGecmisi = { harbi2: [], risalemt2: [], lova2: [], rohan2: [], mykomobile: [] }; 
const sonMesajZamani = {}; 
const aktifKullanicilar = {}; 

const htmlIcerik = `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>PvPChats - Odalar & Ticaret</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        body { background: #0b0d11; color: #f1f5f9; display: flex; flex-direction: column; height: 100dvh; overflow: hidden; }
        
        .gm-banner { background: linear-gradient(90deg, #b8860b, #ffd700, #b8860b); color: #000; text-align: center; padding: 12px; font-weight: 900; font-size: 15px; box-shadow: 0 0 15px rgba(255, 215, 0, 0.4); text-transform: uppercase; letter-spacing: 1px; }
        .gm-banner a { color: #000; text-decoration: none; border-bottom: 1px solid #000; }
        
        header { background: #131720; border-bottom: 1px solid #1f2633; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; }
        .logo { color: #f59e0b; font-weight: 800; font-size: 1.1rem; display: flex; align-items: center; gap: 8px; }
        
        #room-screen, #whatsapp-screen { flex: 1; padding: 20px 16px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; }
        #whatsapp-screen { display: none; }
        
        .section-title { font-size: 0.85rem; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 5px; display: flex; align-items: center; justify-content: space-between; }
        
        .room-card { background: #131720; border: 1px solid #1f2633; padding: 16px; border-radius: 12px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; transition: all 0.2s; }
        .room-card:hover { border-color: #f59e0b; }
        .room-info { display: flex; align-items: center; gap: 14px; }
        .room-icon { font-size: 1.8rem; }
        .room-details h3 { font-size: 1rem; color: #fff; margin-bottom: 2px; }
        .room-details p { font-size: 0.8rem; color: #94a3b8; }
        .room-count { background: #1e2430; color: #38bdf8; padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: bold; border: 1px solid #334155; }
        
        .ad-gold-box { border: 2px dashed #ffd700; background: rgba(255, 215, 0, 0.05); border-radius: 12px; padding: 14px; text-align: center; color: #ffd700; font-weight: bold; font-size: 0.9rem; box-shadow: 0 0 10px rgba(255, 215, 0, 0.15); text-decoration: none; display: block; margin-top: auto; transition: 0.2s; }
        .ad-gold-box:hover { background: rgba(255, 215, 0, 0.12); box-shadow: 0 0 15px rgba(255, 215, 0, 0.35); }

        .wp-link-card { background: #131720; border: 1px solid #1f2633; padding: 16px; border-radius: 12px; display: flex; align-items: center; justify-content: space-between; text-decoration: none; color: #fff; transition: 0.2s; }
        .wp-link-card:hover { border-color: #22c55e; }
        .wp-link-card.disabled { opacity: 0.5; pointer-events: none; }
        .wp-link-info h3 { font-size: 1rem; margin-bottom: 2px; color: #22c55e; }
        .wp-link-info p { font-size: 0.8rem; color: #94a3b8; }

        #nickname-modal { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 1000; justify-content: center; align-items: center; padding: 20px; }
        .modal-content { background: #131720; padding: 24px; border-radius: 12px; border: 1px solid #334155; width: 100%; max-width: 350px; text-align: center; }
        .modal-content h3 { color: #f59e0b; margin-bottom: 16px; font-size: 1.1rem; }
        .input-group { display: flex; gap: 8px; margin-bottom: 16px; }
        .input-group input { flex: 1; background: #0b0d11; border: 1px solid #334155; color: #fff; padding: 12px; border-radius: 8px; outline: none; font-size: 1rem; text-align: center; }
        .btn-dice { background: #1e2430; border: 1px solid #334155; color: #fff; padding: 0 16px; border-radius: 8px; cursor: pointer; font-size: 1.2rem; }
        .btn-join { width: 100%; background: #f59e0b; color: #000; border: none; padding: 12px; border-radius: 8px; font-weight: 700; font-size: 1rem; cursor: pointer; }
        .btn-cancel { width: 100%; background: transparent; color: #94a3b8; border: none; padding: 10px; margin-top: 8px; cursor: pointer; font-size: 0.9rem; }
        
        #chat-screen { display: none; flex: 1; flex-direction: column; height: calc(100dvh - 57px); }
        .chat-subhead { background: #181d28; padding: 10px 16px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #1f2633; }
        .btn-back { background: transparent; border: none; color: #94a3b8; font-size: 0.9rem; cursor: pointer; display: flex; align-items: center; gap: 4px; font-weight: 600; }
        .room-title-active { font-weight: 700; color: #f59e0b; font-size: 1rem; }
        
        #messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
        .msg-container { display: flex; flex-direction: column; gap: 2px; }
        .msg-info { display: flex; justify-content: space-between; font-size: 0.75rem; padding: 0 4px; }
        .msg-info .author { color: #38bdf8; font-weight: 700; cursor: pointer; }
        .msg-info .time { color: #64748b; }
        .msg { background: #131720; padding: 10px 14px; border-radius: 8px; border: 1px solid #1f2633; word-break: break-word; font-size: 0.95rem; line-height: 1.4; color: #fff; }
        
        .msg-image { max-width: 100%; max-height: 250px; border-radius: 6px; margin-top: 8px; border: 1px solid #334155; cursor: pointer; object-fit: contain; background: #000; }
        .vip-glow { color: #ffd700 !important; text-shadow: 0 0 8px rgba(255, 215, 0, 0.8); font-weight: 900 !important; }
        .msg.vip-msg { border-color: #ffd700; box-shadow: 0 0 5px rgba(255, 215, 0, 0.3); color: #ffd700 !important; font-weight: bold; }

        .sys { text-align: center; color: #64748b; font-size: 0.75rem; margin: 6px 0; font-style: italic; }
        .toast { text-align: center; color: #ef4444; font-size: 0.8rem; font-weight: bold; margin-bottom: 5px; display: none; }
        
        #form-container { background: #131720; border-top: 1px solid #1f2633; padding: 12px; }
        form { display: flex; gap: 8px; align-items: center; }
        
        .btn-attach { background: #334155; color: #fff; border: none; padding: 0 14px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 1.2rem; height: 100%; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
        .btn-attach.attached { background: #22c55e; color: #fff; }
        
        #chat-input { flex: 1; background: #0b0d11; border: 1px solid #334155; color: #fff; padding: 12px; border-radius: 8px; outline: none; font-size: 1rem; }
        #chat-input:focus { border-color: #38bdf8; }
        .btn-send { background: #38bdf8; color: #000; border: none; padding: 0 16px; border-radius: 8px; font-weight: 700; cursor: pointer; height: 100%; }

        #private-chat-popup { display: none; position: fixed; bottom: 20px; right: 20px; width: 300px; background: #131720; border: 1px solid #334155; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.5); z-index: 2000; flex-direction: column; overflow: hidden; }
        .pm-header { background: #1e293b; padding: 10px; font-weight: bold; font-size: 0.9rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; }
        .pm-close { cursor: pointer; color: #ef4444; font-weight: bold; }
        .pm-messages { height: 200px; overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 8px; font-size: 0.85rem; }
        .pm-msg { background: #1e2430; padding: 6px 10px; border-radius: 6px; align-self: flex-start; max-width: 85%; word-break: break-word; }
        .pm-msg.self { background: #38bdf8; color: #000; align-self: flex-end; }
        .pm-input-area { display: flex; border-top: 1px solid #334155; }
        .pm-input-area input { flex: 1; background: #0b0d11; border: none; color: #fff; padding: 10px; outline: none; font-size: 0.9rem; }
        .pm-input-area button { background: #f59e0b; color: #000; border: none; padding: 0 15px; font-weight: bold; cursor: pointer; }
    </style>
</head>
<body>
    <div class="gm-banner">👑 Admin İletişim: <a href="mailto:fazlicaniletisim@gmail.com">fazlicaniletisim@gmail.com</a> 👑</div>

    <header>
        <div class="logo">⚔️ PvPChats</div>
    </header>

    <div id="room-screen">
        <div class="section-title">Açık Server Odaları</div>
        <div id="room-list"></div>

        <div class="section-title" style="margin-top: 10px; color: #22c55e;">💬 Diğer</div>
        <div class="room-card" style="border-color: #22c55e;" onclick="openWhatsAppScreen()">
            <div class="room-info">
                <div class="room-icon" style="font-size: 1.8rem;">📱</div>
                <div class="room-details">
                    <h3 style="color: #22c55e;">WhatsApp Ticaret Grupları</h3>
                    <p>Gruplara katılmak için tıklayın</p>
                </div>
            </div>
            <div style="color: #22c55e; font-size: 1.2rem;">➔</div>
        </div>

        <a href="mailto:fazlicaniletisim@gmail.com?subject=Reklam Alanı Hakkında" class="ad-gold-box" style="margin-top: 20px;">
            📢 BURAYA REKLAM VEREBİLİRSİNİZ<br><span style="font-size: 0.75rem; font-weight: normal; color: #94a3b8;">(İletişim İçin Tıklayın)</span>
        </a>
    </div>

    <div id="whatsapp-screen">
        <div class="chat-subhead" style="margin: -20px -16px 14px -16px; padding: 12px 16px;">
            <button class="btn-back" onclick="closeWhatsAppScreen()">◀ Geri Dön</button>
            <div class="room-title-active" style="color: #22c55e;">Ticaret Grupları</div>
        </div>
        
        <a href="https://chat.whatsapp.com/LNuQT84609G0jROoroz9r0?mode=gi_t" target="_blank" class="wp-link-card">
            <div style="display: flex; align-items: center;">
                <div style="font-size: 1.8rem; margin-right: 14px;">🟢</div>
                <div class="wp-link-info">
                    <h3>1. Ticaret Grubu (Aktif)</h3>
                    <p>Tıklayın ve hemen katılın</p>
                </div>
            </div>
            <div style="color: #22c55e;">➔</div>
        </a>

        <a href="#" class="wp-link-card disabled">
            <div style="display: flex; align-items: center;">
                <div style="font-size: 1.8rem; margin-right: 14px;">🔒</div>
                <div class="wp-link-info">
                    <h3 style="color: #94a3b8;">2. Grup (Çok Yakında)</h3>
                    <p>Şu an aktif değil</p>
                </div>
            </div>
        </a>

        <a href="#" class="wp-link-card disabled">
            <div style="display: flex; align-items: center;">
                <div style="font-size: 1.8rem; margin-right: 14px;">🔒</div>
                <div class="wp-link-info">
                    <h3 style="color: #94a3b8;">3. Grup (Çok Yakında)</h3>
                    <p>Şu an aktif değil</p>
                </div>
            </div>
        </a>
    </div>

    <div id="nickname-modal">
        <div class="modal-content">
            <h3>Sohbete Katıl</h3>
            <div class="input-group">
                <input type="text" id="nickname-input" placeholder="Karakter Adı" maxlength="15">
                <button class="btn-dice" onclick="randomNick()">🎲</button>
            </div>
            <button class="btn-join" onclick="joinRoom()">Giriş Yap</button>
            <button class="btn-cancel" onclick="closeModal()">İptal</button>
        </div>
    </div>

    <div id="chat-screen">
        <div class="chat-subhead">
            <button class="btn-back" onclick="leaveRoom()">◀ Odalara Dön</button>
            <div class="room-title-active" id="active-room-name">Oda Adı</div>
        </div>
        <div id="messages"></div>
        <div id="form-container">
            <div id="toast" class="toast">Mesaj göndermek için biraz bekle!</div>
            <form id="chat-form">
                <input type="file" id="image-input" accept="image/*" style="display: none;">
                <button type="button" class="btn-attach" id="btn-attach" title="Görsel Ekle">+</button>
                <input id="chat-input" autocomplete="off" placeholder="Mesaj gönder..." />
                <button class="btn-send" type="submit">Gönder</button>
            </form>
        </div>
    </div>

    <div id="private-chat-popup">
        <div class="pm-header">
            <span id="pm-target-name">Kullanıcı</span>
            <span class="pm-close" onclick="closePM()">X</span>
        </div>
        <div class="pm-messages" id="pm-messages"></div>
        <div class="pm-input-area">
            <input type="text" id="pm-input" autocomplete="off" placeholder="Özel mesaj..." onkeypress="handlePMEnter(event)">
            <button onclick="sendPM()">Gönder</button>
        </div>
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io();
        const roomListDiv = document.getElementById('room-list');
        const roomScreen = document.getElementById('room-screen');
        const whatsappScreen = document.getElementById('whatsapp-screen');
        const chatScreen = document.getElementById('chat-screen');
        const nicknameModal = document.getElementById('nickname-modal');
        const nicknameInput = document.getElementById('nickname-input');
        const activeRoomName = document.getElementById('active-room-name');
        const messagesDiv = document.getElementById('messages');
        const chatForm = document.getElementById('chat-form');
        const chatInput = document.getElementById('chat-input');
        const toast = document.getElementById('toast');
        
        const pmPopup = document.getElementById('private-chat-popup');
        const pmTargetName = document.getElementById('pm-target-name');
        const pmMessages = document.getElementById('pm-messages');
        const pmInput = document.getElementById('pm-input');

        const imageInput = document.getElementById('image-input');
        const btnAttach = document.getElementById('btn-attach');

        const sunucular = ${JSON.stringify(sunucular)};
        let selectedRoom = null;
        let myUsername = '';
        let targetPMUser = '';
        let lastMsgTime = 0;
        let attachedImageData = null; 

        // GÜVENLİK FİLTRESİ (XSS KORUMASI)
        function escapeHTML(str) {
            if (!str) return '';
            return String(str).replace(/[&<>"'\`=\\/]/g, function (s) {
                return {
                    '&': '&amp;',
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#39;',
                    '/': '&#x2F;',
                    '\`': '&#x60;',
                    '=': '&#x3D;'
                }[s];
            });
        }

        function openWhatsAppScreen() {
            roomScreen.style.display = 'none';
            whatsappScreen.style.display = 'flex';
        }
        function closeWhatsAppScreen() {
            whatsappScreen.style.display = 'none';
            roomScreen.style.display = 'flex';
        }

        function randomNick() {
            const prefixes = ['Savasci', 'Ninja', 'Sura', 'Saman', 'Kral', 'Reis', 'Pro'];
            nicknameInput.value = prefixes[Math.floor(Math.random() * prefixes.length)] + Math.floor(Math.random() * 9999);
        }

        function renderRooms(counts) {
            roomListDiv.innerHTML = '';
            sunucular.forEach(s => {
                const count = counts[s.id] || 0;
                const card = document.createElement('div');
                card.className = 'room-card';
                card.onclick = () => openModal(s.id);
                card.innerHTML = \`
                    <div class="room-info">
                        <div class="room-icon">\${s.ikon}</div>
                        <div class="room-details">
                            <h3>\${s.ad}</h3>
                            <p>\${s.aciklama}</p>
                        </div>
                    </div>
                    <div class="room-count">👥 \${count}</div>
                \`;
                roomListDiv.appendChild(card);
            });
        }

        socket.on('room_counts', (counts) => {
            renderRooms(counts);
        });

        function openModal(roomId) {
            selectedRoom = sunucular.find(s => s.id === roomId);
            nicknameModal.style.display = 'flex';
            if(!nicknameInput.value) randomNick();
        }

        function closeModal() {
            nicknameModal.style.display = 'none';
            selectedRoom = null;
        }

        function joinRoom() {
            if (!nicknameInput.value.trim()) return;
            myUsername = escapeHTML(nicknameInput.value.trim()); // İsimleri de filtrele
            
            nicknameModal.style.display = 'none';
            roomScreen.style.display = 'none';
            chatScreen.style.display = 'flex';
            activeRoomName.innerText = selectedRoom.ad;
            messagesDiv.innerHTML = '';
            resetAttachment(); 

            socket.emit('join_room', { room: selectedRoom.id, username: myUsername });
        }

        function leaveRoom() {
            socket.emit('leave_room', selectedRoom.id);
            selectedRoom = null;
            chatScreen.style.display = 'none';
            roomScreen.style.display = 'flex';
            pmPopup.style.display = 'none';
            resetAttachment();
        }

        btnAttach.addEventListener('click', () => {
            imageInput.click();
        });

        imageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = event => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    let width = img.width;
                    let height = img.height;
                    const MAX_SIZE = 800; 
                    
                    if (width > MAX_SIZE || height > MAX_SIZE) {
                        if (width > height) {
                            height *= MAX_SIZE / width;
                            width = MAX_SIZE;
                        } else {
                            width *= MAX_SIZE / height;
                            height = MAX_SIZE;
                        }
                    }
                    
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    attachedImageData = canvas.toDataURL('image/jpeg', 0.7); 
                    
                    btnAttach.classList.add('attached');
                    btnAttach.innerText = '🖼️';
                }
            }
        });

        function resetAttachment() {
            attachedImageData = null;
            imageInput.value = '';
            btnAttach.classList.remove('attached');
            btnAttach.innerText = '+';
        }

        chatForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const textValue = chatInput.value.trim();
            
            if (!textValue && !attachedImageData) return;

            const now = Date.now();
            if (now - lastMsgTime < 2000) { 
                toast.style.display = 'block';
                setTimeout(() => toast.style.display = 'none', 2000);
                return;
            }
            
            socket.emit('send_message', { 
                room: selectedRoom.id, 
                text: textValue,
                image: attachedImageData 
            });
            
            chatInput.value = '';
            resetAttachment();
            lastMsgTime = now;
        });

        function getCleanName(name) {
            let clean = name.replace(/admin/gi, '').replace(/vip/gi, '').trim();
            return clean || name;
        }

        function appendMessage(data) {
            // Zararlı kodları temizle
            const safeUser = escapeHTML(data.user);
            const safeText = escapeHTML(data.text);
            
            const lowerName = data.user.toLowerCase();
            const isVIP = lowerName.includes('vip') || lowerName.includes('admin') || lowerName === 'fazlican' || lowerName === 'fazlıcan' || lowerName === 'can';
            const vipClass = isVIP ? 'vip-glow' : '';
            const vipMsgClass = isVIP ? 'vip-msg' : '';

            let displayName = isVIP ? getCleanName(safeUser) : safeUser;

            const imageHtml = data.image ? \`<img src="\${escapeHTML(data.image)}" class="msg-image" onclick="window.open('\${escapeHTML(data.image)}', '_blank')">\` : '';
            const textHtml = safeText ? \`<div>\${safeText}</div>\` : '';

            const container = document.createElement('div');
            container.className = 'msg-container';
            container.innerHTML = \`
                <div class="msg-info">
                    <span class="author \${vipClass}" onclick="openPM('\${safeUser}')">\${displayName}</span>
                    <span class="time">\${escapeHTML(data.time)}</span>
                </div>
                <div class="msg \${vipMsgClass}">
                    \${textHtml}
                    \${imageHtml}
                </div>
            \`;
            messagesDiv.appendChild(container);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }

        socket.on('receive_message', (data) => {
            appendMessage(data);
        });

        socket.on('room_history', (history) => {
            history.forEach(msg => appendMessage(msg));
            const sysMsg = document.createElement('div');
            sysMsg.className = 'sys';
            sysMsg.innerText = '--- Odaya Katıldınız ---';
            messagesDiv.appendChild(sysMsg);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        });

        socket.on('sys_message', (text) => {
            const sysMsg = document.createElement('div');
            sysMsg.className = 'sys';
            sysMsg.innerText = text;
            messagesDiv.appendChild(sysMsg);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        });

        function openPM(targetUser) {
            if (targetUser === myUsername) return; 
            targetPMUser = targetUser;
            pmTargetName.innerText = getCleanName(targetUser);
            pmPopup.style.display = 'flex';
            pmMessages.innerHTML = ''; 
            pmInput.focus();
        }

        function closePM() {
            pmPopup.style.display = 'none';
            targetPMUser = '';
        }

        function sendPM() {
            const text = pmInput.value.trim();
            if (text && targetPMUser) {
                socket.emit('private_message', { to: targetPMUser, text: text });
                
                const msgDiv = document.createElement('div');
                msgDiv.className = 'pm-msg self';
                msgDiv.innerText = text; // innerText güvenlidir
                pmMessages.appendChild(msgDiv);
                pmMessages.scrollTop = pmMessages.scrollHeight;
                
                pmInput.value = '';
            }
        }

        function handlePMEnter(e) {
            if (e.key === 'Enter') sendPM();
        }

        socket.on('receive_private_message', (data) => {
            if (pmPopup.style.display !== 'flex' || targetPMUser !== data.from) {
                targetPMUser = data.from;
                pmTargetName.innerText = getCleanName(data.from);
                pmPopup.style.display = 'flex';
                pmMessages.innerHTML = ''; 
            }
            
            const msgDiv = document.createElement('div');
            msgDiv.className = 'pm-msg';
            msgDiv.innerText = data.text; // innerText güvenlidir
            pmMessages.appendChild(msgDiv);
            pmMessages.scrollTop = pmMessages.scrollHeight;
        });

    </script>
</body>
</html>
`;

app.get('/', (req, res) => {
    res.send(htmlIcerik);
});

io.on('connection', (socket) => {
    socket.emit('room_counts', odaSayilari);

    socket.on('join_room', (data) => {
        const { room, username } = data;
        
        socket.username = username;
        socket.room = room;
        aktifKullanicilar[username] = socket.id; 

        socket.join(room);
        
        if (odaSayilari[room] !== undefined) {
            odaSayilari[room]++;
        }
        
        io.emit('room_counts', odaSayilari); 
        socket.emit('room_history', odaGecmisi[room]); 
        io.to(room).emit('sys_message', `${username} odaya katıldı.`);
    });

    socket.on('send_message', (data) => {
        const now = Date.now();
        const lastTime = sonMesajZamani[socket.id] || 0;

        if (now - lastTime < 2000) return;
        sonMesajZamani[socket.id] = now;

        const timeString = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
        const msgData = { user: socket.username, text: data.text, image: data.image, time: timeString };

        if (odaGecmisi[data.room]) {
            odaGecmisi[data.room].push(msgData);
            if (odaGecmisi[data.room].length > 300) {
                odaGecmisi[data.room].shift();
            }
        }

        io.to(data.room).emit('receive_message', msgData);
    });

    socket.on('private_message', (data) => {
        const targetSocketId = aktifKullanicilar[data.to];
        if (targetSocketId) {
            io.to(targetSocketId).emit('receive_private_message', {
                from: socket.username,
                text: data.text
            });
        }
    });

    socket.on('leave_room', (room) => {
        if (socket.room && odaSayilari[socket.room] > 0) {
            odaSayilari[socket.room]--;
            io.emit('room_counts', odaSayilari);
            io.to(socket.room).emit('sys_message', `${socket.username} odadan ayrıldı.`);
            socket.leave(socket.room);
            socket.room = null;
        }
    });

    socket.on('disconnect', () => {
        if (socket.username) {
            delete aktifKullanicilar[socket.username];
        }
        if (socket.room && odaSayilari[socket.room] > 0) {
            odaSayilari[socket.room]--;
            io.emit('room_counts', odaSayilari);
            io.to(socket.room).emit('sys_message', `${socket.username} bağlantıyı kopardı.`);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda başarıyla çalışıyor.`);
});
