// backend/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// Middlewares
app.use(cors({
  origin: ['https://sistema-cobranca-frontend.onrender.com', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Garante que as pastas necessárias existam
const ensureDirectoryExistence = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Criação das pastas necessárias
const botDir = path.join(__dirname, 'bot');
const controllersDir = path.join(__dirname, 'controllers');
const routesDir = path.join(__dirname, 'routes');

ensureDirectoryExistence(botDir);
ensureDirectoryExistence(controllersDir);
ensureDirectoryExistence(routesDir);

// Criar arquivo boletos.xlsx se não existir
const boletoFilePath = path.join(__dirname, 'bot', 'boletos.xlsx');
if (!fs.existsSync(boletoFilePath)) {
  const xlsx = require('xlsx');
  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.json_to_sheet([]);
  xlsx.utils.book_append_sheet(wb, ws, 'Boletos');
  xlsx.writeFile(wb, boletoFilePath);
}

// Importar rotas
const clientesRoutes = require('./routes/clientes');
const cobrancasRoutes = require('./routes/cobrancas');
const dashboardRoutes = require('./routes/dashboard');

// Usar rotas
app.use('/api/clientes', clientesRoutes);
app.use('/api/cobrancas', cobrancasRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Servir o frontend em produção
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

// Rota de teste
app.get('/api/test', (req, res) => {
  res.json({ message: 'API está funcionando!' });
});

// Tratamento de erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ erro: 'Algo deu errado!', detalhes: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

// No arquivo server.js, adicione:

// Rota para exibir o QR code
app.get('/qrcode', (req, res) => {
  if (global.qrCode) {
    res.send(`
      <html>
        <body>
          <h1>Escaneie o QR Code com o WhatsApp</h1>
          <img src="${global.qrCode}" alt="QR Code" />
        </body>
      </html>
    `);
  } else {
    res.send('QR Code ainda não disponível. Tente reiniciar o servidor.');
  }
});

// Depois modifique a função catchQR no sendMessage.js:
catchQR: (base64Qr, asciiQR) => {
  console.log('QR CODE RECEBIDO:');
  console.log(asciiQR);
  global.qrCode = base64Qr; // Salva o QR code para exibição
},