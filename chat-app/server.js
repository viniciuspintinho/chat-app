const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { maxHttpBufferSize: 1e7 });

app.use(express.static('public'));

let users = {};

io.on('connection', (socket) => {
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

    socket.on('message', (data) => {
        const user = users[socket.id];
        if (user) {
            io.emit('message', {
                id: 'msg-' + Date.now() + Math.random().toString(36).substr(2, 4),
                user: user.name,
                photo: user.photo,
                color: user.color,
                type: data.type,
                content: data.content,
                replyTo: data.replyTo || null // NOVO: Suporte a resposta
            });
        }
    });

    socket.on('reaction', (data) => {
        io.emit('reaction', data);
    });

    socket.on('typing', (data) => {
        socket.broadcast.emit('typing', data);
    });

    socket.on('updateProfile', (data) => {
        if (users[socket.id]) {
            users[socket.id] = { ...users[socket.id], ...data };
            io.emit('updateUserList', Object.values(users));
        }
    });

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

const PORT = process.env.PORT || 10000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});


