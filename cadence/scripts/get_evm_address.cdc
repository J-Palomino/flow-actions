import "AccountFactory"

/// Script to get the EVM address for a Flow account
access(all) fun main(flowAccount: Address): String? {
    return AccountFactory.getEVMAddress(account: flowAccount)
}