
import "SimpleUsageSubscriptions"

transaction(vaultId: UInt64, totalTokens: UInt64, apiCalls: UInt64, gpt4Tokens: UInt64, gpt35Tokens: UInt64) {
    prepare(signer: &Account) {
        // Create usage report
        let usage = SimpleUsageSubscriptions.UsageReport(
            vaultId: vaultId,
            totalTokens: totalTokens,
            apiCalls: apiCalls,
            gpt4Tokens: gpt4Tokens,
            gpt35Tokens: gpt35Tokens
        )
        
        // Process the usage update
        SimpleUsageSubscriptions.processUsageUpdate(usage: usage)
        
        log("Oracle usage update processed for vault ".concat(vaultId.toString()))
    }
}