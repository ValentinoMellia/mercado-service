# Mercado Service — Backend Context (Tema 09)

> **Working language rule:** everything in the codebase must be in **English**
> — package names, class names, method/variable names, comments, commit
> messages, README, config keys. This document itself is in English on
> purpose so it can be dropped straight into the repo (e.g. as `CLAUDE.md`
> or `CONTEXT.md`) and read literally by tooling. The team's own
> conversations, tickets and business docs are in Spanish (Rioplatense);
> that doesn't change — only the code artifact does.

## 1. What this service is

`mercado-service` is the backend for **Tema 09 — Mercado**, one of ~11
microservices in a gamified e-learning platform ("Aula Quest") built as a
university group project (TUP, UTN FRC — Programación III).

Domain: catalog, purchase, and inventory of gamification items within a
course-cohort. Mercado **does not own any coin balance** — it reserves and
confirms coins against the Banco service (Tema 08), which is the sole
owner of the ledger.

This repo is **backend only**. No frontend (Angular) code lives here.
No `docker-compose` yet — infrastructure wiring comes later; for now just
leave placeholders (e.g. datasource env vars) so it's easy to plug in.

## 2. Stack

- Java 17
- Spring Boot 3.5.x (Maven)
- Spring Web, Spring Data JPA
- MySQL (own database, not shared with any other service)
- Spring Kafka (async event bus — this is the primary integration
  mechanism with other services)
- Bean Validation, Lombok, Spring Boot Actuator, DevTools

## 3. Non-negotiable platform rules

These apply platform-wide, not just to this service:

1. API Gateway is the **only** entry point — no direct client-to-service
   calls.
2. Services register dynamically (service discovery).
3. **No direct service-to-service communication.** Everything else goes
   through the event bus (Kafka), with one narrow synchronous exception
   noted below.
4. Each service owns its **own database**. No shared schemas.
5. Cross-service communication is **asynchronous** (event bus), except
   where explicitly agreed otherwise.
6. Every entity has a **single owner** service. Mercado owns items,
   catalog, and inventory. It does not own coins, lives, or streaks.

Additional cross-cutting requirements from the PRD:
- Mandatory soft delete (logical delete) on everything.
- Every resource is scoped to `cursoCohorteId` — never a global query.
- Equipment/items are single-use per the item's rules.
- A student can have at most 3 active lives at once (owned by another
  service, Mercado just sells the item).
- MVP scope is desktop-only, no responsive/mobile requirement.

## 4. The one synchronous exception (consumption flow)

Everything is async **except** the actual moment an item is consumed.
Flow:

1. On challenge start, the consuming service takes a **snapshot** of the
   student's available effects (read-only, no reservation, no locking).
2. The student plays with zero added latency using that snapshot.
3. On the actual decision point (e.g. final failed attempt), the
   consuming service makes a **synchronous** `POST consume-effect` call to
   Mercado.
4. Mercado is the one who **decides and atomically consumes** the item
   (not the caller) — this avoids a double-spend race when a student has
   two challenges open in parallel.
5. Mercado responds `applied: true/false`.
6. The caller acts on that result (e.g. decrements a life or not).
7. Mercado publishes `ITEM_CONSUMED` as a fire-and-forget notification
   event afterward.

The contract with other services is expressed as a **closed vocabulary of
verbs** (e.g. `ABSORB_FAILURE`, `PRESERVE_STREAK`), never as the concrete
item catalog. Adding an item that reuses an existing verb requires no
negotiation with anyone; introducing a new verb does.

## 5. Bank (Tema 08) contract summary

- Communication **exclusively via Kafka**, two topics, at-least-once
  delivery. No REST endpoints for holds.
- Idempotency is by `eventId` in the envelope, not by any header.
- Commands Mercado sends: `HOLD_CREATE_REQUESTED`,
  `HOLD_INCREASE_REQUESTED`, `HOLD_CONFIRM_REQUESTED`,
  `HOLD_RELEASE_REQUESTED`.
- Events Bank sends back: `HOLD_CREATED`, `HOLD_REJECTED`,
  `HOLD_CONFIRMED`, `HOLD_RELEASED`, `HOLD_EXPIRED`, plus rejections.
- Commands never carry `accountId` or item data. `ttlSeconds` is not sent
  on a direct purchase — Bank decides it and returns it as `expiresAt`.
- `HOLD_EXPIRED` has no correlation id — correlate by `holdId`.
- Only `HOLD_NOT_FOUND` may be retried, and only once.
- `HOLD_ALREADY_EXISTS` is keyed by account + `orderId`, which is what
  gives "one bid per student per auction" for free.

## 6. Contract conventions (apply to everything Mercado exposes/consumes)

| Aspect | Rule |
|---|---|
| Identifiers | UUID v4. Exception: `orderId` prefixed `purchase-` / `auction-`. |
| Dates | ISO 8601 UTC with trailing `Z`. |
| Enums | `UPPER_SNAKE_CASE`, closed vocabulary. |
| Absent value | Omit the field. Never `null` or `""`. An empty list is fine to send. |
| Money | Integer coin amount, never decimals. |
| Versioning | `eventVersion` in the envelope; `/api/v1/` in REST routes. |
| Errors | `{ errorCode, message, traceId }` on every 4xx/5xx. `errorCode` is for the other team's code, `message` is for a human. |

Rule of thumb: the requester supplies context, the responder supplies
facts about its own domain. Never return instructions telling another
service what to do.

## 7. Suggested package layout (package-by-feature)

```
src/main/java/ar/edu/utn/frc/mercado/
├── catalog/            # items, tiers, prices
├── inventory/          # what each student holds
├── purchase/           # direct-purchase flow, orderId
├── consumption/        # verbs/effects, snapshot, consume-effect
├── auctions/           # Phase 3 placeholder, empty for now
├── bus/
│   ├── events/          # event/command contracts
│   ├── producers/
│   └── consumers/
├── integration/
│   └── bank/            # HOLD_* commands per Bank's contract
├── common/              # shared exceptions, base DTOs, ApiError
└── config/              # KafkaConfig, JpaConfig, etc.

src/main/resources/
├── application.yml          # MySQL datasource via env vars, no compose yet
└── application-dev.yml
```

## 8. Open items that affect the code (don't hardcode around these yet)

- Two competing item catalogs exist and are not yet unified — don't bake
  a fixed item list into the code; keep the catalog data-driven.
- Kafka topic naming/retention is owned by Tema 11 and isn't finalized.
- Whether the balance-read endpoint from Bank returns total, available,
  or both is still open — needed for auctions.
- Contract language (English vs Spanish for payload field names) is
  still an open team decision — this doc defaults to English for the
  code itself regardless of that outcome.
