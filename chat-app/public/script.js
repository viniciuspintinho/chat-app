const socket = io();
const chat = document.getElementById('chat');
const messageInput = document.getElementById('message');
const userList = document.getElementById('user-list');

const username = localStorage.getItem("username");
const userphoto = localStorage.getItem("userphoto");

// Envia nome E foto ao entrar
socket.emit('join', { name: username, photo: userphoto });

function sendMessage() {
    const text = messageInput.value;
    if (text.trim() !== "") {
        // Envia a foto junto com a mensagem
        socket.emit('message', { text: text, photo: userphoto });
        messageInput.value = '';
    }
}

socket.on('message', (data) => {
    const div = document.createElement('div');
    div.classList.add('msg');
    div.innerHTML = `
        <div class="msg-header">
            <img src="${data.photo}" class="msg-avatar">
            <span>${data.user}</span>
        </div>
        <div>${data.text}</div>
    `;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
});

socket.on('updateUserList', (users) => {
    userList.innerHTML = '';
    users.forEach(user => {
        const li = document.createElement('li');
        li.classList.add('user-info');
        li.innerHTML = `
            <img src="${user.photo}" class="avatar">
            <span>${user.name}</span>
        `;
        userList.appendChild(li);
    });
});