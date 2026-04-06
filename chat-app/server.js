const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);

// CONFIGURAÇÃO NOVA: Aumentamos o limite para 10MB para as fotos não travarem
const io = socketIo(server, { 
    maxHttpBufferSize: 1e7 
}); 

app.use(express.static('public'));

// Objeto para guardar os usuários online { id: { name, photo } }
let users = {}; 

io.on('connection', (socket) => {
    
    // Quando alguém entra no chat
    socket.on('join', (data) => {
        users[socket.id] = { 
            name: data.name || 'Anônimo', 
            photo: data.photo || 'https://ui-avatars.com/api/?name=?' 
        };
        // Avisa todo mundo da nova lista de online
        io.emit('updateUserList', Object.values(users));
    });

    // Quando alguém edita o perfil (Nome ou Foto)
    socket.on('updateProfile', (data) => {
        if (users[socket.id]) {
            users[socket.id].name = data.name;
            users[socket.id].photo = data.photo;
            io.emit('updateUserList', Object.values(users));
        }
    });

    // Quando alguém manda mensagem (Texto, Foto ou Resposta)
    socket.on('message', (data) => {
        const user = users[socket.id];
        if (user) {
            io.emit('message', { 
                user: user.name, 
                photo: user.photo, 
                type: data.type,      // 'text' ou 'image'
                content: data.content, // o texto ou o código da imagem
                reply: data.reply      // informações da mensagem respondida
            });
        }
    });

    // Quando alguém sai do chat
    socket.on('disconnect', () => {
        delete users[socket.id];
        io.emit('updateUserList', Object.values(users));
    });
});

// CONFIGURAÇÃO PARA O RENDER (PORTA DINÂMICA)
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});