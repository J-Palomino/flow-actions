import "Staking"
import "SwapInterfaces"
import "SwapConfig"
import "IncrementFiStakingConnectors"

access(all) struct PoolWithPairInfo {
    access(all) let pid: UInt64
    access(all) let acceptTokenKey: String
    access(all) let isPair: Bool
    access(all) let pairAddr: Address?
    access(all) let token0Key: String?
    access(all) let token1Key: String?
    access(all) let isStableswap: Bool?

    init(
        pid: UInt64,
        acceptTokenKey: String,
        isPair: Bool,
        pairAddr: Address?,
        token0Key: String?,
        token1Key: String?,
        isStableswap: Bool?
    ) {
        self.pid = pid
        self.acceptTokenKey = acceptTokenKey
        self.isPair = isPair
        self.pairAddr = pairAddr
        self.token0Key = token0Key
        self.token1Key = token1Key
        self.isStableswap = isStableswap
    }
}

access(all) fun main(): [PoolWithPairInfo] {
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

    var results: [PoolWithPairInfo] = []
    for pool in pools {
        let isPair = pool.acceptTokenKey.contains(".SwapPair")
        if isPair {
            let pairAddr = IncrementFiStakingConnectors.tokenTypeIdentifierToVaultType(pool.acceptTokenKey).address!

            var token0Key: String? = nil
            var token1Key: String? = nil
            var stable: Bool? = nil

            // Try standard path
            if let pair = getAccount(pairAddr)
                .capabilities
                .borrow<&{SwapInterfaces.PairPublic}>(SwapConfig.PairPublicPath) {
                let info = pair.getPairInfoStruct()
                token0Key = info.token0Key
                token1Key = info.token1Key
                stable = info.isStableswap
            } else {
                // Try a set of legacy paths
                let legacyPaths: [PublicPath] = [
                    /public/pair_public,
                    /public/SwapPair,
                    /public/swapPair,
                    /public/PairPublic,
                    /public/pairPublic,
                    /public/increment_swap_pair,
                    /public/increment_swap_pair_public
                ]
                var i = 0
                while i < legacyPaths.length {
                    if let legacyPair = getAccount(pairAddr)
                        .capabilities
                        .borrow<&{SwapInterfaces.PairPublic}>(legacyPaths[i]) {
                        // Prefer struct
                        let info = legacyPair.getPairInfoStruct()
                        token0Key = info.token0Key
                        token1Key = info.token1Key
                        stable = info.isStableswap
                        break
                    }
                    i = i + 1
                }

                // Last resort: if still nil, attempt getPairInfo array on standard and legacy paths
                if token0Key == nil {
                    // Standard path
                    if let anyPair = getAccount(pairAddr)
                        .capabilities
                        .borrow<&{SwapInterfaces.PairPublic}>(SwapConfig.PairPublicPath) {
                        let arr = anyPair.getPairInfo()
                        token0Key = arr[0] as! String
                        token1Key = arr[1] as! String
                        stable = arr[7] as! Bool
                    } else {
                        // Legacy paths array fallback
                        var j = 0
                        while j < legacyPaths.length {
                            if let anyLegacy = getAccount(pairAddr)
                                .capabilities
                                .borrow<&{SwapInterfaces.PairPublic}>(legacyPaths[j]) {
                                let arr = anyLegacy.getPairInfo()
                                token0Key = arr[0] as! String
                                token1Key = arr[1] as! String
                                stable = arr[7] as! Bool
                                break
                            }
                            j = j + 1
                        }
                    }
                }
            }

            results.append(PoolWithPairInfo(
                pid: pool.pid,
                acceptTokenKey: pool.acceptTokenKey,
                isPair: true,
                pairAddr: pairAddr,
                token0Key: token0Key,
                token1Key: token1Key,
                isStableswap: stable
            ))
        } else {
            results.append(PoolWithPairInfo(
                pid: pool.pid,
                acceptTokenKey: pool.acceptTokenKey,
                isPair: false,
                pairAddr: nil,
                token0Key: nil,
                token1Key: nil,
                isStableswap: nil
            ))
        }
    }

    return results
} 