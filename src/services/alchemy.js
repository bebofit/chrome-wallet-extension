// importing axios for making requests
import axios from "axios";
import { CHAINS_CONFIG } from "./chains";
import Web3 from "web3";
import { ethers } from "ethers";

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

export async function sendTransactionAlc(seedPhrase, to, amount, chainId) {
  try {
    const baseURL = CHAINS_CONFIG[chainId]?.rpcUrl;
    if (!baseURL) {
      console.log("Invalid chainId");
      return;
    }
    // http provider
    const web3 = new Web3(baseURL);
    const mnemonicWallet = ethers.Wallet.fromPhrase(seedPhrase);
    const nonce = await web3.eth.getTransactionCount(
      mnemonicWallet.address,
      "latest"
    );
    const transaction = {
      to: to,
      value: web3.utils.toWei(amount, "ether"),
      nonce: nonce,
      maxFeePerGas: web3.utils.toWei("20", "gwei"),
      maxPriorityFeePerGas: web3.utils.toWei("5", "gwei"),
      gasLimit: 21000,
    };

    const signedTx = await web3.eth.accounts.signTransaction(
      transaction,
      mnemonicWallet.privateKey
    );

    const rawTransaction = signedTx.rawTransaction;

    console.log("Nonce for address", mnemonicWallet.address, "is:", nonce);
    console.log("Raw transaction:", rawTransaction);
    // send raw transaction alchemy
    const data = JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_sendRawTransaction",
      headers: {
        "Content-Type": "application/json",
      },
      params: [rawTransaction],
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
    return res?.data?.result;
  } catch (error) {
    console.log(error);
  }
}

export async function getTransactionReceipt(trxHash, chainId) {
  try {
    const baseURL = CHAINS_CONFIG[chainId]?.rpcUrl;
    if (!baseURL) {
      console.log("Invalid chainId");
      return;
    }

    // Data for making the request to query token balances
    const data = JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_getTransactionReceipt",
      headers: {
        "Content-Type": "application/json",
      },
      params: [`${trxHash}`],
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
    await new Promise((r) => setTimeout(r, 15000));
    let res = await axios(config);
    console.log(res.data);
    return res?.data?.result;
  } catch (error) {
    console.log(error);
  }
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
        value: `0x${ethers.parseEther(amount.toString()).toString(16)}`,
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
