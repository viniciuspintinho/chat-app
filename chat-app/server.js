const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { maxHttpBufferSize: 1e7 }); 

app.use(express.static('public'));

let users = {}; 

io.on('connection', (socket) => {
    // Quando alguém entra no chat
    socket.on('join', (data) => {
        users[socket.id] = { 
            name: data.name || 'Anônimo', 
            photo: data.photo || '', 
            color: data.color || '#00f2ff' 
        };
        
        // Mensagem de sistema verde: "Fulano entrou"
        io.emit('message', { 
            type: 'system', 
            content: `🟢 ${users[socket.id].name} entrou no chat!`,
            color: '#28a745' 
        });

        io.emit('updateUserList', Object.values(users));
    });

    // Evento de Reação
    socket.on('reaction', (data) => {
        io.emit('reaction', data); 
    });

    socket.on('updateProfile', (data) => {
        if (users[socket.id]) {
            users[socket.id].name = data.name;
            users[socket.id].photo = data.photo;
            users[socket.id].color = data.color;
            io.emit('updateUserList', Object.values(users));
        }
    });

    socket.on('message', (data) => {
        const user = users[socket.id];
        if (user) {
            io.emit('message', { 
                user: user.name, 
                photo: user.photo, 
                color: user.color, // Envia a cor personalizada
                type: data.type, 
                content: data.content,
                reply: data.reply 
            });
        }
    });

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
server.listen(PORT, '0.0.0.0', () => console.log(`Rodando na porta ${PORT}`));