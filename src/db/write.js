import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const writeUrls = Object.keys(process.env)
  .filter(key => key.startsWith('DATABASE_WRITE_') && process.env[key])
  .map(key => {
    let name = key.replace('DATABASE_WRITE_', 'PRIMARY_');
    if (name.endsWith('_URL')) name = name.substring(0, name.length - 4);
    if (name === 'PRIMARY') name = 'PRIMARY_DEFAULT';
    return { name, url: process.env[key] };
  });

export const prismaWrites = [];

if (writeUrls.length === 0) {
  console.error('ERRO: Nenhuma URL de escrita (DATABASE_WRITE_...) configurada no arquivo .env');
  process.exit(1);
} else {
  writeUrls.forEach(db => {
    const client = new PrismaClient({
      datasources: {
        db: {
          url: db.url
        }
      }
    });
    prismaWrites.push({
      name: db.name,
      client
    });
    console.log(`✅ Cliente [WRITE] conectado com sucesso a ${db.name}.`);
  });
}
