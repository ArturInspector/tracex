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

const TagSummaryQuerySchema = z.object({
  facilitatorId: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  minCount: z.coerce.number().int().min(1).max(1000).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

const TAG_HEADER = 'x-tag-x';
const MAX_TAGS_PER_REQUEST = 10;
const MAX_TAG_LENGTH = 64;
const TAG_SANITIZE_REGEX = /[^a-zA-Z0-9_\-./\s]/g;

function extractTagsFromHeader(headerValue: string | string[] | undefined): string[] {
  if (!headerValue) {
    return [];
  }

  const rawValues = Array.isArray(headerValue) ? headerValue : [headerValue];

  const tags = rawValues
    .flatMap((value) => value.split(','))
    .map((tag) => tag.trim())
    .filter(Boolean)
    .map((tag) => tag.replace(TAG_SANITIZE_REGEX, '').trim())
    .filter(Boolean)
    .map((tag) => (tag.length > MAX_TAG_LENGTH ? tag.slice(0, MAX_TAG_LENGTH) : tag));

  const unique = Array.from(new Set(tags.map((tag) => tag.toLowerCase()))).map((normalized) => {
    return tags.find((tag) => tag.toLowerCase() === normalized) ?? normalized;
  });

  return unique.slice(0, MAX_TAGS_PER_REQUEST);
}

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
      const tagsFromHeader = extractTagsFromHeader(req.headers[TAG_HEADER]);

      // Сохраняем в БД
      await Promise.all(
        validatedTraces.map((trace) =>
          db.saveEncryptedTrace(
            trace.traceId,
            trace.facilitatorId || null,
            trace.encryptedData,
            trace.aesKeyEncrypted,
            trace.iv,
            tagsFromHeader
          )
        )
      );

      res.status(200).json({
        success: true,
        saved: validatedTraces.length,
        tagsApplied: tagsFromHeader,
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

  const getTagSummary = async (req: Request, res: Response): Promise<void> => {
    try {
      const parsed = TagSummaryQuerySchema.safeParse(req.query);

      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: parsed.error.issues,
        });
        return;
      }

      const { facilitatorId, limit = 25, minCount = 1, from, to } = parsed.data;

      const fromDate = from ? new Date(from) : undefined;
      const toDate = to ? new Date(to) : undefined;

      if ((fromDate && Number.isNaN(fromDate.getTime())) || (toDate && Number.isNaN(toDate.getTime()))) {
        res.status(400).json({
          success: false,
          error: 'Invalid date format. Use ISO 8601 strings.',
        });
        return;
      }

      const summary = await db.getTagSummary({
        facilitatorId,
        limit,
        minCount,
        from: fromDate,
        to: toDate,
      });

      res.status(200).json({
        success: true,
        data: summary,
        count: summary.length,
      });
    } catch (error) {
      console.error('Failed to build tag summary:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  };

  return {
    postTraces,
    getTraces,
    getTagSummary,
  };
}

