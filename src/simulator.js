import { createCliente, listClientes, updateCliente } from './services/clienteService.js';
import { createProduto, listProdutos, updateProduto } from './services/produtoService.js';
import { createPedido, getPedidoCompleto, getItensPedido, getHistoricoCliente } from './services/pedidoService.js';
import { getRelatorioVendas } from './services/relatorioService.js';
import dotenv from 'dotenv';

dotenv.config();

const PRODUTO_BASES = ['Notebook', 'Mouse', 'Teclado', 'Monitor'];
const STATUS_PEDIDO = [
  'CANCELADO',
  'A_ENVIAR',
  'ARG_PAGAMENTO',
  'PROCESSANDO',
  'APROVADO',
  'ENVIADO',
  'FINALIZADO'
];

let clienteCounter = 1;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function cicloSimulacao(cicloId) {
  try {
    // 1. Cadastrar Cliente
    const numCliente = clienteCounter++;
    const emailCliente = `cliente${numCliente}_${Date.now()}@teste.com`;

    const idFormatado = cicloId.toString().padStart(2, '0');
    
    // Cria já com o nome baseado no ciclo
    const cliente = await createCliente({ 
      nome: `Cliente ${idFormatado}`, 
      email: emailCliente 
    });

    console.log(`[CLIENTE] ID: ${cliente.id} | Nome: ${cliente.nome} | Email: ${cliente.email}`);

    // 2. Cadastrar Produto
    const baseProd = PRODUTO_BASES[Math.floor(Math.random() * PRODUTO_BASES.length)];
    const valorProduto = (Math.random() * 900 + 100).toFixed(2);
    const estoqueProduto = Math.floor(Math.random() * 50) + 1;

    const descProdutoFinal = `${baseProd} ${idFormatado}`;

    // Cria o produto já com o nome baseado no ciclo
    const produto = await createProduto({
      descricao: descProdutoFinal,
      categoria: 'Geral',
      valor: valorProduto,
      estoque: estoqueProduto
    });

    console.log(`[PRODUTO] ID: ${produto.id} | Descrição: ${produto.descricao} | Valor: R$ ${produto.valor} | Estoque: ${produto.estoque}`);

    // 3. Criar Pedido
    const clientesRes = await listClientes({ size: 9999 });
    const produtosRes = await listProdutos({ size: 9999 });

    const clientesExistentes = clientesRes.data || [];
    const produtosExistentes = produtosRes.data || [];

    // Filtra produtos que realmente tem estoque disponível
    const produtosDisponiveis = produtosExistentes.filter(p => p.estoque > 0);

    if (clientesExistentes.length > 0 && produtosDisponiveis.length > 0) {
      const clienteSelecionado = clientesExistentes[Math.floor(Math.random() * clientesExistentes.length)];

      // Quantidade de itens diferentes no pedido (limita ao total de produtos disponíveis)
      const qtdItensDiferentes = Math.min(Math.floor(Math.random() * 3) + 1, produtosDisponiveis.length);
      const itensPedido = [];

      for (let i = 0; i < qtdItensDiferentes; i++) {
        const prodExistente = produtosDisponiveis[Math.floor(Math.random() * produtosDisponiveis.length)];

        if (!itensPedido.some(item => item.produto_id === prodExistente.id)) {
          const maxQtd = Math.min(3, prodExistente.estoque);
          const quantidadePedida = Math.floor(Math.random() * maxQtd) + 1;

          itensPedido.push({
            produto_id: prodExistente.id,
            quantidade: quantidadePedida
          });
        }
      }

      if (itensPedido.length > 0) {
        const statusAleatorio = STATUS_PEDIDO[Math.floor(Math.random() * STATUS_PEDIDO.length)];
        
        const pedidoCriado = await createPedido({
          cliente_id: clienteSelecionado.id,
          itens: itensPedido,
          status: statusAleatorio
        });

        console.log(`[PEDIDO] ID: ${pedidoCriado.id} | Cliente ID: ${clienteSelecionado.id} (${clienteSelecionado.nome}) | Valor Total: R$ ${pedidoCriado.valor_total} | Status: ${statusAleatorio}`);

        console.log(`\n--- 4. Consultas na réplica (READ) ---`);

        // 4.1 Buscar pedido por ID
        const pedidoCompleto = await getPedidoCompleto(pedidoCriado.id);
        if (pedidoCompleto) {
          console.log(`\n4.1 — Buscar pedido por ID`);
          console.log(`Pedido ${pedidoCompleto.id}`);
          console.log(`Cliente: ${pedidoCompleto.cliente.nome}`);
          console.log(`Valor total: ${pedidoCompleto.valor_total}`);
          console.log(`Status: ${pedidoCompleto.status}`);
        }

        // 4.2 Buscar itens do pedido
        const itensDoPedido = await getItensPedido(pedidoCriado.id);
        console.log(`\n4.2 — Buscar itens do pedido`);
        for (const item of itensDoPedido) {
          console.log(`PedidoItem ${item.id}`);
          console.log(`Produto: ${item.produto.descricao}`);
          console.log(`Quantidade: ${item.quantidade}`);
          console.log(`------------------------------------`)
        }

        // 4.3 Histórico do cliente
        const historico = await getHistoricoCliente(clienteSelecionado.id);
        console.log(`\n4.3 — Histórico do cliente`);
        for (const hist of historico) {
          console.log(`Pedido ${hist.id} - R$ ${hist.valor_total}`);
        }

        // 4.4 Relatório agregado
        const relatorio = await getRelatorioVendas();
        console.log(`\n4.4 — Relatório agregado`);
        console.log(`Quantidade total de pedidos: ${relatorio.quantidade_total_pedidos}`);
        console.log(`Valor médio dos pedidos: ${relatorio.valor_medio_pedidos.toFixed(2)}`);
        console.log(`Valor total vendido: ${relatorio.valor_total_vendido.toFixed(2)}\n`);
      }
    }
  } catch (error) {
    console.error(`❌ Erro no ciclo ${cicloId}:`, error.message);
  }
}

async function start() {
  console.log('====================================================');
  console.log('🚀 INICIANDO SCRIPT DE INSERÇÃO CONTÍNUA');
  console.log('====================================================\n');

  let ciclo = 1;
  while (true) {
    console.log(`\n--- CICLO ${ciclo} ---`);
    await cicloSimulacao(ciclo);
    ciclo++;
    await sleep(5000); 
  }
}

start();
