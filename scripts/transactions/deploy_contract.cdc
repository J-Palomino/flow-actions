/// Deploys (adds or updates) a contract to the signer's account.
/// - name: the contract name to deploy (e.g. "MyContract")
/// - code: the contract source code as a hex string (UTF-8 bytes), e.g. Flow CLI can pass compiled code as hex
///
/// Notes:
/// - If the contract exists, this will update it. Otherwise, it will add it.
/// - The signer must be the account that will host the contract.
transaction(name: String, code: String) {
	prepare(acct: auth(AddContract, UpdateContract) &Account) {
		let existing = acct.contracts.get(name: name)
		if existing == nil {
			acct.contracts.add(name: name, code: code.decodeHex())
		} else {
			acct.contracts.update(name: name, code: code.decodeHex())
		}
	}
} 