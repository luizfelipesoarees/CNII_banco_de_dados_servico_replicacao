import { execSync } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

const isSimulated = process.env.SIMULATE_REPLICATION === 'true';

let urls = [];
if (isSimulated) {
  urls = Object.keys(process.env)
    .filter(key => key.startsWith('DATABASE_WRITE_') || key.startsWith('DATABASE_READ_'))
    .map(key => process.env[key])
    .filter(url => url && url.trim() !== '');
  console.log('🔄 [SIMULAÇÃO] Sincronizando schema do Prisma com todos os bancos (Primary e Replicas)...');
} else {
  if (process.env.DATABASE_WRITE_URL) {
    urls.push(process.env.DATABASE_WRITE_URL);
  }
  console.log('🔄 [CLOUD] Sincronizando schema do Prisma APENAS com o banco Primary...');
}

for (const url of urls) {
  if (url) {
    console.log(`\n▶ Pushing para: ${url}`);
    try {
      execSync('npx prisma db push', { 
        env: { ...process.env, DATABASE_WRITE_URL: url }, 
        stdio: 'inherit' 
      });
    } catch (error) {
      console.error(`❌ Erro ao enviar schema para ${url}`);
    }
  }
}
console.log('\n✅ Sincronização de schemas concluída!');
