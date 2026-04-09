# 🍄 Micopay Protocol

**x402 microservice infrastructure for AI agents on Stellar**

> Stellar Hacks: Agents — DoraHacks 2026

---

## What is Micopay?

Micopay Protocol is a network of x402 microservices on Stellar that any AI agent can **discover, pay per-request, and compose**. No API keys. No signup. Payment IS authentication.

The core primitive is an **atomic swap HTLC** (Soroban/Rust) coordinated by an AI agent: Claude understands intent and plans, a deterministic executor handles funds. The LLM never touches money.

### Tracks covered

| Track | What we built |
|-------|---------------|
| Paid agent services / APIs | Every endpoint is pay-per-request via x402 |
| Agent-to-agent payments | Swap coordinator agent pays for services |
| Rating, reputation, and trust | On-chain reputation (4 tiers, NFT soulbound) |
| Agent marketplaces / discovery | SKILL.md + `/api/v1/services` endpoint |
| DeFi integrations | Atomic swaps cross-chain via HTLCs |

---

## Quick Start

```bash
# 1. Clone and install
git clone https://github.com/ericmt-98/micopay-mvp
cd micopay-mvp
npm install

# 2. Set environment variables
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env — add ANTHROPIC_API_KEY

# 3. Start API (port 3000)
cd apps/api && npm run dev

# 4. Start dashboard (port 5173)
cd apps/web && npm run dev

# 5. Run the demo
bash scripts/demo.sh
```

---

## Services (x402)

| Service | Endpoint | Price |
|---------|----------|-------|
| Service Discovery | `GET /api/v1/services` | **free** |
| SKILL.md | `GET /skill.md` | **free** |
| Fund Stats | `GET /api/v1/fund/stats` | **free** |
| Swap Search | `GET /api/v1/swaps/search` | $0.001 |
| Reputation | `GET /api/v1/reputation/:address` | $0.0005 |
| Swap Plan (Claude) | `POST /api/v1/swaps/plan` | $0.01 |
| Swap Execute | `POST /api/v1/swaps/execute` | $0.05 |
| Swap Status | `GET /api/v1/swaps/:id/status` | $0.0001 |
| **Fund Micopay** | `POST /api/v1/fund` | **$0.10** |

### x402 Flow

```
Agent → GET /api/v1/swaps/search
      ← 402 { challenge: { amount_usdc: "0.001", pay_to: "G...", memo: "micopay:swap_search" } }

Agent builds Stellar USDC payment tx, signs it

Agent → GET /api/v1/swaps/search
        X-Payment: <signed_xdr>
      ← 200 { counterparties: [...] }
```

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  AI Agent / User                 │
└────────────────────────┬────────────────────────┘
                         │ natural language intent
                         ▼
┌─────────────────────────────────────────────────┐
│         Intent Parser (Claude Haiku)             │
│  • Understands intent                            │
│  • Calls tools: search_swaps, get_reputation     │
│  • Produces SwapPlan JSON                        │
│  • NEVER touches funds                           │
└────────────────────────┬────────────────────────┘
                         │ SwapPlan
                         ▼
┌─────────────────────────────────────────────────┐
│         Swap Executor (TypeScript, no LLM)       │
│  • Follows plan exactly                          │
│  • Lock on chain A → monitor chain B             │
│  • Release (reveals secret) → counterparty claims│
│  • Refund on timeout                             │
└──────────┬──────────────────────┬───────────────┘
           │                      │
           ▼                      ▼
┌──────────────────┐  ┌──────────────────────────┐
│ AtomicSwapHTLC   │  │ AtomicSwapHTLC            │
│ (Soroban chain A)│  │ (chain B — or mock)       │
│                  │  │                           │
│ lock()           │  │ lock()                    │
│ release() ←secret│  │ release() ← secret public │
│ refund()         │  │ refund()                  │
└──────────────────┘  └──────────────────────────┘
```

### Key design principles

1. **Payment IS authentication** — x402 replaces API keys
2. **LLM plans, code executes** — Claude never touches funds
3. **Two contracts, one trait** — `HashedTimeLock` shared between `AtomicSwapHTLC` and `MicopayEscrow`
4. **Cross-chain without bridges** — atomicity from cryptography, not custodians
5. **The project funds itself** — Fund Micopay proves x402 works in 10 seconds

---

## Repository Structure

```
micopay-mvp/
├── contracts/
│   ├── htlc-core/          # HashedTimeLock trait (Rust)
│   ├── atomic-swap/        # Clean HTLC for cross-chain swaps
│   └── micopay-escrow/     # P2P escrow with platform fee
├── packages/
│   ├── types/              # Shared TypeScript types
│   └── sdk/                # AtomicSwapClient + Stellar helpers
├── apps/
│   ├── api/                # Fastify API with x402 middleware + Claude agent
│   ├── agent/              # Claude intent parser + SwapExecutor
│   └── web/                # React dashboard
├── skill/
│   └── SKILL.md            # OpenClaw agent skill definition
└── scripts/
    ├── demo.sh             # Full demo flow
    └── deploy-contracts.sh # Deploy to testnet
```

---

## Contracts (Soroban/Rust)

**32 unit tests, all passing:**

```bash
cd contracts && cargo test
# atomic-swap:    15 tests ✓
# micopay-escrow: 17 tests ✓
# htlc-core:       0 tests (trait-only crate)
```

### AtomicSwapHTLC — `contracts/atomic-swap`

Clean HTLC for cross-chain atomic swaps. No fees, no business logic.

| Function | Description |
|----------|-------------|
| `lock(initiator, counterparty, token, amount, secret_hash, timeout_ledgers)` | Lock funds. Returns `swap_id = sha256(secret_hash)` |
| `release(swap_id, secret)` | Release to counterparty. Publishes secret in event for cross-chain coordination. |
| `refund(swap_id)` | Permissionless refund after timeout. |
| `get_swap(swap_id)` | View swap state. |

### MicopayEscrow — `contracts/micopay-escrow`

P2P escrow with platform fee collection.

| Function | Description |
|----------|-------------|
| `initialize(admin, token_id, platform_wallet)` | One-time setup. |
| `lock(seller, buyer, amount, platform_fee, secret_hash, timeout_minutes)` | Lock funds + fee in escrow. |
| `release(trade_id, secret)` | Pay buyer `amount`, pay platform `fee`. |
| `refund(trade_id)` | Return `amount + fee` to seller after timeout. |
| `get_trade(trade_id)` | View trade state. |

### HashedTimeLock trait — `contracts/htlc-core`

Shared interface and constants used by both contracts:

```rust
pub const MIN_TIMEOUT_LEDGERS: u32 = 60;   // ~5 min
pub const TTL_MIN: u32 = 17_280;            // ~1 day
pub const TTL_EXTEND: u32 = 518_400;        // ~30 days
```

---

## Agent (Claude)

The intent parser lives in `apps/api/src/routes/agent.ts` and uses Claude Haiku to:

1. Parse natural language swap intent
2. Call real API tools (`search_swaps`, `get_reputation`, `calculate_timeouts`)
3. Produce a structured `SwapPlan` JSON

**Claude never executes transactions.** The SwapExecutor (`apps/agent/src/executor.ts`) follows the plan deterministically.

```bash
# Test the agent (requires ANTHROPIC_API_KEY + credits)
curl -X POST http://localhost:3000/api/v1/swaps/plan \
  -H "X-Payment: mock:MYAGENT:0.01" \
  -H "Content-Type: application/json" \
  -d '{"intent": "swap 50 USDC for XLM, best rate", "user_address": "G..."}'
```

---

## Fund Micopay — The Meta-Demo

An agent funds the project using the same x402 infrastructure it's demonstrating.

```bash
# Step 1: Get challenge (no payment yet)
curl -X POST http://localhost:3000/api/v1/fund

# Step 2: Pay and fund
curl -X POST http://localhost:3000/api/v1/fund \
  -H "X-Payment: <signed_stellar_xdr>" \
  -H "Content-Type: application/json" \
  -d '{"message": "x402 works!"}'
```

Response includes `stellar_expert_url` for on-chain verification. The dashboard updates live every 5 seconds.

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

---

## Team

Built for **Stellar Hacks: Agents** (DoraHacks 2026) by Eric + Stichui.

Built with Claude Haiku 4.5, Soroban SDK, Stellar SDK, Fastify, React, Turborepo.
