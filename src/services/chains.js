export const Ethereum = {
  hex: "0x1",
  name: "Ethereum",
  rpcUrl: `https://eth-mainnet.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_MAINNET}`,
  ticker: "ETH",
  decimals: 18,
};

export const MumbaiTestnet = {
  hex: "0x13881",
  name: "Mumbai Testnet",
  rpcUrl: `https://polygon-mumbai.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_MUMBAI}`,
  ticker: "MATIC",
  decimals: 18,
};

export const GoreliTestnet = {
  hex: "0x5",
  name: "Goreli Testnet",
  rpcUrl: `https://eth-goerli.g.alchemy.com/v2/${process.env.REACT_APP_ALCHEMY_MAINNET}`,
  ticker: "GoerliETH",
  decimals: 18,
};

export const CHAINS_CONFIG = {
  "0x1": Ethereum,
  "0x13881": MumbaiTestnet,
  "0x5": GoreliTestnet,
};
