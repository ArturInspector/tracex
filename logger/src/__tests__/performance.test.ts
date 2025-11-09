/**
 * Performance Tests for TraceX Logger
 * 
 * Цель: Проверить, что overhead логирования действительно < 1ms на span
 * 
 * Критерии успеха:
 * - span.start() < 0.1ms
 * - span.end() < 0.1ms
 * - buffer.push() < 0.05ms
 * - Общий overhead < 1ms per span
 */

import { X402Tracer } from '../tracer.js';
import { Span } from '../span.js';
import { CircularBuffer } from '../buffer.js';
import type { SpanData } from '../types.js';

// Утилита для измерения времени с высокой точностью
function measureTime(fn: () => void): number {
  const start = performance.now();
  fn();
  const end = performance.now();
  return end - start;
}

// Утилита для измерения асинхронного времени
async function measureTimeAsync(fn: () => Promise<void>): Promise<number> {
  const start = performance.now();
  await fn();
  const end = performance.now();
  return end - start;
}

describe('Performance Tests - TraceX Logger', () => {
  describe('Span Creation Performance', () => {
    test('span.start() должен быть < 0.1ms', () => {
      const tracer = new X402Tracer();
      
      const times: number[] = [];
      const iterations = 10000;
      
      for (let i = 0; i < iterations; i++) {
        const time = measureTime(() => {
          tracer.startSpan(`span_${i}`);
        });
        times.push(time);
      }
      
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);
      const p99Time = times.sort((a, b) => a - b)[Math.floor(times.length * 0.99)];
      
      console.log(`\n📊 Span Creation Performance:`);
      console.log(`  Average: ${avgTime.toFixed(4)}ms`);
      console.log(`  Max: ${maxTime.toFixed(4)}ms`);
      console.log(`  P99: ${p99Time.toFixed(4)}ms`);
      
      expect(avgTime).toBeLessThan(0.1);
      expect(maxTime).toBeLessThan(1.0); // Максимум не должен превышать 1ms
    });

    test('span.end() должен быть < 0.1ms', () => {
      const tracer = new X402Tracer();
      
      const times: number[] = [];
      const iterations = 10000;
      
      for (let i = 0; i < iterations; i++) {
        const span = tracer.startSpan(`span_${i}`);
        const time = measureTime(() => {
          span.success();
        });
        times.push(time);
      }
      
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);
      const p99Time = times.sort((a, b) => a - b)[Math.floor(times.length * 0.99)];
      
      console.log(`\n📊 Span End Performance:`);
      console.log(`  Average: ${avgTime.toFixed(4)}ms`);
      console.log(`  Max: ${maxTime.toFixed(4)}ms`);
      console.log(`  P99: ${p99Time.toFixed(4)}ms`);
      
      expect(avgTime).toBeLessThan(0.1);
      expect(maxTime).toBeLessThan(1.0);
    });
  });

  describe('Buffer Performance', () => {
    test('buffer.push() должен быть < 0.05ms', () => {
      const buffer = new CircularBuffer(10000);
      
      const spanData: SpanData = {
        name: 'test_span',
        startTime: performance.now() * 1e6,
        endTime: performance.now() * 1e6 + 1000000,
        duration: 1000000,
        status: 'success',
      };
      
      const times: number[] = [];
      const iterations = 100000;
      
      for (let i = 0; i < iterations; i++) {
        const time = measureTime(() => {
          buffer.push(spanData);
        });
        times.push(time);
      }
      
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);
      const p99Time = times.sort((a, b) => a - b)[Math.floor(times.length * 0.99)];
      
      console.log(`\n📊 Buffer Push Performance:`);
      console.log(`  Average: ${avgTime.toFixed(4)}ms`);
      console.log(`  Max: ${maxTime.toFixed(4)}ms`);
      console.log(`  P99: ${p99Time.toFixed(4)}ms`);
      
      expect(avgTime).toBeLessThan(0.05);
      expect(maxTime).toBeLessThan(0.5);
    });

    test('buffer.drain() должен быть эффективным для больших буферов', () => {
      const buffer = new CircularBuffer(10000);
      
      const spanData: SpanData = {
        name: 'test_span',
        startTime: performance.now() * 1e6,
        endTime: performance.now() * 1e6 + 1000000,
        duration: 1000000,
        status: 'success',
      };
      
      // Заполняем буфер
      for (let i = 0; i < 10000; i++) {
        buffer.push(spanData);
      }
      
      const time = measureTime(() => {
        const spans = buffer.drain();
        expect(spans.length).toBe(10000);
      });
      
      console.log(`\n📊 Buffer Drain Performance (10000 spans):`);
      console.log(`  Time: ${time.toFixed(4)}ms`);
      
      // Drain должен быть быстрым даже для больших буферов
      expect(time).toBeLessThan(10); // < 10ms для 10000 spans
    });
  });

  describe('End-to-End Performance', () => {
    test('Полный цикл span (start + end) должен быть < 1ms', () => {
      const tracer = new X402Tracer();
      
      const times: number[] = [];
      const iterations = 10000;
      
      for (let i = 0; i < iterations; i++) {
        const time = measureTime(() => {
          const span = tracer.startSpan(`span_${i}`);
          span.success();
        });
        times.push(time);
      }
      
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);
      const p99Time = times.sort((a, b) => a - b)[Math.floor(times.length * 0.99)];
      const p95Time = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)];
      
      console.log(`\n📊 End-to-End Span Performance:`);
      console.log(`  Average: ${avgTime.toFixed(4)}ms`);
      console.log(`  Max: ${maxTime.toFixed(4)}ms`);
      console.log(`  P95: ${p95Time.toFixed(4)}ms`);
      console.log(`  P99: ${p99Time.toFixed(4)}ms`);
      
      // Критическое требование: overhead < 1ms
      expect(avgTime).toBeLessThan(1.0);
      expect(p95Time).toBeLessThan(1.0);
      expect(p99Time).toBeLessThan(2.0); // P99 может быть немного выше
    });

    test('Высокая нагрузка: 10000 spans за раз', () => {
      const tracer = new X402Tracer({
        bufferSize: 20000,
      });
      
      const startTime = performance.now();
      
      for (let i = 0; i < 10000; i++) {
        const span = tracer.startSpan(`span_${i}`);
        span.success();
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTime = totalTime / 10000;
      
      console.log(`\n📊 High Load Performance (10000 spans):`);
      console.log(`  Total time: ${totalTime.toFixed(2)}ms`);
      console.log(`  Average per span: ${avgTime.toFixed(4)}ms`);
      console.log(`  Throughput: ${(10000 / (totalTime / 1000)).toFixed(0)} spans/sec`);
      
      expect(avgTime).toBeLessThan(1.0);
      expect(totalTime).toBeLessThan(10000); // 10000 spans должны быть созданы за < 10 секунд
      expect(tracer.getBufferSize()).toBe(10000);
    });

    test('Span с атрибутами не должен замедлять работу', () => {
      const tracer = new X402Tracer();
      
      const times: number[] = [];
      const iterations = 10000;
      
      for (let i = 0; i < iterations; i++) {
        const time = measureTime(() => {
          const span = tracer.startSpan(`span_${i}`);
          span.addAttribute('key1', 'value1');
          span.addAttribute('key2', 123);
          span.addAttribute('key3', { nested: 'object' });
          span.success();
        });
        times.push(time);
      }
      
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      
      console.log(`\n📊 Span with Attributes Performance:`);
      console.log(`  Average: ${avgTime.toFixed(4)}ms`);
      
      // Добавление атрибутов не должно значительно замедлять работу
      expect(avgTime).toBeLessThan(1.5); // Немного выше из-за атрибутов
    });
  });

  describe('Memory Efficiency', () => {
    test('Pre-allocation не должна создавать аллокации при push', () => {
      const buffer = new CircularBuffer(1000);
      
      const spanData: SpanData = {
        name: 'test_span',
        startTime: performance.now() * 1e6,
        endTime: performance.now() * 1e6 + 1000000,
        duration: 1000000,
        status: 'success',
      };
      
      // Измеряем время первого push (может быть медленнее из-за инициализации)
      const firstPushTime = measureTime(() => {
        buffer.push(spanData);
      });
      
      // Измеряем время последующих push (должны быть быстрыми)
      const subsequentTimes: number[] = [];
      for (let i = 0; i < 1000; i++) {
        const time = measureTime(() => {
          buffer.push(spanData);
        });
        subsequentTimes.push(time);
      }
      
      const avgSubsequentTime = subsequentTimes.reduce((a, b) => a + b, 0) / subsequentTimes.length;
      
      console.log(`\n📊 Memory Allocation Performance:`);
      console.log(`  First push: ${firstPushTime.toFixed(4)}ms`);
      console.log(`  Average subsequent: ${avgSubsequentTime.toFixed(4)}ms`);
      
      // Последующие push должны быть быстрыми (нет аллокаций)
      expect(avgSubsequentTime).toBeLessThan(0.05);
    });
  });

  describe('Concurrent Performance', () => {
    test('Множественные spans не должны блокировать друг друга', async () => {
      const tracer = new X402Tracer({
        bufferSize: 10000,
      });
      
      const concurrentSpans = 1000;
      const startTime = performance.now();
      
      // Создаем spans параллельно
      const promises = Array.from({ length: concurrentSpans }, (_, i) => {
        return new Promise<void>((resolve) => {
          const span = tracer.startSpan(`span_${i}`);
          // Симулируем небольшую задержку
          setTimeout(() => {
            span.success();
            resolve();
          }, Math.random() * 10);
        });
      });
      
      await Promise.all(promises);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      console.log(`\n📊 Concurrent Performance (1000 spans):`);
      console.log(`  Total time: ${totalTime.toFixed(2)}ms`);
      console.log(`  Buffer size: ${tracer.getBufferSize()}`);
      
      expect(tracer.getBufferSize()).toBe(concurrentSpans);
      // Время должно быть близко к максимальной задержке, а не сумме всех задержек
      expect(totalTime).toBeLessThan(100); // Все spans должны быть обработаны быстро
    });
  });

  describe('Real-world Scenario', () => {
    test('Симуляция payment операции с несколькими spans', async () => {
      const tracer = new X402Tracer({
        bufferSize: 1000,
      });
      
      const startTime = performance.now();
      
      // Симулируем payment операцию
      const validateSpan = tracer.startSpan('validate_payment');
      await new Promise(resolve => setTimeout(resolve, 5));
      validateSpan.success();
      
      const checkBalanceSpan = tracer.startSpan('check_balance');
      await new Promise(resolve => setTimeout(resolve, 3));
      checkBalanceSpan.success();
      
      const transactionSpan = tracer.startSpan('solana_transaction');
      transactionSpan.addAttribute('rpc', 'https://api.mainnet-beta.solana.com');
      await new Promise(resolve => setTimeout(resolve, 10));
      transactionSpan.success();
      
      const confirmSpan = tracer.startSpan('confirm_transaction');
      await new Promise(resolve => setTimeout(resolve, 8));
      confirmSpan.success();
      
      const endTime = performance.now();
      const overhead = endTime - startTime - (5 + 3 + 10 + 8); // Вычитаем реальное время операций
      
      console.log(`\n📊 Real-world Scenario Performance:`);
      console.log(`  Total time: ${(endTime - startTime).toFixed(2)}ms`);
      console.log(`  Business logic time: ${(5 + 3 + 10 + 8)}ms`);
      console.log(`  Logging overhead: ${overhead.toFixed(2)}ms`);
      console.log(`  Overhead per span: ${(overhead / 4).toFixed(4)}ms`);
      
      // Overhead должен быть < 1ms на span
      expect(overhead / 4).toBeLessThan(1.0);
      expect(tracer.getBufferSize()).toBe(4);
    });
  });
});

