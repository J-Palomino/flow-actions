# Connectors

## Quick Reference (Restaking)
- Rewards Source: `IncrementFiStakingConnectors.PoolRewardsSource(userCertificate, poolID, vaultType, overflowSinks, uniqueID?)`
- Zapper (to LP): `IncrementFiPoolLiquidityConnectors.Zapper(token0Type, token1Type, stableMode, uniqueID?)`
- Swap wrapper: `SwapStack.SwapSource(swapper, source, uniqueID?)`
- Staking Sink: `IncrementFiStakingConnectors.PoolSink(poolID, staker, uniqueID?)`

Jump to: [`workflows/restaking-workflow.md`](./workflows/restaking-workflow.md)

---

## FungibleTokenStack Connectors

### VaultSource
**Purpose**: Withdraws tokens from FungibleToken vault with minimum balance protection.  
**Type**: `struct VaultSource : DeFiActions.Source`  
**Constructor**:
```cadence
FungibleTokenStack.VaultSource(
    min: UFix64?,
    withdrawVault: Capability<auth(FungibleToken.Withdraw) &{FungibleToken.Vault}>,
    uniqueID: DeFiActions.UniqueIdentifier?
)
```

### VaultSink
**Purpose**: Deposits tokens into FungibleToken vault with capacity limits.  
**Type**: `struct VaultSink : DeFiActions.Sink`  
**Constructor**:
```cadence
FungibleTokenStack.VaultSink(
    max: UFix64?,
    depositVault: Capability<&{FungibleToken.Vault}>,
    uniqueID: DeFiActions.UniqueIdentifier?
)
```

### VaultSinkAndSource
```cadence
FungibleTokenStack.VaultSinkAndSource(
    min: UFix64,
    max: UFix64?,
    vault: Capability<auth(FungibleToken.Withdraw) &{FungibleToken.Vault}>,
    uniqueID: DeFiActions.UniqueIdentifier?
)
```

## SwapStack Connectors

### SwapSource
```cadence
SwapStack.SwapSource(
    swapper: {DeFiActions.Swapper},
    source: {DeFiActions.Source},
    uniqueID: DeFiActions.UniqueIdentifier?
)
```

### SwapSink
```cadence
SwapStack.SwapSink(
    swapper: {DeFiActions.Swapper},
    sink: {DeFiActions.Sink},
    uniqueID: DeFiActions.UniqueIdentifier?
)
```

### MultiSwapper
```cadence
SwapStack.MultiSwapper(
    inVault: Type,
    outVault: Type,
    swappers: [{DeFiActions.Swapper}],
    uniqueID: DeFiActions.UniqueIdentifier?
)
```

## IncrementFi Connectors

### Helper: borrowPool
**Purpose**: Retrieve a reference to a staking pool without requiring a pool collection address parameter.  
**Signature**:
```cadence
IncrementFiStakingConnectors.borrowPool(poolID: UInt64): &{Staking.PoolPublic}?
```
**Notes**:
- Use this helper to minimize transaction parameters when targeting a known IncrementFi pool.
- Returns `nil` if the pool is not found or not accessible.

### PoolSink
```cadence
IncrementFiStakingConnectors.PoolSink(
    poolID: UInt64,
    staker: Address,
    uniqueID: DeFiActions.UniqueIdentifier?
)
```

### PoolRewardsSource
```cadence
IncrementFiStakingConnectors.PoolRewardsSource(
    userCertificate: Capability<&Staking.UserCertificate>,
    poolID: UInt64,
    vaultType: Type,
    overflowSinks: {Type: {DeFiActions.Sink}},
    uniqueID: DeFiActions.UniqueIdentifier?
)
```

### PoolSource
> Not implemented in `IncrementFiStakingConnectors.cdc`.

## IncrementFi Pool Liquidity Connectors

### Zapper
```cadence
IncrementFiPoolLiquidityConnectors.Zapper(
    token0Type: Type,
    token1Type: Type,
    stableMode: Bool,
    uniqueID: DeFiActions.UniqueIdentifier?
)
```

Notes:
- `Zapper.swapBack(quote:residual:)` converts LP back to the input token.

---

For EVM and Band oracle adapters, see protocol-specific repositories; not required for the restaking workflow.
