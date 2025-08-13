import "Staking"

access(all) fun main(): [Staking.PoolInfo] {
    let collectionRef = getAccount(Type<Staking>().address!)
        .capabilities
        .borrow<&{Staking.PoolCollectionPublic}>(Staking.CollectionPublicPath)
        ?? panic("Staking collection not found")

    let length: Int = collectionRef.getCollectionLength()
    if length == 0 {
        return []
    }

    let lastIndex: UInt64 = UInt64(length) - 1
    return collectionRef.getSlicedPoolInfo(from: 0, to: lastIndex)
} 