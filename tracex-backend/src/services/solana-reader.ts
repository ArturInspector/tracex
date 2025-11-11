import {
  Commitment,
  Connection,
  PublicKey,
  RpcResponseAndContext,
  SignatureStatus,
} from '@solana/web3.js';
import { TtlCache } from './ttl-cache.js';
import type { OnchainSignatureStatus, OnchainWalletState } from '../types.js';

export type OnchainErrorCode =
  | 'INVALID_PUBLIC_KEY'
  | 'RPC_ERROR'
  | 'SIGNATURE_NOT_FOUND';

export class OnchainError extends Error {
  constructor(
    message: string,
    public readonly code: OnchainErrorCode,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'OnchainError';
  }
}

interface SolanaReaderConfig {
  endpoints: string[];
  commitment?: Commitment;
  walletCacheTtlMs?: number;
  signatureCacheTtlMs?: number;
  maxCacheEntries?: number;
}

export class SolanaReader {
  private readonly connections: Connection[];
  private readonly commitment: Commitment;
  private readonly walletCache: TtlCache<string, OnchainWalletState>;
  private readonly signatureCache: TtlCache<string, OnchainSignatureStatus>;
  private nextConnectionIndex = 0;

  constructor(config: SolanaReaderConfig) {
    if (!config.endpoints.length) {
      throw new Error('SolanaReader: no RPC endpoints provided');
    }

    this.commitment = config.commitment ?? 'confirmed';
    this.connections = config.endpoints.map(
      (endpoint) => new Connection(endpoint, this.commitment),
    );

    const cacheEntries = config.maxCacheEntries ?? 512;
    this.walletCache = new TtlCache<string, OnchainWalletState>(
      config.walletCacheTtlMs ?? 5_000,
      cacheEntries,
    );
    this.signatureCache = new TtlCache<string, OnchainSignatureStatus>(
      config.signatureCacheTtlMs ?? 5_000,
      cacheEntries * 4,
    );
  }

  async getWalletState(address: string): Promise<OnchainWalletState> {
    const cached = this.walletCache.get(address);
    if (cached) {
      return cached;
    }

    let publicKey: PublicKey;
    try {
      publicKey = new PublicKey(address);
    } catch (error) {
      throw new OnchainError('Invalid wallet address', 'INVALID_PUBLIC_KEY', error);
    }

    const result = await this.withConnection(async (connection) => {
      const [balance, epochInfo] = await Promise.all([
        connection.getBalance(publicKey, this.commitment),
        connection.getEpochInfo(this.commitment),
      ]);

      return {
        address,
        lamports: balance,
        sol: balance / 1_000_000_000,
        slot: epochInfo.absoluteSlot,
        epoch: epochInfo.epoch,
        timestamp: new Date().toISOString(),
      } satisfies OnchainWalletState;
    });

    this.walletCache.set(address, result);
    return result;
  }

  async getSignatureStatus(signature: string): Promise<OnchainSignatureStatus> {
    const cached = this.signatureCache.get(signature);
    if (cached) {
      return cached;
    }

    const status = await this.withConnection(async (connection) => {
      const response: RpcResponseAndContext<(SignatureStatus | null)[]> =
        await connection.getSignatureStatuses([signature], {
          searchTransactionHistory: true,
        });

      const value = response.value[0];
      return this.mapSignatureStatus(signature, value);
    });

    this.signatureCache.set(signature, status);
    return status;
  }

  async getSignatureStatuses(signatures: string[]): Promise<OnchainSignatureStatus[]> {
    const uncached: string[] = [];
    const results: OnchainSignatureStatus[] = [];

    for (const signature of signatures) {
      const cached = this.signatureCache.get(signature);
      if (cached) {
        results.push(cached);
      } else {
        uncached.push(signature);
      }
    }

    if (uncached.length > 0) {
      const fetched = await this.withConnection(async (connection) => {
        const response = await connection.getSignatureStatuses(uncached, {
          searchTransactionHistory: true,
        });

        return response.value.map((value, index) => {
          const signature = uncached[index]!;
          return this.mapSignatureStatus(signature, value);
        });
      });

      for (const status of fetched) {
        this.signatureCache.set(status.signature, status);
        results.push(status);
      }
    }

    return results.sort((a, b) => a.signature.localeCompare(b.signature));
  }

  private mapSignatureStatus(
    signature: string,
    value: SignatureStatus | null,
  ): OnchainSignatureStatus {
    if (!value) {
      return {
        signature,
        status: 'not_found',
        slot: null,
        confirmations: null,
        err: null,
        timestamp: new Date().toISOString(),
      };
    }

    const confirmationStatus = value.confirmationStatus ?? 'processed';
    return {
      signature,
      status: confirmationStatus,
      slot: value.slot ?? null,
      confirmations: value.confirmations ?? null,
      err: value.err ? JSON.stringify(value.err) : null,
      timestamp: new Date().toISOString(),
    };
  }

  private async withConnection<T>(fn: (connection: Connection) => Promise<T>): Promise<T> {
    const attempts = this.connections.length;
    let lastError: unknown;

    for (let offset = 0; offset < attempts; offset += 1) {
      const index = (this.nextConnectionIndex + offset) % this.connections.length;
      const connection = this.connections[index]!;

      try {
        const result = await fn(connection);
        this.nextConnectionIndex = (index + 1) % this.connections.length;
        return result;
      } catch (error) {
        lastError = error;
        console.error(
          '[SolanaReader] RPC call failed',
          connection.rpcEndpoint,
          error,
        );
      }
    }

    throw new OnchainError('All RPC endpoints failed', 'RPC_ERROR', lastError);
  }
}

