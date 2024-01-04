import React, { useCallback, useEffect, useState } from "react";
import {
  Divider,
  Tooltip,
  List,
  Avatar,
  Spin,
  Tabs,
  Input,
  Button,
} from "antd";
import { LogoutOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import logo from "../noImg.png";
import { CHAINS_CONFIG, MumbaiTestnet } from "../services/chains";
import { ethers } from "ethers";
import { getTokenBalances, getBalance, estimateGas } from "../services/alchemy";

function WalletView({
  wallet,
  setWallet,
  seedPhrase,
  setSeedPhrase,
  selectedChain,
}) {
  const navigate = useNavigate();
  const [tokens, setTokens] = useState(null);
  const [gas, setGas] = useState(0);
  const [balance, setBalance] = useState(0);
  const [fetching, setFetching] = useState(true);
  const [amountToSend, setAmountToSend] = useState(null);
  const [sendToAddress, setSendToAddress] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [hash, setHash] = useState(null);

  const setEstimateGas = useCallback(
    async (address) => {
      setGas(0);
      if (ethers.isAddress(address) && amountToSend) {
        const amount =
          selectedChain === MumbaiTestnet.hex
            ? amountToSend
            : ethers.parseEther(amountToSend.toString());
        const gas = await estimateGas(address, amount, selectedChain);
        setGas(gas);
      }
    },
    [amountToSend, selectedChain]
  );

  const items = [
    {
      key: "3",
      label: `Tokens`,
      children: (
        <>
          {tokens ? (
            <>
              <List
                bordered
                itemLayout="horizontal"
                dataSource={tokens}
                renderItem={(item, index) => (
                  <List.Item style={{ textAlign: "left" }}>
                    <List.Item.Meta
                      avatar={<Avatar src={item.logo || logo} />}
                      title={item.symbol}
                      description={item.name}
                    />
                    <div>
                      {(
                        Number(item.balance) /
                        10 ** Number(item.decimals)
                      ).toFixed(4)}{" "}
                      Tokens
                    </div>
                  </List.Item>
                )}
              />
            </>
          ) : (
            <>
              <span>You seem to not have any tokens yet</span>
            </>
          )}
        </>
      ),
    },
    {
      key: "1",
      label: `Transfer`,
      children: (
        <>
          <h3>Native Balance </h3>
          <h1>
            {balance.toFixed(4)} {CHAINS_CONFIG[selectedChain].ticker}
          </h1>
          <div className="sendRow">
            <p style={{ width: "90px", textAlign: "left" }}> To:</p>
            <Input
              value={sendToAddress}
              onChange={async (e) => {
                setSendToAddress(e.target.value);
                await setEstimateGas(e.target.value);
              }}
              placeholder="0x..."
            />
          </div>
          <div className="sendRow">
            <p style={{ width: "90px", textAlign: "left" }}> Amount:</p>
            <Input
              value={amountToSend}
              onChange={async (e) => {
                setAmountToSend(e.target.value);
                await setEstimateGas(sendToAddress);
              }}
              placeholder="Native tokens you wish to send..."
            />
          </div>
          {gas > 0 && <h3>Estimated Gas: {gas}</h3>}

          <Button
            style={{ width: "100%", marginTop: "20px", marginBottom: "20px" }}
            type="primary"
            onClick={() => sendTransaction(sendToAddress, amountToSend)}
          >
            Send Tokens
          </Button>
          {processing && (
            <>
              <Spin />
              {hash && (
                <Tooltip title={hash}>
                  <p>Hover For Tx Hash</p>
                </Tooltip>
              )}
            </>
          )}
        </>
      ),
    },
  ];

  async function sendTransaction(to, amount) {
    const chain = CHAINS_CONFIG[selectedChain];

    const provider = new ethers.JsonRpcProvider(chain.rpcUrl);

    const privateKey = ethers.Wallet.fromPhrase(seedPhrase).privateKey;

    const wallet = new ethers.Wallet(privateKey, provider);

    const tx = {
      to: to,
      value: ethers.parseEther(amount.toString()),
    };

    setProcessing(true);
    try {
      const transaction = await wallet.sendTransaction(tx);

      setHash(transaction.hash);

      const receipt = await transaction.wait();
      setHash(null);
      setProcessing(false);
      setAmountToSend(null);
      setSendToAddress(null);
      setGas(0);

      if (receipt.status === 1) {
        getAccountTokens();
      } else {
        console.log("failed");
      }
    } catch (err) {
      console.log(err);
      setHash(null);
      setProcessing(false);
      setAmountToSend(null);
      setSendToAddress(null);
      setGas(0);
    }
  }

  async function getAccountTokens() {
    setFetching(true);

    // const tokens = await getTokenBalances(
    //   "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    //   "0x1"
    // );

    const tokens = await getTokenBalances(wallet, selectedChain);

    if (tokens.length > 0) {
      setTokens(tokens);
    }

    const balance = await getBalance(wallet, selectedChain);

    setBalance(balance);

    setFetching(false);
  }

  function logout() {
    setSeedPhrase(null);
    setWallet(null);
    setGas(0);
    setTokens(null);
    setBalance(0);
    navigate("/");
  }

  useEffect(() => {
    if (!wallet || !selectedChain) return;
    setGas(0);
    setTokens(null);
    setBalance(0);
    getAccountTokens();
  }, []);

  useEffect(() => {
    if (!wallet) return;
    setGas(0);
    setTokens(null);
    setBalance(0);
    getAccountTokens();
  }, [selectedChain, wallet]);

  return (
    <>
      <div className="content">
        <div className="logoutButton" onClick={logout}>
          <LogoutOutlined />
        </div>
        <div className="walletName">Wallet</div>
        <Tooltip title={wallet}>
          <div>
            {wallet.slice(0, 4)}...{wallet.slice(38)}
          </div>
        </Tooltip>
        <Divider />
        {fetching ? (
          <Spin />
        ) : (
          <Tabs defaultActiveKey="1" items={items} className="walletView" />
        )}
      </div>
    </>
  );
}

export default WalletView;
