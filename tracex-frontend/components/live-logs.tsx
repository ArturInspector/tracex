'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface LogEntry {
  id: string;
  timestamp: string;
  wallet: string;
  operation: string;
  duration: number;
  status: 'success' | 'error';
}

export function LiveLogs() {
  const [wallet, setWallet] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isWatching, setIsWatching] = useState(false);

  useEffect(() => {
    if (!isWatching || !wallet) return;

    const operations = [
      'verify_payment',
      'check_nonce',
      'solana_transaction',
      'confirm_transaction',
      'update_database',
    ];

    const interval = setInterval(() => {
      const newLog: LogEntry = {
        id: Math.random().toString(36).substring(7),
        timestamp: new Date().toISOString(),
        wallet: wallet.substring(0, 8) + '...' + wallet.substring(wallet.length - 4),
        operation: operations[Math.floor(Math.random() * operations.length)],
        duration: Math.floor(Math.random() * 500) + 10,
        status: Math.random() > 0.1 ? 'success' : 'error',
      };

      setLogs((prev) => [newLog, ...prev].slice(0, 20));
    }, 1500);

    return () => clearInterval(interval);
  }, [isWatching, wallet]);

  return (
    <Card className="p-6 bg-gradient-to-br from-purple-950/50 to-blue-950/50 border-purple-500/30 backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
        <h3 className="text-2xl font-bold text-white">Live Wallet Logs</h3>
        <Badge variant="outline" className="border-green-400 text-green-400">
          LIVE
        </Badge>
      </div>

      <div className="flex gap-2 mb-4">
        <Input
          placeholder="Enter wallet address..."
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
          className="bg-black/30 border-purple-500/50 text-white placeholder:text-purple-400/50 font-mono"
        />
        <Button
          onClick={() => setIsWatching(!isWatching)}
          className={isWatching ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'}
        >
          {isWatching ? 'Stop' : 'Start'}
        </Button>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="text-center py-8 text-purple-400/50">
            <div className="text-4xl mb-2 font-mono">[ ]</div>
            <p>Enter wallet address and click Start</p>
            <p className="text-sm mt-2 font-mono text-purple-400/40">
              Monitoring payment operations in real-time
            </p>
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="p-3 bg-black/30 rounded-lg border border-purple-500/20 hover:border-purple-500/50 transition-all animate-slide-in font-mono text-sm"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={log.status === 'success' ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {log.status === 'success' ? 'OK' : 'ERR'}
                  </Badge>
                  <span className="text-purple-300">{log.operation}</span>
                </div>
                <span className="text-purple-400/70">{log.duration}ms</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-purple-400/60">
                <span>{log.wallet}</span>
                <span>•</span>
                <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
