const socket = io();
const chat = document.getElementById('chat');
const messageInput = document.getElementById('message');
const userList = document.getElementById('user-list');
const userCount = document.getElementById('user-count');

let myName = localStorage.getItem("username");
let myPhoto = localStorage.getItem("userphoto");

socket.emit('join', { name: myName, photo: myPhoto });

// FUNÇÃO PARA ENVIAR TEXTO
function sendMessage() {
    const text = messageInput.value;
    if (text.trim() !== "") {
        socket.emit('message', { type: 'text', content: text });
        messageInput.value = '';
    }
}

// FUNÇÃO PARA ENVIAR IMAGEM
function sendImage(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            socket.emit('message', { type: 'image', content: e.target.result });
        };
        reader.readAsDataURL(file);
    }
}

// EDITAR PERFIL
function toggleEdit() {
    const fields = document.getElementById('edit-fields');
    fields.style.display = fields.style.display === 'none' ? 'block' : 'none';
}

function updateProfile() {
    const newName = document.getElementById('new-name').value;
    const newPhoto = document.getElementById('new-photo').value;

    if (newName) myName = newName;
    if (newPhoto) myPhoto = newPhoto;

    localStorage.setItem("username", myName);
    localStorage.setItem("userphoto", myPhoto);
    
    // Avisa o servidor da mudança
    socket.emit('updateProfile', { name: myName, photo: myPhoto });
    toggleEdit();
    alert("Perfil atualizado!");
}

socket.on('message', (data) => {
    const div = document.createElement('div');
    div.classList.add('msg');
    
    let contentHTML = data.type === 'image' 
        ? `<img src="${data.content}" class="chat-img">` 
        : `<div>${data.content}</div>`;

    div.innerHTML = `
        <div class="msg-header">
            <img src="${data.photo}" style="width:20px; height:20px; border-radius:50%">
            <strong>${data.user}</strong>
        </div>
        ${contentHTML}
    `;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
});

socket.on('updateUserList', (list) => {
    userCount.innerText = list.length;
    userList.innerHTML = '';
    list.forEach(u => {
        const li = document.createElement('li');
        li.style.display = "flex";
        li.style.alignItems = "center";
        li.style.gap = "8px";
        li.style.marginBottom = "5px";
        li.innerHTML = `<img src="${u.photo}" style="width:25px;height:25px;border-radius:50%"> <span>${u.name}</span>`;
        userList.appendChild(li);
    });
});