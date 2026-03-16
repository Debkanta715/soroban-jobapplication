import { useState } from "react";

interface Props {
  address: string | null;
  onConnect: () => Promise<void>;
  onReconnect: () => Promise<void>;
  onDisconnect: () => void;
}

export function WalletConnect({ address, onConnect, onReconnect, onDisconnect }: Props) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      await onConnect();
    } finally {
      setLoading(false);
    }
  };

  if (address) {
    return (
      <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5">
        <div className="flex items-center gap-2 px-1">
          <span className="w-2 h-2 bg-emerald-500 rounded-full shrink-0" />
          <span className="text-sm font-mono text-emerald-700 truncate max-w-[120px]">
            {address.slice(0, 6)}…{address.slice(-4)}
          </span>
        </div>
        <button
          onClick={async () => {
            setLoading(true);
            try {
              await onReconnect();
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading}
          className="text-xs px-2 py-1 rounded-md border border-emerald-200 text-emerald-700 hover:bg-emerald-100"
          title="Reconnect Wallet"
        >
          {loading ? "..." : "Reconnect"}
        </button>
        <button
          onClick={onDisconnect}
          className="text-xs px-2 py-1 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100"
          title="Disconnect Wallet"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="btn-primary flex items-center gap-2 text-sm"
    >
      {loading ? (
        <>
          <span className="spinner" /> Connecting…
        </>
      ) : (
        <>🔗 Connect Freighter</>
      )}
    </button>
  );
}
