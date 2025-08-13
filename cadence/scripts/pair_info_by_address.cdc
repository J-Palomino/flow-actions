import "SwapInterfaces"
import "SwapConfig"

access(all) struct PairInfoView {
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

access(all) fun main(pairAddr: Address): PairInfoView? {
    let pair = getAccount(pairAddr)
        .capabilities
        .borrow<&{SwapInterfaces.PairPublic}>(SwapConfig.PairPublicPath)
    if pair == nil {
        return nil
    }
    let info = pair!.getPairInfoStruct()
    return PairInfoView(
        pairAddr: info.pairAddr,
        token0Key: info.token0Key,
        token1Key: info.token1Key,
        isStableswap: info.isStableswap
    )
} 