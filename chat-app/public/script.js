const socket = io();
const chat = document.getElementById("chat");

const username = localStorage.getItem("username");

if (!username) {
  window.location.href = "/";
}

socket.emit("join", username);

function sendMessage() {
  const input = document.getElementById("message");

  if (!input.value) return;

  socket.emit("chat message", input.value);
  input.value = "";
}

socket.on("chat message", (data) => {
  const div = document.createElement("div");
  div.className = "msg";
  div.innerHTML = `<b>${data.username}:</b> ${data.message}`;
  chat.appendChild(div);

  chat.scrollTop = chat.scrollHeight;
});