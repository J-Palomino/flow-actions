import FTSOPriceFeedConnector from 0x123cb47fe122f6e3

/// Get current FLOW/USD price from Flare FTSO oracle
access(all) fun main(): {String: AnyStruct} {
    // Get FLOW/USD price from FTSO price feed
    if let priceData = FTSOPriceFeedConnector.getCurrentPrice(symbol: "FLOW/USD") {
        return {
            "success": true,
            "price": priceData.price,
            "verified": priceData.verified,
            "timestamp": priceData.timestamp,
            "source": "Flare FTSO Oracle"
        }
    }
    
    // Return fallback if oracle unavailable
    return {
        "success": false,
        "price": 0.75,
        "verified": false,
        "timestamp": 0.0,
        "source": "Fallback Price",
        "error": "FTSO price feed unavailable"
    }
}