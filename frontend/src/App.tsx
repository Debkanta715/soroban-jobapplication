import { useCallback, useEffect, useState } from "react";
import {
  checkWalletNetwork,
  connectWallet,
  getConnectedAddress,
  getExpectedNetworkName,
} from "./contract";
import { WalletConnect } from "./components/WalletConnect.tsx";
import { JobBoard } from "./components/JobBoard.tsx";
import { CreateJobForm } from "./components/CreateJobForm.tsx";
import { MyApplications } from "./components/MyApplications.tsx";
import { EmployerDashboard } from "./components/EmployerDashboard.tsx";
import { Toast } from "./components/Toast.tsx";

type Tab = "board" | "post" | "my-apps" | "employer";

export interface ToastMessage {
  id: number;
  type: "success" | "error" | "info";
  message: string;
}

export default function App() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("board");
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [networkMismatch, setNetworkMismatch] = useState<{
    walletNetwork: string;
    expectedNetwork: string;
  } | null>(null);

  const syncWalletNetworkStatus = useCallback(async () => {
    const status = await checkWalletNetwork();
    if (!status) {
      setNetworkMismatch(null);
      return;
    }

    if (!status.isMatch) {
      setNetworkMismatch({
        walletNetwork: status.walletNetwork || "Unknown",
        expectedNetwork: getExpectedNetworkName(),
      });
      return;
    }
    setNetworkMismatch(null);
  }, []);

  // Restore wallet if previously connected
  useEffect(() => {
    getConnectedAddress().then((addr) => {
      if (addr) setWalletAddress(addr);
    });
    syncWalletNetworkStatus();
  }, [syncWalletNetworkStatus]);

  const addToast = useCallback(
    (type: ToastMessage["type"], message: string) => {
      const id = Date.now();

      // Keep notifications visible but brief, especially recurring load failures.
      const duration =
        message.toLowerCase().includes("failed to load")
          ? 1800
          : type === "error"
            ? 2600
            : type === "success"
              ? 1600
              : 2000;

      setToasts((prev) => {
        const withoutDuplicate = prev.filter(
          (t) => !(t.type === type && t.message === message),
        );
        return [...withoutDuplicate, { id, type, message }];
      });
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== id)),
        duration,
      );
    },
    [],
  );

  const handleConnect = async () => {
    try {
      const addr = await connectWallet();
      setWalletAddress(addr);
      await syncWalletNetworkStatus();
      addToast("success", "Wallet connected successfully!");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to connect wallet.";
      if (msg.toLowerCase().includes("wrong wallet network")) {
        addToast("error", msg);
        await syncWalletNetworkStatus();
        return;
      }
      if (msg.toLowerCase().includes("not found")) {
        addToast("error", "Freighter not detected. Install it, enable it for this site, then refresh and connect again.");
        return;
      }
      addToast("error", msg);
    }
  };

  const handleDisconnect = () => {
    setWalletAddress(null);
    setNetworkMismatch(null);
    addToast("info", "Wallet disconnected in app. Reconnect anytime.");
  };

  const handleReconnect = async () => {
    await handleConnect();
  };

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "board", label: "Job Board", icon: "🗂️" },
    { id: "post", label: "Post a Job", icon: "✍️" },
    { id: "my-apps", label: "My Applications", icon: "📄" },
    { id: "employer", label: "Employer Dashboard", icon: "🏢" },
  ];

  const requiresWallet: Tab[] = ["post", "my-apps", "employer"];

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden">
      <div className="bg-orb bg-orb-left" />
      <div className="bg-orb bg-orb-right" />

      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-white/70 border-b border-white/70 shadow-[0_8px_40px_rgba(15,23,42,0.05)]">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl animate-float">💼</span>
            <div>
              <h1 className="font-title text-xl text-slate-900 leading-tight tracking-tight">
                Soroban Job Board
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                Decentralised hiring on Stellar
              </p>
            </div>
          </div>
          <WalletConnect
            address={walletAddress}
            onConnect={handleConnect}
            onReconnect={handleReconnect}
            onDisconnect={handleDisconnect}
          />
        </div>
      </header>

      {/* Navigation */}
      <nav className="relative z-10 pt-5">
        <div className="max-w-6xl mx-auto px-4">
          <div className="glass-panel rounded-2xl p-2 flex gap-1.5 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`nav-pill flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap ${
                activeTab === tab.id
                  ? "nav-pill-active"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
          </div>
        </div>
      </nav>

      <section className="relative z-10 max-w-6xl mx-auto px-4 pt-5">
        <div className="hero-shell rounded-3xl p-6 md:p-8">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.18em] text-stellar-700/80 font-semibold">
              Talent + Opportunity Onchain
            </p>
            <h2 className="font-title text-2xl md:text-4xl leading-tight text-slate-900 mt-2">
              Hire in days,
              <span className="text-stellar-600"> not weeks.</span>
            </h2>
            <p className="text-slate-600 mt-3 md:text-base text-sm">
              Post jobs, review candidates, and manage applications through your
              wallet-powered hiring board.
            </p>
          </div>
        </div>
      </section>

      {networkMismatch && walletAddress && (
        <section className="relative z-10 max-w-6xl mx-auto px-4 pt-4">
          <div className="card border-amber-200 bg-amber-50/80 p-4 md:p-5">
            <h3 className="font-semibold text-amber-800">Wrong Wallet Network</h3>
            <p className="text-sm text-amber-700 mt-1">
              Your wallet is on <strong>{networkMismatch.walletNetwork}</strong>, but this app expects <strong>{networkMismatch.expectedNetwork}</strong>.
              Switch network in Freighter, then click Reconnect.
            </p>
          </div>
        </section>
      )}

      {/* Content */}
      <main className="relative z-10 flex-1 max-w-6xl mx-auto w-full px-4 py-6 animate-enter">
        {requiresWallet.includes(activeTab) && !walletAddress ? (
          <div className="card p-10 text-center md:mt-1">
            <div className="text-5xl mb-4">🔒</div>
            <h2 className="text-xl font-semibold text-slate-700 mb-2">
              Wallet Required
            </h2>
            <p className="text-slate-500 mb-6">
              Connect your Freighter wallet to use this feature.
            </p>
            <button onClick={handleConnect} className="btn-primary">
              Connect Freighter Wallet
            </button>
          </div>
        ) : (
          <>
            {activeTab === "board" && (
              <JobBoard walletAddress={walletAddress} onToast={addToast} />
            )}
            {activeTab === "post" && walletAddress && (
              <CreateJobForm walletAddress={walletAddress} onToast={addToast} />
            )}
            {activeTab === "my-apps" && walletAddress && (
              <MyApplications
                walletAddress={walletAddress}
                onToast={addToast}
              />
            )}
            {activeTab === "employer" && walletAddress && (
              <EmployerDashboard
                walletAddress={walletAddress}
                onToast={addToast}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/60 bg-white/65 backdrop-blur-lg py-4 text-center text-xs text-slate-500">
        Powered by Stellar Soroban · Testnet
      </footer>

      {/* Toast notifications */}
      <div className="fixed top-20 right-4 flex flex-col gap-2 z-50">
        {toasts.map((t) => (
          <Toast
            key={t.id}
            type={t.type}
            message={t.message}
            onClose={() =>
              setToasts((prev) => prev.filter((x) => x.id !== t.id))
            }
          />
        ))}
      </div>
    </div>
  );
}
