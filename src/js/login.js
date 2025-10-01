const form = document.getElementById('loginForm');
const messageArea = document.getElementById('messageArea');
const loginBtn = document.getElementById('loginBtn');
const btnText = document.getElementById('btnText');
const loadingSpinner = document.getElementById('loadingSpinner');

// Função para mostrar mensagem
function showMessage(message, type = 'error') {
    messageArea.textContent = message;
    messageArea.className = `mb-4 p-3 rounded-lg text-center ${
        type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
    }`;
    messageArea.classList.remove('hidden');
}

// Função para mostrar/ocultar loading
function setLoading(isLoading) {
    if (isLoading) {
        loginBtn.disabled = true;
        btnText.textContent = 'Entrando...';
        loadingSpinner.classList.remove('hidden');
        form.classList.add('loading');
    } else {
        loginBtn.disabled = false;
        btnText.textContent = 'Entrar';
        loadingSpinner.classList.add('hidden');
        form.classList.remove('loading');
    }
}

// Função para mostrar erro específico no campo
function showFieldError(fieldId, message) {
    const errorElement = document.getElementById(fieldId);
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
}

// Limpar erros dos campos
function clearFieldErrors() {
    document.getElementById('usernameError').classList.add('hidden');
    document.getElementById('passwordError').classList.add('hidden');
    messageArea.classList.add('hidden');
}

// Validação em tempo real
document.getElementById('username').addEventListener('input', function () {
    if (this.value.trim()) {
        document.getElementById('usernameError').classList.add('hidden');
    }
});

document.getElementById('senha').addEventListener('input', function () {
    if (this.value) {
        document.getElementById('passwordError').classList.add('hidden');
    }
});

// Evento de submit
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const senha = document.getElementById('senha').value;

    // Limpar mensagens anteriores
    clearFieldErrors();

    // Validação
    let isValid = true;

    if (!username) {
        showFieldError('usernameError', 'Por favor, informe o usuário');
        isValid = false;
    }

    if (!senha) {
        showFieldError('passwordError', 'Por favor, informe a senha');
        isValid = false;
    }

    if (!isValid) {
        form.classList.add('shake');
        setTimeout(() => form.classList.remove('shake'), 500);
        return;
    }

    try {
        setLoading(true);

        const res = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, senha })
        });

        if (res.ok) {
            const data = await res.json();

            // Login bem-sucedido
            showMessage('Login realizado com sucesso!', 'success');

            // Salva username e userId para o chat
            localStorage.setItem('username', data.username);
            localStorage.setItem('userId', data.userId);

           
            if (window.io) {
                const socket = io();
                socket.emit("setUser", { id: data.userId, username: data.username });
            }

            // Redireciona após breve delay para mostrar mensagem de sucesso
            setTimeout(() => {
                window.location.href = '/';
            }, 500);

        } else {
            const text = await res.text();
            showMessage(`Erro no login: ${text}`);
            form.classList.add('shake');
            setTimeout(() => form.classList.remove('shake'), 500);
        }
    } catch (err) {
        console.error('Erro na conexão:', err);
        showMessage('Erro ao conectar ao servidor. Tente novamente.');
        form.classList.add('shake');
        setTimeout(() => form.classList.remove('shake'), 500);
    } finally {
        setLoading(false);
    }
});

// Focar no campo username ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('username').focus();
});
