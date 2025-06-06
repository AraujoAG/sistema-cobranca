// backend/routes/whatsappRoutes.js
const express = require('express');
const router = express.Router();
const whatsappService = require('../services/whatsappService');

router.get('/qr', (req, res) => {
    const qrCode = whatsappService.getQRCode();
    if (qrCode) {
        res.json({ qr: qrCode });
    } else {
        res.status(404).json({ erro: 'QR Code não disponível no momento. Verifique o status.' });
    }
});

router.get('/status', (req, res) => {
    const statusInfo = whatsappService.getClientStatus();
    res.json(statusInfo);
});

router.post('/logout', async (req, res) => {
    try {
        await whatsappService.logoutClient();
        res.json({ mensagem: 'Sessão do WhatsApp encerrada com sucesso.' });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao tentar desconectar', detalhes: error.message });
    }
});

router.post('/initialize', (req, res) => {
    whatsappService.initializeClient();
    res.json({ mensagem: 'Comando de inicialização enviado.' });
});

module.exports = router;