import "FlareOracleVerifier"
import "FlareFDCTriggers"

/// Transaction to verify that usage data is coming through Flare oracle
transaction(vaultId: UInt64) {
    
    let verifier: &FlareOracleVerifier.OracleVerifier
    
    prepare(signer: auth(BorrowValue) &Account) {
        // Borrow the oracle verifier
        self.verifier = signer.storage.borrow<&FlareOracleVerifier.OracleVerifier>(
            from: FlareOracleVerifier.VerifierStoragePath
        ) ?? panic("Oracle verifier not found. Deploy FlareOracleVerifier contract first.")
    }
    
    execute {
        // Get attestation records for the vault
        let records = FlareOracleVerifier.getAttestationRecords(vaultId: vaultId)
        
        if records.length == 0 {
            log("⚠️ No oracle attestation records found for vault ".concat(vaultId.toString()))
            log("This vault has not received any data from Flare oracle yet.")
            return
        }
        
        log("✅ Found ".concat(records.length.toString()).concat(" Flare oracle attestations for vault ").concat(vaultId.toString()))
        
        // Display recent attestations
        var validCount = 0
        var invalidCount = 0
        
        for record in records {
            if record.isValid {
                validCount = validCount + 1
                log("📊 Valid attestation:")
                log("  - Flare Round ID: ".concat(record.flareRoundId.toString()))
                log("  - Data Hash: ".concat(record.dataHash))
                log("  - Source: ".concat(record.source))
                log("  - Timestamp: ".concat(record.timestamp.toString()))
            } else {
                invalidCount = invalidCount + 1
            }
        }
        
        log("\n📈 Summary:")
        log("  - Total attestations: ".concat(records.length.toString()))
        log("  - Valid: ".concat(validCount.toString()))
        log("  - Invalid: ".concat(invalidCount.toString()))
        
        // Check if source is authorized
        let isFlareAuthorized = FlareOracleVerifier.isAuthorizedSource("flare")
        let isLiteLLMAuthorized = FlareOracleVerifier.isAuthorizedSource("litellm")
        
        log("\n🔐 Data Source Authorization:")
        log("  - Flare oracle: ".concat(isFlareAuthorized ? "✅ AUTHORIZED" : "❌ NOT AUTHORIZED"))
        log("  - LiteLLM via FDC: ".concat(isLiteLLMAuthorized ? "✅ AUTHORIZED" : "❌ NOT AUTHORIZED"))
        
        // Get last processed round
        let lastRound = FlareOracleVerifier.getLastProcessedRound()
        log("\n🔄 Last processed Flare round ID: ".concat(lastRound.toString()))
        
        if validCount > 0 {
            log("\n✅ VERIFICATION PASSED: This vault's usage data is verified by Flare oracle")
            log("Flare is the confirmed source of truth for this subscription's billing data.")
        } else {
            log("\n⚠️ WARNING: No valid Flare attestations found for this vault")
            log("Usage data may not be properly synchronized with Flare oracle.")
        }
    }
}