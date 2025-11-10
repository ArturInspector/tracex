'use client';

import { useCallback, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

type KeySource = 'pem' | 'json';
type PemValidationResult =
  | { ok: true; value: string }
  | { ok: false; message: string };

interface KeyInputProps {
  onKeySet: (privateKey: string, metadata?: { source: KeySource }) => void;
}

function extractKeyFromJson(raw: string): string | null {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.privateKey === 'string') {
      return parsed.privateKey;
    }
    return null;
  } catch {
    return null;
  }
}

export function KeyInput({ onKeySet }: KeyInputProps) {
  const [rawInput, setRawInput] = useState('');
  const [parsedKey, setParsedKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [source, setSource] = useState<KeySource>('pem');

  const normaliseKey = useCallback((value: string) => value.replace(/\r\n/g, '\n').trim(), []);

  const displayValue = parsedKey || rawInput;

  const lineCount = useMemo(() => {
    if (!displayValue) return 0;
    return normaliseKey(displayValue).split('\n').length;
  }, [displayValue, normaliseKey]);

  const validatePem = useCallback((candidate: string): PemValidationResult => {
    const normalised = normaliseKey(candidate);
    const begin = '-----BEGIN PRIVATE KEY-----';
    const end = '-----END PRIVATE KEY-----';

    if (!normalised.startsWith(begin) || !normalised.endsWith(end)) {
      return { ok: false, message: 'Key must start/end with the PEM headers' };
    }

    const body = normalised.replace(begin, '').replace(end, '').replace(/\s+/g, '');
    if (!body) {
      return { ok: false, message: 'Key body is empty' };
    }

    // Basic base64 check
    if (!/^[a-zA-Z0-9+/=]+$/.test(body)) {
      return { ok: false, message: 'Key contains invalid characters' };
    }

    return { ok: true, value: normalised };
  }, [normaliseKey]);

  const tryParseInput = useCallback(
    (value: string) => {
      setRawInput(value);
      setInfo(null);

      if (!value.trim()) {
        setParsedKey('');
        setError(null);
        setSource('pem');
        return;
      }

      const trimmed = value.trim();
      if (trimmed.startsWith('{')) {
        const keyFromJson = extractKeyFromJson(trimmed);
        if (keyFromJson) {
          const result = validatePem(keyFromJson);
          if (result.ok) {
            setParsedKey(result.value);
            setSource('json');
            setError(null);
            setInfo('Extracted from JSON');
            return;
          }
        }
        setParsedKey('');
        setSource('json');
        setError('JSON does not contain a valid privateKey property in PEM format');
        return;
      }

      // Treat as raw PEM
      const result = validatePem(trimmed);
      if (result.ok) {
        setParsedKey(result.value);
        setSource('pem');
        setError(null);
        setInfo('PEM key ready');
      } else {
        setParsedKey('');
        setSource('pem');
        setError(result.message ?? 'Invalid PEM format');
      }
    },
    [validatePem]
  );

  const handleSubmit = useCallback(() => {
    const candidate = parsedKey || rawInput;
    if (!candidate.trim()) {
      setError('Private key is required');
      return;
    }

    const result = validatePem(candidate);
    if (!result.ok) {
      setError(result.message);
      return;
    }

    setError(null);
    setInfo(source === 'json' ? 'Key parsed from JSON and saved locally' : 'Key saved locally in memory');
    onKeySet(result.value, { source });
  }, [onKeySet, parsedKey, rawInput, source, validatePem]);

  const handlePasteFromClipboard = useCallback(async () => {
    try {
      if (!navigator.clipboard?.readText) {
        setError('Clipboard access is not available in this browser');
        return;
      }

      const clipboardText = await navigator.clipboard.readText();
      if (!clipboardText) {
        setError('Clipboard is empty');
        return;
      }

      tryParseInput(clipboardText);
      setInfo('Pasted from clipboard');
      setError(null);
    } catch (clipboardError) {
      console.error('Failed to read from clipboard', clipboardError);
      setError('Unable to read from clipboard. Paste manually (Ctrl/Cmd + V).');
    }
  }, [tryParseInput]);

  return (
    <Card className="p-6 bg-gradient-to-br from-purple-950/50 to-blue-950/50 border-purple-500/30 backdrop-blur-sm">
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-white mb-2">Paste your private key</h3>
          <p className="text-sm text-purple-300/70">
            Copy the PEM block from `.tracex-keys.json` or the SDK export. The key never leaves your browser.
      </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[2fr,1.2fr]">
      <div className="space-y-4">
            <Textarea
              placeholder="Paste PEM block or the entire .tracex-keys.json contents"
              value={displayValue}
              onChange={(e) => tryParseInput(e.target.value)}
              spellCheck={false}
              className="bg-black/30 border-purple-500/50 text-white placeholder:text-purple-400/50 font-mono text-sm min-h-[220px] resize-y"
            />

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs uppercase tracking-wide text-purple-400/60">
              <span>Lines detected: {lineCount}</span>
              <span className="capitalize text-purple-300/80">Mode: {source === 'pem' ? 'PEM' : 'JSON + PEM'}</span>
              {info && <span className="text-green-400 capitalize">{info}</span>}
              {error && <span className="text-red-400 normal-case">{error}</span>}
            </div>

            <div className="flex flex-wrap gap-3">
        <Button
          onClick={handleSubmit}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
        >
          Decrypt Traces
        </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handlePasteFromClipboard}
                className="flex-1 border-purple-500/50 text-purple-300"
              >
                Paste from clipboard
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setRawInput('');
                  setParsedKey('');
                  setError(null);
                  setInfo(null);
                  setSource('pem');
                }}
                className="flex-1 text-purple-400 hover:text-white hover:bg-purple-500/10"
              >
                Clear
              </Button>
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-purple-500/30 bg-black/20 p-4 text-sm text-purple-200/80">
            <h4 className="font-semibold text-white">Quick check</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Starts with <span className="font-mono text-purple-200">-----BEGIN PRIVATE KEY-----</span></li>
              <li>Ends with <span className="font-mono text-purple-200">-----END PRIVATE KEY-----</span></li>
              <li>No quotes or extra spaces</li>
              <li>~30+ lines for RSA 2048 keys</li>
            </ul>

            <div className="rounded-lg border border-purple-500/20 bg-black/30 p-3 font-mono text-xs text-purple-200/80">
              <div className="text-purple-400/70 mb-2">Example</div>
{`-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBK...
...snip...
-----END PRIVATE KEY-----`}
            </div>

            <p className="text-xs text-purple-400/60">
              Paste either the raw PEM or the entire <span className="font-mono text-purple-200">.tracex-keys.json</span>.
              The dashboard will extract and validate the <span className="font-mono text-purple-200">privateKey</span> automatically.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

