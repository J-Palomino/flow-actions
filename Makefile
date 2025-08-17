SHELL := /bin/bash
FLOW := ./flow-cli.exe

# Defaults
NETWORK ?= emulator
SIGNER ?= emulator-account

.PHONY: start emulator deploy test demo-crosschain demo-evm-subscription configure-subscription deploy-testnet testnet-demo

# Start emulator and deploy contracts
start:
	bash scripts/start.sh

# Alias for start (emulator environment)
emulator:
	bash scripts/start.sh

# Deploy configured contracts to the selected network
deploy:
	$(FLOW) project deploy --network $(NETWORK)

# Run cadence tests
test:
	$(FLOW) test

# Run cross-chain demo transaction  
demo-crosschain:
	$(FLOW) transactions send cadence/transactions/cross-chain/simple_demo.cdc 1.0 --network $(NETWORK) --signer $(SIGNER)

# Run EVM subscription demo
demo-evm-subscription:
	$(FLOW) transactions send cadence/transactions/evm-subscriptions/simple_evm_demo.cdc "0x742d35Cc6565C7a77d72bEF13b3E6C3b3F0a6F1A" 50.0 0xf8d6e0586b0a20c7 10.0 --network $(NETWORK) --signer $(SIGNER)

# Configure a new subscription (detailed walkthrough)
configure-subscription:
	$(FLOW) transactions send cadence/transactions/evm-subscriptions/configure_new_subscription.cdc "0x89Ab7b7F8C3a9B2D4E5F6789aBcDef123456789A" 100.0 0xf8d6e0586b0a20c7 "Premium Cloud Storage" "Pro Plan - 1TB" 15.0 6 --network $(NETWORK) --signer $(SIGNER)

# Deploy to Flow Testnet
deploy-testnet:
	bash scripts/deploy-testnet.sh

# Run interactive testnet demo  
testnet-demo:
	bash scripts/testnet-demo.sh

# Run testnet demos without redeployment
testnet-demos-only:
	bash scripts/testnet-demos-only.sh

# Fix testnet private key format issues
fix-testnet-key:
	bash scripts/fix-testnet-key.sh

# Simple testnet demos (using emulator account format)
testnet-simple:
	bash scripts/testnet-simple.sh

# Diagnostic testnet check
testnet-diagnostic:
	bash scripts/testnet-diagnostic.sh

# Basic testnet demos (core contracts only)
testnet-basic:
	bash scripts/testnet-basic-demo.sh

# Working testnet demos (file-based transactions)
testnet-working:
	bash scripts/testnet-working-demos.sh

# Final testnet demonstration (hybrid approach)
testnet-final:
	bash scripts/testnet-final.sh