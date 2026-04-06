const socket = io();
const chat = document.getElementById('chat');
const messageInput = document.getElementById('message');
const userList = document.getElementById('user-list');

let myName = localStorage.getItem("username");
let myPhoto = localStorage.getItem("userphoto");

// Conectar ao entrar
socket.emit('join', { name: myName, photo: myPhoto });

// Enviar texto
function sendMessage() {
    const text = messageInput.value;
    if (text.trim() !== "") {
        socket.emit('message', { type: 'text', content: text });
        messageInput.value = '';
    }
}

// Enviar imagem
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

// Editar Perfil
function toggleEdit() {
    const fields = document.getElementById('edit-fields');
    fields.style.display = fields.style.display === 'none' ? 'block' : 'none';
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
}

// Receber mensagens
socket.on('message', (data) => {
    const div = document.createElement('div');
    div.classList.add('msg');
    
    const contentHTML = data.type === 'image' 
        ? `<img src="${data.content}" class="chat-img">` 
        : `<div>${data.content}</div>`;

    div.innerHTML = `
        <div class="msg-header">
            <img src="${data.photo}" class="msg-avatar">
            <strong>${data.user}</strong>
        </div>
        ${contentHTML}
    `;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
});

// Lista Online
socket.on('updateUserList', (list) => {
    document.getElementById('user-count').innerText = list.length;
    userList.innerHTML = '';
    list.forEach(u => {
        const li = document.createElement('li');
        li.classList.add('online-user');
        li.innerHTML = `<img src="${u.photo}" class="avatar-mini"> <span>${u.name}</span>`;
        userList.appendChild(li);
    });
});