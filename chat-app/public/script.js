const socket = io();
const chat = document.getElementById('chat');
const chatContainer = document.getElementById('chat-container');
const messageInput = document.getElementById('message');
const replyBox = document.getElementById('reply-container');
const replyText = document.getElementById('reply-text');
const typingIndicator = document.getElementById('typing-indicator');

let myName = localStorage.getItem("username") || "Anônimo";
let myPhoto = localStorage.getItem("userphoto") || "";
let myColor = localStorage.getItem("usercolor") || "#00f2ff";
let replyingTo = null;
let isBurnActive = false;
let typingTimeout;

socket.emit('join', { name: myName, photo: myPhoto, color: myColor });

// --- FUNÇÕES DE INTERAÇÃO ---

function handleTyping() {
    socket.emit('typing', true);
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => socket.emit('typing', false), 2000);
}

function toggleBurn() {
    isBurnActive = !isBurnActive;
    const btn = document.getElementById('burn-btn');
    btn.style.opacity = isBurnActive ? "1" : "0.5";
    btn.style.filter = isBurnActive ? "drop-shadow(0 0 8px #ff0077)" : "none";
}

function sendMessage() {
    const text = messageInput.value;
    if (text.trim() !== "") {
        socket.emit('message', { 
            type: 'text', 
            content: text, 
            reply: replyingTo,
            burn: isBurnActive ? 10 : null 
        });
        messageInput.value = '';
        cancelReply();
        if(isBurnActive) toggleBurn();
    }
}

function sendImage(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            socket.emit('message', { 
                type: 'image', 
                content: e.target.result, 
                reply: replyingTo,
                burn: isBurnActive ? 15 : null 
            });
            if(isBurnActive) toggleBurn();
        };
        reader.readAsDataURL(file);
    }
}

// --- RECEBIMENTO DE EVENTOS ---

socket.on('typing', (data) => {
    typingIndicator.innerText = data.isTyping ? `${data.name} está a escrever...` : "";
});

socket.on('reaction', (data) => {
    const reacDiv = document.getElementById(`reac-${data.msgId}`);
    if(reacDiv) {
        const span = document.createElement('span');
        span.innerText = data.emoji;
        reacDiv.appendChild(span);
    }
});

socket.on('message', (data) => {
    const msgId = 'msg-' + Math.random().toString(36).substr(2, 9);
    const div = document.createElement('div');
    
    if(data.type === 'system') {
        div.style.cssText = `color: ${data.color}; text-align: center; font-size: 11px; margin: 10px 0; font-weight: bold;`;
        div.innerText = data.content;
    } else {
        div.classList.add('msg');
        div.id = msgId;
        div.style.borderLeft = `3px solid ${data.color}`;

        let replyHTML = data.reply ? `<div class="reply-tag"><strong>@${data.reply.user}</strong>: ${data.reply.content}</div>` : '';
        let contentHTML = data.type === 'image' ? `<img src="${data.content}" class="chat-img">` : `<div>${data.content}</div>`;

        div.innerHTML = `
            <div class="msg-header" style="color: ${data.color}">
                <strong>${data.user}</strong>
            </div>
            ${replyHTML}
            ${contentHTML}
            <div class="reactions" id="reac-${msgId}"></div>
            <div class="reaction-bar">
                <button onclick="react('${msgId}', '❤️')">❤️</button>
                <button onclick="react('${msgId}', '😂')">😂</button>
                <button onclick="react('${msgId}', '🔥')">🔥</button>
                <button onclick="startReply('${data.user}', '${data.type==='image'?'Foto':data.content}')">💬</button>
            </div>
        `;

        if (data.burn) {
            let timeLeft = data.burn;
            const timer = document.createElement('div');
            timer.style.cssText = "font-size:9px; color:#ff0077; margin-top:5px; font-weight:bold;";
            div.appendChild(timer);
            const countdown = setInterval(() => {
                timer.innerText = `🔥 Autodestruição em ${timeLeft}s...`;
                if (timeLeft <= 0) {
                    div.style.opacity = "0";
                    div.style.transform = "scale(0.8)";
                    setTimeout(() => div.remove(), 500);
                    clearInterval(countdown);
                }
                timeLeft--;
            }, 1000);
        }
    }
    chat.appendChild(div);
    chatContainer.scrollTop = chatContainer.scrollHeight;
});

// Funções Auxiliares (Perfil/Reply)
function react(msgId, emoji) { socket.emit('reaction', { msgId, emoji }); }
function startReply(user, content) {
    replyingTo = { user, content: content.substring(0, 20) + "..." };
    replyText.innerText = `Respondendo a ${user}: ${replyingTo.content}`;
    replyBox.style.display = 'flex';
}
function cancelReply() { replyingTo = null; replyBox.style.display = 'none'; }
function toggleEdit() { 
    const f = document.getElementById('edit-fields'); 
    f.style.display = f.style.display === 'none' ? 'block' : 'none'; 
}
function updateProfile() {
    myName = document.getElementById('new-name').value || myName;
    myPhoto = document.getElementById('new-photo').value || myPhoto;
    myColor = document.getElementById('new-color').value || myColor;
    localStorage.setItem("username", myName);
    localStorage.setItem("userphoto", myPhoto);
    localStorage.setItem("usercolor", myColor);
    socket.emit('updateProfile', { name: myName, photo: myPhoto, color: myColor });
    toggleEdit();
}
socket.on('updateUserList', (list) => {
    document.getElementById('user-count').innerText = list.length;
    const ul = document.getElementById('user-list');
    ul.innerHTML = '';
    list.forEach(u => {
        const li = document.createElement('li');
        li.innerHTML = `<span style="color:${u.color}">● ${u.name}</span>`;
        ul.appendChild(li);
    });
});