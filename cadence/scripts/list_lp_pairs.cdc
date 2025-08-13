import "Staking"
import "IncrementFiStakingConnectors"
import "SwapInterfaces"
import "SwapConfig"

access(all) struct PairDetail {
    access(all) let pid: UInt64
    access(all) let pairAddr: Address
    access(all) let token0Key: String
    access(all) let token1Key: String
    access(all) let isStableswap: Bool

    init(pid: UInt64, pairAddr: Address, token0Key: String, token1Key: String, isStableswap: Bool) {
        self.pid = pid
        self.pairAddr = pairAddr
        self.token0Key = token0Key
        self.token1Key = token1Key
        self.isStableswap = isStableswap
    }
}

access(all) fun main(): [PairDetail] {
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

    var results: [PairDetail] = []
    for pool in pools {
        if let pair = IncrementFiStakingConnectors.borrowPairPublicByPid(pid: pool.pid) {
            let info = pair.getPairInfoStruct()
            results.append(PairDetail(
                pid: pool.pid,
                pairAddr: info.pairAddr,
                token0Key: info.token0Key,
                token1Key: info.token1Key,
                isStableswap: info.isStableswap
            ))
        }
    }

    return results
} 