#!/usr/bin/env bash
set -euo pipefail

FLOW_BIN="${FLOW_BIN:-flow}"
NETWORK="${NETWORK:-emulator}"

if ! command -v "$FLOW_BIN" >/dev/null 2>&1; then
  echo "Error: flow CLI not found. Install from https://developers.flow.com/tools/flow-cli/install" >&2
  exit 1
fi

# Start the emulator in the background
"$FLOW_BIN" emulator &
EMULATOR_PID=$!

# Wait for the emulator to be ready (up to 30 seconds)
for i in {1..60}; do
  if (echo > /dev/tcp/127.0.0.1/3569) >/dev/null 2>&1; then
    break
  fi
  sleep 0.5
done

# Check if the emulator started successfully
if ! (echo > /dev/tcp/127.0.0.1/3569) >/dev/null 2>&1; then
  echo "Error: Flow emulator failed to start on port 3569" >&2
  kill $EMULATOR_PID 2>/dev/null || true
  wait $EMULATOR_PID 2>/dev/null || true
  exit 1
fi

echo "Installing Flow dependencies (flow deps install)"
"$FLOW_BIN" deps install || true
echo "Deploying contracts to --network $NETWORK"
"$FLOW_BIN" project deploy --network "$NETWORK" || true

# Deploy swap pair template
"$FLOW_BIN" transactions send \
  --signer emulator-account \
  --network emulator \
  "$(pwd)/scripts/transactions/increment-fi/deploy_swap_pair.cdc"

# Create a pair with the staking pool
"$FLOW_BIN" transactions send \
  --signer emulator-account \
  --network emulator \
  "$(pwd)/scripts/transactions/increment-fi/create_swap_pair.cdc" \
  --args-json '[
    {
      "type": "String",
      "value": "A.f8d6e0586b0a20c7.stFlowToken.Vault"
    },
    {
      "type": "String",
      "value": "A.0ae53cb6e3f42a79.FlowToken.Vault"
    },
    {
      "type": "Bool",
      "value": true
    }
  ]'

# Mint tokens to

# Create an example staking pool
"$FLOW_BIN" transactions send \
  --signer emulator-account \
  --network emulator \
  "$(pwd)/scripts/transactions/increment-fi/create_staking_pool.cdc" \
  --args-json '[
    {
      "type": "UFix64",
      "value": "184467440737.09551615"
    },
    {
      "type": "Type",
      "value": {
        "staticType": {
          "kind": "Resource",
          "typeID": "A.0ae53cb6e3f42a79.FlowToken.Vault",
          "fields": [],
          "initializers": [],
          "type": ""
        }
      }
    },
    {
      "type": "Array",
      "value": [
        {
          "type": "Struct",
          "value": {
            "id": "A.f8d6e0586b0a20c7.Staking.RewardInfo",
            "fields": [
              { "name": "startTimestamp",   "value": { "type": "UFix64", "value": "0.00000000" } },
              { "name": "endTimestamp",     "value": { "type": "UFix64", "value": "0.00000000" } },
              { "name": "rewardPerSession", "value": { "type": "UFix64", "value": "1.00000000" } },
              { "name": "sessionInterval",  "value": { "type": "UFix64", "value": "1.00000000" } },
              { "name": "rewardTokenKey",   "value": { "type": "String", "value": "A.f8d6e0586b0a20c7.stFlowToken" } },
              { "name": "totalReward",      "value": { "type": "UFix64", "value": "0.00000000" } },
              { "name": "lastRound",        "value": { "type": "UInt64", "value": "0" } },
              { "name": "totalRound",       "value": { "type": "UInt64", "value": "0" } },
              { "name": "rewardPerSeed",    "value": { "type": "UFix64", "value": "0.00000000" } }
            ]
          }
        }
      ]
    },
    {
      "type": "Optional",
      "value": null
    },
    {
      "type": "Optional",
      "value": null
    }
  ]' >> /dev/null 2>&1
echo "Staking pool created with pid: 0"

# Wait for the emulator process to finish (keep it running in the foreground)
wait $EMULATOR_PID