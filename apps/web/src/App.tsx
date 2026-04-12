import { useState } from "react";
import FundWidget from "./components/FundWidget";
import ServiceCatalog from "./components/ServiceCatalog";
import DemoTerminal from "./components/DemoTerminal";
import ReputationPanel from "./components/ReputationPanel";
import BazaarFeed from "./components/BazaarFeed";

const API_URL = (import.meta as any).env?.VITE_API_URL ?? "http://localhost:3000";

type Tab = "demo" | "bazaar" | "reputation" | "fund" | "services";

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>("demo");

  const tabs: { id: Tab; label: string }[] = [
    { id: "demo",       label: "⚡ Demo" },
    { id: "bazaar",     label: "🕸️ Bazaar" },
    { id: "reputation", label: "⭐ Reputación" },
    { id: "fund",       label: "💚 Fund MicoPay" },
    { id: "services",   label: "📡 Servicios" },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100" style={{ fontFamily: "monospace" }}>
      {/* Header */}
      <header style={{
        borderBottom: "1px solid #1f2937", padding: "1rem 1.5rem",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "1.5rem" }}>🍄</span>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "bold", color: "white" }}>
              MicoPay Protocol
            </h1>
            <p style={{ margin: 0, fontSize: "0.72rem", color: "#6b7280" }}>
              La primera API que da a agentes IA acceso a efectivo físico en México · x402 on Stellar
            </p>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.72rem" }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
            <span style={{ color: "#4ade80" }}>testnet live</span>
          </div>
          <div style={{ fontSize: "0.65rem", color: "#4b5563" }}>
            Sin cuenta · Sin API key · El pago ES la autenticación
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav style={{ borderBottom: "1px solid #1f2937", padding: "0 1.5rem", display: "flex", gap: "0.25rem" }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "0.75rem 1rem", fontSize: "0.875rem",
              background: "none", border: "none",
              borderBottom: activeTab === tab.id ? "2px solid #4ade80" : "2px solid transparent",
              color: activeTab === tab.id ? "#4ade80" : "#6b7280",
              cursor: "pointer", transition: "color 0.15s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main style={{ padding: "1.5rem", maxWidth: "900px", margin: "0 auto" }}>
        {activeTab === "demo"       && <DemoTerminal   apiUrl={API_URL} />}
        {activeTab === "bazaar"     && <BazaarFeed     apiUrl={API_URL} />}
        {activeTab === "reputation" && <ReputationPanel apiUrl={API_URL} />}
        {activeTab === "fund"       && <FundWidget      apiUrl={API_URL} />}
        {activeTab === "services"   && <ServiceCatalog  apiUrl={API_URL} />}
      </main>
    </div>
  );
}
