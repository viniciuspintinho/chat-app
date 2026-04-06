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
        // Recebe { name, photo }
        users[socket.id] = { name: data.name, photo: data.photo };
    });

    socket.on('message', (text) => {
        const userData = users[socket.id];
        if (userData) {
            // Manda de volta para todos o nome, foto e texto
            io.emit('message', {
                user: userData.name,
                photo: userData.photo,
                text: text
            });
        }
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Rodando na porta ${PORT}`);
});