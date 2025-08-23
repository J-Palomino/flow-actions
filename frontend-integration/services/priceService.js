/**
 * Price Service for FLOW to USD conversion
 */

class PriceService {
    constructor() {
        this.cachedPrice = null;
        this.lastFetch = null;
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    }

    /**
     * Get FLOW price in USD
     * Uses CoinGecko API as primary source with fallback to CoinMarketCap
     */
    async getFlowPriceUSD() {
        try {
            // Return cached price if still valid
            if (this.cachedPrice && this.lastFetch && (Date.now() - this.lastFetch < this.cacheExpiry)) {
                return this.cachedPrice;
            }

            let price = null;

            // Try CoinGecko first (free tier, no API key needed)
            try {
                const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=flow&vs_currencies=usd');
                if (response.ok) {
                    const data = await response.json();
                    if (data.flow && data.flow.usd) {
                        price = data.flow.usd;
                    }
                }
            } catch (error) {
                console.warn('CoinGecko API failed:', error.message);
            }

            // Fallback to a backup API if CoinGecko fails
            if (!price) {
                try {
                    // Alternative: CryptoCompare (free tier)
                    const response = await fetch('https://min-api.cryptocompare.com/data/price?fsym=FLOW&tsyms=USD');
                    if (response.ok) {
                        const data = await response.json();
                        if (data.USD) {
                            price = data.USD;
                        }
                    }
                } catch (error) {
                    console.warn('CryptoCompare API failed:', error.message);
                }
            }

            // If all APIs fail, use a reasonable fallback
            if (!price) {
                console.warn('All price APIs failed, using fallback price');
                price = 0.50; // Reasonable fallback price for FLOW
            }

            // Cache the result
            this.cachedPrice = price;
            this.lastFetch = Date.now();

            return price;
        } catch (error) {
            console.error('Error fetching FLOW price:', error);
            // Return fallback price
            return 0.50;
        }
    }

    /**
     * Convert FLOW amount to USD
     */
    async convertFlowToUSD(flowAmount) {
        try {
            const priceUSD = await this.getFlowPriceUSD();
            const usdValue = parseFloat(flowAmount) * priceUSD;
            return usdValue;
        } catch (error) {
            console.error('Error converting FLOW to USD:', error);
            return 0;
        }
    }

    /**
     * Format USD amount for display
     */
    formatUSD(amount) {
        if (amount < 0.01) {
            return '< $0.01';
        }
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 4
        }).format(amount);
    }

    /**
     * Format FLOW amount for display
     */
    formatFLOW(amount) {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 8
        }).format(amount) + ' FLOW';
    }
}

// Export singleton instance
const priceService = new PriceService();
export default priceService;