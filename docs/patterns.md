# Workflow Patterns

## Pattern: Restaking Workflow
**Purpose**: Claim staking rewards, convert to LP tokens, re-stake automatically  
**Components**: [`PoolRewardsSource`](./connectors.md#poolrewardssource) → [`SwapSource`](./connectors.md#swapsource) → [`PoolSink`](./connectors.md#poolsink)  
**File**: [`restaking-workflow.md`](./workflows/restaking-workflow.md)

### Expected Inputs
- `pid: UInt64` – Pool identifier
- `rewardTokenType: Type` – Type of reward tokens to claim
- `pairTokenType: Type` – Second token in the LP pair
- `minimumRestakedAmount: UFix64` – Absolute minimum expected restaked amount

---

For AutoBalancer and other advanced patterns, see:
- [`workflows/autobalancer-workflow.md`](./workflows/autobalancer-workflow.md)
- [`transaction-templates.md`](./transaction-templates.md)
