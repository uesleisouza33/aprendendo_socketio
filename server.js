const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// Serve arquivos estáticos da pasta src
app.use(express.static('src'));

// Rota principal
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  console.log('Um usuário se conectou');

  socket.on('mensagem', (msg) => {
    console.log('Mensagem recebida:', msg);
    io.emit('mensagem', msg);
  });

  socket.on('disconnect', () => {
    console.log('Um usuário se desconectou');
  });
});

server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
