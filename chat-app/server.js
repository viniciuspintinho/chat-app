const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

let users = {};

io.on('connection', (socket) => {
    socket.on('join', (username) => {
        users[socket.id] = username || 'Anônimo';
        io.emit('updateUserList', Object.values(users));
    });

    socket.on('message', (data) => {
        io.emit('message', {
            user: users[socket.id],
            text: data
        });
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
        io.emit('updateUserList', Object.values(users));
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Rodando na porta ${PORT}`);
});