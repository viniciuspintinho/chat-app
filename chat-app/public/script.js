const socket = io();
const chat = document.getElementById('chat');
const chatContainer = document.getElementById('chat-container');
const messageInput = document.getElementById('message');
const typingIndicator = document.getElementById('typing-indicator');

let myName = localStorage.getItem("username") || "Anônimo";
let myPhoto = localStorage.getItem("userphoto") || "https://ui-avatars.com/api/?name=User";
let myColor = localStorage.getItem("usercolor") || "#ff4bb4";

socket.emit('join', { name: myName, photo: myPhoto, color: myColor });

// Sistema Digitando
messageInput.addEventListener('input', () => {
    socket.emit('typing', { user: myName });
});

let typingTimeout;
socket.on('typing', (data) => {
    typingIndicator.innerText = `${data.user} está digitando...`;
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => { typingIndicator.innerText = ''; }, 2000);
});

function sendMessage() {
    const text = messageInput.value;
    if (text.trim() !== "") {
        socket.emit('message', { type: 'text', content: text });
        messageInput.value = '';
    }
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

socket.on('message', (data) => {
    const div = document.createElement('div');
    if(data.type === 'system') {
        div.style.cssText = `color: ${data.color}; text-align: center; font-size: 12px; margin: 15px 0;`;
        div.innerText = data.content;
    } else {
        const msgId = 'm-' + Math.random().toString(36).substr(2, 9);
        div.classList.add('msg');
        div.innerHTML = `
            <div class="msg-header" style="color: ${data.color}">
                <img src="${data.photo}" class="user-avatar" onerror="this.src='https://ui-avatars.com/api/?name=User'">
                <strong>${data.user}</strong>
            </div>
            ${data.type === 'image' ? `<img src="${data.content}" class="chat-img">` : `<div style="word-break: break-word;">${data.content}</div>`}
            <div class="reaction-bar">
                <button onclick="socket.emit('reaction', {msgId: '${msgId}', emoji: '❤️'})">❤️</button>
                <button onclick="socket.emit('reaction', {msgId: '${msgId}', emoji: '🔥'})">🔥</button>
            </div>
        `;
    }
    chat.appendChild(div);
    chatContainer.scrollTop = chatContainer.scrollHeight;
});

socket.on('updateUserList', (list) => {
    const userList = document.getElementById('user-list');
    userList.innerHTML = '';
    list.forEach(u => {
        userList.innerHTML += `
            <div class="user-item">
                <img src="${u.photo}" class="user-avatar" onerror="this.src='https://ui-avatars.com/api/?name=User'">
                <span style="color:${u.color}">${u.name}</span>
            </div>`;
    });
});