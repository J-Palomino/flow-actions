import Test

import "MetadataViews"
import "EVM"
import "TokenA"
import "TokenB"
import "SwapFactory"
import "Staking"
import "SwapConfig"

/* --- Test Helpers --- */

access(all)
fun _executeScript(_ path: String, _ args: [AnyStruct]): Test.ScriptResult {
    return Test.executeScript(Test.readFile(path), args)
}

access(all)
fun _executeTransaction(_ path: String, _ args: [AnyStruct], _ signer: Test.TestAccount): Test.TransactionResult {
    let txn = Test.Transaction(
        code: Test.readFile(path),
        authorizers: [signer.address],
        signers: [signer],
        arguments: args
    )
    return Test.executeTransaction(txn)
}

/* --- Script Helpers --- */

access(all)
fun getCurrentBlockTimestamp(): UFix64 {
    let res = _executeScript("./scripts/get_current_block_timestamp.cdc", [])
    Test.expect(res, Test.beSucceeded())
    return res.returnValue! as! UFix64
}


access(all)
fun getCOAAddressHex(atFlowAddress: Address): String {
    let coaAddressResult = _executeScript(
        "../scripts/evm/get_evm_address_string.cdc",
        [atFlowAddress]
    )
    Test.expect(coaAddressResult, Test.beSucceeded())
    let coaAddressHex = coaAddressResult.returnValue as! String? ?? panic("Problem getting COA address as String")
    Test.assertEqual(40, coaAddressHex.length)
    return coaAddressHex
}

access(all)
fun getBalance(address: Address, vaultPublicPath: PublicPath): UFix64? {
    let res = _executeScript("../scripts/tokens/get_balance.cdc", [address, vaultPublicPath])
    Test.expect(res, Test.beSucceeded())
    return res.returnValue as! UFix64?
}

access(all)
fun getAutoBalancerBalance(address: Address, publicPath: PublicPath): UFix64? {
    let res = _executeScript("../scripts/auto-balance-adapter/get_balance.cdc", [address, publicPath])
    Test.expect(res, Test.beSucceeded())
    return res.returnValue as! UFix64?
}

access(all)
fun getAutoBalancerCurrentValue(address: Address, publicPath: PublicPath): UFix64? {
    let res = _executeScript("../scripts/auto-balance-adapter/get_current_value.cdc", [address, publicPath])
    Test.expect(res, Test.beSucceeded())
    return res.returnValue as! UFix64?
}

access(all)
fun getAutoBalancerValueOfDeposits(address: Address, publicPath: PublicPath): UFix64? {
    let res = _executeScript("../scripts/auto-balance-adapter/get_value_of_deposits.cdc", [address, publicPath])
    Test.expect(res, Test.beSucceeded())
    return res.returnValue as! UFix64?
}

/* --- Transaction Helpers --- */

access(all)
fun transferFlow(signer: Test.TestAccount, recipient: Address, amount: UFix64) {
    let transferResult = _executeTransaction(
        "../transactions/flow-token/transfer_flow.cdc",
        [recipient, amount],
        signer
    )
    Test.expect(transferResult, Test.beSucceeded())
}

access(all)
fun setupGenericVault(signer: Test.TestAccount, vaultIdentifier: String) {
    let mintResult = _executeTransaction(
        "../transactions/fungible-tokens/setup_generic_vault.cdc",
        [vaultIdentifier],
        signer
    )
    Test.expect(mintResult, Test.beSucceeded())
}

access(all)
fun mintTestTokens(
    signer: Test.TestAccount,
    recipient: Address,
    amount: UFix64,
    minterStoragePath: StoragePath,
    receiverPublicPath: PublicPath
) {
    let mintResult = _executeTransaction(
        "./transactions/mint_tokens.cdc",
        [recipient, amount, minterStoragePath, receiverPublicPath],
        signer
    )
    Test.expect(mintResult, Test.beSucceeded())
}

access(all)
fun createSwapPair(
    signer: Test.TestAccount,
    token0Identifier: String,
    token1Identifier: String,
    stableMode: Bool
) {
    let creationResult = _executeTransaction(
        "../transactions/increment-fi/create_swap_pair.cdc",
        [token0Identifier, token1Identifier, stableMode],
        signer
    )
    Test.expect(creationResult, Test.beSucceeded())
}

access(all)
fun addLiquidity(
    signer: Test.TestAccount,
    token0Key: String,
    token1Key: String,
    token0InDesired: UFix64,
    token1InDesired: UFix64,
    token0InMin: UFix64,
    token1InMin: UFix64,
    deadline: UFix64,
    token0VaultPath: StoragePath,
    token1VaultPath: StoragePath,
    stableMode: Bool
){
    let mintResult = _executeTransaction(
        "../transactions/increment-fi/add_liquidity.cdc",
        [token0Key, token1Key, token0InDesired, token1InDesired, token0InMin, token1InMin, deadline, token0VaultPath, token1VaultPath, stableMode],
        signer
    )
    Test.expect(mintResult, Test.beSucceeded())
}