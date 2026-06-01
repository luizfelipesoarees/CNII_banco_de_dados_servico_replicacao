import express from 'express';
import dotenv from 'dotenv';

import healthRouter from './routes/health.js';
import clientesRouter from './routes/clientes.js';
import produtosRouter from './routes/produtos.js';
import pedidosRouter from './routes/pedidos.js';
import relatoriosRouter from './routes/relatorios.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use((req, res, next) => {
  console.log(`\x1b[1;35m[API REQUEST] ${req.method} ${req.originalUrl}\x1b[0m`);
  next();
});

app.use('/health', healthRouter);
app.use('/clientes', clientesRouter);
app.use('/produtos', produtosRouter);
app.use('/pedidos', pedidosRouter);
app.use('/relatorios', relatoriosRouter);

app.use((error, req, res, next) => {
  console.error('\x1b[1;31m[API ERROR]\x1b[0m', error);
  res.status(500).json({ error: 'Erro interno do servidor.', details: error.message });
});

app.listen(PORT, () => {
  console.log('\n==================================================');
  console.log(`🚀 SERVIDOR EXPRESS ONLINE NA PORTA ${PORT}`);
  console.log(`🔗 Rota de saúde: http://localhost:${PORT}/health`);
  console.log('==================================================\n');
});

export default app;
