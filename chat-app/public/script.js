const socket = io();
const chat = document.getElementById('chat');
const chatContainer = document.getElementById('chat-container');
const messageInput = document.getElementById('message');

let myName = localStorage.getItem("username") || "Anônimo";
let myPhoto = localStorage.getItem("userphoto") || "https://ui-avatars.com/api/?name=User";

socket.emit('join', { name: myName, photo: myPhoto });

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

// FIX PERFIL: Agora avisa o servidor e atualiza o local
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
    alert("Perfil Atualizado!");
}

socket.on('message', (data) => {
    const div = document.createElement('div');
    div.classList.add('msg');
    
    let contentHTML = data.type === 'image' 
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
    // Auto-scroll para a última mensagem
    chatContainer.scrollTop = chatContainer.scrollHeight;
});

socket.on('updateUserList', (list) => {
    document.getElementById('user-count').innerText = list.length;
    const userList = document.getElementById('user-list');
    userList.innerHTML = '';
    list.forEach(u => {
        const li = document.createElement('li');
        li.style.listStyle = "none";
        li.style.marginBottom = "5px";
        li.innerHTML = `<img src="${u.photo}" style="width:20px;height:20px;border-radius:50%"> ${u.name}`;
        userList.appendChild(li);
    });
});

function toggleTheme() {
    document.body.classList.toggle('light-theme');
}