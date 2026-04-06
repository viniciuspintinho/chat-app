const socket = io();
const chat = document.getElementById('chat');
const messageInput = document.getElementById('message');

const username = localStorage.getItem("username");
const userphoto = localStorage.getItem("userphoto");

// Envia os dados ao conectar
socket.emit('join', { name: username, photo: userphoto });

function sendMessage() {
    const text = messageInput.value;
    if (text.trim() !== "") {
        // Envia a foto junto com o texto
        socket.emit('message', text);
        messageInput.value = '';
    }
}

// O servidor agora manda de volta o objeto completo
socket.on('message', (data) => {
    const div = document.createElement('div');
    div.classList.add('msg');
    
    // Constrói o HTML da mensagem com a foto
    div.innerHTML = `
        <div class="msg-header">
            <img src="${data.photo}" class="msg-avatar">
            <span class="msg-name">${data.user}</span>
        </div>
        <div>${data.text}</div>
    `;
    
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight; // Auto-scroll
});