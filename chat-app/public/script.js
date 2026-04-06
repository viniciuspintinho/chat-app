const socket = io();
const chat = document.getElementById('chat');
const chatContainer = document.getElementById('chat-container');
const messageInput = document.getElementById('message');
const replyBox = document.getElementById('reply-container');
const replyText = document.getElementById('reply-text');

let myName = localStorage.getItem("username") || "Anônimo";
let myPhoto = localStorage.getItem("userphoto") || "";
let myColor = localStorage.getItem("usercolor") || "#00f2ff";
let replyingTo = null;

// Conectar enviando a cor
socket.emit('join', { name: myName, photo: myPhoto, color: myColor });

function sendMessage() {
    const text = messageInput.value;
    if (text.trim() !== "") {
        socket.emit('message', { type: 'text', content: text, reply: replyingTo });
        messageInput.value = '';
        cancelReply();
    }
}

function sendImage(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            socket.emit('message', { type: 'image', content: e.target.result, reply: replyingTo });
            cancelReply();
        };
        reader.readAsDataURL(file);
    }
}

function react(msgId, emoji) {
    socket.emit('reaction', { msgId, emoji });
}

function startReply(user, content) {
    replyingTo = { user, content: content.substring(0, 20) + "..." };
    replyText.innerText = `Respondendo a ${user}: ${replyingTo.content}`;
    replyBox.style.display = 'flex';
}

function cancelReply() {
    replyingTo = null;
    if(replyBox) replyBox.style.display = 'none';
}

function toggleEdit() {
    const fields = document.getElementById('edit-fields');
    fields.style.display = fields.style.display === 'none' ? 'block' : 'none';
}

function updateProfile() {
    const name = document.getElementById('new-name').value;
    const photo = document.getElementById('new-photo').value;
    const color = document.getElementById('new-color').value;

    if (name) myName = name;
    if (photo) myPhoto = photo;
    if (color) myColor = color;

    localStorage.setItem("username", myName);
    localStorage.setItem("userphoto", myPhoto);
    localStorage.setItem("usercolor", myColor);

    socket.emit('updateProfile', { name: myName, photo: myPhoto, color: myColor });
    toggleEdit();
}

socket.on('message', (data) => {
    const msgId = 'msg-' + Math.random().toString(36).substr(2, 9);
    const div = document.createElement('div');
    
    if(data.type === 'system') {
        div.style.cssText = `color: ${data.color}; text-align: center; font-size: 12px; margin: 10px 0; font-weight: bold;`;
        div.innerText = data.content;
    } else {
        div.classList.add('msg');
        div.id = msgId;
        div.style.borderLeft = `3px solid ${data.color}`; // Cor personalizada na borda

        let replyHTML = data.reply ? `<div class="reply-tag"><strong>@${data.reply.user}</strong>: ${data.reply.content}</div>` : '';
        let contentHTML = data.type === 'image' ? `<img src="${data.content}" class="chat-img">` : `<div>${data.content}</div>`;

        div.innerHTML = `
            <div class="msg-header" style="color: ${data.color}">
                <strong>${data.user}</strong>
            </div>
            ${replyHTML}
            ${contentHTML}
            <div class="reactions" id="reac-${msgId}" style="margin-top:5px; display:flex; gap:3px;"></div>
            <div class="reaction-bar">
                <button onclick="react('${msgId}', '❤️')">❤️</button>
                <button onclick="react('${msgId}', '😂')">😂</button>
                <button onclick="react('${msgId}', '😮')">😮</button>
                <button onclick="startReply('${data.user}', '${data.type==='image'?'Foto':data.content}')">Ref</button>
            </div>
        `;
    }
    chat.appendChild(div);
    chatContainer.scrollTop = chatContainer.scrollHeight;
});

socket.on('reaction', (data) => {
    const reacDiv = document.getElementById(`reac-${data.msgId}`);
    if(reacDiv) {
        const span = document.createElement('span');
        span.innerText = data.emoji;
        span.style.fontSize = "12px";
        reacDiv.appendChild(span);
    }
});

socket.on('updateUserList', (list) => {
    document.getElementById('user-count').innerText = list.length;
    const userList = document.getElementById('user-list');
    userList.innerHTML = '';
    list.forEach(u => {
        const li = document.createElement('li');
        li.style.cssText = "list-style: none; font-size: 12px; margin-bottom: 5px; display: flex; align-items: center; gap: 5px;";
        li.innerHTML = `<img src="${u.photo}" style="width:18px;height:18px;border-radius:50%"> <span style="color:${u.color}">${u.name}</span>`;
        userList.appendChild(li);
    });
});

function toggleTheme() { document.body.classList.toggle('light-theme'); }