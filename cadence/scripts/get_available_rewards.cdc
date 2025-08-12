// Script: GetAvailableRewards
// Purpose: Return the currently available (claimable) staking rewards for a user
//          in an Increment Fi staking pool via DeFiActions connectors.
// Inputs:
// - staker: the Address of the user whose rewards we are querying
// - pid:    the pool id (UInt64) identifying the Increment Fi staking pool
// Output:
// - UFix64 amount representing the rewards that can be withdrawn (minimumAvailable)
//
// Notes:
// - This example uses the user's Staking.UserCertificate capability within the
//   IncrementFiStakingConnectors.PoolRewardsSource to surface rewards.
import "IncrementFiStakingConnectors"
import "Staking"

// Entrypoint for read-only query of available rewards
access(all) fun main(staker: Address, pid: UInt64): UFix64 {
    // Obtain a capability for the user's Staking.UserCertificate.
    // Demonstrates capability derivation to interact with
    // connector sources that rely on user identity/certificates.
    let userCertificateCap = getAuthAccount<auth(Capabilities) &Account>(staker)
        .capabilities
        .storage
        .issue<&Staking.UserCertificate>(Staking.UserCertificateStoragePath)

    // Construct a DeFiActions Source that surfaces the user's pool rewards
    let rewardsSource = IncrementFiStakingConnectors.PoolRewardsSource(
        userCertificate: userCertificateCap,
        pid: pid,
        uniqueID: nil
    )

    // minimumAvailable is the connector-native way to read the immediately withdrawable amount
    return rewardsSource.minimumAvailable()
} 