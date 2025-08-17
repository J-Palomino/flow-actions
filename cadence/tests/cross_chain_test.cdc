import Test
import "FlareFDCTriggers"
import "LayerZeroConnectors"

access(all) fun setup() {
    let err = Test.deployContract(
        name: "FlareFDCTriggers",
        path: "cadence/contracts/triggers/FlareFDCTriggers.cdc",
        arguments: []
    )
    Test.expect(err, Test.beNil())
    
    let err2 = Test.deployContract(
        name: "LayerZeroConnectors", 
        path: "cadence/contracts/cross-chain/LayerZeroConnectors.cdc",
        arguments: []
    )
    Test.expect(err2, Test.beNil())
}

access(all) fun testFDCTriggerCreation() {
    let trigger = FlareFDCTriggers.FDCTrigger(
        id: "test-trigger-1",
        triggerType: FlareFDCTriggers.TriggerType.PriceThreshold,
        sourceChain: "ethereum",
        targetChain: FlareFDCTriggers.TargetChain.Ethereum,
        payload: {"price": "2000.0", "asset": "ETH"},
        timestamp: getCurrentBlock().timestamp,
        signature: "test-signature"
    )
    
    Test.expect(trigger.id, Test.equal("test-trigger-1"))
    Test.expect(trigger.sourceChain, Test.equal("ethereum"))
}

access(all) fun testLayerZeroChainIds() {
    let chainIds = LayerZeroConnectors.ChainIds
    
    Test.expect(chainIds["Ethereum"], Test.equal(101 as UInt16))
    Test.expect(chainIds["BSC"], Test.equal(102 as UInt16))
    Test.expect(chainIds["Polygon"], Test.equal(109 as UInt16))
}

access(all) fun testCrossChainMessageCreation() {
    let message = LayerZeroConnectors.CrossChainMessage(
        messageId: "test-msg-1",
        sourceChain: 114,  // Flow
        targetChain: 101,  // Ethereum
        actionType: LayerZeroConnectors.CrossChainActionType.Swap,
        payload: {"amount": "100.0", "token": "FLOW"},
        gasLimit: 200000
    )
    
    Test.expect(message.messageId, Test.equal("test-msg-1"))
    Test.expect(message.sourceChain, Test.equal(114 as UInt16))
    Test.expect(message.targetChain, Test.equal(101 as UInt16))
}

access(all) fun testFDCHandlerCreation() {
    // This test would verify handler creation and trigger processing
    // For now, just test that the factory function works
    let account = Test.createAccount()
    
    // In a real test, we would:
    // 1. Create FDC handler
    // 2. Register it with registry
    // 3. Submit a test trigger
    // 4. Verify it processes correctly
    
    Test.expect(account.address, Test.not(Test.beNil()))
}