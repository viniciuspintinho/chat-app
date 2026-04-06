socket.on('message', (data) => {
    // Geramos um ID único para cada mensagem para as reações saberem onde aparecer
    const msgId = 'msg-' + Math.random().toString(36).substr(2, 9);
    const div = document.createElement('div');
    
    // MENSAGEM DE SISTEMA (Entrada/Saída)
    if(data.type === 'system') {
        div.style.cssText = `color: ${data.color}; text-align: center; font-size: 12px; margin: 15px 0; font-weight: bold; text-shadow: 0 0 5px ${data.color};`;
        div.innerText = data.content;
    } 
    // MENSAGEM NORMAL (Texto ou Foto)
    else {
        div.classList.add('msg');
        div.id = msgId;
        // Aplica a cor escolhida pelo usuário na borda lateral
        div.style.borderLeft = `3px solid ${data.color || '#00f2ff'}`;

        // Se a mensagem for uma resposta, cria o balãozinho de citação
        let replyHTML = data.reply ? `<div class="reply-tag"><strong>@${data.reply.user}</strong>: ${data.reply.content}</div>` : '';
        
        // Define se o conteúdo é uma imagem ou texto puro
        let contentHTML = data.type === 'image' 
            ? `<img src="${data.content}" class="chat-img">` 
            : `<div class="text-content">${data.content}</div>`;

        // Montagem do HTML da mensagem
        div.innerHTML = `
            <div class="msg-header" style="color: ${data.color || '#00f2ff'}">
                <img src="${data.photo || 'https://ui-avatars.com/api/?name=' + data.user}" style="width:22px; height:22px; border-radius:50%; vertical-align:middle; margin-right:5px; border: 1px solid ${data.color}">
                <strong>${data.user}</strong>
            </div>
            
            ${replyHTML}
            ${contentHTML}
            
            <div class="reactions" id="reac-${msgId}"></div>
            
            <div class="reaction-bar">
                <button onclick="react('${msgId}', '❤️')" title="Amei">❤️</button>
                <button onclick="react('${msgId}', '😂')" title="Gargalhada">😂</button>
                <button onclick="react('${msgId}', '🔥')" title="Fogo">🔥</button>
                <button onclick="react('${msgId}', '😮')" title="Surpreso">😮</button>
                <button class="btn-reply-action" onclick="startReply('${data.user}', '${data.type === 'image' ? 'Foto' : data.content}')" title="Responder">💬</button>
            </div>
        `;
    }

    chat.appendChild(div);
    
    // Scroll suave para a última mensagem
    chatContainer.scrollTo({
        top: chatContainer.scrollHeight,
        behavior: 'smooth'
    });
});