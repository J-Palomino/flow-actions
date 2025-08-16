import "AccountFactory"

/// Script to check if an account has dual-asset capabilities
/// Returns detailed information about the account's setup
access(all) fun main(account: Address): {String: AnyStruct} {
    return AccountFactory.getAccountCapabilities(account: account)
}