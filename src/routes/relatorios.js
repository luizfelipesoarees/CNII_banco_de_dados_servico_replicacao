import { Router } from 'express';
import { getRelatorioVendas } from '../services/relatorioService.js';

const router = Router();

router.get('/vendas', async (req, res) => {
  try {
    const relatorio = await getRelatorioVendas();
    res.json(relatorio);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
