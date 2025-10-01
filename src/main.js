// Conectar socket
// const socket = io("https://sesichat.onrender.com");
const socket = io();

// Estado global
let username = null;
let userId = null; // vamos guardar também o ID
let currentConversationId = null;

// Elementos
const input = document.getElementById('input');
const send = document.getElementById('sendBtn');
const messages = document.getElementById('messages');

const conversationsList = document.getElementById("conversations"); // ul lista de conversas
const newPrivateBtn = document.getElementById("newPrivateBtn");

const authArea = document.getElementById("authArea");
const userArea = document.getElementById("userArea");
const saudacao = document.getElementById("saudacao");
const logoutBtn = document.getElementById("logoutBtn");

// Inicialmente desativado
if (input) input.disabled = true;
if (send) send.disabled = true;

// Recupera dados do localStorage
const savedUsername = localStorage.getItem("username");
const savedUserId = localStorage.getItem("userId");

if (savedUsername && savedUserId) {
  // envia o evento correto com ID e username
  socket.emit("setUser", { id: savedUserId, username: savedUsername });
}

// Confirmar login no socket
socket.on('usernameConfirmed', (name) => {
  username = name;
  userId = localStorage.getItem("userId");

  if (input) input.disabled = false;
  if (send) send.disabled = false;

  if (authArea && userArea && saudacao) {
    authArea.classList.add("hidden");
    userArea.classList.remove("hidden");
    saudacao.textContent = `Olá, ${username}`;
  }

  carregarConversas();
});

// ========== Conversas ==========

// Carregar lista de conversas do backend
async function carregarConversas() {
  try {
    const res = await fetch(`/minhas-conversas?userId=${userId}`);
    const conversas = await res.json();

    conversationsList.innerHTML = '';

    conversas.forEach((c, index) => {
      const li = document.createElement("li");
      li.textContent = c.tipo === "private" ? `Chat com ${c.outroUsuario}` : c.nome || c.grupoNome;
      li.classList.add("cursor-pointer", "p-2", "rounded", "hover:bg-gray-200");
      li.addEventListener("click", () => entrarConversa(c.conversaId));
      conversationsList.appendChild(li);

      // entra na primeira conversa automaticamente
      if (index === 0 && !currentConversationId) {
        entrarConversa(c.conversaId);
      }
    });

  } catch (err) {
    console.error("Erro ao carregar conversas:", err);
  }
}

// Entrar em uma conversa
async function entrarConversa(conversaId) {
  currentConversationId = conversaId;
  messages.innerHTML = '';

  socket.emit("joinConversation", conversaId);

  // Carregar histórico do backend
  try {
    const res = await fetch(`/conversa/${conversaId}/mensagens`);
    const historico = await res.json();

    historico.forEach(m => renderMensagem({
      user: m.remetente,
      text: m.texto,
      createdAt: m.criado_em
    }));

  } catch (err) {
    console.error("Erro ao carregar mensagens:", err);
  }
}

// ========== Mensagens ==========

// Enviar
function enviarMensagem() {
  const msg = input.value.trim();
  console.log({ msg, username, currentConversationId, userId });
  if (msg && username && currentConversationId) {
    socket.emit('sendMessage', { conversaId: currentConversationId, senderId: userId, text: msg });
    input.value = '';
  }
}

send?.addEventListener('click', enviarMensagem);
input?.addEventListener('keydown', (e) => {
  if (e.code === "Enter") enviarMensagem();
});

// Receber
socket.on('newMessage', (msg) => {
  renderMensagem({ user: msg.remetente || msg.user, text: msg.texto || msg.text });
});

function renderMensagem(msg) {
  const li = document.createElement('li');

  if (msg.user === 'Sistema') {
    li.textContent = `${msg.text}`;
    li.classList.add('mb-2', 'text-yellow-600', 'font-semibold', 'text-center');

  } else if (msg.user === username) {
    li.textContent = `Você: ${msg.text}`;
    li.classList.add(
      'mb-2', 'px-3', 'py-2', 'rounded-lg',
      'bg-blue-500', 'text-white', 'max-w-xs', 'self-end'
    );

  } else {
    li.textContent = `${msg.user}: ${msg.text}`;
    li.classList.add(
      'mb-2', 'px-3', 'py-2', 'rounded-lg',
      'bg-gray-200', 'text-gray-800', 'max-w-xs', 'self-start'
    );
  }

  messages.appendChild(li);
  messages.scrollTop = messages.scrollHeight;
}

// ========== Nova conversa privada ==========
newPrivateBtn?.addEventListener("click", async () => {
  const outro = prompt("Digite o username da pessoa:");
  if (!outro) return;

  try {
    const res = await fetch("/conversa/private", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user1: userId, usernameOutro: outro })
    });
    const data = await res.json();
    if (data.conversaId) {
      carregarConversas();
      entrarConversa(data.conversaId);
    }
  } catch (err) {
    console.error("Erro ao criar conversa privada:", err);
  }
});

// ========== Logout ==========
logoutBtn?.addEventListener("click", () => {
  if (username) {
    socket.emit("logout");
    username = null;
    userId = null;
  }
  localStorage.removeItem("username");
  localStorage.removeItem("userId");

  if (authArea && userArea) {
    authArea.classList.remove("hidden");
    userArea.classList.add("hidden");
  }

  messages.innerHTML = '';
  conversationsList.innerHTML = '';
});