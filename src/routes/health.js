import { Router } from 'express';
import prisma from '../db/proxy.js';

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     responses:
 *       200:
 *         description: Sucesso
 */
router.get('/', async (req, res) => {
  try {
    const primaryChecks = [];
    for (const primary of prisma.$primaries) {
      try {
        await primary.client.$queryRaw`SELECT 1`;
        primaryChecks.push({ name: primary.name, status: 'ONLINE' });
      } catch (error) {
        primaryChecks.push({ name: primary.name, status: 'OFFLINE', error: error.message });
      }
    }

    const replicaChecks = [];
    for (const replica of prisma.$replicas) {
      try {
        await replica.client.$queryRaw`SELECT 1`;
        replicaChecks.push({ name: replica.name, status: 'ONLINE' });
      } catch (error) {
        replicaChecks.push({ name: replica.name, status: 'OFFLINE', error: error.message });
      }
    }

    const allPrimariesOffline = primaryChecks.every(p => p.status === 'OFFLINE');
    const allReplicasOffline = replicaChecks.every(r => r.status === 'OFFLINE');

    res.status(allPrimariesOffline && allReplicasOffline ? 500 : 200).json({
      status: allPrimariesOffline && allReplicasOffline ? 'DOWN' : 'UP',
      timestamp: new Date(),
      database_writes: primaryChecks,
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
