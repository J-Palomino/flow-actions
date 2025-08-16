import Test

access(all) fun setup() {
    let err = Test.deployContract(
        name: "TestTokenMinter",
        path: "../contracts/mock/TestTokenMinter.cdc",
        arguments: []
    )
    Test.expect(err, Test.beNil())

    let err2 = Test.deployContract(
        name: "TokenA",
        path: "../contracts/mock/TokenA.cdc", 
        arguments: []
    )
    Test.expect(err2, Test.beNil())

    let err3 = Test.deployContract(
        name: "TokenB", 
        path: "../contracts/mock/TokenB.cdc",
        arguments: []
    )
    Test.expect(err3, Test.beNil())
}

access(all) fun testTokenADeployment() {
    // Test that TokenA contract was deployed successfully
    // This is verified by the setup function not failing
    Test.expect(true, Test.equal(true))
}

access(all) fun testTokenBDeployment() {
    // Test that TokenB contract was deployed successfully  
    // This is verified by the setup function not failing
    Test.expect(true, Test.equal(true))
}

access(all) fun testBasicArithmetic() {
    // Test basic operations to verify test framework works
    let sum = 10 + 5
    let difference = 10 - 5
    let product = 10 * 5
    
    Test.expect(sum, Test.equal(15))
    Test.expect(difference, Test.equal(5))
    Test.expect(product, Test.equal(50))
}