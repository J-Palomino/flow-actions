import "Staking"
import "SwapInterfaces"
import "SwapConfig"
import "IncrementFiStakingConnectors"

access(all) fun main(): [UInt64] {
	let collectionRef = getAccount(Type<Staking>().address!)
		.capabilities
		.borrow<&{Staking.PoolCollectionPublic}>(Staking.CollectionPublicPath)
		?? panic("Staking collection not found")

	let length: Int = collectionRef.getCollectionLength()
	if length == 0 {
		return []
	}

	let lastIndex: UInt64 = UInt64(length) - 1
	let pools = collectionRef.getSlicedPoolInfo(from: 0, to: lastIndex)

	// Known token keys
	let FLOW = "A.7e60df042a9c0868.FlowToken"
	let STFLOW_A = "A.e45c64ecfe31e465.stFlowToken" // observed in pair list
	let STFLOW_B = "A.7f10faf5f1d5fa23.stFlowToken" // observed in staking rewards

	var res: [UInt64] = []
	for p in pools {
		if p.acceptTokenKey.contains(".SwapPair") {
			let pairAddr = IncrementFiStakingConnectors.tokenTypeIdentifierToVaultType(p.acceptTokenKey).address!
			if let pair = getAccount(pairAddr)
				.capabilities
				.borrow<&{SwapInterfaces.PairPublic}>(SwapConfig.PairPublicPath) {
				let info = pair.getPairInfoStruct()
				let t0 = info.token0Key
				let t1 = info.token1Key
				let isFlowStFlow = (t0 == FLOW && (t1 == STFLOW_A || t1 == STFLOW_B)) || (t1 == FLOW && (t0 == STFLOW_A || t0 == STFLOW_B))
				if isFlowStFlow {
					res.append(p.pid)
				}
			}
		}
	}
	return res
} 