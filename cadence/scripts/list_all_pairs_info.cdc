import "SwapFactory"
import "SwapInterfaces"
import "SwapConfig"

access(all) struct PairInfoOut {
    access(all) let pairAddr: Address
    access(all) let token0Key: String
    access(all) let token1Key: String
    access(all) let isStableswap: Bool

    init(pairAddr: Address, token0Key: String, token1Key: String, isStableswap: Bool) {
        self.pairAddr = pairAddr
        self.token0Key = token0Key
        self.token1Key = token1Key
        self.isStableswap = isStableswap
    }
}

access(all) fun main(): [PairInfoOut] {
    let total: Int = SwapFactory.getAllPairsLength()
    if total == 0 {
        return []
    }

    let lastIndex: UInt64 = UInt64(total) - 1
    let pairAddrs: [Address] = SwapFactory.getSlicedPairs(from: 0, to: lastIndex)

    var results: [PairInfoOut] = []
    for addr in pairAddrs {
        if let pair = getAccount(addr)
            .capabilities
            .borrow<&{SwapInterfaces.PairPublic}>(SwapConfig.PairPublicPath) {
            let info = pair.getPairInfoStruct()
            results.append(PairInfoOut(
                pairAddr: info.pairAddr,
                token0Key: info.token0Key,
                token1Key: info.token1Key,
                isStableswap: info.isStableswap
            ))
        }
    }

    return results
} 