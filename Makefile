SHELL := /bin/bash
FLOW := flow

# Defaults
NETWORK ?= emulator
SIGNER ?= emulator-account

.PHONY: start deploy lint test

# Start emulator and deploy contracts
start:
	bash scripts/start.sh

# Deploy configured contracts to the selected network
deploy:
	$(FLOW) project deploy --network $(NETWORK)

# Lint main transaction(s)
lint:
	$(FLOW) cadence lint cadence/transactions/increment_fi_restake.cdc --network $(NETWORK)

# Run cadence tests
test:
	$(FLOW) test