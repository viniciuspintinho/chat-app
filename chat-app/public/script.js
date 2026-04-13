const socket = io();
const chatContainer = document.getElementById('chat-container');
const chat = document.getElementById('chat');
const messageInput = document.getElementById('message');
const typingIndicator = document.getElementById('typing-indicator');

let typingTimeout;
let selectedReply = null;
let onlineUsers = [];

// SISTEMA DE MOEDAS (LOJA)
let fofoCoins = parseInt(localStorage.getItem('fofoCoins')) || 0;
let userTags = JSON.parse(localStorage.getItem('userTags')) || [];

const savedThemeColor = localStorage.getItem('themeAccent') || '#ff4bb4';
document.documentElement.style.setProperty('--accent', savedThemeColor);

const userData = {
    name: localStorage.getItem('username'),
    photo: localStorage.getItem('userphoto'),
    color: savedThemeColor,
    tags: userTags
};

if (!userData.name) window.location.href = 'index.html';

// Adicionar Ícone da Loja e Saldo ao lado do perfil
const profileArea = document.querySelector('.user-profile-info') || document.getElementById('current-user-avatar').parentElement;
if (!document.getElementById('shop-btn')) {
    const shopContainer = document.createElement('div');
    shopContainer.style = "display:flex; align-items:center; gap:10px; margin-left:10px;";
    shopContainer.innerHTML = `
        <div id="coin-balance" style="color:#f1c40f; font-weight:bold; font-size:0.9rem">🪙 ${fofoCoins}</div>
        <button id="shop-btn" onclick="toggleShop()" style="background:none; border:none; color:var(--accent); cursor:pointer; font-size:1.2rem"><i class="fa-solid fa-bag-shopping"></i></button>
    `;
    profileArea.appendChild(shopContainer);
}

function updateCoins(amount) {
    fofoCoins += amount;
    localStorage.setItem('fofoCoins', fofoCoins);
    document.getElementById('coin-balance').innerText = `🪙 ${fofoCoins}`;
}

// INTERFACE DA LOJA
function toggleShop() {
    let shop = document.getElementById('shop-modal');
    if (shop) { shop.remove(); return; }
    
    shop = document.createElement('div');
    shop.id = 'shop-modal';
    shop.style = "position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); background:var(--side); border:2px solid var(--accent); padding:20px; border-radius:15px; z-index:2000; width:280px; box-shadow:0 0 20px rgba(0,0,0,0.5)";
    shop.innerHTML = `
        <h3 style="color:var(--accent); margin-top:0">🛍️ Loja Fofa</h3>
        <p style="font-size:0.8rem; opacity:0.8">Seu saldo: 🪙 ${fofoCoins}</p>
        <div style="display:flex; flex-direction:column; gap:10px; margin-top:15px;">
            <button onclick="buyItem('Tag VIP', 500)" style="background:rgba(255,255,255,0.1); color:white; border:1px solid #f1c40f; padding:8px; border-radius:5px; cursor:pointer">Comprar Tag VIP (🪙 500)</button>
            <button onclick="buyItem('Tema Dourado', 300)" style="background:rgba(255,255,255,0.1); color:white; border:1px solid gold; padding:8px; border-radius:5px; cursor:pointer">Tema Dourado (🪙 300)</button>
            <button onclick="buyItem('Mudar Foto', 100)" style="background:rgba(255,255,255,0.1); color:white; border:1px solid #3498db; padding:8px; border-radius:5px; cursor:pointer">Liberar Troca de Foto (🪙 100)</button>
        </div>
        <button onclick="toggleShop()" style="margin-top:15px; width:100%; background:var(--accent); border:none; color:white; padding:5px; border-radius:5px; cursor:pointer">Fechar</button>
    `;
    document.body.appendChild(shop);
}

function buyItem(item, price) {
    if (fofoCoins >= price) {
        updateCoins(-price);
        if (item === 'Tag VIP') {
            userTags.push('VIP');
            localStorage.setItem('userTags', JSON.stringify(userTags));
            alert("Parabéns! Você agora é VIP! Reinicie para aplicar.");
        } else if (item === 'Tema Dourado') {
            changeThemeColor('gold', document.createElement('div'));
        }
        alert(`Você comprou: ${item}!`);
    } else {
        alert("Moedas insuficientes! Continue conversando para ganhar mais.");
    }
}

// LETREIRO (MARQUEE)
function updateMarquee(text) {
    let marquee = document.getElementById('chat-announcement');
    if (!marquee) {
        marquee = document.createElement('div');
        marquee.id = 'chat-announcement';
        marquee.style = "background:rgba(0,0,0,0.3); color:var(--accent); padding:5px; font-size:0.8rem; border-bottom:1px solid var(--accent); overflow:hidden; white-space:nowrap;";
        document.getElementById('main-content').prepend(marquee);
    }
    marquee.innerHTML = `<marquee scrollamount="5">${text}</marquee>`;
}
updateMarquee(`💕 Bem-vindos! Ganhe 🪙 conversando e use na LOJA! 💕`);

// ENVIO DE MENSAGEM
function sendMessage() {
    let text = messageInput.value.trim();
    if (text) {
        const isAdm = userData.name.toLowerCase().includes('(adm)');
        
        // GANHAR MOEDAS AO ESCREVER
        updateCoins(2);

        if (text.startsWith('/love ')) {
            const target = text.replace('/love ', '').trim();
            socket.emit('message', { type: 'system', content: `💖 ${userData.name} espalhou amor para ${target}!`, color: '#ff4bb4' });
        } 
        // IDEIA 2: ABRAÇÃO
        else if (text === '/abracao') {
            socket.emit('message', { type: 'system', content: `🫂 ABRAÇÃO COLETIVO! ${userData.name} abraçou todo mundo do chat de uma vez!`, color: '#3498db' });
        }
        else if (text.startsWith('/casar ')) {
            const target = text.replace('/casar ', '').trim();
            socket.emit('message', { type: 'system', content: `💍 O AMOR ESTÁ NO AR! ${userData.name} se casou com ${target}! 🎉`, color: '#ff69b4' });
        }
        else if (text === '/moeda') {
            const resultado = Math.random() < 0.5 ? 'CARA' : 'COROA';
            socket.emit('message', { type: 'system', content: `🪙 ${userData.name} jogou a moeda e deu... ${resultado}!`, color: '#f1c40f' });
        }
        else if (text === '/dado') {
            const valor = Math.floor(Math.random() * 6) + 1;
            socket.emit('message', { type: 'system', content: `🎲 ${userData.name} girou o dado e tirou... ${valor}!`, color: '#9b59b6' });
        }
        else if (text === '/limpar' && isAdm) {
            chat.innerHTML = '';
            socket.emit('message', { type: 'system', content: `🧹 Chat limpo por ${userData.name}`, color: '#aaa' });
        }
        else if (text.startsWith('/enquete ')) {
            const pergunta = text.replace('/enquete ', '').trim();
            socket.emit('message', { type: 'system', content: `📊 ENQUETE: ${pergunta}\n(❤️ SIM | 😂 NÃO)`, color: '#00d2ff' });
        }
        else if (text.startsWith('/letreiro ') && isAdm) {
            updateMarquee(text.replace('/letreiro ', '').trim());
        }
        else if (text.startsWith('/aviso ') && isAdm) {
            socket.emit('message', { type: 'system', content: `⚠️ AVISO: ${text.replace('/aviso ', '')}`, color: 'yellow', isUrgent: true });
        }
        else {
            socket.emit('message', { type: 'text', content: text, replyTo: selectedReply });
        }
        messageInput.value = '';
        cancelReply();
    }
}

// RESTANTE DAS FUNÇÕES (REAÇÕES, LISTA, ETC) MANTIDAS IGUALMENTE
socket.on('message', (data) => {
    const div = document.createElement('div');
    if (data.type === 'system') {
        div.className = 'system-msg';
        if (data.isUrgent) div.classList.add('urgent-blink');
        div.style = `color:${data.color || '#fff'}; text-align:center; margin:15px 0; font-weight:bold;`;
        div.innerHTML = data.content.replace('\n', '<br>');
    } else {
        div.classList.add('msg');
        div.id = data.id;
        const isAdm = data.user.toLowerCase().includes('(adm)');
        const hasVip = data.tags && data.tags.includes('VIP');
        if (isAdm) div.classList.add('adm-msg');
        
        let contentWithMentions = data.content;
        if (data.type === 'text') {
            contentWithMentions = data.content.replace(/@(\S+)/g, (match, username) => {
                if (onlineUsers.includes(username)) return `<span class="mention">@${username}</span>`;
                return match;
            });
        }
        
        div.innerHTML = `
            <div class="msg-header" style="color:${data.color}">
                <img src="${data.photo}" class="user-avatar-mini ${isAdm ? 'adm-avatar' : ''}">
                <strong>${data.user} ${isAdm ? '★' : ''} ${hasVip ? '<span style="color:#f1c40f">[VIP]</span>' : ''}</strong>
            </div>
            <div class="msg-content"><span>${contentWithMentions}</span></div>
            <div id="reac-${data.id}" class="reaction-container"></div>
            <div class="reaction-bar">
                <button onclick="react('${data.id}', '❤️')">❤️</button>
                <button onclick="react('${data.id}', '🔥')">🔥</button>
            </div>
        `;
    }
    chat.appendChild(div);
    chatContainer.scrollTop = chatContainer.scrollHeight;
});

// Outras funções originais (handleKeyPress, setReply, react, updateProfileName, etc) devem ser mantidas abaixo
function handleKeyPress(e) { if (e.key === 'Enter') sendMessage(); else socket.emit('typing', { name: userData.name }); }
function cancelReply() { selectedReply = null; const p = document.getElementById('reply-preview'); if(p) p.remove(); }
socket.on('updateUserList', (users) => {
    onlineUsers = users.map(u => u.name);
    const counter = document.getElementById('online-counter'); if(counter) counter.innerText = `Online: ${users.length}`;
    const list = document.getElementById('user-list');
    if(list) {
        list.innerHTML = users.map(u => `
            <div class="user-item">
                <div class="avatar-container">
                    <img src="${u.photo}" class="user-avatar ${u.name.toLowerCase().includes('(adm)') ? 'adm-avatar' : ''}">
                    <div class="status-dot" style="background:${u.name.toLowerCase().includes('(adm)') ? 'gold' : '#2ecc71'}"></div>
                </div>
                <span>${u.name}</span>
            </div>
        `).join('');
    }
});