import { Router } from 'express';
import { getRelatorioVendas } from '../services/relatorioService.js';

const router = Router();

/**
 * @swagger
 * /relatorios/vendas:
 *   get:
 *     summary: Relatório consolidado de vendas
 *     parameters:
 *       - $ref: '#/components/parameters/filtrarGrupoParam'
 *     responses:
 *       200:
 *         description: Relatório
 */
router.get('/vendas', async (req, res) => {
  try {
    const relatorio = await getRelatorioVendas(req.query);
    res.json(relatorio);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
