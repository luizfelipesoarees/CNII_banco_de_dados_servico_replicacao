import { Router } from 'express';
import prisma from '../db/proxy.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    await prisma.$primary.$queryRaw`SELECT 1`;

    const replicaChecks = [];
    for (const replica of prisma.$replicas) {
      try {
        await replica.client.$queryRaw`SELECT 1`;
        replicaChecks.push({ name: replica.name, status: 'ONLINE' });
      } catch (error) {
        replicaChecks.push({ name: replica.name, status: 'OFFLINE', error: error.message });
      }
    }

    res.json({
      status: 'UP',
      timestamp: new Date(),
      database_write: 'ONLINE',
      database_reads: replicaChecks
    });
  } catch (error) {
    res.status(500).json({
      status: 'DOWN',
      error: error.message
    });
  }
});

export default router;
