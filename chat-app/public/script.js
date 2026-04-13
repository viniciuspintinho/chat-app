const socket = io();
const chatContainer = document.getElementById('chat-container');
const chat = document.getElementById('chat');
const messageInput = document.getElementById('message');
const typingIndicator = document.getElementById('typing-indicator');

let typingTimeout;
let selectedReply = null;

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
        <div class="reply-content">
            <small style="color:var(--accent)">Respondendo a <strong>${userName}</strong></small>
            <p style="margin:0; opacity:0.8; font-size:0.8rem">${text}</p>
        </div>
        <button onclick="cancelReply()" style="background:none; border:none; color:white; cursor:pointer">
            <i class="fa-solid fa-xmark"></i>
        </button>
    `;
    messageInput.focus();
}

function cancelReply() {
    selectedReply = null;
    const preview = document.getElementById('reply-preview');
    if (preview) preview.remove();
}

// ENVIO DE MENSAGEM
function sendMessage() {
    const text = messageInput.value.trim();
    if (text) {
        socket.emit('message', { 
            type: 'text', 
            content: text,
            replyTo: selectedReply 
        });
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

// RECEBER MENSAGENS COM PODERES DE ADM
socket.on('message', (data) => {
    const div = document.createElement('div');
    if (data.type === 'system') {
        div.className = 'system-msg';
        div.style.color = data.color;
        div.innerText = data.content;
    } else {
        div.classList.add('msg');
        div.id = data.id;

        // VERIFICAÇÃO DE ADM (Poderes visuais)
        const isAdm = data.user.toLowerCase().includes('(adm)');
        if (isAdm) {
            div.classList.add('adm-msg');
        }
        
        const replyHTML = data.replyTo ? `
            <div class="msg-reply-info" style="background:rgba(255,255,255,0.05); border-left:3px solid var(--accent); padding:5px 10px; margin-bottom:8px; border-radius:5px; font-size:0.75rem">
                <small>Repondendo a <strong>${data.replyTo.name}</strong></small>
                <p style="margin:0; opacity:0.6">${data.replyTo.text}...</p>
            </div>
        ` : '';

        div.innerHTML = `
            ${replyHTML}
            <div class="msg-header" style="color:${data.color}">
                <img src="${data.photo}" class="user-avatar-mini ${isAdm ? 'adm-avatar' : ''}">
                <strong>${data.user} ${isAdm ? '<span class="adm-badge">★ ADM</span>' : ''}</strong>
            </div>
            <div class="msg-content">
                ${data.type === 'image' ? `<img src="${data.content}" class="chat-img">` : `<span>${data.content}</span>`}
            </div>
            <div id="reac-${data.id}" class="reaction-container"></div>
            <div class="reaction-bar">
                <button title="Responder" onclick="setReply('${data.id}', '${data.user}', '${data.type === 'image' ? 'Imagem' : data.content}')">
                    <i class="fa-solid fa-reply" style="color:var(--accent)"></i>
                </button>
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

// FUNÇÕES DE IMAGEM E REAÇÃO
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

function react(msgId, emoji) { socket.emit('reaction', { msgId, emoji }); }

socket.on('reaction', (data) => {
    const reacDiv = document.getElementById(`reac-${data.msgId}`);
    if (reacDiv) {
        let existing = Array.from(reacDiv.children).find(s => s.innerText.includes(data.emoji));
        if (!existing) {
            const span = document.createElement('span');
            span.className = 'emoji-badge';
            span.innerText = data.emoji;
            reacDiv.appendChild(span);
        } else {
            existing.style.transform = "scale(1.3)";
            setTimeout(() => existing.style.transform = "scale(1)", 200);
        }
    }
});

socket.on('updateUserList', (users) => {
    const list = document.getElementById('user-list');
    if(list) {
        list.innerHTML = users.map(u => `
            <div class="user-item">
                <img src="${u.photo}" class="user-avatar ${u.name.toLowerCase().includes('(adm)') ? 'adm-avatar' : ''}">
                <span>${u.name}</span>
            </div>
        `).join('');
    }
});

// FUNÇÕES DE PERFIL
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