import { Router } from 'express';
import { getPedidoCompleto, createPedido } from '../services/pedidoService.js';

const router = Router();

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const pedido = await getPedidoCompleto(id);
    if (!pedido) {
      return res.status(404).json({ error: `Pedido com ID ${id} não encontrado.` });
    }
    res.json(pedido);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  const { cliente_id, itens } = req.body;
  try {
    const pedido = await createPedido({ cliente_id, itens });
    res.status(201).json(pedido);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
