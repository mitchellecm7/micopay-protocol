# 🍄 MicoPay Protocol

**The first API that gives AI agents access to physical cash in Mexico**

> Stellar Hacks: Agents — DoraHacks 2026

---

## What is MicoPay?

MicoPay Protocol is an x402 API on Stellar that lets any AI agent — Claude, GPT, a Telegram bot, a WhatsApp assistant — find a trusted merchant near a user, verify their on-chain reputation, and initiate a trustless **USDC → MXN physical cash exchange** in milliseconds.

No API keys. No bank. No intermediary. **The payment IS the authentication.**

The agent pays per-request with USDC via x402. The user gets physical cash.

```
User → "I need $500 MXN in cash near Roma Norte, CDMX"

Agent:
  1. bazaar_intent ($0.005)  → Broadcast: "Have ETH, need USDC for cashout"
  2. cash_agents   ($0.001)  → Farmacia Guadalupe, 0.3km, tier Maestro 🍄
  3. reputation    ($0.0005) → 98% completion, 312 trades, trusted: true
  4. cash_request  ($0.01)   → HTLC locks 28.57 USDC, returns claim_url
  5. fund_micopay  ($0.10)   → Meta-demo: agent funds the protocol
  4. Agent → "Go to Orizaba 45. Open: https://app.micopay.xyz/claim/mcr-xxx"

User opens link → QR on phone → walks to pharmacy → gets $500 MXN cash.
Merchant scans QR → USDC released on-chain.

Total cost to agent: $0.1165 USDC
```

### Tracks covered

| Track | What we built |
|---|---|
| Paid agent services / APIs | Every endpoint pay-per-request via x402 |
| Agent-to-agent payments | Agent pays for each service call autonomously |
| Agent marketplaces / discovery | `SKILL.md` + `/api/v1/services` autodiscovery |
| DeFi integrations | Soroban HTLC escrow + AtomicSwapHTLC (cross-chain roadmap) |

---

## 🇲🇽 The Problem

Over 60% of Mexico's population is unbanked or underbanked. Cash is king. Traditional crypto on-ramps require bank accounts, KYC, and days of waiting.

MicoPay solves this with a **verified P2P merchant network**: local shops (pharmacies, convenience stores) that hold MXN cash and accept USDC. The HTLC contract ensures neither party can cheat — the merchant only gets USDC after handing over cash, and the user gets a full refund if they don't show up.

**AI agents are the perfect interface for this**: they can find the best merchant, verify trust signals a human would ignore, and handle the entire flow without the user touching crypto at all.

---

## The claim_url — QR delivery for any agent interface

A key design decision: the `cash_request` endpoint returns a `claim_url`:

```json
{
  "claim_url": "https://app.micopay.xyz/claim/mcr-4b6c0e5c",
  "qr_payload": "micopay://claim?request_id=mcr-4b6c0e5c&...",
  "instructions": "Go to Farmacia Guadalupe, Orizaba 45..."
}
```

The user opens the URL on their phone → full-screen QR → shows it to the merchant. No app install required. Works from any AI interface:

- **Claude / ChatGPT** → paste the URL in chat
- **Telegram bot** → inline button `[Ver QR 📱]`
- **WhatsApp** → send the URL as a message
- **MicoPay mobile app** → renders natively

---

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/ericmt-98/micopay-mvp
cd micopay-mvp && npm install

# 2. Configure
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env — already includes a testnet demo agent

# 3. Start API (port 3000)
cd apps/api && npm run dev

# 4. Start dashboard (port 5186)
cd apps/web && npm run dev

# 5. Start MicoPay mobile app (port 5181)
cd micopay/frontend && npm run dev

# 6. Run the full demo
curl -X POST http://localhost:3000/api/v1/demo/run
```

---

## Services (x402)

| Service | Endpoint | Price | Why pay? |
|---|---|---|---|
| Find cash merchants | `GET /api/v1/cash/agents` | $0.001 | Real-time merchant inventory — not on any public API |
| Merchant reputation | `GET /api/v1/reputation/:address` | $0.0005 | On-chain trust signal — can't be faked |
| Broadcast intent | `POST /api/v1/bazaar/intent` | $0.005 | Global intent layer for agents — find cross-chain bridge partners |
| Scan agent intents | `GET /api/v1/bazaar/feed` | $0.001 | Access to private market data / arbitrage opportunities |
| Send private quote | `POST /api/v1/bazaar/quote` | $0.002 | Direct negotiation channel for agentic swaps |
| Initiate cash exchange | `POST /api/v1/cash/request` | $0.01 | HTLC lock + QR generation + merchant notification |
| Fund MicoPay | `POST /api/v1/fund` | $0.10 | Meta-demo: protocol funds itself |
| Service discovery | `GET /api/v1/services` | free | |
| Agent skill | `GET /skill.md` | free | |
| Request status | `GET /api/v1/cash/request/:id` | free | |

Not offered: generic USDC/XLM swaps — those exist on Stellar DEX for free.

### x402 Flow

```
Agent → POST /api/v1/cash/request
      ← 402 { challenge: { amount_usdc: "0.01", pay_to: "G...", memo: "micopay:cash_request" } }

Agent builds Stellar USDC payment tx, signs it

Agent → POST /api/v1/cash/request
        X-Payment: <signed_xdr>
      ← 201 { claim_url: "https://app.micopay.xyz/claim/mcr-xxx", ... }
```

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│         AI Agent (Claude, GPT, Telegram bot)     │
│  Receives: "User needs $500 MXN near Roma Norte" │
└────────────────────────┬────────────────────────┘
                         │ x402 USDC payments per call
                         ▼
┌─────────────────────────────────────────────────┐
│           MicoPay Protocol API (Fastify)         │
│                                                  │
│  GET /api/v1/cash/agents    → merchant list      │
│  GET /api/v1/reputation/:a  → trust signal       │
│  POST /api/v1/cash/request  → HTLC + claim_url   │
└────────────────────────┬────────────────────────┘
                         │
            ┌────────────┴────────────┐
            ▼                         ▼
┌───────────────────┐      ┌──────────────────────┐
│  MicopayEscrow    │      │  claim_url page       │
│  (Soroban HTLC)   │      │  app.micopay.xyz/     │
│                   │      │  claim/:id            │
│  lock()           │      │                       │
│  release() ←QR   │      │  Full-screen QR       │
│  refund()         │      │  No app required      │
└───────────────────┘      └──────────────────────┘
```

### Key design principles

1. **Payment IS authentication** — x402 replaces API keys entirely
2. **claim_url bridges any agent interface** — Claude, Telegram, WhatsApp all work
3. **HTLC guarantees atomicity** — merchant can't take USDC without giving cash
4. **On-chain reputation** — NFT soulbound badges, can't be bought or transferred
5. **The protocol funds itself** — Fund MicoPay proves x402 in 10 seconds

---

## Repository Structure

```
micopay-mvp/
├── contracts/
│   ├── htlc-core/          # HashedTimeLock trait (Rust)
│   ├── atomic-swap/        # Cross-chain HTLC (future: ETH/BTC/SOL → MXN)
│   └── micopay-escrow/     # P2P escrow with platform fee
├── micopay/
│   ├── backend/            # MicoPay P2P backend (Node.js + in-memory store)
│   ├── frontend/           # Mobile app (React/Vite, port 5181)
│   │   └── src/pages/
│   │       └── ClaimQR.tsx # QR page — accessible from any AI agent via URL
│   └── contracts/
│       └── escrow/         # MicoPay escrow contract (v0.1)
├── apps/
│   ├── api/                # MicoPay Protocol API (Fastify + x402, port 3000)
│   │   └── src/routes/
│   │       ├── cash.ts       # cash_agents + cash_request + claim_url
│   │       ├── reputation.ts # on-chain merchant reputation
│   │       ├── bazaar.ts     # intent broadcasting & social orchestration
│   │       ├── demo.ts       # actor-to-actor 5-step demo runner
│   │       └── fund.ts       # meta-demo funding
│   └── web/                # Protocol dashboard (React, port 5186)
└── skill/
    └── SKILL.md            # Agent autodiscovery file
```

---

## Contracts (Soroban/Rust)

**37 unit tests, all passing:**

```bash
cd contracts && cargo test
# atomic-swap:    15 tests ✓
# micopay-escrow: 17 tests ✓

cd micopay/contracts/escrow && cargo test
# micopay-escrow: 5 tests ✓
```

### AtomicSwapHTLC — `contracts/atomic-swap`

Cross-chain HTLC for future multi-chain entry (ETH/BTC/SOL → physical MXN cash). Today: Stellar ↔ Stellar demo. Tomorrow: any chain → Mexico cash.

| Function | Description |
|---|---|
| `lock(initiator, counterparty, token, amount, secret_hash, timeout_ledgers)` | Lock funds. `swap_id = sha256(secret_hash)` |
| `release(swap_id, secret)` | Release to counterparty. Publishes secret for cross-chain coordination. |
| `refund(swap_id)` | Permissionless refund after timeout. |

### MicopayEscrow — `contracts/micopay-escrow`

P2P escrow used for the USDC → MXN cash exchange. Platform fee collected on release.

| Function | Description |
|---|---|
| `lock(seller, buyer, amount, platform_fee, secret_hash, timeout_minutes)` | Lock funds + fee |
| `release(trade_id, secret)` | Pay buyer + platform fee |
| `refund(trade_id)` | Return everything to seller after timeout |

---

## Security

Contracts reviewed against Soroban security checklist:

- ✅ All privileged functions require `require_auth()`
- ✅ Re-initialization prevented (`has(Admin)` guard)
- ✅ Duplicate lock prevention (checks before token transfer)
- ✅ Typed `DataKey` enum — no storage key collisions
- ✅ TTL extended proactively on every state change
- ✅ `overflow-checks = true` in release profile
- ✅ State machine prevents double-spend / double-release
- ✅ Events emitted for all state changes (full auditability)
- ✅ x402: USDC issuer verified, mock mode only in testnet demo

---

## Roadmap

| Timeline | Feature |
|---|---|
| Today | Stellar testnet demo — full 4-step agent flow |
| 1–3 months | Telegram bot integration, production merchant onboarding |
| 3–6 months | AtomicSwapHTLC live: ETH/BTC → MXN cash (no bridges) |
| 6–12 months | WhatsApp integration, mainnet launch, 100+ merchants CDMX |

---

## Team

Built for **Stellar Hacks: Agents** (DoraHacks 2026) by Eric + Stichui.

Built with Soroban SDK, Stellar SDK, Fastify, React, x402, Turborepo.
