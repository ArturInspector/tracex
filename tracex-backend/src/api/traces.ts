/**
 * API Routes для работы с traces
 */

import type { Request, Response } from 'express';
import type { DatabaseClient } from '../db/client.js';
import type { EncryptedTrace } from '../types.js';
import { z } from 'zod';

const EncryptedTraceSchema = z.object({
  traceId: z.string(),
  facilitatorId: z.string().optional(),
  encryptedData: z.string(),
  aesKeyEncrypted: z.string(),
  iv: z.string(),
  timestamp: z.number(),
});

export function createTracesRoutes(db: DatabaseClient) {
  /**
   * POST /api/traces - Прием зашифрованных traces (batch)
   */
  const postTraces = async (req: Request, res: Response): Promise<void> => {
    try {
      // Поддерживаем как одиночный trace, так и массив
      const body = req.body;
      const traces: EncryptedTrace[] = Array.isArray(body) ? body : [body];

      // Валидация
      const validatedTraces = traces.map((trace) => EncryptedTraceSchema.parse(trace));

      // Сохраняем в БД
      for (const trace of validatedTraces) {
        await db.saveEncryptedTrace(
          trace.traceId,
          trace.facilitatorId || null,
          trace.encryptedData,
          trace.aesKeyEncrypted,
          trace.iv
        );
      }

      res.status(200).json({
        success: true,
        saved: validatedTraces.length,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Invalid trace data',
          details: error.errors,
        });
        return;
      }

      console.error('Failed to save traces:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  };

  /**
   * GET /api/traces - Получение зашифрованных traces пользователя
   */
  const getTraces = async (req: Request, res: Response): Promise<void> => {
    try {
      const facilitatorId = req.query.facilitatorId as string | undefined;
      const limit = parseInt((req.query.limit as string) || '100', 10);
      const offset = parseInt((req.query.offset as string) || '0', 10);

      if (!facilitatorId) {
        res.status(400).json({
          success: false,
          error: 'facilitatorId query parameter is required',
        });
        return;
      }

      const traces = await db.getEncryptedTraces(facilitatorId, limit, offset);

      res.status(200).json({
        success: true,
        data: traces,
        count: traces.length,
      });
    } catch (error) {
      console.error('Failed to get traces:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  };

  return {
    postTraces,
    getTraces,
  };
}

