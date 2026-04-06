const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

io.on("connection", (socket) => {
  socket.on("join", (username) => {
    socket.username = username;
    io.emit("chat message", {
      username: "Sistema",
      message: username + " entrou no chat"
    });
  });

  socket.on("chat message", (msg) => {
    io.emit("chat message", {
      username: socket.username,
      message: msg
    });
  });

  socket.on("disconnect", () => {
    if (socket.username) {
      io.emit("chat message", {
        username: "Sistema",
        message: socket.username + " saiu"
      });
    }
  });
});

// No seu server.js
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

