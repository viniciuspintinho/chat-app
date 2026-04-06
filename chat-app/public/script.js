// Função para enviar a reação ao servidor
function react(msgId, emoji) {
    socket.emit('reaction', { msgId, emoji });
}

// Ouvir quando alguém reage para mostrar na tela
socket.on('reaction', (data) => {
    // Procura a div de reações dentro da mensagem específica pelo ID
    const reacDiv = document.getElementById(`reac-${data.msgId}`);
    if(reacDiv) {
        // Verifica se já existe esse emoji lá para não repetir infinitamente
        const existingEmoji = Array.from(reacDiv.children).find(span => span.innerText === data.emoji);
        
        if (!existingEmoji) {
            const span = document.createElement('span');
            span.innerText = data.emoji;
            span.style.cssText = `
                background: rgba(255,255,255,0.1);
                padding: 2px 6px;
                border-radius: 10px;
                font-size: 12px;
                border: 1px solid var(--accent);
            `;
            reacDiv.appendChild(span);
        } else {
            // Se já existe, ele dá um pequeno "pulo" (feedback visual)
            existingEmoji.style.transform = "scale(1.3)";
            setTimeout(() => existingEmoji.style.transform = "scale(1)", 200);
        }
    }
});

// Ajuste dentro do socket.on('message') para criar o ID de reações
socket.on('message', (data) => {
    const div = document.createElement('div');
    if(data.type === 'system') {
        div.style.cssText = `color: ${data.color}; text-align: center; font-size: 12px; margin: 15px 0;`;
        div.innerText = data.content;
    } else {
        const msgId = 'm-' + Math.random().toString(36).substr(2, 9);
        div.classList.add('msg');
        div.id = msgId; // IMPORTANTE: Define o ID da mensagem
        div.innerHTML = `
            <div class="msg-header" style="color: ${data.color}">
                <img src="${data.photo}" class="user-avatar" onerror="this.src='https://ui-avatars.com/api/?name=User'">
                <strong>${data.user}</strong>
            </div>
            ${data.type === 'image' ? `<img src="${data.content}" class="chat-img">` : `<div style="word-break: break-word;">${data.content}</div>`}
            
            <div id="reac-${msgId}" style="display:flex; gap:4px; margin-top:8px; flex-wrap: wrap;"></div>
            
            <div class="reaction-bar">
                <button onclick="react('${msgId}', '❤️')">❤️</button>
                <button onclick="react('${msgId}', '🔥')">🔥</button>
                <button onclick="react('${msgId}', '😂')">😂</button>
            </div>
        `;
    }
    chat.appendChild(div);
    chatContainer.scrollTop = chatContainer.scrollHeight;
});