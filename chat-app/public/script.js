const socket = io();
const chat = document.getElementById('chat');
const messageInput = document.getElementById('message');
const replyContainer = document.getElementById('reply-container');
const replyText = document.getElementById('reply-text');

let myName = localStorage.getItem("username");
let myPhoto = localStorage.getItem("userphoto");
let replyData = null; // Guarda a mensagem que vamos responder

socket.emit('join', { name: myName, photo: myPhoto });

function setReply(user, text) {
    replyData = { user, text: text.substring(0, 30) + (text.length > 30 ? '...' : '') };
    replyText.innerText = `Respondendo a ${user}: "${replyData.text}"`;
    replyContainer.style.display = 'flex';
    messageInput.focus();
}

function cancelReply() {
    replyData = null;
    replyContainer.style.display = 'none';
}

function sendMessage() {
    const text = messageInput.value;
    if (text.trim() !== "") {
        socket.emit('message', { 
            type: 'text', 
            content: text, 
            reply: replyData 
        });
        messageInput.value = '';
        cancelReply();
    }
}

function sendImage(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            socket.emit('message', { 
                type: 'image', 
                content: e.target.result, 
                reply: replyData 
            });
            cancelReply();
        };
        reader.readAsDataURL(file);
    }
}

socket.on('message', (data) => {
    const div = document.createElement('div');
    div.classList.add('msg');
    
    // HTML da Resposta (se houver)
    let replyHTML = data.reply ? `
        <div class="reply-info">
            <strong>@${data.reply.user}</strong>: ${data.reply.text}
        </div>` : '';

    let contentHTML = data.type === 'image' 
        ? `<img src="${data.content}" class="chat-img">` 
        : `<div>${data.content}</div>`;

    div.innerHTML = `
        <div class="msg-header">
            <img src="${data.photo}" class="msg-avatar">
            <strong>${data.user}</strong>
        </div>
        ${replyHTML}
        ${contentHTML}
        <div class="msg-footer">
            <button class="btn-reply-small" onclick="setReply('${data.user}', '${data.type === 'image' ? 'Imagem' : data.content}')">Responder</button>
        </div>
    `;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
});

// ... (Mantenha o resto das funções updateProfile e updateUserList que já tinha)