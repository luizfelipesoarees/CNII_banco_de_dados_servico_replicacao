import { createCliente, listClientes } from './services/clienteService.js';
import { createProduto, listProdutos } from './services/produtoService.js';
import { createPedido, getPedidoCompleto, getHistoricoCliente } from './services/pedidoService.js';
import { getRelatorioVendas } from './services/relatorioService.js';
import { syncLocalReplicas } from './db/proxy.js';
import dotenv from 'dotenv';

dotenv.config();

const NOMES = ['Luiz Felipe', 'Ana Silva', 'Fábio Souza', 'Carlos Eduardo', 'Mariana Costa', 'Juliana Mendes', 'Roberto Lima', 'Clara Nunes', 'Bruno Henrique', 'Beatriz Rocha'];
const PRODUTOS_INFO = [
  { descricao: 'Notebook Pro 15', categoria: 'Informática', valor: 4500.00 },
  { descricao: 'Mouse Gamer RGB', categoria: 'Acessórios', valor: 150.00 },
  { descricao: 'Teclado Mecânico ABNT2', categoria: 'Acessórios', valor: 320.50 },
  { descricao: 'Monitor UltraWide 29', categoria: 'Eletrônicos', valor: 1250.00 },
  { descricao: 'Headset Wireless 7.1', categoria: 'Eletrônicos', valor: 450.00 },
  { descricao: 'Cadeira Ergonômica', categoria: 'Escritório', valor: 980.00 },
  { descricao: 'SSD 1TB NVMe M.2', categoria: 'Informática', valor: 380.00 },
  { descricao: 'Suporte de Monitor Articulado', categoria: 'Acessórios', valor: 180.00 },
  { descricao: 'Webcam Full HD 1080p', categoria: 'Eletrônicos', valor: 250.00 },
  { descricao: 'Mesa Regulável Escrivaninha', categoria: 'Escritório', valor: 1400.00 }
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function obterClienteAleatorio() {
  const nome = NOMES[Math.floor(Math.random() * NOMES.length)];
  const hash = Math.floor(Math.random() * 100000);
  const email = `${nome.toLowerCase().replace(' ', '')}.${hash}@fatec.edu.br`;
  return { nome, email };
}

function obterProdutoAleatorio() {
  const prod = PRODUTOS_INFO[Math.floor(Math.random() * PRODUTOS_INFO.length)];
  const estoque = Math.floor(Math.random() * 30) + 10;
  const variacao = (Math.random() * 20 - 10);
  const valor = Math.max(10, prod.valor + variacao).toFixed(2);
  return { descricao: prod.descricao, categoria: prod.categoria, valor, estoque };
}

async function cicloSimulacao(cicloId) {
  console.log(`\n======================================================================`);
  console.log(`🌀 INICIANDO CICLO DE SIMULAÇÃO #${cicloId}`);
  console.log(`======================================================================`);

  try {
    console.log('\n--- [Fluxo 1] Cadastro de Clientes ---');
    const dadosCliente = obterClienteAleatorio();
    const clienteCriado = await createCliente(dadosCliente);
    console.log(`👤 Cliente Cadastrado:`);
    console.log(`   - ID Gerado: ${clienteCriado.id}`);
    console.log(`   - Nome: ${clienteCriado.nome}`);
    console.log(`   - E-mail: ${clienteCriado.email}`);

    console.log('\n--- [Fluxo 2] Cadastro de Produtos ---');
    const dadosProduto = obterProdutoAleatorio();
    const produtoCriado = await createProduto(dadosProduto);
    console.log(`📦 Produto Cadastrado:`);
    console.log(`   - ID Gerado: ${produtoCriado.id}`);
    console.log(`   - Descrição: ${produtoCriado.descricao}`);
    console.log(`   - Valor: R$ ${parseFloat(produtoCriado.valor).toFixed(2)}`);
    console.log(`   - Estoque Inicial: ${produtoCriado.estoque}`);

    console.log('\n--- [Fluxo 3] Criação de Pedido (Prisma Transaction) ---');
    
    const clientesExistentes = await listClientes();
    const produtosExistentes = await listProdutos();

    if (clientesExistentes.length === 0 || produtosExistentes.length === 0) {
      console.log('⚠️ Aguardando mais dados para criar pedidos...');
      return;
    }

    const clienteSelecionado = clientesExistentes[Math.floor(Math.random() * clientesExistentes.length)];
    
    const qtdProdutos = Math.floor(Math.random() * 3) + 1;
    const itensPedido = [];
    
    for (let i = 0; i < qtdProdutos; i++) {
      const prod = produtosExistentes[Math.floor(Math.random() * produtosExistentes.length)];
      if (itensPedido.some(item => item.produto_id === prod.id)) continue;
      
      itensPedido.push({
        produto_id: prod.id,
        quantidade: Math.floor(Math.random() * 2) + 1
      });
    }

    if (itensPedido.length === 0) {
      console.log('⚠️ Nenhum item válido selecionado, pulando criação do pedido.');
      return;
    }

    const pedidoCriado = await createPedido({
      cliente_id: clienteSelecionado.id,
      itens: itensPedido
    });

    console.log(`🛒 Pedido Efetuado com Sucesso:`);
    console.log(`   - ID do Pedido: ${pedidoCriado.id}`);
    console.log(`   - Cliente: ${clienteSelecionado.nome} (ID: ${clienteSelecionado.id})`);
    console.log(`   - Valor Total: R$ ${parseFloat(pedidoCriado.valor_total).toFixed(2)}`);
    console.log(`   - Quantidade de Itens: ${itensPedido.length}`);

    console.log('\n--- [Fluxo 4] Consultas em Réplicas ---');

    console.log('\n🔍 [4.1] Detalhes do Pedido Criado (JOIN - Réplica):');
    const pedidoCompleto = await getPedidoCompleto(pedidoCriado.id);
    if (pedidoCompleto) {
      console.log(`   - Pedido #${pedidoCompleto.id}`);
      console.log(`   - Cliente: ${pedidoCompleto.cliente.nome} (${pedidoCompleto.cliente.email})`);
      console.log(`   - Status: ${pedidoCompleto.status}`);
      console.log(`   - Valor Total: R$ ${parseFloat(pedidoCompleto.valor_total).toFixed(2)}`);
    }

    console.log('\n🔍 [4.2] Itens Individuais do Pedido (JOIN - Réplica):');
    if (pedidoCompleto && pedidoCompleto.itens) {
      pedidoCompleto.itens.forEach((item, index) => {
        console.log(`   👉 Item ${index + 1}: ${item.produto.descricao}`);
        console.log(`      Quantidade: ${item.quantidade}x | Unitário: R$ ${parseFloat(item.valor_unitario).toFixed(2)}`);
      });
    }

    console.log(`\n🔍 [4.3] Histórico de Pedidos de "${clienteSelecionado.nome}" (Réplica - Max 5):`);
    const historico = await getHistoricoCliente(clienteSelecionado.id);
    if (historico && historico.length > 0) {
      historico.forEach(p => {
        const data = new Date(p.criado_em).toLocaleTimeString('pt-BR');
        console.log(`   - Pedido #${p.id} - R$ ${parseFloat(p.valor_total).toFixed(2)} [Criado às ${data}]`);
      });
    } else {
      console.log('   (Nenhum histórico encontrado)');
    }

    console.log('\n📊 [4.4] Relatório Agregado Consolidado (Agregações - Réplica):');
    const relatorio = await getRelatorioVendas();
    console.log(`   - Quantidade total de pedidos: ${relatorio.quantidade_total_pedidos}`);
    console.log(`   - Valor total vendido: R$ ${relatorio.valor_total_vendido.toFixed(2)}`);
    console.log(`   - Valor médio dos pedidos: R$ ${relatorio.valor_medio_pedidos.toFixed(2)}`);

  } catch (error) {
    console.error('❌ Erro durante o ciclo de simulação:', error.message);
  }
}

async function start() {
  console.log('\n======================================================================');
  console.log('🚀 INICIANDO SIMULADOR DE CARGA DE REPLICAÇÃO BANCO DE DADOS');
  console.log(`👥 Grupo de Computação em Nuvem 2: "${process.env.GROUP_NAME || 'Grupo_Fabio'}"`);
  console.log('⏳ Pressione Ctrl+C para encerrar.');
  console.log('======================================================================\n');

  await syncLocalReplicas().catch(() => {});

  let cicloId = 1;
  while (true) {
    await cicloSimulacao(cicloId++);
    console.log('\n💤 Aguardando 3 segundos para o próximo ciclo...');
    await sleep(3000);
  }
}

start();
