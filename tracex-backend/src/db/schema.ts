/**
 * Database Schema для TraceX Backend
 * PostgreSQL + TimescaleDB для хранения зашифрованных traces
 */

export interface DatabaseConfig {
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  connectionString?: string;
  ssl?: boolean | { [key: string]: unknown };
  maxConnections?: number;
}

export const createSchemaSQL = `
-- Расширение TimescaleDB (опционально, если установлено)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'timescaledb') THEN
    CREATE EXTENSION IF NOT EXISTS timescaledb;
  END IF;
END $$;

-- Таблица для хранения публичных ключей facilitator'ов
CREATE TABLE IF NOT EXISTS facilitator_keys (
  facilitator_id VARCHAR(255) PRIMARY KEY,
  public_key TEXT NOT NULL,
  registered_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Таблица для хранения зашифрованных traces
CREATE TABLE IF NOT EXISTS encrypted_traces (
  id BIGSERIAL PRIMARY KEY,
  trace_id VARCHAR(255) NOT NULL,
  facilitator_id VARCHAR(255),
  encrypted_data TEXT NOT NULL,
  aes_key_encrypted TEXT NOT NULL,
  iv VARCHAR(255) NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_facilitator FOREIGN KEY (facilitator_id) REFERENCES facilitator_keys(facilitator_id) ON DELETE SET NULL
);

-- Обновляем схему, если таблица уже существует
ALTER TABLE encrypted_traces
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}'::TEXT[];

-- Преобразуем в hypertable для TimescaleDB (если установлено)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'timescaledb') THEN
    PERFORM create_hypertable('encrypted_traces', 'created_at', if_not_exists => TRUE);
  END IF;
END $$;

-- Таблица для публичных метрик
CREATE TABLE IF NOT EXISTS public_metrics (
  id BIGSERIAL PRIMARY KEY,
  facilitator_id VARCHAR(255) NOT NULL, -- анонимный ID
  success_rate DECIMAL(5,4) NOT NULL CHECK (success_rate >= 0 AND success_rate <= 1),
  avg_latency DECIMAL(10,2) NOT NULL,
  total_transactions INTEGER NOT NULL,
  period VARCHAR(10) NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(facilitator_id, period, timestamp)
);

-- Индексы для быстрых запросов
CREATE INDEX IF NOT EXISTS idx_encrypted_traces_facilitator ON encrypted_traces(facilitator_id);
CREATE INDEX IF NOT EXISTS idx_encrypted_traces_trace_id ON encrypted_traces(trace_id);
CREATE INDEX IF NOT EXISTS idx_encrypted_traces_created_at ON encrypted_traces(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_encrypted_traces_tags ON encrypted_traces USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_public_metrics_facilitator ON public_metrics(facilitator_id);
CREATE INDEX IF NOT EXISTS idx_public_metrics_period ON public_metrics(period, timestamp DESC);
`;

export interface EncryptedTraceRow {
  id: number;
  trace_id: string;
  facilitator_id: string | null;
  encrypted_data: string;
  aes_key_encrypted: string;
  iv: string;
  tags: string[];
  created_at: Date;
}

export interface FacilitatorKeyRow {
  facilitator_id: string;
  public_key: string;
  registered_at: Date;
  updated_at: Date;
}

export interface PublicMetricsRow {
  id: number;
  facilitator_id: string;
  success_rate: number;
  avg_latency: number;
  total_transactions: number;
  period: string;
  timestamp: Date;
}

