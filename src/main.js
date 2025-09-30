// Conectar com o socket.io
const socket = io("https://sesichat.onrender.com");

const input = document.getElementById('input');
const send = document.getElementById('sendBtn');
const messages = document.getElementById('messages');

// função para enviar mensagem
function enviarMensagem() {
    //Pegar value do input
    const msg = input.value.trim();
    // Se a mensagem nao estiver vazia, emitir a mensagem para o server e depois limpar o espaço do input
    if (msg != '') {
        socket.emit('mensagem', msg);
        input.value = ''
    }
}


// Enviar mensagem com click do mouse
send.addEventListener('click', enviarMensagem);

// Enviar mensagem utilizando ENTER
input.addEventListener('keydown', (e) =>{
    if (e.code === "Enter") enviarMensagem();
});

// Receber as mensagens vindas do servidor
socket.on('mensagem', (msg) =>{
    //Cria um li
    const li = document.createElement('li');
    // Li recebe o texto
    li.textContent = msg;
    // Classe para dar um margin bottom de 2rem no li
    li.className = 'mb-2';
    // Torna li um elemento filho de messages(ul)
    messages.appendChild(li);

    // Vai para ultima mensagem rolando automaticamente
    messages.scrollTop = messages.scrollHeight;
})
