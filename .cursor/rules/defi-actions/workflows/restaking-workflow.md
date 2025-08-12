# Restaking Workflow

**Purpose**: Claim staking rewards, convert to LP tokens, re-stake automatically  
**Components**: PoolRewardsSource → SwapSource(Zapper) → PoolSink  
**Related**: [Pattern 1](../patterns.md#pattern-1-restaking-workflow)

> Note: The canonical restake transaction derives the expected restake delta from connector quotes (no user-supplied minimum parameter). It asserts that the final stake is at least the starting stake plus the computed `expectedStakeIncrease`.

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
    pid: UInt64
) {
    let staker: Address
    let uniqueID: DeFiActions.UniqueIdentifier
    let pool: &{Staking.PoolPublic}
    let startingStake: UFix64
    let tokenSource: SwapConnectors.SwapSource
    let expectedStakeIncrease: UFix64

    prepare(acct: auth(BorrowValue, SaveValue, IssueStorageCapabilityController) &Account) {
        self.staker = acct.address
        self.uniqueID = DeFiActions.createUniqueIdentifier()

        self.pool = IncrementFiStakingConnectors.borrowPool(pid: pid)
            ?? panic("Pool with ID \(pid) not found or not accessible")
        self.startingStake = self.pool.getUserInfo(address: acct.address)?.stakingAmount
            ?? panic("No user info found for address \(acct.address)")

        let userCertificateCap = acct.capabilities.storage
            .issue<&Staking.UserCertificate>(Staking.UserCertificateStoragePath)

        let pair = IncrementFiStakingConnectors.borrowPairPublicByPid(pid: pid)
            ?? panic("Pair with ID \(pid) not found or not accessible")

        let zapper = IncrementFiPoolLiquidityConnectors.Zapper(
            token0Type: IncrementFiStakingConnectors.tokenTypeIdentifierToVaultType(pair.getPairInfoStruct().token0Key),
            token1Type: IncrementFiStakingConnectors.tokenTypeIdentifierToVaultType(pair.getPairInfoStruct().token1Key),
            stableMode: pair.getPairInfoStruct().isStableswap,
            uniqueID: self.uniqueID
        )

        let rewards = IncrementFiStakingConnectors.PoolRewardsSource(
            userCertificate: userCertificateCap,
            pid: pid,
            uniqueID: self.uniqueID
        )

        self.tokenSource = SwapConnectors.SwapSource(
            swapper: zapper,
            source: rewards,
            uniqueID: self.uniqueID
        )

        self.expectedStakeIncrease = zapper.quoteOut(
            forProvided: rewards.minimumAvailable(),
            reverse: false
        ).outAmount
    }

    post {
        self.pool.getUserInfo(address: self.staker)!.stakingAmount >= self.startingStake + self.expectedStakeIncrease:
            "Restaking failed: restaked amount below the expected amount"
    }

    execute {
        let poolSink = IncrementFiStakingConnectors.PoolSink(
            pid: pid,
            staker: self.staker,
            uniqueID: self.uniqueID
        )

        let vault <- self.tokenSource.withdrawAvailable(maxAmount: poolSink.minimumCapacity())
        poolSink.depositCapacity(from: &vault as auth(FungibleToken.Withdraw) &{FungibleToken.Vault})
        assert(vault.balance == 0.0, message: "Vault should be empty after withdrawal - restaking may have failed")
        destroy vault
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
// Restake stFLOW rewards as FLOW-stFLOW LP for pool 42 (no extra parameters)
restakeRewards(
    pid: 42
)
```
