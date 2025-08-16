SHELL := /bin/bash
FLOW := ./flow-cli.exe

# Defaults
NETWORK ?= emulator
SIGNER ?= emulator-account

.PHONY: start emulator deploy test

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