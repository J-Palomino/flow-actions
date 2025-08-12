# Quick Checklist

## Imports
- Use `import "ContractName"` format only.
- Include all required contract imports.

## Transaction Order (readability)
- Write blocks in this order: `prepare` → `pre` → `post` → `execute`.
- Let reviewers grasp setup and guarantees before execution logic.

## Preconditions/Postconditions
- Single boolean expression per pre/post block.
- Use `assert()` for multi-step validation in execute.

## Capabilities & Addresses
- Validate capabilities before use.
- Pass addresses as parameters only when you must resolve third-party capabilities directly.
- Prefer connector helpers (e.g., `borrowPool(pid:)`) over manual address resolution.

## Resource Safety
- Always ensure `vault.balance == 0.0` before `destroy`.
- Use `withdrawAvailable` and `depositCapacity` (never raw deposit paths).

## Build the Chain (Restake)
- Source: `PoolRewardsSource(userCertificate, pid)`
- Swapper: `Zapper(token0Type: derived token0 from pair, token1Type: derived token1 from pair, stableMode: pair.isStableswap)`
- Wrap: `SwapConnectors.SwapSource(swapper, source)`
- Sink: `PoolSink(pid: pid, staker: userAddress)`

## Validate
- `source.minimumAvailable() > 0.0`
- `sink.minimumCapacity() > 0.0`
- Post: `newStake >= startingStake + expectedStakeIncrease`

## Test
- Zero amounts and `UFix64.max`
- Invalid capabilities
- Inactive pool
- Post-condition using computed `expectedStakeIncrease`

## Links
- Restake Workflow: [`workflows/restaking-workflow.md`](./workflows/restaking-workflow.md)
- Transaction Template: [`transaction-templates.md`](./transaction-templates.md#complete-restaking-workflow)
- Connectors: [`connectors.md`](./connectors.md)
- Agent Rules: [`agent-rules.md`](./agent-rules.md)
