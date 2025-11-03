import type { SpanData } from './types.js';
export class CircularBuffer {
  private readonly buffer: (SpanData | null)[];
  private readonly capacity: number;
  private writeIndex = 0;
  private readIndex = 0;
  private count = 0;
  // 1000 - in 1 batch capacity, prod - other number.
  constructor(capacity: number = 1000) {
    this.capacity = capacity;
    this.buffer = new Array(capacity).fill(null);
  }

  push(span: SpanData): boolean {
    const willOverwrite = this.isFull();
    this.buffer[this.writeIndex] = span;

    this.writeIndex = (this.writeIndex + 1) % this.capacity;

    if (!willOverwrite) {
      this.count++;
    } else {
      this.readIndex = (this.readIndex + 1) % this.capacity;
    }

    return !willOverwrite;
  }

  drain(): SpanData[] {
    if (this.isEmpty()) {
      return [];
    }

    const spans: SpanData[] = [];
    while (this.count > 0) {
      const span = this.buffer[this.readIndex];
      if (span !== null) {
        spans.push(span);
      }
      this.buffer[this.readIndex] = null; // Очищаем ссылку
      this.readIndex = (this.readIndex + 1) % this.capacity;
      this.count--;
    }

    return spans;
  }

  isEmpty(): boolean {
    return this.count === 0;
  }

  isFull(): boolean {
    return this.count >= this.capacity;
  }
  size(): number {
    return this.count;
  }

  clear(): void {
    for (let i = 0; i < this.capacity; i++) {
      this.buffer[i] = null;
    }
    this.writeIndex = 0;
    this.readIndex = 0;
    this.count = 0;
  }
}

