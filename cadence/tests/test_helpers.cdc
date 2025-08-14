import Test
import "Staking"

access(all)
fun setupIncrementFiDependencies() {
    let incrementFiAccount = Test.getAccount(0x0000000000000008)
    var err = Test.deployContract(
        name: "SwapError",
        path: "../../imports/b78ef7afa52ff906/SwapError.cdc",
        arguments: []
    )
    Test.expect(err, Test.beNil())
    err = Test.deployContract(
        name: "SwapInterfaces",
        path: "../../imports/b78ef7afa52ff906/SwapInterfaces.cdc",
        arguments: []
    )
    Test.expect(err, Test.beNil())
    err = Test.deployContract(
        name: "SwapConfig",
        path: "../../imports/b78ef7afa52ff906/SwapConfig.cdc",
        arguments: []
    )
    Test.expect(err, Test.beNil())
    err = Test.deployContract(
        name: "StableSwapFactory",
        path: "../../imports/b063c16cac85dbd1/StableSwapFactory.cdc",
        arguments: []
    )
    Test.expect(err, Test.beNil())
    err = Test.deployContract(
        name: "SwapFactory",
        path: "../../imports/b063c16cac85dbd1/SwapFactory.cdc",
        arguments: [incrementFiAccount.address]
    )
    Test.expect(err, Test.beNil())

    // deploy test token contracts & init SwapPair template contract
    err = Test.deployContract(
        name: "TestTokenMinter",
        path: "./contracts/TestTokenMinter.cdc",
        arguments: []
    )
    Test.expect(err, Test.beNil())
    err = Test.deployContract(
        name: "TokenA",
        path: "./contracts/TokenA.cdc",
        arguments: []
    )
    Test.expect(err, Test.beNil())
    err = Test.deployContract(
        name: "TokenB",
        path: "./contracts/TokenB.cdc",
        arguments: []
    )
    Test.expect(err, Test.beNil())
    deploySwapPairTemplate(incrementFiAccount)

    err = Test.deployContract(
        name: "SwapRouter",
        path: "../../imports/a6850776a94e6551/SwapRouter.cdc",
        arguments: []
    )
    Test.expect(err, Test.beNil())


    // deploy Staking contracts
    err = Test.deployContract(
        name: "StakingError",
        path: "../../imports/1b77ba4b414de352/StakingError.cdc",
        arguments: []
    )
    Test.expect(err, Test.beNil())
    err = Test.deployContract(
        name: "Staking",
        path: "../../imports/1b77ba4b414de352/Staking.cdc",
        arguments: []
    )
    Test.expect(err, Test.beNil())
}

access(all)
fun deploySwapPairTemplate(_ signer: Test.TestAccount) {
    // must be deployed by transaction and not by Test.deployContract() because init args accept @{FungibleToken.Vault}
    // but the Test.deployContract() args parameter only accepts [AnyStruct]
    let res = _executeTransaction("./transactions/deploy_swap_pair.cdc", [swapPairTemplateCode], signer)
    Test.expect(res, Test.beSucceeded())
}

access(all)
fun createStakingPool(
    _ signer: Test.TestAccount,
    _ limitAmount: UFix64,
    _ vaultTokenType: Type,
    _ rewardInfo: [Staking.RewardInfo],
    _ rewardTokenVaultStoragePath: StoragePath?,
    _ depositAmount: UFix64?
) {
    let res = _executeTransaction("./transactions/increment-fi/create_staking_pool.cdc", [
        limitAmount,
        vaultTokenType,
        rewardInfo,
        rewardTokenVaultStoragePath,
        depositAmount
    ], signer)
    Test.expect(res, Test.beSucceeded())
}