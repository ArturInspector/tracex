/**
 * API Routes для работы с публичными метриками
 */

import type { Request, Response } from 'express';
import type { DatabaseClient } from '../db/client.js';
import { z } from 'zod';

const PublishMetricsSchema = z.object({
  facilitatorId: z.string().min(1),
  successRate: z.number().min(0).max(1),
  avgLatency: z.number().min(0),
  totalTransactions: z.number().int().min(0),
  period: z.string().default('24h'),
  timestamp: z.number().optional(),
});

export function createMetricsRoutes(db: DatabaseClient) {
  /**
   * GET /api/metrics/public - Получение публичных метрик для сравнения
   */
  const getPublicMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const period = (req.query.period as string) || '24h';
      const limit = parseInt((req.query.limit as string) || '100', 10);

      const metrics = await db.getPublicMetrics(period, limit);

      res.status(200).json({
        success: true,
        data: metrics,
        period,
        count: metrics.length,
      });
    } catch (error) {
      console.error('Failed to get public metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  };

  /**
   * POST /api/metrics/publish - Публикация анонимных метрик (опционально)
   */
  const publishMetrics = async (req: Request, res: Response): Promise<void> => {
    try {
      const body = PublishMetricsSchema.parse(req.body);

      await db.savePublicMetrics(
        body.facilitatorId,
        body.successRate,
        body.avgLatency,
        body.totalTransactions,
        body.period
      );

      res.status(200).json({
        success: true,
        message: 'Metrics published successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Invalid metrics data',
          details: error.errors,
        });
        return;
      }

      console.error('Failed to publish metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  };

  return {
    getPublicMetrics,
    publishMetrics,
  };
}

