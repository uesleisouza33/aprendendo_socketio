const form = document.getElementById('registerForm');

    form.addEventListener('submit', async (e) => {
      e.preventDefault(); // evita recarregar a página

      const username = document.getElementById('username').value.trim();
      const senha = document.getElementById('senha').value;

      if (!username || !senha) {
        alert("Preencha todos os campos");
        return;
      }

      try {
        const res = await fetch('/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, senha })
        });

        const data = await res.json();

        if (res.ok) {
          // registro ok, salva username para o chat
          localStorage.setItem('username', username);
          window.location.href = '/'; // redireciona para o chat
        } else {
          alert(`Erro ao registrar: ${data.erro || 'Desconhecido'}`);
        }
      } catch (err) {
        console.error(err);
        alert('Erro ao conectar ao servidor');
      }
    });