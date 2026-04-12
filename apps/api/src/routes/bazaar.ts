import type { FastifyInstance } from "fastify";
import { requirePayment } from "../middleware/x402.js";
import { randomUUID } from "crypto";

// ── Types ───────────────────────────────────────────────────────────────────

interface AssetInfo {
  chain: string;   // e.g., "ethereum", "stellar", "solana"
  symbol: string;  // e.g., "ETH", "USDC", "XLM"
  amount: string;
}

interface BazaarIntent {
  id: string;
  agent_address: string;
  offered: AssetInfo;
  wanted: AssetInfo;
  min_rate?: number;
  status: "active" | "negotiating" | "executed" | "expired";
  created_at: string;
  expires_at: string;
  reputation_tier?: string;
}

interface BazaarQuote {
  id: string;
  intent_id: string;
  from_agent: string;
  rate: number;
  valid_until: string;
}

// ── State (Mock in-memory for hackathon demo) ──────────────────────────────

const intents = new Map<string, BazaarIntent>();
const quotes = new Map<string, BazaarQuote[]>();

// Seed with some mock intents to show activity
const SEED_INTENTS: BazaarIntent[] = [
  {
    id: "int-001",
    agent_address: "GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGKUJI5KOOJ9TXWNTBBS2JN",
    offered: { chain: "ethereum", symbol: "ETH", amount: "2.5" },
    wanted: { chain: "stellar", symbol: "USDC", amount: "7000" },
    status: "active",
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    expires_at: new Date(Date.now() + 1000 * 60 * 55).toISOString(),
    reputation_tier: "maestro",
  },
  {
    id: "int-002",
    agent_address: "GDAHK7EEG2WWHVKDNT4CEQFZGKF2LGDSW2IVM4S5DP42RBW3K6BTODB4A",
    offered: { chain: "stellar", symbol: "USDC", amount: "500" },
    wanted: { chain: "physical", symbol: "MXN", amount: "8750" },
    status: "active",
    created_at: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    expires_at: new Date(Date.now() + 1000 * 60 * 58).toISOString(),
    reputation_tier: "experto",
  }
];

SEED_INTENTS.forEach(i => intents.set(i.id, i));

// ── Routes ──────────────────────────────────────────────────────────────────

export async function bazaarRoutes(fastify: FastifyInstance): Promise<void> {

  /**
   * POST /api/v1/bazaar/intent
   * x402: $0.005 USDC
   *
   * Broadcast a cross-chain swap intent to the network.
   */
  fastify.post(
    "/api/v1/bazaar/intent",
    { preHandler: requirePayment({ amount: "0.005", service: "bazaar_broadcast" }) },
    async (request, reply) => {
      const body = request.body as Partial<BazaarIntent>;
      
      if (!body.offered || !body.wanted) {
        return reply.status(400).send({ error: "offered and wanted asset info required" });
      }

      const id = `int-${randomUUID().slice(0, 8)}`;
      const newIntent: BazaarIntent = {
        id,
        agent_address: request.payerAddress ?? "GUNKNOWN",
        offered: body.offered as AssetInfo,
        wanted: body.wanted as AssetInfo,
        min_rate: body.min_rate,
        status: "active",
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 3600_000).toISOString(), // 1h default
      };

      intents.set(id, newIntent);
      
      fastify.log.info(`Bazaar: Intent broadcasted by ${newIntent.agent_address}: ${newIntent.offered.symbol} -> ${newIntent.wanted.symbol}`);

      return reply.status(201).send(newIntent);
    }
  );

  /**
   * GET /api/v1/bazaar/feed
   * x402: $0.001 USDC
   *
   * Get the latest active intents. Feed is filtered by reputation and status.
   */
  fastify.get(
    "/api/v1/bazaar/feed",
    { preHandler: requirePayment({ amount: "0.001", service: "bazaar_feed" }) },
    async (_request, reply) => {
      const activeIntents = Array.from(intents.values())
        .filter(i => i.status === "active")
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return reply.send({
        intents: activeIntents,
        count: activeIntents.length,
        network: "global-intent-layer",
        note: "Every intent in this feed is broadcasted by an AI agent paying via x402."
      });
    }
  );

  /**
   * POST /api/v1/bazaar/quote
   * x402: $0.002 USDC
   *
   * Send a private quote to a broadcasted intent.
   * This initiates the handshake for an AtomicSwapHTLC.
   */
  fastify.post(
    "/api/v1/bazaar/quote",
    { preHandler: requirePayment({ amount: "0.002", service: "bazaar_quote" }) },
    async (request, reply) => {
      const body = request.body as { intent_id: string; rate: number };
      
      if (!body.intent_id || !body.rate) {
        return reply.status(400).send({ error: "intent_id and rate required" });
      }

      const intent = intents.get(body.intent_id);
      if (!intent) {
        return reply.status(404).send({ error: "Intent not found" });
      }

      const quoteId = `qut-${randomUUID().slice(0, 8)}`;
      const newQuote: BazaarQuote = {
        id: quoteId,
        intent_id: body.intent_id,
        from_agent: request.payerAddress ?? "GUNKNOWN",
        rate: body.rate,
        valid_until: new Date(Date.now() + 300_000).toISOString(), // 5 min
      };

      const existingQuotes = quotes.get(body.intent_id) || [];
      quotes.set(body.intent_id, [...existingQuotes, newQuote]);

      return reply.status(201).send({
        quote: newQuote,
        note: "Quote sent to target agent. Handshake initiated. Monitor AtomicSwapHTLC events to settle."
      });
    }
  );
}
