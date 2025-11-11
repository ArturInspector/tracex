import { Badge } from '@/components/ui/badge';
import type { WalletStateEntry } from './types';
import { formatRelative, shorten, walletExplorer } from './types';

const highlightCards = [
  {
    title: 'On-chain signature status',
    description:
      'TraceX polls Solana for each span signature and colour codes processed → confirmed → finalised.',
  },
  {
    title: 'Wallet health & liquidity',
    description:
      'Balances, slot and epoch for facilitator custody wallets refresh continuously via non-blocking RPC.',
  },
  {
    title: 'Encrypted hot path spans',
    description:
      'Spans decrypt locally with your PEM key. Backend never sees plaintext – zero trust telemetry.',
  },
  {
    title: 'RPC intelligence',
    description:
      'Attach rpc metadata per span to understand which endpoint handled the call and trigger fallbacks instantly.',
  },
];

interface OnchainInsightsProps {
  wallets: WalletStateEntry[];
  activeCluster: string | null;
  error: string | null;
}

export function OnchainInsights({ wallets, activeCluster, error }: OnchainInsightsProps) {
  return (
    <div className="space-y-4">
      {wallets.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {wallets.map((wallet) => (
            <div
              key={wallet.address}
              className="p-4 rounded-xl bg-black/30 border border-purple-500/20 hover:border-purple-500/40 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <a
                  href={walletExplorer(wallet.address, activeCluster)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-white font-mono text-sm hover:text-cyan-300 transition-colors"
                >
                  {shorten(wallet.address, 6, 4)}
                </a>
                <Badge variant="outline" className="border-green-400/40 text-green-200">
                  {wallet.sol.toFixed(4)} SOL
                </Badge>
              </div>
              <div className="text-xs text-purple-300/70 space-y-1">
                <div>
                  Slot {wallet.slot.toLocaleString()} • Epoch {wallet.epoch}
                </div>
                <div>Updated {formatRelative(wallet.fetchedAt)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="text-sm text-amber-300">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {highlightCards.map((item) => (
          <div
            key={item.title}
            className="p-4 rounded-xl bg-black/25 border border-purple-500/20 hover:border-purple-500/40 transition-colors"
          >
            <h4 className="text-lg font-semibold text-white mb-2">{item.title}</h4>
            <p className="text-sm text-purple-200/70 leading-relaxed">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

