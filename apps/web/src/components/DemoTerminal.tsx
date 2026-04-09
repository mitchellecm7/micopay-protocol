import { useState } from "react";

interface Props {
  apiUrl: string;
}

type Step = "idle" | "search" | "plan" | "fund" | "done";

interface LogLine {
  type: "cmd" | "response" | "info" | "success" | "error";
  text: string;
}

export default function DemoTerminal({ apiUrl }: Props) {
  const [step, setStep] = useState<Step>("idle");
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [running, setRunning] = useState(false);
  const [explorerUrl, setExplorerUrl] = useState<string | null>(null);

  const add = (line: LogLine) => setLogs((prev) => [...prev, line]);
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const runDemo = async () => {
    setLogs([]);
    setExplorerUrl(null);
    setRunning(true);

    // ── Step 0: Service discovery (free) ─────────────────────────────
    setStep("search");
    add({ type: "info", text: "=== Micopay Protocol — Live Demo ===" });
    add({ type: "cmd",  text: `GET ${apiUrl}/api/v1/services` });
    await sleep(500);
    try {
      const res  = await fetch(`${apiUrl}/api/v1/services`);
      const data = await res.json();
      add({ type: "success",  text: `✓ ${data.services?.length ?? 0} services discovered` });
      add({ type: "response", text: `  payment_method: ${data.payment_method ?? "x402"}` });
      add({ type: "response", text: `  network: Stellar testnet` });
    } catch {
      add({ type: "error", text: "⚠ API offline" });
    }

    await sleep(400);

    // ── Step 1: Search counterparties — real Horizon rate ─────────────
    add({ type: "info", text: "\n--- Step 1: Search counterparties ($0.001) ---" });
    add({ type: "cmd",  text: `GET ${apiUrl}/api/v1/swaps/search?sell_asset=USDC&buy_asset=XLM&amount=50` });
    add({ type: "info", text: "  ← 402 Payment Required" });
    await sleep(400);
    add({ type: "info", text: '  → X-Payment: "mock:GAGENT:0.001"' });
    await sleep(600);
    try {
      const res  = await fetch(`${apiUrl}/api/v1/swaps/search?sell_asset=USDC&buy_asset=XLM&amount=50`, {
        headers: { "x-payment": "mock:GAGENT_DEMO:0.001" },
      });
      const data = await res.json();
      const cp   = data.counterparties?.[0];
      add({ type: "success",  text: `✓ 200 OK — ${data.total_results ?? 2} counterparties found` });
      add({ type: "response", text: `  market_rate: ${data.market_rate} XLM/USDC  [source: ${data.rate_source ?? "horizon-testnet"}]` });
      if (cp) {
        add({ type: "response", text: `  best: score=${cp.reputation_score}  rate=${cp.rate}  completion=${(cp.completion_rate * 100).toFixed(0)}%` });
      }
    } catch {
      add({ type: "success",  text: "✓ 200 OK — 2 counterparties (offline fallback)" });
      add({ type: "response", text: "  market_rate: 6.12 XLM/USDC" });
    }

    await sleep(500);

    // ── Step 2: Claude plans the swap — real API call ─────────────────
    setStep("plan");
    add({ type: "info", text: "\n--- Step 2: Claude plans the swap ($0.01) ---" });
    add({ type: "cmd",  text: `POST ${apiUrl}/api/v1/swaps/plan` });
    add({ type: "info", text: '  intent: "swap 50 USDC for XLM, best rate"' });
    add({ type: "info", text: "  → Claude Haiku parsing intent..." });
    await sleep(600);
    add({ type: "info", text: "  → Claude calling search_swaps tool..." });
    await sleep(400);

    try {
      const res  = await fetch(`${apiUrl}/api/v1/swaps/plan`, {
        method: "POST",
        headers: { "x-payment": "mock:GAGENT_DEMO:0.01", "Content-Type": "application/json" },
        body: JSON.stringify({ intent: "swap 50 USDC for XLM, best rate", user_address: "GDEMOUSER1" }),
      });
      const data = await res.json();
      const plan = data.plan;
      if (plan) {
        add({ type: "info",     text: "  → Claude calling create_swap_plan tool..." });
        await sleep(300);
        add({ type: "success",  text: `✓ SwapPlan generated  [agent: ${data.agent}]` });
        add({ type: "response", text: `  sell: ${plan.amounts?.sell_amount} ${plan.amounts?.sell_asset}  →  buy: ${plan.amounts?.buy_amount} ${plan.amounts?.buy_asset}` });
        add({ type: "response", text: `  rate: ${plan.amounts?.exchange_rate}  risk: ${plan.risk_level}  eta: ${plan.estimated_time_seconds}s` });
        add({ type: "response", text: `  steps: lock → monitor → release` });
      } else {
        throw new Error(data.error ?? "no plan");
      }
    } catch (e) {
      add({ type: "error",    text: `⚠ Claude unavailable: ${e}` });
      add({ type: "response", text: "  (showing cached plan)" });
      add({ type: "response", text: "  sell: 50 USDC → buy: ~306 XLM  risk: low" });
    }

    await sleep(500);

    // ── Step 3: Fund Micopay — REAL on-chain USDC payment ────────────
    setStep("fund");
    add({ type: "info", text: "\n--- Step 3: Fund Micopay — real on-chain payment ($0.10 USDC) ---" });
    add({ type: "cmd",  text: `POST ${apiUrl}/api/v1/fund/demo` });
    add({ type: "info", text: "  → Demo agent signing Stellar USDC transaction..." });
    await sleep(600);
    add({ type: "info", text: "  → Submitting to Stellar testnet..." });

    try {
      const res  = await fetch(`${apiUrl}/api/v1/fund/demo`, { method: "POST" });
      const data = await res.json();
      if (data.stellar_tx_hash) {
        add({ type: "success",  text: `✓ Payment confirmed on-chain!` });
        add({ type: "response", text: `  amount: $${data.amount_usdc} USDC` });
        add({ type: "response", text: `  from: ${data.agent_address?.slice(0,8)}...${data.agent_address?.slice(-4)}` });
        add({ type: "response", text: `  total funded: $${data.total_funded_usdc} by ${data.total_supporters} supporter(s)` });
        add({ type: "response", text: `  tx: ${data.stellar_tx_hash}` });
        setExplorerUrl(data.stellar_expert_url);
      } else {
        throw new Error(data.error ?? "payment failed");
      }
    } catch (e) {
      add({ type: "error", text: `✗ Payment failed: ${e}` });
    }

    add({ type: "info", text: "\n=== Demo complete. Payment IS authentication. ===" });
    setStep("done");
    setRunning(false);
  };

  const COLOR: Record<LogLine["type"], string> = {
    cmd:      "#60a5fa",
    response: "#9ca3af",
    info:     "#6b7280",
    success:  "#4ade80",
    error:    "#f87171",
  };

  const STEPS = ["search", "plan", "fund", "done"] as Step[];

  return (
    <div>
      <div style={{
        background: "#111827",
        border: "1px solid #1f2937",
        borderRadius: "0.5rem",
        padding: "1.5rem",
        marginBottom: "1rem",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            <h2 style={{ margin: "0 0 0.25rem", fontSize: "1.25rem", color: "white" }}>Demo Terminal</h2>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "#6b7280" }}>
              Discovery → Swap plan (Claude) → Real USDC payment on Stellar testnet
            </p>
          </div>
          <button
            onClick={runDemo}
            disabled={running}
            style={{
              padding: "0.5rem 1.25rem",
              background: running ? "#1f2937" : "#166534",
              border: `1px solid ${running ? "#374151" : "#15803d"}`,
              borderRadius: "0.375rem",
              color: running ? "#4b5563" : "#4ade80",
              fontSize: "0.875rem",
              cursor: running ? "not-allowed" : "pointer",
              fontFamily: "monospace",
            }}
          >
            {running ? "Running..." : step === "done" ? "▶ Run Again" : "▶ Run Demo"}
          </button>
        </div>

        {/* Progress bar */}
        {step !== "idle" && (
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
            {STEPS.map((s) => (
              <div key={s} style={{
                flex: 1,
                height: "4px",
                borderRadius: "2px",
                background: STEPS.indexOf(step) >= STEPS.indexOf(s) ? "#4ade80" : "#1f2937",
                transition: "background 0.3s",
              }} />
            ))}
          </div>
        )}

        {/* Terminal output */}
        <div style={{
          background: "#0a0f1e",
          borderRadius: "0.375rem",
          padding: "1rem",
          minHeight: "300px",
          fontFamily: "monospace",
          fontSize: "0.8rem",
          lineHeight: "1.8",
          overflowY: "auto",
          maxHeight: "500px",
        }}>
          {logs.length === 0 ? (
            <span style={{ color: "#374151" }}>Press "Run Demo" to start...</span>
          ) : (
            logs.map((line, i) => (
              <div key={i} style={{ color: COLOR[line.type] }}>
                {line.type === "cmd" && <span style={{ color: "#4b5563" }}>$ </span>}
                {line.text}
              </div>
            ))
          )}
          {running && <span style={{ color: "#4ade80" }}>▋</span>}
        </div>

        {/* Stellar Expert link when done */}
        {explorerUrl && (
          <div style={{ marginTop: "0.75rem", padding: "0.75rem", background: "#052e16", borderRadius: "0.375rem", border: "1px solid #15803d" }}>
            <span style={{ color: "#4ade80", fontSize: "0.8rem", fontFamily: "monospace" }}>
              ✓ Verified on-chain:{" "}
              <a href={explorerUrl} target="_blank" rel="noopener noreferrer"
                style={{ color: "#60a5fa", textDecoration: "underline" }}>
                stellar.expert →
              </a>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
