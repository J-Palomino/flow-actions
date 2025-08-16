import Test

access(all) fun setup() {
    let err = Test.deployContract(
        name: "TestTokenMinter",
        path: "../contracts/mock/TestTokenMinter.cdc",
        arguments: []
    )
    Test.expect(err, Test.beNil())
}

access(all) fun testBasicMath() {
    let result = 2 + 2
    Test.expect(result, Test.equal(4))
}

access(all) fun testStringComparison() {
    let str = "hello"
    Test.expect(str, Test.equal("hello"))
}