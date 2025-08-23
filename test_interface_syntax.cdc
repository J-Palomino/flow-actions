import "FungibleToken"
import "FlowToken"
import "FlareFDCTriggers"

// Test syntax of our interface changes
access(all) contract TestInterface {
    
    /// Public interface for subscription vault - exposes safe public methods
    access(all) resource interface SubscriptionVaultPublic {
        access(all) let id: UInt64
        access(all) let customer: Address
        access(all) let provider: Address
        access(all) let serviceName: String
        access(all) var litellmApiKey: String?
        
        // Public methods
        access(all) fun setLiteLLMApiKey(apiKey: String)
        access(all) fun getLiteLLMApiKey(): String?
    }

    /// Test resource implementing the interface
    access(all) resource TestVault: SubscriptionVaultPublic {
        access(all) let id: UInt64
        access(all) let customer: Address
        access(all) let provider: Address
        access(all) let serviceName: String
        access(all) var litellmApiKey: String?
        
        access(all) fun setLiteLLMApiKey(apiKey: String) {
            self.litellmApiKey = apiKey
        }
        
        access(all) fun getLiteLLMApiKey(): String? {
            return self.litellmApiKey
        }
        
        init(id: UInt64, customer: Address, provider: Address, serviceName: String) {
            self.id = id
            self.customer = customer
            self.provider = provider
            self.serviceName = serviceName
            self.litellmApiKey = nil
        }
    }
    
    access(all) fun createTestVault(): @TestVault {
        return <- create TestVault(
            id: 1, 
            customer: 0x01, 
            provider: 0x02, 
            serviceName: "test"
        )
    }
    
    init() {}
}