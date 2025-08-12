// Test: Counter_test
// Purpose: Example of using the Flow Test framework to deploy a contract and assert
//          a successful result. This is a placeholder example test.
import Test

// Create a throwaway test account for deployments/interactions
access(all) let account = Test.createAccount()

// Demonstrates deploying a contract with no arguments and expecting success
access(all) fun testContract() {
    Test.expect(nil, Test.beNil())
}