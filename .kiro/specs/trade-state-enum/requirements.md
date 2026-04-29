# Requirements Document

## Introduction

The MicoPay protocol currently represents trade lifecycle states as raw string literals in both the backend (SQL queries, service logic) and the frontend (TypeScript interfaces, component logic). There is no single source of truth: a rename on one side silently breaks the other, and the TypeScript type system cannot catch the mismatch.

This feature introduces a canonical `TradeState` enum defined once in the existing `@micopay/types` shared package. Both the backend (`micopay/backend`) and the frontend (`micopay/frontend`) will import from that package. All raw status string literals outside the enum definition file will be eliminated. A state machine diagram will be added to the documentation.

The canonical states are: `pending`, `locked`, `revealing`, `completed`, `cancelled`, `expired`, `refunded`.

> **Note on `revealed`:** The issue brief lists `revealed` as a candidate state. The current SQL schema and backend service do not use `revealed` — the transition goes directly from `revealing` to `completed`. This requirements document reflects the states that actually exist in the codebase. If `revealed` is needed in the future it can be added as a separate change.

---

## Glossary

- **TradeState**: The canonical union type / const-object enum exported from `@micopay/types` that enumerates every valid trade lifecycle state.
- **Trade_State_Enum_File**: The single TypeScript source file inside `packages/types/src/` that defines and exports `TradeState`.
- **Backend**: The Fastify/Node.js application located at `micopay/backend/`.
- **Frontend**: The Vite/React application located at `micopay/frontend/`.
- **Shared_Package**: The `@micopay/types` package located at `packages/types/`.
- **State_Machine**: The directed graph of valid `TradeState` transitions enforced by the Backend.
- **Raw_Status_String**: Any string literal such as `'pending'`, `'locked'`, etc. that appears outside the Trade_State_Enum_File.
- **Grep_Check**: A search of the repository source tree for Raw_Status_String occurrences outside the Trade_State_Enum_File.

---

## Requirements

### Requirement 1: Canonical TradeState Definition

**User Story:** As a developer, I want a single exported type that names every valid trade state, so that renaming a state is a one-line change that the TypeScript compiler propagates everywhere.

#### Acceptance Criteria

1. THE Shared_Package SHALL export a `TradeState` type whose members are exactly: `'pending'`, `'locked'`, `'revealing'`, `'completed'`, `'cancelled'`, `'expired'`, `'refunded'`.
2. THE Trade_State_Enum_File SHALL be the only file in the repository that contains the string literals `'pending'`, `'locked'`, `'revealing'`, `'completed'`, `'cancelled'`, `'expired'`, `'refunded'` as state value definitions.
3. THE Shared_Package SHALL re-export `TradeState` from its top-level `index.ts` so that consumers can import it as `import { TradeState } from '@micopay/types'`.
4. WHEN a developer adds a new state value to `TradeState`, THE TypeScript_Compiler SHALL produce a type error at every switch/conditional that does not handle the new value (exhaustiveness checking).

---

### Requirement 2: Backend Uses TradeState

**User Story:** As a backend developer, I want the trade service and routes to reference `TradeState` values instead of string literals, so that the compiler catches any state name mismatch at build time.

#### Acceptance Criteria

1. WHEN the Backend serializes a trade record to an API response, THE Backend SHALL produce a `status` field whose value is a member of `TradeState`.
2. THE Backend trade service (`trade.service.ts`) SHALL import `TradeState` from `@micopay/types` and use its values in all status comparisons and SQL `SET status = …` statements.
3. THE Backend SQL schema (`init.sql`) SHALL define the `status` column `CHECK` constraint using the same string values as `TradeState`.
4. IF a Raw_Status_String for a trade state appears in any Backend source file outside the Trade_State_Enum_File, THEN the Grep_Check SHALL fail the pull-request CI step.
5. WHERE the Backend has existing tests that assert on trade status values, THE Backend tests SHALL reference `TradeState` members instead of inline string literals.

---

### Requirement 3: Frontend Uses TradeState

**User Story:** As a frontend developer, I want every component and service that reads or compares a trade status to use the shared type, so that a backend state rename surfaces as a compile error rather than a silent UI bug.

#### Acceptance Criteria

1. THE Frontend `TradeData` interface (in `services/api.ts`) SHALL type the `status` field as `TradeState` instead of `string`.
2. THE Frontend `TradeHistoryItem` interface (in `services/api.ts`) SHALL type the `status` field as `TradeState` instead of `string`.
3. WHEN a Frontend component compares a trade status value, THE component SHALL use a `TradeState` member (e.g., `TradeState.completed`) rather than a Raw_Status_String.
4. IF a Raw_Status_String for a trade state appears in any Frontend source file outside the Trade_State_Enum_File, THEN the Grep_Check SHALL return zero matches.
5. THE Frontend `ClaimQR` page SHALL replace its inline `'pending' | 'accepted' | 'completed' | 'expired'` union with `TradeState` for the states that overlap, and document any `CashRequest`-specific states separately.

---

### Requirement 4: State Machine Documentation

**User Story:** As a new contributor, I want a diagram that shows every valid state transition, so that I can understand the trade lifecycle without reading the service code.

#### Acceptance Criteria

1. THE documentation directory SHALL contain a Markdown file that includes a Mermaid state diagram showing all `TradeState` values as nodes.
2. THE State_Machine diagram SHALL show every valid directed transition between states (e.g., `pending → locked`, `locked → revealing`, `revealing → completed`, `pending → cancelled`, `locked → expired`, `revealing → expired`, `locked → refunded`, `revealing → refunded`).
3. THE State_Machine diagram SHALL label each transition arrow with the actor that triggers it (Seller, Buyer, or System).
4. WHEN the `TradeState` enum is updated with a new state, THE documentation SHALL be updated in the same pull request.

---

### Requirement 5: Migration Safety

**User Story:** As a release engineer, I want a short migration note in the pull request, so that I know whether any database rows or in-flight API clients need to be updated.

#### Acceptance Criteria

1. THE pull request description SHALL include a migration note that states whether existing database rows require a data migration (they do not, because the string values are unchanged).
2. THE pull request description SHALL state that the change is backwards-compatible at the wire level (the JSON `status` field values are identical before and after).
3. THE Shared_Package build SHALL produce compiled JavaScript and declaration files so that both the Backend and Frontend can consume `TradeState` without a TypeScript project reference.
