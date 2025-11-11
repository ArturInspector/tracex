/**
 * API Routes для работы с ключами
 */

import type { Request, Response } from 'express';
import type { DatabaseClient } from '../db/client.js';
import { z } from 'zod';

const RegisterKeySchema = z.object({
  facilitatorId: z.string().min(1),
  publicKey: z.string().min(1),
});

export function createKeysRoutes(db: DatabaseClient) {
  /**
   * POST /api/keys/register - Регистрация публичного ключа facilitator'а
   */
  const registerKey = async (req: Request, res: Response): Promise<void> => {
    try {
      const apiKey = req.headers['x-api-key'] as string;
      const expectedKey = process.env.REGISTRATION_API_KEY;
      
      if (!apiKey || apiKey !== expectedKey) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized: Invalid or missing API key',
        });
        return;
      }

      const body = RegisterKeySchema.parse(req.body);

      const existingKey = await db.getFacilitatorPublicKey(body.facilitatorId);
      if (existingKey) {
        res.status(409).json({
          success: false,
          error: 'Facilitator ID already registered. Use a different ID or update endpoint.',
        });
        return;
      }

      await db.registerFacilitatorKey(body.facilitatorId, body.publicKey);

      res.status(200).json({
        success: true,
        message: 'Public key registered successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: error.errors,
        });
        return;
      }

      console.error('Failed to register key:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  };

  return {
    registerKey,
  };
}

