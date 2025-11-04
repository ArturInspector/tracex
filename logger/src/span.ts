/**
 * Span - отслеживание времени выполнения операции
 * Обеспечивает автоматическое завершение и запись результата
 */

import type { SpanData, SpanStatus, ErrorData } from './types.js';

let performanceApi: { now: () => number };
if (typeof performance !== 'undefined') {
  performanceApi = performance;
} else {
  // Fallback для старых версий Node.js
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { performance } = require('perf_hooks');
    performanceApi = performance;
  } catch {
    // Fallback на Date.now() если perf_hooks недоступен
    performanceApi = {
      now: () => Date.now(),
    };
  }
}

export type SpanCompleteCallback = (spanData: SpanData) => void;
export class Span {
  private readonly name: string;
  private readonly startTime: number;
  private readonly onComplete: SpanCompleteCallback;
  private endTime: number | null = null;
  private status: SpanStatus = 'success';
  private error: ErrorData | undefined;
  private attributes: Record<string, unknown> = {};

  constructor(
    name: string,
    _traceId: string,
    onComplete: SpanCompleteCallback
  ) {
    this.name = name;
    this.startTime = this.getHighResolutionTime();
    this.onComplete = onComplete;
  }

  private getHighResolutionTime(): number {
    return Math.floor(performanceApi.now() * 1e6);
  }

  end(status: SpanStatus = 'success', error?: ErrorData): void {
    if (this.endTime !== null) {
      return;
    }

    this.endTime = this.getHighResolutionTime();
    this.status = status;
    this.error = error;

    const duration = this.endTime - this.startTime;

    const spanData: SpanData = {
      name: this.name,
      startTime: this.startTime,
      endTime: this.endTime,
      duration,
      status: this.status,
      error: this.error,
      attributes: Object.keys(this.attributes).length > 0 ? this.attributes : undefined,
    };
    this.onComplete(spanData);
  }
  success(): void {
    this.end('success');
  }

  fail(error: ErrorData | Error): void {
    const errorData: ErrorData =
      error instanceof Error
        ? {
            message: error.message,
            code: (error as Error & { code?: string }).code,
            stack: error.stack,
          }
        : error;

    this.end('error', errorData);
  }


  addAttribute(key: string, value: unknown): void {
    if (this.endTime !== null) {
      // нет атрибутам после завершения span
      return;
    }
    this.attributes[key] = value;
  }
  async wrap<T>(fn: () => Promise<T>): Promise<T> {
    try {
      const result = await fn();
      this.success();
      return result;
    } catch (error) {
      this.fail(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  getName(): string {
    return this.name;
  }

  isEnded(): boolean {
    return this.endTime !== null;
  }
}

