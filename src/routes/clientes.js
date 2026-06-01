import { Router } from 'express';
import { createCliente, listClientes } from '../services/clienteService.js';
import { getHistoricoCliente as fetchHistorico } from '../services/pedidoService.js';

const router = Router();

router.get('/:id/pedidos', async (req, res) => {
  const { id } = req.params;
  try {
    const historico = await fetchHistorico(id);
    res.json(historico);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const clientes = await listClientes();
    res.json(clientes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  const { nome, email } = req.body;
  try {
    const cliente = await createCliente({ nome, email });
    res.status(201).json(cliente);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
