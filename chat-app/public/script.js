const socket = io();
const chatContainer = document.getElementById('chat-container');
const chat = document.getElementById('chat');
const messageInput = document.getElementById('message');
const typingIndicator = document.getElementById('typing-indicator');

let typingTimeout;

// Carregar dados do localStorage
const userData = {
    name: localStorage.getItem('username'),
    photo: localStorage.getItem('userphoto'),
    color: '#ff4bb4'
};

if (!userData.name) window.location.href = 'index.html';

socket.emit('join', userData);

// Enviar Mensagem de Texto
function sendMessage() {
    const text = messageInput.value.trim();
    if (text) {
        socket.emit('message', { type: 'text', content: text });
        messageInput.value = '';
    }
}

// Controla teclas e aviso de Digitando
function handleKeyPress(e) {
    if (e.key === 'Enter') {
        sendMessage();
    } else {
        socket.emit('typing', { name: userData.name });
    }
}

// Escuta evento de digitação de outros usuários
socket.on('typing', (data) => {
    typingIndicator.innerText = `${data.name} está digitando...`;
    
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        typingIndicator.innerText = '';
    }, 2000); // Some após 2 segundos sem digitar
});

// Enviar Imagem
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

// Enviar Reação ao Servidor
function react(msgId, emoji) {
    socket.emit('reaction', { msgId, emoji });
}

// Receber Mensagens
socket.on('message', (data) => {
    const div = document.createElement('div');
    
    if (data.type === 'system') {
        div.className = 'system-msg';
        div.style.color = data.color;
        div.innerText = data.content;
    } else {
        div.classList.add('msg');
        div.id = data.id; // ID sincronizado vindo do servidor
        
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
    typingIndicator.innerText = ''; // Limpa o "digitando" quando a mensagem chega
});

// Receber Reações de qualquer usuário
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
            // Efeito visual de clique se já existir
            existing.style.transform = "scale(1.4)";
            setTimeout(() => existing.style.transform = "scale(1)", 200);
        }
    }
});

// Atualizar Lista de Usuários Online
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