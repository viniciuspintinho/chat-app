const socket = io();
const chatContainer = document.getElementById('chat-container');
const chat = document.getElementById('chat');
const messageInput = document.getElementById('message');
const typingIndicator = document.getElementById('typing-indicator');

let typingTimeout;
let selectedReply = null;
let onlineUsers = [];

const savedThemeColor = localStorage.getItem('themeAccent') || '#ff4bb4';
document.documentElement.style.setProperty('--accent', savedThemeColor);

const userData = {
    name: localStorage.getItem('username'),
    photo: localStorage.getItem('userphoto'),
    color: savedThemeColor
};

if (!userData.name) window.location.href = 'index.html';

document.getElementById('edit-username').value = userData.name;
const avatar = document.getElementById('current-user-avatar');
avatar.src = userData.photo || `https://ui-avatars.com/api/?name=${userData.name}&background=ff4bb4&color=fff`;

socket.emit('join', userData);

// SISTEMA DE RESPOSTA
function setReply(msgId, userName, text) {
    selectedReply = { id: msgId, name: userName, text: text.substring(0, 50) };
    let replyPreview = document.getElementById('reply-preview');
    if (!replyPreview) {
        replyPreview = document.createElement('div');
        replyPreview.id = 'reply-preview';
        document.getElementById('main-content').insertBefore(replyPreview, typingIndicator);
    }
    replyPreview.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
            <div>
                <small style="color:var(--accent)">Respondendo a <strong>${userName}</strong></small>
                <p style="margin:0; opacity:0.8; font-size:0.8rem">${text}</p>
            </div>
            <button onclick="cancelReply()" style="background:none; border:none; color:white; cursor:pointer"><i class="fa-solid fa-xmark"></i></button>
        </div>
    `;
    messageInput.focus();
}

function cancelReply() {
    selectedReply = null;
    const preview = document.getElementById('reply-preview');
    if (preview) preview.remove();
}

// ENVIO DE MENSAGEM COM NOVOS COMANDOS (LIMPAR E ENQUETE)
function sendMessage() {
    let text = messageInput.value.trim();
    if (text) {
        const isAdm = userData.name.toLowerCase().includes('(adm)');

        if (text.startsWith('/love ')) {
            const target = text.replace('/love ', '').trim();
            socket.emit('message', { type: 'system', content: `💖 ${userData.name} espalhou amor para ${target}!`, color: '#ff4bb4' });
        } 
        else if (text.startsWith('/bater ')) {
            const target = text.replace('/bater ', '').trim();
            socket.emit('message', { type: 'system', content: `👊 ${userData.name} deu um cascudo em ${target}!`, color: '#e74c3c' });
        }
        else if (text === '/moeda') {
            const resultado = Math.random() < 0.5 ? 'CARA' : 'COROA';
            socket.emit('message', { type: 'system', content: `🪙 ${userData.name} jogou a moeda e deu... ${resultado}!`, color: '#f1c40f' });
        }
        else if (text === '/dado') {
            const valor = Math.floor(Math.random() * 6) + 1;
            socket.emit('message', { type: 'system', content: `🎲 ${userData.name} girou o dado e tirou... ${valor}!`, color: '#9b59b6' });
        }
        // COMANDO 2: LIMPAR (ADM)
        else if (text === '/limpar' && isAdm) {
            chat.innerHTML = '';
            socket.emit('message', { type: 'system', content: `🧹 O chat foi limpo por ${userData.name}`, color: '#aaa' });
        }
        // COMANDO 7: ENQUETE (ADM OU TODOS)
        else if (text.startsWith('/enquete ')) {
            const pergunta = text.replace('/enquete ', '').trim();
            socket.emit('message', { type: 'system', content: `📊 ENQUETE: ${pergunta}\n(Reaja com ❤️ para SIM ou 😂 para NÃO)`, color: '#00d2ff' });
        }
        else if (text.startsWith('/aviso ') && isAdm) {
            const aviso = text.replace('/aviso ', '').trim();
            socket.emit('message', { type: 'system', content: `⚠️ AVISO: ${aviso}`, color: 'yellow', isUrgent: true });
        }
        else {
            socket.emit('message', { type: 'text', content: text, replyTo: selectedReply });
        }
        messageInput.value = '';
        cancelReply();
    }
}

function handleKeyPress(e) {
    if (e.key === 'Enter') sendMessage();
    else socket.emit('typing', { name: userData.name });
}

socket.on('typing', (data) => {
    typingIndicator.innerText = `${data.name} está digitando...`;
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => { typingIndicator.innerText = ''; }, 2000);
});

// RECEBER MENSAGENS
socket.on('message', (data) => {
    const div = document.createElement('div');
    if (data.type === 'system') {
        div.className = 'system-msg';
        if (data.isUrgent) div.classList.add('urgent-blink');
        div.style.color = data.color || '#fff';
        div.style.textAlign = 'center';
        div.style.margin = '15px 0';
        div.innerHTML = `<strong>${data.content.replace('\n', '<br>')}</strong>`;
    } else {
        div.classList.add('msg');
        div.id = data.id;

        const isAdm = data.user.toLowerCase().includes('(adm)');
        if (isAdm) div.classList.add('adm-msg');

        let contentWithMentions = data.content;
        if (data.type === 'text') {
            contentWithMentions = data.content.replace(/@(\S+)/g, (match, username) => {
                if (onlineUsers.includes(username)) return `<span class="mention">@${username}</span>`;
                return match;
            });
            if (data.content.includes(`@${userData.name}`)) div.classList.add('mentioned-msg');
        }

        const replyHTML = data.replyTo ? `
            <div class="msg-reply-info" style="background:rgba(255,255,255,0.05); border-left:3px solid var(--accent); padding:5px; margin-bottom:8px; border-radius:4px; font-size:0.7rem">
                <strong>${data.replyTo.name}:</strong> ${data.replyTo.text}...
            </div>
        ` : '';

        div.innerHTML = `
            ${replyHTML}
            <div class="msg-header" style="color:${data.color}">
                <img src="${data.photo}" class="user-avatar-mini ${isAdm ? 'adm-avatar' : ''}">
                <strong>${data.user} ${isAdm ? '<span class="adm-badge">★ ADM</span>' : ''}</strong>
            </div>
            <div class="msg-content">
                ${data.type === 'image' ? `<img src="${data.content}" class="chat-img">` : `<span>${contentWithMentions}</span>`}
            </div>
            <div id="reac-${data.id}" class="reaction-container" style="display:flex; gap:5px; margin-top:5px; flex-wrap:wrap;"></div>
            <div class="reaction-bar">
                <button onclick="setReply('${data.id}', '${data.user}', '${data.type === 'image' ? 'Imagem' : data.content}')"><i class="fa-solid fa-reply"></i></button>
                <button onclick="react('${data.id}', '❤️')">❤️</button>
                <button onclick="react('${data.id}', '🔥')">🔥</button>
                <button onclick="react('${data.id}', '😂')">😂</button>
            </div>
        `;
    }
    chat.appendChild(div);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    typingIndicator.innerText = '';
});

// REAÇÕES ACUMULATIVAS
function react(msgId, emoji) { socket.emit('reaction', { msgId, emoji }); }

socket.on('reaction', (data) => {
    const reacDiv = document.getElementById(`reac-${data.msgId}`);
    if (reacDiv) {
        let existing = Array.from(reacDiv.children).find(s => s.getAttribute('data-emoji') === data.emoji);
        if (!existing) {
            const span = document.createElement('span');
            span.className = 'emoji-badge';
            span.setAttribute('data-emoji', data.emoji);
            span.setAttribute('data-count', '1');
            span.style.background = 'rgba(255,255,255,0.1)';
            span.style.padding = '2px 6px';
            span.style.borderRadius = '10px';
            span.style.fontSize = '0.8rem';
            span.innerHTML = `${data.emoji} <small>1</small>`;
            reacDiv.appendChild(span);
        } else {
            let count = parseInt(existing.getAttribute('data-count')) + 1;
            existing.setAttribute('data-count', count);
            existing.querySelector('small').innerText = count;
        }
    }
});

// LISTA DE USUÁRIOS (COM CARGO POR COR E CONTADOR)
socket.on('updateUserList', (users) => {
    onlineUsers = users.map(u => u.name);
    
    // COMANDO 6: CONTADOR DE ONLINE
    const counter = document.getElementById('online-counter');
    if(counter) counter.innerText = `Online: ${users.length}`;

    const list = document.getElementById('user-list');
    if(list) {
        list.innerHTML = users.map(u => {
            const isAdm = u.name.toLowerCase().includes('(adm)');
            // COMANDO 1: STATUS ESPECIAL ADM
            const statusColor = isAdm ? 'gold' : '#2ecc71';
            const statusClass = isAdm ? 'status-adm-glow' : '';
            
            return `
                <div class="user-item" onclick="document.getElementById('message').value += '@${u.name} '">
                    <div class="avatar-container">
                        <img src="${u.photo}" class="user-avatar ${isAdm ? 'adm-avatar' : ''}">
                        <div class="status-dot ${statusClass}" style="background:${statusColor}"></div>
                    </div>
                    <span>${u.name}</span>
                </div>
            `;
        }).join('');
    }
});

// FUNÇÕES DE PERFIL E IMAGEM
function sendImage(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            socket.emit('message', { type: 'image', content: e.target.result, replyTo: selectedReply });
            cancelReply();
        };
        reader.readAsDataURL(file);
    }
}
function updateProfileName() {
    const newName = document.getElementById('edit-username').value.trim();
    if (newName && newName !== userData.name) {
        userData.name = newName;
        localStorage.setItem('username', newName);
        socket.emit('updateProfile', { name: newName });
    }
}
function updateProfilePhoto(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            userData.photo = e.target.result;
            avatar.src = e.target.result;
            localStorage.setItem('userphoto', e.target.result);
            socket.emit('updateProfile', { photo: e.target.result });
        };
        reader.readAsDataURL(file);
    }
}
function changeThemeColor(color, dotElement) {
    userData.color = color;
    localStorage.setItem('themeAccent', color);
    document.documentElement.style.setProperty('--accent', color);
    socket.emit('updateProfile', { color: color });
    document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
    dotElement.classList.add('active');
}