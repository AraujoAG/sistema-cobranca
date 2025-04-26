// backend/routes/clientes.js
const express = require('express');
const router = express.Router();
const clientesController = require('../controllers/clientesController');

// Rotas para clientes
router.get('/', clientesController.listarClientes);
router.post('/', clientesController.adicionarCliente);
router.put('/:id', clientesController.atualizarCliente);
router.delete('/:id', clientesController.removerCliente);

module.exports = router;