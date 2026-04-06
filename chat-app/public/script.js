const socket = io();
const chat = document.getElementById('chat');
const messageInput = document.getElementById('message');
const userList = document.getElementById('user-list');
const userCount = document.getElementById('user-count');

const username = localStorage.getItem("username") || "Visitante";

// Avisa o servidor que entramos
socket.emit('join', username);

// Enviar mensagem
function sendMessage() {
    const text = messageInput.value;
    if (text.trim() !== "") {
        socket.emit('message', text);
        messageInput.value = '';
    }
}

// Receber mensagem
socket.on('message', (data) => {
    const div = document.createElement('div');
    div.classList.add('msg');
    div.innerHTML = `<strong>${data.user}:</strong> ${data.text}`;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
});

// Atualizar lista de quem está online
socket.on('updateUserList', (list) => {
    userCount.innerText = list.length;
    userList.innerHTML = '';
    list.forEach(name => {
        const li = document.createElement('li');
        li.innerText = `🟢 ${name}`;
        userList.appendChild(li);
    });
});