const socket = io();
const chat = document.getElementById('chat');
const chatContainer = document.getElementById('chat-container');
const messageInput = document.getElementById('message');
// Variáveis para o sistema de resposta funcionar
const replyBox = document.getElementById('reply-container');
const replyText = document.getElementById('reply-text');

let myName = localStorage.getItem("username") || "Anônimo";
let myPhoto = localStorage.getItem("userphoto") || "";
let replyingTo = null; // Guarda a resposta

socket.emit('join', { name: myName, photo: myPhoto });

// --- FUNÇÕES DE ENVIO ---

function sendMessage() {
    const text = messageInput.value;
    if (text.trim() !== "") {
        // Agora envia também o objeto de resposta (mesmo que seja null)
        socket.emit('message', { type: 'text', content: text, reply: replyingTo });
        messageInput.value = '';
        cancelReply(); // Limpa a resposta após enviar
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

// --- FUNÇÕES DE SISTEMA (REPLY E PERFIL) ---

function startReply(user, content) {
    replyingTo = { user, content: content.substring(0, 20) + "..." };
    replyText.innerText = `Respondendo a ${user}: ${replyingTo.content}`;
    replyBox.style.display = 'flex';
    messageInput.focus();
}

function cancelReply() {
    replyingTo = null;
    if(replyBox) replyBox.style.display = 'none';
}

function toggleEdit() {
    const fields = document.getElementById('edit-fields');
    if(fields) fields.style.display = fields.style.display === 'none' ? 'block' : 'none';
}

function updateProfile() {
    const name = document.getElementById('new-name').value;
    const photo = document.getElementById('new-photo').value;
    if (name) myName = name;
    if (photo) myPhoto = photo;
    localStorage.setItem("username", myName);
    localStorage.setItem("userphoto", myPhoto);
    socket.emit('updateProfile', { name: myName, photo: myPhoto });
    toggleEdit();
    alert("Perfil Atualizado!");
}

// --- RECEBIMENTO DE MENSAGENS ---

socket.on('message', (data) => {
    const div = document.createElement('div');
    div.classList.add('msg');
    
    // Lógica para mostrar a tag de resposta se houver
    let replyHTML = data.reply ? `<div class="reply-tag" style="background:rgba(0,0,0,0.2); padding:5px; font-size:10px; border-left:2px solid #00ffcc; margin-bottom:5px;"><strong>@${data.reply.user}</strong>: ${data.reply.content}</div>` : '';
    
    let contentHTML = data.type === 'image' 
        ? `<img src="${data.content}" class="chat-img" style="max-width:200px; border-radius:10px;">` 
        : `<div>${data.content}</div>`;

    div.innerHTML = `
        <div style="font-size:10px; color:#00ffcc; margin-bottom:4px;">
            <img src="${data.photo}" style="width:20px; height:20px; border-radius:50%; vertical-align:middle; margin-right:5px;">
            <strong>${data.user}</strong>
        </div>
        ${replyHTML}
        ${contentHTML}
        <button onclick="startReply('${data.user}', '${data.type==='image'?'Foto':data.content}')" style="background:none; border:none; color:#666; font-size:10px; cursor:pointer; display:block; margin-top:5px;">Responder</button>
    `;
    
    chat.appendChild(div);
    chatContainer.scrollTop = chatContainer.scrollHeight;
});

// Atualizar usuários online
socket.on('updateUserList', (list) => {
    const userCountEl = document.getElementById('user-count');
    if(userCountEl) userCountEl.innerText = list.length;
    
    const userList = document.getElementById('user-list');
    if(userList) {
        userList.innerHTML = '';
        list.forEach(u => {
            const li = document.createElement('li');
            li.style.fontSize = "12px";
            li.style.listStyle = "none";
            li.innerHTML = `<img src="${u.photo}" style="width:15px; height:15px; border-radius:50%; margin-right:5px;"> ${u.name}`;
            userList.appendChild(li);
        });
    }
});

function toggleTheme() {
    document.body.classList.toggle('light-theme');
}