const form = document.getElementById('loginForm');

form.addEventListener('submit', async (e) => {
    e.preventDefault(); // evita recarregar a página

    const username = document.getElementById('username').value.trim();
    const senha = document.getElementById('senha').value;

    if (!username || !senha) {
        alert("Preencha todos os campos");
        return;
    }

    try {
        const res = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, senha })
        });

        if (res.ok) {
            // login ok, salva username para o chat
            localStorage.setItem('username', username);
            window.location.href = '/'; // redireciona para o chat
        } else {
            const text = await res.text();
            alert(`Erro no login: ${text}`);
        }
    } catch (err) {
        console.error(err);
        alert('Erro ao conectar ao servidor');
    }
});