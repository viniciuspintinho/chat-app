const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('public'));

let users = {}; 

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        // Guarda o objeto completo: nome e foto
        users[socket.id] = { name: data.name, photo: data.photo };
        io.emit('updateUserList', Object.values(users));
    });

    socket.on('message', (text) => {
        const userData = users[socket.id];
        if (userData) {
            io.emit('message', {
                user: userData.name,
                photo: userData.photo,
                text: text
            });
        }
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
        io.emit('updateUserList', Object.values(users));
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});