# Restaking Workflow

**Purpose**: Claim staking rewards, convert to LP tokens, re-stake automatically  
**Components**: PoolRewardsSource → SwapSource(Zapper) → PoolSink  
**Related**: [Pattern 1](../patterns.md#pattern-1-restaking-workflow)

## Required Imports
```cadence
import "FungibleToken"
import "DeFiActions"
import "SwapStack"
import "IncrementFiStakingConnectors"
import "IncrementFiPoolLiquidityConnectors"
import "Staking"
```

## Component Flow
```
1. PoolRewardsSource    → Claims staking rewards
2. Zapper               → Converts single token to LP tokens
3. SwapSource           → Combines PoolRewardsSource + Zapper
4. PoolSink             → Stakes LP tokens back into pool
```

## Transaction Implementation
```cadence
transaction(
    pid: UInt64,                    // Pool identifier
    rewardTokenType: Type,          // Reward token type (e.g., Type<@FlowToken.Vault>())
    pairTokenType: Type,            // Other token of the LP pair
    minimumRestakedAmount: UFix64   // Absolute minimum restaked amount (slippage guard)
) {
    let userCertificateCap: Capability<&Staking.UserCertificate>
    let pool: &{Staking.PoolPublic}
    let startingStake: UFix64
    
    prepare(acct: auth(BorrowValue, SaveValue) &Account) {
        // Get user certificate capability
        self.userCertificateCap = acct.capabilities.storage
            .issue<&Staking.UserCertificate>(Staking.UserCertificateStoragePath)
        
        // Save starting stake for post-condition validation
        self.pool = IncrementFiStakingConnectors.borrowPool(poolID: pid)
            ?? panic("Pool with ID \\(".concat(pid.toString()).concat(") not found or not accessible"))
        
        self.startingStake = self.pool.getUserInfo(address: acct.address)?.stakingAmount
            ?? panic("No user info found for address \\(".concat(acct.address.toString()).concat(")"))
    }
    
    execute {
        // Step 1: Create reward source
        let rewardSource = IncrementFiStakingConnectors.PoolRewardsSource(
            userCertificate: self.userCertificateCap,
            poolID: pid,
            vaultType: rewardTokenType,
            overflowSinks: {},
            uniqueID: nil
        )
        
        // Step 2: Create LP zapper
        let zapper = IncrementFiPoolLiquidityConnectors.Zapper(
            token0Type: rewardTokenType,
            token1Type: pairTokenType,
            stableMode: false,
            uniqueID: nil
        )
        
        // Step 3: Combine reward source + zapper
        let lpSource = SwapStack.SwapSource(
            swapper: zapper,
            source: rewardSource,
            uniqueID: nil
        )
        
        // Step 4: Create staking sink
        let stakingSink = IncrementFiStakingConnectors.PoolSink(
            poolID: pid,
            staker: self.userCertificateCap.address,
            uniqueID: nil
        )
        
        // Step 5: Execute transfer
        let vault <- lpSource.withdrawAvailable(maxAmount: stakingSink.minimumCapacity())
        stakingSink.depositCapacity(
            from: &vault as auth(FungibleToken.Withdraw) &{FungibleToken.Vault}
        )
        
        // Step 6: Validate complete transfer
        assert(vault.balance == 0.0, message: "Transfer incomplete")
        destroy vault
    }
    
    pre {
        pid > 0: "Pool ID must be positive"
    }
    
    post {
        self.pool.getUserInfo(address: self.userCertificateCap.address)!.stakingAmount 
            >= self.startingStake + minimumRestakedAmount:
            "Restake amount below expected"
    }
}
```

## Component Details

### PoolRewardsSource
- **Purpose**: Claims pending staking rewards from specified pool
- **Input**: User certificate, pool ID, reward token type
- **Output**: Vault containing claimed rewards
- **Side Effects**: Handles overflow reward routing if configured

### Zapper
- **Purpose**: Converts single reward token into LP token pair
- **Input**: Single token vault (from rewards)
- **Output**: LP token vault
- **Side Effects**: Executes optimal swap + liquidity provision

### PoolSink
- **Purpose**: Stakes LP tokens back into the same or different pool
- **Input**: LP token vault
- **Output**: Updated staking position
- **Side Effects**: Increases user's staking balance

## Usage Examples

### Basic Restaking
```cadence
// Restake stFLOW rewards into FLOW-stFLOW LP tokens
restakeRewards(
    pid: 42,
    rewardTokenType: Type<@StFlowToken.Vault>(),
    pairTokenType: Type<@FlowToken.Vault>(),
    minimumRestakedAmount: 0.01
)
```

## Error Handling

### Common Failures
- **No rewards available**: `PoolRewardsSource.minimumAvailable()` returns 0
- **Insufficient liquidity**: Zapper cannot create LP tokens due to pool constraints
- **Pool inactive**: Target staking pool is not accepting new stakes
- **Minimum restaked not met**: Final stake increase below threshold

### Validation Checks
```cadence
// Pre-flight validation
let availableRewards = rewardSource.minimumAvailable()
assert(availableRewards > 0.0, message: "No rewards available to claim")

let stakingCapacity = stakingSink.minimumCapacity()
assert(stakingCapacity > 0.0, message: "Pool not accepting new stakes")
```
