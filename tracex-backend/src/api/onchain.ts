import type { Request, Response } from 'express';
import { z } from 'zod';
import { SolanaReader, OnchainError } from '../services/solana-reader.js';

const walletQuerySchema = z.object({
  address: z
    .string({
      required_error: 'address is required',
      invalid_type_error: 'address must be a string',
    })
    .min(32, 'address is too short')
    .max(64, 'address is too long')
    .trim(),
});

const signaturesBodySchema = z.object({
  signatures: z
    .array(
      z
        .string({
          invalid_type_error: 'signature must be a string',
        })
        .min(32, 'signature is too short')
        .max(128, 'signature is too long')
        .trim(),
    )
    .min(1, 'at least one signature is required')
    .max(64, 'signature batch limit exceeded'),
});

export function createOnchainRoutes(reader: SolanaReader) {
  return {
    getWalletState: async (req: Request, res: Response) => {
      const parseResult = walletQuerySchema.safeParse(req.query);
      if (!parseResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid query parameters',
          details: parseResult.error.format(),
        });
      }

      const { address } = parseResult.data;

      try {
        const data = await reader.getWalletState(address);
        return res.json({
          success: true,
          data,
        });
      } catch (error) {
        if (error instanceof OnchainError) {
          if (error.code === 'INVALID_PUBLIC_KEY') {
            return res.status(400).json({
              success: false,
              error: 'Invalid wallet address',
            });
          }

          return res.status(502).json({
            success: false,
            error: 'Failed to fetch wallet state',
          });
        }

        console.error('[OnchainRoutes] Unexpected error in getWalletState', error);
        return res.status(500).json({
          success: false,
          error: 'Internal server error',
        });
      }
    },

    postSignatureStatuses: async (req: Request, res: Response) => {
      const parseResult = signaturesBodySchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request body',
          details: parseResult.error.format(),
        });
      }

      const { signatures } = parseResult.data;

      try {
        const data = await reader.getSignatureStatuses(signatures);
        return res.json({
          success: true,
          data,
        });
      } catch (error) {
        if (error instanceof OnchainError) {
          return res.status(502).json({
            success: false,
            error: 'Failed to fetch signature statuses',
          });
        }

        console.error(
          '[OnchainRoutes] Unexpected error in postSignatureStatuses',
          error,
        );
        return res.status(500).json({
          success: false,
          error: 'Internal server error',
        });
      }
    },
  };
}

