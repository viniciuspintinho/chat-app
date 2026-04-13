const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { maxHttpBufferSize: 1e7 }); // Permite fotos e arquivos maiores

app.use(express.static('public'));

let users = {};

io.on('connection', (socket) => {
    // Entrar no chat
    socket.on('join', (data) => {
        users[socket.id] = {
            name: data.name || 'Anônimo',
            photo: data.photo || `https://ui-avatars.com/api/?name=${data.name || 'U'}&background=ff4bb4&color=fff`,
            color: data.color || '#ff4bb4'
        };

        io.emit('message', {
            type: 'system',
            content: `✨ ${users[socket.id].name} entrou no chat!`,
            color: '#28a745'
        });

        io.emit('updateUserList', Object.values(users));
    });

    // Enviar Mensagem (Gera ID único para sincronizar reações)
    socket.on('message', (data) => {
        const user = users[socket.id];
        if (user) {
            io.emit('message', {
                id: 'msg-' + Date.now() + Math.random().toString(36).substr(2, 4),
                user: user.name,
                photo: user.photo,
                color: user.color,
                type: data.type,
                content: data.content
            });
        }
    });

    // Reações (Envia para todos os usuários)
    socket.on('reaction', (data) => {
        io.emit('reaction', data);
    });

    // Digitando (Broadcast: envia para todos exceto para quem está digitando)
    socket.on('typing', (data) => {
        socket.broadcast.emit('typing', data);
    });

    // Sair do chat
    socket.on('disconnect', () => {
        if (users[socket.id]) {
            io.emit('message', {
                type: 'system',
                content: `👋 ${users[socket.id].name} saiu do chat.`,
                color: '#ff4b2b'
            });
            delete users[socket.id];
            io.emit('updateUserList', Object.values(users));
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Servidor voando na porta ${PORT}`));