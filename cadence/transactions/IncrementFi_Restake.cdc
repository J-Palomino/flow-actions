// Transaction: IncrementFi_Restake
// Purpose: Claim Increment Fi LP staking rewards, zap rewards into LP tokens, then
//          immediately stake the LP back into the pool (restake) using DeFiActions connectors.
// Safety Invariants Demonstrated:
// - Size withdraws by sink.minimumCapacity and assert zero residuals
// - Use protocol helpers to derive types/addresses
// - Maintain pre/post checks on user stake for determinism
import "FungibleToken"
import "DeFiActions"
import "SwapConnectors"
import "IncrementFiStakingConnectors"
import "IncrementFiPoolLiquidityConnectors"
import "Staking"

// Restake Increment Fi LP token staking rewards
// - Claims rewards → Zaps to LP → Stakes back into the pool
// - Follows safety invariants: sized withdraws, residual assertion, pre/post checks
transaction(
    pid: UInt64
) {
    // References and state for safety checks
    let userCertificateCap: Capability<&Staking.UserCertificate>
    let pool: &{Staking.PoolPublic}
    let startingStake: UFix64
    let swapSource: SwapConnectors.SwapSource
    let expectedStakeIncrease: UFix64

    prepare(acct: auth(BorrowValue, SaveValue, IssueStorageCapabilityController) &Account) {
        // Acquire pool and baseline stake for safety checks
        self.pool = IncrementFiStakingConnectors.borrowPool(pid: pid)
            ?? panic("Pool with ID \(pid) not found or not accessible")
        self.startingStake = self.pool.getUserInfo(address: acct.address)?.stakingAmount
            ?? panic("No user info for address \(acct.address)")
        self.userCertificateCap = acct.capabilities.storage
            .issue<&Staking.UserCertificate>(Staking.UserCertificateStoragePath)

        // Build zapper from the pair config (derives token types and stable mode)
        let pair = IncrementFiStakingConnectors.borrowPairPublicByPid(pid: pid)
            ?? panic("Pair with ID \(pid) not found or not accessible")
        let zapper = IncrementFiPoolLiquidityConnectors.Zapper(
            token0Type: IncrementFiStakingConnectors.tokenTypeIdentifierToVaultType(pair.getPairInfoStruct().token0Key),
            token1Type: IncrementFiStakingConnectors.tokenTypeIdentifierToVaultType(pair.getPairInfoStruct().token1Key),
            stableMode: pair.getPairInfoStruct().isStableswap,
            uniqueID: nil
        )

        // Source of LP via rewards → zapper, behaves as a Source of LP vault type
        let lpSource = SwapConnectors.SwapSource(
            swapper: zapper,
            source: IncrementFiStakingConnectors.PoolRewardsSource(
                userCertificate: self.userCertificateCap,
                pid: pid,
                uniqueID: nil
            ),
            uniqueID: nil
        )

        self.swapSource = lpSource

        // Pre-compute expected stake increase for post-condition
        self.expectedStakeIncrease = zapper.quoteOut(
            forProvided: lpSource.minimumAvailable(),
            reverse: false
        ).outAmount
    }

    // Ensure baseline stake has not changed during prepare
    pre {
        self.pool.getUserInfo(address: self.userCertificateCap.address)!.stakingAmount == self.startingStake
    }

    execute {
        // Create sink into the staking pool
        let poolSink = IncrementFiStakingConnectors.PoolSink(
            pid: pid,
            staker: self.userCertificateCap.address,
            uniqueID: nil
        )

        // Size withdraw by sink capacity, then deposit immediately
        let vault <- self.swapSource.withdrawAvailable(maxAmount: poolSink.minimumCapacity())
        poolSink.depositCapacity(from: &vault as auth(FungibleToken.Withdraw) &{FungibleToken.Vault})

        // Assert no residuals remain, then destroy
        assert(vault.balance == 0.0, message: "Residual after deposit")
        destroy vault
    }

    post {
        // Stake must increase by at least the quoted LP out
        self.pool.getUserInfo(address: self.userCertificateCap.address)!.stakingAmount
            >= self.startingStake + self.expectedStakeIncrease:
            "Restake below expected amount"
    }
} 