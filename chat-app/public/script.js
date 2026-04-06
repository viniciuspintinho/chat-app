const socket = io();
const chat = document.getElementById('chat');
const chatContainer = document.getElementById('chat-container');
const messageInput = document.getElementById('message');

let myName = localStorage.getItem("username") || "Anônimo";
let myPhoto = localStorage.getItem("userphoto") || "";

socket.emit('join', { name: myName, photo: myPhoto });

function sendMessage() {
    const text = messageInput.value;
    if (text.trim() !== "") {
        socket.emit('message', { type: 'text', content: text });
        messageInput.value = '';
    }
}

// RECEBER MENSAGEM
socket.on('message', (data) => {
    const div = document.createElement('div');
    div.classList.add('msg');
    
    let contentHTML = data.type === 'image' 
        ? `<img src="${data.content}" class="chat-img">` 
        : `<div>${data.content}</div>`;

    div.innerHTML = `
        <div style="font-size:10px; color:#00ffcc; margin-bottom:4px;">
            <strong>${data.user}</strong>
        </div>
        ${contentHTML}
    `;
    
    chat.appendChild(div);
    
    // Rolar para baixo automaticamente
    chatContainer.scrollTop = chatContainer.scrollHeight;
});

// Atualizar usuários online
socket.on('updateUserList', (list) => {
    document.getElementById('user-count').innerText = list.length;
    const userList = document.getElementById('user-list');
    userList.innerHTML = '';
    list.forEach(u => {
        const li = document.createElement('li');
        li.style.fontSize = "12px";
        li.innerText = `● ${u.name}`;
        userList.appendChild(li);
    });
});