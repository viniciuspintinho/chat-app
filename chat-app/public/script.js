// ... (mantenha suas variáveis de socket e localStorage lá no topo)

// Função de Scroll Suave Corrigida
function scrollToBottom() {
    chatContainer.scrollTo({
        top: chatContainer.scrollHeight,
        behavior: 'smooth'
    });
}

// Atualizar o socket.on('message') para usar essa função
socket.on('message', (data) => {
    // ... (sua lógica de criar a div da mensagem igual antes)
    chat.appendChild(div);
    scrollToBottom();
});

// Alternar Tema com persistência
function toggleTheme() {
    const body = document.body;
    body.classList.toggle('light-theme');
    const theme = body.classList.contains('light-theme') ? 'light' : 'dark';
    localStorage.setItem('selected-theme', theme);
}

// Aplicar tema salvo ao carregar
const currentTheme = localStorage.getItem('selected-theme');
if (currentTheme === 'light') document.body.classList.add('light-theme');