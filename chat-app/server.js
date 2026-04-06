// ... (Código anterior)
    socket.on('message', (data) => {
        const user = users[socket.id];
        if (user) {
            io.emit('message', { 
                user: user.name, 
                photo: user.photo, 
                type: data.type, 
                content: data.content,
                reply: data.reply // Envia a resposta de volta para todos
            });
        }
    });
// ... (Código anterior)