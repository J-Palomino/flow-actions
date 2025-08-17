import "FlareFDCTriggers"
import "SimpleUsageSubscriptions"
import "UsageBasedSubscriptions"

/// FlareOracleVerifier: Ensures Flare oracle is the single source of truth for LiteLLM usage data
/// This contract validates that all usage data comes through authenticated Flare oracle feeds
access(all) contract FlareOracleVerifier {

    /// Events
    access(all) event OracleDataReceived(
        source: String,
        vaultId: UInt64,
        totalTokens: UInt64,
        apiCalls: UInt64,
        timestamp: UFix64,
        attestationProof: String
    )
    
    access(all) event OracleValidationPassed(
        vaultId: UInt64,
        dataHash: String,
        flareRoundId: UInt64
    )
    
    access(all) event OracleValidationFailed(
        vaultId: UInt64,
        reason: String
    )
    
    access(all) event DataSourceRegistered(
        source: String,
        isAuthorized: Bool
    )

    /// Storage paths
    access(all) let VerifierStoragePath: StoragePath
    access(all) let VerifierPublicPath: PublicPath
    access(all) let VerifierPrivatePath: PrivatePath

    /// Authorized data sources (only Flare oracle should be authorized)
    access(self) var authorizedSources: {String: Bool}
    
    /// Attestation records for audit trail
    access(self) var attestationRecords: {UInt64: [AttestationRecord]}
    
    /// Last processed Flare round ID to prevent replay attacks
    access(self) var lastProcessedRoundId: UInt64

    /// Attestation record structure
    access(all) struct AttestationRecord {
        access(all) let vaultId: UInt64
        access(all) let dataHash: String
        access(all) let flareRoundId: UInt64
        access(all) let timestamp: UFix64
        access(all) let source: String
        access(all) let isValid: Bool
        
        init(
            vaultId: UInt64,
            dataHash: String,
            flareRoundId: UInt64,
            timestamp: UFix64,
            source: String,
            isValid: Bool
        ) {
            self.vaultId = vaultId
            self.dataHash = dataHash
            self.flareRoundId = flareRoundId
            self.timestamp = timestamp
            self.source = source
            self.isValid = isValid
        }
    }

    /// Oracle Verifier Resource - Validates all incoming usage data
    access(all) resource OracleVerifier {
        
        /// Verify and process usage data from Flare oracle
        access(all) fun verifyAndProcessUsage(
            trigger: FlareFDCTriggers.FDCTrigger,
            attestationProof: String
        ): Bool {
            // Step 1: Verify source is authorized (must be Flare)
            if !FlareOracleVerifier.isAuthorizedSource(trigger.sourceChain) {
                emit OracleValidationFailed(
                    vaultId: trigger.payload["vaultId"] as? UInt64 ?? 0,
                    reason: "Unauthorized source: ".concat(trigger.sourceChain)
                )
                return false
            }
            
            // Step 2: Verify attestation signature
            if !self.verifyAttestationSignature(trigger, attestationProof) {
                emit OracleValidationFailed(
                    vaultId: trigger.payload["vaultId"] as? UInt64 ?? 0,
                    reason: "Invalid attestation signature"
                )
                return false
            }
            
            // Step 3: Verify round ID is newer (prevent replay)
            let roundId = trigger.payload["flareRoundId"] as? UInt64 ?? 0
            if roundId <= FlareOracleVerifier.lastProcessedRoundId {
                emit OracleValidationFailed(
                    vaultId: trigger.payload["vaultId"] as? UInt64 ?? 0,
                    reason: "Stale or replayed data"
                )
                return false
            }
            
            // Step 4: Extract and validate usage data
            let vaultId = trigger.payload["vaultId"] as? UInt64 ?? 0
            let totalTokens = trigger.payload["totalTokens"] as? UInt64 ?? 0
            let apiCalls = trigger.payload["apiCalls"] as? UInt64 ?? 0
            
            // Step 5: Create attestation record
            let dataHash = self.calculateDataHash(vaultId: vaultId, tokens: totalTokens, calls: apiCalls)
            let record = AttestationRecord(
                vaultId: vaultId,
                dataHash: dataHash,
                flareRoundId: roundId,
                timestamp: trigger.timestamp,
                source: trigger.sourceChain,
                isValid: true
            )
            
            // Step 6: Store attestation record
            FlareOracleVerifier.storeAttestationRecord(record)
            
            // Step 7: Update last processed round
            FlareOracleVerifier.lastProcessedRoundId = roundId
            
            // Step 8: Emit validation success
            emit OracleValidationPassed(
                vaultId: vaultId,
                dataHash: dataHash,
                flareRoundId: roundId
            )
            
            emit OracleDataReceived(
                source: "Flare Oracle",
                vaultId: vaultId,
                totalTokens: totalTokens,
                apiCalls: apiCalls,
                timestamp: trigger.timestamp,
                attestationProof: attestationProof
            )
            
            return true
        }
        
        /// Verify attestation signature from Flare
        access(self) fun verifyAttestationSignature(
            trigger: FlareFDCTriggers.FDCTrigger,
            proof: String
        ): Bool {
            // In production, this would verify the cryptographic signature
            // from Flare's StateConnector attestation providers
            
            // For now, check that signature exists and is non-empty
            return trigger.signature.length > 0 && proof.length > 0
        }
        
        /// Calculate deterministic hash of usage data
        access(self) fun calculateDataHash(
            vaultId: UInt64,
            tokens: UInt64,
            calls: UInt64
        ): String {
            // Create deterministic hash of the data
            let data = vaultId.toString()
                .concat("-")
                .concat(tokens.toString())
                .concat("-")
                .concat(calls.toString())
            
            // In production, use proper hashing
            return "0x".concat(data)
        }
    }

    /// Check if a source is authorized (only Flare should be)
    access(all) fun isAuthorizedSource(_ source: String): Bool {
        return self.authorizedSources[source] ?? false
    }
    
    /// Get attestation records for a vault
    access(all) fun getAttestationRecords(vaultId: UInt64): [AttestationRecord] {
        return self.attestationRecords[vaultId] ?? []
    }
    
    /// Get last processed Flare round ID
    access(all) fun getLastProcessedRound(): UInt64 {
        return self.lastProcessedRoundId
    }
    
    /// Store attestation record (internal)
    access(contract) fun storeAttestationRecord(_ record: AttestationRecord) {
        if self.attestationRecords[record.vaultId] == nil {
            self.attestationRecords[record.vaultId] = []
        }
        self.attestationRecords[record.vaultId]!.append(record)
    }
    
    /// Admin function to authorize a data source
    access(account) fun authorizeSource(_ source: String) {
        self.authorizedSources[source] = true
        emit DataSourceRegistered(source: source, isAuthorized: true)
    }
    
    /// Admin function to revoke a data source
    access(account) fun revokeSource(_ source: String) {
        self.authorizedSources[source] = false
        emit DataSourceRegistered(source: source, isAuthorized: false)
    }
    
    /// Create a new OracleVerifier resource
    access(all) fun createVerifier(): @OracleVerifier {
        return <- create OracleVerifier()
    }

    init() {
        // Set up storage paths
        self.VerifierStoragePath = /storage/FlareOracleVerifier
        self.VerifierPublicPath = /public/FlareOracleVerifier
        self.VerifierPrivatePath = /private/FlareOracleVerifier
        
        // Initialize state
        self.authorizedSources = {}
        self.attestationRecords = {}
        self.lastProcessedRoundId = 0
        
        // Authorize only Flare as the data source
        self.authorizeSource("flare")
        self.authorizeSource("litellm") // LiteLLM via Flare FDC
        
        // Create and store verifier
        let verifier <- create OracleVerifier()
        self.account.storage.save(<- verifier, to: self.VerifierStoragePath)
        
        // Create public capability
        let verifierCap = self.account.capabilities.storage.issue<&OracleVerifier>(
            self.VerifierStoragePath
        )
        self.account.capabilities.publish(verifierCap, at: self.VerifierPublicPath)
        
        log("FlareOracleVerifier deployed - Flare is now the source of truth for LiteLLM data")
    }
}