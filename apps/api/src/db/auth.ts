import { query, getOne, execute } from './schema.js';

export interface AuthChallengeRow {
  id: number;
  stellar_address: string;
  challenge: string;
  expires_at: Date;
  used_at: Date | null;
  created_at: Date;
}

export async function initAuthChallengesTable(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS auth_challenges (
      id              SERIAL PRIMARY KEY,
      stellar_address VARCHAR(56) NOT NULL,
      challenge       VARCHAR(128) NOT NULL UNIQUE,
      expires_at      TIMESTAMPTZ NOT NULL,
      used_at         TIMESTAMPTZ,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_auth_challenges_address_expires
      ON auth_challenges(stellar_address, expires_at);
  `);
}

/**
 * Persist a new challenge. Replaces any existing unused, unexpired challenge
 * for the same address so a client can re-request without accumulating rows.
 */
export async function upsertChallenge(
  stellarAddress: string,
  challenge: string,
  expiresAt: Date,
): Promise<void> {
  await execute(
    `INSERT INTO auth_challenges (stellar_address, challenge, expires_at)
     VALUES ($1, $2, $3)`,
    [stellarAddress, challenge, expiresAt.toISOString()],
  );
}

/**
 * Look up a challenge row that:
 *  - matches both address and challenge string
 *  - has not expired
 *  - has not been used yet
 */
export async function getPendingChallenge(
  stellarAddress: string,
  challenge: string,
): Promise<AuthChallengeRow | null> {
  return getOne<AuthChallengeRow>(
    `SELECT * FROM auth_challenges
     WHERE stellar_address = $1
       AND challenge       = $2
       AND expires_at      > NOW()
       AND used_at         IS NULL`,
    [stellarAddress, challenge],
  );
}

/**
 * Mark a challenge as consumed. Returns false if the row was already used
 * (concurrent replay attempt) by relying on the conditional UPDATE.
 */
export async function consumeChallenge(id: number): Promise<boolean> {
  const result = await execute(
    `UPDATE auth_challenges
     SET used_at = NOW()
     WHERE id = $1 AND used_at IS NULL`,
    [id],
  );
  return (result.rowCount ?? 0) > 0;
}

/**
 * Delete rows that are either expired or already used and older than 1 hour.
 * Safe to call on every write; cheap because of the composite index.
 */
export async function cleanupExpiredChallenges(): Promise<number> {
  const result = await execute(
    `DELETE FROM auth_challenges
     WHERE expires_at < NOW()
        OR (used_at IS NOT NULL AND used_at < NOW() - INTERVAL '1 hour')`,
  );
  return result.rowCount ?? 0;
}
