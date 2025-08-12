## 👋 Welcome to the DeFiActions Scaffold

This repository is a scaffold for building with Flow Actions (DeFiActions) and includes AI-friendly guidance for composing safe Cadence transactions from standardized connectors.

- **What’s included**:
  - Minimal Flow project with dependencies for DeFiActions and IncrementFi connectors
  - Example transaction: Claim → Zap → Restake for IncrementFi LP rewards
  - Opinionated safety/style rules for agent-assisted transaction composition

References:
- FLIP-338: Flow Actions – composable standards for protocols ([onflow/FLIPs](https://github.com/onflow/FLIPs))
- DeFiActions repo: [onflow/DeFiActions](https://github.com/onflow/DeFiActions)

## 🔨 Prerequisites

- Flow CLI: install from the [Flow CLI docs](https://developers.flow.com/tools/flow-cli/install)
- VS Code + Cadence extension (recommended): [Cadence Extension](https://marketplace.visualstudio.com/items?itemName=onflow.cadence)

## 📦 Project Structure

- `flow.json` – Project configuration with DeFiActions/IncrementFi dependencies
- `cadence/contracts/` – Example contract (Counter)
- `cadence/scripts/` – Example read-only script
- `cadence/transactions/` – Transactions, including the IncrementFi restake example
- `cadence/tests/` – Example tests

Key example:
- `cadence/transactions/IncrementFi_Restake.cdc` – Claims IncrementFi farm rewards, zaps to LP, and restakes back into the same pool using DeFiActions connectors.

## ⚙️ Setup

You can run locally on the emulator or target testnet/mainnet. String-based imports resolve when the target network is running and dependencies are deployed or aliased in `flow.json`.

### Option A: Emulator (local)

1) Start the emulator (terminal A):
```bash
flow emulator start --init --simple
```

2) Deploy configured contracts (terminal B):
```bash
flow project deploy --network emulator
```

Notes:
- This deploys the dependencies listed under `deployments.emulator` in `flow.json` to the local dev account.
- Some protocol state (pairs/pools) may not exist on emulator by default; transactions that depend on live IncrementFi state may require custom local bootstrap.

### Option B: Testnet (recommended for live protocol state)

1) Create or configure a testnet account in `flow.json` (or via `flow accounts create --network testnet`).
2) Ensure dependencies in `flow.json` include `testnet` aliases (this scaffold includes many prefilled).
3) No local deploy is required for contracts that already exist on testnet; imports use the configured addresses.

## ▶️ Run the IncrementFi Restake Transaction

Transaction: `cadence/transactions/IncrementFi_Restake.cdc`

Purpose:
- Claim pending farm rewards → Zap to LP → Stake LP back to the same pool

Parameters:
- `pid: UInt64` – IncrementFi pool ID

Emulator example (after deploy):
```bash
flow transactions send cadence/transactions/IncrementFi_Restake.cdc \
  --network emulator \
  --signer emulator-account \
  --args-json '[{"type":"UInt64","value":"1"}]'
```

Testnet example (replace `testnet-account` with your signer alias):
```bash
flow transactions send cadence/transactions/IncrementFi_Restake.cdc \
  --network testnet \
  --signer testnet-account \
  --args-json '[{"type":"UInt64","value":"<POOL_PID>"}]'
```

Requirements:
- Signer must have `Staking.UserCertificate` at `Staking.UserCertificateStoragePath`.
- `pid` must be a valid pool with rewards and a corresponding pair.

## 🧭 Agent-Friendly Rules (for AI-assisted generation)

Minimal restake flow uses string imports and standardized connectors:
```cadence
import "FungibleToken"
import "DeFiActions"
import "SwapConnectors"
import "IncrementFiStakingConnectors"
import "IncrementFiPoolLiquidityConnectors"
import "Staking"
```

Core composition (Claim → Zap → Stake):
- Source: `IncrementFiStakingConnectors.PoolRewardsSource`
- Swapper: `IncrementFiPoolLiquidityConnectors.Zapper` (token types and `stableMode` from pair)
- SwapSource: `SwapConnectors.SwapSource(swapper, source)`
- Sink: `IncrementFiStakingConnectors.PoolSink`

Safety invariants to follow:
- Size withdraws by sink capacity: `withdrawAvailable(maxAmount: sink.minimumCapacity())`
- Assert residuals: `vault.balance == 0.0` before destroy
- Single-expression `pre`/`post` checks
- Use protocol helpers like `borrowPool(pid:)` and `borrowPairPublicByPid(pid:)`

See `cadence/transactions/IncrementFi_Restake.cdc` for a complete example.

## 🧪 Testing

Run Cadence tests:
```bash
flow test
```

Lint a transaction:
```bash
flow cadence lint cadence/transactions/IncrementFi_Restake.cdc --network emulator
```

Note on checks: static checks that resolve imports require the target network to be up and/or contracts deployed. Prefer running against `--network testnet` for live protocol state.

## 🔗 Helpful Links

- Flow Docs: [developers.flow.com](https://developers.flow.com)
- Cadence Language: [cadence-lang.org/docs/language](https://cadence-lang.org/docs/language)
- Block Explorers: [Flowser](https://flowser.dev/)

## 🤝 Community
- Forum: [forum.flow.com](https://forum.flow.com/)
- Discord: [discord.gg/flow](https://discord.gg/flow)
- X: [@flow_blockchain](https://x.com/flow_blockchain)
