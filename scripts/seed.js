import { createProduto } from '../src/services/produtoService.js';
import { createCliente } from '../src/services/clienteService.js';
import { syncLocalReplicas } from '../src/db/proxy.js';
import dotenv from 'dotenv';

dotenv.config();

async function run() {
  console.log('\n==================================================');
  console.log('🌱 INICIANDO SEEDING DE DADOS INICIAIS');
  console.log('==================================================\n');

  try {
    const produtos = [
      { descricao: 'Notebook Dell Inspiron 15', categoria: 'Informática', valor: 3500.00, estoque: 15 },
      { descricao: 'Mouse sem Fio Logitech M280', categoria: 'Acessórios', valor: 89.90, estoque: 40 },
      { descricao: 'Monitor LG IPS 24 polegadas', categoria: 'Eletrônicos', valor: 849.00, estoque: 12 },
      { descricao: 'Teclado Multimídia Logitech', categoria: 'Acessórios', valor: 129.90, estoque: 25 }
    ];

    console.log('📦 Cadastrando produtos padrão...');
    for (const prod of produtos) {
      const p = await createProduto(prod);
      console.log(`   - [OK] Produto "${p.descricao}" cadastrado com ID: ${p.id}`);
    }

    const clientes = [
      { nome: 'João da Silva', email: 'joao.silva@fatec.edu.br' },
      { nome: 'Maria de Souza', email: 'maria.souza@fatec.edu.br' }
    ];

    console.log('\n👤 Cadastrando clientes padrão...');
    for (const cli of clientes) {
      const c = await createCliente(cli);
      console.log(`   - [OK] Cliente "${c.nome}" cadastrado com ID: ${c.id}`);
    }

    console.log('\n🔄 Sincronizando réplicas locais...');
    await syncLocalReplicas();

    console.log('\n🎉 Seed finalizado com sucesso!');
  } catch (error) {
    console.error('\n❌ Erro durante a execução do seed:', error.message);
  } finally {
    process.exit(0);
  }
}

run();
