# Flare FDC + LayerZero Cross-Chain Integration

This integration combines Flare Data Connector (FDC) triggers with LayerZero cross-chain messaging to create automated DeFi operations across multiple blockchains.

## Architecture Overview

```
Flare FDC Trigger → Flow Actions Processing → LayerZero Message → Target Chain Execution
```

### Components

1. **FlareFDCTriggers Contract** (`cadence/contracts/triggers/FlareFDCTriggers.cdc`)
   - Receives and validates FDC triggers
   - Manages trigger handlers registry
   - Supports multiple trigger types (price, volume, liquidity, governance, etc.)

2. **LayerZeroConnectors Contract** (`cadence/contracts/cross-chain/LayerZeroConnectors.cdc`)
   - Implements Flow Actions Source/Sink interfaces for cross-chain operations
   - Handles LayerZero message encoding/decoding
   - Executes cross-chain DeFi actions

3. **Cross-Chain Transactions**
   - Setup automation (`setup_fdc_layerzero_automation.cdc`)
   - Execute operations (`execute_cross_chain_defi.cdc`)

## Supported Trigger Types

- **PriceThreshold**: React to price movements crossing thresholds
- **VolumeSpike**: Trigger on unusual trading volume
- **LiquidityChange**: Respond to liquidity pool changes
- **GovernanceVote**: Execute based on governance decisions
- **BridgeEvent**: React to cross-chain bridge activities
- **DefiProtocolEvent**: Respond to protocol state changes

## Supported Chains

- Ethereum (Chain ID: 101)
- Binance Smart Chain (Chain ID: 102) 
- Polygon (Chain ID: 109)
- Arbitrum (Chain ID: 110)
- Optimism (Chain ID: 111)
- Avalanche (Chain ID: 106)

## Cross-Chain Actions

- **TokenTransfer**: Move tokens between chains
- **LiquidityProvision**: Add/remove liquidity across chains
- **Swap**: Execute swaps on target chains
- **Stake/Unstake**: Manage staking positions
- **Harvest**: Collect rewards across protocols
- **Compound**: Reinvest rewards automatically

## Usage Examples

### Setup Integration

```bash
# Deploy contracts
./flow-cli.exe project deploy --network emulator --update

# Setup FDC to LayerZero automation
./flow-cli.exe transactions send cadence/transactions/cross-chain/setup_fdc_layerzero_automation.cdc \
  --network emulator --signer emulator-account
```

### Execute Cross-Chain Operation

```bash
# Trigger a cross-chain swap based on price threshold
./flow-cli.exe transactions send cadence/transactions/cross-chain/execute_cross_chain_defi.cdc \
  --network emulator --signer emulator-account \
  --args-json '[
    {"type": "UInt8", "value": "0"},
    {"type": "String", "value": "ethereum"},
    {"type": "UInt8", "value": "0"},
    {"type": "{String: String}", "value": {"asset": "ETH", "threshold": "2000.0", "amount": "1.0"}}
  ]'
```

### Check Integration Status

```bash
./flow-cli.exe scripts execute cadence/scripts/cross-chain/check_fdc_integration.cdc \
  --network emulator
```

### Simulate FDC Trigger

```bash
# Simulate price threshold trigger
./flow-cli.exe scripts execute cadence/scripts/cross-chain/simulate_fdc_trigger.cdc \
  --network emulator \
  --args-json '[
    {"type": "UInt8", "value": "0"},
    {"type": "String", "value": "ethereum"},
    {"type": "UInt8", "value": "1"},
    {"type": "UFix64?", "value": "2000.0"},
    {"type": "UFix64?", "value": null},
    {"type": "UFix64?", "value": null}
  ]'
```

## Flow Actions Pattern

The integration follows the Flow Actions pattern:

1. **Source**: `LayerZeroSource` prepares cross-chain messages
2. **Sink**: `LayerZeroSink` executes received cross-chain actions  
3. **Trigger Handler**: `FDCToLayerZeroHandler` converts FDC triggers to LayerZero messages

### Example Flow

```cadence
// 1. FDC trigger received
let trigger = FlareFDCTriggers.FDCTrigger(...)

// 2. Handler processes trigger
let handler <- LayerZeroConnectors.createFDCHandler()
handler.handleTrigger(trigger: trigger)

// 3. LayerZero message created and sent
let source <- LayerZeroConnectors.createLayerZeroSource(...)
let vault <- source.withdraw(amount: 1.0)

// 4. Target chain receives and executes
let sink <- LayerZeroConnectors.createLayerZeroSink(...)
sink.deposit(vault: <-vault)
```

## Configuration

### Chain Mapping
Configure target chain mappings in `LayerZeroConnectors.ChainIds`:

```cadence
self.ChainIds = {
    "Flow": 114,
    "Ethereum": 101,
    "BSC": 102,
    "Polygon": 109,
    "Arbitrum": 110,
    "Optimism": 111,
    "Avalanche": 106
}
```

### Trigger Type Mapping
Map FDC triggers to cross-chain actions:

```cadence
PriceThreshold -> Swap
VolumeSpike -> Swap  
LiquidityChange -> LiquidityProvision
GovernanceVote -> Harvest
BridgeEvent -> TokenTransfer
DefiProtocolEvent -> Compound
```

## Security Considerations

1. **FDC Signature Verification**: Validate authentic Flare FDC signatures
2. **LayerZero Message Validation**: Verify cross-chain message integrity
3. **Access Controls**: Restrict trigger handler registration
4. **Gas Limits**: Set appropriate gas limits for cross-chain execution
5. **Reentrancy Protection**: Prevent reentrancy in cross-chain operations

## Testing

```bash
# Run all tests
make test

# Test specific cross-chain functionality
./flow-cli.exe test --filter="cross_chain"
```

## Next Steps

1. Implement real FDC signature verification
2. Add LayerZero endpoint integration
3. Implement specific DeFi protocol connectors
4. Add cross-chain gas fee estimation
5. Create monitoring and alerting system
6. Add emergency pause functionality

## Resources

- [Flare FDC Documentation](https://dev.flare.network/fdc/overview/)
- [LayerZero Documentation](https://layerzero.gitbook.io/)
- [Flow Actions Framework](https://github.com/IncrementFi/flow-actions)