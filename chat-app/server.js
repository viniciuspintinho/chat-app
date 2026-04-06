const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
// maxHttpBufferSize configurado para aceitar fotos
const io = socketIo(server, { maxHttpBufferSize: 1e7 }); 

app.use(express.static('public'));

let users = {}; 

io.on('connection', (socket) => {
    
    // Quando alguém entra no chat
    socket.on('join', (data) => {
        users[socket.id] = { 
            name: data.name || 'Anônimo', 
            photo: data.photo || `https://ui-avatars.com/api/?name=${data.name || 'U'}`, 
            color: data.color || '#ff4bb4' 
        };
        
        // Mensagem de sistema: "Fulano entrou"
        io.emit('message', { 
            type: 'system', 
            content: `🟢 ${users[socket.id].name} entrou no chat!`,
            color: '#28a745' 
        });

        io.emit('updateUserList', Object.values(users));
    });

    // Evento para mostrar quem está digitando (Broadcast para não mostrar para si mesmo)
    socket.on('typing', (data) => {
        socket.broadcast.emit('typing', data);
    });

    // Evento de Reação - Repassa para todos os usuários
    socket.on('reaction', (data) => {
        io.emit('reaction', data); 
    });

    // Atualização de Perfil
    socket.on('updateProfile', (data) => {
        if (users[socket.id]) {
            users[socket.id].name = data.name || users[socket.id].name;
            users[socket.id].photo = data.photo || users[socket.id].photo;
            users[socket.id].color = data.color || users[socket.id].color;
            io.emit('updateUserList', Object.values(users));
        }
    });

    // Envio de Mensagens (Texto ou Imagem)
    socket.on('message', (data) => {
        const user = users[socket.id];
        if (user) {
            io.emit('message', { 
                user: user.name, 
                photo: user.photo, 
                color: user.color, 
                type: data.type, 
                content: data.content,
                reply: data.reply 
            });
        }
    });

    // Quando alguém sai do chat
    socket.on('disconnect', () => {
        if(users[socket.id]) {
            io.emit('message', { 
                type: 'system', 
                content: `🔴 ${users[socket.id].name} saiu do chat.`,
                color: '#ff4b2b' 
            });
            delete users[socket.id];
            io.emit('updateUserList', Object.values(users));
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});