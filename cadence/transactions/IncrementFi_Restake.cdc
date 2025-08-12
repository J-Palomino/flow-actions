import "FungibleToken"
import "DeFiActions"
import "SwapConnectors"
import "IncrementFiStakingConnectors"
import "IncrementFiPoolLiquidityConnectors"
import "Staking"

transaction(
    pid: UInt64
) {
    let userCertificateCap: Capability<&Staking.UserCertificate>
    let pool: &{Staking.PoolPublic}
    let startingStake: UFix64
    let swapSource: SwapConnectors.SwapSource
    let expectedStakeIncrease: UFix64
    let operationID: DeFiActions.UniqueIdentifier

    prepare(acct: auth(BorrowValue, SaveValue, IssueStorageCapabilityController) &Account) {
        // Borrow pool and snapshot user's current stake
        self.pool = IncrementFiStakingConnectors.borrowPool(pid: pid)
            ?? panic("Pool with ID \(pid) not found or not accessible")
        self.startingStake = self.pool.getUserInfo(address: acct.address)?.stakingAmount
            ?? panic("No user info for address \(acct.address)")

        // Issue user certificate capability (required by staking connectors)
        self.userCertificateCap = acct.capabilities.storage
            .issue<&Staking.UserCertificate>(Staking.UserCertificateStoragePath)

        // Create a unique identifier for tracing this composed operation
        self.operationID = DeFiActions.createUniqueIdentifier()

        // Derive pair metadata to construct the zapper safely
        let pair = IncrementFiStakingConnectors.borrowPairPublicByPid(pid: pid)
            ?? panic("Pair with ID \(pid) not found or not accessible")

        let zapper = IncrementFiPoolLiquidityConnectors.Zapper(
            token0Type: IncrementFiStakingConnectors.tokenTypeIdentifierToVaultType(pair.getPairInfoStruct().token0Key),
            token1Type: IncrementFiStakingConnectors.tokenTypeIdentifierToVaultType(pair.getPairInfoStruct().token1Key),
            stableMode: pair.getPairInfoStruct().isStableswap,
            uniqueID: self.operationID
        )

        let lpSource = SwapConnectors.SwapSource(
            swapper: zapper,
            source: IncrementFiStakingConnectors.PoolRewardsSource(
                userCertificate: self.userCertificateCap,
                pid: pid,
                uniqueID: self.operationID
            ),
            uniqueID: self.operationID
        )

        self.swapSource = lpSource

        // Quote expected LP stake increase for post-condition
        self.expectedStakeIncrease = zapper.quoteOut(
            forProvided: lpSource.minimumAvailable(),
            reverse: false
        ).outAmount
    }

    execute {
        // Stake LP by sizing withdraw to sink capacity
        let poolSink = IncrementFiStakingConnectors.PoolSink(
            pid: pid,
            staker: self.userCertificateCap.address,
            uniqueID: self.operationID
        )

        let vault <- self.swapSource.withdrawAvailable(
            maxAmount: poolSink.minimumCapacity()
        )
        poolSink.depositCapacity(
            from: &vault as auth(FungibleToken.Withdraw) &{FungibleToken.Vault}
        )
        assert(vault.balance == 0.0, message: "Residual after deposit")
        destroy vault
    }

    post {
        // Ensure stake increased by at least the quoted amount
        self.pool.getUserInfo(address: self.userCertificateCap.address)!.stakingAmount
            >= self.startingStake + self.expectedStakeIncrease
    }
} 