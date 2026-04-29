-- Migration 001: Persistent Stellar tx-hash replay protection
-- Run with: psql $DATABASE_URL -f micopay/sql/migrations/001_processed_tx.sql
--
-- This table is the single source of truth for which Stellar transaction
-- hashes the backend has already acted on.  The PRIMARY KEY on tx_hash
-- provides the uniqueness constraint that makes INSERT … ON CONFLICT DO
-- NOTHING atomic even under concurrent requests.
--
-- Policy
--   • Every code path that credits a payment (trade/lock, trade/complete)
--     must insert here *before* mutating any other table.
--   • Rows are never deleted — the log is append-only so that an audit
--     trail survives a server restart.

CREATE TABLE IF NOT EXISTS processed_tx (
  tx_hash       VARCHAR(64) PRIMARY KEY,   -- 64-char hex Stellar tx hash
  source_route  VARCHAR(64) NOT NULL,      -- e.g. 'trade/lock', 'trade/complete'
  user_id       UUID        NOT NULL,      -- authenticated user who submitted the tx
  processed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index lets ops quickly list all hashes for a given user
CREATE INDEX IF NOT EXISTS idx_processed_tx_user
  ON processed_tx (user_id, processed_at DESC);
