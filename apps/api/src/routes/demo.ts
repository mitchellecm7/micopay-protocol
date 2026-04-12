import type { FastifyInstance } from "fastify";
import {
  Keypair, Asset, TransactionBuilder, Operation,
  Networks, Horizon, Memo, BASE_FEE,
} from "@stellar/stellar-sdk";

const HORIZON_URL = "https://horizon-testnet.stellar.org";
const USDC_ISSUER = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";
const USDC = new Asset("USDC", USDC_ISSUER);
const EXPLORER = "https://stellar.expert/explorer/testnet/tx";
const DEMO_MERCHANT = "GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGKUJI5KOOJ9TXWNTBBS2JN";

function getPlatformAddress(): string {
  const secret = process.env.PLATFORM_SECRET_KEY;
  if (secret) { try { return Keypair.fromSecret(secret).publicKey(); } catch {} }
  return "GDKKW2WSMQWZ63PIZBKDDBAAOBG5FP3TUHRYQ4U5RBKTFNESL5K5BJJK";
}

export async function demoRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * POST /api/v1/demo/run
   *
   * Full MicoPay demo — 4 real on-chain USDC payments, one per service:
   *   Step 1  cash_agents   $0.001  USDC  — find merchants near Roma Norte, CDMX
   *   Step 2  reputation    $0.0005 USDC  — verify Farmacia Guadalupe (tier Maestro)
   *   Step 3  cash_request  $0.010  USDC  — lock USDC, get QR for $500 MXN cash
   *   Step 4  fund_micopay  $0.100  USDC  — fund the protocol (meta-demo)
   *
   * Total: ~$0.1115 USDC. All tx hashes verifiable on stellar.expert.
   */
  fastify.post("/api/v1/demo/run", async (_request, reply) => {
    const secret = process.env.DEMO_AGENT_SECRET_KEY;
    if (!secret) {
      return reply.status(503).send({ error: "Demo agent not configured. Run scripts/setup-demo-agent.mjs first." });
    }

    const agentKP      = Keypair.fromSecret(secret);
    const agentAddress = agentKP.publicKey();
    const platformAddr = getPlatformAddress();
    const horizon      = new Horizon.Server(HORIZON_URL);
    const port         = process.env.PORT ?? "3000";
    const baseUrl      = `http://localhost:${port}`;

    const account = await horizon.loadAccount(agentAddress);

    function buildTx(amount: string, memo: string) {
      // TransactionBuilder.build() increments account.sequenceNumber internally —
      // do NOT call account.incrementSequenceNumber() manually here.
      const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
        .addOperation(Operation.payment({ destination: platformAddr, asset: USDC, amount }))
        .addMemo(Memo.text(memo.slice(0, 28)))
        .setTimeout(180)
        .build();
      tx.sign(agentKP);
      return tx;
    }

    const tx1 = buildTx("0.0010000", "micopay:cash_agents");
    const tx2 = buildTx("0.0005000", "micopay:reputation");
    const tx3 = buildTx("0.0100000", "micopay:cash_request");
    const tx4 = buildTx("0.1000000", "micopay:fund_demo");

    const steps: any[] = [];

    try {
      // Step 1 — cash_agents
      const r1 = await horizon.submitTransaction(tx1);
      const s1 = await fetch(`${baseUrl}/api/v1/cash/agents?lat=19.4195&lng=-99.1627&amount=500&limit=3`,
        { headers: { "x-payment": tx1.toXDR() } });
      steps.push({
        name: "cash_agents", description: "Find cash merchants near Roma Norte, CDMX",
        price_usdc: "0.001", tx_hash: r1.hash,
        stellar_expert_url: `${EXPLORER}/${r1.hash}`,
        result: await s1.json(),
      });

      // Step 2 — reputation
      const r2 = await horizon.submitTransaction(tx2);
      const s2 = await fetch(`${baseUrl}/api/v1/reputation/${DEMO_MERCHANT}`,
        { headers: { "x-payment": tx2.toXDR() } });
      steps.push({
        name: "reputation", description: `Verify Farmacia Guadalupe on-chain reputation`,
        price_usdc: "0.0005", tx_hash: r2.hash,
        stellar_expert_url: `${EXPLORER}/${r2.hash}`,
        result: await s2.json(),
      });

      // Step 3 — cash_request
      const r3 = await horizon.submitTransaction(tx3);
      const s3 = await fetch(`${baseUrl}/api/v1/cash/request`, {
        method: "POST",
        headers: { "x-payment": tx3.toXDR(), "Content-Type": "application/json" },
        body: JSON.stringify({ merchant_address: DEMO_MERCHANT, amount_mxn: 500 }),
      });
      steps.push({
        name: "cash_request", description: "Lock USDC → QR code for $500 MXN at Farmacia Guadalupe",
        price_usdc: "0.01", tx_hash: r3.hash,
        stellar_expert_url: `${EXPLORER}/${r3.hash}`,
        result: await s3.json(),
      });

      // Step 4 — fund_micopay
      const r4 = await horizon.submitTransaction(tx4);
      steps.push({
        name: "fund_micopay", description: "Fund the protocol that made all of this possible",
        price_usdc: "0.10", tx_hash: r4.hash,
        stellar_expert_url: `${EXPLORER}/${r4.hash}`,
        result: { message: "x402 works — protocol funds itself" },
      });

      return reply.send({
        agent_address: agentAddress,
        platform_address: platformAddr,
        total_paid_usdc: "0.1115",
        user_received: "$500 MXN en efectivo físico",
        steps,
        summary: "AI agent got physical cash in Mexico for a user — trustless, no API keys, no bank.",
      });

    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: "Demo failed", detail: String(err), steps_completed: steps });
    }
  });
}
