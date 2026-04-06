const socket = io();
const chat = document.getElementById('chat');
const messageInput = document.getElementById('message');
const userList = document.getElementById('user-list');
const userCount = document.getElementById('user-count');

const name = localStorage.getItem("username");
const photo = localStorage.getItem("userphoto");

// Envia os dados do perfil ao conectar
socket.emit('join', { name, photo });

function sendMessage() {
    const text = messageInput.value;
    if (text.trim() !== "") {
        socket.emit('message', text);
        messageInput.value = '';
    }
}

socket.on('message', (data) => {
    const div = document.createElement('div');
    div.classList.add('msg');
    div.innerHTML = `
        <div class="msg-content">
            <div class="msg-user-info">
                <img src="${data.photo}" class="msg-avatar">
                <span class="msg-name">${data.user}</span>
            </div>
            <span>${data.text}</span>
        </div>
    `;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
});

socket.on('updateUserList', (list) => {
    userCount.innerText = list.length;
    userList.innerHTML = '';
    list.forEach(u => {
        const li = document.createElement('li');
        li.classList.add('user-info');
        li.innerHTML = `
            <img src="${u.photo}" class="avatar">
            <span>${u.name}</span>
        `;
        userList.appendChild(li);
    });
});