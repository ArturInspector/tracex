export type SpanStatus = 'success' | 'error';

export interface ErrorData {
  message: string;
  code?: string;
  stack?: string;
  [key: string]: unknown;
}

export interface TraceMetadata {
  agentId?: string;
  facilitator?: string;
  cost?: number;
  rpc?: string;
  [key: string]: unknown;
}

export interface SpanData {
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  status: SpanStatus;
  error?: ErrorData;
  attributes?: Record<string, unknown>;
}

export interface Trace {
  traceId: string;
  spans: SpanData[];
  metadata: TraceMetadata;
}

export interface TraceConfig {
  apiUrl?: string;
  apiKey?: string;
  bufferSize?: number;
  batchSize?: number;
  flushIntervalMs?: number;
  autoFlush?: boolean;
  metadata?: TraceMetadata;
}
