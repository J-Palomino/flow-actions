import "DeFiActions"
import "IncrementFiStakingConnectors"
import "Staking"

/// Query the amount of rewards available to claim from an IncrementFi staking pool
///
/// @param staker: Address of the staker to check rewards for
/// @param pid: Pool ID to check rewards from
/// @return UFix64: Amount of rewards available to claim
///
access(all) fun main(staker: Address, pid: UInt64): UFix64 {
    // Get user certificate capability
    let userCertificateCap = getAccount(staker)
        .capabilities.storage
        .issue<&Staking.UserCertificate>(Staking.UserCertificateStoragePath)
    
    // Create pool rewards source to check available rewards
    let rewardsSource = IncrementFiStakingConnectors.PoolRewardsSource(
        userCertificate: userCertificateCap,
        pid: pid,
        uniqueID: nil
    )
    
    // Return the minimum available rewards
    return rewardsSource.minimumAvailable()
} 