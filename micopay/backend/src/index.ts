import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCors from '@fastify/cors';
import { config } from './config.js';
import { authRoutes } from './routes/auth.js';
import { userRoutes } from './routes/users.js';
import { tradeRoutes } from './routes/trades.js';
import { stellarRoutes } from './routes/stellar.js';
import { defiRoutes } from './routes/defi.js';
import { AppError } from './utils/errors.js';
import { Keypair } from '@stellar/stellar-sdk';

const app = Fastify({
  // Use pino-pretty only in development, otherwise use default JSON logger
  logger: process.env.NODE_ENV === 'development' ? {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: { colorize: true },
    },
  } : true,
});

// --- Plugins ---

// CORS — Allow all origins for the hackathon deployment
app.register(fastifyCors, { 
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
});

// JWT
app.register(fastifyJwt, {
  secret: config.jwtSecret,
});

// Rate limit (optional — gracefully skip if not available)
try {
  const rateLimit = await import('@fastify/rate-limit');
  app.register(rateLimit.default, { global: false });
} catch {
  console.warn('⚠️  @fastify/rate-limit not installed, skipping rate limiting');
}

// --- Global error handler ---
app.setErrorHandler((error, request, reply) => {
  if (error instanceof AppError) {
    reply.status(error.statusCode).send({
      error: error.name,
      message: error.message,
    });
    return;
  }

  // Fastify validation errors
  if (error.validation) {
    reply.status(400).send({
      error: 'ValidationError',
      message: error.message,
    });
    return;
  }

  // Unknown errors
  request.log.error(error);
  reply.status(500).send({
    error: 'InternalServerError',
    message: 'Something went wrong',
  });
});

// --- Routes ---

app.get('/health', async () => ({
  status: 'ok',
  timestamp: new Date().toISOString(),
  mockStellar: config.mockStellar,
  configCheck: {
    hasPlatformKey: !!config.platformSecretKey,
    hasContractId: !!config.escrowContractId,
    hasDbUrl: !!config.databaseUrl,
    hasSecretKey: !!config.secretEncryptionKey,
  }
}));

// Platform account balance from Horizon (public, no auth needed)
app.get('/account/balance', async () => {
  try {
    if (!config.platformSecretKey) {
      return { xlm: '0', address: 'Billetera no configurada', status: 'setup_required' };
    }
    const keypair = Keypair.fromSecret(config.platformSecretKey);
    const address = keypair.publicKey();
    const res = await fetch(`https://horizon-testnet.stellar.org/accounts/${address}`);
    if (!res.ok) return { xlm: '0', address, status: 'not_found_on_chain' };
    const data = await res.json() as { balances: { asset_type: string; balance: string }[] };
    const xlm = data.balances.find((b) => b.asset_type === 'native')?.balance ?? '0';
    return { xlm, address, status: 'ok' };
  } catch (err: any) {
    app.log.error(`[Stellar] Balance error: ${err.message}`);
    return { xlm: '0', address: 'Error', error: err.message };
  }
});

app.register(authRoutes, { prefix: '' });
app.register(userRoutes, { prefix: '' });
app.register(tradeRoutes, { prefix: '' });
app.register(stellarRoutes, { prefix: '' });
app.register(defiRoutes, { prefix: '' });

// --- Start server ---

async function start() {
  try {
    await app.listen({ port: config.port, host: '0.0.0.0' });
    console.log(`\n🍄 Micopay MVP Backend running on http://localhost:${config.port}`);
    console.log(`   Mock Stellar: ${config.mockStellar ? 'ON (no on-chain verification)' : 'OFF (real Soroban RPC)'}`);
    console.log(`   Database: ${config.databaseUrl.replace(/\/\/.*@/, '//***@')}\n`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
