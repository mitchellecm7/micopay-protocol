import { useState, useEffect } from "react";

interface AssetInfo {
  chain: string;
  symbol: string;
  amount: string;
}

interface BazaarIntent {
  id: string;
  agent_address: string;
  offered: AssetInfo;
  wanted: AssetInfo;
  status: string;
  created_at: string;
  reputation_tier?: string;
}

interface Props { apiUrl: string; }

export default function BazaarFeed({ apiUrl }: Props) {
  const [intents, setIntents] = useState<BazaarIntent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [broadcastLoading, setBroadcastLoading] = useState(false);

  const fetchFeed = async () => {
    setLoading(true);
    try {
      // First call without payment
      const r1 = await fetch(`${apiUrl}/api/v1/bazaar/feed`);
      if (r1.status === 402) {
        const challenge = await r1.json();
        // Retry with mock payment (demo mode)
        const r2 = await fetch(`${apiUrl}/api/v1/bazaar/feed`, {
          headers: { "x-payment": `mock:GDEMO_BROWSER_USER:${challenge.challenge?.amount_usdc ?? "0.001"}` },
        });
        const data = await r2.json();
        setIntents(data.intents || []);
      } else {
        const data = await r1.json();
        setIntents(data.intents || []);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const broadcastIntent = async () => {
    setBroadcastLoading(true);
    try {
      // Step 1: get challenge
      const r1 = await fetch(`${apiUrl}/api/v1/bazaar/intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offered: { chain: "ethereum", symbol: "ETH", amount: "1.2" },
          wanted: { chain: "stellar", symbol: "USDC", amount: "3200" }
        })
      });
      
      const challenge = await r1.json();
      
      // Step 2: Pay $0.005 and broadcast
      await fetch(`${apiUrl}/api/v1/bazaar/intent`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-payment": `mock:GDEMO_AGENT_UI:0.005`
        },
        body: JSON.stringify({
          offered: { chain: "ethereum", symbol: "ETH", amount: "1.2" },
          wanted: { chain: "stellar", symbol: "USDC", amount: "3200" }
        })
      });
      
      await fetchFeed();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBroadcastLoading(false);
    }
  };

  useEffect(() => { fetchFeed(); }, []);

  const TIER_EMOJI: Record<string, string> = {
    maestro: "🍄", experto: "⭐", activo: "✅", espora: "🌱"
  };

  const CHAIN_COLORS: Record<string, string> = {
    ethereum: "#627eea",
    stellar: "#4ade80",
    solana: "#14f195",
    physical: "#fbbf24"
  };

  return (
    <div style={{ fontFamily: "monospace" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <div>
          <h2 style={{ margin: "0 0 0.4rem", fontSize: "1.1rem", color: "white" }}>
            🕸️ Agent Bazaar
          </h2>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "#6b7280" }}>
            Social layer where agents broadcast intents using x402 and HTLCs.
          </p>
        </div>
        <button 
          onClick={broadcastIntent}
          disabled={broadcastLoading}
          style={{
            padding: "0.5rem 1rem", background: "#7c3aed", color: "white",
            border: "none", borderRadius: "6px", cursor: "pointer",
            fontSize: "0.75rem", fontWeight: "bold", fontFamily: "monospace"
          }}
        >
          {broadcastLoading ? "Broadcasting..." : "📢 Broadcast Intent ($0.005)"}
        </button>
      </div>

      {error && <div style={{ color: "#f87171", marginBottom: "1rem" }}>✗ {error}</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {loading && intents.length === 0 ? (
          <div style={{ color: "#374151" }}>Scanning intent layer...</div>
        ) : (
          intents.map((intent) => (
            <div key={intent.id} style={{
              background: "#111827", border: "1px solid #1f2937",
              borderRadius: "10px", padding: "1rem", position: "relative",
              overflow: "hidden"
            }}>
              {/* Agent info */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                <div style={{ 
                  width: "24px", height: "24px", borderRadius: "50%", 
                  background: "#1e293b", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.8rem"
                }}>
                  {intent.reputation_tier ? TIER_EMOJI[intent.reputation_tier] : "🤖"}
                </div>
                <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                  {intent.agent_address.slice(0, 8)}...{intent.agent_address.slice(-4)}
                </span>
                <span style={{ fontSize: "0.62rem", color: "#4b5563" }}>
                  {new Date(intent.created_at).toLocaleTimeString()}
                </span>
              </div>

              {/* Swap visualization */}
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.62rem", color: "#6b7280", textTransform: "uppercase", marginBottom: "0.2rem" }}>
                    Offered on {intent.offered.chain}
                  </div>
                  <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: "white" }}>
                    {intent.offered.amount} <span style={{ color: CHAIN_COLORS[intent.offered.chain] || "#9ca3af" }}>{intent.offered.symbol}</span>
                  </div>
                </div>
                
                <div style={{ color: "#374151", fontSize: "1.2rem" }}>➡️</div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.62rem", color: "#6b7280", textTransform: "uppercase", marginBottom: "0.2rem" }}>
                    Wanted on {intent.wanted.chain}
                  </div>
                  <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: "white" }}>
                    {intent.wanted.amount} <span style={{ color: CHAIN_COLORS[intent.wanted.chain] || "#9ca3af" }}>{intent.wanted.symbol}</span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end" }}>
                <button style={{
                  padding: "0.4rem 0.8rem", background: "transparent",
                  border: "1px solid #374151", color: "#9ca3af",
                  borderRadius: "5px", fontSize: "0.65rem", cursor: "pointer",
                  fontFamily: "monospace"
                }}>
                  🤝 Quote / Accept
                </button>
              </div>

              {/* Status bar */}
              <div style={{
                position: "absolute", bottom: 0, left: 0, width: "3px", 
                height: "100%", background: "#4ade80"
              }} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
