const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const bcrypt = require('bcrypt');
const db = require('./db');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.static('src'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas de páginas
app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));
app.get('/login', (req, res) => res.sendFile(__dirname + '/login.html'));
app.get('/register', (req, res) => res.sendFile(__dirname + '/register.html'));

// --- Registro ---
app.post('/register', (req, res) => {
    const { username, senha } = req.body;
    const senhaCript = bcrypt.hashSync(senha, 10);

    const sql = "INSERT INTO usuarios (username, senha) VALUES (?, ?)";
    db.query(sql, [username, senhaCript], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ erro: "Usuário já existe" });
            return res.status(500).json({ erro: err.message });
        }
        res.json({ sucesso: true, username, userId: result.insertId });
    });
});

// --- Login ---
app.post('/login', (req, res) => {
    const { username, senha } = req.body;

    const sql = "SELECT * FROM usuarios WHERE username = ?";
    db.query(sql, [username], (err, results) => {
        if (err) return res.status(500).json({ erro: err.message });
        if (results.length === 0) return res.status(401).json({ erro: "Usuário não encontrado" });

        const usuario = results[0];
        const senhaValida = bcrypt.compareSync(senha, usuario.senha);
        if (!senhaValida) return res.status(401).json({ erro: "Senha incorreta" });

        res.json({ username: usuario.username, userId: usuario.id });
    });
});

// --- Minhas conversas ---
app.get('/minhas-conversas', (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ erro: "userId ausente" });

  // Conversas privadas
  const sqlPrivate = `
      SELECT c.id AS conversaId, c.tipo, u.username AS outroUsuario
      FROM conversas c
      JOIN conversa_membros m1 ON c.id = m1.conversa_id
      JOIN conversa_membros m2 ON c.id = m2.conversa_id AND m2.usuario_id != m1.usuario_id
      JOIN usuarios u ON u.id = m2.usuario_id
      WHERE c.tipo='private' AND m1.usuario_id = ?
  `;

  // Conversas em grupo
  const sqlGroup = `
      SELECT c.id AS conversaId, c.tipo, c.nome AS grupoNome
      FROM conversas c
      JOIN conversa_membros m ON c.id = m.conversa_id
      WHERE c.tipo='group' AND m.usuario_id = ?
  `;

  db.query(sqlPrivate, [userId], (err, privateResults) => {
      if (err) return res.status(500).json({ erro: err.message });

      db.query(sqlGroup, [userId], (err2, groupResults) => {
          if (err2) return res.status(500).json({ erro: err2.message });

          const todasConversas = [...privateResults, ...groupResults];
          res.json(todasConversas);
      });
  });
});

// --- Criar conversa privada ---
app.post('/conversa/private', (req, res) => {
  const { user1, usernameOutro } = req.body;

  if (!user1 || !usernameOutro) return res.status(400).json({ erro: "Parâmetros ausentes" });

  db.query("SELECT id FROM usuarios WHERE username = ?", [usernameOutro], (err, results) => {
      if (err) return res.status(500).json({ erro: err.message });
      if (results.length === 0) return res.status(404).json({ erro: "Usuário não encontrado" });

      const user2 = results[0].id;

      // Verifica se já existe conversa privada
      const sqlCheck = `
          SELECT c.id FROM conversas c
          JOIN conversa_membros m1 ON c.id = m1.conversa_id
          JOIN conversa_membros m2 ON c.id = m2.conversa_id
          WHERE c.tipo='private' AND m1.usuario_id = ? AND m2.usuario_id = ?
      `;
      db.query(sqlCheck, [user1, user2], (err, checkResults) => {
          if (err) return res.status(500).json({ erro: err.message });

          if (checkResults.length > 0) return res.json({ conversaId: checkResults[0].id });

          // Criar nova conversa privada
          db.query("INSERT INTO conversas (tipo) VALUES ('private')", (err, insertResult) => {
              if (err) return res.status(500).json({ erro: err.message });

              const conversaId = insertResult.insertId;
              db.query(
                  "INSERT INTO conversa_membros (conversa_id, usuario_id) VALUES (?, ?), (?, ?)",
                  [conversaId, user1, conversaId, user2],
                  (err2) => {
                      if (err2) return res.status(500).json({ erro: err2.message });
                      res.json({ conversaId });
                  }
              );
          });
      });
  });
});

// --- Histórico de mensagens ---
app.get('/conversa/:id/mensagens', (req, res) => {
  const conversaId = req.params.id;

  const sql = `
      SELECT m.id, m.texto, m.criado_em, u.username AS remetente
      FROM mensagens m
      LEFT JOIN usuarios u ON m.remetente_id = u.id
      WHERE m.conversa_id = ?
      ORDER BY m.criado_em ASC
  `;
  db.query(sql, [conversaId], (err, results) => {
      if (err) return res.status(500).json({ erro: err.message });
      res.json(results);
  });
});

// --- Socket.io ---
io.on('connection', (socket) => {
  console.log('Um usuário se conectou');
  socket.username = null;
  socket.userId = null;

  socket.on('setUser', ({ id, username }) => {
      socket.userId = id;
      socket.username = username;
      socket.emit('usernameConfirmed', username);
      io.emit('mensagem', { user: 'Sistema', text: `${username} entrou no chat.` });
  });

  socket.on('joinConversation', (conversaId) => {
      if (!conversaId) return;
      socket.join("conversa_" + conversaId);
  });

  socket.on('sendMessage', ({ conversaId, text }) => {
      if (!conversaId || !text) return;
      db.query(
          "INSERT INTO mensagens (conversa_id, remetente_id, texto) VALUES (?, ?, ?)",
          [conversaId, socket.userId, text],
          (err) => {
              if (err) return console.error(err);
              io.to("conversa_" + conversaId).emit('newMessage', {
                  conversaId,
                  remetente: socket.username,
                  texto: text,
                  criado_em: new Date()
              });
          }
      );
  });

  socket.on('logout', () => {
      if (!socket.username) return;
      io.emit('mensagem', { user: 'Sistema', text: `${socket.username} saiu do chat.` });
      socket.username = null;
      socket.userId = null;
  });

  socket.on('disconnect', () => {
      console.log(`${socket.username || 'Um usuário'} se desconectou`);
  });
});

// --- Servidor ---
server.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
