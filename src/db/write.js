import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_WRITE_URL) {
  console.error('ERRO: DATABASE_WRITE_URL não está configurada no arquivo .env');
  process.exit(1);
}

export const prismaWrite = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_WRITE_URL,
    },
  },
});

console.log('✅ Cliente [WRITE] conectado com sucesso ao Primary.');
