---
description: Default guidance for composing RPC-style Cadence transactions to interact with Flow DeFi protocols (staking, rewards, swaps, LP). Suitable as a general default for protocol interactions.
globs:
  - cadence/**/*.cdc
  - docs/**/*.md
  - flow.json
alwaysApply: false
---
# Cursor Agent Rules

These rules guide AI agents to generate correct, safe Cadence transactions using DeFiActions connectors.

## Goal Translation
- Map prompts to a connector chain.
  - Restake rewards: `PoolRewardsSource -> SwapSource(Zapper) -> PoolSink`.
- Identify token types from prompt and map to params:
  - Reward token → `rewardTokenType`
  - Pair token for LP → `pairTokenType`
  - If user mentions “minimum restake increase” → `minimumRestakedAmount`.

## Imports
Always use string imports:
```cadence
import "FungibleToken"
import "DeFiActions"
import "SwapConnectors"
import "IncrementFiStakingConnectors"
import "IncrementFiPoolLiquidityConnectors"
import "Staking"
```

## Transaction Block Order
- Write in this physical order for readability: `prepare` → `pre` → `post` → `execute`.
- Readers can audit inputs and guarantees before scanning execution logic.

## Required Params (Restake)
- `pid: UInt64`
- `rewardTokenType: Type`
- `pairTokenType: Type`
- `minimumRestakedAmount: UFix64`

## Transaction Skeleton
- Prepare:
  - Issue `Capability<&Staking.UserCertificate>`.
  - Borrow pool via `IncrementFiStakingConnectors.borrowPool(pid:)`.
  - Record `startingStake` from `pool.getUserInfo(address:)`.
- Execute:
  - `PoolRewardsSource(userCertificate, pid, uniqueID: nil)`.
  - `Zapper(token0Type: rewardTokenType, token1Type: pairTokenType, stableMode: false)`.
  - `SwapConnectors.SwapSource(swapper: zapper, source: rewards, uniqueID: nil)`.
  - `PoolSink(pid: pid, staker: userCertificateCap.address, uniqueID: nil)`.
  - Size withdraws by the target sink’s capacity: `withdrawAvailable(maxAmount: poolSink.minimumCapacity())`.
  - Deposit, assert vault empty, destroy.
- Post:
  - Ensure `newStake >= startingStake + minimumRestakedAmount`.

## Safety Invariants
- Pre/post blocks contain single boolean expressions only.
- Use `depositCapacity` and `withdrawAvailable` for graceful handling.
- Verify `vault.balance == 0.0` before `destroy`.
- Do not resolve protocol addresses in transactions if a connector provides helpers.

## Connector Facts
- `IncrementFiStakingConnectors.PoolSink(pid, staker, uniqueID?)` infers `vaultType` from pool.
- `IncrementFiStakingConnectors.PoolRewardsSource(userCertificate, pid, uniqueID?)` outputs inferred reward `vaultType`.
- `IncrementFiPoolLiquidityConnectors.Zapper` is a `Swapper`; use `swap(quote:inVault:)` and `swapBack` as needed. There is no separate `UnZapper` type.
- `SwapConnectors.SwapSource(swapper, source, uniqueID?)` exposes post-conversion as a `Source`.

## Common Variations
- Multiple reward tokens: supply `overflowSinks` mapping to route non-primary slices.  // Note: when supported by specific pool connectors
- Stable pool: set `stableMode: true` in `Zapper`.
- Quote-driven caps: prefer `sink.minimumCapacity()`/`source.minimumAvailable()`; avoid manual slippage math.

## Prompt-to-Params Examples
- “Claim stFLOW rewards, swap to FLOW-stFLOW LP, and restake” →
  - `rewardTokenType = Type<@StFlowToken.Vault>()`
  - `pairTokenType = Type<@FlowToken.Vault>()`
  - `minimumRestakedAmount` from user or default small value (e.g., `0.0` if not provided).

## Code Style
- Use named arguments.
- Keep variable names descriptive: `poolRewardsSource`, `zapper`, `lpTokenPoolRewardsSource`, `poolSink`.
- Prefer early returns and minimal nesting inside connector implementations (transactions use assertions instead).

## Sanity Checklist
- Imports present and string-based.
- Capability issuance and borrows succeed or `panic` with context.
- Connector inputs/outputs types align: `source.getSourceType()` == `swapper.inType()`, `swapper.outType()` == `sink.getSinkType()` (or rely on `SwapSource` construction preconditions).
- Post-condition guards the intended outcome (`minimumRestakedAmount`).

---
See also: [`connectors.md`](./connectors.md), [`composition.md`](./composition.md), [`quick-checklist.md`](./quick-checklist.md), [`workflows/restaking-workflow.md`](./workflows/restaking-workflow.md) 