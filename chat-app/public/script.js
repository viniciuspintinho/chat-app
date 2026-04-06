const socket = io();
const chat = document.getElementById('chat');
const messageInput = document.getElementById('message');
const userList = document.getElementById('user-list');
const userCount = document.getElementById('user-count');

const name = localStorage.getItem("username");
const photo = localStorage.getItem("userphoto");

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
        <div class="msg-header">
            <img src="${data.photo}" style="width:20px; height:20px; border-radius:50%">
            <strong>${data.user}</strong>
        </div>
        <div>${data.text}</div>
    `;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
});

// Atualiza a lista no canto superior direito
socket.on('updateUserList', (list) => {
    userCount.innerText = list.length;
    userList.innerHTML = '';
    list.forEach(u => {
        const li = document.createElement('li');
        li.classList.add('online-user');
        li.innerHTML = `<img src="${u.photo}" class="avatar-mini"> <span>${u.name}</span>`;
        userList.appendChild(li);
    });
});