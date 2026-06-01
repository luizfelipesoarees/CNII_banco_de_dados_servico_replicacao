import { execSync } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

const targets = [
  { name: 'PRIMARY (Write)', url: process.env.DATABASE_WRITE_URL },
  { name: 'REPLICA 1 (Read 1)', url: process.env.DATABASE_READ_1_URL },
  { name: 'REPLICA 2 (Read 2)', url: process.env.DATABASE_READ_2_URL }
];

console.log('\n==================================================');
console.log('🔄 INICIANDO CRIAÇÃO DE TABELAS NOS BANCOS');
console.log('==================================================\n');

for (const target of targets) {
  if (!target.url) {
    console.log(`⚠️ ${target.name} não configurado no .env, pulando...`);
    continue;
  }

  console.log(`⚙️ Enviando schema para ${target.name}...`);
  try {
    execSync('npx prisma db push --skip-generate', {
      env: {
        ...process.env,
        DATABASE_WRITE_URL: target.url
      },
      stdio: 'inherit'
    });
    console.log(`✅ Schema criado com sucesso no ${target.name}!\n`);
  } catch (error) {
    console.error(`❌ Falha ao enviar schema para ${target.name}:`, error.message);
    process.exit(1);
  }
}

console.log('🎉 Sincronização de tabelas concluída em todas as instâncias!');
