import FlowToken from 0x7e60df042a9c0868
import FungibleToken from 0x9a0766d93b6608b7

transaction(amount: UFix64, recipient: Address) {
    let vault: @FlowToken.Vault
    
    prepare(signer: auth(BorrowValue) &Account) {
        let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
            from: /storage/flowTokenVault
        ) ?? panic("Could not borrow Flow vault")
        
        self.vault <- vaultRef.withdraw(amount: amount) as! @FlowToken.Vault
        
        log("=== BASIC TESTNET TRANSACTION ===")
        log("From: ".concat(signer.address.toString()))
        log("To: ".concat(recipient.toString()))
        log("Amount: ".concat(amount.toString()).concat(" FLOW"))
        log("Network: Flow Testnet")
        log("Cost: ~$0.001 USD")
        log("Explorer: https://testnet.flowscan.io/account/".concat(recipient.toString()))
    }
    
    execute {
        let receiver = getAccount(recipient)
            .capabilities.get<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
            .borrow() ?? panic("Could not borrow receiver")
        
        receiver.deposit(from: <-self.vault)
        
        log("✅ Transaction completed successfully!")
        log("💰 Transferred ".concat(amount.toString()).concat(" FLOW on testnet"))
        log("🔗 View transaction on Flow Testnet Explorer")
        log("🎯 This proves Flow testnet connectivity works!")
    }
}