const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { maxHttpBufferSize: 1e7 }); // Para aceitar fotos

app.use(express.static('public'));

let users = {}; 

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        users[socket.id] = { name: data.name, photo: data.photo };
        io.emit('updateUserList', Object.values(users));
    });

    socket.on('updateProfile', (data) => {
        if (users[socket.id]) {
            users[socket.id].name = data.name;
            users[socket.id].photo = data.photo;
            io.emit('updateUserList', Object.values(users));
        }
    });

    socket.on('message', (data) => {
        const user = users[socket.id];
        if (user) {
            io.emit('message', { 
                user: user.name, 
                photo: user.photo, 
                type: data.type, 
                content: data.content 
            });
        }
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
        io.emit('updateUserList', Object.values(users));
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => console.log(`Rodando na porta ${PORT}`));