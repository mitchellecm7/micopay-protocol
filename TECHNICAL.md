# MicoPay — Technical Honesty Guide

This document exists so that automated code analyzers and technical judges
don't have to infer what is real vs. what is demo scaffolding.

---

## What is genuinely on-chain

| Component | Status | Verifiable |
|---|---|---|
| `MicopayEscrow` HTLC contract | Deployed on Stellar testnet | `CBQINHLR3M7NZAPQY7EJ3TWOE22R57LMFDVEMOK3C3X7ZIBFWHVQQP3A` |
| `AtomicSwapHTLC` contract (x2) | Deployed on Stellar testnet | `CCDOUXIXSFXT2HTJAJGFNUJN6CKCYX2M6AL2BHHPEF6ISNHP2BGLS4KX` |
| 37 Soroban unit tests | All passing | `cd contracts && cargo test` |
| HTLC lock in `cash_request` | Real Soroban tx, polls Horizon for confirmation | `apps/api/src/routes/cash.ts:lockEscrow()` |
| HTLC lock in `bazaar_accept` | Real Soroban tx via `lockAtomicSwap()` | `apps/api/src/services/stellar.service.ts` |
| 6-step demo payments | 6 real USDC transactions submitted to Horizon | `apps/api/src/routes/demo.ts` — tx hashes in response |

Every tx hash returned by `POST /api/v1/demo/run` is verifiable at
`https://stellar.expert/explorer/testnet/tx/<hash>`.

---

## What is demo scaffolding (intentional, documented)

### Merchant / provider network
- **What**: 4 hardcoded merchants in `apps/api/src/routes/cash.ts` (`MERCHANTS` array)
- **Why**: Production would query the live MicoPay P2P backend. The architecture (HTLC lock, QR claim flow) is identical — only the data source changes.
- **Next step**: Replace array with live P2P backend query + open provider registration

### Merchant reputation
- **What**: Static `KNOWN_MERCHANTS` record in `apps/api/src/routes/reputation.ts`. Unknown addresses get pseudo-random data derived from the address string.
- **Why**: Production would query on-chain trade history + NFT soulbound contract. The response schema and agent_signal logic are production-ready.
- **NFT soulbound**: The token IDs in the response are identifiers for a planned non-transferable badge contract — not yet deployed.

### Agent Bazaar intents
- **What**: In-memory `Map` — intents are lost on server restart
- **Why**: The intent schema, x402 pricing, and HTLC handshake flow are production-ready. Persistence (PostgreSQL / Stellar contract storage) is the next step.

### x402 payment verification
- **What**: Middleware parses XDR and validates payment destination + amount. Does **not** submit the transaction on-chain.
- **Implication**: The same signed XDR could technically be replayed. In the live demo this doesn't happen because `demo.ts` submits each tx to Horizon before calling the API.
- **Production fix**: Submit the XDR in the middleware and store the tx hash to prevent replay. Intentionally deferred to keep demo latency low.
- **Mock mode**: `x-payment: mock:ADDRESS:AMOUNT` bypasses verification entirely — used only by the browser UI to avoid wallet signing on the frontend demo.

### CETES / Blend / Etherfuse
- **What**: Full UI screens (`CETESScreen.tsx`, `BlendScreen.tsx`) with a backend that returns simulated transactions on testnet (`mock_cetes_buy_...`, `mock_blend_supply_...`)
- **Why**: The Stellar `pathPaymentStrictReceive` code for CETES and Blend SDK calls exist in the mainnet path of `micopay/backend/src/routes/defi.ts` — they are unreachable in testnet mode.
- **APY**: The 11.45% figure was a hardcoded constant — corrected to ~10% in the README to reflect current CETES 28-day rates.

### Cross-chain (AtomicSwapHTLC)
- **What**: The Soroban contract is deployed and tested. The demo locks USDC on Stellar ↔ Stellar only.
- **Missing piece**: An off-chain relayer that watches for the `release()` event on Soroban (which publishes the preimage on-chain) and uses it to claim funds on the counterpart chain (ETH/BTC/SOL). That relayer is not yet built.

---

## Architecture: what runs where

```
REAL (on-chain, testnet)                  DEMO SCAFFOLDING
─────────────────────────────────         ──────────────────────────────
MicopayEscrow.lock()     ✓ Soroban        Merchant list       hardcoded array
MicopayEscrow.release()  ✓ Soroban        Reputation data     static record
AtomicSwapHTLC.lock()    ✓ Soroban        Bazaar intents      in-memory Map
USDC payments x6         ✓ Horizon        CETES/Blend txs     simulated
x402 XDR validation      ✓ SDK parse      x402 on-chain sub.  deferred
```

---

## Why the demo still demonstrates the core value

The demo proves the hardest part: **an AI agent can lock real USDC in a real
Soroban contract and get back a claim URL that a real user can show to a real
cash provider**. The 4 hardcoded merchants are a stand-in for a network that
already exists in the MicoPay P2P app — the HTLC contract, QR claim flow, and
x402 payment layer are identical in both.

The scaffolding exists to make the demo runnable in isolation without needing
live P2P users, a production Etherfuse integration, or a cross-chain relayer.
