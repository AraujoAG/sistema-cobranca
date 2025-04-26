// backend/routes/cobrancas.js
const express = require('express');
const router = express.Router();
const cobrancasController = require('../controllers/cobrancasController');

// Rotas para cobrancas
router.get('/historico', cobrancasController.obterHistorico);
router.post('/disparar', cobrancasController.dispararCobrancas);
router.post('/disparar-individual', cobrancasController.dispararCobrancaIndividual);

module.exports = router;