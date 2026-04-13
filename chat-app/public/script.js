const socket = io();
const chatContainer = document.getElementById('chat-container');
const chat = document.getElementById('chat');
const messageInput = document.getElementById('message');
const typingIndicator = document.getElementById('typing-indicator');

let typingTimeout;

// Carregar dados iniciais e aplicar tema salvo
const savedThemeColor = localStorage.getItem('themeAccent') || '#ff4bb4';
document.documentElement.style.setProperty('--accent', savedThemeColor);

const userData = {
    name: localStorage.getItem('username'),
    photo: localStorage.getItem('userphoto'),
    color: savedThemeColor
};

if (!userData.name) window.location.href = 'index.html';

// Preencher painel de configurações
document.getElementById('edit-username').value = userData.name;
const avatar = document.getElementById('current-user-avatar');
avatar.src = userData.photo || `https://ui-avatars.com/api/?name=${userData.name}&background=ff4bb4&color=fff`;

// Marcar a bolinha de cor correta no painel
const colorDots = document.querySelectorAll('.color-dot');
colorDots.forEach(dot => {
    if (dot.style.backgroundColor === rgbToHex(savedThemeColor)) {
        dot.classList.add('active');
    } else {
        dot.classList.remove('active');
    }
});

socket.emit('join', userData);

// --- FUNÇÕES DO PAINEL DE CONFIGURAÇÕES (NOVAS) ---
function updateProfileName() {
    const newName = document.getElementById('edit-username').value.trim();
    if (newName && newName !== userData.name) {
        userData.name = newName;
        localStorage.setItem('username', newName);
        socket.emit('updateProfile', { name: newName });
        
        // Atualiza a foto automática se não houver foto enviada
        if (!userData.photo) {
            const newAutoPhoto = `https://ui-avatars.com/api/?name=${newName}&background=${userData.color.replace('#','')}&color=fff`;
            avatar.src = newAutoPhoto;
            socket.emit('updateProfile', { photo: newAutoPhoto });
        }
    }
}

function updateProfilePhoto(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            userData.photo = e.target.result;
            avatar.src = e.target.result; // Atualiza no painel
            localStorage.setItem('userphoto', e.target.result);
            socket.emit('updateProfile', { photo: e.target.result });
        };
        reader.readAsDataURL(file);
    }
}

function changeThemeColor(color, dotElement) {
    userData.color = color;
    localStorage.setItem('themeAccent', color);
    
    // Aplica o tema na variável CSS `--accent` instantaneamente
    document.documentElement.style.setProperty('--accent', color);
    socket.emit('updateProfile', { color: color });

    // Atualiza o painel visual (bolinhas)
    document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
    dotElement.classList.add('active');
}

// Auxiliar para comparar cores hex com cores rgb retornadas pelo DOM
function rgbToHex(rgb) {
    if (!rgb || rgb.startsWith('#')) return rgb;
    const parts = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    delete(parts[0]);
    for (let i = 1; i <= 3; ++i) {
        parts[i] = parseInt(parts[i]).toString(16);
        if (parts[i].length == 1) parts[i] = '0' + parts[part[i]];
    }
    return '#' + parts.join('');
}
// --- FIM FUNÇÕES CONFIGURAÇÕES ---

// --- FUNÇÕES DO CHAT (MANTIDAS) ---
function sendMessage() {
    const text = messageInput.value.trim();
    if (text) {
        socket.emit('message', { type: 'text', content: text });
        messageInput.value = '';
    }
}

function handleKeyPress(e) {
    if (e.key === 'Enter') sendMessage();
    socket.emit('typing', { name: userData.name });
}

function sendImage(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            socket.emit('message', { type: 'image', content: e.target.result });
        };
        reader.readAsDataURL(file);
    }
}

function react(msgId, emoji) {
    socket.emit('reaction', { msgId, emoji });
}

socket.on('message', (data) => {
    const div = document.createElement('div');
    if (data.type === 'system') {
        div.className = 'system-msg';
        div.style.color = data.color;
        div.innerText = data.content;
    } else {
        div.classList.add('msg');
        div.id = data.id;
        div.innerHTML = `
            <div class="msg-header" style="color:${data.color}">
                <img src="${data.photo}" class="user-avatar-mini">
                <strong>${data.user}</strong>
            </div>
            <div class="msg-content">
                ${data.type === 'image' ? `<img src="${data.content}" class="chat-img">` : `<span>${data.content}</span>`}
            </div>
            <div id="reac-${data.id}" class="reaction-container"></div>
            <div class="reaction-bar">
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

socket.on('typing', (data) => {
    typingIndicator.innerText = `${data.name} está digitando...`;
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        typingIndicator.innerText = '';
    }, 2000);
});

socket.on('updateUserList', (users) => {
    const list = document.getElementById('user-list');
    if(list) {
        list.innerHTML = users.map(u => `
            <div class="user-item">
                <img src="${u.photo}" class="user-avatar">
                <span>${u.name}</span>
            </div>
        `).join('');
    }
});