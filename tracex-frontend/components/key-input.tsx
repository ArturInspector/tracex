'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface KeyInputProps {
  onKeySet: (privateKey: string) => void;
}

export function KeyInput({ onKeySet }: KeyInputProps) {
  const [privateKey, setPrivateKey] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!privateKey.trim()) {
      setError('Private key is required');
      return;
    }

    // Базовая валидация PEM формата
    if (!privateKey.includes('BEGIN PRIVATE KEY') || !privateKey.includes('END PRIVATE KEY')) {
      setError('Invalid private key format. Expected PEM format.');
      return;
    }

    setError(null);
    onKeySet(privateKey);
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-purple-950/50 to-blue-950/50 border-purple-500/30 backdrop-blur-sm">
      <h3 className="text-xl font-bold text-white mb-4">Enter Private Key</h3>
      <p className="text-sm text-purple-400/70 mb-4">
        Enter your RSA private key to decrypt traces. Your key never leaves your browser.
      </p>

      <div className="space-y-4">
        <Textarea
          placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
          value={privateKey}
          onChange={(e) => {
            setPrivateKey(e.target.value);
            setError(null);
          }}
          className="bg-black/30 border-purple-500/50 text-white placeholder:text-purple-400/50 font-mono text-sm min-h-[200px]"
        />

        {error && (
          <div className="text-red-400 text-sm">{error}</div>
        )}

        <Button
          onClick={handleSubmit}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          Decrypt Traces
        </Button>
      </div>
    </Card>
  );
}

