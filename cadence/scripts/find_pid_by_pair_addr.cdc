import "Staking"

access(all) fun main(pairAddr: Address): [UInt64] {
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

    let targetKey = "A.".concat(pairAddr.toString()).concat(".SwapPair")
    var res: [UInt64] = []
    for p in pools {
        if p.acceptTokenKey == targetKey {
            res.append(p.pid)
        }
    }
    return res
} 