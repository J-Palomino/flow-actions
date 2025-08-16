# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Commands (via Makefile)
- `make start` or `make emulator` - Start Flow emulator with full IncrementFi environment setup
- `make deploy` - Deploy contracts to network (NETWORK=emulator|testnet|mainnet)
- `make test` - Run Cadence tests with `flow test`

### Flow CLI Commands
- `flow deps install` - Install dependencies from flow.json
- `flow project deploy --network <network>` - Deploy contracts
- `flow transactions send <file.cdc> --network <network> --signer <account>` - Send transaction
- `flow scripts execute <file.cdc> --network <network>` - Execute script

### Environment Setup
The `scripts/start.sh` script provides a complete automated setup:
1. Starts Flow emulator on localhost:3569
2. Deploys all contracts and dependencies
3. Creates TokenA/TokenB with 1M tokens each
4. Sets up TokenA-TokenB liquidity pool (100k each)
5. Creates staking pool #0 with 50k pre-staked LP tokens
6. Configures user certificate for staking operations

## Architecture Overview

### Flow Actions Framework
This is a **Flow Actions scaffold** that demonstrates composable DeFi operations using standardized connectors. Flow Actions enable safe composition of DeFi protocols through typed interfaces.

Key components:
- **Sources**: Extract tokens/liquidity (e.g., `PoolRewardsSource`)
- **Swappers**: Convert between token types (e.g., `Zapper`)
- **Sinks**: Deposit tokens into protocols (e.g., `PoolSink`)
- **Connectors**: Wrapper patterns like `SwapSource` (swapper + source)

### Core Contracts

#### Local Contracts (`cadence/contracts/`)
- **ExampleConnectors.cdc**: Simple `TokenSink` implementing `DeFiActions.Sink`
- **Mock tokens**: TokenA, TokenB, TestTokenMinter for testing

#### External Dependencies (from flow.json)
- **DeFiActions**: Core framework contracts
- **IncrementFi connectors**: Staking, pool liquidity, swap, flashloan connectors
- **Standard Flow contracts**: FungibleToken, FlowToken, etc.

### Transaction Pattern: `increment_fi_restake.cdc`
Demonstrates the **Claim → Zap → Restake** workflow:

1. **Prepare phase**:
   - Creates `PoolRewardsSource` to claim rewards
   - Creates `Zapper` to convert rewards to LP tokens
   - Wraps with `SwapSource` for type conversion
   - Calculates expected stake increase for validation

2. **Execute phase**:
   - Creates `PoolSink` for restaking
   - Withdraws LP tokens sized by sink capacity
   - Deposits into staking pool
   - Validates no residual tokens remain

3. **Safety features**:
   - Pre/post conditions verify stake increases
   - Capacity-based withdrawals prevent over-withdrawal
   - Residual assertions ensure complete token handling

### Scripts and Queries
- **get_available_rewards.cdc**: Queries claimable rewards from IncrementFi pools using `PoolRewardsSource.minimumAvailable()`

## Key Development Patterns

### Flow Actions Composition
Always follow this pattern for DeFi operations:
1. Create connectors with `uniqueID` for tracing
2. Size withdrawals using `minimumCapacity()` from sinks
3. Assert residuals are zero after operations
4. Use string imports for external contracts
5. Include pre/post conditions for safety

### Network Configuration
- **Emulator**: Use automated setup via `make start`, pool ID = 0
- **Testnet/Mainnet**: Requires manual account setup and finding pool IDs from IncrementFi UI

### Testing
- Pool ID 0 is created automatically in emulator environment
- Use test accounts from flow.json (`emulator-account`, `testnet`, `mainnet`)
- Mock tokens (TokenA, TokenB) available for emulator testing

## Important Notes

- All transactions use string-based imports for cross-network compatibility
- IncrementFi connectors handle the complexity of pool interactions
- Safety is enforced through capacity-based withdrawals and residual checks
- UniqueIdentifier enables operation tracing across connector composition