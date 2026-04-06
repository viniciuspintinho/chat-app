let users = {}; 

io.on('connection', (socket) => {
    socket.on('join', (data) => {
        // Agora data é { name: '...', photo: '...' }
        users[socket.id] = { name: data.name, photo: data.photo };
        io.emit('updateUserList', Object.values(users));
    });

    socket.on('message', (data) => {
        io.emit('message', {
            user: users[socket.id].name,
            photo: data.photo,
            text: data.text
        });
    });

    socket.on('disconnect', () => {
        delete users[socket.id];
        io.emit('updateUserList', Object.values(users));
    });
});