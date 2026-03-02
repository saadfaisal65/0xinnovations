export interface NetworkConfig {
    id: string; // The slug
    name: string;
    symbol: string;
    faucetUrl: string;
    glowColor?: string;
    shadowColor?: string;
    iconUrl?: string;
}

export const networks: NetworkConfig[] = [
    {
        id: "ethereum-sepolia",
        name: "Ethereum Sepolia",
        symbol: "ETH",
        faucetUrl: "https://www.alchemy.com/faucets/ethereum-sepolia",
        glowColor: "from-blue-400 to-indigo-500",
        shadowColor: "rgba(99, 102, 241, 0.5)",
        iconUrl: "https://assets.coingecko.com/coins/images/279/standard/ethereum.png"
    },
    {
        id: "bsc-testnet",
        name: "BSC Testnet",
        symbol: "tBNB",
        faucetUrl: "https://faucet.quicknode.com/binance-smart-chain/bnb-testnet",
        glowColor: "from-yellow-400 to-orange-500",
        shadowColor: "rgba(245, 158, 11, 0.5)",
        iconUrl: "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/binance/info/logo.png"
    },
    {
        id: "chainlink-faucet",
        name: "Chainlink Faucet",
        symbol: "LINK",
        faucetUrl: "https://dev.chain.link/faucet",
        glowColor: "from-blue-500 to-blue-700",
        shadowColor: "rgba(37, 99, 235, 0.5)",
        iconUrl: "https://assets.coingecko.com/coins/images/877/standard/chainlink-new-logo.png"
    },
    {
        id: "solana-devnet",
        name: "Solana Devnet",
        symbol: "SOL",
        faucetUrl: "https://faucet.solana.com/",
        glowColor: "from-green-400 to-emerald-500",
        shadowColor: "rgba(16, 185, 129, 0.5)",
        iconUrl: "https://assets.coingecko.com/coins/images/4128/standard/solana.png"
    },
    {
        id: "polygon-testnet",
        name: "Polygon Testnet",
        symbol: "MATIC",
        faucetUrl: "https://faucet.polygon.technology/",
        glowColor: "from-purple-500 to-purple-700",
        shadowColor: "rgba(147, 51, 234, 0.5)",
        iconUrl: "https://assets.coingecko.com/coins/images/4713/standard/polygon.png"
    },
    {
        id: "base-sepolia",
        name: "Base Sepolia",
        symbol: "ETH",
        faucetUrl: "https://www.alchemy.com/faucets/base-sepolia",
        glowColor: "from-blue-400 to-blue-600",
        shadowColor: "rgba(59, 130, 246, 0.5)",
        iconUrl: "https://assets.coingecko.com/coins/images/279/standard/ethereum.png"
    }
];
