const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { maxHttpBufferSize: 1e7 }); 

app.use(express.static('public'));

let users = {}; 

io.on('connection', (socket) => {
    // Quando alguém entra
    socket.on('join', (data) => {
        users[socket.id] = { 
            name: data.name || 'Anônimo', 
            photo: data.photo || '', 
            color: data.color || '#00f2ff' 
        };
        io.emit('message', { 
            type: 'system', 
            content: `🟢 ${users[socket.id].name} entrou no chat!`,
            color: '#28a745' 
        });
        io.emit('updateUserList', Object.values(users));
    });

    // Indicador de Digitação
    socket.on('typing', (isTyping) => {
        const user = users[socket.id];
        if (user) {
            socket.broadcast.emit('typing', { name: user.name, isTyping });
        }
    });

    // Reações
    socket.on('reaction', (data) => {
        io.emit('reaction', data); 
    });

    // Envio de Mensagem (com suporte a Autodestruição/Burn)
    socket.on('message', (data) => {
        const user = users[socket.id];
        if (user) {
            io.emit('message', { 
                user: user.name, 
                photo: user.photo, 
                color: user.color,
                type: data.type, 
                content: data.content,
                reply: data.reply,
                burn: data.burn // Tempo em segundos para sumir
            });
        }
    });

    socket.on('updateProfile', (data) => {
        if (users[socket.id]) {
            users[socket.id].name = data.name;
            users[socket.id].photo = data.photo;
            users[socket.id].color = data.color;
            io.emit('updateUserList', Object.values(users));
        }
    });

    socket.on('disconnect', () => {
        if(users[socket.id]) {
            io.emit('message', { type: 'system', content: `🔴 ${users[socket.id].name} saiu.`, color: '#ff4b2b' });
            delete users[socket.id];
            io.emit('updateUserList', Object.values(users));
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => console.log(`Servidor na porta ${PORT}`));