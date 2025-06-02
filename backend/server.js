// backend/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const origensPermitidas = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  process.env.RENDER_URL || 'https://sistema-cobranca-frontend.onrender.com',
  'http://localhost:5000'
];

console.log('Origens permitidas CORS:', origensPermitidas);

// Configuração CORS ajustada
app.use(cors({
  origin: function (origin, callback) {
    if (origensPermitidas.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  // credentials: false // Removido ou false, já que o frontend não envia credenciais
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

const ensureDirectoryExistence = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Mantenha a criação de pastas que são parte do código base,
// mas lembre-se que arquivos de DADOS não devem ser criados assim no Render.
const viewsDir = path.join(__dirname, 'views');
const publicDir = path.join(__dirname, 'public');
ensureDirectoryExistence(viewsDir);
ensureDirectoryExistence(publicDir);
// A criação de 'bot', 'controllers', 'routes' em runtime não é usual
// se eles contêm código. Se 'botDir' for para dados como boletos.xlsx,
// esta abordagem de filesystem é o problema principal no Render.

// REMOVER OU ADAPTAR: Criação de boletos.xlsx em runtime é problemático no Render
/*
const boletoFilePath = path.join(__dirname, 'bot', 'boletos.xlsx');
if (!fs.existsSync(boletoFilePath)) {
  // ... (lógica de criação do arquivo Excel) ...
  // ESTA LÓGICA PRECISA SER REVISADA DEVIDO AO SISTEMA DE ARQUIVOS EFÊMERO
}
*/

const clientesRoutes = require('./routes/clientes');
const cobrancasRoutes = require('./routes/cobrancas');
const dashboardRoutes = require('./routes/dashboard');

app.get('/api/test', (req, res) => {
  res.json({
    message: 'API está funcionando!',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/clientes', clientesRoutes);
app.use('/api/cobrancas', cobrancasRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Rota para o dashboard web - Revisar a leitura de boletos.xlsx
app.get('/', (req, res) => {
  try {
    const persistenceService = require('./bot/persistenceService');
    // const path = require('path'); // já importado
    // const xlsx = require('xlsx'); // Considere não ler daqui diretamente em produção

    persistenceService.initializeHistoricoFile(); // Ainda problemático se historico_cobrancas.json for local

    // ATENÇÃO: A leitura direta do boletos.xlsx aqui é problemática no Render
    // Os dados deveriam vir de um banco de dados ou de um local persistente.
    // const arquivoBoletos = path.join(__dirname, 'bot', 'boletos.xlsx');
    // const workbook = xlsx.readFile(arquivoBoletos);
    // const sheet = workbook.Sheets[workbook.SheetNames[0]];
    // const boletos = xlsx.utils.sheet_to_json(sheet);
    const boletos = []; // Substituir pela lógica de BD

    const stats = persistenceService.obterEstatisticas();

    res.render('dashboard/index', {
      boletos,
      stats,
      // O status do WhatsApp deve ser dinâmico ou removido se não usar @wppconnect
      whatsappStatus: 'API CallMeBot', // Exemplo
      persistenceService // Passar o service pode não ser ideal, passe apenas os dados.
    });
  } catch (error) {
    console.error('Erro ao renderizar dashboard:', error);
    res.status(500).send('Erro ao carregar dashboard: ' + error.message);
  }
});

app.post('/disparar-mensagens', async (req, res) => {
  try {
    const processaBoletos = require('./bot/processaBoletos');
    await processaBoletos(); // Lembre-se que processaBoletos lê o Excel localmente
    res.redirect('/?success=true');
  } catch (error) {
    console.error('Erro ao disparar mensagens:', error);
    res.redirect('/?error=true');
  }
});

// Rota para adicionar boletos - MUITO PROBLEMÁTICA NO RENDER DEVIDO À ESCRITA EM ARQUIVO
app.post('/boletos/adicionar', (req, res) => {
  // ESTA ROTA DEVE SER COMPLETAMENTE REFEITA PARA USAR UM BANCO DE DADOS
  console.warn('Tentativa de adicionar boleto via formulário. Esta função precisa ser migrada para BD.');
  // ... (lógica atual que escreve em Excel) ...
  res.redirect('/?error=true&message=FuncaoNaoDisponivelComPersistenciaAtual');
});

// REMOVER: Rota do QR Code não é compatível com CallMeBot
/*
app.get('/qrcode', (req, res) => {
  // ...
});
*/

app.use((err, req, res, next) => {
  console.error('Erro na aplicação:', err.stack);
  res.status(500).json({
    erro: 'Algo deu errado!',
    detalhes: err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
});

// Usar a porta fornecida pelo Render ou 3001 para desenvolvimento
const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);

  // Iniciar a lógica do bot (agendamentos) após o servidor iniciar
  console.log('Iniciando bot de agendamento...');
  const { main: botMainFunction } = require('./bot/index'); // Assumindo que 'main' é exportado
  if (typeof botMainFunction === 'function') {
    botMainFunction().catch(err => console.error('Erro ao iniciar o bot de agendamento:', err));
  } else {
    console.warn('Função principal do bot não encontrada ou bot/index.js não exporta main.');
    // Se bot/index.js executa sua lógica principal ao ser importado:
    // require('./bot/index');
  }
});

module.exports = app;