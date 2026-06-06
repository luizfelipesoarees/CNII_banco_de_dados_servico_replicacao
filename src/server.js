import express from 'express';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

import healthRouter from './routes/health.js';
import clientesRouter from './routes/clientes.js';
import produtosRouter from './routes/produtos.js';
import pedidosRouter from './routes/pedidos.js';
import relatoriosRouter from './routes/relatorios.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API - Serviços de Banco de Dados',
      version: '1.0.0',
      description: 'Rotas da aplicação expostas via Swagger',
    },
    components: {
      parameters: {
        pageParam: { in: 'query', name: 'page', schema: { type: 'integer', default: 1 }, description: 'Número da página' },
        sizeParam: { in: 'query', name: 'size', schema: { type: 'integer', default: 10 }, description: 'Tamanho da página' },
        orderByParam: { in: 'query', name: 'orderBy', schema: { type: 'string', example: 'criado_em,desc' }, description: 'Ordenação' },
        filtrarGrupoParam: { in: 'query', name: 'filtrarGrupo', schema: { type: 'boolean' }, description: 'Filtrar pelo grupo atual' }
      }
    }
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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
