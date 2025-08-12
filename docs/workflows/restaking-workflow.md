# Restaking Workflow

**Purpose**: Claim staking rewards, convert to LP tokens, re-stake automatically  
**Components**: PoolRewardsSource → SwapSource(Zapper) → PoolSink  
**Related**: [Pattern 1](../patterns.md#pattern-1-restaking-workflow)

> Note: Post-conditions should assert a user-provided minimum restake delta (e.g., `minimumRestakedAmount`), not values computed in the transaction (quotes/prices). This decouples validation from execution.

## Required Imports
```cadence
import "FungibleToken"
import "Staking"
import "IncrementFiStakingConnectors"
import "IncrementFiPoolLiquidityConnectors"
import "SwapConnectors"
import "DeFiActions"
import "SwapConfig"
```

## Component Flow
```
1. PoolRewardsSource    → Claims staking rewards
2. Zapper               → Converts reward token + pair token to LP tokens
3. SwapSource           → Composes RewardsSource + Zapper
4. PoolSink             → Stakes LP tokens back into pool
```

## Transaction Implementation (Minimal Parameters)
```cadence
/// Restakes earned staking rewards by converting them to LP tokens and staking them back into the same pool.
/// 1. Harvest reward tokens from the pool
/// 2. Convert rewards to LP tokens via a zapper (reward + pair token)
/// 3. Restake LP tokens into the original pool
transaction(
    pid: UInt64,
    rewardTokenType: Type,     // Reward token type
    pairTokenType: Type,       // Other token in the LP pair
    minimumRestakedAmount: UFix64  // Absolute minimum stake delta required
) {
    let userCertificateCap: Capability<&Staking.UserCertificate>
    let pool: &{Staking.PoolPublic}
    let startingStake: UFix64

    prepare(acct: auth(BorrowValue, SaveValue) &Account) {
        self.pool = IncrementFiStakingConnectors.borrowPool(pid: pid)
            ?? panic("Pool with ID \(pid) not found or not accessible")

        self.startingStake = self.pool.getUserInfo(address: acct.address)?.stakingAmount
            ?? panic("No user info found for address \(acct.address)")

        self.userCertificateCap = acct.capabilities.storage.issue<&Staking.UserCertificate>(Staking.UserCertificateStoragePath)
    }

    execute {
        let poolRewardsSource = IncrementFiStakingConnectors.PoolRewardsSource(
            userCertificate: self.userCertificateCap,
            pid: pid,
            uniqueID: nil
        )

        let zapper = IncrementFiPoolLiquidityConnectors.Zapper(
            token0Type: rewardTokenType,
            token1Type: pairTokenType,
            stableMode: false,
            uniqueID: nil
        )

        let lpTokenPoolRewardsSource = SwapConnectors.SwapSource(
            swapper: zapper,
            source: poolRewardsSource,
            uniqueID: nil
        )

        let poolSink = IncrementFiStakingConnectors.PoolSink(
            pid: pid,
            staker: self.userCertificateCap.address,
            uniqueID: nil
        )

        let vault <- lpTokenPoolRewardsSource.withdrawAvailable(maxAmount: poolSink.minimumCapacity())
        poolSink.depositCapacity(from: &vault as auth(FungibleToken.Withdraw) &{FungibleToken.Vault})
        assert(vault.balance == 0.0, message: "Vault should be empty after withdrawal - restaking may have failed")
        destroy vault
    }

    post {
        self.pool.getUserInfo(address: self.userCertificateCap.address)!.stakingAmount >= self.startingStake + minimumRestakedAmount:
            "Restaking failed: restaked amount below the minimum required"
    }
}
```

## Component Details

### PoolRewardsSource
- Claims pending staking rewards from the specified pool using the user's certificate
- Returns a source that yields reward tokens for further composition

### Zapper
- Converts reward tokens plus a pair token into LP tokens
- Used via `SwapSource` to compose with the rewards source

### PoolSink
- Stakes LP tokens back into the same pool for the user

## Usage Example
```cadence
// Restake stFLOW rewards as FLOW-stFLOW LP with a 10.0 minimum restake amount
// (No pool address param; uses IncrementFiStakingConnectors.borrowPool internally)
restakeRewards(
    pid: 42,
    rewardTokenType: Type<@StFlowToken.Vault>(),
    pairTokenType: Type<@FlowToken.Vault>(),
    minimumRestakedAmount: 10.0
)
```
