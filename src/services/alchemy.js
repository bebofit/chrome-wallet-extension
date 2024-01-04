// importing axios for making requests
import axios from "axios";
import { CHAINS_CONFIG } from "./chains";

export async function getBalance(address, chainId) {
  const baseURL = CHAINS_CONFIG[chainId]?.rpcUrl;
  if (!baseURL) {
    console.log("Invalid chainId");
    return;
  }

  // Data for making the request to query token balances
  const data = JSON.stringify({
    jsonrpc: "2.0",
    method: "eth_getBalance",
    headers: {
      "Content-Type": "application/json",
    },
    params: [`${address}`],
    id: Math.random() * 1000000000000000,
  });

  const config = {
    method: "post",
    url: baseURL,
    headers: {
      "Content-Type": "application/json",
    },
    data: data,
  };
  let res = await axios(config);
  console.log("BALANCE", Number(res?.data?.result));
  return res?.data?.result
    ? Number(res?.data?.result) / 10 ** CHAINS_CONFIG[chainId].decimals
    : 0;
}

export async function estimateGas(address, amount, chainId) {
  const baseURL = CHAINS_CONFIG[chainId]?.rpcUrl;
  if (!baseURL) {
    console.log("Invalid chainId");
    return;
  }

  // Data for making the request to query token balances
  const data = JSON.stringify({
    jsonrpc: "2.0",
    method: "eth_estimateGas",
    headers: {
      "Content-Type": "application/json",
    },
    params: [
      {
        to: address,
        value: `0x${amount.toString(16)}`,
      },
    ],
    id: Math.random() * 1000000000000000,
  });

  const config = {
    method: "post",
    url: baseURL,
    headers: {
      "Content-Type": "application/json",
    },
    data: data,
  };
  console.log(config);
  let res = await axios(config);
  console.log(res.data);
  return res?.data?.result ? Number(res?.data?.result) / 10 ** 24 : 0;
}

export async function getTokenBalances(address, chainId) {
  const baseURL = CHAINS_CONFIG[chainId]?.rpcUrl;
  if (!baseURL) {
    console.log("Invalid chainId");
    return;
  }

  // Data for making the request to query token balances
  const data = JSON.stringify({
    jsonrpc: "2.0",
    method: "alchemy_getTokenBalances",
    headers: {
      "Content-Type": "application/json",
    },
    params: [`${address}`],
    id: Math.random() * 1000000000000000,
  });

  const config = {
    method: "post",
    url: baseURL,
    headers: {
      "Content-Type": "application/json",
    },
    data: data,
  };
  let response = await axios(config);
  response = response["data"];

  // Getting balances from the response
  const balances = response["result"];

  // Remove tokens with zero balance
  const nonZeroBalances = await balances.tokenBalances.filter((token) => {
    return token.tokenBalance !== "0";
  });

  console.log(`Token balances of ${address}: \n`);

  // Counter for SNo of final output
  let i = 1;
  let tokens = [];

  // Loop through all tokens with non-zero balance
  for (let token of nonZeroBalances) {
    // Get balance of token
    let balance = token.tokenBalance;

    // options for making a request to get the token metadata
    const options = {
      method: "POST",
      url: baseURL,
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      data: {
        id: 1,
        jsonrpc: "2.0",
        method: "alchemy_getTokenMetadata",
        params: [token.contractAddress],
      },
    };

    // getting the token metadata
    const metadata = await axios.request(options);

    // Compute token balance in human-readable format
    // balance = balance / Math.pow(10, metadata["data"]["result"].decimals);
    tokens.push({
      name: metadata["data"]["result"].name,
      balance: balance,
      symbol: metadata["data"]["result"].symbol,
      decimals: metadata["data"]["result"].decimals,
      logo: metadata["data"]["result"].logo,
    });
    // Print name, balance, and symbol of token
    console.log(
      `${i++}. ${metadata["data"]["result"].name}: ${balance} ${
        metadata["data"]["result"].symbol
      }`
    );
  }
  return tokens;
}
